import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ShipmentStatus, OrderStatus } from "@prisma/client";
import { sendShippingUpdate } from "@/lib/email";

// Delhivery sends shipment status updates via webhook (push tracking).
// Auth: shared secret in X-Delhivery-Token header (optional).

function verifyToken(token: string | null): boolean {
  const secret = process.env.DELHIVERY_WEBHOOK_TOKEN;
  if (!secret || secret.startsWith("REPLACE")) return true;  // not enforced if not set
  return token === secret;
}

// ── Status mapping ────────────────────────────────────────────────────────────

// Delhivery scan status codes → our ShipmentStatus
const DL_STATUS_MAP: Record<string, ShipmentStatus> = {
  "TRANSIT":                ShipmentStatus.IN_TRANSIT,
  "IN TRANSIT":             ShipmentStatus.IN_TRANSIT,
  "PICKUP":                 ShipmentStatus.PICKED_UP,
  "MANIFESTED":             ShipmentStatus.PENDING,
  "OUT FOR DELIVERY":       ShipmentStatus.OUT_FOR_DELIVERY,
  "OFD":                    ShipmentStatus.OUT_FOR_DELIVERY,
  "DELIVERED":              ShipmentStatus.DELIVERED,
  "DLVD":                   ShipmentStatus.DELIVERED,
  "FAILED DELIVERY":        ShipmentStatus.FAILED_DELIVERY,
  "UNDELIVERED":            ShipmentStatus.FAILED_DELIVERY,
  "RTO":                    ShipmentStatus.RETURNED,
  "RTO DELIVERED":          ShipmentStatus.RETURNED,
  "RETURN DELIVERED":       ShipmentStatus.RETURNED,
  "LOST":                   ShipmentStatus.LOST,
};

const ORDER_STATUS_MAP: Partial<Record<ShipmentStatus, OrderStatus>> = {
  [ShipmentStatus.PICKED_UP]:        OrderStatus.PROCESSING,
  [ShipmentStatus.IN_TRANSIT]:       OrderStatus.SHIPPED,
  [ShipmentStatus.OUT_FOR_DELIVERY]: OrderStatus.OUT_FOR_DELIVERY,
  [ShipmentStatus.DELIVERED]:        OrderStatus.DELIVERED,
  [ShipmentStatus.FAILED_DELIVERY]:  OrderStatus.SHIPPED,
  [ShipmentStatus.RETURNED]:         OrderStatus.RETURNED,
};

function matchStatus(raw: string): ShipmentStatus | null {
  const upper = raw.toUpperCase().trim();
  return DL_STATUS_MAP[upper] ?? null;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-delhivery-token") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (!verifyToken(token ?? null)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await req.text();
  let payload: Record<string, unknown>;
  try { payload = JSON.parse(rawBody); } catch {
    // Delhivery sometimes sends form-encoded — try URL decode
    try {
      const form = new URLSearchParams(rawBody);
      const data = form.get("data");
      payload = data ? JSON.parse(data) : {};
    } catch { return NextResponse.json({ error: "Invalid payload" }, { status: 400 }); }
  }

  // Delhivery sends an array of shipments or a single shipment
  const shipmentData = Array.isArray(payload.ShipmentData)
    ? payload.ShipmentData
    : (payload.ShipmentData ? [payload.ShipmentData] : [payload]);

  for (const entry of shipmentData as Record<string, unknown>[]) {
    const s       = (entry.Shipment ?? entry) as Record<string, unknown>;
    const awb     = s.AWB ?? s.Waybill ?? s.waybill;
    const scans   = (s.Scans ?? []) as Record<string, unknown>[];
    const latestScan = scans[0];
    const scanDetail = latestScan?.ScanDetail as Record<string, unknown> | undefined;
    const statusObj  = s.Status as Record<string, unknown> | undefined;
    const statusRaw  = String(scanDetail?.ScanType ?? statusObj?.Status ?? "");
    const location   = String(scanDetail?.ScannedLocation ?? "");
    const eventDate  = String(scanDetail?.ScanDateTime ?? new Date().toISOString());

    if (!awb) continue;

    const shipment = await prisma.shipment.findFirst({
      where: { OR: [{ awbCode: String(awb) }, { trackingNumber: String(awb) }] },
      include: { order: { include: { user: { select: { email: true, name: true } } } } },
    });
    if (!shipment) continue;

    const newStatus      = matchStatus(statusRaw);
    const newOrderStatus = newStatus ? ORDER_STATUS_MAP[newStatus] : null;

    // Record tracking event
    await prisma.shipmentEvent.create({
      data: {
        shipmentId:  shipment.id,
        status:      statusRaw,
        location:    location || null,
        description: String(scanDetail?.Instructions ?? statusRaw),
        source:      "delhivery",
        rawPayload:  entry as import("@prisma/client").Prisma.InputJsonValue,
        eventAt:     new Date(eventDate),
      },
    });

    if (newStatus && newStatus !== shipment.status) {
      const dateFields: Record<string, Date> = {};
      const now = new Date();
      if (newStatus === ShipmentStatus.PICKED_UP)        dateFields.pickedUpAt       = now;
      if (newStatus === ShipmentStatus.OUT_FOR_DELIVERY) dateFields.outForDeliveryAt = now;
      if (newStatus === ShipmentStatus.DELIVERED)        dateFields.deliveredAt      = now;
      if (newStatus === ShipmentStatus.FAILED_DELIVERY)  dateFields.failedAt         = now;
      if (newStatus === ShipmentStatus.RETURNED)         { dateFields.returnedAt = now; dateFields.rtoDeliveredAt = now; }

      await prisma.$transaction([
        prisma.shipment.update({
          where: { id: shipment.id },
          data:  { status: newStatus, ...dateFields },
        }),
        ...(newOrderStatus ? [
          prisma.order.update({
            where: { id: shipment.orderId },
            data:  { status: newOrderStatus },
          }),
          prisma.orderStatusHistory.create({
            data: {
              orderId: shipment.orderId,
              status:  newOrderStatus,
              note:    `${statusRaw}${location ? ` (${location})` : ""} — Delhivery`,
            },
          }),
        ] : []),
      ]);

      if (newStatus === ShipmentStatus.DELIVERED && shipment.order.user?.email) {
        sendShippingUpdate(shipment.order.user.email, {
          orderNumber:   shipment.order.orderNumber,
          customerName:  shipment.order.user.name ?? "Customer",
          carrier:       "Delhivery",
          trackingNumber: String(awb),
          trackingUrl:   shipment.trackingUrl ?? undefined,
        }).catch(() => {});
      }
    }
  }

  return NextResponse.json({ ok: true });
}
