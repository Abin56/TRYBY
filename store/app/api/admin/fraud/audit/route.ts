import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma as _prisma } from "@/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any;
import { canAccess } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "risk:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit      = Math.min(100, parseInt(searchParams.get("limit") ?? "30"));
  const actionType = searchParams.get("actionType");
  const targetType = searchParams.get("targetType");
  const targetId   = searchParams.get("targetId");
  const performedBy= searchParams.get("performedBy");
  const skip       = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (actionType)  where.actionType  = actionType;
  if (targetType)  where.targetType  = targetType;
  if (targetId)    where.targetId    = targetId;
  if (performedBy) where.performedBy = performedBy;

  const [logs, total] = await Promise.all([
    prisma.fraudAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take:    limit,
    }),
    prisma.fraudAuditLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

