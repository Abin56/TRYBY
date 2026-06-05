import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, PayoutStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const page  = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const [payouts, total] = await Promise.all([
    prisma.payout.findMany({
      where:   { supplierId: supplier.id },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.payout.count({ where: { supplierId: supplier.id } }),
  ]);

  return NextResponse.json({
    payouts,
    total,
    pages: Math.ceil(total / limit),
    pendingPayout: Number(supplier.pendingPayout),
    lastPayoutAt:  supplier.lastPayoutAt,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
  if (supplier.status !== "APPROVED") {
    return NextResponse.json({ error: "Account not approved" }, { status: 403 });
  }

  const pendingAmount = Number(supplier.pendingPayout);
  if (pendingAmount <= 0) {
    return NextResponse.json({ error: "No pending payout balance" }, { status: 400 });
  }

  // Check for already pending payout request
  const existingPending = await prisma.payout.findFirst({
    where: { supplierId: supplier.id, status: PayoutStatus.PENDING },
  });
  if (existingPending) {
    return NextResponse.json({ error: "A payout request is already pending" }, { status: 409 });
  }

  const { periodStart, periodEnd } = await req.json();

  const payout = await prisma.payout.create({
    data: {
      supplierId:  supplier.id,
      amount:      pendingAmount,
      status:      PayoutStatus.PENDING,
      periodStart: periodStart ? new Date(periodStart) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      periodEnd:   periodEnd   ? new Date(periodEnd)   : new Date(),
    },
  });

  await prisma.supplierActivityLog.create({
    data: {
      supplierId: supplier.id,
      action:     "PAYOUT_REQUESTED",
      detail:     `Requested payout of ₹${pendingAmount.toFixed(2)}`,
      resourceId: payout.id,
    },
  });

  return NextResponse.json(payout, { status: 201 });
}
