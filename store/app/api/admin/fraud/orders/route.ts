/* eslint-disable @typescript-eslint/no-explicit-any */
﻿import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma as _prisma } from "@/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any;
import { canAccess } from "@/lib/rbac";
import { logFraudAudit, assessOrderRisk } from "@/lib/fraud";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "risk:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page           = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit          = Math.min(50, parseInt(searchParams.get("limit") ?? "25"));
  const riskLevel      = searchParams.get("riskLevel");
  const requiresReview = searchParams.get("requiresReview");
  const skip           = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (riskLevel)           where.riskLevel      = riskLevel;
  if (requiresReview === "1") where.requiresReview = true;
  if (requiresReview === "0") where.requiresReview = false;

  const [assessments, total] = await Promise.all([
    prisma.orderRiskAssessment.findMany({
      where,
      orderBy: { riskScore: "desc" },
      skip,
      take:    limit,
    }),
    prisma.orderRiskAssessment.count({ where }),
  ]);

  const orderIds = assessments.map((a: any) => a.orderId);
  const orders   = await prisma.order.findMany({
    where:  { id: { in: orderIds } },
    select: {
      id: true, orderNumber: true, total: true, status: true, createdAt: true,
      user:    { select: { id: true, name: true, email: true } },
      payment: { select: { method: true, status: true } },
    },
  });
  const orderMap = Object.fromEntries(orders.map((o: any) => [o.id, o]));

  return NextResponse.json({
    assessments: assessments.map((a: any) => ({ ...a, order: orderMap[a.orderId] ?? null })),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

// POST â€” assess or re-assess order
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "risk:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId } = await req.json().catch(() => ({}));
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where:   { id: orderId },
    include: { payment: { select: { method: true } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const result = await assessOrderRisk({
    orderId,
    userId:        order.userId,
    total:         Number(order.total),
    paymentMethod: order.payment?.method,
  });

  return NextResponse.json({ ok: true, ...result });
}

// PATCH â€” clear or flag a risk assessment
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "risk:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId, action, reviewNote } = await req.json().catch(() => ({}));
  if (!orderId || !action) return NextResponse.json({ error: "orderId and action required" }, { status: 400 });

  const assessment = await prisma.orderRiskAssessment.findUnique({ where: { orderId } });
  if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

  const before  = { ...assessment };
  const isClearing = action === "clear";

  const updated = await prisma.orderRiskAssessment.update({
    where: { orderId },
    data: {
      requiresReview: !isClearing,
      reviewedBy:     session!.user.id,
      reviewedAt:     new Date(),
      reviewNote:     reviewNote ?? null,
    },
  });

  await logFraudAudit({
    actionType:  isClearing ? "OVERRIDE_CLEAR" : "OVERRIDE_FLAG",
    performedBy: session!.user.id,
    targetId:    orderId,
    targetType:  "order",
    reason:      reviewNote,
    before,
    after:       updated,
  });

  return NextResponse.json({ assessment: updated });
}

