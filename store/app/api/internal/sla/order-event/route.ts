/**
 * Internal SLA event endpoint.
 *
 * Called by order status update routes (and any future webhook handlers)
 * whenever an order moves to a status that matters for SLA tracking.
 *
 * Auth: checked by INTERNAL_API_SECRET header — not exposed to public.
 * Order routes call this via `fetch("/api/internal/sla/order-event", ...)`.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { upsertOrderSLA, type SlaEventType } from "@/lib/sla";
import { guardInternalRoute } from "@/lib/internal-auth";

const ORDER_STATUS_TO_SLA_EVENT: Record<string, SlaEventType> = {
  CONFIRMED:        "ORDER_ACCEPTED",
  PROCESSING:       "ORDER_ACCEPTED",  // treat as accepted if CONFIRMED was skipped
  PACKED:           "ORDER_PACKED",
  SHIPPED:          "ORDER_SHIPPED",
  OUT_FOR_DELIVERY: "ORDER_SHIPPED",   // already shipped; no new SLA event needed but harmless
  DELIVERED:        "ORDER_DELIVERED",
};

export async function POST(req: NextRequest) {
  const denied = guardInternalRoute(req);
  if (denied) return denied;

  const {
    orderId,
    orderStatus,   // the new order status (OrderStatus enum value)
    eventAt,       // ISO string of when the event happened
  } = await req.json() as {
    orderId:     string;
    orderStatus: string;
    eventAt?:    string;
  };

  if (!orderId || !orderStatus) {
    return NextResponse.json({ error: "orderId and orderStatus required" }, { status: 400 });
  }

  const slaEvent = ORDER_STATUS_TO_SLA_EVENT[orderStatus];

  // Fetch the order to get supplierId and orderNumber
  const order = await prisma.order.findUnique({
    where:   { id: orderId },
    select:  {
      id: true, orderNumber: true, createdAt: true,
      items: {
        select: { product: { select: { supplierId: true } } },
        take:   1,
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Determine supplierId — use the first supplier on the order
  const supplierId = order.items[0]?.product?.supplierId ?? null;
  if (!supplierId) {
    // No supplier attached — might be a platform-owned product; skip SLA
    return NextResponse.json({ skipped: true, reason: "no supplier on order" });
  }

  const at = eventAt ? new Date(eventAt) : new Date();

  // For ORDER_CREATED we always upsert the record
  if (orderStatus === "PENDING") {
    await upsertOrderSLA({
      supplierId,
      orderId:     order.id,
      orderNumber: order.orderNumber,
      event:       "ORDER_CREATED",
      eventAt:     order.createdAt,
    });
    return NextResponse.json({ ok: true, event: "ORDER_CREATED" });
  }

  if (!slaEvent) {
    // Status doesn't have an SLA mapping (e.g. CANCELLED, RETURNED)
    // Mark the SLA record as cancelled so timers stop
    if (["CANCELLED", "RETURNED", "REFUNDED"].includes(orderStatus)) {
      await prisma.supplierSLA.updateMany({
        where: { orderId, cancelledAt: null },
        data:  { cancelledAt: at },
      });
    }
    return NextResponse.json({ skipped: true, reason: "no SLA event for status" });
  }

  await upsertOrderSLA({
    supplierId,
    orderId:     order.id,
    orderNumber: order.orderNumber,
    event:       slaEvent,
    eventAt:     at,
  });

  return NextResponse.json({ ok: true, event: slaEvent });
}

/**
 * GET — refresh all open SLA records (at-risk / breached recalculation).
 * Called by a cron job or admin-triggered sweep.
 */
export async function GET(req: NextRequest) {
  const denied = guardInternalRoute(req);
  if (denied) return denied;

  const { refreshOpenSLAs } = await import("@/lib/sla");
  const updated = await refreshOpenSLAs();
  return NextResponse.json({ ok: true, updated });
}
