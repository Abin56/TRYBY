import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const updateVariantSchema = z.object({
  variantId: z.string().cuid(),
  stock:     z.number().int().min(0).optional(),
  price:     z.number().positive().optional(),
  mrp:       z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  isActive:  z.boolean().optional(),
});

const addVariantSchema = z.object({
  sku:       z.string().min(1),
  size:      z.string().optional(),
  color:     z.string().optional(),
  price:     z.number().positive(),
  mrp:       z.number().positive(),
  costPrice: z.number().positive().optional(),
  stock:     z.number().int().min(0).default(0),
  isActive:  z.boolean().default(true),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const variants = await prisma.productVariant.findMany({
    where: { productId: id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(variants);
}

export async function PATCH(req: NextRequest, _ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = updateVariantSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { variantId, ...data } = body.data;
  const variant = await prisma.productVariant.update({
    where: { id: variantId },
    data,
  });
  return NextResponse.json(variant);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = addVariantSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const exists = await prisma.productVariant.findUnique({ where: { sku: body.data.sku } });
  if (exists) return NextResponse.json({ error: "SKU already exists" }, { status: 409 });

  const variant = await prisma.productVariant.create({
    data: { ...body.data, productId: id },
  });
  return NextResponse.json(variant, { status: 201 });
}

export async function DELETE(req: NextRequest, _ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { variantId } = await req.json();
  if (!variantId) return NextResponse.json({ error: "variantId required" }, { status: 400 });

  const inOrders = await prisma.orderItem.findFirst({ where: { variantId } });
  if (inOrders) return NextResponse.json({ error: "Cannot delete — variant has order history" }, { status: 409 });

  await prisma.productVariant.delete({ where: { id: variantId } });
  return NextResponse.json({ deleted: true });
}
