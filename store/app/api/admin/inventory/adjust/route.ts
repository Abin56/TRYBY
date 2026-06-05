import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, StockChangeReason } from "@prisma/client";
import { z } from "zod";
import { getAdminProfileId } from "@/lib/audit";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const adjustSchema = z.object({
  variantId:   z.string().cuid(),
  delta:       z.number().int().refine(n => n !== 0, "Delta must be non-zero"),
  reason:      z.nativeEnum(StockChangeReason),
  warehouseId: z.string().cuid().optional(),
  note:        z.string().max(500).optional(),
});

const bulkAdjustSchema = z.object({
  adjustments: z.array(adjustSchema).min(1).max(200),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminProfileId = await getAdminProfileId(session.user.id);

  const rawBody = await req.json();

  // Support both single adjustment and bulk array
  const isBulk = Array.isArray(rawBody?.adjustments);
  const parsed = isBulk
    ? bulkAdjustSchema.safeParse(rawBody)
    : bulkAdjustSchema.safeParse({ adjustments: [rawBody] });

  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { adjustments } = parsed.data;

  const results = await prisma.$transaction(async (tx) => {
    const logs = [];
    for (const adj of adjustments) {
      const variant = await tx.productVariant.findUnique({
        where: { id: adj.variantId },
        select: { id: true, productId: true, stock: true },
      });
      if (!variant) throw new Error(`Variant ${adj.variantId} not found`);

      const newStock = Math.max(0, variant.stock + adj.delta);
      const actualDelta = newStock - variant.stock; // clamped at 0

      // Update global variant stock
      await tx.productVariant.update({
        where: { id: adj.variantId },
        data: { stock: newStock },
      });

      // Update warehouse stock if warehouseId provided
      if (adj.warehouseId) {
        const whStock = await tx.warehouseStock.findUnique({
          where: { warehouseId_variantId: { warehouseId: adj.warehouseId, variantId: adj.variantId } },
        });
        const whCurrent = whStock?.stock ?? 0;
        const whNew = Math.max(0, whCurrent + adj.delta);
        await tx.warehouseStock.upsert({
          where: { warehouseId_variantId: { warehouseId: adj.warehouseId, variantId: adj.variantId } },
          create: {
            warehouseId: adj.warehouseId,
            variantId: adj.variantId,
            productId: variant.productId,
            stock: whNew,
          },
          update: { stock: whNew },
        });
      }

      // Write immutable log entry
      const log = await tx.inventoryLog.create({
        data: {
          variantId:  adj.variantId,
          productId:  variant.productId,
          warehouseId: adj.warehouseId ?? null,
          adminId:    adminProfileId,
          reason:     adj.reason,
          stockBefore: variant.stock,
          stockAfter:  newStock,
          delta:       actualDelta,
          note:        adj.note ?? null,
        },
      });
      logs.push({ variantId: adj.variantId, stockBefore: variant.stock, stockAfter: newStock, delta: actualDelta, logId: log.id });
    }
    return logs;
  });

  return NextResponse.json({ ok: true, results });
}
