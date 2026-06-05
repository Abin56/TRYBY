import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const updateSchema = z.object({
  name:        z.string().min(1).max(100).optional(),
  addressLine: z.string().max(200).optional(),
  city:        z.string().max(100).optional(),
  state:       z.string().max(100).optional(),
  pincode:     z.string().max(10).optional(),
  phone:       z.string().max(20).optional(),
  isActive:    z.boolean().optional(),
  isDefault:   z.boolean().optional(),
  notes:       z.string().max(500).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: {
      stocks: {
        include: {
          variant: { select: { id: true, sku: true, size: true, color: true, price: true, costPrice: true } },
          product: {
            select: {
              id: true, name: true, slug: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
        orderBy: { product: { name: "asc" } },
      },
      _count: { select: { stocks: true, inventoryLogs: true } },
    },
  });

  if (!warehouse) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(warehouse);
}

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

  if (body.data.isDefault) {
    await prisma.warehouse.updateMany({ where: { id: { not: id } }, data: { isDefault: false } });
  }

  const warehouse = await prisma.warehouse.update({ where: { id }, data: body.data });
  return NextResponse.json(warehouse);
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

  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: { _count: { select: { stocks: true } } },
  });
  if (!warehouse) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (warehouse.isDefault) return NextResponse.json({ error: "Cannot delete the default warehouse" }, { status: 400 });
  if (warehouse._count.stocks > 0) return NextResponse.json({ error: "Warehouse has stock — clear it first" }, { status: 409 });

  await prisma.warehouse.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
