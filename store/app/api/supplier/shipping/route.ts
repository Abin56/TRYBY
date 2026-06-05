import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

// GET: all shipments for this supplier's orders
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const page   = parseInt(searchParams.get("page") ?? "1");
  const limit  = 20;
  const status = searchParams.get("status");

  // Find orders with items from this supplier
  const supplierOrderIds = await prisma.orderItem.findMany({
    where: { product: { supplierId: supplier.id } },
    select: { orderId: true },
    distinct: ["orderId"],
  });
  const orderIds = supplierOrderIds.map(o => o.orderId);

  const where = {
    orderId: { in: orderIds },
    ...(status ? { status: status as never } : {}),
  };

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
            shippingAddress: {
              select: { fullName: true, line1: true, city: true, state: true, pincode: true, phone: true },
            },
            items: {
              where: { product: { supplierId: supplier.id } },
              select: { productName: true, quantity: true, variantSku: true, size: true, color: true },
            },
          },
        },
        events: {
          orderBy: { eventAt: "desc" },
          take: 5,
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.shipment.count({ where }),
  ]);

  return NextResponse.json({ shipments, total, pages: Math.ceil(total / limit) });
}

// PATCH: supplier enters tracking number / AWB / marks packed or shipped
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const {
    orderId,
    trackingNumber,
    trackingUrl,
    awbCode,
    carrierName,
    courier,
    estimatedAt,
    action,
  } = await req.json() as {
    orderId: string;
    trackingNumber?: string;
    trackingUrl?: string;
    awbCode?: string;
    carrierName?: string;
    courier?: string;
    estimatedAt?: string;
    action?: "mark_shipped";
  };

  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  // Verify supplier owns this order
  const hasItem = await prisma.orderItem.findFirst({
    where: { orderId, product: { supplierId: supplier.id } },
  });
  if (!hasItem) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const existing = await prisma.shipment.findUnique({ where: { orderId } });

  const updateData: Record<string, unknown> = {};
  if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
  if (trackingUrl !== undefined)    updateData.trackingUrl    = trackingUrl;
  if (awbCode !== undefined)        updateData.awbCode        = awbCode;
  if (carrierName !== undefined)    updateData.carrierName    = carrierName;
  if (courier !== undefined)        updateData.courier        = courier;
  if (estimatedAt !== undefined)    updateData.estimatedAt    = new Date(estimatedAt);

  if (action === "mark_shipped") {
    updateData.status       = "PICKED_UP";
    updateData.dispatchedAt = new Date();
  }

  const shipment = existing
    ? await prisma.shipment.update({ where: { orderId }, data: updateData })
    : await prisma.shipment.create({ data: { orderId, ...updateData } });

  // Update order status to SHIPPED if tracking entered
  if (action === "mark_shipped") {
    await prisma.order.update({ where: { id: orderId }, data: { status: "SHIPPED" } });
  }

  await prisma.supplierActivityLog.create({
    data: {
      supplierId: supplier.id,
      action:     "TRACKING_ADDED",
      detail:     `Updated shipment for order ${orderId}. Tracking: ${trackingNumber ?? awbCode ?? "—"}`,
      resourceId: orderId,
    },
  });

  return NextResponse.json({ shipment });
}
