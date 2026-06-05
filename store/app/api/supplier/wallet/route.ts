import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({
    where:  { userId: session.user.id },
    select: {
      id: true, companyName: true, gstin: true, gstRate: true,
      availableBalance:  true,
      pendingBalance:    true,
      processingBalance: true,
      lifetimeEarnings:  true,
      totalDeductions:   true,
      totalPaidOut:      true,
      lastPayoutAt:      true,
      commissionRate:    true,
    },
  });

  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  // Recent ledger entries (last 10 for wallet widget)
  const recentEntries = await prisma.supplierLedger.findMany({
    where:   { supplierId: supplier.id },
    orderBy: { createdAt: "desc" },
    take:    10,
  });

  // Holdings in queue (HOLDING settlements)
  const holdingSummary = await prisma.supplierSettlement.aggregate({
    where:   { supplierId: supplier.id, status: "HOLDING" },
    _sum:    { netAmount: true },
    _count:  { id: true },
  });

  // Available settlements
  const availableSummary = await prisma.supplierSettlement.aggregate({
    where:  { supplierId: supplier.id, status: "AVAILABLE" },
    _sum:   { netAmount: true },
    _count: { id: true },
  });

  // Next release date (soonest holdUntil)
  const nextRelease = await prisma.supplierSettlement.findFirst({
    where:   { supplierId: supplier.id, status: "HOLDING" },
    orderBy: { holdUntil: "asc" },
    select:  { holdUntil: true, netAmount: true },
  });

  return NextResponse.json({
    balances: {
      available:   Number(supplier.availableBalance),
      pending:     Number(supplier.pendingBalance),
      processing:  Number(supplier.processingBalance),
      lifetime:    Number(supplier.lifetimeEarnings),
      deductions:  Number(supplier.totalDeductions),
      totalPaidOut: Number(supplier.totalPaidOut),
    },
    holdings: {
      count:  holdingSummary._count.id,
      amount: Number(holdingSummary._sum.netAmount ?? 0),
    },
    available: {
      count:  availableSummary._count.id,
      amount: Number(availableSummary._sum.netAmount ?? 0),
    },
    nextRelease: nextRelease ? {
      holdUntil: nextRelease.holdUntil,
      amount:    Number(nextRelease.netAmount),
    } : null,
    commissionRate: Number(supplier.commissionRate),
    gstRate:        Number(supplier.gstRate),
    recentEntries,
  });
}
