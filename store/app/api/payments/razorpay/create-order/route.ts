import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Razorpay from "razorpay";

const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const orderId: string | undefined = body?.orderId;
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    include: { payment: true },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Idempotency — return existing Razorpay order (with all fields frontend needs)
  if (order.payment?.razorpayOrderId) {
    return NextResponse.json({
      razorpayOrderId: order.payment.razorpayOrderId,
      amount: Math.round(Number(order.total) * 100),
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  }

  let rzpOrder;
  try {
    rzpOrder = await getRazorpay().orders.create({
      amount: Math.round(Number(order.total) * 100),
      currency: "INR",
      receipt: order.orderNumber,
    });
  } catch (err) {
    console.error("[razorpay] create-order failed:", err);
    return NextResponse.json({ error: "Payment gateway error. Please try again." }, { status: 502 });
  }

  await prisma.payment.update({
    where: { orderId },
    data: { razorpayOrderId: rzpOrder.id },
  });

  return NextResponse.json({
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
