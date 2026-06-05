import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { canAccess } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "audit:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page         = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit        = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
  const adminId      = searchParams.get("adminId");
  const action       = searchParams.get("action") as AuditAction | null;
  const resource     = searchParams.get("resource");
  const q            = searchParams.get("q") ?? "";
  const since        = searchParams.get("since");
  const until        = searchParams.get("until");
  const ipAddress    = searchParams.get("ip");
  const exportCsv    = searchParams.get("export") === "csv";

  const where: Record<string, unknown> = {};
  if (adminId)   where.adminId      = adminId;
  if (action)    where.action       = action;
  if (resource)  where.resourceType = resource;
  if (q)         where.resourceName = { contains: q, mode: "insensitive" };
  if (ipAddress) where.ipAddress    = { contains: ipAddress };

  if (since || until) {
    where.createdAt = {
      ...(since ? { gte: new Date(since) } : {}),
      ...(until ? { lte: new Date(until) } : {}),
    };
  }

  if (exportCsv) {
    // Export up to 10 000 rows as CSV — no pagination
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        admin: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take:    10_000,
    });

    const header = "id,admin_name,admin_email,action,resource_type,resource_id,resource_name,ip_address,user_agent,created_at";
    const rows   = logs.map(l => [
      l.id,
      l.admin.user?.name ?? "",
      l.admin.user?.email ?? "",
      l.action,
      l.resourceType ?? "",
      l.resourceId   ?? "",
      `"${(l.resourceName ?? "").replace(/"/g, '""')}"`,
      l.ipAddress    ?? "",
      `"${(l.userAgent ?? "").replace(/"/g, '""')}"`,
      l.createdAt.toISOString(),
    ].join(","));

    const csv = [header, ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="audit-${Date.now()}.csv"`,
      },
    });
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        admin: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  // Aggregate action breakdown for the current filter
  const actionBreakdown = await prisma.auditLog.groupBy({
    by:      ["action"],
    where,
    _count:  { _all: true },
    orderBy: { _count: { action: "desc" } },
    take:    20,
  });

  return NextResponse.json({
    logs,
    total,
    pages: Math.ceil(total / limit),
    actionBreakdown: actionBreakdown.map(r => ({ action: r.action, count: r._count._all })),
  });
}
