import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, PaymentStatus, OrderStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");
  const since = new Date(Date.now() - days * 86_400_000);
  const cap = { payment: { status: PaymentStatus.CAPTURED } };

  const suppliers = await prisma.supplier.findMany({
    where: { status: "APPROVED" },
    select: {
      id: true, companyName: true, logoUrl: true, tier: true,
      commissionRate: true, totalSales: true, pendingPayout: true,
      performanceScore: true, slaScore: true, qualityScore: true,
      returnRate: true, cancellationRate: true,
      avgShippingHrs: true, avgDeliveryDays: true,
      totalOrders: true, avgRating: true,
      onboardedAt: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { performanceScore: "desc" },
  });

  if (suppliers.length === 0) {
    return NextResponse.json({ suppliers: [], days });
  }

  const supplierIds = suppliers.map(s => s.id);

  // Revenue per supplier in period
  const [orderRevenue, returnCounts, cancelledOrders, products] = await Promise.all([
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { product: { supplierId: { in: supplierIds } }, order: { createdAt: { gte: since }, ...cap } },
      _sum: { total: true, quantity: true },
      _count: { id: true },
    }),
    prisma.returnItem.groupBy({
      by: ["productId"],
      where: { product: { supplierId: { in: supplierIds } }, returnRequest: { requestedAt: { gte: since } } },
      _sum: { quantity: true },
    }),
    prisma.order.groupBy({
      by: ["id"],
      where: {
        createdAt: { gte: since },
        status: OrderStatus.CANCELLED,
        items: { some: { product: { supplierId: { in: supplierIds } } } },
      },
      _count: { id: true },
    }),
    prisma.product.findMany({
      where: { supplierId: { in: supplierIds } },
      select: { id: true, supplierId: true, isActive: true, totalSoldCount: true },
    }),
  ]);

  // Map product → supplier
  const pToSupplier = new Map(products.map(p => [p.id, p.supplierId!]));
  const supplierProducts = new Map<string, { active: number; total: number; sold: number }>();
  for (const p of products) {
    const s = supplierProducts.get(p.supplierId!) ?? { active: 0, total: 0, sold: 0 };
    s.total++;
    if (p.isActive) s.active++;
    s.sold += p.totalSoldCount;
    supplierProducts.set(p.supplierId!, s);
  }

  const supplierRevMap  = new Map<string, number>();
  const supplierQtyMap  = new Map<string, number>();
  const supplierOrdMap  = new Map<string, number>();
  const supplierRetMap  = new Map<string, number>();

  for (const row of orderRevenue) {
    const sid = pToSupplier.get(row.productId);
    if (!sid) continue;
    supplierRevMap.set(sid, (supplierRevMap.get(sid) ?? 0) + Number(row._sum.total ?? 0));
    supplierQtyMap.set(sid, (supplierQtyMap.get(sid) ?? 0) + (row._sum.quantity ?? 0));
    supplierOrdMap.set(sid, (supplierOrdMap.get(sid) ?? 0) + row._count.id);
  }

  for (const row of returnCounts) {
    const sid = pToSupplier.get(row.productId);
    if (!sid) continue;
    supplierRetMap.set(sid, (supplierRetMap.get(sid) ?? 0) + (row._sum.quantity ?? 0));
  }

  const rows = suppliers.map(s => {
    const rev      = supplierRevMap.get(s.id) ?? 0;
    const qty      = supplierQtyMap.get(s.id) ?? 0;
    const orders   = supplierOrdMap.get(s.id) ?? 0;
    const returns  = supplierRetMap.get(s.id) ?? 0;
    const comm     = rev * Number(s.commissionRate);
    const prods    = supplierProducts.get(s.id) ?? { active: 0, total: 0, sold: 0 };

    return {
      id:             s.id,
      companyName:    s.companyName,
      logoUrl:        s.logoUrl,
      tier:           s.tier,
      contactName:    s.user.name,
      contactEmail:   s.user.email,
      revenue:        Math.round(rev),
      commission:     Math.round(comm),
      pendingPayout:  Math.round(Number(s.pendingPayout)),
      unitsFulfilled: qty,
      ordersFulfilled: orders,
      returns,
      returnRatePct:  qty > 0 ? Math.round((returns / qty) * 1000) / 10 : Math.round(Number(s.returnRate) * 1000) / 10,
      cancellationRatePct: Math.round(Number(s.cancellationRate) * 1000) / 10,
      avgShippingHrs: Number(s.avgShippingHrs),
      avgDeliveryDays: Number(s.avgDeliveryDays),
      performanceScore: Math.round(Number(s.performanceScore)),
      slaScore:         Math.round(Number(s.slaScore)),
      qualityScore:     Math.round(Number(s.qualityScore)),
      avgRating:        Number(s.avgRating),
      totalOrders:      s.totalOrders,
      activeProducts:   prods.active,
      totalProducts:    prods.total,
      totalSoldUnits:   prods.sold,
      onboardedAt:      s.onboardedAt,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  return NextResponse.json({ suppliers: rows, days, generatedAt: new Date().toISOString() });
}
