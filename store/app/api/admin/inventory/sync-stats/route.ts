/**
 * Sync dashboard stats
 * GET /api/admin/inventory/sync-stats?supplierId=
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, SyncStatus } from "@prisma/client";

function adminOnly(role?: string) {
  return role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get("supplierId") ?? undefined;

  const supplierWhere = supplierId ? { supplierId } : {};

  const [
    suppliers,
    totalMappings,
    unmappedVariants,
    lastSync,
    statusCounts,
    lowStockMapped,
    outOfStockMapped,
  ] = await Promise.all([
    // All approved suppliers with their sync health
    prisma.supplier.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true,
        companyName: true,
        tier: true,
        performanceScore: true,
        skuMaps: { select: { id: true, lastSyncedAt: true } },
        _count: { select: { skuMaps: true } },
      },
      orderBy: { companyName: "asc" },
    }),

    // Total mappings
    prisma.supplierSkuMap.count({ where: supplierWhere }),

    // Active variants with no mapping for this supplier
    supplierId ? prisma.productVariant.count({
      where: {
        isActive: true,
        product: { supplierId },
        supplierSkuMap: null,
      },
    }) : Promise.resolve(0),

    // Last sync entry
    prisma.stockSyncLog.findFirst({
      where: supplierWhere,
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, syncSessionId: true, supplierId: true },
    }),

    // Status counts for last 30 days
    prisma.stockSyncLog.groupBy({
      by: ["status"],
      where: {
        ...supplierWhere,
        createdAt: { gte: new Date(Date.now() - 30 * 86400_000) },
      },
      _count: { id: true },
    }),

    // Mapped variants currently low stock
    prisma.supplierSkuMap.count({
      where: { ...supplierWhere, variant: { stock: { gt: 0, lte: 5 } } },
    }),

    // Mapped variants currently OOS
    prisma.supplierSkuMap.count({
      where: { ...supplierWhere, variant: { stock: 0 } },
    }),
  ]);

  const counts = Object.fromEntries(statusCounts.map(s => [s.status, s._count.id]));

  // Supplier health: % of mappings that have been synced in last 7 days
  const suppliersWithHealth = suppliers.map(s => {
    const total    = s._count.skuMaps;
    const synced7d = s.skuMaps.filter(m => m.lastSyncedAt && m.lastSyncedAt > new Date(Date.now() - 7 * 86400_000)).length;
    const health   = total > 0 ? Math.round((synced7d / total) * 100) : 0;
    const lastSyncedAt = s.skuMaps.reduce<Date | null>((latest, m) => {
      if (!m.lastSyncedAt) return latest;
      return !latest || m.lastSyncedAt > latest ? m.lastSyncedAt : latest;
    }, null);
    return {
      id:           s.id,
      companyName:  s.companyName,
      tier:         s.tier,
      performance:  Number(s.performanceScore),
      totalMaps:    total,
      healthScore:  health,
      lastSyncedAt,
    };
  });

  return NextResponse.json({
    suppliers:       suppliersWithHealth,
    totalMappings,
    unmappedVariants,
    lastSync,
    statusCounts30d: counts,
    success30d:      counts[SyncStatus.SUCCESS]   ?? 0,
    failed30d:       counts[SyncStatus.FAILED]    ?? 0,
    noMapping30d:    counts[SyncStatus.NO_MAPPING] ?? 0,
    lowStockMapped,
    outOfStockMapped,
  });
}
