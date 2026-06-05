import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole, AbandonedCartStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// ─── GET — list abandoned carts ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit  = 25;
  const status = searchParams.get("status") as AbandonedCartStatus | null;
  const q      = searchParams.get("q") ?? "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { userEmail: { contains: q, mode: "insensitive" } },
      { userName:  { contains: q, mode: "insensitive" } },
    ];
  }

  const [carts, total] = await Promise.all([
    prisma.abandonedCart.findMany({
      where,
      orderBy: { detectedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.abandonedCart.count({ where }),
  ]);

  // Summary stats
  const [
    detectedCount,
    recoverySentCount,
    recoveredCount,
    totalCartValue,
    recoveredValue,
  ] = await Promise.all([
    prisma.abandonedCart.count({ where: { status: "DETECTED" } }),
    prisma.abandonedCart.count({ where: { status: "RECOVERY_SENT" } }),
    prisma.abandonedCart.count({ where: { status: "RECOVERED" } }),
    prisma.abandonedCart.aggregate({ _sum: { cartValue: true } }),
    prisma.abandonedCart.aggregate({
      _sum: { cartValue: true },
      where: { status: "RECOVERED" },
    }),
  ]);

  const totalRecoverable = detectedCount + recoverySentCount;
  const recoveryRate = (detectedCount + recoverySentCount + recoveredCount) > 0
    ? ((recoveredCount / (detectedCount + recoverySentCount + recoveredCount)) * 100).toFixed(1)
    : "0.0";

  return NextResponse.json({
    carts,
    total,
    pages: Math.ceil(total / limit),
    summary: {
      detected:       detectedCount,
      recoverySent:   recoverySentCount,
      recovered:      recoveredCount,
      totalCartValue: Number(totalCartValue._sum.cartValue ?? 0),
      recoveredValue: Number(recoveredValue._sum.cartValue ?? 0),
      recoveryRate,
    },
  });
}

// ─── POST — trigger recovery for a cart ───────────────────────────────────────

const triggerSchema = z.object({
  cartId:         z.string(),
  method:         z.enum(["email", "whatsapp"]),
  campaignId:     z.string().optional(),
  customMessage:  z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const raw  = await req.json();
  const body = triggerSchema.safeParse(raw);
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { cartId, method, campaignId } = body.data;

  const cart = await prisma.abandonedCart.findUnique({ where: { id: cartId } });
  if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  if (cart.status === "RECOVERED") {
    return NextResponse.json({ error: "Cart already recovered" }, { status: 400 });
  }

  // Mark as recovery sent (actual send queued for provider integration)
  const updated = await prisma.abandonedCart.update({
    where: { id: cartId },
    data: {
      status:            AbandonedCartStatus.RECOVERY_SENT,
      recoveryMethod:    method,
      recoveryCampaignId: campaignId,
      recoverySentAt:    new Date(),
    },
  });

  // Audit
  try {
    const adminProfile = await prisma.adminProfile.findUnique({ where: { userId: session.user.id } });
    if (adminProfile) {
      await prisma.auditLog.create({
        data: {
          adminId:      adminProfile.id,
          action:       "OTHER",
          resourceType: "abandoned_cart",
          resourceId:   cartId,
          resourceName: cart.userEmail,
          newValue:     { method, cartValue: cart.cartValue, status: "RECOVERY_SENT" },
        },
      });
    }
  } catch { /* non-blocking */ }

  return NextResponse.json({ ok: true, cart: updated });
}
