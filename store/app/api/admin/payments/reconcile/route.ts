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

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  // How many days back to reconcile (default: 7)
  const days = Math.min(30, Math.max(1, parseInt(searchParams.get("days") ?? "7")));

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Fetch DB payments that went through Razorpay in the window
  const dbPayments = await prisma.payment.findMany({
    where: {
      razorpayOrderId: { not: null },
      createdAt: { gte: since },
    },
    include: {
      order: {
        select: { id: true, orderNumber: true, status: true, user: { select: { email: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!dbPayments.length) {
    return NextResponse.json({ mismatches: [], total: 0, checkedCount: 0, days });
  }

  type Mismatch = {
    orderId: string;
    orderNumber: string;
    customerEmail: string | null;
    razorpayOrderId: string;
    razorpayPaymentId: string | null;
    dbStatus: string;
    rzpStatus: string | null;
    dbAmount: number;
    rzpAmount: number | null;
    issue: string;
  };

  const mismatches: Mismatch[] = [];
  const rzp = getRazorpay();

  // Check each payment against Razorpay
  await Promise.allSettled(
    dbPayments.map(async (payment) => {
      if (!payment.razorpayOrderId) return;

      try {
        const rzpOrder = await rzp.orders.fetch(payment.razorpayOrderId);
        const rzpOrderTyped = rzpOrder as unknown as Record<string, unknown>;
        const rzpStatus   = rzpOrderTyped.status as string | undefined;    // created | attempted | paid
        const rzpAmountPaise = rzpOrderTyped.amount_paid as number | undefined;
        const rzpAmount   = rzpAmountPaise !== undefined ? rzpAmountPaise / 100 : null;
        const dbAmount    = Number(payment.amount);

        const issues: string[] = [];

        // Status mismatch — Razorpay says paid but DB not CAPTURED
        if (rzpStatus === "paid" && payment.status !== "CAPTURED" && payment.status !== "REFUNDED" && payment.status !== "PARTIALLY_REFUNDED") {
          issues.push(`Razorpay says PAID but DB status is ${payment.status}`);
        }

        // Amount mismatch (tolerance: ₹1)
        if (rzpAmount !== null && Math.abs(rzpAmount - dbAmount) > 1) {
          issues.push(`Amount mismatch: DB ₹${dbAmount} vs Razorpay ₹${rzpAmount}`);
        }

        // DB says CAPTURED but Razorpay order not paid
        if (payment.status === "CAPTURED" && rzpStatus !== "paid") {
          issues.push(`DB says CAPTURED but Razorpay order status is "${rzpStatus}"`);
        }

        if (issues.length > 0) {
          mismatches.push({
            orderId: payment.orderId,
            orderNumber: payment.order.orderNumber,
            customerEmail: payment.order.user.email,
            razorpayOrderId: payment.razorpayOrderId!,
            razorpayPaymentId: payment.razorpayPaymentId,
            dbStatus: payment.status,
            rzpStatus: rzpStatus ?? null,
            dbAmount,
            rzpAmount,
            issue: issues.join("; "),
          });
        }
      } catch {
        // Razorpay fetch failed — flag as unverifiable
        mismatches.push({
          orderId: payment.orderId,
          orderNumber: payment.order.orderNumber,
          customerEmail: payment.order.user.email,
          razorpayOrderId: payment.razorpayOrderId!,
          razorpayPaymentId: payment.razorpayPaymentId,
          dbStatus: payment.status,
          rzpStatus: null,
          dbAmount: Number(payment.amount),
          rzpAmount: null,
          issue: "Could not fetch from Razorpay API — verify manually",
        });
      }
    })
  );

  return NextResponse.json({
    mismatches,
    total: mismatches.length,
    checkedCount: dbPayments.length,
    days,
  });
}
