import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

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

  const where = {
    product: { supplierId: supplier.id },
    ...(status ? { order: { status: status as never } } : {}),
  };

  const [supplierOrderItems, total] = await Promise.all([
    prisma.orderItem.findMany({
      where,
      select: {
        id: true,
        orderId: true,
        productName: true,
        variantSku: true,
        size: true,
        color: true,
        quantity: true,
        unitPrice: true,
        total: true,
        imageUrl: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            createdAt: true,
            total: true,
            user: { select: { name: true, email: true } },
            shippingAddress: {
              select: { fullName: true, line1: true, city: true, state: true, pincode: true, phone: true },
            },
            shipment: {
              select: {
                id: true,
                status: true,
                carrierName: true,
                trackingNumber: true,
                trackingUrl: true,
                awbCode: true,
                estimatedAt: true,
                packedAt: true,
                dispatchedAt: true,
                deliveredAt: true,
              },
            },
          },
        },
      },
      orderBy: { order: { createdAt: "desc" } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.orderItem.count({ where }),
  ]);

  const commissionRate = Number(supplier.commissionRate);
  const items = supplierOrderItems.map(item => ({
    ...item,
    supplierEarning: Number(item.total) * (1 - commissionRate),
    platformFee:     Number(item.total) * commissionRate,
  }));

  return NextResponse.json({ items, total, pages: Math.ceil(total / limit), commissionRate });
}

// Supplier order actions: accept, reject, pack, ready_to_ship
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const { orderId, action, reason } = await req.json() as {
    orderId: string;
    action: "accept" | "reject" | "pack" | "ready_to_ship";
    reason?: string;
  };

  if (!orderId || !action) {
    return NextResponse.json({ error: "orderId and action required" }, { status: 400 });
  }

  // Verify this order has items from this supplier
  const hasItem = await prisma.orderItem.findFirst({
    where: { orderId, product: { supplierId: supplier.id } },
  });
  if (!hasItem) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shipment: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  let newOrderStatus = order.status;
  let activityAction = "";
  let activityDetail = "";
  let shipmentUpdate: Record<string, unknown> | null = null;

  switch (action) {
    case "accept":
      if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
        return NextResponse.json({ error: "Order cannot be accepted in current status" }, { status: 400 });
      }
      newOrderStatus = "CONFIRMED";
      activityAction = "ORDER_ACCEPTED";
      activityDetail = `Accepted order #${order.orderNumber}`;
      break;

    case "reject":
      if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
        return NextResponse.json({ error: "Order cannot be rejected in current status" }, { status: 400 });
      }
      newOrderStatus = "CANCELLED";
      activityAction = "ORDER_REJECTED";
      activityDetail = `Rejected order #${order.orderNumber}${reason ? `: ${reason}` : ""}`;
      break;

    case "pack":
      if (order.status !== "CONFIRMED" && order.status !== "PROCESSING") {
        return NextResponse.json({ error: "Order must be confirmed before packing" }, { status: 400 });
      }
      newOrderStatus = "PROCESSING";
      activityAction = "ORDER_PACKED";
      activityDetail = `Marked order #${order.orderNumber} as packed`;
      shipmentUpdate = { packedAt: new Date(), status: "PACKED" };
      break;

    case "ready_to_ship":
      if (order.status !== "PROCESSING") {
        return NextResponse.json({ error: "Order must be packed before marking ready to ship" }, { status: 400 });
      }
      newOrderStatus = "PROCESSING";
      activityAction = "ORDER_READY_TO_SHIP";
      activityDetail = `Marked order #${order.orderNumber} as ready to ship`;
      shipmentUpdate = { status: "PACKED" };
      break;

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  // Run updates in transaction
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: newOrderStatus },
    });

    if (shipmentUpdate) {
      if (order.shipment) {
        await tx.shipment.update({
          where: { orderId },
          data: shipmentUpdate,
        });
      } else {
        await tx.shipment.create({
          data: { orderId, ...shipmentUpdate },
        });
      }
    }

    await tx.supplierActivityLog.create({
      data: {
        supplierId: supplier.id,
        action:     activityAction,
        detail:     activityDetail,
        resourceId: orderId,
      },
    });
  });

  return NextResponse.json({ ok: true, newStatus: newOrderStatus });
}
