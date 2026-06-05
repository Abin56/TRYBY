/**
 * SLA Engine — TRYBY Supplier Marketplace
 *
 * Thresholds (configurable here):
 *   acceptance  : must accept within 4 h   (AT_RISK at 3h, BREACHED at 4h)
 *   shipping    : must ship  within 48 h   (AT_RISK at 36h, BREACHED at 48h)
 *   delivery    : must deliver within 7 d  (AT_RISK at 5d,  BREACHED at 7d)
 *
 * These are stored on each SupplierSLA row so historical records are accurate
 * even if thresholds change in the future.
 */

import { prisma } from "@/lib/db";
import { SlaStatus } from "@prisma/client";

// ── Threshold constants (hours) ────────────────────────────────────────────
export const SLA_THRESHOLDS = {
  acceptance: { slaHrs: 4,    atRiskHrs: 3   },
  shipping:   { slaHrs: 48,   atRiskHrs: 36  },
  delivery:   { slaHrs: 7*24, atRiskHrs: 5*24 },
} as const;

// ── Status derivation ──────────────────────────────────────────────────────

/** Compute SLA status for one dimension given actual elapsed time (hours). */
export function deriveStatus(
  elapsedHrs: number | null,
  completed: boolean,
  slaHrs: number,
  atRiskHrs: number,
): SlaStatus {
  if (!completed && elapsedHrs === null) return SlaStatus.NOT_APPLICABLE;

  // If the event already happened — judge based on how long it took
  if (completed && elapsedHrs !== null) {
    if (elapsedHrs <= atRiskHrs) return SlaStatus.ON_TIME;
    if (elapsedHrs <= slaHrs)    return SlaStatus.AT_RISK;  // was slow but still within SLA
    return SlaStatus.BREACHED;
  }

  // Still pending — judge based on time elapsed so far
  if (elapsedHrs !== null) {
    if (elapsedHrs >= slaHrs)   return SlaStatus.BREACHED;
    if (elapsedHrs >= atRiskHrs) return SlaStatus.AT_RISK;
    return SlaStatus.ON_TIME;
  }

  return SlaStatus.NOT_APPLICABLE;
}

/** Roll up three dimension statuses into one overall status. */
export function deriveOverall(
  acceptance: SlaStatus,
  shipping:   SlaStatus,
  delivery:   SlaStatus,
): SlaStatus {
  const statuses = [acceptance, shipping, delivery];
  if (statuses.some(s => s === SlaStatus.BREACHED))        return SlaStatus.BREACHED;
  if (statuses.some(s => s === SlaStatus.AT_RISK))         return SlaStatus.AT_RISK;
  if (statuses.every(s => s === SlaStatus.ON_TIME))        return SlaStatus.ON_TIME;
  if (statuses.every(s => s === SlaStatus.NOT_APPLICABLE)) return SlaStatus.NOT_APPLICABLE;
  // Mix of ON_TIME and NOT_APPLICABLE (order in-flight) → ON_TIME so far
  return SlaStatus.ON_TIME;
}

// ── Core upsert function ───────────────────────────────────────────────────

export type SlaEventType =
  | "ORDER_CREATED"
  | "ORDER_ACCEPTED"    // supplier acknowledges the order
  | "ORDER_PACKED"      // supplier marks packed / ready to ship
  | "ORDER_SHIPPED"     // tracking added, status → SHIPPED
  | "ORDER_DELIVERED";  // status → DELIVERED

interface UpsertSlaArgs {
  supplierId:    string;
  orderId:       string;
  orderNumber:   string;
  event:         SlaEventType;
  eventAt:       Date;
}

/**
 * Create or update the SupplierSLA row for an order.
 * Idempotent — safe to call multiple times for the same event.
 */
export async function upsertOrderSLA({
  supplierId,
  orderId,
  orderNumber,
  event,
  eventAt,
}: UpsertSlaArgs): Promise<void> {
  const now  = eventAt;
  const nowMs = now.getTime();

  // ── Fetch or create the SLA record ──
  let sla = await prisma.supplierSLA.findUnique({ where: { orderId } });

  if (!sla) {
    // Only create on ORDER_CREATED (or if backfilling)
    sla = await prisma.supplierSLA.create({
      data: {
        supplierId,
        orderId,
        orderNumber,
        orderCreatedAt: event === "ORDER_CREATED" ? now : new Date(nowMs - 60_000),
        acceptanceSlaHrs: SLA_THRESHOLDS.acceptance.slaHrs,
        shippingSlaHrs:   SLA_THRESHOLDS.shipping.slaHrs,
        deliverySlaHrs:   SLA_THRESHOLDS.delivery.slaHrs,
      },
    });
  }

  // ── Compute updated fields based on the incoming event ──
  const patch: Record<string, unknown> = {};

  const orderCreatedMs = sla.orderCreatedAt.getTime();

  if (event === "ORDER_ACCEPTED" && !sla.acceptedAt) {
    const acceptedAt = now;
    const acceptanceMinutes = Math.round((nowMs - orderCreatedMs) / 60_000);
    const acceptanceHrs = acceptanceMinutes / 60;

    patch.acceptedAt         = acceptedAt;
    patch.acceptanceMinutes  = acceptanceMinutes;
    patch.acceptanceStatus   = deriveStatus(
      acceptanceHrs, true,
      SLA_THRESHOLDS.acceptance.slaHrs,
      SLA_THRESHOLDS.acceptance.atRiskHrs,
    );
  }

  if (event === "ORDER_PACKED") {
    // Packing doesn't change SLA dimensions directly; just update acceptedAt if not set
    if (!sla.acceptedAt) {
      patch.acceptedAt        = now;
      patch.acceptanceMinutes = Math.round((nowMs - orderCreatedMs) / 60_000);
    }
  }

  if (event === "ORDER_SHIPPED" && !sla.shippedAt) {
    const shippedAt = now;
    const baseMs    = sla.acceptedAt ? sla.acceptedAt.getTime() : orderCreatedMs;
    const shippingMinutes = Math.round((nowMs - baseMs) / 60_000);
    const shippingHrs = shippingMinutes / 60;

    patch.shippedAt       = shippedAt;
    patch.shippingMinutes = shippingMinutes;
    patch.shippingStatus  = deriveStatus(
      shippingHrs, true,
      SLA_THRESHOLDS.shipping.slaHrs,
      SLA_THRESHOLDS.shipping.atRiskHrs,
    );
  }

  if (event === "ORDER_DELIVERED" && !sla.deliveredAt) {
    const deliveredAt = now;
    const baseMs      = sla.shippedAt ? sla.shippedAt.getTime() : orderCreatedMs;
    const deliveryMinutes = Math.round((nowMs - baseMs) / 60_000);
    const deliveryHrs = deliveryMinutes / 60;

    patch.deliveredAt      = deliveredAt;
    patch.deliveryMinutes  = deliveryMinutes;
    patch.deliveryStatus   = deriveStatus(
      deliveryHrs, true,
      SLA_THRESHOLDS.delivery.slaHrs,
      SLA_THRESHOLDS.delivery.atRiskHrs,
    );
  }

  // Recompute overall status using latest values after patch
  const latestAcceptance = (patch.acceptanceStatus ?? sla.acceptanceStatus) as SlaStatus;
  const latestShipping   = (patch.shippingStatus   ?? sla.shippingStatus)   as SlaStatus;
  const latestDelivery   = (patch.deliveryStatus   ?? sla.deliveryStatus)   as SlaStatus;
  patch.overallStatus    = deriveOverall(latestAcceptance, latestShipping, latestDelivery);

  if (Object.keys(patch).length > 1) { // >1 means more than just overallStatus
    await prisma.supplierSLA.update({ where: { orderId }, data: patch });
  } else {
    // Still update overallStatus to reflect in-flight risk
    await prisma.supplierSLA.update({
      where: { orderId },
      data:  { overallStatus: patch.overallStatus as SlaStatus },
    });
  }

  // ── Recompute supplier-level SLA score ──
  await recomputeSupplierSlaScore(supplierId);
}

// ── Re-assess open SLA records (called periodically or on-demand) ──────────

/**
 * Re-evaluate all open (non-delivered, non-cancelled) SLA records for a supplier
 * and flip AT_RISK / BREACHED as time elapses.
 */
export async function refreshOpenSLAs(supplierId?: string): Promise<number> {
  const now = new Date();
  const where = {
    deliveredAt:  null,
    cancelledAt:  null,
    ...(supplierId ? { supplierId } : {}),
  };

  const open = await prisma.supplierSLA.findMany({ where });
  let updated = 0;

  for (const sla of open) {
    const createdMs  = sla.orderCreatedAt.getTime();
    const nowMs      = now.getTime();

    // Re-derive acceptance status if still pending
    let acceptanceStatus = sla.acceptanceStatus as SlaStatus;
    if (!sla.acceptedAt) {
      const elapsedHrs = (nowMs - createdMs) / 3_600_000;
      acceptanceStatus = deriveStatus(elapsedHrs, false, sla.acceptanceSlaHrs, SLA_THRESHOLDS.acceptance.atRiskHrs);
    }

    // Re-derive shipping status if accepted but not shipped
    let shippingStatus = sla.shippingStatus as SlaStatus;
    if (sla.acceptedAt && !sla.shippedAt) {
      const elapsedHrs = (nowMs - sla.acceptedAt.getTime()) / 3_600_000;
      shippingStatus = deriveStatus(elapsedHrs, false, sla.shippingSlaHrs, SLA_THRESHOLDS.shipping.atRiskHrs);
    }

    // Re-derive delivery status if shipped but not delivered
    let deliveryStatus = sla.deliveryStatus as SlaStatus;
    if (sla.shippedAt && !sla.deliveredAt) {
      const elapsedHrs = (nowMs - sla.shippedAt.getTime()) / 3_600_000;
      deliveryStatus = deriveStatus(elapsedHrs, false, sla.deliverySlaHrs, SLA_THRESHOLDS.delivery.atRiskHrs);
    }

    const overallStatus = deriveOverall(acceptanceStatus, shippingStatus, deliveryStatus);

    // Only write if something changed
    if (
      acceptanceStatus !== sla.acceptanceStatus ||
      shippingStatus   !== sla.shippingStatus   ||
      deliveryStatus   !== sla.deliveryStatus   ||
      overallStatus    !== sla.overallStatus
    ) {
      await prisma.supplierSLA.update({
        where: { id: sla.id },
        data:  { acceptanceStatus, shippingStatus, deliveryStatus, overallStatus },
      });
      updated++;
    }
  }

  if (supplierId && updated > 0) await recomputeSupplierSlaScore(supplierId);

  return updated;
}

// ── Supplier-level SLA score aggregation ─────────────────────────────────

export async function recomputeSupplierSlaScore(supplierId: string): Promise<number> {
  const records = await prisma.supplierSLA.findMany({
    where:  { supplierId, cancelledAt: null },
    select: { overallStatus: true },
  });

  if (records.length === 0) return 0;

  const onTime = records.filter(r => r.overallStatus === SlaStatus.ON_TIME).length;
  const slaScore = Math.round((onTime / records.length) * 100);

  // Also update avgShippingHrs and avgDeliveryDays from actual data
  const completed = await prisma.supplierSLA.findMany({
    where:  { supplierId, deliveredAt: { not: null }, cancelledAt: null },
    select: { shippingMinutes: true, deliveryMinutes: true },
  });

  const avgShippingHrs = completed.length > 0
    ? completed.reduce((s, r) => s + (r.shippingMinutes ?? 0), 0) / completed.length / 60
    : 0;

  const avgDeliveryDays = completed.length > 0
    ? completed.reduce((s, r) => s + (r.deliveryMinutes ?? 0), 0) / completed.length / 60 / 24
    : 0;

  await prisma.supplier.update({
    where: { id: supplierId },
    data: {
      slaScore:       slaScore,
      avgShippingHrs: avgShippingHrs,
      avgDeliveryDays: avgDeliveryDays,
    },
  });

  return slaScore;
}
