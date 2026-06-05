import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q          = searchParams.get("q") ?? "";
  const sport      = searchParams.get("sport") ?? "";
  const stockAlert = searchParams.get("alert") ?? ""; // "oos" | "low" | "overstock"
  const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit      = 50;

  // ── All variants for KPI (no pagination) ──────────────────────────────────
  const allVariants = await prisma.productVariant.findMany({
    where: { product: { isActive: true, isArchived: false } },
    select: {
      id: true, sku: true, stock: true,
      price: true, costPrice: true, isActive: true,
      product: { select: { sport: true } },
    },
  });

  const totalUnits  = allVariants.reduce((s, v) => s + v.stock, 0);
  let stockValue    = 0;
  let retailValue   = 0;
  for (const v of allVariants) {
    const cost   = Number(v.costPrice ?? 0);
    const price  = Number(v.price);
    stockValue  += cost  * v.stock;
    retailValue += price * v.stock;
  }

  const LOW_STOCK_THRESHOLD = 5;
  const OVERSTOCK_THRESHOLD = 200;

  // ── Filtered + paginated variant list ──────────────────────────────────────
  const variantWhere: Record<string, unknown> = {
    product: { isActive: true, isArchived: false },
  };
  if (sport)                      variantWhere.product = { ...(variantWhere.product as object), sport };
  if (stockAlert === "oos")       variantWhere.stock   = 0;
  if (stockAlert === "low")       variantWhere.stock   = { gt: 0, lte: LOW_STOCK_THRESHOLD };
  if (stockAlert === "overstock") variantWhere.stock   = { gt: OVERSTOCK_THRESHOLD };
  if (q) {
    variantWhere.OR = [
      { sku:     { contains: q, mode: "insensitive" } },
      { product: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [variants, variantsTotal] = await Promise.all([
    prisma.productVariant.findMany({
      where: variantWhere,
      include: {
        product: {
          select: {
            id: true, name: true, slug: true, sport: true,
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            category: { select: { name: true } },
            supplier: { select: { companyName: true } },
          },
        },
      },
      orderBy: { stock: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.productVariant.count({ where: variantWhere }),
  ]);

  // ── Fast-moving products (most sold last 30 days) ──────────────────────────
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const fastMoving = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { order: { createdAt: { gte: since30 }, status: { notIn: ["CANCELLED", "RETURNED", "REFUNDED"] } } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 10,
  });

  const fastMovingIds = fastMoving.map(f => f.productId);
  const fastMovingProducts = fastMovingIds.length
    ? await prisma.product.findMany({
        where: { id: { in: fastMovingIds } },
        select: {
          id: true, name: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          variants: { select: { stock: true }, where: { isActive: true } },
        },
      })
    : [];

  const fastMovingList = fastMoving.map(f => {
    const product = fastMovingProducts.find(p => p.id === f.productId);
    return {
      productId:   f.productId,
      productName: product?.name ?? "—",
      image:       product?.images[0]?.url ?? null,
      totalStock:  product?.variants.reduce((s, v) => s + v.stock, 0) ?? 0,
      soldQty:     f._sum.quantity ?? 0,
    };
  });

  // ── Dead stock (no sales in 60 days, stock > 0) ────────────────────────────
  const since60 = new Date();
  since60.setDate(since60.getDate() - 60);

  const soldRecentlyIds = (await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { order: { createdAt: { gte: since60 } } },
  })).map(r => r.productId);

  const deadStockProducts = await prisma.product.findMany({
    where: {
      id: { notIn: soldRecentlyIds },
      isActive: true, isArchived: false,
      variants: { some: { stock: { gt: 0 } } },
    },
    select: {
      id: true, name: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      variants: { select: { stock: true, price: true, costPrice: true }, where: { isActive: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const deadStockList = deadStockProducts.map(p => {
    const totalStock   = p.variants.reduce((s, v) => s + v.stock, 0);
    const stockValue   = p.variants.reduce((s, v) => s + Number(v.costPrice ?? 0) * v.stock, 0);
    const retailValue  = p.variants.reduce((s, v) => s + Number(v.price) * v.stock, 0);
    return { productId: p.id, productName: p.name, image: p.images[0]?.url ?? null, totalStock, stockValue, retailValue, createdAt: p.createdAt };
  });

  // ── Sport breakdown ────────────────────────────────────────────────────────
  const sportBreakdown: Record<string, number> = {};
  for (const v of allVariants) {
    const s = v.product.sport;
    sportBreakdown[s] = (sportBreakdown[s] ?? 0) + v.stock;
  }

  // ── Low-stock alerts for reorder suggestions ──────────────────────────────
  const reorderAlerts = allVariants
    .filter(v => v.isActive && v.stock <= LOW_STOCK_THRESHOLD)
    .length;

  return NextResponse.json({
    kpi: {
      totalProducts:   await prisma.product.count({ where: { isActive: true, isArchived: false } }),
      totalVariants:   allVariants.length,
      totalUnits,
      outOfStockCount: allVariants.filter(v => v.stock === 0).length,
      lowStockCount:   allVariants.filter(v => v.stock > 0 && v.stock <= LOW_STOCK_THRESHOLD).length,
      overstockCount:  allVariants.filter(v => v.stock > OVERSTOCK_THRESHOLD).length,
      stockValue:      Math.round(stockValue),
      retailValue:     Math.round(retailValue),
      potentialProfit: Math.round(retailValue - stockValue),
      reorderAlerts,
    },
    variants: variants.map(v => ({
      variantId:   v.id,
      sku:         v.sku,
      size:        v.size,
      color:       v.color,
      stock:       v.stock,
      price:       Number(v.price),
      costPrice:   v.costPrice ? Number(v.costPrice) : null,
      isActive:    v.isActive,
      productId:   v.product.id,
      productName: v.product.name,
      sport:       v.product.sport,
      category:    v.product.category?.name ?? null,
      supplier:    v.product.supplier?.companyName ?? null,
      image:       v.product.images[0]?.url ?? null,
    })),
    variantsTotal,
    variantsPages: Math.ceil(variantsTotal / limit),
    fastMoving:    fastMovingList,
    deadStock:     deadStockList,
    sportBreakdown,
  });
}
