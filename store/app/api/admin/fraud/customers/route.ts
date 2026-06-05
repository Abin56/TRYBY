/* eslint-disable @typescript-eslint/no-explicit-any */
﻿import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma as _prisma } from "@/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any;
import { canAccess } from "@/lib/rbac";
import { logFraudAudit, recomputeCustomerRisk } from "@/lib/fraud";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "risk:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page         = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit        = Math.min(50, parseInt(searchParams.get("limit") ?? "25"));
  const riskLevel    = searchParams.get("riskLevel");
  const isCodBlocked = searchParams.get("isCodBlocked");
  const isBlacklisted= searchParams.get("isBlacklisted");
  const search       = searchParams.get("search") ?? "";
  const sort         = searchParams.get("sort")   ?? "riskScore_desc";
  const skip         = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (riskLevel)           where.riskLevel    = riskLevel;
  if (isCodBlocked === "1") where.isCodBlocked = true;
  if (isBlacklisted === "1") where.isBlacklisted = true;

  // Resolve search to userIds
  if (search) {
    const users = await prisma.user.findMany({
      where:  { OR: [
        { email: { contains: search, mode: "insensitive" } },
        { name:  { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ]},
      select: { id: true },
    });
    const ids = users.map(u => u.id);
    if (!ids.length) return NextResponse.json({ profiles: [], total: 0, page, limit });
    where.userId = { in: ids };
  }

  const [sortField, sortDir] = sort.split("_") as [string, "asc" | "desc"];

  const [profiles, total] = await Promise.all([
    prisma.customerRiskProfile.findMany({
      where,
      orderBy: { [sortField]: sortDir === "asc" ? "asc" : "desc" },
      skip,
      take:    limit,
    }),
    prisma.customerRiskProfile.count({ where }),
  ]);

  // Batch-fetch users
  const userIds  = profiles.map(p => p.userId);
  const users    = await prisma.user.findMany({
    where:  { id: { in: userIds } },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });
  const userMap  = Object.fromEntries(users.map(u => [u.id, u]));

  return NextResponse.json({
    profiles: profiles.map(p => ({ ...p, user: userMap[p.userId] ?? null })),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

// POST â€” rescore a customer
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "risk:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json().catch(() => ({}));
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  await recomputeCustomerRisk(userId);
  const profile = await prisma.customerRiskProfile.findUnique({ where: { userId } });
  return NextResponse.json({ ok: true, profile });
}

// PATCH â€” manual actions (block_cod, unblock_cod, blacklist, unblacklist, override_note)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "risk:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, action, notes } = await req.json().catch(() => ({}));
  if (!userId || !action) return NextResponse.json({ error: "userId and action required" }, { status: 400 });

  // Ensure profile exists
  let profile = await prisma.customerRiskProfile.findUnique({ where: { userId } });
  if (!profile) {
    profile = await prisma.customerRiskProfile.create({ data: { userId } });
  }

  const before = { ...profile };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let update: any = {};
  let auditType: string = "RISK_SCORE_UPDATED";

  switch (action) {
    case "block_cod":
      update    = { isCodBlocked: true, lastFlaggedAt: new Date() };
      auditType = "BLOCK_COD";
      break;
    case "unblock_cod":
      update    = { isCodBlocked: false };
      auditType = "BLOCK_COD";
      break;
    case "blacklist":
      update    = { isBlacklisted: true, lastFlaggedAt: new Date() };
      auditType = "BLACKLIST_CUSTOMER";
      break;
    case "unblacklist":
      update    = { isBlacklisted: false };
      auditType = "BLACKLIST_CUSTOMER";
      break;
    case "update_notes":
      update    = { notes };
      auditType = "RISK_SCORE_UPDATED";
      break;
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const updated = await prisma.customerRiskProfile.update({ where: { userId }, data: update });

  await logFraudAudit({
    actionType:  auditType,
    performedBy: session!.user.id,
    targetId:    userId,
    targetType:  "customer",
    reason:      `Manual: ${action}`,
    before,
    after:       updated,
  });

  return NextResponse.json({ profile: updated });
}

