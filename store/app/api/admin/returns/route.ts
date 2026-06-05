import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole, ReturnStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page   = parseInt(searchParams.get("page") ?? "1");
  const limit  = 20;
  const status = searchParams.get("status") as ReturnStatus | null;
  const q      = searchParams.get("q") ?? "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { returnNumber: { contains: q, mode: "insensitive" } },
      { user: { name:  { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { order: { orderNumber: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [returns, total] = await Promise.all([
    prisma.returnRequest.findMany({
      where,
      include: {
        user:  { select: { id: true, name: true, email: true, image: true } },
        order: { select: { orderNumber: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.returnRequest.count({ where }),
  ]);

  // KPI aggregates
  const [totalRefunded, pendingCount, resolvedCount] = await Promise.all([
    prisma.returnRequest.aggregate({
      _sum: { refundAmount: true },
      where: { status: ReturnStatus.REFUNDED },
    }),
    prisma.returnRequest.count({ where: { status: ReturnStatus.REQUESTED } }),
    prisma.returnRequest.count({ where: { status: { in: [ReturnStatus.REFUNDED, ReturnStatus.REJECTED] } } }),
  ]);

  return NextResponse.json({
    returns,
    total,
    pages: Math.ceil(total / limit),
    kpis: {
      totalRefunded: Number(totalRefunded._sum.refundAmount ?? 0),
      pendingCount,
      resolvedCount,
    },
  });
}

const createSchema = z.object({
  orderId:      z.string().cuid(),
  reason:       z.string(),
  reasonNote:   z.string().optional(),
  refundAmount: z.number().positive(),
  refundMethod: z.string().default("ORIGINAL_PAYMENT"),
  imageUrls:    z.array(z.string()).optional(),
  items: z.array(z.object({
    productId:   z.string().cuid(),
    variantId:   z.string().cuid().optional(),
    orderItemId: z.string().cuid().optional(),
    productName: z.string(),
    variantSku:  z.string().optional(),
    size:        z.string().optional(),
    color:       z.string().optional(),
    quantity:    z.number().int().positive(),
    unitPrice:   z.number().positive(),
    imageUrl:    z.string().optional(),
  })).min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = createSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id: body.data.orderId },
    select: { userId: true, orderNumber: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Generate return number
  const count = await prisma.returnRequest.count();
  const returnNumber = `RET-${String(count + 1).padStart(5, "0")}`;

  const returnReq = await prisma.returnRequest.create({
    data: {
      returnNumber,
      orderId:      body.data.orderId,
      userId:       order.userId,
      reason:       body.data.reason as never,
      reasonNote:   body.data.reasonNote,
      refundAmount: body.data.refundAmount,
      refundMethod: body.data.refundMethod,
      imageUrls:    body.data.imageUrls ?? [],
      items: {
        create: body.data.items,
      },
    },
    include: { items: true },
  });

  return NextResponse.json(returnReq, { status: 201 });
}
