import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, AdminRole, PaymentStatus, OrderStatus } from "@prisma/client";

const GATEWAY_FEE = 0.02;

function adminOnly(role?: string) {
  return role !== UserRole.ADMIN && role !== AdminRole.SUPER_ADMIN;
}

function n(v: unknown): number {
  return typeof v === "bigint" ? Number(v) : Number(v ?? 0);
}

function calcItems(items: Array<{
  total: unknown;
  quantity: number;
  variant: { costPrice: unknown } | null;
  product: { shippingCost: unknown; packagingCost: unknown } | null;
}>) {
  return items.reduce(
    (acc, item) => {
      const rev  = n(item.total);
      const cogs = n(item.variant?.costPrice) * item.quantity;
      const ship = n(item.product?.shippingCost) * item.quantity;
      const pack = n(item.product?.packagingCost) * item.quantity;
      const gw   = rev * GATEWAY_FEE;
      return {
        revenue:   acc.revenue   + rev,
        cogs:      acc.cogs      + cogs,
        shipping:  acc.shipping  + ship,
        packaging: acc.packaging + pack,
        gateway:   acc.gateway   + gw,
        profit:    acc.profit    + (rev - cogs - ship - pack - gw),
        units:     acc.units     + item.quantity,
      };
    },
    { revenue: 0, cogs: 0, shipping: 0, packaging: 0, gateway: 0, profit: 0, units: 0 }
  );
}

function withMargin<T extends { revenue: number; profit: number }>(s: T) {
  return { ...s, margin: s.revenue > 0 ? Math.round((s.profit / s.revenue) * 10000) / 100 : 0 };
}

function r2(x: number) { return Math.round(x * 100) / 100; }
function r0(x: number) { return Math.round(x); }

const itemInclude = {
  include: {
    variant: { select: { costPrice: true } },
    product: { select: { shippingCost: true, packagingCost: true } },
  },
} as const;

export async function GET() {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now             = new Date();
  const todayStart      = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart  = new Date(todayStart.getTime() - 86_400_000);
  const weekStart       = new Date(todayStart.getTime() - 6 * 86_400_000);
  const monthStart      = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd    = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const thirtyDaysAgo   = new Date(now.getTime() - 30 * 86_400_000);
  const sixMonthsAgo    = new Date(now.getTime() - 180 * 86_400_000);

  const cap = { status: PaymentStatus.CAPTURED } as const;
  const capOrder = { payment: cap } as const;

  const [
    // Revenue periods — payment sums
    totalRevRaw, todayRevRaw, yesterdayRevRaw, weekRevRaw, monthRevRaw, lastMonthRevRaw,

    // Order counts
    totalOrders, todayOrders, monthOrders, lastMonthOrders,
    pendingOrders, cancelledMonthOrders,

    // Refunds
    todayRefundsRaw, monthRefundsRaw,

    // Customers
    totalCustomers, newToday, newThisMonth,

    // Returns
    monthReturns,

    // Inventory risk
    outOfStock, lowStockVariants, deadStockVariants,

    // Daily payments (last 30 days for charts)
    dailyPayments,

    // Weekly orders (last 7 days per day)
    weeklyPayments,

    // Monthly payments (last 6 months)
    monthlyPayments,

    // Product performance — top selling, worst, highest profit
    topSellingProducts,
    mostViewedProducts,

    // Customer analytics
    returningCustomers,
    ordersWithUsers,

    // Category performance
    categoryItems,

    // Profit items for periods
    todayProfitItems, monthProfitItems, lastMonthProfitItems,

    // Per-product profit (30 days)
    productProfitItems,
  ] = await Promise.all([
    // Revenue
    prisma.payment.aggregate({ _sum: { amount: true }, where: cap }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...cap, createdAt: { gte: todayStart } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...cap, createdAt: { gte: yesterdayStart, lt: todayStart } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...cap, createdAt: { gte: weekStart } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...cap, createdAt: { gte: monthStart } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...cap, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),

    // Orders
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.order.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    prisma.order.count({ where: { createdAt: { gte: monthStart }, status: OrderStatus.CANCELLED } }),

    // Refunds
    prisma.payment.aggregate({ _sum: { refundedAmount: true }, where: { refundedAmount: { gt: 0 }, createdAt: { gte: todayStart } } }),
    prisma.payment.aggregate({ _sum: { refundedAmount: true }, where: { refundedAmount: { gt: 0 }, createdAt: { gte: monthStart } } }),

    // Customers
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: monthStart } } }),

    // Returns
    prisma.returnRequest.count({ where: { createdAt: { gte: monthStart } } }),

    // Inventory risk
    prisma.productVariant.count({ where: { isActive: true, stock: 0 } }),
    prisma.productVariant.findMany({
      where: { isActive: true, stock: { gt: 0, lte: 5 } },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { stock: "asc" },
      take: 20,
    }),
    // Dead stock: active variants with stock > 0, no sales in 90 days
    prisma.productVariant.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        orderItems: {
          none: { order: { createdAt: { gte: new Date(now.getTime() - 90 * 86_400_000) } } },
        },
      },
      include: { product: { select: { name: true, slug: true } } },
      take: 20,
    }),

    // Daily revenue 30 days
    prisma.payment.findMany({
      where: { ...cap, createdAt: { gte: thirtyDaysAgo } },
      select: { amount: true, createdAt: true },
    }),

    // Weekly daily (last 7 days)
    prisma.payment.findMany({
      where: { ...cap, createdAt: { gte: weekStart } },
      select: { amount: true, createdAt: true },
    }),

    // Monthly (last 6 months)
    prisma.payment.findMany({
      where: { ...cap, createdAt: { gte: sixMonthsAgo } },
      select: { amount: true, createdAt: true },
    }),

    // Top selling products (30 days) — by units
    prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      where: { order: { createdAt: { gte: thirtyDaysAgo }, ...capOrder } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),

    // Most sold products (by totalSoldCount)
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, totalSoldCount: true, weeklySoldCount: true },
      orderBy: { totalSoldCount: "desc" },
      take: 10,
    }),

    // Returning customers (≥2 orders)
    prisma.order.groupBy({
      by: ["userId"],
      _count: { id: true },
      having: { id: { _count: { gte: 2 } } },
    }).then(r => r.length),

    // Orders with users for AOV calc
    prisma.order.findMany({
      where: { createdAt: { gte: monthStart }, ...capOrder },
      select: { userId: true, payment: { select: { amount: true } } },
    }),

    // Category items (30 days, with category)
    prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: thirtyDaysAgo }, ...capOrder } },
      include: {
        variant: { select: { costPrice: true } },
        product: {
          select: {
            shippingCost: true,
            packagingCost: true,
            category: { select: { name: true } },
          },
        },
      },
    }),

    // Profit items
    prisma.orderItem.findMany({ where: { order: { createdAt: { gte: todayStart }, ...capOrder } }, ...itemInclude }),
    prisma.orderItem.findMany({ where: { order: { createdAt: { gte: monthStart }, ...capOrder } }, ...itemInclude }),
    prisma.orderItem.findMany({ where: { order: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd }, ...capOrder } }, ...itemInclude }),

    // Product profit items (30 days)
    prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: thirtyDaysAgo }, ...capOrder } },
      include: {
        variant: { select: { costPrice: true } },
        product: { select: { shippingCost: true, packagingCost: true, slug: true } },
      },
    }),
  ]);

  // ── Revenue ────────────────────────────────────────────────────────
  const revenue = {
    today:      r0(n(todayRevRaw._sum.amount)),
    yesterday:  r0(n(yesterdayRevRaw._sum.amount)),
    week:       r0(n(weekRevRaw._sum.amount)),
    month:      r0(n(monthRevRaw._sum.amount)),
    lastMonth:  r0(n(lastMonthRevRaw._sum.amount)),
    total:      r0(n(totalRevRaw._sum.amount)),
    growth:     (() => {
      const m = n(monthRevRaw._sum.amount), lm = n(lastMonthRevRaw._sum.amount);
      return lm === 0 ? 100 : r2(((m - lm) / lm) * 100);
    })(),
  };

  // ── Profit ────────────────────────────────────────────────────────
  const todayProfit     = withMargin(calcItems(todayProfitItems));
  const monthProfit     = withMargin(calcItems(monthProfitItems));
  const lastMonthProfit = withMargin(calcItems(lastMonthProfitItems));
  const profitGrowth    = lastMonthProfit.profit === 0 ? 100
    : r2(((monthProfit.profit - lastMonthProfit.profit) / Math.abs(lastMonthProfit.profit)) * 100);

  const profit = {
    today: {
      revenue:   r0(todayProfit.revenue),
      cogs:      r0(todayProfit.cogs),
      shipping:  r0(todayProfit.shipping),
      packaging: r0(todayProfit.packaging),
      gateway:   r0(todayProfit.gateway),
      refunds:   r0(n(todayRefundsRaw._sum.refundedAmount)),
      gross:     r0(todayProfit.revenue - todayProfit.cogs),
      net:       r0(todayProfit.profit - n(todayRefundsRaw._sum.refundedAmount)),
      margin:    todayProfit.margin,
    },
    month: {
      revenue:   r0(monthProfit.revenue),
      cogs:      r0(monthProfit.cogs),
      shipping:  r0(monthProfit.shipping),
      packaging: r0(monthProfit.packaging),
      gateway:   r0(monthProfit.gateway),
      refunds:   r0(n(monthRefundsRaw._sum.refundedAmount)),
      gross:     r0(monthProfit.revenue - monthProfit.cogs),
      net:       r0(monthProfit.profit - n(monthRefundsRaw._sum.refundedAmount)),
      margin:    monthProfit.margin,
    },
    lastMonth: {
      gross:  r0(lastMonthProfit.revenue - lastMonthProfit.cogs),
      net:    r0(lastMonthProfit.profit),
      margin: lastMonthProfit.margin,
    },
    growth: profitGrowth,
  };

  // ── Orders & customer KPIs ─────────────────────────────────────────
  const monthRevAmounts = ordersWithUsers.map(o => n(o.payment?.amount));
  const aov = monthRevAmounts.length > 0 ? r0(monthRevAmounts.reduce((a, b) => a + b, 0) / monthRevAmounts.length) : 0;
  const repeatRate = totalCustomers > 0 ? r2((returningCustomers / totalCustomers) * 100) : 0;
  const cancelRate = monthOrders > 0 ? r2((cancelledMonthOrders / monthOrders) * 100) : 0;
  const refundRate = monthOrders > 0 ? r2((monthReturns / monthOrders) * 100) : 0;
  const orderGrowth = lastMonthOrders === 0 ? 100 : r2(((monthOrders - lastMonthOrders) / lastMonthOrders) * 100);

  // ── Daily chart (30 days) ──────────────────────────────────────────
  const dailyBuckets = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    dailyBuckets.set(new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10), 0);
  }
  for (const p of dailyPayments) {
    const k = new Date(p.createdAt).toISOString().slice(0, 10);
    if (dailyBuckets.has(k)) dailyBuckets.set(k, (dailyBuckets.get(k) ?? 0) + n(p.amount));
  }
  const dailySales = [...dailyBuckets.entries()].map(([date, revenue]) => ({ date, revenue: r0(revenue) }));

  // ── Weekly chart (last 7 days) ─────────────────────────────────────
  const weeklyBuckets = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    weeklyBuckets.set(new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10), 0);
  }
  for (const p of weeklyPayments) {
    const k = new Date(p.createdAt).toISOString().slice(0, 10);
    if (weeklyBuckets.has(k)) weeklyBuckets.set(k, (weeklyBuckets.get(k) ?? 0) + n(p.amount));
  }
  const weeklySales = [...weeklyBuckets.entries()].map(([date, revenue]) => ({ date, revenue: r0(revenue) }));

  // ── Monthly chart (last 6 months) ─────────────────────────────────
  const monthlyBuckets = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyBuckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  for (const p of monthlyPayments) {
    const d = new Date(p.createdAt);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyBuckets.has(k)) monthlyBuckets.set(k, (monthlyBuckets.get(k) ?? 0) + n(p.amount));
  }
  const monthlySales = [...monthlyBuckets.entries()].map(([month, revenue]) => ({ month, revenue: r0(revenue) }));

  // ── Product performance ────────────────────────────────────────────
  const productProfitMap = new Map<string, {
    name: string; slug: string | null; revenue: number; cogs: number;
    shipping: number; gateway: number; profit: number; units: number;
  }>();
  for (const item of productProfitItems) {
    const pid  = item.productId;
    const rev  = n(item.total);
    const cogs = n(item.variant?.costPrice) * item.quantity;
    const ship = n(item.product?.shippingCost) * item.quantity;
    const pack = n(item.product?.packagingCost) * item.quantity;
    const gw   = rev * GATEWAY_FEE;
    const prof = rev - cogs - ship - pack - gw;
    const e = productProfitMap.get(pid) ?? {
      name: item.productName,
      slug: (item.product as { slug?: string } | null)?.slug ?? null,
      revenue: 0, cogs: 0, shipping: 0, gateway: 0, profit: 0, units: 0,
    };
    e.revenue += rev; e.cogs += cogs; e.shipping += ship; e.gateway += gw;
    e.profit += prof; e.units += item.quantity;
    productProfitMap.set(pid, e);
  }

  const allProductRows = [...productProfitMap.entries()].map(([id, v]) => ({
    productId: id,
    name:      v.name,
    slug:      v.slug,
    revenue:   r0(v.revenue),
    profit:    r0(v.profit),
    units:     v.units,
    margin:    v.revenue > 0 ? r2((v.profit / v.revenue) * 100) : 0,
  }));

  const topSellingByUnits = topSellingProducts.map(p => ({
    productId:   p.productId,
    productName: p.productName,
    units:       p._sum.quantity ?? 0,
    revenue:     r0(n(p._sum.total)),
  }));

  const worstSelling = [...allProductRows].sort((a, b) => a.units - b.units).slice(0, 10);
  const highestProfit = [...allProductRows].sort((a, b) => b.profit - a.profit).slice(0, 10);

  // ── Category performance ───────────────────────────────────────────
  const catMap = new Map<string, { revenue: number; profit: number; orders: Set<string>; units: number }>();
  for (const item of categoryItems) {
    const cat = (item.product as unknown as { category?: { name: string } })?.category?.name ?? "Uncategorised";
    const rev  = n(item.total);
    const cogs = n(item.variant?.costPrice) * item.quantity;
    const ship = n((item.product as unknown as { shippingCost?: unknown })?.shippingCost) * item.quantity;
    const pack = n((item.product as unknown as { packagingCost?: unknown })?.packagingCost) * item.quantity;
    const gw   = rev * GATEWAY_FEE;
    const e = catMap.get(cat) ?? { revenue: 0, profit: 0, orders: new Set(), units: 0 };
    e.revenue += rev;
    e.profit  += rev - cogs - ship - pack - gw;
    e.orders.add(item.orderId);
    e.units += item.quantity;
    catMap.set(cat, e);
  }
  const categories = [...catMap.entries()].map(([name, v]) => ({
    name,
    revenue: r0(v.revenue),
    profit:  r0(v.profit),
    orders:  v.orders.size,
    units:   v.units,
    margin:  v.revenue > 0 ? r2((v.profit / v.revenue) * 100) : 0,
  })).sort((a, b) => b.revenue - a.revenue);

  // ── Inventory risk ─────────────────────────────────────────────────
  const inventory = {
    outOfStock: outOfStock,
    lowStock: lowStockVariants.map(v => ({
      id:          v.id,
      sku:         v.sku,
      size:        v.size,
      color:       v.color,
      stock:       v.stock,
      productName: v.product.name,
      productSlug: v.product.slug,
    })),
    deadStock: deadStockVariants.map(v => ({
      id:          v.id,
      sku:         v.sku,
      stock:       v.stock,
      productName: v.product.name,
      productSlug: v.product.slug,
    })),
  };

  // ── Founder summary card ───────────────────────────────────────────
  const founderSummary = {
    revenueToday:  revenue.today,
    profitToday:   profit.today.net,
    ordersToday:   todayOrders,
    refundsToday:  profit.today.refunds,
    customersToday: newToday,
  };

  return NextResponse.json({
    revenue,
    profit,
    orders: {
      total:      totalOrders,
      today:      todayOrders,
      month:      monthOrders,
      lastMonth:  lastMonthOrders,
      pending:    pendingOrders,
      cancelled:  cancelledMonthOrders,
      growth:     orderGrowth,
      cancelRate,
    },
    customers: {
      total:      totalCustomers,
      newToday,
      newThisMonth,
      returning:  returningCustomers,
      repeatRate,
      aov,
      refundRate,
    },
    charts: {
      daily:   dailySales,
      weekly:  weeklySales,
      monthly: monthlySales,
    },
    products: {
      topSelling:     topSellingByUnits,
      worstSelling,
      mostSold:       mostViewedProducts.map(p => ({
        id:              p.id,
        name:            p.name,
        slug:            p.slug,
        totalSoldCount:  p.totalSoldCount,
        weeklySoldCount: p.weeklySoldCount,
      })),
      highestProfit,
    },
    inventory,
    categories,
    founderSummary,
    generatedAt: now.toISOString(),
  });
}
