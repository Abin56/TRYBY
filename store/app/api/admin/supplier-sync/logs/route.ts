import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, SyncStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// GET /api/admin/supplier-sync/logs
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page       = parseInt(searchParams.get("page") ?? "1");
  const limit      = 50;
  const supplierId = searchParams.get("supplierId") ?? undefined;
  const status     = searchParams.get("status") as SyncStatus | null;
  const type       = searchParams.get("type") ?? "stock"; // "stock" | "price"
  const sessionId  = searchParams.get("sessionId") ?? undefined;

  const where: Record<string, unknown> = {};
  if (supplierId) where.supplierId = supplierId;
  if (status)     where.status = status;
  if (sessionId)  where.syncSessionId = sessionId;

  if (type === "price") {
    const [logs, total] = await Promise.all([
      prisma.priceSyncLog.findMany({
        where: supplierId ? { supplierId } : sessionId ? { syncSessionId: sessionId } : {},
        include: { supplier: { select: { companyName: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.priceSyncLog.count({ where: supplierId ? { supplierId } : {} }),
    ]);
    return NextResponse.json({ logs, total, pages: Math.ceil(total / limit), type: "price" });
  }

  const [logs, total] = await Promise.all([
    prisma.stockSyncLog.findMany({
      where,
      include: { supplier: { select: { companyName: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.stockSyncLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, pages: Math.ceil(total / limit), type: "stock" });
}
