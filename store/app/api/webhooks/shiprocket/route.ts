import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ShipmentStatus, OrderStatus } from "@prisma/client";
import { sendShippingUpdate } from "@/lib/email";
import { notifyOrderShipped, notifyOrderDelivered } from "@/lib/notifications";
import {
  isShiprocketSecretConfigured,
  verifyShiprocketSignature,
} from "@/lib/shipping/webhook-auth";

// ── Signature verification ────────────────────────────────────────────────────
// Priority: DB SiteSettings["shiprocket_credentials"].webhookSecret → env var.

async function getWebhookSecret(): Promise<string | null> {
  try {
    const row = await prisma.siteSettings.findUnique({
      where:  { key: "shiprocket_credentials" },
      select: { extraData: true },
    });
    const secret = (row?.extraData as Record<string, unknown> | null)?.webhookSecret as string | undefined;
    if (secret) return secret;
  } catch { /* fallthrough */ }
  return process.env.SHIPROCKET_WEBHOOK_SECRET ?? null;
}

// ── Status mapping ────────────────────────────────────────────────────────────

const SR_STATUS_MAP: Record<string, ShipmentStatus> = {
  // Pre-pickup
  "NEW":                        ShipmentStatus.PENDING,
  "PICKUP SCHEDULED":           ShipmentStatus.PENDING,
  "PICKUP GENERATED":           ShipmentStatus.PENDING,
  "PICKUP QUEUED":              ShipmentStatus.PENDING,
  "OUT FOR PICKUP":             ShipmentStatus.PENDING,
  "PICKUP ERROR":               ShipmentStatus.PENDING,

  // Picked up
  "PICKED UP":                  ShipmentStatus.PICKED_UP,
  "PICKUP":                     ShipmentStatus.PICKED_UP,

  // In transit
  "IN TRANSIT":                 ShipmentStatus.IN_TRANSIT,
  "TRANSIT":                    ShipmentStatus.IN_TRANSIT,
  "REACHED AT DESTINATION HUB": ShipmentStatus.IN_TRANSIT,
  "ARRIVED AT DESTINATION":     ShipmentStatus.IN_TRANSIT,
  "DISPATCH AFTER HOLD":        ShipmentStatus.IN_TRANSIT,

  // Out for delivery
  "OUT FOR DELIVERY":           ShipmentStatus.OUT_FOR_DELIVERY,
  "OFD":                        ShipmentStatus.OUT_FOR_DELIVERY,

  // Delivered
  "DELIVERED":                  ShipmentStatus.DELIVERED,
  "DELIVERY CONFIRMED":         ShipmentStatus.DELIVERED,

  // Failed delivery
  "UNDELIVERED":                ShipmentStatus.FAILED_DELIVERY,
  "DELIVERY ATTEMPTED":         ShipmentStatus.FAILED_DELIVERY,
  "DELIVERY FAILED":            ShipmentStatus.FAILED_DELIVERY,
  "NOT DELIVERED":              ShipmentStatus.FAILED_DELIVERY,
  "DELIVERY EXCEPTION":         ShipmentStatus.FAILED_DELIVERY,
  "RETURN PENDING":             ShipmentStatus.FAILED_DELIVERY,

  // RTO / Returns
  "RTO INITIATED":              ShipmentStatus.RETURNED,
  "RTO":                        ShipmentStatus.RETURNED,
  "RTO IN TRANSIT":             ShipmentStatus.RETURNED,
  "RTO OUT FOR DELIVERY":       ShipmentStatus.RETURNED,
  "RTO DELIVERED":              ShipmentStatus.RETURNED,
  "RETURN":                     ShipmentStatus.RETURNED,
  "RETURNED":                   ShipmentStatus.RETURNED,
  "RETURN DELIVERED":           ShipmentStatus.RETURNED,

  // Lost
  "LOST":                       ShipmentStatus.LOST,
  "SHIPMENT LOST":              ShipmentStatus.LOST,
};

// Shipment status → order status
const ORDER_STATUS_MAP: Partial<Record<ShipmentStatus, OrderStatus>> = {
  [ShipmentStatus.PICKED_UP]:        OrderStatus.PROCESSING,
  [ShipmentStatus.IN_TRANSIT]:       OrderStatus.SHIPPED,
  [ShipmentStatus.OUT_FOR_DELIVERY]: OrderStatus.OUT_FOR_DELIVERY,
  [ShipmentStatus.DELIVERED]:        OrderStatus.DELIVERED,
  [ShipmentStatus.FAILED_DELIVERY]:  OrderStatus.SHIPPED,
  [ShipmentStatus.RETURNED]:         OrderStatus.RETURNED,
};

// ── Audit helper ──────────────────────────────────────────────────────────────
// Uses a "system" admin id for automated webhook events.

async function writeAuditLog(payload: {
  resourceId:   string;
  resourceName: string;
  oldValue?:    unknown;
  newValue?:    unknown;
  metadata?:    Record<string, unknown>;
}) {
  try {
    const admin = await prisma.adminProfile.findFirst({ select: { id: true } });
    if (!admin) return;
    await prisma.auditLog.create({
      data: {
        adminId:      admin.id,
        action:       "ORDER_STATUS_CHANGED",
        resourceType: "shipment",
        resourceId:   payload.resourceId,
        resourceName: payload.resourceName,
        oldValue:     (payload.oldValue ?? undefined) as never,
        newValue:     (payload.newValue ?? undefined) as never,
        metadata:     (payload.metadata ?? undefined) as never,
        ipAddress:    "webhook:shiprocket",
        userAgent:    "Shiprocket-Webhook/1.0",
      },
    });
  } catch {
    // Audit is observational — never block the webhook response
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody   = await req.text();
  const signature = req.headers.get("x-shiprocket-hmac")
    ?? req.headers.get("x-shiprocket-signature")
    ?? null;

  const secret = await getWebhookSecret();

  // Fail CLOSED: a missing/unconfigured secret is a server misconfiguration,
  // not an auth failure — surface it as 500 so it is caught in monitoring and
  // never causes us to silently process forged, unsigned webhooks.
  if (!isShiprocketSecretConfigured(secret)) {
    console.error("[shiprocket-webhook] SHIPROCKET_WEBHOOK_SECRET not configured — rejecting");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  if (!verifyShiprocketSignature(rawBody, signature, secret)) {
    console.warn("[shiprocket-webhook] signature mismatch — rejecting");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = Array.isArray(payload) ? payload[0] : payload;
  if (!event || typeof event !== "object") {
    return NextResponse.json({ ok: true, skipped: "empty payload" });
  }

  const awb = ((event.awb ?? event.awb_code ?? event.AWB) as string | undefined)?.trim();
  if (!awb) return NextResponse.json({ ok: true, skipped: "no AWB in payload" });

  const statusRaw  = ((event.current_status ?? event.status ?? event.Status ?? "") as string).trim();
  const location   = ((event.current_location ?? event.location ?? event.Location ?? "") as string).trim();
  const remark     = ((event.remark ?? event.activity ?? event.Remark ?? statusRaw) as string).trim();
  const eventDate  = ((event.updated_at ?? event.scan_date_time ?? event.EventDate ?? "") as string).trim()
    || new Date().toISOString();

  const shipment = await prisma.shipment.findFirst({
    where:   { OR: [{ awbCode: awb }, { trackingNumber: awb }] },
    include: {
      order: {
        include: { user: { select: { id: true, email: true, name: true } } },
      },
    },
  });

  if (!shipment) {
    console.warn(`[shiprocket-webhook] shipment not found for AWB ${awb}`);
    return NextResponse.json({ ok: true, skipped: "shipment not found" });
  }

  const newStatus      = SR_STATUS_MAP[statusRaw.toUpperCase()] ?? null;
  const newOrderStatus = newStatus ? ORDER_STATUS_MAP[newStatus] : null;

  // ── Always record the tracking event ─────────────────────────────────────
  await prisma.shipmentEvent.create({
    data: {
      shipmentId:  shipment.id,
      status:      statusRaw,
      location:    location || null,
      description: remark !== statusRaw ? remark : statusRaw,
      source:      "shiprocket",
      rawPayload:  event as never,
      eventAt:     new Date(eventDate),
    },
  });

  // ── Audit: record tracking event arrival ─────────────────────────────────
  await writeAuditLog({
    resourceId:   shipment.id,
    resourceName: shipment.order.orderNumber,
    newValue:     { awb, statusRaw, newStatus, location, remark },
    metadata:     {
      provider:    "SHIPROCKET",
      orderNumber: shipment.order.orderNumber,
      eventAt:     eventDate,
      location,
    },
  });

  // ── Only update state if status changed ───────────────────────────────────
  if (newStatus && newStatus !== shipment.status) {
    const now         = new Date();
    const dateFields: Record<string, Date> = {};
    const prevStatus  = shipment.status;

    if (newStatus === ShipmentStatus.PICKED_UP)        dateFields.pickedUpAt       = now;
    if (newStatus === ShipmentStatus.OUT_FOR_DELIVERY) dateFields.outForDeliveryAt = now;
    if (newStatus === ShipmentStatus.DELIVERED)        dateFields.deliveredAt      = now;
    if (newStatus === ShipmentStatus.FAILED_DELIVERY)  dateFields.failedAt         = now;
    if (newStatus === ShipmentStatus.RETURNED) {
      dateFields.returnedAt = now;
      if (statusRaw.toUpperCase().includes("RTO DELIVERED") ||
          statusRaw.toUpperCase().includes("RETURN DELIVERED")) {
        dateFields.rtoDeliveredAt = now;
      } else {
        dateFields.rtoInitiatedAt = now;
      }
    }

    await prisma.$transaction([
      prisma.shipment.update({
        where: { id: shipment.id },
        data:  { status: newStatus, ...dateFields },
      }),
      ...(newOrderStatus
        ? [
            prisma.order.update({
              where: { id: shipment.orderId },
              data:  { status: newOrderStatus },
            }),
            prisma.orderStatusHistory.create({
              data: {
                orderId: shipment.orderId,
                status:  newOrderStatus,
                note:    `${statusRaw}${location ? ` · ${location}` : ""} — Shiprocket`,
              },
            }),
          ]
        : []),
    ]);

    // ── Audit: state transition ───────────────────────────────────────────
    await writeAuditLog({
      resourceId:   shipment.id,
      resourceName: shipment.order.orderNumber,
      oldValue:     { status: prevStatus },
      newValue:     { status: newStatus, ...dateFields },
      metadata:     {
        provider:    "SHIPROCKET",
        awb,
        orderNumber: shipment.order.orderNumber,
        triggeredBy: "webhook",
      },
    });

    // ── Customer notifications ────────────────────────────────────────────
    const user = shipment.order.user;

    if (newStatus === ShipmentStatus.OUT_FOR_DELIVERY && user?.id) {
      notifyOrderShipped(
        user.id,
        shipment.order.orderNumber,
        shipment.orderId,
        awb,
      ).catch(() => {});
    }

    if (newStatus === ShipmentStatus.DELIVERED) {
      if (user?.email) {
        sendShippingUpdate(user.email, {
          orderNumber:    shipment.order.orderNumber,
          customerName:   user.name ?? "Customer",
          carrier:        "Shiprocket",
          trackingNumber: awb,
          trackingUrl:    shipment.trackingUrl ?? undefined,
        }).catch(() => {});
      }
      if (user?.id) {
        notifyOrderDelivered(
          user.id,
          shipment.order.orderNumber,
          shipment.orderId,
        ).catch(() => {});
      }
    }
  }

  return NextResponse.json({ ok: true, awb, status: newStatus ?? "unmapped" });
}
