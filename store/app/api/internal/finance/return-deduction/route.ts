/**
 * Internal: called when a return is REFUNDED.
 * Creates a negative ledger entry and cancels the in-flight settlement.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyReturnDeduction } from "@/lib/finance";
import { guardInternalRoute } from "@/lib/internal-auth";

export async function POST(req: NextRequest) {
  const denied = guardInternalRoute(req);
  if (denied) return denied;

  const { returnRequestId } = await req.json() as { returnRequestId: string };
  if (!returnRequestId) return NextResponse.json({ error: "returnRequestId required" }, { status: 400 });

  const returnReq = await prisma.returnRequest.findUnique({
    where:   { id: returnRequestId },
    include: {
      order: {
        include: {
          items: { include: { product: { select: { supplierId: true } } } },
        },
      },
    },
  });

  if (!returnReq) return NextResponse.json({ error: "Return not found" }, { status: 404 });

  // Find all supplier(s) involved
  const supplierMap: Record<string, number> = {};
  for (const item of returnReq.order.items) {
    const sid = item.product.supplierId;
    if (!sid) continue;
    supplierMap[sid] = (supplierMap[sid] ?? 0) + Number(item.total);
  }

  const results: unknown[] = [];

  for (const [supplierId, itemTotal] of Object.entries(supplierMap)) {
    const supplier = await prisma.supplier.findUnique({
      where:  { id: supplierId },
      select: { commissionRate: true, gstRate: true },
    });
    if (!supplier) continue;

    const entry = await applyReturnDeduction({
      supplierId,
      orderId:         returnReq.orderId,
      orderNumber:     returnReq.order.orderNumber,
      returnRequestId: returnReq.id,
      refundAmount:    Number(returnReq.refundAmount),
      commissionRate:  Number(supplier.commissionRate),
      gstRate:         Number(supplier.gstRate),
    });

    results.push(entry);
  }

  return NextResponse.json({ ok: true, entries: results.length });
}
