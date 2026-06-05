import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "customers:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");
  const now = new Date();
  const start = new Date(now.getTime() - days * 86400_000);
  const prevStart = new Date(now.getTime() - days * 2 * 86400_000);

  const [
    // Revenue over time
    revenueByDay,
    // New customers by day
    newCustomersByDay,
    // Repeat purchase rate
    repeatPurchasers,
    allPurchasers,
    // Churn: customers who purchased in prev period but not current
    prevPeriodBuyers,
    currentPeriodBuyers,
    // LTV distribution
    ltvBuckets,
    // Top customers by spend
    topBySpend,
    // Segment breakdown
    allSegments,
    // Avg order value trend
    aovByDay,
  ] = await Promise.all([
    prisma.order.groupBy({
      by: ["createdAt"],
      where: { status: { in: ["DELIVERED", "SHIPPED"] }, createdAt: { gte: start } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["createdAt"],
      where: { role: "CUSTOMER", createdAt: { gte: start } },
      _count: true,
    }),
    // Customers with 2+ orders in current period
    prisma.order.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: start } },
      having: { userId: { _count: { gte: 2 } } },
      _count: true,
    }),
    // All customers who ordered in current period
    prisma.order.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: start } },
      _count: true,
    }),
    prisma.order.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: prevStart, lt: start } },
      _count: true,
    }),
    prisma.order.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: start } },
      _count: true,
    }),
    // LTV distribution
    prisma.crmProfile.findMany({
      select: { ltv: true },
      where: { ltv: { gt: 0 } },
    }),
    prisma.crmProfile.findMany({
      orderBy: { ltv: "desc" },
      take: 20,
      select: { userId: true, ltv: true, orderCount: true, segments: true },
    }),
    prisma.crmProfile.findMany({ select: { segments: true } }),
    prisma.order.groupBy({
      by: ["createdAt"],
      where: { status: { in: ["DELIVERED", "SHIPPED"] }, createdAt: { gte: start } },
      _avg: { total: true },
      _count: { _all: true },
    }),
  ]);

  // Compute repeat purchase rate
  const repeatRate = allPurchasers.length > 0
    ? (repeatPurchasers.length / allPurchasers.length) * 100
    : 0;

  // Churn rate: prev buyers who didn't buy in current period
  const currentBuyerSet = new Set(currentPeriodBuyers.map((b) => b.userId));
  const churnedCount = prevPeriodBuyers.filter((b) => !currentBuyerSet.has(b.userId)).length;
  const churnRate = prevPeriodBuyers.length > 0
    ? (churnedCount / prevPeriodBuyers.length) * 100
    : 0;

  // LTV buckets
  const buckets = { "0-999": 0, "1k-4.9k": 0, "5k-14.9k": 0, "15k-49.9k": 0, "50k+": 0 };
  for (const p of ltvBuckets) {
    const v = Number(p.ltv);
    if (v < 1000) buckets["0-999"]++;
    else if (v < 5000) buckets["1k-4.9k"]++;
    else if (v < 15000) buckets["5k-14.9k"]++;
    else if (v < 50000) buckets["15k-49.9k"]++;
    else buckets["50k+"]++;
  }

  // Segment counts
  const segCounts: Record<string, number> = {};
  for (const p of allSegments) {
    for (const seg of p.segments) {
      segCounts[seg] = (segCounts[seg] ?? 0) + 1;
    }
  }

  // Enrich top customers
  const topUserIds = topBySpend.map((t) => t.userId);
  const topUsers = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, name: true, email: true },
  });
  const topUserMap = Object.fromEntries(topUsers.map((u) => [u.id, u]));
  const enrichedTop = topBySpend.map((t) => ({ ...t, user: topUserMap[t.userId] ?? null }));

  return NextResponse.json({
    period: { days, start: start.toISOString(), end: now.toISOString() },
    kpis: {
      repeatRate: parseFloat(repeatRate.toFixed(1)),
      churnRate: parseFloat(churnRate.toFixed(1)),
      newCustomers: newCustomersByDay.length,
      activeBuyers: allPurchasers.length,
    },
    revenueByDay,
    newCustomersByDay,
    aovByDay,
    ltvBuckets: buckets,
    segmentBreakdown: segCounts,
    topCustomers: enrichedTop,
  });
}
