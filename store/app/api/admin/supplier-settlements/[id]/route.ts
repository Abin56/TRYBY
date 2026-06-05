import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, DisputeStatus, LedgerEntryType, SettlementStatus } from "@prisma/client";
import { createLedgerEntry, roundINR } from "@/lib/finance";
import { z } from "zod";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const settlement = await prisma.supplierSettlement.findUnique({
    where:   { id },
    include: {
      supplier: { include: { user: { select: { name: true, email: true } } } },
      disputes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!settlement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Ledger entries for this settlement
  const ledgerEntries = await prisma.supplierLedger.findMany({
    where:   { settlementId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ settlement, ledgerEntries });
}

const disputeActionSchema = z.object({
  disputeId:     z.string(),
  action:        z.enum(["approve", "reject", "partial"]),
  adminNote:     z.string().optional(),
  adjustmentAmt: z.number().optional(), // for partial
});

const manualAdjSchema = z.object({
  action:    z.enum(["manual_credit", "manual_debit"]),
  amount:    z.number().positive(),
  adminNote: z.string().min(5),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;

  const settlement = await prisma.supplierSettlement.findUnique({
    where:   { id },
    include: { supplier: { include: { user: { select: { id: true } } } }, disputes: true },
  });
  if (!settlement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ── Dispute resolution ───────────────────────────────────────────────────
  if (body.disputeId) {
    const parsed = disputeActionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { disputeId, action, adminNote, adjustmentAmt } = parsed.data;
    const now = new Date();

    const dispute = await prisma.settlementDispute.findFirst({
      where: { id: disputeId, settlementId: id },
    });
    if (!dispute) return NextResponse.json({ error: "Dispute not found" }, { status: 404 });

    let newDisputeStatus: DisputeStatus;
    if (action === "approve") {
      newDisputeStatus = DisputeStatus.RESOLVED_FOR_SUPPLIER;
      // Credit supplier the net settlement amount
      await createLedgerEntry({
        supplierId:   settlement.supplierId,
        type:         LedgerEntryType.DISPUTE_CREDIT,
        amount:       Number(settlement.netAmount),
        description:  `Dispute resolved in your favour — order ${settlement.orderNumber}`,
        settlementId: id,
        adminNote,
        createdBy:    session.user.id,
      });
      await prisma.supplierSettlement.update({
        where: { id },
        data:  { status: SettlementStatus.AVAILABLE },
      });
    } else if (action === "reject") {
      newDisputeStatus = DisputeStatus.RESOLVED_FOR_PLATFORM;
      // No credit — platform keeps the amount
      await createLedgerEntry({
        supplierId:   settlement.supplierId,
        type:         LedgerEntryType.DISPUTE_DEBIT,
        amount:       -Number(settlement.netAmount),
        description:  `Dispute resolved against supplier — order ${settlement.orderNumber}`,
        settlementId: id,
        adminNote,
        createdBy:    session.user.id,
      });
    } else if (action === "partial" && adjustmentAmt) {
      newDisputeStatus = DisputeStatus.PARTIAL_ADJUSTMENT;
      await createLedgerEntry({
        supplierId:   settlement.supplierId,
        type:         LedgerEntryType.DISPUTE_CREDIT,
        amount:       roundINR(adjustmentAmt),
        description:  `Partial dispute adjustment — order ${settlement.orderNumber}`,
        settlementId: id,
        adminNote,
        createdBy:    session.user.id,
      });
    } else {
      return NextResponse.json({ error: "Invalid action params" }, { status: 400 });
    }

    const updated = await prisma.settlementDispute.update({
      where: { id: disputeId },
      data: {
        status:        newDisputeStatus,
        adminNote,
        adjustmentAmt: adjustmentAmt ? roundINR(adjustmentAmt) : null,
        resolvedAt:    now,
        resolvedBy:    session.user.id,
      },
    });

    // Notify supplier
    await prisma.notification.create({
      data: {
        userId:     settlement.supplier.user.id,
        supplierId: settlement.supplierId,
        type:       `DISPUTE_${action.toUpperCase()}`,
        title:      action === "approve" ? "Dispute Resolved in Your Favour" : action === "partial" ? "Dispute — Partial Adjustment" : "Dispute Closed",
        body:       adminNote ?? `Your settlement dispute for order ${settlement.orderNumber} has been reviewed.`,
        data:       { settlementId: id, disputeId },
      },
    });

    return NextResponse.json(updated);
  }

  // ── Manual adjustment ────────────────────────────────────────────────────
  if (body.action === "manual_credit" || body.action === "manual_debit") {
    const parsed = manualAdjSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { action, amount, adminNote } = parsed.data;
    const isCredit = action === "manual_credit";

    const entry = await createLedgerEntry({
      supplierId:   settlement.supplierId,
      type:         isCredit ? LedgerEntryType.MANUAL_CREDIT : LedgerEntryType.MANUAL_DEBIT,
      amount:       isCredit ? amount : -amount,
      description:  `Admin ${isCredit ? "credit" : "debit"} — ${adminNote}`,
      settlementId: id,
      adminNote,
      createdBy:    session.user.id,
    });

    return NextResponse.json(entry);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
