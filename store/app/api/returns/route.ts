import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const RETURN_WINDOW_DAYS = 7;

const createSchema = z.object({
  orderId:    z.string().cuid(),
  reason:     z.string().min(1),
  reasonNote: z.string().max(1000).optional(),
  imageUrls:  z.array(z.string().url()).max(6).optional().default([]),
  items: z.array(z.object({
    orderItemId: z.string().cuid(),
    productId:   z.string().cuid(),
    variantId:   z.string().cuid().optional(),
    productName: z.string(),
    variantSku:  z.string().optional(),
    size:        z.string().optional(),
    color:       z.string().optional(),
    quantity:    z.number().int().min(1),
    unitPrice:   z.number().positive(),
    imageUrl:    z.string().url().optional(),
  })).min(1),
});

// GET /api/returns — list caller's own return requests
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 10;

  const [returns, total] = await Promise.all([
    prisma.returnRequest.findMany({
      where:   { userId: session.user.id },
      include: {
        items: true,
        order: { select: { orderNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.returnRequest.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ returns, total, pages: Math.ceil(total / limit) });
}

// POST /api/returns — customer files a return request
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const order = await prisma.order.findFirst({
    where:   { id: body.data.orderId, userId: session.user.id },
    select:  { id: true, status: true, createdAt: true },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Only DELIVERED orders can be returned
  if (order.status !== "DELIVERED") {
    return NextResponse.json({ error: "Only delivered orders can be returned" }, { status: 422 });
  }

  // Enforce return window
  const daysSinceDelivery = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
    return NextResponse.json(
      { error: `Return window of ${RETURN_WINDOW_DAYS} days has expired` },
      { status: 422 }
    );
  }

  // Prevent duplicate active return on same order
  const existing = await prisma.returnRequest.findFirst({
    where: {
      orderId: body.data.orderId,
      status:  { notIn: ["REJECTED"] },
    },
  });
  if (existing) {
    return NextResponse.json({ error: "A return request already exists for this order" }, { status: 409 });
  }

  // Validate all submitted orderItems belong to this order and this user
  const orderItemIds = body.data.items.map(i => i.orderItemId);
  const validItems = await prisma.orderItem.findMany({
    where: {
      id:      { in: orderItemIds },
      orderId: body.data.orderId,
    },
    select: { id: true, quantity: true, unitPrice: true },
  });
  if (validItems.length !== body.data.items.length) {
    return NextResponse.json({ error: "One or more items do not belong to this order" }, { status: 422 });
  }

  // Validate requested quantities don't exceed ordered quantities
  const itemMap = Object.fromEntries(validItems.map(i => [i.id, i]));
  for (const item of body.data.items) {
    const ordered = itemMap[item.orderItemId];
    if (item.quantity > ordered.quantity) {
      return NextResponse.json({ error: `Cannot return more than ordered quantity for item ${item.productName}` }, { status: 422 });
    }
  }

  // Calculate refund amount from actual order item prices
  const refundAmount = body.data.items.reduce((sum, item) => {
    const ordered = itemMap[item.orderItemId];
    return sum + Number(ordered.unitPrice) * item.quantity;
  }, 0);

  // Race-safe return number using a sequence-style approach
  const returnReq = await prisma.$transaction(async (tx) => {
    // Count within transaction to minimise (not eliminate) races;
    // the returnNumber unique constraint on the model is the final guard.
    const count = await tx.returnRequest.count();
    const returnNumber = `RET-${String(count + 1).padStart(5, "0")}`;

    return tx.returnRequest.create({
      data: {
        returnNumber,
        orderId:      body.data.orderId,
        userId:       session.user.id,
        reason:       body.data.reason as never,
        reasonNote:   body.data.reasonNote,
        refundAmount,
        imageUrls:    body.data.imageUrls ?? [],
        items: {
          create: body.data.items.map(item => ({
            productId:   item.productId,
            variantId:   item.variantId,
            orderItemId: item.orderItemId,
            productName: item.productName,
            variantSku:  item.variantSku,
            size:        item.size,
            color:       item.color,
            quantity:    item.quantity,
            unitPrice:   item.unitPrice,
            imageUrl:    item.imageUrl,
          })),
        },
      },
      include: { items: true },
    });
  });

  // Update order status to RETURN_REQUESTED
  await prisma.order.update({
    where: { id: body.data.orderId },
    data:  { status: "RETURN_REQUESTED" },
  });

  return NextResponse.json(returnReq, { status: 201 });
}
