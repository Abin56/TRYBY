import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const addSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid(),
  quantity: z.number().int().min(1).max(10),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: { images: { where: { isPrimary: true }, take: 1 } },
      },
      variant: true,
    },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = addSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { productId, variantId, quantity } = body.data;

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant || variant.stock < quantity) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 409 });
  }

  const item = await prisma.cartItem.upsert({
    where: { userId_variantId: { userId: session.user.id, variantId } },
    update: { quantity },
    create: { userId: session.user.id, productId, variantId, quantity },
    include: { product: true, variant: true },
  });

  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { variantId } = await req.json();

  await prisma.cartItem.deleteMany({
    where: { userId: session.user.id, variantId },
  });

  return NextResponse.json({ ok: true });
}
