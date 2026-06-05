import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateMobileToken } from "@/lib/mobile";
import { z } from "zod";

// GET — Return cart with totals, coupon state, shipping estimate
export async function GET(req: NextRequest) {
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateMobileToken(bearer);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.cartItem.findMany({
    where:   { userId: session.userId },
    include: {
      product: {
        select: { id: true, name: true, slug: true, price: true, compareAtPrice: true, images: true, stockCount: true, isActive: true },
      },
      variant: {
        select: { id: true, name: true, price: true, stockCount: true, images: true, attributes: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Filter out discontinued items
  const activeItems = items.filter(i => i.product.isActive && i.product.stockCount > 0);

  const subtotal = activeItems.reduce((sum, item) => {
    const price = Number(item.variant?.price ?? item.product.price);
    return sum + price * item.quantity;
  }, 0);

  const totalItems  = activeItems.reduce((s, i) => s + i.quantity, 0);
  const savings     = activeItems.reduce((sum, item) => {
    const retail   = Number(item.product.compareAtPrice ?? 0);
    const actual   = Number(item.variant?.price ?? item.product.price);
    return retail > actual ? sum + (retail - actual) * item.quantity : sum;
  }, 0);

  return NextResponse.json({
    items:      activeItems,
    removedItems: items.filter(i => !i.product.isActive || i.product.stockCount === 0).map(i => i.id),
    summary: {
      subtotal,
      savings,
      shipping:      subtotal >= 499 ? 0 : 49, // Free shipping above ₹499
      total:         subtotal + (subtotal >= 499 ? 0 : 49),
      totalItems,
      currency:      "INR",
    },
  });
}

const addSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity:  z.number().int().min(1).max(10).default(1),
});

// POST — Add item to cart
export async function POST(req: NextRequest) {
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateMobileToken(bearer);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = addSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid request", details: body.error.flatten() }, { status: 400 });

  const { productId, variantId, quantity } = body.data;

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { stockCount: true, isActive: true } });
  if (!product?.isActive) return NextResponse.json({ error: "Product not available" }, { status: 400 });

  const existing = await prisma.cartItem.findFirst({
    where: { userId: session.userId, productId, variantId: variantId ?? null },
  });

  if (existing) {
    const updated = await prisma.cartItem.update({
      where: { id: existing.id },
      data:  { quantity: Math.min(existing.quantity + quantity, 10) },
    });
    return NextResponse.json({ item: updated, action: "updated" });
  }

  const item = await prisma.cartItem.create({
    data: { userId: session.userId, productId, variantId: variantId ?? null, quantity },
  });

  return NextResponse.json({ item, action: "added" }, { status: 201 });
}

const updateSchema = z.object({
  itemId:   z.string().min(1),
  quantity: z.number().int().min(0).max(10),
});

// PATCH — Update quantity (0 = remove)
export async function PATCH(req: NextRequest) {
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateMobileToken(bearer);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { itemId, quantity } = body.data;

  if (quantity === 0) {
    await prisma.cartItem.deleteMany({ where: { id: itemId, userId: session.userId } });
    return NextResponse.json({ action: "removed" });
  }

  const item = await prisma.cartItem.updateMany({
    where: { id: itemId, userId: session.userId },
    data:  { quantity },
  });

  return NextResponse.json({ action: "updated", count: item.count });
}

// DELETE — Clear entire cart
export async function DELETE(req: NextRequest) {
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateMobileToken(bearer);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.cartItem.deleteMany({ where: { userId: session.userId } });
  return NextResponse.json({ ok: true });
}
