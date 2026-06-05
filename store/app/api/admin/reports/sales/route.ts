import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, PaymentStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

function startOf(d: Date, unit: "day" | "week" | "month") {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  if (unit === "week") r.setDate(r.getDate() - r.getDay() + (r.getDay() === 0 ? -6 : 1));
  if (unit === "month") r.setDate(1);
  return r;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now       = new Date();
  const todayStart     = startOf(now, "day");
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const yesterdayEnd   = new Date(todayStart.getTime() - 1);
  const weekStart      = startOf(now, "week");
  const monthStart     = startOf(now, "month");
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const cap = { status: PaymentStatus.CAPTURED };

  const [
    todayRev, yestRev, weekRev, monthRev, lastMonthRev,
    todayOrders, yestOrders, weekOrders, monthOrders,
    totalCustomers, newCustomersMonth,
    returningCustomers,
    // Payment method breakdown
    paymentMethods,
    // Top products this month
    topProducts,
    // Top categories this month
    topCategories,
    // Hourly distribution today
    todayHourly,
  ] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...cap, createdAt: { gte: todayStart } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...cap, createdAt: { gte: yesterdayStart, lte: yesterdayEnd } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...cap, createdAt: { gte: weekStart } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...cap, createdAt: { gte: monthStart } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...cap, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),

    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } } }),
    prisma.order.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.order.count({ where: { createdAt: { gte: monthStart } } }),

    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: monthStart } } }),

    // Customers with 2+ orders
    prisma.order.groupBy({
      by: ["userId"],
      _count: { id: true },
      having: { id: { _count: { gt: 1 } } },
    }).then(r => r.length),

    // Payment method breakdown this month
    prisma.payment.groupBy({
      by: ["method"],
      where: { ...cap, createdAt: { gte: monthStart } },
      _sum:   { amount: true },
      _count: { id: true },
    }),

    // Top 10 products this month by revenue
    prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      where: { order: { createdAt: { gte: monthStart }, payment: cap } },
      _sum:   { total: true, quantity: true },
      _count: { id: true },
      orderBy: { _sum: { total: "desc" } },
      take: 10,
    }),

    // Top categories this month
    prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: monthStart }, payment: cap } },
      include: { product: { select: { category: { select: { name: true } } } } },
    }).then(items => {
      const catMap = new Map<string, { revenue: number; qty: number }>();
      for (const item of items) {
        const cat = item.product.category.name;
        const existing = catMap.get(cat) ?? { revenue: 0, qty: 0 };
        catMap.set(cat, { revenue: existing.revenue + Number(item.total), qty: existing.qty + item.quantity });
      }
      return [...catMap.entries()]
        .map(([name, data]) => ({ name, revenue: Math.round(data.revenue), qty: data.qty }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);
    }),

    // Today hourly distribution
    prisma.order.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { createdAt: true, total: true },
    }).then(orders => {
      const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: 0, revenue: 0 }));
      for (const o of orders) {
        const h = new Date(o.createdAt).getHours();
        buckets[h].orders++;
        buckets[h].revenue += Number(o.total);
      }
      return buckets;
    }),
  ]);

  const todayRevN      = Number(todayRev._sum.amount ?? 0);
  const yestRevN       = Number(yestRev._sum.amount ?? 0);
  const weekRevN       = Number(weekRev._sum.amount ?? 0);
  const monthRevN      = Number(monthRev._sum.amount ?? 0);
  const lastMonthRevN  = Number(lastMonthRev._sum.amount ?? 0);

  const monthGrowth = lastMonthRevN === 0 ? 100
    : ((monthRevN - lastMonthRevN) / lastMonthRevN) * 100;

  const aov = monthOrders > 0 ? monthRevN / monthOrders : 0;

  return NextResponse.json({
    revenue: {
      today:      Math.round(todayRevN),
      yesterday:  Math.round(yestRevN),
      week:       Math.round(weekRevN),
      month:      Math.round(monthRevN),
      lastMonth:  Math.round(lastMonthRevN),
      monthGrowth: Math.round(monthGrowth * 10) / 10,
    },
    orders: {
      today:     todayOrders,
      yesterday: yestOrders,
      week:      weekOrders,
      month:     monthOrders,
    },
    customers: {
      total:        totalCustomers,
      newThisMonth: newCustomersMonth,
      returning:    returningCustomers,
    },
    aov:          Math.round(aov),
    paymentMethods: paymentMethods.map(p => ({
      method:  p.method,
      revenue: Math.round(Number(p._sum.amount ?? 0)),
      count:   p._count.id,
    })).sort((a, b) => b.revenue - a.revenue),
    topProducts: topProducts.map(p => ({
      productId:   p.productId,
      productName: p.productName,
      revenue:     Math.round(Number(p._sum.total ?? 0)),
      qty:         p._sum.quantity ?? 0,
      orders:      p._count.id,
    })),
    topCategories,
    todayHourly,
    generatedAt: now.toISOString(),
  });
}
