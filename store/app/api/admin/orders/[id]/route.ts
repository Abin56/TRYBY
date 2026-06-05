import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole, OrderStatus } from "@prisma/client";
import { sendShippingUpdate, sendReviewRequest } from "@/lib/email";
import { logAudit, getAdminProfileId } from "@/lib/audit";
import {
  notifyOrderConfirmed, notifyOrderShipped, notifyOrderDelivered,
} from "@/lib/notifications";
import { isEnabled } from "@/lib/feature-flags";
import { getProvider, pickProvider } from "@/lib/shipping";
import type { CreateShipmentInput } from "@/lib/shipping";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const updateSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional(),
  carrierName: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      shippingAddress: true,
      billingAddress: true,
      items: {
        include: {
          product: { select: { name: true, slug: true } },
          variant: { select: { sku: true, size: true, color: true } },
        },
      },
      payment: true,
      shipment: true,
      coupon: { select: { code: true, type: true, value: true } },
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = updateSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { status, note, trackingNumber, trackingUrl, carrierName } = body.data;

  await prisma.$transaction(async tx => {
    await tx.order.update({ where: { id }, data: { status } });
    await tx.orderStatusHistory.create({ data: { orderId: id, status, note } });

    if (trackingNumber) {
      await tx.shipment.upsert({
        where:  { orderId: id },
        update: { trackingNumber, trackingUrl, carrierName, dispatchedAt: new Date() },
        create: { orderId: id, trackingNumber, trackingUrl, carrierName, dispatchedAt: new Date() },
      });
    }
  });

  // ── Auto-book Shiprocket AWB when marking as SHIPPED ─────────────────────
  // Only fires when: (1) flag is on, (2) no AWB exists yet, (3) no manual
  // tracking number was supplied in this request.
  if (status === OrderStatus.SHIPPED && !trackingNumber) {
    const autoAwb = await isEnabled("shiprocket_auto_awb").catch(() => false);
    if (autoAwb) {
      try {
        const orderForShip = await prisma.order.findUnique({
          where:   { id },
          include: {
            user:            { select: { name: true, email: true, phone: true } },
            shippingAddress: true,
            items:           { select: { productName: true, variantSku: true, quantity: true, unitPrice: true } },
            payment:         { select: { method: true } },
            shipment:        { select: { awbCode: true } },
          },
        });

        // Only proceed if order exists and has no AWB yet
        if (orderForShip && !orderForShip.shipment?.awbCode) {
          const settingsRow = await prisma.siteSettings
            .findUnique({ where: { key: "shipping_config" } })
            .catch(() => null);
          const shippingCfg = (settingsRow?.extraData ?? {}) as Record<string, unknown>;
          const preferred   = (shippingCfg.preferredCouriers as string[] | undefined) ?? [];

          // Try DB-stored Shiprocket creds first, fall back to env
          const srSettingsRow = await prisma.siteSettings
            .findUnique({ where: { key: "shiprocket_credentials" } })
            .catch(() => null);
          const srCreds = (srSettingsRow?.extraData ?? {}) as Record<string, unknown>;
          if (srCreds.email && srCreds.password) {
            process.env.SHIPROCKET_EMAIL    = srCreds.email    as string;
            process.env.SHIPROCKET_PASSWORD = srCreds.password as string;
          }

          const provider = pickProvider(preferred) ?? getProvider("SHIPROCKET");
          if (provider) {
            const isCOD = orderForShip.payment?.method === "COD";
            const input: CreateShipmentInput = {
              orderId:       orderForShip.id,
              orderNumber:   orderForShip.orderNumber,
              pickupPincode: process.env.STORE_PINCODE ?? "400001",
              customerName:  orderForShip.shippingAddress.fullName,
              customerPhone: orderForShip.shippingAddress.phone,
              customerEmail: orderForShip.user.email ?? undefined,
              address:       `${orderForShip.shippingAddress.line1}${orderForShip.shippingAddress.line2 ? ", " + orderForShip.shippingAddress.line2 : ""}`,
              city:          orderForShip.shippingAddress.city,
              state:         orderForShip.shippingAddress.state,
              pincode:       orderForShip.shippingAddress.pincode,
              weightGrams:   500,
              lengthCm:      15,
              widthCm:       12,
              heightCm:      8,
              orderValue:    Number(orderForShip.total ?? 0),
              isCOD,
              codAmount:     isCOD ? Number(orderForShip.total ?? 0) : undefined,
              items:         orderForShip.items.map(i => ({
                name:     i.productName,
                sku:      i.variantSku ?? undefined,
                quantity: i.quantity,
                price:    Number(i.unitPrice),
              })),
            };

            const result = await provider.createShipment(input);
            if (result.success && result.awbCode) {
              const { ShipmentStatus, CourierProvider } = await import("@prisma/client");
              const now = new Date();
              // Use interactive transaction so we can use the upserted shipment's id
              await prisma.$transaction(async tx => {
                const s = await tx.shipment.upsert({
                  where:  { orderId: id },
                  create: {
                    orderId:           id,
                    status:            ShipmentStatus.PICKED_UP,
                    courier:           CourierProvider.SHIPROCKET,
                    awbCode:           result.awbCode,
                    trackingNumber:    result.awbCode,
                    trackingUrl:       result.trackingUrl,
                    labelUrl:          result.labelUrl,
                    courierShipmentId: result.courierShipmentId,
                    courierOrderId:    result.courierOrderId,
                    estimatedAt:       result.estimatedDate ? new Date(result.estimatedDate) : undefined,
                    dispatchedAt:      now,
                    pickedUpAt:        now,
                    weightGrams:       500, lengthCm: 15, widthCm: 12, heightCm: 8,
                  },
                  update: {
                    status:            ShipmentStatus.PICKED_UP,
                    courier:           CourierProvider.SHIPROCKET,
                    awbCode:           result.awbCode,
                    trackingNumber:    result.awbCode,
                    trackingUrl:       result.trackingUrl,
                    labelUrl:          result.labelUrl,
                    courierShipmentId: result.courierShipmentId,
                    courierOrderId:    result.courierOrderId,
                    estimatedAt:       result.estimatedDate ? new Date(result.estimatedDate) : undefined,
                    dispatchedAt:      now,
                    pickedUpAt:        now,
                  },
                });
                await tx.shipmentEvent.create({
                  data: {
                    shipmentId:  s.id,
                    status:      "Shipment Created",
                    description: `Auto-booked via Shiprocket. AWB: ${result.awbCode}`,
                    source:      "shiprocket",
                    eventAt:     now,
                  },
                });
              });
            }
          }
        }
      } catch (autoBookErr) {
        // Auto-book is fire-and-forget — log but never block the order status update
        console.error("[auto-awb] booking failed:", autoBookErr);
      }
    }
  }

  // ── In-app notifications per status transition ───────────────────────────
  {
    const orderForNotif = await prisma.order.findUnique({
      where:   { id },
      select:  { userId: true, orderNumber: true, shipment: { select: { trackingNumber: true } } },
    });
    if (orderForNotif) {
      const { userId, orderNumber, shipment } = orderForNotif;
      if (status === OrderStatus.CONFIRMED) {
        notifyOrderConfirmed(userId, orderNumber, id).catch(() => {});
      } else if (status === OrderStatus.SHIPPED) {
        notifyOrderShipped(userId, orderNumber, id, trackingNumber ?? shipment?.trackingNumber ?? undefined).catch(() => {});
      } else if (status === OrderStatus.DELIVERED) {
        notifyOrderDelivered(userId, orderNumber, id).catch(() => {});
      }
    }
  }

  // Review request email — send when order is DELIVERED
  if (status === OrderStatus.DELIVERED) {
    const fullOrder = await prisma.order.findUnique({
      where:   { id },
      include: {
        user:  { select: { email: true, name: true } },
        items: {
          select: {
            id:          true,
            productName: true,
            product:     { select: { slug: true, images: { where: { isPrimary: true }, take: 1 } } },
          },
        },
      },
    });
    if (fullOrder?.user?.email) {
      sendReviewRequest(fullOrder.user.email, {
        customerName: fullOrder.user.name ?? "Customer",
        orderNumber:  fullOrder.orderNumber,
        items: fullOrder.items.map(item => ({
          name:        item.productName,
          imageUrl:    item.product.images[0]?.url,
          productSlug: item.product.slug,
          orderItemId: item.id,
        })),
      }).catch(() => {});
    }
  }

  const internalHeaders = {
    "Content-Type": "application/json",
    "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
  };
  const baseUrl = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

  // SLA event — fire-and-forget
  fetch(`${baseUrl}/api/internal/sla/order-event`, {
    method:  "POST",
    headers: internalHeaders,
    body:    JSON.stringify({ orderId: id, orderStatus: status }),
  }).catch(() => {});

  // Settlement engine — fire on DELIVERED
  if (status === OrderStatus.DELIVERED) {
    fetch(`${baseUrl}/api/internal/finance/order-settled`, {
      method:  "POST",
      headers: internalHeaders,
      body:    JSON.stringify({ orderId: id, deliveredAt: new Date().toISOString() }),
    }).catch(() => {});
  }

  // Email on shipped
  if (status === OrderStatus.SHIPPED) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: true, shipment: true },
    });
    if (order?.user?.email) {
      sendShippingUpdate(order.user.email, {
        orderNumber: order.orderNumber,
        customerName: order.user.name ?? "Customer",
        carrier: carrierName ?? order.shipment?.carrierName ?? undefined,
        trackingNumber: trackingNumber ?? order.shipment?.trackingNumber ?? "N/A",
        trackingUrl: trackingUrl ?? order.shipment?.trackingUrl ?? undefined,
      }).catch(console.error);
    }
  }

  const updated = await prisma.order.findUnique({ where: { id }, include: { shipment: true } });

  // Audit
  const adminProfileId = await getAdminProfileId(session.user.id);
  if (adminProfileId) {
    logAudit({
      adminId:      adminProfileId,
      action:       "ORDER_STATUS_CHANGED",
      resourceType: "order",
      resourceId:   id,
      resourceName: updated?.orderNumber ?? id,
      newValue:     { status, trackingNumber, carrierName },
      req,
    });
  }

  return NextResponse.json(updated);
}
