import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, OrderStatus, PaymentStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");

  const now          = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrev  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrev    = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const since        = new Date(now.getTime() - days * 86400_000);

  const [
    totalOrders, monthOrders, prevOrders,
    totalCustomers, newCustomers,
    pendingOrders,
    totalRevenue, monthRevenue, prevRevenue,
    lowStockCount,
    recentOrders,
    // Daily time-series: orders in period
    periodOrders,
    // Top products
    topProducts,
    // Coupon usage
    coupons,
    // Low stock variants
    lowStockVariants,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfPrev, lte: endOfPrev } } }),
    prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
    prisma.user.count({ where: { role: UserRole.CUSTOMER, createdAt: { gte: startOfMonth } } }),
    prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: PaymentStatus.CAPTURED } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: PaymentStatus.CAPTURED, createdAt: { gte: startOfMonth } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: PaymentStatus.CAPTURED, createdAt: { gte: startOfPrev, lte: endOfPrev } } }),
    prisma.productVariant.count({ where: { stock: { lte: 5, gt: 0 }, isActive: true } }),
    prisma.order.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } }, payment: { select: { status: true } } },
    }),
    // All captured payments in period for daily bucketing
    prisma.payment.findMany({
      where: { status: PaymentStatus.CAPTURED, createdAt: { gte: since } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    // Top products by units sold in period
    prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      where: { order: { createdAt: { gte: since }, payment: { status: PaymentStatus.CAPTURED } } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    // Coupon usage
    prisma.coupon.findMany({
      where: { usageCount: { gt: 0 } },
      orderBy: { usageCount: "desc" },
      take: 10,
      select: { id: true, code: true, type: true, value: true, usageCount: true, usageLimit: true, isActive: true },
    }),
    // Low stock variants with product name
    prisma.productVariant.findMany({
      where: { stock: { lte: 10 }, isActive: true },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { stock: "asc" },
      take: 15,
    }),
  ]);

  // Build daily buckets
  const buckets = new Map<string, { date: string; revenue: number; orders: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400_000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { date: key, revenue: 0, orders: 0 });
  }
  for (const p of periodOrders) {
    const key = p.createdAt.toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (b) { b.revenue += Number(p.amount); b.orders += 1; }
  }

  // Revenue/profit growth
  const thisRev = Number(monthRevenue._sum.amount ?? 0);
  const prevRev = Number(prevRevenue._sum.amount ?? 0);
  const revenueGrowth = prevRev === 0 ? 100 : ((thisRev - prevRev) / prevRev) * 100;
  const orderGrowth   = prevOrders === 0 ? 100 : ((monthOrders - prevOrders) / prevOrders) * 100;

  // Average order value for period
  const periodRevTotal = [...buckets.values()].reduce((s, b) => s + b.revenue, 0);
  const periodOrderCount = [...buckets.values()].reduce((s, b) => s + b.orders, 0);
  const avgOrderValue = periodOrderCount > 0 ? periodRevTotal / periodOrderCount : 0;

  return NextResponse.json({
    kpis: {
      revenue:      { total: Number(totalRevenue._sum.amount ?? 0), thisMonth: thisRev, prevMonth: prevRev, growth: Math.round(revenueGrowth * 10) / 10 },
      orders:       { total: totalOrders, thisMonth: monthOrders, prevMonth: prevOrders, pending: pendingOrders, growth: Math.round(orderGrowth * 10) / 10 },
      customers:    { total: totalCustomers, newThisMonth: newCustomers },
      inventory:    { lowStock: lowStockCount },
      avgOrderValue: Math.round(avgOrderValue),
    },
    daily:       [...buckets.values()],
    recentOrders,
    topProducts:  topProducts.map(p => ({
      productId:   p.productId,
      productName: p.productName,
      unitsSold:   p._sum.quantity ?? 0,
      revenue:     Number(p._sum.total ?? 0),
    })),
    coupons,
    lowStockVariants: lowStockVariants.map(v => ({
      id:          v.id,
      sku:         v.sku,
      size:        v.size,
      color:       v.color,
      stock:       v.stock,
      productName: v.product.name,
      productSlug: v.product.slug,
    })),
    days,
  });
}
