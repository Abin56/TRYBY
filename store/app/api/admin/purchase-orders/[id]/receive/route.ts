import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, StockChangeReason } from "@prisma/client";
import { z } from "zod";
import { getAdminProfileId } from "@/lib/audit";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const receiveSchema = z.object({
  items: z.array(z.object({
    itemId:      z.string().cuid(),  // PurchaseOrderItem.id
    receivedQty: z.number().int().nonnegative(),
  })).min(1),
  note: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: poId } = await params;
  const body = receiveSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { items: true },
  });

  if (!po) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
  if (po.status === "RECEIVED" || po.status === "CANCELLED") {
    return NextResponse.json({ error: `Cannot receive items for a ${po.status.toLowerCase()} PO` }, { status: 400 });
  }

  const adminProfileId = await getAdminProfileId(session.user.id);
  const { items: receiveItems, note } = body.data;

  await prisma.$transaction(async (tx) => {
    for (const ri of receiveItems) {
      if (ri.receivedQty === 0) continue;

      const poItem = po.items.find(i => i.id === ri.itemId);
      if (!poItem) throw new Error(`Item ${ri.itemId} not found on this PO`);

      const maxReceivable = poItem.orderedQty - poItem.receivedQty;
      const qty = Math.min(ri.receivedQty, maxReceivable);
      if (qty <= 0) continue;

      // Update PO item received qty
      await tx.purchaseOrderItem.update({
        where: { id: ri.itemId },
        data: { receivedQty: { increment: qty } },
      });

      // Update global variant stock
      const variant = await tx.productVariant.findUnique({
        where: { id: poItem.variantId },
        select: { stock: true },
      });
      if (!variant) continue;

      const newStock = variant.stock + qty;
      await tx.productVariant.update({
        where: { id: poItem.variantId },
        data: { stock: newStock },
      });

      // Update warehouse stock if PO has a warehouse
      if (po.warehouseId) {
        await tx.warehouseStock.upsert({
          where: {
            warehouseId_variantId: {
              warehouseId: po.warehouseId,
              variantId: poItem.variantId,
            },
          },
          create: {
            warehouseId: po.warehouseId,
            variantId:   poItem.variantId,
            productId:   poItem.productId,
            stock:       qty,
          },
          update: { stock: { increment: qty } },
        });
      }

      // Write inventory log
      await tx.inventoryLog.create({
        data: {
          variantId:   poItem.variantId,
          productId:   poItem.productId,
          warehouseId: po.warehouseId ?? null,
          adminId:     adminProfileId,
          reason:      StockChangeReason.PURCHASE_ORDER_RECEIVED,
          stockBefore: variant.stock,
          stockAfter:  newStock,
          delta:       qty,
          note: note ?? `PO ${po.poNumber} — received ${qty} units`,
        },
      });
    }

    // Determine new PO status
    const updatedItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: poId } });
    const allReceived  = updatedItems.every(i => i.receivedQty >= i.orderedQty);
    const anyReceived  = updatedItems.some(i => i.receivedQty > 0);

    const newStatus = allReceived ? "RECEIVED" : anyReceived ? "PARTIALLY_RECEIVED" : po.status;
    await tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        status:     newStatus,
        receivedAt: allReceived ? new Date() : undefined,
      },
    });
  });

  const updated = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: {
      items: true,
      supplier:  { select: { companyName: true } },
      warehouse: { select: { name: true, code: true } },
    },
  });

  return NextResponse.json(updated);
}
