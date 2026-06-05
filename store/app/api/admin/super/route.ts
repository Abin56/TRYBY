import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccess, isSuperAdmin } from "@/lib/rbac";

// GET /api/admin/super
// Super Admin overview: revenue, orders, suppliers, team, system health
export async function GET() {
  const session = await auth();
  if (!canAccess(session, "settings:read") || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden — Super Admin only" }, { status: 403 });
  }

  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last30d    = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const last7d     = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  const [
    // Revenue
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    todayRevenue,
    // Orders
    totalOrders,
    monthOrders,
    pendingOrders,
    // Customers
    totalCustomers,
    newCustomersMonth,
    // Suppliers
    totalSuppliers,
    activeSuppliers,
    pendingSuppliers,
    // Admin team
    totalAdmins,
    activeAdmins,
    disabledAdmins,
    // Products
    activeProducts,
    lowStock,
    outOfStock,
    // Recent audit
    recentAuditLogs,
    // Active sessions
    activeSessions,
    // Security events 24h
    securityEvents24h,
    failedLogins24h,
    lockedAccounts,
    // Daily revenue chart (last 14 days)
    dailyRevenue,
    // Pending payouts
    pendingPayouts,
  ] = await Promise.all([
    // Revenue (captured payments)
    prisma.payment.aggregate({
      where: { status: "CAPTURED" },
      _sum:  { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "CAPTURED", createdAt: { gte: monthStart } },
      _sum:  { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "CAPTURED", createdAt: { gte: lastMonthStart, lt: monthStart } },
      _sum:  { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "CAPTURED", createdAt: { gte: todayStart } },
      _sum:  { amount: true },
    }),
    // Orders
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } } }),
    // Customers
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: monthStart } } }),
    // Suppliers
    prisma.supplier.count(),
    prisma.supplier.count({ where: { status: "APPROVED" } }),
    prisma.supplier.count({ where: { status: "PENDING"  } }),
    // Admin team
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "ADMIN", isActive: true  } }),
    prisma.adminProfile.count({ where: { isDisabled: true } }),
    // Products
    prisma.product.count({ where: { isActive: true, isArchived: false } }),
    prisma.warehouseStock.count({ where: { stock: { gt: 0, lte: 10 }, product: { isActive: true } } }),
    prisma.warehouseStock.count({ where: { stock: 0, product: { isActive: true } } }),
    // Recent 10 audit logs
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take:    10,
      include: {
        admin: {
          include: { user: { select: { name: true, email: true, image: true } } },
        },
      },
    }),
    // Active admin sessions
    prisma.adminSession.count({
      where: { revokedAt: null, expiresAt: { gt: now } },
    }),
    // Security events last 24h
    prisma.securityEvent.count({ where: { createdAt: { gte: last7d } } }),
    prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: last7d } } }),
    prisma.user.count({ where: { lockedUntil: { gt: now } } }),
    // Daily revenue last 14 days (raw SQL grouping)
    prisma.payment.findMany({
      where: {
        status:    "CAPTURED",
        createdAt: { gte: new Date(now.getTime() - 14 * 24 * 3600 * 1000) },
      },
      select: { amount: true, createdAt: true },
    }),
    // Pending payouts
    prisma.payout.aggregate({
      where: { status: { in: ["PENDING", "APPROVED"] } },
      _sum:  { amount: true },
      _count: { _all: true },
    }),
  ]);

  // Aggregate daily revenue
  const dailyMap: Record<string, number> = {};
  for (const p of dailyRevenue) {
    const d = p.createdAt.toISOString().slice(0, 10);
    dailyMap[d] = (dailyMap[d] ?? 0) + Number(p.amount);
  }
  const dailyChart = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }));

  const monthRev     = Number(monthRevenue._sum.amount ?? 0);
  const lastMonthRev = Number(lastMonthRevenue._sum.amount ?? 0);
  const revenueGrowth = lastMonthRev > 0
    ? ((monthRev - lastMonthRev) / lastMonthRev) * 100
    : 0;

  return NextResponse.json({
    revenue: {
      total:        Number(totalRevenue._sum.amount ?? 0),
      today:        Number(todayRevenue._sum.amount  ?? 0),
      thisMonth:    monthRev,
      lastMonth:    lastMonthRev,
      growth:       Math.round(revenueGrowth * 10) / 10,
      dailyChart,
    },
    orders: {
      total:    totalOrders,
      month:    monthOrders,
      pending:  pendingOrders,
    },
    customers: {
      total:        totalCustomers,
      newThisMonth: newCustomersMonth,
    },
    suppliers: {
      total:   totalSuppliers,
      active:  activeSuppliers,
      pending: pendingSuppliers,
    },
    team: {
      total:    totalAdmins,
      active:   activeAdmins,
      disabled: disabledAdmins,
    },
    inventory: {
      active:     activeProducts,
      lowStock,
      outOfStock,
    },
    sessions: {
      active: activeSessions,
    },
    security: {
      events7d:        securityEvents24h,
      failedLogins7d:  failedLogins24h,
      lockedAccounts,
    },
    payouts: {
      pending: pendingPayouts._count._all,
      amount:  Number(pendingPayouts._sum.amount ?? 0),
    },
    recentActivity: recentAuditLogs.map(l => ({
      id:           l.id,
      action:       l.action,
      resourceType: l.resourceType,
      resourceName: l.resourceName,
      ipAddress:    l.ipAddress,
      createdAt:    l.createdAt,
      admin: {
        name:  l.admin.user?.name,
        email: l.admin.user?.email,
        image: l.admin.user?.image,
      },
    })),
    generatedAt: now.toISOString(),
  });
}
