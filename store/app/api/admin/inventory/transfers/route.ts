import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, StockTransferStatus, StockChangeReason } from "@prisma/client";
import { z } from "zod";
import { getAdminProfileId, logAudit } from "@/lib/audit";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

function genTransferNumber(): string {
  const y   = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 90000) + 10000;
  return `TRF-${y}-${seq}`;
}

const transferItemSchema = z.object({
  variantId:    z.string().cuid(),
  requestedQty: z.number().int().positive(),
});

const createSchema = z.object({
  fromWarehouseId: z.string().cuid(),
  toWarehouseId:   z.string().cuid(),
  reason:          z.string().max(500).optional(),
  internalNote:    z.string().max(1000).optional(),
  items:           z.array(transferItemSchema).min(1).max(200),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page        = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit       = 20;
  const status      = searchParams.get("status") as StockTransferStatus | null;
  const warehouseId = searchParams.get("warehouseId") ?? undefined;
  const q           = searchParams.get("q") ?? "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (warehouseId) {
    where.OR = [
      { fromWarehouseId: warehouseId },
      { toWarehouseId:   warehouseId },
    ];
  }
  if (q) {
    where.transferNumber = { contains: q, mode: "insensitive" };
  }

  const [transfers, total, statusCounts] = await Promise.all([
    prisma.stockTransfer.findMany({
      where,
      include: {
        fromWarehouse: { select: { id: true, name: true, code: true } },
        toWarehouse:   { select: { id: true, name: true, code: true } },
        items: {
          include: {
            variant: { select: { sku: true, size: true, color: true } },
            product: { select: { name: true } },
          },
        },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.stockTransfer.count({ where }),
    prisma.stockTransfer.groupBy({
      by:     ["status"],
      _count: { id: true },
    }),
  ]);

  return NextResponse.json({
    transfers,
    total,
    pages:  Math.ceil(total / limit),
    counts: Object.fromEntries(statusCounts.map(s => [s.status, s._count.id])),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = createSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { fromWarehouseId, toWarehouseId, reason, internalNote, items } = body.data;
  if (fromWarehouseId === toWarehouseId) {
    return NextResponse.json({ error: "Source and destination must be different" }, { status: 400 });
  }

  const adminProfileId = await getAdminProfileId(session.user.id);

  // Validate source warehouse has stock for each variant
  const variantIds = items.map(i => i.variantId);
  const sourceStocks = await prisma.warehouseStock.findMany({
    where:   { warehouseId: fromWarehouseId, variantId: { in: variantIds } },
    include: {
      variant: { select: { id: true, sku: true, productId: true, size: true, color: true } },
      product: { select: { id: true, name: true } },
    },
  });

  const stockMap = Object.fromEntries(sourceStocks.map(s => [s.variantId, s]));

  for (const item of items) {
    const ws = stockMap[item.variantId];
    const available = ws ? ws.stock - ws.reservedQty : 0;
    if (available < item.requestedQty) {
      return NextResponse.json({
        error: `Insufficient available stock for variant ${item.variantId} (have ${available}, need ${item.requestedQty})`,
      }, { status: 400 });
    }
  }

  // Ensure unique transfer number
  let transferNumber = genTransferNumber();
  while (await prisma.stockTransfer.findUnique({ where: { transferNumber } })) {
    transferNumber = genTransferNumber();
  }

  const transfer = await prisma.$transaction(async (tx) => {
    // Snapshot product/variant names for denormalisation
    const itemData = await Promise.all(items.map(async (item) => {
      const ws = stockMap[item.variantId];
      return {
        variantId:    item.variantId,
        productId:    ws.product.id,
        productName:  ws.product.name,
        variantSku:   ws.variant.sku,
        size:         ws.variant.size ?? null,
        color:        ws.variant.color ?? null,
        requestedQty: item.requestedQty,
        transferredQty: 0,
      };
    }));

    // Reserve the stock at source (increment reservedQty)
    for (const item of items) {
      await tx.warehouseStock.update({
        where: { warehouseId_variantId: { warehouseId: fromWarehouseId, variantId: item.variantId } },
        data:  { reservedQty: { increment: item.requestedQty } },
      });
    }

    return tx.stockTransfer.create({
      data: {
        transferNumber,
        fromWarehouseId,
        toWarehouseId,
        reason:      reason ?? null,
        internalNote: internalNote ?? null,
        createdById: adminProfileId,
        items:       { create: itemData },
      },
      include: { items: true, fromWarehouse: true, toWarehouse: true },
    });
  });

  logAudit({
    adminId:      adminProfileId ?? "",
    action:       "STOCK_UPDATED",
    resourceType: "stockTransfer",
    resourceId:   transfer.id,
    resourceName: transfer.transferNumber,
    newValue:     { fromWarehouseId, toWarehouseId, itemCount: items.length },
  });

  return NextResponse.json(transfer, { status: 201 });
}
