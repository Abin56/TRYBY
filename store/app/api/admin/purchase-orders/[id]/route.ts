import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, PurchaseOrderStatus } from "@prisma/client";
import { z } from "zod";

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
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          variant: { select: { sku: true, size: true, color: true, stock: true } },
          product: {
            select: {
              name: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
      },
      supplier:  true,
      warehouse: true,
    },
  });

  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(po);
}

const updatePOSchema = z.object({
  status:      z.nativeEnum(PurchaseOrderStatus).optional(),
  expectedAt:  z.string().datetime().optional(),
  notes:       z.string().max(1000).optional(),
  supplierId:  z.string().cuid().optional().nullable(),
  warehouseId: z.string().cuid().optional().nullable(),
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
  const body = updatePOSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      ...(body.data.status      ? { status: body.data.status }                    : {}),
      ...(body.data.expectedAt  ? { expectedAt: new Date(body.data.expectedAt) }  : {}),
      ...(body.data.notes !== undefined ? { notes: body.data.notes }              : {}),
      ...(body.data.supplierId  !== undefined ? { supplierId:  body.data.supplierId  } : {}),
      ...(body.data.warehouseId !== undefined ? { warehouseId: body.data.warehouseId } : {}),
    },
    include: { items: true, supplier: true, warehouse: true },
  });

  return NextResponse.json(po);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!["DRAFT", "CANCELLED"].includes(po.status)) {
    return NextResponse.json({ error: "Only DRAFT or CANCELLED POs can be deleted" }, { status: 400 });
  }

  await prisma.purchaseOrder.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
