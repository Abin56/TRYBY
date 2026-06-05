import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const addSchema = z.object({
  url:       z.string().url(),
  altText:   z.string().optional(),
  variantId: z.string().cuid().optional(), // optional — pin to a variant
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const images = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json(images);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = addSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  if (body.data.isPrimary) {
    await prisma.productImage.updateMany({ where: { productId: id }, data: { isPrimary: false } });
  }

  const image = await prisma.productImage.create({
    data: { ...body.data, productId: id },
  });
  return NextResponse.json(image, { status: 201 });
}

export async function DELETE(req: NextRequest, _ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { imageId } = await req.json();
  if (!imageId) return NextResponse.json({ error: "imageId required" }, { status: 400 });

  await prisma.productImage.delete({ where: { id: imageId } });
  return NextResponse.json({ deleted: true });
}
