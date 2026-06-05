import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recomputeCrmProfile } from "@/lib/crm";
import { CrmSegment } from "@prisma/client";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "customers:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 25;
  const skip = (page - 1) * limit;
  const search = searchParams.get("search") ?? "";
  const segment = searchParams.get("segment") as CrmSegment | null;
  const minRevenue = parseFloat(searchParams.get("minRevenue") ?? "0");
  const maxRevenue = parseFloat(searchParams.get("maxRevenue") ?? "0");
  const sortBy = searchParams.get("sortBy") ?? "ltv";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const lastOrderDays = searchParams.get("lastOrderDays");

  const profileWhere: Record<string, unknown> = {};
  if (segment) profileWhere.segments = { has: segment };
  if (minRevenue > 0) profileWhere.ltv = { gte: minRevenue };
  if (maxRevenue > 0) {
    profileWhere.ltv = { ...(profileWhere.ltv as object ?? {}), lte: maxRevenue };
  }
  if (lastOrderDays) {
    const cutoff = new Date(Date.now() - parseInt(lastOrderDays) * 86400_000);
    profileWhere.lastOrderAt = { gte: cutoff };
  }

  if (search) {
    const users = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      },
      select: { id: true },
    });
    const ids = users.map((u) => u.id);
    if (ids.length === 0) return NextResponse.json({ data: [], total: 0, page, pages: 0 });
    profileWhere.userId = { in: ids };
  }

  const orderByMap: Record<string, unknown> = {
    ltv: { ltv: sortDir },
    orderCount: { orderCount: sortDir },
    lastOrderAt: { lastOrderAt: sortDir },
    riskScore: { riskScore: sortDir },
    engagementScore: { engagementScore: sortDir },
  };

  const [data, total] = await Promise.all([
    prisma.crmProfile.findMany({
      where: profileWhere,
      orderBy: (orderByMap[sortBy] as Record<string, "asc" | "desc">) ?? { ltv: "desc" },
      skip,
      take: limit,
      include: {
        // Use raw userId to fetch user separately
      },
    }),
    prisma.crmProfile.count({ where: profileWhere }),
  ]);

  // Enrich with user info
  const userIds = data.map((d) => d.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, phone: true, createdAt: true, isActive: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const enriched = data.map((d) => ({ ...d, user: userMap[d.userId] ?? null }));

  return NextResponse.json({ data: enriched, total, page, pages: Math.ceil(total / limit) });
}

// POST: rescore a customer
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "customers:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  await recomputeCrmProfile(userId);
  const profile = await prisma.crmProfile.findUnique({ where: { userId } });
  return NextResponse.json({ ok: true, profile });
}
