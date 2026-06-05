import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, StockTransferStatus, StockChangeReason } from "@prisma/client";
import { z } from "zod";
import { getAdminProfileId, logAudit } from "@/lib/audit";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const transfer = await prisma.stockTransfer.findUnique({
    where: { id },
    include: {
      fromWarehouse: true,
      toWarehouse:   true,
      items: {
        include: {
          variant: { select: { id: true, sku: true, size: true, color: true, stock: true } },
          product: {
            select: {
              id: true, name: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  });

  if (!transfer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(transfer);
}

const updateSchema = z.object({
  status: z.nativeEnum(StockTransferStatus),
  note:   z.string().max(500).optional(),
  // For partial receipt: override transferredQty per item
  itemsReceived: z.array(z.object({
    itemId:        z.string().cuid(),
    transferredQty: z.number().int().nonnegative(),
  })).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = updateSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { status, note, itemsReceived } = body.data;
  const adminProfileId = await getAdminProfileId(session.user.id);

  const transfer = await prisma.stockTransfer.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!transfer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const validTransitions: Record<string, StockTransferStatus[]> = {
    PENDING:    ["IN_TRANSIT", "CANCELLED"],
    IN_TRANSIT: ["RECEIVED", "CANCELLED"],
    RECEIVED:   [],
    CANCELLED:  [],
  };
  if (!validTransitions[transfer.status]?.includes(status)) {
    return NextResponse.json({ error: `Cannot transition from ${transfer.status} to ${status}` }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    if (status === "IN_TRANSIT") {
      // Mark dispatched — nothing changes with stock yet
      await tx.stockTransfer.update({
        where: { id },
        data:  { status, dispatchedAt: new Date() },
      });
    }

    if (status === "RECEIVED") {
      // Actually move stock: source -qty, destination +qty
      for (const item of transfer.items) {
        const movedQty = itemsReceived?.find(r => r.itemId === item.id)?.transferredQty
          ?? item.requestedQty;

        // Update transferredQty on item
        await tx.stockTransferItem.update({
          where: { id: item.id },
          data:  { transferredQty: movedQty },
        });

        if (movedQty === 0) continue;

        // SOURCE: release reservation and reduce stock
        const srcStock = await tx.warehouseStock.findUnique({
          where: { warehouseId_variantId: { warehouseId: transfer.fromWarehouseId, variantId: item.variantId } },
          select: { stock: true, reservedQty: true },
        });
        if (srcStock) {
          await tx.warehouseStock.update({
            where: { warehouseId_variantId: { warehouseId: transfer.fromWarehouseId, variantId: item.variantId } },
            data:  {
              stock:       { decrement: movedQty },
              reservedQty: { decrement: Math.min(movedQty, srcStock.reservedQty) },
            },
          });
        }

        // DESTINATION: add stock (upsert)
        await tx.warehouseStock.upsert({
          where: { warehouseId_variantId: { warehouseId: transfer.toWarehouseId, variantId: item.variantId } },
          create: {
            warehouseId: transfer.toWarehouseId,
            variantId:   item.variantId,
            productId:   item.productId,
            stock:       movedQty,
          },
          update: { stock: { increment: movedQty } },
        });

        // Inventory log — source outflow
        const srcVariant = await tx.productVariant.findUnique({ where: { id: item.variantId }, select: { stock: true } });
        await tx.inventoryLog.create({
          data: {
            variantId:   item.variantId,
            productId:   item.productId,
            warehouseId: transfer.fromWarehouseId,
            adminId:     adminProfileId,
            reason:      StockChangeReason.WAREHOUSE_TRANSFER,
            stockBefore: srcVariant?.stock ?? 0,
            stockAfter:  (srcVariant?.stock ?? 0),
            delta:       -movedQty,
            note: note ?? `Transfer ${transfer.transferNumber} dispatched to ${transfer.toWarehouseId}`,
          },
        });

        // Inventory log — destination inflow
        await tx.inventoryLog.create({
          data: {
            variantId:   item.variantId,
            productId:   item.productId,
            warehouseId: transfer.toWarehouseId,
            adminId:     adminProfileId,
            reason:      StockChangeReason.WAREHOUSE_TRANSFER,
            stockBefore: 0,
            stockAfter:  movedQty,
            delta:       movedQty,
            note: note ?? `Transfer ${transfer.transferNumber} received from ${transfer.fromWarehouseId}`,
          },
        });
      }

      await tx.stockTransfer.update({
        where: { id },
        data:  { status, receivedAt: new Date() },
      });
    }

    if (status === "CANCELLED") {
      // Release source reservations
      for (const item of transfer.items) {
        await tx.warehouseStock.updateMany({
          where: { warehouseId: transfer.fromWarehouseId, variantId: item.variantId },
          data:  { reservedQty: { decrement: item.requestedQty } },
        });
      }
      await tx.stockTransfer.update({
        where: { id },
        data:  { status, cancelledAt: new Date() },
      });
    }
  });

  logAudit({
    adminId:      adminProfileId ?? "",
    action:       "STOCK_UPDATED",
    resourceType: "stockTransfer",
    resourceId:   id,
    resourceName: transfer.transferNumber,
    newValue:     { status, note },
  });

  const updated = await prisma.stockTransfer.findUnique({
    where:   { id },
    include: { items: true, fromWarehouse: true, toWarehouse: true },
  });
  return NextResponse.json(updated);
}
