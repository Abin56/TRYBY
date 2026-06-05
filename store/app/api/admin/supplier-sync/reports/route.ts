import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// GET /api/admin/supplier-sync/reports
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "7");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Products hidden due to OOS
  const hiddenDueToOOS = await prisma.inventoryLog.findMany({
    where: {
      createdAt: { gte: since },
      note: { contains: "Auto-hidden" },
    },
    include: {
      product: { select: { id: true, name: true, slug: true, supplierId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Products repriced
  const repriced = await prisma.priceSyncLog.findMany({
    where: { createdAt: { gte: since } },
    include: { supplier: { select: { companyName: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Sync success rate per supplier
  const stockBySupplier = await prisma.stockSyncLog.groupBy({
    by: ["supplierId", "status"],
    _count: { id: true },
    where: { createdAt: { gte: since } },
  });

  const supplierMap: Record<string, { success: number; failed: number; skipped: number }> = {};
  for (const row of stockBySupplier) {
    if (!supplierMap[row.supplierId]) {
      supplierMap[row.supplierId] = { success: 0, failed: 0, skipped: 0 };
    }
    if (row.status === "SUCCESS")  supplierMap[row.supplierId].success  += row._count.id;
    if (row.status === "FAILED")   supplierMap[row.supplierId].failed   += row._count.id;
    if (["SKIPPED","NO_MAPPING","OVERRIDDEN"].includes(row.status)) {
      supplierMap[row.supplierId].skipped += row._count.id;
    }
  }

  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: Object.keys(supplierMap) } },
    select: { id: true, companyName: true },
  });

  const supplierReliability = suppliers.map((s) => {
    const m = supplierMap[s.id];
    const total = m.success + m.failed;
    const successRate = total > 0 ? Math.round((m.success / total) * 100) : 100;
    return { supplierId: s.id, companyName: s.companyName, successRate, ...m };
  });

  return NextResponse.json({
    period: { days, since },
    hiddenDueToOOS,
    repriced,
    supplierReliability,
  });
}
