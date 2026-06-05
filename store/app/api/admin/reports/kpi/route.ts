// Business KPI Dashboard — single executive view
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, PaymentStatus, OrderStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET() {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now            = new Date();
  const monthStart     = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const todayStart     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo  = new Date(now.getTime() - 30 * 86_400_000);

  const cap = { status: PaymentStatus.CAPTURED };

  const [
    // Revenue
    totalRev, monthRev, lastMonthRev, todayRev,
    // Orders
    totalOrders, monthOrders, lastMonthOrders, pendingOrders, cancelledOrders,
    // Customers
    totalCustomers, newThisMonth,
    returningCustomers,
    // Products & inventory
    activeProducts, lowStockVariants, oosVariants,
    // Returns & refunds
    totalReturns, refundedPayments,
    // Top products
    topProducts,
    // Top suppliers
    topSuppliers,
    // Payment methods
    paymentBreakdown,
    // Daily trend (30 days)
    dailyPayments,
  ] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, where: cap }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...cap, createdAt: { gte: monthStart } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...cap, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...cap, createdAt: { gte: todayStart } } }),

    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.order.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    prisma.order.count({ where: { createdAt: { gte: monthStart }, status: OrderStatus.CANCELLED } }),

    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: monthStart } } }),
    prisma.order.groupBy({ by: ["userId"], _count: { id: true }, having: { id: { _count: { gte: 2 } } } }).then(r => r.length),

    prisma.product.count({ where: { isActive: true } }),
    prisma.productVariant.count({ where: { isActive: true, stock: { gt: 0, lte: 5 } } }),
    prisma.productVariant.count({ where: { isActive: true, stock: 0 } }),

    prisma.returnRequest.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.payment.aggregate({ _sum: { refundedAmount: true }, where: { refundedAmount: { gt: 0 }, createdAt: { gte: monthStart } } }),

    prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      where: { order: { createdAt: { gte: thirtyDaysAgo }, payment: cap } },
      _sum: { total: true, quantity: true },
      orderBy: { _sum: { total: "desc" } },
      take: 8,
    }),

    prisma.supplier.findMany({
      where: { status: "APPROVED" },
      select: { id: true, companyName: true, logoUrl: true, tier: true, totalSales: true, performanceScore: true },
      orderBy: { totalSales: "desc" },
      take: 5,
    }),

    prisma.payment.groupBy({
      by: ["method"],
      where: { ...cap, createdAt: { gte: monthStart } },
      _sum: { amount: true },
      _count: { id: true },
    }),

    prisma.payment.findMany({
      where: { ...cap, createdAt: { gte: thirtyDaysAgo } },
      select: { amount: true, createdAt: true },
    }),
  ]);

  const monthRevN     = Number(monthRev._sum.amount ?? 0);
  const lastMonthRevN = Number(lastMonthRev._sum.amount ?? 0);
  const revenueGrowth = lastMonthRevN === 0 ? 100 : ((monthRevN - lastMonthRevN) / lastMonthRevN) * 100;
  const orderGrowth   = lastMonthOrders === 0 ? 100 : ((monthOrders - lastMonthOrders) / lastMonthOrders) * 100;
  const aov           = monthOrders > 0 ? monthRevN / monthOrders : 0;
  const refundRate    = monthOrders > 0 ? (totalReturns / monthOrders) * 100 : 0;
  const cancelRate    = monthOrders > 0 ? (cancelledOrders / monthOrders) * 100 : 0;
  const repeatRate    = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

  // Daily buckets (30 days)
  const buckets = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    buckets.set(new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10), 0);
  }
  for (const p of dailyPayments) {
    const k = new Date(p.createdAt).toISOString().slice(0, 10);
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + Number(p.amount));
  }

  return NextResponse.json({
    revenue: {
      total:      Math.round(Number(totalRev._sum.amount ?? 0)),
      today:      Math.round(Number(todayRev._sum.amount ?? 0)),
      month:      Math.round(monthRevN),
      lastMonth:  Math.round(lastMonthRevN),
      growth:     Math.round(revenueGrowth * 10) / 10,
    },
    orders: {
      total:    totalOrders,
      month:    monthOrders,
      lastMonth: lastMonthOrders,
      pending:  pendingOrders,
      cancelled: cancelledOrders,
      growth:   Math.round(orderGrowth * 10) / 10,
      cancelRate: Math.round(cancelRate * 10) / 10,
    },
    customers: {
      total:        totalCustomers,
      newThisMonth: newThisMonth,
      returning:    returningCustomers,
      repeatRate:   Math.round(repeatRate * 10) / 10,
    },
    aov:         Math.round(aov),
    refundRate:  Math.round(refundRate * 10) / 10,
    inventory: {
      activeProducts,
      lowStock:    lowStockVariants,
      outOfStock:  oosVariants,
    },
    topProducts: topProducts.map(p => ({
      productId:   p.productId,
      productName: p.productName,
      revenue:     Math.round(Number(p._sum.total ?? 0)),
      qty:         p._sum.quantity ?? 0,
    })),
    topSuppliers: topSuppliers.map(s => ({
      id:               s.id,
      companyName:      s.companyName,
      logoUrl:          s.logoUrl,
      tier:             s.tier,
      totalSales:       Math.round(Number(s.totalSales)),
      performanceScore: Math.round(Number(s.performanceScore)),
    })),
    paymentBreakdown: paymentBreakdown.map(p => ({
      method:  p.method,
      revenue: Math.round(Number(p._sum.amount ?? 0)),
      count:   p._count.id,
    })).sort((a, b) => b.revenue - a.revenue),
    daily: [...buckets.entries()].map(([date, revenue]) => ({ date, revenue: Math.round(revenue) })),
    generatedAt: now.toISOString(),
  });
}
