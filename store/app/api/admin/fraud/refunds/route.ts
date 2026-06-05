/* eslint-disable @typescript-eslint/no-explicit-any */
﻿import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma as _prisma } from "@/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any;
import { canAccess } from "@/lib/rbac";
import { logFraudAudit } from "@/lib/fraud";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "risk:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page      = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit     = Math.min(50, parseInt(searchParams.get("limit") ?? "25"));
  const isFlagged = searchParams.get("isFlagged");
  const skip      = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (isFlagged === "1") where.isFlagged = true;

  const [records, total, kpis] = await Promise.all([
    prisma.refundAbuseRecord.findMany({
      where,
      orderBy: { refundRate: "desc" },
      skip,
      take:    limit,
    }),
    prisma.refundAbuseRecord.count({ where }),
    prisma.refundAbuseRecord.aggregate({
      _count: { id: true },
      _avg:   { refundRate: true },
      _sum:   { totalRefunds: true, totalRefundAmount: true },
    }),
  ]);

  const userIds = records.map(r => r.userId);
  const users   = await prisma.user.findMany({
    where:  { id: { in: userIds } },
    select: { id: true, name: true, email: true, phone: true },
  });
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  return NextResponse.json({
    records: records.map(r => ({ ...r, user: userMap[r.userId] ?? null })),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    kpis: {
      totalRecords:     kpis._count.id,
      avgRefundRate:    Number(kpis._avg.refundRate       ?? 0),
      totalRefunds:     Number(kpis._sum.totalRefunds     ?? 0),
      totalRefundAmount:Number(kpis._sum.totalRefundAmount ?? 0),
    },
  });
}

// POST â€” run refund abuse scan (recompute from order history)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "risk:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const refundedOrders = await prisma.order.findMany({
    where:  { status: { in: ["REFUNDED", "RETURNED"] } },
    select: { userId: true, total: true },
  });

  const byUser: Record<string, { count: number; amount: number }> = {};
  for (const o of refundedOrders) {
    if (!byUser[o.userId]) byUser[o.userId] = { count: 0, amount: 0 };
    byUser[o.userId].count++;
    byUser[o.userId].amount += Number(o.total);
  }

  let flagged = 0;
  for (const [userId, data] of Object.entries(byUser)) {
    const totalOrders = await prisma.order.count({ where: { userId } });
    const refundRate  = totalOrders > 0 ? (data.count / totalOrders) * 100 : 0;
    const isFlagged   = data.count >= 3 || refundRate >= 30;

    await prisma.refundAbuseRecord.upsert({
      where:  { userId },
      update: {
        totalRefunds: data.count, totalRefundAmount: data.amount,
        refundRate, isFlagged,
        flaggedAt: isFlagged ? new Date() : null,
        lastRefundAt: new Date(),
      },
      create: {
        userId, totalRefunds: data.count, totalRefundAmount: data.amount,
        refundRate, isFlagged,
        flaggedAt: isFlagged ? new Date() : null,
        lastRefundAt: new Date(),
      },
    });

    if (isFlagged) flagged++;
  }

  await logFraudAudit({
    actionType:  "REFUND_FLAGGED",
    performedBy: session!.user.id,
    targetType:  "refund_scan",
    targetId:    "batch",
    reason:      `Refund scan: ${flagged} flagged of ${Object.keys(byUser).length}`,
  });

  return NextResponse.json({ flagged, total: Object.keys(byUser).length });
}

