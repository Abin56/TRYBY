import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, ReturnStatus, PaymentStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days  = parseInt(searchParams.get("days") ?? "30");
  const since = new Date(Date.now() - days * 86_400_000);

  const [
    // Status counts (all time)
    statusCounts,
    // Total refund amounts
    totalRefunded, pendingRefundAmount,
    // Period counts
    periodReturns,
    // Period orders (for return rate)
    periodOrders,
    // Return reasons breakdown
    reasonBreakdown,
    // Most returned products
    topReturnedProducts,
    // Return rate by category
    categoryReturns, categoryOrders,
    // Daily trend
    allReturns,
    // Supplier impact
    supplierImpact,
  ] = await Promise.all([
    // All-time status counts
    prisma.returnRequest.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    // Total refunded amount
    prisma.returnRequest.aggregate({
      _sum: { refundAmount: true },
      where: { status: ReturnStatus.REFUNDED },
    }),

    // Pending refund amount (approved/received but not yet refunded)
    prisma.returnRequest.aggregate({
      _sum: { refundAmount: true },
      where: { status: { in: [ReturnStatus.APPROVED, ReturnStatus.RECEIVED, ReturnStatus.PICKUP_SCHEDULED] } },
    }),

    // Returns in period
    prisma.returnRequest.count({ where: { createdAt: { gte: since } } }),

    // Orders in period (for return rate)
    prisma.order.count({ where: { createdAt: { gte: since }, payment: { status: PaymentStatus.CAPTURED } } }),

    // Return reasons
    prisma.returnRequest.groupBy({
      by: ["reason"],
      _count: { id: true },
      _sum:   { refundAmount: true },
      orderBy: { _count: { id: "desc" } },
    }),

    // Most returned products (top 10)
    prisma.returnItem.groupBy({
      by: ["productId", "productName"],
      where: { returnRequest: { createdAt: { gte: since } } },
      _sum:   { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),

    // Returns by category (via product)
    prisma.returnItem.findMany({
      where: { returnRequest: { createdAt: { gte: since } } },
      include: { product: { select: { category: { select: { name: true } } } } },
    }),

    // Order items by category in period (for return rate)
    prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: since }, payment: { status: PaymentStatus.CAPTURED } } },
      select: { quantity: true, product: { select: { category: { select: { name: true } } } } },
    }),

    // Daily return trend
    prisma.returnRequest.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, refundAmount: true, status: true },
      orderBy: { createdAt: "asc" },
    }),

    // Supplier impact — refund deductions in period
    prisma.supplierLedger.groupBy({
      by: ["supplierId"],
      where: {
        type: { in: ["REFUND_DEDUCTION", "RETURN_DEDUCTION"] },
        createdAt: { gte: since },
      },
      _sum: { amount: true },
      _count: { id: true },
    }).then(async rows => {
      const supplierIds = rows.map(r => r.supplierId);
      const suppliers = await prisma.supplier.findMany({
        where: { id: { in: supplierIds } },
        select: { id: true, companyName: true },
      });
      const sMap = new Map(suppliers.map(s => [s.id, s.companyName]));
      return rows.map(r => ({
        supplierId:   r.supplierId,
        companyName:  sMap.get(r.supplierId) ?? "Unknown",
        deductions:   Math.abs(Number(r._sum.amount ?? 0)),
        returnCount:  r._count.id,
      })).sort((a, b) => b.deductions - a.deductions);
    }),
  ]);

  // Status map
  const statusMap: Record<string, number> = {};
  for (const row of statusCounts) { statusMap[row.status] = row._count.id; }

  // Return rate (period)
  const returnRate = periodOrders > 0 ? (periodReturns / periodOrders) * 100 : 0;

  // Category breakdown
  const catReturnMap = new Map<string, number>();
  for (const item of categoryReturns) {
    const cat = item.product.category.name;
    catReturnMap.set(cat, (catReturnMap.get(cat) ?? 0) + item.quantity);
  }
  const catOrderMap = new Map<string, number>();
  for (const item of categoryOrders) {
    const cat = item.product.category.name;
    catOrderMap.set(cat, (catOrderMap.get(cat) ?? 0) + item.quantity);
  }
  const categoryBreakdown = [...catReturnMap.entries()].map(([name, returns]) => ({
    name,
    returns,
    orders:     catOrderMap.get(name) ?? 0,
    returnRate: catOrderMap.get(name) ? Math.round((returns / catOrderMap.get(name)!) * 1000) / 10 : 0,
  })).sort((a, b) => b.returnRate - a.returnRate);

  // Daily trend buckets
  const buckets = new Map<string, { date: string; count: number; amount: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    buckets.set(d, { date: d, count: 0, amount: 0 });
  }
  for (const r of allReturns) {
    const k = new Date(r.createdAt).toISOString().slice(0, 10);
    const b = buckets.get(k);
    if (b) { b.count++; b.amount += Number(r.refundAmount); }
  }

  return NextResponse.json({
    overview: {
      byStatus: {
        REQUESTED:        statusMap[ReturnStatus.REQUESTED]        ?? 0,
        APPROVED:         statusMap[ReturnStatus.APPROVED]         ?? 0,
        PICKUP_SCHEDULED: statusMap[ReturnStatus.PICKUP_SCHEDULED] ?? 0,
        RECEIVED:         statusMap[ReturnStatus.RECEIVED]         ?? 0,
        REFUNDED:         statusMap[ReturnStatus.REFUNDED]         ?? 0,
        REJECTED:         statusMap[ReturnStatus.REJECTED]         ?? 0,
      },
      totalRefunded:       Math.round(Number(totalRefunded._sum.refundAmount ?? 0)),
      pendingRefundAmount: Math.round(Number(pendingRefundAmount._sum.refundAmount ?? 0)),
      periodReturns,
      periodOrders,
      returnRate:          Math.round(returnRate * 10) / 10,
    },
    reasons: reasonBreakdown.map(r => ({
      reason:       r.reason,
      count:        r._count.id,
      refundAmount: Math.round(Number(r._sum.refundAmount ?? 0)),
    })),
    topReturnedProducts: topReturnedProducts.map(p => ({
      productId:   p.productId,
      productName: p.productName,
      quantity:    p._sum.quantity ?? 0,
      incidents:   p._count.id,
    })),
    categoryBreakdown,
    supplierImpact,
    daily: [...buckets.values()].map(b => ({ ...b, amount: Math.round(b.amount) })),
    days,
    generatedAt: new Date().toISOString(),
  });
}
