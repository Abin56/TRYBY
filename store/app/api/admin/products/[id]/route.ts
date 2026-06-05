import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole, Sport } from "@prisma/client";
import { logAudit, getAdminProfileId } from "@/lib/audit";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const updateSchema = z.object({
  name:               z.string().min(1).optional(),
  description:        z.string().min(1).optional(),
  sport:              z.nativeEnum(Sport).optional(),
  categoryId:         z.string().cuid().optional(),
  isActive:           z.boolean().optional(),
  isFeatured:         z.boolean().optional(),
  isOfficialLicensed: z.boolean().optional(),
  showOnHomepage:     z.boolean().optional(),
  homepageSortOrder:  z.number().int().min(0).optional(),
  teamName:           z.string().optional(),
  leagueName:         z.string().optional(),
  metaTitle:          z.string().optional(),
  metaDescription:    z.string().optional(),
  shippingCost:       z.number().min(0).optional(),
  packagingCost:      z.number().min(0).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true, images: true, category: true, badges: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = updateSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const before  = await prisma.product.findUnique({ where: { id }, select: { name: true, isActive: true, isFeatured: true } });
  const product = await prisma.product.update({
    where: { id },
    data:  body.data,
    include: { variants: true, images: true, category: true },
  });

  const adminId = await getAdminProfileId(session.user.id);
  if (adminId) {
    logAudit({
      adminId,
      action:       "PRODUCT_UPDATED",
      resourceType: "product",
      resourceId:   id,
      resourceName: product.name,
      oldValue:     before,
      newValue:     body.data,
      req,
    });
  }

  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const product  = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  const hasOrders = await prisma.orderItem.findFirst({ where: { productId: id } });

  if (hasOrders) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });

    const adminId = await getAdminProfileId(session.user.id);
    if (adminId) logAudit({ adminId, action: "PRODUCT_UPDATED", resourceType: "product", resourceId: id, resourceName: product?.name, newValue: { isActive: false }, req });

    return NextResponse.json({ soft: true, message: "Product deactivated (has order history)" });
  }

  await prisma.product.delete({ where: { id } });

  const adminId = await getAdminProfileId(session.user.id);
  if (adminId) logAudit({ adminId, action: "PRODUCT_DELETED", resourceType: "product", resourceId: id, resourceName: product?.name, req });

  return NextResponse.json({ deleted: true });
}
