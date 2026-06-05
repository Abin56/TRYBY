import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { logAudit, getAdminProfileId } from "@/lib/audit";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const schema = z.object({
  variantIds:  z.array(z.string()).min(1),
  stock:       z.number().int().min(0).optional(),
  costPrice:   z.number().min(0).optional(),
  price:       z.number().min(0).optional(),
  mrp:         z.number().min(0).optional(),
  isActive:    z.boolean().optional(),
  note:        z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { variantIds, stock, costPrice, price, mrp, isActive } = body.data;
  const adminId = await getAdminProfileId(session.user.id);

  const updateData: Record<string, unknown> = {};
  if (stock      !== undefined) updateData.stock     = stock;
  if (costPrice  !== undefined) updateData.costPrice  = costPrice;
  if (price      !== undefined) updateData.price      = price;
  if (mrp        !== undefined) updateData.mrp        = mrp;
  if (isActive   !== undefined) updateData.isActive   = isActive;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
  }

  await prisma.productVariant.updateMany({ where: { id: { in: variantIds } }, data: updateData });

  if (adminId) logAudit({ adminId, action: "PRODUCT_UPDATED", resourceType: "variant",
    newValue: { ...updateData, variantIds }, req });

  const updated = await prisma.productVariant.findMany({
    where:  { id: { in: variantIds } },
    select: { id: true, sku: true, size: true, color: true, price: true, mrp: true, costPrice: true, stock: true, isActive: true },
  });

  return NextResponse.json({ affected: variantIds.length, variants: updated });
}
