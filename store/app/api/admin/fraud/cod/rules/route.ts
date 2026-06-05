import { NextRequest, NextResponse } from "next/server";
import { prisma as _prisma } from "@/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any;
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  if (!canAccess(session, "risk:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rules = await prisma.codBlockRule.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ rules });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "risk:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { name, description, minOrders, maxSuccessRate, maxCancelCount, autoBlock, adminId } =
    await req.json();

  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const rule = await prisma.codBlockRule.create({
    data: { name, description, minOrders, maxSuccessRate, maxCancelCount, autoBlock, createdBy: adminId },
  });

  await prisma.fraudAuditLog.create({
    data: {
      actionType: "COD_RULE_CHANGED",
      performedBy: adminId,
      targetId: rule.id,
      targetType: "cod_rule",
      reason: "Rule created",
      after: rule,
    },
  });

  return NextResponse.json({ rule });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "risk:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, adminId, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const before = await prisma.codBlockRule.findUnique({ where: { id } });
  const rule = await prisma.codBlockRule.update({ where: { id }, data: { ...data, updatedBy: adminId } });

  await prisma.fraudAuditLog.create({
    data: {
      actionType: "COD_RULE_CHANGED",
      performedBy: adminId,
      targetId: id,
      targetType: "cod_rule",
      reason: "Rule updated",
      before,
      after: rule,
    },
  });

  return NextResponse.json({ rule });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "risk:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, adminId } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const before = await prisma.codBlockRule.findUnique({ where: { id } });
  await prisma.codBlockRule.delete({ where: { id } });

  await prisma.fraudAuditLog.create({
    data: {
      actionType: "COD_RULE_CHANGED",
      performedBy: adminId,
      targetId: id,
      targetType: "cod_rule",
      reason: "Rule deleted",
      before,
    },
  });

  return NextResponse.json({ success: true });
}

