import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, ShipmentStatus, OrderStatus, CourierProvider } from "@prisma/client";
import { z } from "zod";
import { getProvider, aggregateServiceability, pickProvider } from "@/lib/shipping";
import type { CreateShipmentInput } from "@/lib/shipping";
import { getAdminProfileId, logAudit } from "@/lib/audit";
import { sendShippingUpdate } from "@/lib/email";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const STORE_PINCODE = process.env.STORE_PINCODE ?? "400001";

const bookSchema = z.object({
  orderId:    z.string().cuid(),
  provider:   z.string().optional(),           // "SHIPROCKET" | "DELHIVERY" — auto-select if omitted
  courierId:  z.union([z.string(), z.number()]).optional(), // provider's courier ID from serviceability
  // Override defaults — all optional
  weightGrams: z.number().int().positive().optional(),
  lengthCm:    z.number().int().positive().optional(),
  widthCm:     z.number().int().positive().optional(),
  heightCm:    z.number().int().positive().optional(),
  note:        z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = bookSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { orderId, provider: providerName, courierId, weightGrams, lengthCm, widthCm, heightCm, note } = body.data;

  // Load order with all required data
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user:            { select: { name: true, email: true, phone: true } },
      shippingAddress: true,
      items:           { select: { productName: true, variantSku: true, quantity: true, unitPrice: true } },
      payment:         { select: { method: true, status: true } },
      shipment:        true,
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.shipment?.awbCode) {
    return NextResponse.json({ error: "This order already has an AWB — cancel the existing shipment first" }, { status: 409 });
  }

  // Select provider
  const settingsRow = await prisma.siteSettings.findUnique({ where: { key: "shipping_config" } }).catch(() => null);
  const settings    = (settingsRow?.extraData ?? {}) as Record<string, unknown>;
  const preferred   = (settings.preferredCouriers as string[] | undefined) ?? [];

  const provider = providerName
    ? getProvider(providerName)
    : pickProvider(preferred);

  if (!provider) return NextResponse.json({ error: "No shipping provider configured" }, { status: 503 });

  const isCOD = order.payment?.method === "COD";

  const input: CreateShipmentInput = {
    orderId:       order.id,
    orderNumber:   order.orderNumber,
    pickupPincode: STORE_PINCODE,
    customerName:  order.shippingAddress.fullName,
    customerPhone: order.shippingAddress.phone,
    customerEmail: order.user.email ?? undefined,
    address:       `${order.shippingAddress.line1}${order.shippingAddress.line2 ? ", " + order.shippingAddress.line2 : ""}`,
    city:          order.shippingAddress.city,
    state:         order.shippingAddress.state,
    pincode:       order.shippingAddress.pincode,
    weightGrams:   weightGrams ?? 500,
    lengthCm:      lengthCm   ?? 15,
    widthCm:       widthCm    ?? 12,
    heightCm:      heightCm   ?? 8,
    orderValue:    Number(order.total),
    isCOD,
    codAmount:     isCOD ? Number(order.total) : undefined,
    items:         order.items.map(i => ({
      name:     i.productName,
      sku:      i.variantSku,
      quantity: i.quantity,
      price:    Number(i.unitPrice),
    })),
    courierId,
  };

  const result = await provider.createShipment(input);

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Shipment creation failed", rawResponse: result.rawResponse }, { status: 502 });
  }

  // Map provider name to CourierProvider enum
  const courierMap: Record<string, CourierProvider> = {
    SHIPROCKET: CourierProvider.SHIPROCKET,
    DELHIVERY:  CourierProvider.DELHIVERY,
  };
  const courierEnum = courierMap[provider.name] ?? CourierProvider.OTHER;

  // Persist shipment
  const shipment = await prisma.$transaction(async tx => {
    const s = await tx.shipment.upsert({
      where: { orderId },
      create: {
        orderId,
        status:           ShipmentStatus.PICKED_UP,
        courier:          courierEnum,
        awbCode:          result.awbCode,
        trackingNumber:   result.awbCode,
        trackingUrl:      result.trackingUrl,
        labelUrl:         result.labelUrl,
        courierShipmentId: result.courierShipmentId,
        courierOrderId:   result.courierOrderId,
        estimatedAt:      result.estimatedDate ? new Date(result.estimatedDate) : undefined,
        weightGrams:      weightGrams ?? 500,
        lengthCm:         lengthCm   ?? 15,
        widthCm:          widthCm    ?? 12,
        heightCm:         heightCm   ?? 8,
        codAmount:        isCOD ? Number(order.total) : undefined,
        internalNote:     note ?? null,
        dispatchedAt:     new Date(),
        pickedUpAt:       new Date(),
      },
      update: {
        status:           ShipmentStatus.PICKED_UP,
        courier:          courierEnum,
        awbCode:          result.awbCode,
        trackingNumber:   result.awbCode,
        trackingUrl:      result.trackingUrl,
        labelUrl:         result.labelUrl,
        courierShipmentId: result.courierShipmentId,
        courierOrderId:   result.courierOrderId,
        estimatedAt:      result.estimatedDate ? new Date(result.estimatedDate) : undefined,
        dispatchedAt:     new Date(),
        pickedUpAt:       new Date(),
      },
    });

    await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.SHIPPED } });
    await tx.orderStatusHistory.create({
      data: { orderId, status: OrderStatus.SHIPPED, note: `Booked via ${provider.name}. AWB: ${result.awbCode}` },
    });

    // Create initial shipment event
    await tx.shipmentEvent.create({
      data: {
        shipmentId:  s.id,
        status:      "Shipment Created",
        description: `Booked via ${provider.name}`,
        source:      provider.name.toLowerCase(),
        eventAt:     new Date(),
      },
    });

    return s;
  });

  // Send customer email (non-blocking)
  if (order.user.email) {
    sendShippingUpdate(order.user.email, {
      orderNumber:   order.orderNumber,
      customerName:  order.user.name ?? "Customer",
      carrier:       provider.name,
      trackingNumber: result.awbCode ?? "N/A",
      trackingUrl:   result.trackingUrl,
    }).catch(console.error);
  }

  // Audit
  const adminProfileId = await getAdminProfileId(session.user.id);
  if (adminProfileId) {
    logAudit({
      adminId:      adminProfileId,
      action:       "ORDER_STATUS_CHANGED",
      resourceType: "shipment",
      resourceId:   shipment.id,
      resourceName: order.orderNumber,
      newValue:     { provider: provider.name, awbCode: result.awbCode, courierId },
      req,
    });
  }

  return NextResponse.json({ shipment, booking: result });
}

// ── GET serviceability for an order ──────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where:   { id: orderId },
    include: { shippingAddress: true, items: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const isCOD = false; // payment method loaded separately if needed
  const totalWeight = 500; // default; admin can override at booking time

  const settingsRow = await prisma.siteSettings.findUnique({ where: { key: "shipping_config" } }).catch(() => null);
  const settings    = (settingsRow?.extraData ?? {}) as Record<string, unknown>;
  const restricted  = (settings.restrictedPincodes as string[] | undefined) ?? [];

  const result = await aggregateServiceability(
    STORE_PINCODE,
    order.shippingAddress.pincode,
    totalWeight,
    isCOD,
    Number(order.total),
    restricted,
  );

  return NextResponse.json(result);
}
