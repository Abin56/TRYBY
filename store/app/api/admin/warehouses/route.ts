import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const warehouseSchema = z.object({
  name:        z.string().min(1).max(100),
  code:        z.string().min(1).max(20).toUpperCase(),
  addressLine: z.string().max(200).optional(),
  city:        z.string().max(100).optional(),
  state:       z.string().max(100).optional(),
  pincode:     z.string().max(10).optional(),
  phone:       z.string().max(20).optional(),
  isActive:    z.boolean().default(true),
  isDefault:   z.boolean().default(false),
  notes:       z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const includeStock = searchParams.get("stock") === "1";

  const warehouses = await prisma.warehouse.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    include: includeStock
      ? {
          stocks: {
            include: {
              variant: { select: { sku: true, size: true, color: true } },
              product: { select: { name: true, images: { where: { isPrimary: true }, take: 1 } } },
            },
          },
          _count: { select: { stocks: true } },
        }
      : { _count: { select: { stocks: true } } },
  });

  // Aggregate total units per warehouse
  const withTotals = await Promise.all(
    warehouses.map(async (wh) => {
      const agg = await prisma.warehouseStock.aggregate({
        where: { warehouseId: wh.id },
        _sum: { stock: true },
      });
      return { ...wh, totalUnits: agg._sum.stock ?? 0 };
    })
  );

  return NextResponse.json(withTotals);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = warehouseSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  // If new warehouse is default, unset all others
  if (body.data.isDefault) {
    await prisma.warehouse.updateMany({ data: { isDefault: false } });
  }

  const warehouse = await prisma.warehouse.create({ data: body.data });
  return NextResponse.json(warehouse, { status: 201 });
}
