import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateMobileToken } from "@/lib/mobile";

// GET — Full mobile order detail (timeline, items, payment, tracking)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateMobileToken(bearer);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findFirst({
    where: { id, userId: session.userId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, images: { take: 1, select: { url: true } } } },
          variant: { select: { id: true, sku: true, size: true, color: true } },
        },
      },
      shippingAddress: true,
      shipment: true,
      payment:  { select: { id: true, method: true, status: true, amount: true, capturedAt: true, razorpayPaymentId: true } },
      returnRequests: { select: { id: true, status: true, reason: true, createdAt: true }, take: 1 },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Build timeline steps
  const timeline = buildOrderTimeline(order);

  return NextResponse.json({ order, timeline });
}

type OrderWithStatus = { status: string; createdAt: Date; shipment?: { status?: string | null; estimatedDelivery?: Date | null } | null };

function buildOrderTimeline(order: OrderWithStatus) {
  const steps = [
    { key: "placed",     label: "Order Placed",         status: "completed" },
    { key: "confirmed",  label: "Order Confirmed",       status: "pending" },
    { key: "processing", label: "Being Prepared",        status: "pending" },
    { key: "shipped",    label: "Shipped",               status: "pending" },
    { key: "delivered",  label: "Delivered",             status: "pending" },
  ];

  const statusOrder = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
  const currentIdx  = statusOrder.indexOf(order.status);

  return steps.map((step, i) => ({
    ...step,
    status: i <= currentIdx ? "completed" : i === currentIdx + 1 ? "current" : "pending",
    date:   i === 0 ? order.createdAt.toISOString() : null,
    eta:    step.key === "delivered" && order.shipment?.estimatedDelivery
      ? order.shipment.estimatedDelivery.toISOString()
      : null,
  }));
}
