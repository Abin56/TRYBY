import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recomputeCrmProfile, logActivity } from "@/lib/crm";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!canAccess(session, "customers:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: userId } = await params;

  const [user, crmProfile, riskProfile, orders, returns, reviews, tickets, notes, tagAssignments, activity, loyaltyPoints, notifications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, createdAt: true, isActive: true, image: true },
    }),
    prisma.crmProfile.findUnique({ where: { userId } }),
    prisma.customerRiskProfile.findUnique({ where: { userId } }),
    prisma.order.findMany({
      where: { userId },
      include: { payment: true, items: { take: 3 } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.returnRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.review.findMany({
      where: { userId },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.customerTicket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.customerNote.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customerTagAssignment.findMany({
      where: { customerId: userId },
      include: { tag: true },
    }),
    prisma.customerActivity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.loyaltyPoint.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    user,
    crmProfile,
    riskProfile,
    orders,
    returns,
    reviews,
    tickets,
    notes,
    tags: tagAssignments.map((a) => a.tag),
    activity,
    loyaltyPoints,
    notifications,
  });
}

// PATCH: block/unblock customer, update profile
export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!canAccess(session, "customers:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: userId } = await params;
  const body = await _req.json();
  const { action, performedBy, reason } = body;

  if (action === "block") {
    await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    await prisma.crmProfile.upsert({
      where: { userId },
      create: { userId, isBlocked: true, blockedAt: new Date(), blockedBy: performedBy ?? "admin", blockReason: reason },
      update: { isBlocked: true, blockedAt: new Date(), blockedBy: performedBy ?? "admin", blockReason: reason },
    });
    await logActivity({ userId, type: "BLACKLISTED", metadata: { reason }, performedBy });
    return NextResponse.json({ ok: true });
  }

  if (action === "unblock") {
    await prisma.user.update({ where: { id: userId }, data: { isActive: true } });
    await prisma.crmProfile.upsert({
      where: { userId },
      create: { userId, isBlocked: false },
      update: { isBlocked: false, blockedAt: null, blockedBy: null, blockReason: null },
    });
    await logActivity({ userId, type: "UNBLACKLISTED", performedBy });
    return NextResponse.json({ ok: true });
  }

  if (action === "rescore") {
    await recomputeCrmProfile(userId);
    const profile = await prisma.crmProfile.findUnique({ where: { userId } });
    return NextResponse.json({ ok: true, profile });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
