import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { notifyLoyaltyEarned } from "@/lib/notifications";

// GET /api/loyalty — balance + recent transactions
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [segment, transactions] = await Promise.all([
    prisma.customerSegment.findUnique({ where: { userId: session.user.id } }),
    prisma.loyaltyPoint.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return NextResponse.json({
    balance: segment?.loyaltyPoints ?? 0,
    transactions,
  });
}

// POST /api/loyalty/redeem — redeem points at checkout
const redeemSchema = z.object({ points: z.number().int().min(10).max(5000) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = redeemSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { points } = body.data;
  const segment = await prisma.customerSegment.findUnique({ where: { userId: session.user.id } });

  if (!segment || segment.loyaltyPoints < points) {
    return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
  }

  // Each 10 points = ₹1 discount
  const discountValue = Math.floor(points / 10);

  const [tx] = await prisma.$transaction([
    prisma.loyaltyPoint.create({
      data: {
        userId: session.user.id,
        type: "REDEEM",
        points: -points,
        balance: segment.loyaltyPoints - points,
        description: `Redeemed ${points} points for ₹${discountValue} discount`,
      },
    }),
    prisma.customerSegment.update({
      where: { userId: session.user.id },
      data: { loyaltyPoints: { decrement: points } },
    }),
  ]);

  // Fire notification (non-blocking)
  notifyLoyaltyEarned(
    session.user.id,
    -points,
    `Redeemed ${points} points for ₹${discountValue} discount`
  ).catch(() => {});

  return NextResponse.json({ ok: true, discountValue, newBalance: segment.loyaltyPoints - points, transaction: tx });
}
