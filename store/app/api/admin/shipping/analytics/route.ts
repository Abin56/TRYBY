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
  const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") ?? "30")));

  const since = new Date();
  since.setDate(since.getDate() - days);

  // All shipments in window
  const shipments = await prisma.shipment.findMany({
    where: { createdAt: { gte: since } },
    select: {
      id: true,
      courier: true,
      carrierName: true,
      status: true,
      dispatchedAt: true,
      deliveredAt: true,
      failedAt: true,
      returnedAt: true,
      deliveryAttempts: true,
      estimatedAt: true,
      createdAt: true,
    },
  });

  // ── Delivery time analytics ────────────────────────────────────────────────
  const delivered = shipments.filter(s => s.deliveredAt && s.dispatchedAt);
  const deliveryTimesHours = delivered.map(s => {
    const ms = s.deliveredAt!.getTime() - s.dispatchedAt!.getTime();
    return ms / (1000 * 60 * 60);
  });

  const avgDeliveryHours = deliveryTimesHours.length
    ? deliveryTimesHours.reduce((a, b) => a + b, 0) / deliveryTimesHours.length
    : null;

  const medianDeliveryHours = deliveryTimesHours.length
    ? (() => {
        const sorted = [...deliveryTimesHours].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      })()
    : null;

  // ── Delayed shipments (past estimated date, not delivered) ─────────────────
  const now = new Date();
  const delayed = shipments.filter(s =>
    s.estimatedAt && s.estimatedAt < now &&
    s.status !== "DELIVERED" && s.status !== "RETURNED" && s.status !== "LOST"
  );

  // ── Courier performance ────────────────────────────────────────────────────
  type CourierStat = {
    total: number;
    delivered: number;
    failed: number;
    returned: number;
    avgDeliveryHours: number | null;
    successRate: number;
  };

  const courierMap: Record<string, CourierStat> = {};

  for (const s of shipments) {
    const key = s.courier ?? s.carrierName ?? "UNKNOWN";
    if (!courierMap[key]) {
      courierMap[key] = { total: 0, delivered: 0, failed: 0, returned: 0, avgDeliveryHours: null, successRate: 0 };
    }
    courierMap[key].total++;
    if (s.status === "DELIVERED")        courierMap[key].delivered++;
    if (s.status === "FAILED_DELIVERY")  courierMap[key].failed++;
    if (s.status === "RETURNED")         courierMap[key].returned++;
  }

  // Compute per-courier avg delivery time
  for (const [key, stat] of Object.entries(courierMap)) {
    const courierDelivered = shipments.filter(
      s => (s.courier ?? s.carrierName ?? "UNKNOWN") === key && s.deliveredAt && s.dispatchedAt
    );
    if (courierDelivered.length) {
      stat.avgDeliveryHours = courierDelivered.reduce((sum, s) => {
        return sum + (s.deliveredAt!.getTime() - s.dispatchedAt!.getTime()) / (1000 * 60 * 60);
      }, 0) / courierDelivered.length;
    }
    stat.successRate = stat.total > 0 ? Math.round((stat.delivered / stat.total) * 100) : 0;
    (stat as CourierStat & { rtoRate: number }).rtoRate =
      stat.total > 0 ? Math.round((stat.returned / stat.total) * 100) : 0;
    (stat as CourierStat & { failedRate: number }).failedRate =
      stat.total > 0 ? Math.round((stat.failed / stat.total) * 100) : 0;
  }

  // ── Status breakdown ───────────────────────────────────────────────────────
  const statusBreakdown: Record<string, number> = {};
  for (const s of shipments) {
    statusBreakdown[s.status] = (statusBreakdown[s.status] ?? 0) + 1;
  }

  // ── Daily dispatch trend (last days) ──────────────────────────────────────
  const dailyDispatch: Record<string, number> = {};
  for (const s of shipments) {
    if (s.dispatchedAt) {
      const day = s.dispatchedAt.toISOString().slice(0, 10);
      dailyDispatch[day] = (dailyDispatch[day] ?? 0) + 1;
    }
  }

  // Sort daily trend
  const dailyTrend = Object.entries(dailyDispatch)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    period: { days, since: since.toISOString() },
    totals: {
      total:     shipments.length,
      delivered: shipments.filter(s => s.status === "DELIVERED").length,
      inTransit: shipments.filter(s => ["IN_TRANSIT", "OUT_FOR_DELIVERY", "PICKED_UP"].includes(s.status)).length,
      failed:    shipments.filter(s => s.status === "FAILED_DELIVERY").length,
      returned:  shipments.filter(s => s.status === "RETURNED").length,
      pending:   shipments.filter(s => ["PENDING", "PACKED"].includes(s.status)).length,
      delayed:   delayed.length,
    },
    delivery: {
      avgHours:    avgDeliveryHours    ? Math.round(avgDeliveryHours)    : null,
      medianHours: medianDeliveryHours ? Math.round(medianDeliveryHours) : null,
      avgDays:     avgDeliveryHours    ? +(avgDeliveryHours / 24).toFixed(1) : null,
    },
    couriers: Object.entries(courierMap).map(([name, stat]) => {
      const s = stat as CourierStat & { rtoRate: number; failedRate: number };
      return {
        name,
        ...stat,
        avgDeliveryHours: stat.avgDeliveryHours ? Math.round(stat.avgDeliveryHours) : null,
        rtoRate:          s.rtoRate   ?? 0,
        failedRate:       s.failedRate ?? 0,
      };
    }).sort((a, b) => b.total - a.total),
    statusBreakdown,
    dailyTrend,
    delayedShipments: delayed.map(s => ({ id: s.id, estimatedAt: s.estimatedAt, status: s.status })),
  });
}
