import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import Razorpay from "razorpay";

const METHOD_MAP: Record<string, string> = {
  card:       "RAZORPAY_CARD",
  upi:        "RAZORPAY_UPI",
  netbanking: "RAZORPAY_NETBANKING",
  wallet:     "RAZORPAY_WALLET",
};

async function fetchRazorpayMethod(paymentId: string): Promise<string | null> {
  try {
    const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
    const payment = await rzp.payments.fetch(paymentId);
    const method = (payment as unknown as Record<string, unknown>).method as string | undefined;
    return (method && METHOD_MAP[method]) ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  // Use timingSafeEqual to prevent timing-based side-channel attacks
  const expBuf = Buffer.from(expectedSig, "hex");
  const sigBuf = Buffer.from(razorpaySignature ?? "", "hex");
  if (expBuf.length !== sigBuf.length || !crypto.timingSafeEqual(expBuf, sigBuf)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: { razorpayOrderId },
    include: { order: { select: { userId: true, status: true } } },
  });

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  // Verify caller owns this order
  if (payment.order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Idempotency: already captured — return success without re-running.
  if (payment.status === "CAPTURED") {
    return NextResponse.json({ ok: true, orderId: payment.orderId });
  }

  // Prevent verifying if order is already in a terminal non-pending state.
  if (!["PENDING", "CONFIRMED"].includes(payment.order.status)) {
    return NextResponse.json({ error: "Order is not in a payable state" }, { status: 409 });
  }

  const resolvedMethod = await fetchRazorpayMethod(razorpayPaymentId);

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId,
        razorpaySignature,
        status: "CAPTURED",
        capturedAt: new Date(),
        ...(resolvedMethod ? { method: resolvedMethod as import("@prisma/client").PaymentMethod } : {}),
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "CONFIRMED" },
    }),
    prisma.orderStatusHistory.create({
      data: { orderId: payment.orderId, status: "CONFIRMED", note: "Payment verified" },
    }),
  ]);

  return NextResponse.json({ ok: true, orderId: payment.orderId });
}
