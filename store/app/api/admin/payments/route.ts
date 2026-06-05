import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, PaymentStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit  = 20;
  const q      = searchParams.get("q") ?? "";
  const status = searchParams.get("status") as PaymentStatus | null;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { razorpayOrderId:   { contains: q, mode: "insensitive" } },
      { razorpayPaymentId: { contains: q, mode: "insensitive" } },
      { order: { orderNumber: { contains: q, mode: "insensitive" } } },
      { order: { user: { name:  { contains: q, mode: "insensitive" } } } },
      { order: { user: { email: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [payments, total, summary] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            createdAt: true,
            user: { select: { id: true, name: true, email: true } },
            items: { select: { productName: true, quantity: true, unitPrice: true }, take: 3 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payment.count({ where }),
    prisma.payment.groupBy({
      by: ["status"],
      _count: { status: true },
      _sum:   { amount: true },
    }),
  ]);

  // Revenue from captured payments only (no extra query needed — derive from summary)
  const revenue = summary
    .filter(s => s.status === "CAPTURED")
    .reduce((sum, s) => sum + Number(s._sum.amount ?? 0), 0);

  const counts = Object.fromEntries(
    summary.map(s => [s.status, { count: s._count.status, amount: Number(s._sum.amount ?? 0) }])
  );

  return NextResponse.json({
    payments,
    total,
    pages: Math.ceil(total / limit),
    revenue,
    counts,
  });
}
