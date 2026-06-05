import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole, Sport } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const updateSchema = z.object({
  name:            z.string().min(1).optional(),
  description:     z.string().optional().nullable(),
  imageUrl:        z.string().url().optional().nullable(),
  sport:           z.nativeEnum(Sport).optional().nullable(),
  sortOrder:       z.number().int().optional(),
  isActive:        z.boolean().optional(),
  metaTitle:       z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = updateSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const cat = await prisma.category.update({ where: { id }, data: body.data });
  return NextResponse.json(cat);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const hasProducts = await prisma.product.findFirst({ where: { categoryId: id } });
  if (hasProducts) {
    return NextResponse.json({ error: "Cannot delete — category has products" }, { status: 409 });
  }
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
