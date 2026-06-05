import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  // Idempotency: already confirmed — return success without re-running.
  if (order.status === "CONFIRMED" || order.status !== "PENDING") {
    return NextResponse.json({ ok: true });
  }

  // Safety: never overwrite a captured Razorpay payment with COD.
  if (order.payment?.status === "CAPTURED") {
    return NextResponse.json({ error: "Payment already captured via Razorpay" }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { orderId },
      data: { method: "COD", status: "PENDING" },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: "CONFIRMED" },
    }),
    prisma.orderStatusHistory.create({
      data: { orderId, status: "CONFIRMED", note: "Cash on Delivery order confirmed" },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
