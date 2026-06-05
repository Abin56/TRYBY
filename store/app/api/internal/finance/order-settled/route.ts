/**
 * Internal: called when an order transitions to DELIVERED.
 * Creates the SupplierSettlement (7-day hold) and initial ledger entries.
 * Fire-and-forget from admin order update route.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLedgerEntry, createOrderSettlement, calcCommission } from "@/lib/finance";
import { LedgerEntryType } from "@prisma/client";
import { guardInternalRoute } from "@/lib/internal-auth";

export async function POST(req: NextRequest) {
  const denied = guardInternalRoute(req);
  if (denied) return denied;

  const { orderId, deliveredAt } = await req.json() as {
    orderId:     string;
    deliveredAt?: string;
  };

  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  // Fetch order with all supplier-linked items
  const order = await prisma.order.findUnique({
    where:   { id: orderId },
    include: {
      items: {
        include: { product: { select: { supplierId: true } } },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const deliveredDate = deliveredAt ? new Date(deliveredAt) : new Date();

  // Group items by supplierId
  const bySupplier: Record<string, { total: number; supplierId: string }> = {};
  for (const item of order.items) {
    const sid = item.product.supplierId;
    if (!sid) continue;
    if (!bySupplier[sid]) bySupplier[sid] = { total: 0, supplierId: sid };
    bySupplier[sid].total += Number(item.total);
  }

  const results: string[] = [];

  for (const { supplierId, total: grossAmount } of Object.values(bySupplier)) {
    // Get supplier commission + GST rates
    const supplier = await prisma.supplier.findUnique({
      where:  { id: supplierId },
      select: { commissionRate: true, gstRate: true, gstin: true },
    });
    if (!supplier) continue;

    const commissionRate = Number(supplier.commissionRate);
    const gstRate        = Number(supplier.gstRate);

    const breakdown = calcCommission(grossAmount, commissionRate, gstRate);

    // 1. Create settlement record (HOLDING)
    const settlement = await createOrderSettlement({
      supplierId,
      orderId:       order.id,
      orderNumber:   order.orderNumber,
      deliveredAt:   deliveredDate,
      grossAmount,
      commissionRate,
      gstRate,
    });

    // 2. Create ledger entry — net earning goes to pendingBalance
    await createLedgerEntry({
      supplierId,
      type:            LedgerEntryType.ORDER_EARNING,
      amount:          breakdown.netAmount,   // net (positive credit)
      grossAmount:     breakdown.grossAmount,
      commissionAmt:   breakdown.commissionAmt,
      gstOnCommission: breakdown.gstOnCommission,
      shippingDeduct:  breakdown.shippingDeduct,
      netAmount:       breakdown.netAmount,
      gstRate,
      orderId:         order.id,
      orderNumber:     order.orderNumber,
      settlementId:    settlement.id,
      description:     `Order earnings — ${order.orderNumber} (holding ${settlement.holdDays} days)`,
    });

    results.push(settlement.id);
  }

  return NextResponse.json({ ok: true, settlements: results });
}
