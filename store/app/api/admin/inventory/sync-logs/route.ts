/**
 * Stock Sync Logs — paginated read
 * GET /api/admin/inventory/sync-logs?supplierId=&status=&sessionId=&page=
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, AdminRole, SyncStatus } from "@prisma/client";

function adminOnly(role?: string) {
  return role !== UserRole.ADMIN && role !== AdminRole.SUPER_ADMIN;
}

const PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const supplierId  = searchParams.get("supplierId")  ?? undefined;
  const status      = searchParams.get("status")      ?? undefined;
  const sessionId   = searchParams.get("sessionId")   ?? undefined;
  const variantId   = searchParams.get("variantId")   ?? undefined;
  const q           = searchParams.get("q")?.trim()   ?? "";
  const page        = Math.max(1, parseInt(searchParams.get("page") ?? "1"));

  const where = {
    ...(supplierId ? { supplierId }                           : {}),
    ...(status     ? { status: status as SyncStatus }         : {}),
    ...(sessionId  ? { syncSessionId: sessionId }             : {}),
    ...(variantId  ? { variantId }                            : {}),
    ...(q          ? { supplierSku: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [total, logs, sessions] = await Promise.all([
    prisma.stockSyncLog.count({ where }),
    prisma.stockSyncLog.findMany({
      where,
      include: {
        supplier: { select: { id: true, companyName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * PAGE_SIZE,
      take:    PAGE_SIZE,
    }),
    // List of distinct sync sessions for the supplier filter
    prisma.stockSyncLog.findMany({
      where: supplierId ? { supplierId } : {},
      distinct: ["syncSessionId"],
      select: { syncSessionId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  // Status counts for filter badges
  const statusCounts = await prisma.stockSyncLog.groupBy({
    by: ["status"],
    where: supplierId ? { supplierId } : {},
    _count: { id: true },
  });

  return NextResponse.json({
    logs,
    total,
    pages:   Math.ceil(total / PAGE_SIZE),
    page,
    sessions: sessions.map(s => ({ sessionId: s.syncSessionId, date: s.createdAt })),
    statusCounts: Object.fromEntries(statusCounts.map(s => [s.status, s._count.id])),
  });
}
