import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const addSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid(),
  quantity: z.number().int().min(1).max(10),
});

// Bulk replace — used by checkout to sync the client (Zustand/localStorage)
// cart into the server cart before order creation. The server authoritatively
// derives productId from each variant; the client only supplies variant + qty.
const syncSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().cuid(),
        quantity: z.number().int().min(1).max(10),
      })
    )
    .max(50),
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

  const raw = await req.json();

  // ── Bulk replace mode ──────────────────────────────────────────────────────
  // When the payload is `{ items: [...] }` the whole server cart is replaced to
  // mirror the client cart. Items whose variant no longer exists / is inactive
  // are silently dropped (they can't be ordered anyway).
  if (raw && Array.isArray(raw.items)) {
    const parsed = syncSchema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const reqItems   = parsed.data.items;
    const variantIds = reqItems.map((i) => i.variantId);
    const variants   = await prisma.productVariant.findMany({
      where:  { id: { in: variantIds }, isActive: true },
      select: { id: true, productId: true },
    });
    const productByVariant = new Map(variants.map((v) => [v.id, v.productId]));

    const rows = reqItems
      .filter((i) => productByVariant.has(i.variantId))
      .map((i) => ({
        userId:    session.user.id,
        productId: productByVariant.get(i.variantId)!,
        variantId: i.variantId,
        quantity:  i.quantity,
      }));

    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { userId: session.user.id } }),
      ...(rows.length ? [prisma.cartItem.createMany({ data: rows })] : []),
    ]);

    return NextResponse.json({ ok: true, synced: rows.length });
  }

  // ── Single-item upsert mode (existing behaviour) ───────────────────────────
  const body = addSchema.safeParse(raw);
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
