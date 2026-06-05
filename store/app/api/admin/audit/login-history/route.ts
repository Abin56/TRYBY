import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccess } from "@/lib/rbac";

// GET /api/admin/audit/login-history
// Returns login attempts with optional filters
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "audit:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page      = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit     = 50;
  const email     = searchParams.get("email");
  const ip        = searchParams.get("ip");
  const success   = searchParams.get("success");  // "true" | "false" | null
  const since     = searchParams.get("since");
  const until     = searchParams.get("until");
  const exportCsv = searchParams.get("export") === "csv";

  const where: Record<string, unknown> = {};
  if (email)           where.email   = { contains: email, mode: "insensitive" };
  if (ip)              where.ip      = { contains: ip };
  if (success !== null && success !== "") where.success = success === "true";
  if (since || until) {
    where.createdAt = {
      ...(since ? { gte: new Date(since) } : {}),
      ...(until ? { lte: new Date(until) } : {}),
    };
  }

  if (exportCsv) {
    const rows = await prisma.loginAttempt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take:    10_000,
    });
    const header = "id,email,ip,success,failure_reason,user_agent,created_at";
    const csv = [
      header,
      ...rows.map(r => [
        r.id, r.email, r.ip ?? "", r.success,
        r.failureReason ?? "",
        `"${((r as { userAgent?: string }).userAgent ?? "").replace(/"/g, '""')}"`,
        r.createdAt.toISOString(),
      ].join(",")),
    ].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="login-history-${Date.now()}.csv"`,
      },
    });
  }

  const [attempts, total] = await Promise.all([
    prisma.loginAttempt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.loginAttempt.count({ where }),
  ]);

  // Summary stats
  const windowStart = new Date(Date.now() - 24 * 3600 * 1000);
  const [last24hFailed, last24hSuccess] = await Promise.all([
    prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: windowStart } } }),
    prisma.loginAttempt.count({ where: { success: true,  createdAt: { gte: windowStart } } }),
  ]);

  return NextResponse.json({
    attempts,
    total,
    pages: Math.ceil(total / limit),
    stats: { last24hFailed, last24hSuccess },
  });
}
