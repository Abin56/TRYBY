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
  const isBlocked = searchParams.get("isBlocked");
  const skip      = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (isBlocked === "1") where.isBlocked = true;
  if (isBlocked === "0") where.isBlocked = false;

  const [records, total, rules, kpis] = await Promise.all([
    prisma.codAbuseRecord.findMany({
      where,
      orderBy: { successRate: "asc" },
      skip,
      take:    limit,
    }),
    prisma.codAbuseRecord.count({ where }),
    prisma.codBlockRule.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.codAbuseRecord.aggregate({
      _sum: { totalCodOrders: true, deliveredCount: true, cancelledCount: true },
      _avg: { successRate: true },
      _count: { id: true },
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
    rules,
    kpis: {
      totalCodOrders: Number(kpis._sum.totalCodOrders ?? 0),
      delivered:      Number(kpis._sum.deliveredCount ?? 0),
      cancelled:      Number(kpis._sum.cancelledCount ?? 0),
      avgSuccessRate: Number(kpis._avg.successRate    ?? 100),
      totalRecords:   kpis._count.id,
    },
  });
}

// PATCH â€” block or unblock COD for a user
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "risk:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, action, reason } = await req.json().catch(() => ({}));
  if (!userId || !action) return NextResponse.json({ error: "userId and action required" }, { status: 400 });

  const isBlocking = action === "block";

  const record = await prisma.codAbuseRecord.upsert({
    where:  { userId },
    create: {
      userId,
      isBlocked:   isBlocking,
      blockedAt:   isBlocking ? new Date() : null,
      blockedBy:   isBlocking ? session!.user.id : null,
      blockReason: isBlocking ? reason : null,
    },
    update: {
      isBlocked:   isBlocking,
      blockedAt:   isBlocking ? new Date() : null,
      blockedBy:   isBlocking ? session!.user.id : null,
      blockReason: isBlocking ? reason : null,
    },
  });

  // Sync to customer risk profile
  await prisma.customerRiskProfile.upsert({
    where:  { userId },
    create: { userId, isCodBlocked: isBlocking },
    update: { isCodBlocked: isBlocking },
  });

  await logFraudAudit({
    actionType:  isBlocking ? "BLOCK_COD" : "BLOCK_COD",
    performedBy: session!.user.id,
    targetId:    userId,
    targetType:  "customer",
    reason:      reason ?? (isBlocking ? "Manual block" : "Manual unblock"),
  });

  return NextResponse.json({ record });
}

