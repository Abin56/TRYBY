/**
 * POST /api/internal/shipping/sync
 *
 * Syncs live tracking status from Shiprocket for all active shipments.
 * Maps Shiprocket status strings → local ShipmentStatus enum.
 * Intended to be called by a cron job (Vercel Cron or external scheduler).
 *
 * Auth: CRON_SECRET header (set CRON_SECRET env var).
 * Fallback: also accessible to ADMIN session for manual trigger.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ShipmentStatus, OrderStatus, UserRole } from "@prisma/client";
import { getProvider } from "@/lib/shipping";

const ACTIVE_STATUSES: ShipmentStatus[] = [
  ShipmentStatus.PENDING,
  ShipmentStatus.PACKED,
  ShipmentStatus.PICKED_UP,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.OUT_FOR_DELIVERY,
];

// Shiprocket status string → local ShipmentStatus
const SR_STATUS_MAP: Record<string, ShipmentStatus> = {
  "new":                      ShipmentStatus.PENDING,
  "pending":                  ShipmentStatus.PENDING,
  "pickup scheduled":         ShipmentStatus.PACKED,
  "pickup queued":            ShipmentStatus.PACKED,
  "picked up":                ShipmentStatus.PICKED_UP,
  "in transit":               ShipmentStatus.IN_TRANSIT,
  "out for delivery":         ShipmentStatus.OUT_FOR_DELIVERY,
  "delivered":                ShipmentStatus.DELIVERED,
  "undelivered":              ShipmentStatus.FAILED_DELIVERY,
  "delivery failed":          ShipmentStatus.FAILED_DELIVERY,
  "rto initiated":            ShipmentStatus.FAILED_DELIVERY,
  "rto in transit":           ShipmentStatus.FAILED_DELIVERY,
  "rto delivered":            ShipmentStatus.RETURNED,
  "returned to origin":       ShipmentStatus.RETURNED,
  "lost":                     ShipmentStatus.LOST,
  "cancelled":                ShipmentStatus.FAILED_DELIVERY,
};

// Local ShipmentStatus → OrderStatus
const SHIPMENT_TO_ORDER_STATUS: Partial<Record<ShipmentStatus, OrderStatus>> = {
  [ShipmentStatus.PICKED_UP]:        OrderStatus.PROCESSING,
  [ShipmentStatus.IN_TRANSIT]:       OrderStatus.SHIPPED,
  [ShipmentStatus.OUT_FOR_DELIVERY]: OrderStatus.OUT_FOR_DELIVERY,
  [ShipmentStatus.DELIVERED]:        OrderStatus.DELIVERED,
  [ShipmentStatus.RETURNED]:         OrderStatus.RETURNED,
};

function mapStatus(raw: string): ShipmentStatus | null {
  const key = raw.toLowerCase().trim();
  return SR_STATUS_MAP[key] ?? null;
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("x-cron-secret") === secret;
}

export async function POST(req: NextRequest) {
  // Allow ADMIN session OR valid cron secret
  const session = await auth();
  const isAdmin = session?.user?.role === UserRole.ADMIN;
  const isCron  = isAuthorized(req);

  if (!isAdmin && !isCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = getProvider("SHIPROCKET");
  if (!provider) {
    return NextResponse.json({ error: "Shiprocket provider not configured" }, { status: 503 });
  }

  // Load all active Shiprocket shipments with an AWB
  const shipments = await prisma.shipment.findMany({
    where: {
      status:  { in: ACTIVE_STATUSES },
      courier: "SHIPROCKET",
      awbCode: { not: null },
    },
    select: {
      id:        true,
      orderId:   true,
      awbCode:   true,
      status:    true,
    },
  });

  if (!shipments.length) {
    return NextResponse.json({ synced: 0, message: "No active Shiprocket shipments to sync" });
  }

  const results: { awb: string; oldStatus: string; newStatus: string | null; updated: boolean; error?: string }[] = [];

  for (const shipment of shipments) {
    const awb = shipment.awbCode!;
    try {
      const tracking = await provider.trackShipment(awb);
      if (!tracking.success || !tracking.currentStatus) {
        results.push({ awb, oldStatus: shipment.status, newStatus: null, updated: false, error: tracking.error });
        continue;
      }

      const newStatus = mapStatus(tracking.currentStatus);

      // Persist new events (de-dup by eventAt + status)
      if (tracking.events.length > 0) {
        const existingEvents = await prisma.shipmentEvent.findMany({
          where: { shipmentId: shipment.id },
          select: { eventAt: true, status: true },
        });
        const existingKeys = new Set(existingEvents.map(e => `${e.status}|${new Date(e.eventAt).toISOString()}`));

        const newEvents = tracking.events.filter(ev => {
          const key = `${ev.status}|${new Date(ev.eventAt).toISOString()}`;
          return !existingKeys.has(key);
        });

        if (newEvents.length > 0) {
          await prisma.shipmentEvent.createMany({
            data: newEvents.map(ev => ({
              shipmentId:  shipment.id,
              status:      ev.status,
              location:    ev.location ?? null,
              description: ev.description ?? null,
              source:      "shiprocket",
              eventAt:     new Date(ev.eventAt),
            })),
            skipDuplicates: true,
          });
        }
      }

      // Only update status if it's a forward progression
      if (!newStatus || newStatus === shipment.status) {
        results.push({ awb, oldStatus: shipment.status, newStatus: newStatus ?? null, updated: false });
        continue;
      }

      const now = new Date();
      const dateUpdate: Record<string, Date> = {};
      if (newStatus === ShipmentStatus.PICKED_UP        && !dateUpdate.pickedUpAt)       dateUpdate.pickedUpAt       = now;
      if (newStatus === ShipmentStatus.IN_TRANSIT        && !dateUpdate.dispatchedAt)     dateUpdate.dispatchedAt     = now;
      if (newStatus === ShipmentStatus.OUT_FOR_DELIVERY  && !dateUpdate.outForDeliveryAt) dateUpdate.outForDeliveryAt = now;
      if (newStatus === ShipmentStatus.DELIVERED         && !dateUpdate.deliveredAt)      dateUpdate.deliveredAt      = now;
      if (newStatus === ShipmentStatus.FAILED_DELIVERY   && !dateUpdate.failedAt)         dateUpdate.failedAt         = now;
      if (newStatus === ShipmentStatus.RETURNED          && !dateUpdate.returnedAt)       dateUpdate.returnedAt       = now;

      const newOrderStatus = SHIPMENT_TO_ORDER_STATUS[newStatus];

      await prisma.$transaction(async tx => {
        await tx.shipment.update({
          where: { id: shipment.id },
          data: { status: newStatus, ...dateUpdate },
        });

        if (newOrderStatus) {
          await tx.order.update({ where: { id: shipment.orderId }, data: { status: newOrderStatus } });
          await tx.orderStatusHistory.create({
            data: {
              orderId: shipment.orderId,
              status:  newOrderStatus,
              note:    `Auto-synced from Shiprocket: ${tracking.currentStatus}`,
            },
          });
        }
      });

      results.push({ awb, oldStatus: shipment.status, newStatus, updated: true });
    } catch (err) {
      results.push({
        awb,
        oldStatus: shipment.status,
        newStatus: null,
        updated:   false,
        error:     err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const updated = results.filter(r => r.updated).length;
  const errors  = results.filter(r => r.error).length;

  return NextResponse.json({
    synced:  shipments.length,
    updated,
    errors,
    results,
  });
}
