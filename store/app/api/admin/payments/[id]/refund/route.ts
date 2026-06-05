import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import Razorpay from "razorpay";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: paymentId } = await params;
  const body = await req.json().catch(() => ({}));
  const refundAmount: number | undefined = body?.amount;   // in rupees; omit = full refund

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.status !== "CAPTURED" && payment.status !== "PARTIALLY_REFUNDED") {
    return NextResponse.json({ error: "Only captured or partially-refunded payments can be refunded" }, { status: 400 });
  }
  if (!payment.razorpayPaymentId) {
    return NextResponse.json({ error: "No Razorpay payment ID on record" }, { status: 400 });
  }

  const orderTotal = Number(payment.amount);
  const alreadyRefunded = Number(payment.refundedAmount ?? 0);
  const remaining = orderTotal - alreadyRefunded;

  if (remaining <= 0) {
    return NextResponse.json({ error: "Payment already fully refunded" }, { status: 400 });
  }

  const amountToRefund = refundAmount
    ? Math.min(refundAmount, remaining)
    : remaining;

  if (amountToRefund <= 0) {
    return NextResponse.json({ error: "Refund amount must be greater than zero" }, { status: 400 });
  }

  let rzpRefund;
  try {
    rzpRefund = await getRazorpay().payments.refund(payment.razorpayPaymentId, {
      amount: Math.round(amountToRefund * 100),  // paise
      speed: "normal",
      notes: { orderId: payment.orderId, orderNumber: payment.order.orderNumber },
    });
  } catch (err) {
    console.error("[refund] razorpay error:", err);
    return NextResponse.json({ error: "Refund request to Razorpay failed" }, { status: 502 });
  }

  const newRefunded = alreadyRefunded + amountToRefund;
  const isFullRefund = newRefunded >= orderTotal - 0.01;
  const newPaymentStatus = isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";
  const newOrderStatus   = isFullRefund ? "REFUNDED"  : payment.order.status;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: newPaymentStatus,
        refundId: (rzpRefund as unknown as Record<string, unknown>).id as string,
        refundedAmount: newRefunded,
        refundedAt: new Date(),
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: newOrderStatus },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: payment.orderId,
        status: newOrderStatus,
        note: `Refund of ₹${amountToRefund.toLocaleString("en-IN")} processed (Razorpay refund ID: ${(rzpRefund as unknown as Record<string, unknown>).id})`,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    refundId: (rzpRefund as unknown as Record<string, unknown>).id,
    refundedAmount: amountToRefund,
    totalRefunded: newRefunded,
    status: newPaymentStatus,
  });
}
