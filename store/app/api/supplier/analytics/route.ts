import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "30";
  const days  = parseInt(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const prevSince = new Date(Date.now() - 2 * days * 24 * 60 * 60 * 1000);

  const commissionRate = Number(supplier.commissionRate);

  // Revenue in current range
  const [revenueData, prevRevenueData] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        product: { supplierId: supplier.id },
        order: {
          createdAt: { gte: since },
          status: { notIn: ["CANCELLED", "RETURNED", "REFUNDED"] },
        },
      },
      select: { total: true, quantity: true, order: { select: { createdAt: true } } },
    }),
    // Previous period for MoM comparison
    prisma.orderItem.findMany({
      where: {
        product: { supplierId: supplier.id },
        order: {
          createdAt: { gte: prevSince, lt: since },
          status: { notIn: ["CANCELLED", "RETURNED", "REFUNDED"] },
        },
      },
      select: { total: true, quantity: true },
    }),
  ]);

  // Aggregate by day
  const byDay: Record<string, { revenue: number; orders: number }> = {};
  let periodGross = 0;
  for (const item of revenueData) {
    const day = item.order.createdAt.toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { revenue: 0, orders: 0 };
    const earning = Number(item.total) * (1 - commissionRate);
    byDay[day].revenue += earning;
    byDay[day].orders  += 1;
    periodGross        += Number(item.total);
  }

  const prevGross = prevRevenueData.reduce((s, i) => s + Number(i.total), 0);
  const periodEarnings = periodGross * (1 - commissionRate);
  const prevEarnings   = prevGross   * (1 - commissionRate);

  const growthPct = prevEarnings > 0
    ? ((periodEarnings - prevEarnings) / prevEarnings) * 100
    : periodEarnings > 0 ? 100 : 0;

  const chartData = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, ...d }));

  // All-time totals
  const allTimeItems = await prisma.orderItem.aggregate({
    where: {
      product: { supplierId: supplier.id },
      order:   { status: { notIn: ["CANCELLED", "RETURNED", "REFUNDED"] } },
    },
    _sum:   { total: true, quantity: true },
    _count: { id: true },
  });

  const grossRevenue     = Number(allTimeItems._sum.total    ?? 0);
  const supplierEarnings = grossRevenue * (1 - commissionRate);
  const platformFees     = grossRevenue * commissionRate;

  // Top products
  const topProductRows = await prisma.orderItem.groupBy({
    by:      ["productId"],
    where: {
      product: { supplierId: supplier.id },
      order:   { status: { notIn: ["CANCELLED", "RETURNED", "REFUNDED"] } },
    },
    _sum:    { total: true, quantity: true },
    orderBy: { _sum: { total: "desc" } },
    take:    5,
  });

  const topProducts = await Promise.all(
    topProductRows.map(async row => {
      const product = await prisma.product.findUnique({
        where:  { id: row.productId },
        select: { name: true, slug: true, avgRating: true, images: { where: { isPrimary: true }, take: 1 } },
      });
      return {
        productId:    row.productId,
        name:         product?.name    ?? "Unknown",
        slug:         product?.slug    ?? "",
        imageUrl:     product?.images[0]?.url ?? null,
        avgRating:    Number(product?.avgRating ?? 0),
        totalRevenue: Number(row._sum.total    ?? 0),
        unitsSold:    row._sum.quantity ?? 0,
      };
    })
  );

  // Payout history
  const payouts = await prisma.payout.findMany({
    where:   { supplierId: supplier.id },
    orderBy: { createdAt: "desc" },
    take:    6,
    select:  { id: true, amount: true, status: true, createdAt: true, processedAt: true },
  });

  // Performance score (live compute)
  const fulfillmentRate = Number(supplier.fulfillmentRate);
  const returnRate      = Number(supplier.returnRate);
  const avgRating       = Number(supplier.avgRating);
  const performanceScore = Math.min(100, Math.max(0, Math.round(
    fulfillmentRate * 40 + (1 - returnRate) * 30 + (avgRating / 5) * 30
  )));

  return NextResponse.json({
    commissionRate,
    performanceScore,
    fulfillmentRate,
    returnRate,
    supplierAvgRating: avgRating,
    period: {
      earnings: periodEarnings,
      grossRevenue: periodGross,
      growthPct: Math.round(growthPct * 10) / 10,
      orders: revenueData.length,
    },
    allTime: {
      grossRevenue,
      supplierEarnings,
      platformFees,
      totalOrders:    allTimeItems._count.id,
      totalUnitsSold: Number(allTimeItems._sum.quantity ?? 0),
      pendingPayout:  Number(supplier.pendingPayout),
    },
    chartData,
    topProducts,
    recentPayouts: payouts,
  });
}
