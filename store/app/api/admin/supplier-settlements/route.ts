import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, SettlementStatus } from "@prisma/client";
import { releaseMaturedSettlements } from "@/lib/finance";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page     = parseInt(searchParams.get("page") ?? "1");
  const limit    = 20;
  const status   = searchParams.get("status") as SettlementStatus | null;
  const q        = searchParams.get("q") ?? "";
  const disputed = searchParams.get("disputed") === "true";

  const where: Record<string, unknown> = {};
  if (status)   where.status = status;
  if (disputed) where.disputes = { some: { status: { in: ["OPEN", "UNDER_REVIEW"] } } };
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { supplier: { companyName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [settlements, total, statusCounts, financeSummary] = await Promise.all([
    prisma.supplierSettlement.findMany({
      where,
      include: {
        supplier: { select: { id: true, companyName: true, tier: true, user: { select: { name: true, email: true } } } },
        disputes: { where: { status: { in: ["OPEN", "UNDER_REVIEW"] } }, select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.supplierSettlement.count({ where }),
    prisma.supplierSettlement.groupBy({
      by:    ["status"],
      _count: { id: true },
      _sum:  { netAmount: true },
    }),
    // Overall financial snapshot
    prisma.supplierSettlement.aggregate({
      where:   { status: { in: [SettlementStatus.HOLDING, SettlementStatus.AVAILABLE] } },
      _sum:    { grossAmount: true, commissionAmt: true, gstOnCommission: true, netAmount: true },
      _count:  { id: true },
    }),
  ]);

  const counts = Object.fromEntries(
    statusCounts.map(s => [s.status, { count: s._count.id, amount: Number(s._sum.netAmount ?? 0) }])
  );

  return NextResponse.json({
    settlements,
    total,
    pages: Math.ceil(total / limit),
    counts,
    pendingLiability: {
      gross:      Number(financeSummary._sum.grossAmount    ?? 0),
      commission: Number(financeSummary._sum.commissionAmt  ?? 0),
      gst:        Number(financeSummary._sum.gstOnCommission ?? 0),
      net:        Number(financeSummary._sum.netAmount       ?? 0),
      count:      financeSummary._count.id,
    },
  });
}

// Bulk release or manual operations
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action, ids } = await req.json() as { action: string; ids?: string[] };

  if (action === "release-matured") {
    // Release all settlements whose holdUntil has passed
    const released = await releaseMaturedSettlements();
    return NextResponse.json({ ok: true, released });
  }

  if (action === "release" && ids?.length) {
    // Admin force-release specific settlements (override hold)
    let released = 0;
    for (const id of ids) {
      const settlement = await prisma.supplierSettlement.findUnique({
        where: { id },
        select: { id: true, supplierId: true, orderId: true, orderNumber: true, netAmount: true, status: true },
      });
      if (!settlement || settlement.status !== SettlementStatus.HOLDING) continue;

      const { createLedgerEntry } = await import("@/lib/finance");
      const { LedgerEntryType } = await import("@prisma/client");

      await prisma.supplierSettlement.update({
        where: { id },
        data:  { status: SettlementStatus.AVAILABLE, releasedAt: new Date(), releasedBy: session.user.id },
      });
      await createLedgerEntry({
        supplierId:   settlement.supplierId,
        type:         LedgerEntryType.HOLDING_CREDIT,
        amount:       Number(settlement.netAmount),
        description:  `Admin early release — order ${settlement.orderNumber}`,
        orderId:      settlement.orderId,
        orderNumber:  settlement.orderNumber,
        settlementId: settlement.id,
        createdBy:    session.user.id,
      });
      released++;
    }
    return NextResponse.json({ ok: true, released });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
