import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, PayoutStatus, Prisma } from "@prisma/client";
import { z } from "zod";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const approveSchema = z.object({
  action:      z.enum(["approve", "reject", "process"]),
  utrNumber:   z.string().optional(),
  rejectReason: z.string().optional(),
  notes:       z.string().optional(),
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
  const body = approveSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const payout = await prisma.payout.findUnique({
    where: { id },
    include: {
      supplier: { include: { user: { select: { id: true, name: true } } } },
    },
  });
  if (!payout) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { action, utrNumber, rejectReason, notes } = body.data;
  const now = new Date();

  if (action === "approve") {
    if (payout.status !== PayoutStatus.PENDING) {
      return NextResponse.json({ error: "Can only approve PENDING payouts" }, { status: 400 });
    }
    const updated = await prisma.payout.update({
      where: { id },
      data: {
        status:     PayoutStatus.APPROVED,
        approvedAt: now,
        approvedBy: session.user.id,
        notes,
      },
    });
    // Notify supplier
    await createSupplierNotification(
      payout.supplier.user.id,
      payout.supplierId,
      "PAYOUT_APPROVED",
      "Payout Approved",
      `Your payout of ₹${Number(payout.amount).toLocaleString("en-IN")} has been approved and is being processed.`,
      { payoutId: id }
    );
    return NextResponse.json(updated);
  }

  if (action === "process") {
    if (payout.status !== PayoutStatus.APPROVED) {
      return NextResponse.json({ error: "Can only process APPROVED payouts" }, { status: 400 });
    }
    if (!utrNumber) return NextResponse.json({ error: "UTR number required" }, { status: 400 });

    const [updated] = await prisma.$transaction([
      prisma.payout.update({
        where: { id },
        data: {
          status:      PayoutStatus.PROCESSED,
          utrNumber,
          processedAt: now,
          notes,
          bankSnapshot: {
            bankAccountNo:  payout.supplier.bankAccountNo,
            bankIfsc:       payout.supplier.bankIfsc,
            bankAccountName: payout.supplier.bankAccountName,
          },
        },
      }),
      // Zero out pendingPayout
      prisma.supplier.update({
        where: { id: payout.supplierId },
        data: {
          pendingPayout: 0,
          lastPayoutAt: now,
        },
      }),
    ]);
    await createSupplierNotification(
      payout.supplier.user.id,
      payout.supplierId,
      "PAYOUT_PROCESSED",
      "Payout Processed",
      `Your payout of ₹${Number(payout.amount).toLocaleString("en-IN")} has been transferred. UTR: ${utrNumber}`,
      { payoutId: id, utrNumber }
    );
    return NextResponse.json(updated);
  }

  if (action === "reject") {
    if (!["PENDING", "APPROVED"].includes(payout.status)) {
      return NextResponse.json({ error: "Cannot reject this payout" }, { status: 400 });
    }
    const updated = await prisma.payout.update({
      where: { id },
      data: {
        status:       PayoutStatus.REJECTED,
        rejectedAt:   now,
        rejectedBy:   session.user.id,
        rejectReason: rejectReason ?? "Rejected by admin",
        notes,
      },
    });
    await createSupplierNotification(
      payout.supplier.user.id,
      payout.supplierId,
      "PAYOUT_REJECTED",
      "Payout Request Rejected",
      `Your payout request of ₹${Number(payout.amount).toLocaleString("en-IN")} was rejected. ${rejectReason ? `Reason: ${rejectReason}` : "Contact support for details."}`,
      { payoutId: id }
    );
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

async function createSupplierNotification(
  userId: string,
  supplierId: string,
  type: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  await prisma.notification.create({
    data: { userId, supplierId, type, title, body, ...(data !== undefined && { data: data as Prisma.InputJsonValue }) },
  });
}
