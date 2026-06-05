import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma as _prisma } from "@/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any;
import { canAccess } from "@/lib/rbac";
import { recomputeCustomerRisk } from "@/lib/fraud";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!canAccess(session, "risk:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;

  const [profile, user, orders, returns, fraudLogs, codRecord, refundRecord] = await Promise.all([
    prisma.customerRiskProfile.findUnique({ where: { userId } }),
    prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, name: true, email: true, phone: true, createdAt: true, isActive: true },
    }),
    prisma.order.findMany({
      where:   { userId },
      include: {
        payment:        { select: { method: true, status: true, amount: true } },
        riskAssessment: true,
      },
      orderBy: { createdAt: "desc" },
      take:    20,
    }),
    prisma.returnRequest.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
      take:    10,
    }),
    prisma.fraudAuditLog.findMany({
      where:   { targetType: "customer", targetId: userId },
      orderBy: { createdAt: "desc" },
      take:    30,
    }),
    prisma.codAbuseRecord.findUnique({ where: { userId } }),
    prisma.refundAbuseRecord.findUnique({ where: { userId } }),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    profile, user, orders, returns, fraudLogs, codRecord, refundRecord,
  });
}

// POST — trigger rescore
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!canAccess(session, "risk:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;
  await recomputeCustomerRisk(userId);
  const profile = await prisma.customerRiskProfile.findUnique({ where: { userId } });
  return NextResponse.json({ ok: true, profile });
}
