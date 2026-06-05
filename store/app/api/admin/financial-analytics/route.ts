import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET() {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo  = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const [
    // GMV
    totalGMV,
    gmvLast30,
    gmvPrev30,

    // Settlements
    settlementSummary,
    holdingAmount,

    // Commission revenue
    commissionSummary,

    // Payouts
    payoutSummary,

    // Supplier counts
    supplierCount,

    // Top earners
    topEarnerLedger,

    // GST collected
    gstCollected,

    // Daily revenue last 30 days
    dailyLedger,
  ] = await Promise.all([

    // Total GMV (all-time approved orders)
    prisma.orderItem.aggregate({
      where:  { order: { status: { notIn: ["CANCELLED", "RETURNED", "REFUNDED"] } } },
      _sum:   { total: true },
    }),

    // GMV last 30 days
    prisma.orderItem.aggregate({
      where: {
        order: {
          status:    { notIn: ["CANCELLED", "RETURNED", "REFUNDED"] },
          createdAt: { gte: thirtyDaysAgo },
        },
      },
      _sum: { total: true },
    }),

    // GMV prev 30 days
    prisma.orderItem.aggregate({
      where: {
        order: {
          status:    { notIn: ["CANCELLED", "RETURNED", "REFUNDED"] },
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      },
      _sum: { total: true },
    }),

    // Settlements by status
    prisma.supplierSettlement.groupBy({
      by:   ["status"],
      _count: { id: true },
      _sum:   { grossAmount: true, commissionAmt: true, gstOnCommission: true, netAmount: true },
    }),

    // Total holding liability
    prisma.supplierSettlement.aggregate({
      where:  { status: { in: ["HOLDING", "AVAILABLE"] } },
      _sum:   { netAmount: true },
      _count: { id: true },
    }),

    // All-time commission + GST from ledger
    prisma.supplierLedger.aggregate({
      where:  { type: "ORDER_EARNING" },
      _sum:   { commissionAmt: true, gstOnCommission: true, grossAmount: true, netAmount: true },
      _count: { id: true },
    }),

    // Payouts summary
    prisma.payout.groupBy({
      by:   ["status"],
      _count: { id: true },
      _sum:   { amount: true },
    }),

    // Active supplier count
    prisma.supplier.count({ where: { status: "APPROVED" } }),

    // Top 10 suppliers by lifetime earnings
    prisma.supplier.findMany({
      where:   { status: "APPROVED" },
      select:  { id: true, companyName: true, tier: true, lifetimeEarnings: true, totalSales: true, commissionRate: true, user: { select: { name: true } } },
      orderBy: { lifetimeEarnings: "desc" },
      take:    10,
    }),

    // GST collected last 30 days
    prisma.supplierLedger.aggregate({
      where:  { type: "ORDER_EARNING", createdAt: { gte: thirtyDaysAgo } },
      _sum:   { gstOnCommission: true, commissionAmt: true },
    }),

    // Daily ledger credits for sparkline
    prisma.supplierLedger.findMany({
      where:   { createdAt: { gte: thirtyDaysAgo }, type: "ORDER_EARNING" },
      select:  { createdAt: true, commissionAmt: true, grossAmount: true },
    }),
  ]);

  // Build daily revenue sparkline
  const byDay: Record<string, { gmv: number; commission: number }> = {};
  for (const e of dailyLedger) {
    const day = e.createdAt.toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { gmv: 0, commission: 0 };
    byDay[day].gmv        += Number(e.grossAmount);
    byDay[day].commission += Number(e.commissionAmt);
  }
  const dailyData = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  const settlCounts = Object.fromEntries(
    settlementSummary.map(s => [s.status, {
      count:      s._count.id,
      gross:      Number(s._sum.grossAmount    ?? 0),
      commission: Number(s._sum.commissionAmt  ?? 0),
      gst:        Number(s._sum.gstOnCommission ?? 0),
      net:        Number(s._sum.netAmount       ?? 0),
    }])
  );

  const payoutCounts = Object.fromEntries(
    payoutSummary.map(p => [p.status, { count: p._count.id, amount: Number(p._sum.amount ?? 0) }])
  );

  const gmv30      = Number(gmvLast30._sum.total ?? 0);
  const gmvPrev    = Number(gmvPrev30._sum.total ?? 0);
  const gmvGrowth  = gmvPrev > 0 ? ((gmv30 - gmvPrev) / gmvPrev) * 100 : gmv30 > 0 ? 100 : 0;

  return NextResponse.json({
    gmv: {
      allTime:    Number(totalGMV._sum.total ?? 0),
      last30Days: gmv30,
      growthPct:  Math.round(gmvGrowth * 10) / 10,
    },
    commission: {
      allTime:        Number(commissionSummary._sum.commissionAmt   ?? 0),
      gstAllTime:     Number(commissionSummary._sum.gstOnCommission ?? 0),
      gross30Days:    Number(gstCollected._sum.commissionAmt        ?? 0),
      gst30Days:      Number(gstCollected._sum.gstOnCommission      ?? 0),
      totalOrders:    commissionSummary._count.id,
    },
    settlements: settlCounts,
    payouts:     payoutCounts,
    liability: {
      holdingCount:  holdingAmount._count.id,
      holdingAmount: Number(holdingAmount._sum.netAmount ?? 0),
    },
    supplierCount,
    topEarners: topEarnerLedger,
    dailyData,
  });
}
