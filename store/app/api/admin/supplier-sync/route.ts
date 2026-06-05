import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// GET /api/admin/supplier-sync — dashboard KPIs
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since")
    ? new Date(searchParams.get("since")!)
    : new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h

  const [
    totalSyncedSuppliers,
    stockLogs,
    priceLogs,
    failedLogs,
    profiles,
  ] = await Promise.all([
    prisma.supplierSyncProfile.count({ where: { syncEnabled: true } }),
    prisma.stockSyncLog.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { createdAt: { gte: since } },
    }),
    prisma.priceSyncLog.count({ where: { createdAt: { gte: since } } }),
    prisma.stockSyncLog.count({ where: { status: "FAILED", createdAt: { gte: since } } }),
    prisma.supplierSyncProfile.findMany({
      include: { supplier: { select: { id: true, companyName: true, logoUrl: true } } },
      orderBy: { lastSyncAt: "desc" },
    }),
  ]);

  const stockChanges = stockLogs.find((r) => r.status === "SUCCESS")?._count.id ?? 0;
  const skippedCount = stockLogs
    .filter((r) => ["SKIPPED", "NO_MAPPING", "OVERRIDDEN"].includes(r.status))
    .reduce((acc, r) => acc + r._count.id, 0);

  return NextResponse.json({
    kpi: {
      totalSyncedSuppliers,
      stockChangesToday: stockChanges,
      priceChangesToday: priceLogs,
      failedSyncsToday: failedLogs,
      skippedToday: skippedCount,
    },
    profiles,
  });
}
