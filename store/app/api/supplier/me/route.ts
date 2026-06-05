import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, PayoutStatus } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({
    where: { userId: session.user.id },
    include: {
      user:      { select: { id: true, name: true, email: true, image: true, createdAt: true } },
      _count:    { select: { products: true, payouts: true } },
      documents: { orderBy: { uploadedAt: "desc" } },
    },
  });
  if (!supplier) return NextResponse.json({ error: "Supplier profile not found" }, { status: 404 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    pendingPayouts,
    activeProducts,
    pendingProducts,
    orderStats,
    unreadNotifications,
    todayOrders,
    pendingOrders,
    lowStockCount,
    totalReturns,
  ] = await Promise.all([
    prisma.payout.count({ where: { supplierId: supplier.id, status: PayoutStatus.PENDING } }),
    prisma.product.count({ where: { supplierId: supplier.id, isActive: true } }),
    prisma.product.count({ where: { supplierId: supplier.id, isActive: false } }),
    prisma.orderItem.aggregate({
      where: {
        product: { supplierId: supplier.id },
        order:   { status: { notIn: ["CANCELLED", "RETURNED", "REFUNDED"] } },
      },
      _sum:   { total: true },
      _count: { id: true },
    }),
    prisma.notification.count({ where: { supplierId: supplier.id, isRead: false } }),
    // Today's new order items
    prisma.orderItem.count({
      where: { product: { supplierId: supplier.id }, order: { createdAt: { gte: todayStart } } },
    }),
    // Orders pending supplier action
    prisma.orderItem.count({
      where: {
        product: { supplierId: supplier.id },
        order:   { status: { in: ["PENDING", "CONFIRMED"] } },
      },
    }),
    // Low stock variants (stock <= 5)
    prisma.productVariant.count({
      where: { product: { supplierId: supplier.id }, stock: { lte: 5 }, isActive: true },
    }),
    // Return requests from this supplier's orders
    (async () => {
      const supplierOrderIds = await prisma.orderItem.findMany({
        where:  { product: { supplierId: supplier.id } },
        select: { orderId: true },
        distinct: ["orderId"],
      });
      return prisma.returnRequest.count({
        where: {
          orderId: { in: supplierOrderIds.map((o: { orderId: string }) => o.orderId) },
          status:  { in: ["REQUESTED", "APPROVED"] },
        },
      });
    })(),
  ]);

  // Compute live performance score (0–100)
  const fulfillmentRate = Number(supplier.fulfillmentRate);
  const returnRate      = Number(supplier.returnRate);
  const avgRating       = Number(supplier.avgRating);

  const performanceScore = Math.round(
    fulfillmentRate * 40   // 40 pts: fulfillment
    + (1 - returnRate) * 30  // 30 pts: low returns
    + (avgRating / 5) * 30   // 30 pts: rating
  );

  return NextResponse.json({
    supplier: {
      ...supplier,
      performanceScore: Math.min(100, Math.max(0, performanceScore)),
    },
    stats: {
      activeProducts,
      pendingProducts,
      pendingPayouts,
      totalOrders:          orderStats._count.id,
      totalRevenue:         Number(orderStats._sum.total ?? 0),
      unreadNotifications,
      todayOrders,
      pendingOrders,
      lowStockCount,
      totalReturns,
    },
  });
}
