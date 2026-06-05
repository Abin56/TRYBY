import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 30;
  const filterEventType = searchParams.get("eventType") ?? undefined;
  const filterFailed    = searchParams.get("failed") === "1";

  const where: Record<string, unknown> = {};
  if (filterEventType) where.eventType = filterEventType;
  if (filterFailed) where.processed = false;

  const [events, total, summary, recentPayments] = await Promise.all([
    // Paginated event log
    prisma.webhookEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),

    // Total count for pagination
    prisma.webhookEvent.count({ where }),

    // Summary stats
    prisma.webhookEvent.groupBy({
      by: ["eventType", "processed"],
      _count: { id: true },
    }),

    // Payments with mismatches: CAPTURED but order still PENDING, or FAILED but order not CANCELLED
    prisma.payment.findMany({
      where: {
        OR: [
          { status: "CAPTURED", order: { status: "PENDING" } },
          { status: "FAILED",   order: { status: { notIn: ["CANCELLED", "REFUNDED"] } } },
        ],
      },
      include: {
        order: {
          select: { id: true, orderNumber: true, status: true, user: { select: { email: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  // Build summary map: eventType → { total, succeeded, failed }
  const eventStats: Record<string, { total: number; succeeded: number; failed: number }> = {};
  for (const row of summary) {
    if (!eventStats[row.eventType]) {
      eventStats[row.eventType] = { total: 0, succeeded: 0, failed: 0 };
    }
    eventStats[row.eventType].total += row._count.id;
    if (row.processed) eventStats[row.eventType].succeeded += row._count.id;
    else               eventStats[row.eventType].failed    += row._count.id;
  }

  const totalEvents    = Object.values(eventStats).reduce((s, e) => s + e.total, 0);
  const totalFailed    = Object.values(eventStats).reduce((s, e) => s + e.failed, 0);
  const totalSucceeded = Object.values(eventStats).reduce((s, e) => s + e.succeeded, 0);
  const healthScore    = totalEvents === 0 ? 100 : Math.round((totalSucceeded / totalEvents) * 100);

  return NextResponse.json({
    healthScore,
    totalEvents,
    totalSucceeded,
    totalFailed,
    eventStats,
    mismatches: recentPayments,
    mismatchCount: recentPayments.length,
    events,
    total,
    pages: Math.ceil(total / limit),
  });
}
