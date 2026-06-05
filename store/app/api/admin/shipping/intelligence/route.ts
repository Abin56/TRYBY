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

  const shipments = await prisma.shipment.findMany({
    where:   { createdAt: { gte: since } },
    include: {
      order: {
        select: {
          shippingAddress: { select: { state: true, pincode: true } },
          payment: { select: { method: true } },
        },
      },
    },
  });

  // ── Courier success rate ───────────────────────────────────────────────────
  type CourierIntel = {
    name:           string;
    total:          number;
    delivered:      number;
    failedDelivery: number;
    rto:            number;
    lost:           number;
    successRate:    number;
    rtoRate:        number;
    failedRate:     number;
    avgDeliveryHours: number | null;
    codOrders:      number;
    codSuccess:     number;
    codSuccessRate: number;
  };

  const courierMap: Record<string, CourierIntel> = {};

  for (const s of shipments) {
    const key = s.courier ?? s.carrierName ?? "UNKNOWN";
    if (!courierMap[key]) {
      courierMap[key] = { name: key, total: 0, delivered: 0, failedDelivery: 0, rto: 0, lost: 0, successRate: 0, rtoRate: 0, failedRate: 0, avgDeliveryHours: null, codOrders: 0, codSuccess: 0, codSuccessRate: 0 };
    }
    courierMap[key].total++;
    if (s.status === "DELIVERED")        courierMap[key].delivered++;
    if (s.status === "FAILED_DELIVERY")  courierMap[key].failedDelivery++;
    if (s.status === "RETURNED")         courierMap[key].rto++;
    if (s.status === "LOST")             courierMap[key].lost++;
    if (s.codAmount && Number(s.codAmount) > 0) {
      courierMap[key].codOrders++;
      if (s.codCollected) courierMap[key].codSuccess++;
    }
  }

  // Compute delivery times and rates
  for (const [key, stat] of Object.entries(courierMap)) {
    stat.successRate = stat.total > 0 ? Math.round((stat.delivered / stat.total) * 100) : 0;
    stat.rtoRate     = stat.total > 0 ? Math.round((stat.rto        / stat.total) * 100) : 0;
    stat.failedRate  = stat.total > 0 ? Math.round((stat.failedDelivery / stat.total) * 100) : 0;
    stat.codSuccessRate = stat.codOrders > 0 ? Math.round((stat.codSuccess / stat.codOrders) * 100) : 0;

    const delivered = shipments.filter(
      s => (s.courier ?? s.carrierName ?? "UNKNOWN") === key && s.deliveredAt && s.dispatchedAt
    );
    if (delivered.length) {
      stat.avgDeliveryHours = Math.round(
        delivered.reduce((sum, s) => sum + (s.deliveredAt!.getTime() - s.dispatchedAt!.getTime()) / (1000 * 60 * 60), 0) / delivered.length
      );
    }
  }

  // ── Delivery time by state ─────────────────────────────────────────────────
  const stateMap: Record<string, { total: number; delivered: number; totalHours: number }> = {};
  for (const s of shipments) {
    const state = s.order.shippingAddress?.state ?? "Unknown";
    if (!stateMap[state]) stateMap[state] = { total: 0, delivered: 0, totalHours: 0 };
    stateMap[state].total++;
    if (s.status === "DELIVERED" && s.deliveredAt && s.dispatchedAt) {
      stateMap[state].delivered++;
      stateMap[state].totalHours += (s.deliveredAt.getTime() - s.dispatchedAt.getTime()) / (1000 * 60 * 60);
    }
  }

  const stateStats = Object.entries(stateMap).map(([state, d]) => ({
    state,
    total:        d.total,
    delivered:    d.delivered,
    avgDeliveryHours: d.delivered > 0 ? Math.round(d.totalHours / d.delivered) : null,
  })).sort((a, b) => b.total - a.total);

  // ── COD analytics ──────────────────────────────────────────────────────────
  const codShipments   = shipments.filter(s => s.codAmount && Number(s.codAmount) > 0);
  const codCollected   = codShipments.filter(s => s.codCollected).length;
  const codDelivered   = codShipments.filter(s => s.status === "DELIVERED").length;
  const codRTO         = codShipments.filter(s => s.status === "RETURNED").length;
  const codSuccessRate = codShipments.length > 0 ? Math.round((codCollected / codShipments.length) * 100) : 0;
  const codRTORate     = codShipments.length > 0 ? Math.round((codRTO / codShipments.length) * 100) : 0;

  // ── SLA performance ────────────────────────────────────────────────────────
  const withEstimate = shipments.filter(s => s.estimatedAt);
  const onTime       = withEstimate.filter(s => s.deliveredAt && s.estimatedAt && s.deliveredAt <= s.estimatedAt).length;
  const late         = withEstimate.filter(s => s.deliveredAt && s.estimatedAt && s.deliveredAt > s.estimatedAt).length;
  const pending      = withEstimate.filter(s => !s.deliveredAt && s.estimatedAt && s.estimatedAt < new Date()).length;
  const slaRate      = withEstimate.length > 0 ? Math.round(((onTime) / withEstimate.length) * 100) : null;

  // ── Top delayed regions ────────────────────────────────────────────────────
  const delayedByState: Record<string, number> = {};
  for (const s of shipments) {
    if (!s.deliveredAt || !s.estimatedAt) continue;
    if (s.deliveredAt > s.estimatedAt) {
      const state = s.order.shippingAddress?.state ?? "Unknown";
      delayedByState[state] = (delayedByState[state] ?? 0) + 1;
    }
  }
  const topDelayedRegions = Object.entries(delayedByState)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([state, count]) => ({ state, count }));

  // ── Overall summary ────────────────────────────────────────────────────────
  const total     = shipments.length;
  const delivered = shipments.filter(s => s.status === "DELIVERED").length;
  const rto       = shipments.filter(s => s.status === "RETURNED").length;
  const lost      = shipments.filter(s => s.status === "LOST").length;

  return NextResponse.json({
    period: { days, since: since.toISOString() },
    summary: {
      total,
      delivered,
      rto,
      lost,
      inTransit: shipments.filter(s => ["IN_TRANSIT", "OUT_FOR_DELIVERY", "PICKED_UP"].includes(s.status)).length,
      deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : null,
      rtoRate:      total > 0 ? Math.round((rto / total) * 100) : null,
    },
    couriers:      Object.values(courierMap).sort((a, b) => b.total - a.total),
    stateStats,
    cod: {
      total:       codShipments.length,
      collected:   codCollected,
      rto:         codRTO,
      successRate: codSuccessRate,
      rtoRate:     codRTORate,
    },
    sla: {
      withEstimate: withEstimate.length,
      onTime,
      late,
      pendingOverdue: pending,
      rate: slaRate,
    },
    topDelayedRegions,
  });
}
