import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, ShipmentStatus, OrderStatus, CourierProvider } from "@prisma/client";
import { z } from "zod";
import { sendShippingUpdate } from "@/lib/email";
import { logAudit, getAdminProfileId } from "@/lib/audit";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// ── GET — paginated shipment list ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit   = 20;
  const q       = searchParams.get("q") ?? "";
  const statusP = searchParams.get("status") as ShipmentStatus | null;

  // Orders that need fulfilment (CONFIRMED or PROCESSING, no shipment dispatched yet)
  const pendingFulfillment = statusP === null
    ? await prisma.order.count({
        where: {
          status: { in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING] },
          OR: [
            { shipment: null },
            { shipment: { dispatchedAt: null } },
          ],
        },
      })
    : 0;

  const shipmentWhere: Record<string, unknown> = {};
  if (statusP) shipmentWhere.status = statusP;
  if (q) {
    shipmentWhere.OR = [
      { trackingNumber:  { contains: q, mode: "insensitive" } },
      { awbCode:         { contains: q, mode: "insensitive" } },
      { order: { orderNumber: { contains: q, mode: "insensitive" } } },
      { order: { user: { name:  { contains: q, mode: "insensitive" } } } },
      { order: { user: { email: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [shipments, total, statusCounts] = await Promise.all([
    prisma.shipment.findMany({
      where: shipmentWhere,
      include: {
        order: {
          select: {
            id: true, orderNumber: true, status: true, total: true, createdAt: true,
            user: { select: { id: true, name: true, email: true } },
            items: { select: { productName: true, quantity: true }, take: 3 },
            shippingAddress: {
              select: { fullName: true, city: true, state: true, pincode: true },
            },
            payment: { select: { method: true, status: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.shipment.count({ where: shipmentWhere }),
    prisma.shipment.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const counts = Object.fromEntries(statusCounts.map(s => [s.status, s._count.id]));

  return NextResponse.json({
    shipments,
    total,
    pages: Math.ceil(total / limit),
    counts,
    pendingFulfillment,
  });
}

// ── POST — create/update shipment (mark as shipped) ───────────────────────────

const shipSchema = z.object({
  orderId:       z.string().cuid(),
  courier:       z.nativeEnum(CourierProvider).optional(),
  carrierName:   z.string().max(100).optional(),
  trackingNumber: z.string().max(100).optional(),
  trackingUrl:   z.string().url().optional().or(z.literal("")),
  awbCode:       z.string().max(100).optional(),
  estimatedAt:   z.string().datetime().optional(),
  weightGrams:   z.number().int().positive().optional(),
  lengthCm:      z.number().int().positive().optional(),
  widthCm:       z.number().int().positive().optional(),
  heightCm:      z.number().int().positive().optional(),
  codAmount:     z.number().nonnegative().optional(),
  internalNote:  z.string().max(500).optional(),
  status:        z.nativeEnum(ShipmentStatus).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = shipSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const {
    orderId, courier, carrierName, trackingNumber, trackingUrl, awbCode,
    estimatedAt, weightGrams, lengthCm, widthCm, heightCm,
    codAmount, internalNote, status: requestedStatus,
  } = body.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, shipment: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const shipmentStatus = requestedStatus ?? ShipmentStatus.PICKED_UP;

  // Determine order status to set
  const orderStatusMap: Partial<Record<ShipmentStatus, OrderStatus>> = {
    [ShipmentStatus.PACKED]:           OrderStatus.PROCESSING,
    [ShipmentStatus.PICKED_UP]:        OrderStatus.PROCESSING,
    [ShipmentStatus.IN_TRANSIT]:       OrderStatus.SHIPPED,
    [ShipmentStatus.OUT_FOR_DELIVERY]: OrderStatus.OUT_FOR_DELIVERY,
    [ShipmentStatus.DELIVERED]:        OrderStatus.DELIVERED,
    [ShipmentStatus.FAILED_DELIVERY]:  OrderStatus.SHIPPED,
    [ShipmentStatus.RETURNED]:         OrderStatus.RETURNED,
  };
  const newOrderStatus = orderStatusMap[shipmentStatus];

  const now = new Date();
  const dateFields: Record<string, Date> = { dispatchedAt: now };
  if (shipmentStatus === ShipmentStatus.PACKED)           dateFields.packedAt         = now;
  if (shipmentStatus === ShipmentStatus.PICKED_UP)        dateFields.pickedUpAt       = now;
  if (shipmentStatus === ShipmentStatus.OUT_FOR_DELIVERY) dateFields.outForDeliveryAt = now;
  if (shipmentStatus === ShipmentStatus.DELIVERED)        dateFields.deliveredAt      = now;
  if (shipmentStatus === ShipmentStatus.FAILED_DELIVERY)  dateFields.failedAt         = now;
  if (shipmentStatus === ShipmentStatus.RETURNED)         dateFields.returnedAt       = now;

  const shipment = await prisma.$transaction(async tx => {
    const s = await tx.shipment.upsert({
      where: { orderId },
      create: {
        orderId, status: shipmentStatus,
        courier, carrierName, trackingNumber, trackingUrl: trackingUrl || undefined,
        awbCode, estimatedAt: estimatedAt ? new Date(estimatedAt) : undefined,
        weightGrams, lengthCm, widthCm, heightCm,
        codAmount, internalNote,
        ...dateFields,
      },
      update: {
        status: shipmentStatus,
        ...(courier        ? { courier }        : {}),
        ...(carrierName    ? { carrierName }    : {}),
        ...(trackingNumber ? { trackingNumber } : {}),
        ...(trackingUrl    ? { trackingUrl }    : {}),
        ...(awbCode        ? { awbCode }        : {}),
        ...(estimatedAt    ? { estimatedAt: new Date(estimatedAt) } : {}),
        ...(weightGrams    ? { weightGrams }    : {}),
        ...(lengthCm       ? { lengthCm }       : {}),
        ...(widthCm        ? { widthCm }        : {}),
        ...(heightCm       ? { heightCm }       : {}),
        ...(codAmount !== undefined ? { codAmount } : {}),
        ...(internalNote   ? { internalNote }   : {}),
        ...dateFields,
      },
    });

    if (newOrderStatus) {
      await tx.order.update({ where: { id: orderId }, data: { status: newOrderStatus } });
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: newOrderStatus,
          note: [
            `Shipment ${shipmentStatus.toLowerCase().replace(/_/g, " ")}`,
            trackingNumber ? `AWB: ${awbCode ?? trackingNumber}` : null,
            courier ? `via ${courier}` : carrierName ?? null,
          ].filter(Boolean).join(" · "),
        },
      });
    }
    return s;
  });

  // Email notification on transition to SHIPPED / IN_TRANSIT
  if (
    newOrderStatus === OrderStatus.SHIPPED &&
    order.user?.email &&
    (trackingNumber || awbCode)
  ) {
    const courierLabel = courierDisplayName(courier, carrierName);
    sendShippingUpdate(order.user.email, {
      orderNumber: order.orderNumber,
      customerName: order.user.name ?? "Customer",
      carrier: courierLabel,
      trackingNumber: awbCode ?? trackingNumber ?? "N/A",
      trackingUrl: trackingUrl || undefined,
    }).catch(console.error);
  }

  // Audit
  const adminProfileId = await getAdminProfileId(session.user.id);
  if (adminProfileId) {
    logAudit({
      adminId: adminProfileId, action: "ORDER_STATUS_CHANGED",
      resourceType: "order", resourceId: orderId,
      resourceName: order.orderNumber,
      newValue: { shipmentStatus, trackingNumber, courier },
      req,
    });
  }

  return NextResponse.json(shipment, { status: 201 });
}

function courierDisplayName(courier?: CourierProvider, fallback?: string): string {
  const labels: Partial<Record<CourierProvider, string>> = {
    SHIPROCKET: "Shiprocket", DELHIVERY: "Delhivery", DTDC: "DTDC",
    INDIA_POST: "India Post", BLUEDART: "BlueDart", XPRESSBEES: "Xpressbees",
    ECOM_EXPRESS: "Ecom Express", OTHER: fallback ?? "Courier",
  };
  return (courier && labels[courier]) ?? fallback ?? "Courier";
}
