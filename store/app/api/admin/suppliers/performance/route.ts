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
  const supplierId = searchParams.get("supplierId");
  const days       = parseInt(searchParams.get("days") ?? "30");

  const since = new Date(Date.now() - days * 86_400_000);
  const capturedFilter = { payment: { status: PaymentStatus.CAPTURED } };

  // Single supplier deep view
  if (supplierId) {
    const [supplier, orderItems, returnItems, products] = await Promise.all([
      prisma.supplier.findUnique({
        where: { id: supplierId },
        select: {
          id: true, companyName: true, logoUrl: true, tier: true, status: true,
          commissionRate: true, totalSales: true, pendingPayout: true,
          performanceScore: true, fulfillmentScore: true, qualityScore: true,
          trustScore: true, slaScore: true, returnRate: true,
          avgRating: true, totalOrders: true, onboardedAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.orderItem.findMany({
        where: { product: { supplierId }, order: { createdAt: { gte: since }, ...capturedFilter } },
        select: {
          quantity: true, total: true, productId: true,
          variant: { select: { costPrice: true } },
          product: { select: { shippingCost: true, packagingCost: true, name: true } },
        },
      }),
      prisma.returnItem.findMany({
        where: { product: { supplierId } },
        select: { quantity: true },
      }),
      prisma.product.findMany({
        where: { supplierId, isActive: true },
        select: {
          id: true, name: true, sport: true, totalSoldCount: true, avgRating: true,
          variants: { select: { stock: true, price: true, costPrice: true } },
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          category: { select: { name: true } },
        },
      }),
    ]);

    if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const revenue  = orderItems.reduce((s, i) => s + Number(i.total), 0);
    const units    = orderItems.reduce((s, i) => s + i.quantity, 0);
    const cogs     = orderItems.reduce((s, i) => s + Number(i.variant?.costPrice ?? 0) * i.quantity, 0);
    const ship     = orderItems.reduce((s, i) => s + Number(i.product?.shippingCost ?? 0) * i.quantity, 0);
    const pack     = orderItems.reduce((s, i) => s + Number(i.product?.packagingCost ?? 0) * i.quantity, 0);
    const profit   = revenue - cogs - ship - pack;
    const margin   = revenue > 0 ? (profit / revenue) * 100 : 0;
    const returns  = returnItems.reduce((s, i) => s + i.quantity, 0);
    const commission = revenue * Number(supplier.commissionRate);

    const productStats = products.map(p => ({
      id:          p.id,
      name:        p.name,
      sport:       p.sport,
      category:    p.category.name,
      image:       p.images[0]?.url ?? null,
      totalSold:   p.totalSoldCount,
      avgRating:   Number(p.avgRating),
      totalStock:  p.variants.reduce((s, v) => s + v.stock, 0),
      minPrice:    p.variants.length ? Math.min(...p.variants.map(v => Number(v.price))) : 0,
    }));

    return NextResponse.json({
      supplier,
      metrics: {
        revenue:    Math.round(revenue),
        unitsSold:  units,
        profit:     Math.round(profit),
        margin:     Math.round(margin * 10) / 10,
        commission: Math.round(commission),
        returns,
        returnRate: units > 0 ? Math.round((returns / units) * 1000) / 10 : 0,
        activeProducts: products.length,
      },
      products: productStats,
      days,
    });
  }

  // All suppliers summary
  const suppliers = await prisma.supplier.findMany({
    where: { status: "APPROVED" },
    select: {
      id: true, companyName: true, logoUrl: true, tier: true,
      commissionRate: true, totalSales: true, pendingPayout: true,
      performanceScore: true, returnRate: true, slaScore: true,
      qualityScore: true, avgRating: true, totalOrders: true,
      _count: { select: { products: { where: { isActive: true } } } },
    },
    orderBy: { performanceScore: "desc" },
  });

  const supplierIds = suppliers.map(s => s.id);

  const [orderRevenue, returnCounts] = await Promise.all([
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { product: { supplierId: { in: supplierIds } }, order: { createdAt: { gte: since }, ...capturedFilter } },
      _sum: { total: true, quantity: true },
    }),
    prisma.returnItem.groupBy({
      by: ["productId"],
      where: { product: { supplierId: { in: supplierIds } } },
      _sum: { quantity: true },
    }),
  ]);

  // Map productId → supplierId
  const productSupplierMap = await prisma.product.findMany({
    where: { supplierId: { in: supplierIds } },
    select: { id: true, supplierId: true },
  });
  const pToS = new Map(productSupplierMap.map(p => [p.id, p.supplierId!]));

  const supplierRevMap  = new Map<string, number>();
  const supplierUnitMap = new Map<string, number>();
  for (const row of orderRevenue) {
    const sid = pToS.get(row.productId);
    if (!sid) continue;
    supplierRevMap.set(sid, (supplierRevMap.get(sid) ?? 0) + Number(row._sum.total ?? 0));
    supplierUnitMap.set(sid, (supplierUnitMap.get(sid) ?? 0) + (row._sum.quantity ?? 0));
  }

  const supplierRetMap = new Map<string, number>();
  for (const row of returnCounts) {
    const sid = pToS.get(row.productId);
    if (!sid) continue;
    supplierRetMap.set(sid, (supplierRetMap.get(sid) ?? 0) + (row._sum.quantity ?? 0));
  }

  const rows = suppliers.map(s => {
    const rev  = supplierRevMap.get(s.id) ?? 0;
    const comm = rev * Number(s.commissionRate);
    return {
      id:           s.id,
      companyName:  s.companyName,
      logoUrl:      s.logoUrl,
      tier:         s.tier,
      activeProducts: s._count.products,
      revenue:      Math.round(rev),
      commission:   Math.round(comm),
      pendingPayout: Math.round(Number(s.pendingPayout)),
      totalOrders:  s.totalOrders,
      returnRate:   Math.round(Number(s.returnRate) * 1000) / 10,
      slaScore:     Math.round(Number(s.slaScore)),
      qualityScore: Math.round(Number(s.qualityScore)),
      performanceScore: Math.round(Number(s.performanceScore)),
      avgRating:    Number(s.avgRating),
    };
  });

  return NextResponse.json({ suppliers: rows, days });
}
