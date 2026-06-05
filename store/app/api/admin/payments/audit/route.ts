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
  const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") ?? "1")));

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const [paymentSummary, webhookSummary, methodBreakdown, mismatchCount] = await Promise.all([
    // Payment totals by status
    prisma.payment.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
      _sum:   { amount: true, refundedAmount: true },
    }),

    // Webhook event totals
    prisma.webhookEvent.groupBy({
      by: ["eventType", "processed"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    }),

    // Payment method breakdown (successful only)
    prisma.payment.groupBy({
      by: ["method"],
      where: { status: "CAPTURED", createdAt: { gte: since } },
      _count: { id: true },
      _sum:   { amount: true },
    }),

    // Mismatches: CAPTURED but order not CONFIRMED/beyond
    prisma.payment.count({
      where: {
        status: "CAPTURED",
        order: { status: "PENDING" },
        createdAt: { gte: since },
      },
    }),
  ]);

  // Build payment stats
  const stats: Record<string, { count: number; amount: number }> = {};
  for (const row of paymentSummary) {
    stats[row.status] = {
      count:  row._count.id,
      amount: Number(row._sum.amount ?? 0),
    };
  }

  const totalRevenue    = stats["CAPTURED"]?.amount ?? 0;
  const totalCaptures   = stats["CAPTURED"]?.count  ?? 0;
  const totalFailed     = stats["FAILED"]?.count    ?? 0;
  const totalPending    = stats["PENDING"]?.count   ?? 0;
  const totalRefunded   = (stats["REFUNDED"]?.amount ?? 0) + (stats["PARTIALLY_REFUNDED"]?.amount ?? 0);

  // Build webhook stats
  const webhookStats: Record<string, { total: number; succeeded: number; failed: number }> = {};
  for (const row of webhookSummary) {
    if (!webhookStats[row.eventType]) {
      webhookStats[row.eventType] = { total: 0, succeeded: 0, failed: 0 };
    }
    webhookStats[row.eventType].total += row._count.id;
    if (row.processed) webhookStats[row.eventType].succeeded += row._count.id;
    else               webhookStats[row.eventType].failed    += row._count.id;
  }

  const totalWebhooks        = Object.values(webhookStats).reduce((s, e) => s + e.total, 0);
  const totalWebhooksFailed  = Object.values(webhookStats).reduce((s, e) => s + e.failed, 0);

  // Reliability score: 0 if mismatches, penalise failed webhooks
  const baseScore = totalCaptures === 0 ? 100 : Math.max(0, 100 - (mismatchCount / Math.max(1, totalCaptures)) * 50);
  const webhookPenalty = totalWebhooks === 0 ? 0 : (totalWebhooksFailed / totalWebhooks) * 30;
  const reliabilityScore = Math.round(Math.max(0, baseScore - webhookPenalty));

  return NextResponse.json({
    period: { days, since: since.toISOString() },
    payments: {
      totalRevenue,
      totalCaptures,
      totalFailed,
      totalPending,
      totalRefunded,
      byStatus: stats,
    },
    methods: methodBreakdown.map(m => ({
      method: m.method,
      count:  m._count.id,
      amount: Number(m._sum.amount ?? 0),
    })),
    webhooks: {
      total:   totalWebhooks,
      failed:  totalWebhooksFailed,
      byEvent: webhookStats,
    },
    mismatches: mismatchCount,
    reliabilityScore,
  });
}
