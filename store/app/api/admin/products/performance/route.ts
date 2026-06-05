import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, PaymentStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const days      = parseInt(searchParams.get("days") ?? "30");
  const page      = parseInt(searchParams.get("page") ?? "1");
  const limit     = parseInt(searchParams.get("limit") ?? "20");
  const sort      = searchParams.get("sort") ?? "revenue";

  const since = new Date(Date.now() - days * 86_400_000);
  const capturedFilter = { payment: { status: PaymentStatus.CAPTURED } };

  // Single product detail
  if (productId) {
    const [orderItems, returnItems, wishlistCount, product] = await Promise.all([
      prisma.orderItem.findMany({
        where: { productId, order: capturedFilter },
        include: {
          variant: { select: { costPrice: true } },
          product: { select: { shippingCost: true, packagingCost: true } },
          order:   { select: { createdAt: true } },
        },
      }),
      prisma.returnItem.findMany({ where: { productId }, select: { quantity: true } }),
      prisma.wishlistItem.count({ where: { productId } }),
      prisma.product.findUnique({
        where: { id: productId },
        include: {
          images:   { where: { isPrimary: true }, take: 1 },
          variants: { select: { id: true, sku: true, size: true, price: true, stock: true, costPrice: true } },
          category: { select: { name: true } },
          supplier: { select: { companyName: true } },
        },
      }),
    ]);

    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const periodItems = orderItems.filter(i => new Date(i.order.createdAt) >= since);
    const revenue    = periodItems.reduce((s, i) => s + Number(i.total), 0);
    const unitsSold  = periodItems.reduce((s, i) => s + i.quantity, 0);
    const cogs       = periodItems.reduce((s, i) => s + Number(i.variant?.costPrice ?? 0) * i.quantity, 0);
    const shipping   = periodItems.reduce((s, i) => s + Number(i.product?.shippingCost ?? 0) * i.quantity, 0);
    const packaging  = periodItems.reduce((s, i) => s + Number(i.product?.packagingCost ?? 0) * i.quantity, 0);
    const profit     = revenue - cogs - shipping - packaging;
    const margin     = revenue > 0 ? (profit / revenue) * 100 : 0;
    const returns    = returnItems.reduce((s, i) => s + i.quantity, 0);
    const returnRate = unitsSold > 0 ? (returns / unitsSold) * 100 : 0;

    const buckets = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      buckets.set(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10), 0);
    }
    for (const item of periodItems) {
      const key = new Date(item.order.createdAt).toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Number(item.total));
    }

    return NextResponse.json({
      product: { ...product, images: product.images, category: product.category, supplier: product.supplier },
      metrics: {
        revenue: Math.round(revenue), unitsSold,
        profit: Math.round(profit), margin: Math.round(margin * 10) / 10,
        returnRate: Math.round(returnRate * 10) / 10, returns, wishlistCount,
        avgRating: Number(product.avgRating), reviewCount: product.reviewCount,
      },
      daily: [...buckets.entries()].map(([date, rev]) => ({ date, revenue: Math.round(rev) })),
      days,
    });
  }

  // All products — grouped by product
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId", "productName"],
    where: { order: { createdAt: { gte: since }, ...capturedFilter } },
    _sum:   { quantity: true, total: true },
    _count: { id: true },
  });

  const productIds = grouped.map(g => g.productId);

  const [products, returnAgg, wishlists] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true, name: true, slug: true, sport: true, avgRating: true,
        shippingCost: true, packagingCost: true,
        images:   { where: { isPrimary: true }, take: 1, select: { url: true } },
        variants: { select: { costPrice: true, stock: true, price: true } },
        category: { select: { name: true } },
        supplier: { select: { companyName: true } },
      },
    }),
    prisma.returnItem.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds } },
      _sum: { quantity: true },
    }),
    prisma.wishlistItem.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds } },
      _count: { id: true },
    }),
  ]);

  const pMap = new Map(products.map(p => [p.id, p]));
  const rMap = new Map(returnAgg.map(r => [r.productId, r._sum.quantity ?? 0]));
  const wMap = new Map(wishlists.map(w => [w.productId, w._count.id]));

  const rows = grouped.map(g => {
    const p       = pMap.get(g.productId);
    const revenue = Number(g._sum.total ?? 0);
    const units   = g._sum.quantity ?? 0;
    const ship    = Number(p?.shippingCost ?? 0) * units;
    const pack    = Number(p?.packagingCost ?? 0) * units;
    const costVariants = p?.variants.filter(v => v.costPrice) ?? [];
    const avgCost = costVariants.length
      ? costVariants.reduce((s, v) => s + Number(v.costPrice), 0) / costVariants.length
      : 0;
    const cogs   = avgCost * units;
    const profit = revenue - cogs - ship - pack;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      productId:    g.productId,
      productName:  g.productName,
      sport:        p?.sport ?? "",
      category:     p?.category?.name ?? "",
      supplierName: p?.supplier?.companyName ?? null,
      image:        p?.images[0]?.url ?? null,
      avgRating:    Number(p?.avgRating ?? 0),
      revenue:      Math.round(revenue),
      unitsSold:    units,
      orders:       g._count.id,
      profit:       Math.round(profit),
      margin:       Math.round(margin * 10) / 10,
      returnRate:   units > 0 ? Math.round(((rMap.get(g.productId) ?? 0) / units) * 1000) / 10 : 0,
      wishlistCount: wMap.get(g.productId) ?? 0,
    };
  }).sort((a, b) => {
    if (sort === "profit")  return b.profit  - a.profit;
    if (sort === "orders")  return b.orders  - a.orders;
    if (sort === "margin")  return b.margin  - a.margin;
    return b.revenue - a.revenue;
  });

  return NextResponse.json({
    products: rows.slice((page - 1) * limit, page * limit),
    total:    rows.length,
    page,
    pages:    Math.ceil(rows.length / limit),
    days,
  });
}
