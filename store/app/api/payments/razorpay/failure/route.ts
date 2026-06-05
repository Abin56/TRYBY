import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { razorpayOrderId, errorCode, errorDescription } = body ?? {};

  if (!razorpayOrderId) {
    return NextResponse.json({ error: "razorpayOrderId required" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: { razorpayOrderId },
    include: { order: { select: { userId: true } } },
  });

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  // Ensure caller owns this order
  if (payment.order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only update if not already CAPTURED (don't downgrade a success)
  if (payment.status !== "CAPTURED") {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failureReason: [errorCode, errorDescription].filter(Boolean).join(" — ") || "Payment failed",
        },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "CANCELLED" },
      }),
      prisma.orderStatusHistory.create({
        data: { orderId: payment.orderId, status: "CANCELLED", note: "Payment failed" },
      }),
    ]);
  }

  return NextResponse.json({ ok: true });
}
