import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, PurchaseOrderStatus } from "@prisma/client";
import { z } from "zod";
import { getAdminProfileId } from "@/lib/audit";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

function generatePONumber(): string {
  const y = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `PO-${y}-${rand}`;
}

const poItemSchema = z.object({
  variantId:  z.string().cuid(),
  orderedQty: z.number().int().positive(),
  unitCost:   z.number().nonnegative(),
  notes:      z.string().max(300).optional(),
});

const createPOSchema = z.object({
  supplierId:  z.string().cuid().optional(),
  warehouseId: z.string().cuid().optional(),
  expectedAt:  z.string().datetime().optional(),
  notes:       z.string().max(1000).optional(),
  items:       z.array(poItemSchema).min(1),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit  = 20;
  const status = searchParams.get("status") as PurchaseOrderStatus | null;
  const q      = searchParams.get("q") ?? "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { poNumber: { contains: q, mode: "insensitive" } },
      { supplier: { companyName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [pos, total, statusCounts] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier:  { select: { id: true, companyName: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        items:     { select: { orderedQty: true, receivedQty: true, totalCost: true } },
        _count:    { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const counts = Object.fromEntries(statusCounts.map(s => [s.status, s._count.id]));

  return NextResponse.json({ pos, total, pages: Math.ceil(total / limit), counts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = createPOSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { items, supplierId, warehouseId, expectedAt, notes } = body.data;
  const adminProfileId = await getAdminProfileId(session.user.id);

  // Validate variants exist and snapshot their product info
  const variantIds = items.map(i => i.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: { select: { id: true, name: true } } },
  });

  if (variants.length !== variantIds.length) {
    return NextResponse.json({ error: "One or more variant IDs not found" }, { status: 400 });
  }

  const variantMap = Object.fromEntries(variants.map(v => [v.id, v]));

  const totalCost = items.reduce((s, i) => s + i.unitCost * i.orderedQty, 0);

  // Ensure PO number is unique (retry on collision)
  let poNumber = generatePONumber();
  while (await prisma.purchaseOrder.findUnique({ where: { poNumber } })) {
    poNumber = generatePONumber();
  }

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId:  supplierId ?? null,
      warehouseId: warehouseId ?? null,
      expectedAt:  expectedAt ? new Date(expectedAt) : null,
      notes:       notes ?? null,
      totalCost,
      createdById: adminProfileId,
      items: {
        create: items.map(item => {
          const v = variantMap[item.variantId];
          return {
            variantId:   item.variantId,
            productId:   v.product.id,
            productName: v.product.name,
            variantSku:  v.sku,
            size:        v.size ?? null,
            color:       v.color ?? null,
            orderedQty:  item.orderedQty,
            receivedQty: 0,
            unitCost:    item.unitCost,
            totalCost:   item.unitCost * item.orderedQty,
            notes:       item.notes ?? null,
          };
        }),
      },
    },
    include: {
      items: true,
      supplier:  { select: { companyName: true } },
      warehouse: { select: { name: true, code: true } },
    },
  });

  return NextResponse.json(po, { status: 201 });
}
