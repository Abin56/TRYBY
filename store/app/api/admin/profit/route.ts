import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, PaymentStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

function calcProfitFromItems(items: Array<{
  unitPrice: unknown; quantity: number; total: unknown;
  variant: { costPrice: unknown } | null;
  product:  { shippingCost: unknown; packagingCost: unknown } | null;
}>) {
  return items.reduce(
    (acc, item) => {
      const revenue   = Number(item.total);
      const cost      = Number(item.variant?.costPrice ?? 0) * item.quantity;
      const shipping  = Number(item.product?.shippingCost ?? 0) * item.quantity;
      const packaging = Number(item.product?.packagingCost ?? 0) * item.quantity;
      const totalCost = cost + shipping + packaging;
      return {
        revenue:  acc.revenue  + revenue,
        cogs:     acc.cogs     + cost,
        shipping: acc.shipping + shipping,
        packaging: acc.packaging + packaging,
        profit:   acc.profit   + (revenue - totalCost),
      };
    },
    { revenue: 0, cogs: 0, shipping: 0, packaging: 0, profit: 0 }
  );
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");

  const now              = new Date();
  const startOfToday     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const since            = new Date(now.getTime() - days * 86400_000);

  const itemSelect = {
    include: {
      variant: { select: { costPrice: true } },
      product: { select: { shippingCost: true, packagingCost: true, name: true, id: true, slug: true } },
    },
  };

  const capturedFilter = { payment: { status: PaymentStatus.CAPTURED } };

  const [todayItems, monthItems, lastMonthItems, periodItems, lowStock, missingCost] = await Promise.all([
    prisma.orderItem.findMany({ where: { order: { createdAt: { gte: startOfToday },    ...capturedFilter } }, ...itemSelect }),
    prisma.orderItem.findMany({ where: { order: { createdAt: { gte: startOfMonth },    ...capturedFilter } }, ...itemSelect }),
    prisma.orderItem.findMany({ where: { order: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, ...capturedFilter } }, ...itemSelect }),
    prisma.orderItem.findMany({ where: { order: { createdAt: { gte: since },           ...capturedFilter } }, ...itemSelect }),
    prisma.productVariant.count({ where: { stock: { lte: 5 }, isActive: true } }),
    prisma.productVariant.count({ where: { costPrice: null, isActive: true } }),
  ]);

  const today     = calcProfitFromItems(todayItems);
  const thisMonth = calcProfitFromItems(monthItems);
  const lastMonth = calcProfitFromItems(lastMonthItems);
  const period    = calcProfitFromItems(periodItems);

  const profitGrowth = lastMonth.profit === 0 ? 100
    : ((thisMonth.profit - lastMonth.profit) / Math.abs(lastMonth.profit)) * 100;

  // Aggregate per-product for the selected period
  const productMap = new Map<string, {
    productId: string; name: string; slug: string;
    revenue: number; cogs: number; shipping: number; packaging: number;
    profit: number; margin: number; unitsSold: number;
  }>();

  for (const item of periodItems) {
    const pid  = item.productId;
    const rev  = Number(item.total);
    const cost = Number(item.variant?.costPrice ?? 0) * item.quantity;
    const ship = Number(item.product?.shippingCost ?? 0) * item.quantity;
    const pack = Number(item.product?.packagingCost ?? 0) * item.quantity;
    const prof = rev - cost - ship - pack;

    const entry = productMap.get(pid) ?? {
      productId: pid, name: item.productName, slug: item.product?.slug ?? "",
      revenue: 0, cogs: 0, shipping: 0, packaging: 0, profit: 0, margin: 0, unitsSold: 0,
    };
    entry.revenue   += rev;
    entry.cogs      += cost;
    entry.shipping  += ship;
    entry.packaging += pack;
    entry.profit    += prof;
    entry.unitsSold += item.quantity;
    productMap.set(pid, entry);
  }

  for (const p of productMap.values()) {
    p.margin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
    p.margin = Math.round(p.margin * 10) / 10;
  }

  const allProducts  = [...productMap.values()];
  const topProfit    = [...allProducts].sort((a, b) => b.profit - a.profit).slice(0, 10);
  const lowestMargin = allProducts
    .filter(p => p.cogs > 0)
    .sort((a, b) => a.margin - b.margin)
    .slice(0, 10);

  const addMargin = (s: typeof today) => ({
    ...s,
    margin: s.revenue > 0 ? Math.round((s.profit / s.revenue) * 10000) / 100 : 0,
  });

  return NextResponse.json({
    today:     addMargin(today),
    thisMonth: addMargin(thisMonth),
    lastMonth: addMargin(lastMonth),
    period:    addMargin(period),
    profitGrowth: Math.round(profitGrowth * 10) / 10,
    days,
    topProfit,
    lowestMargin,
    alerts: { lowStock, missingCost },
  });
}
