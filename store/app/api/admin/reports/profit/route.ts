import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, PaymentStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// Razorpay charges ~2% for most payment methods
const GATEWAY_FEE_RATE = 0.02;

function calcProfit(items: Array<{
  total: unknown; quantity: number;
  variant: { costPrice: unknown } | null;
  product: { shippingCost: unknown; packagingCost: unknown; name: string; id: string } | null;
}>, method?: string) {
  return items.reduce((acc, item) => {
    const revenue   = Number(item.total);
    const cost      = Number(item.variant?.costPrice ?? 0) * item.quantity;
    const shipping  = Number(item.product?.shippingCost ?? 0) * item.quantity;
    const packaging = Number(item.product?.packagingCost ?? 0) * item.quantity;
    const gateway   = revenue * GATEWAY_FEE_RATE;
    const profit    = revenue - cost - shipping - packaging - gateway;
    return {
      revenue:   acc.revenue   + revenue,
      cogs:      acc.cogs      + cost,
      shipping:  acc.shipping  + shipping,
      packaging: acc.packaging + packaging,
      gateway:   acc.gateway   + gateway,
      profit:    acc.profit    + profit,
      units:     acc.units     + item.quantity,
    };
  }, { revenue: 0, cogs: 0, shipping: 0, packaging: 0, gateway: 0, profit: 0, units: 0 });
}

function addMargin<T extends { revenue: number; profit: number }>(s: T) {
  return { ...s, margin: s.revenue > 0 ? Math.round((s.profit / s.revenue) * 10000) / 100 : 0 };
}

function round<T extends object>(s: T): T {
  return Object.fromEntries(
    Object.entries(s).map(([k, v]) => [k, typeof v === "number" ? Math.round(v * 100) / 100 : v])
  ) as T;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");

  const now              = new Date();
  const todayStart       = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart       = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart   = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd     = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const since            = new Date(now.getTime() - days * 86_400_000);
  const cap              = { payment: { status: PaymentStatus.CAPTURED } };

  const itemInclude = {
    include: {
      variant: { select: { costPrice: true } },
      product: { select: { shippingCost: true, packagingCost: true, name: true, id: true, slug: true } },
    },
  };

  const [todayItems, monthItems, lastMonthItems, periodItems] = await Promise.all([
    prisma.orderItem.findMany({ where: { order: { createdAt: { gte: todayStart }, ...cap } }, ...itemInclude }),
    prisma.orderItem.findMany({ where: { order: { createdAt: { gte: monthStart }, ...cap } }, ...itemInclude }),
    prisma.orderItem.findMany({ where: { order: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd }, ...cap } }, ...itemInclude }),
    prisma.orderItem.findMany({ where: { order: { createdAt: { gte: since }, ...cap } }, ...itemInclude }),
  ]);

  const today     = calcProfit(todayItems);
  const month     = calcProfit(monthItems);
  const lastMonth = calcProfit(lastMonthItems);
  const period    = calcProfit(periodItems);

  const profitGrowth = lastMonth.profit === 0 ? 100
    : ((month.profit - lastMonth.profit) / Math.abs(lastMonth.profit)) * 100;

  // Per-product breakdown
  const productMap = new Map<string, { name: string; revenue: number; cogs: number; shipping: number; packaging: number; gateway: number; profit: number; units: number }>();
  for (const item of periodItems) {
    const pid  = item.productId;
    const rev  = Number(item.total);
    const cost = Number(item.variant?.costPrice ?? 0) * item.quantity;
    const ship = Number(item.product?.shippingCost ?? 0) * item.quantity;
    const pack = Number(item.product?.packagingCost ?? 0) * item.quantity;
    const gw   = rev * GATEWAY_FEE_RATE;
    const prof = rev - cost - ship - pack - gw;
    const e = productMap.get(pid) ?? { name: item.productName, revenue: 0, cogs: 0, shipping: 0, packaging: 0, gateway: 0, profit: 0, units: 0 };
    e.revenue += rev; e.cogs += cost; e.shipping += ship; e.packaging += pack; e.gateway += gw; e.profit += prof; e.units += item.quantity;
    productMap.set(pid, e);
  }

  const productRows = [...productMap.entries()].map(([id, v]) => ({
    productId: id, ...v,
    margin: v.revenue > 0 ? Math.round((v.profit / v.revenue) * 1000) / 10 : 0,
  }));
  const topProfit    = [...productRows].sort((a, b) => b.profit - a.profit).slice(0, 10).map(p => round(p));
  const lowestMargin = productRows.filter(p => p.cogs > 0).sort((a, b) => a.margin - b.margin).slice(0, 10).map(p => round(p));

  // Per-category breakdown
  const catMap = new Map<string, { revenue: number; profit: number; units: number }>();
  for (const item of periodItems) {
    const cat = (item.product as { category?: { name: string } } | null)?.category?.name;
    if (!cat) continue; // category not loaded in this query — skip
    const e = catMap.get(cat) ?? { revenue: 0, profit: 0, units: 0 };
    const rev  = Number(item.total);
    const cost = Number(item.variant?.costPrice ?? 0) * item.quantity;
    const ship = Number(item.product?.shippingCost ?? 0) * item.quantity;
    const pack = Number(item.product?.packagingCost ?? 0) * item.quantity;
    const gw   = rev * GATEWAY_FEE_RATE;
    e.revenue += rev; e.profit += rev - cost - ship - pack - gw; e.units += item.quantity;
    catMap.set(cat, e);
  }

  // Re-fetch period items with category for category breakdown
  const periodItemsWithCat = await prisma.orderItem.findMany({
    where: { order: { createdAt: { gte: since }, ...cap } },
    include: {
      variant: { select: { costPrice: true } },
      product: { select: { shippingCost: true, packagingCost: true, category: { select: { name: true } } } },
    },
  });

  const catMap2 = new Map<string, { revenue: number; profit: number; units: number }>();
  for (const item of periodItemsWithCat) {
    const cat = item.product.category.name;
    const e = catMap2.get(cat) ?? { revenue: 0, profit: 0, units: 0 };
    const rev  = Number(item.total);
    const cost = Number(item.variant?.costPrice ?? 0) * item.quantity;
    const ship = Number(item.product.shippingCost ?? 0) * item.quantity;
    const pack = Number(item.product.packagingCost ?? 0) * item.quantity;
    const gw   = rev * GATEWAY_FEE_RATE;
    e.revenue += rev; e.profit += rev - cost - ship - pack - gw; e.units += item.quantity;
    catMap2.set(cat, e);
  }

  const categoryRows = [...catMap2.entries()].map(([name, v]) => ({
    name, ...round(v),
    margin: v.revenue > 0 ? Math.round((v.profit / v.revenue) * 1000) / 10 : 0,
  })).sort((a, b) => b.profit - a.profit);

  // Daily profit buckets
  const buckets = new Map<string, { date: string; revenue: number; profit: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    buckets.set(d, { date: d, revenue: 0, profit: 0 });
  }
  // Need order dates — fetch minimal data
  // Fetch daily orders via captured payment relation
  const dailyOrderItems = await prisma.orderItem.findMany({
    where: { order: { createdAt: { gte: since }, payment: { status: PaymentStatus.CAPTURED } } },
    include: {
      variant: { select: { costPrice: true } },
      product: { select: { shippingCost: true, packagingCost: true } },
      order:   { select: { createdAt: true, total: true } },
    },
  });

  // Group by order to compute daily buckets
  const orderDailyMap = new Map<string, { date: string; revenue: number; items: typeof dailyOrderItems }>();
  for (const item of dailyOrderItems) {
    const key = new Date(item.order.createdAt).toISOString().slice(0, 10);
    if (!orderDailyMap.has(item.orderId)) {
      orderDailyMap.set(item.orderId, { date: key, revenue: Number(item.order.total), items: [] });
    }
    orderDailyMap.get(item.orderId)!.items.push(item);
  }

  for (const { date, revenue, items } of orderDailyMap.values()) {
    const b = buckets.get(date);
    if (!b) continue;
    const gw   = revenue * GATEWAY_FEE_RATE;
    let cost = 0, ship = 0, pack = 0;
    for (const item of items) {
      cost += Number(item.variant?.costPrice ?? 0) * item.quantity;
      ship += Number(item.product?.shippingCost ?? 0) * item.quantity;
      pack += Number(item.product?.packagingCost ?? 0) * item.quantity;
    }
    b.revenue += revenue;
    b.profit  += revenue - cost - ship - pack - gw;
  }

  return NextResponse.json({
    summary: {
      today:      addMargin(round(today)),
      month:      addMargin(round(month)),
      lastMonth:  addMargin(round(lastMonth)),
      period:     addMargin(round(period)),
      profitGrowth: Math.round(profitGrowth * 10) / 10,
      gatewayFeeRate: GATEWAY_FEE_RATE,
    },
    topProfit,
    lowestMargin,
    categories: categoryRows,
    daily: [...buckets.values()].map(b => ({ ...b, revenue: Math.round(b.revenue), profit: Math.round(b.profit) })),
    days,
    generatedAt: now.toISOString(),
  });
}
