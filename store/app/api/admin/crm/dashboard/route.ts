import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  if (!canAccess(session, "customers:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 86400_000);
    const d7 = new Date(now.getTime() - 7 * 86400_000);

    const [
      totalCustomers,
      newCustomers30d,
      crmProfiles,
      segmentDist,
      revenueBySegment,
      topCustomers,
      openTickets,
      recentActivity,
      retentionData,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: d30 } } }),
      prisma.crmProfile.aggregate({
        _avg: { ltv: true, engagementScore: true, riskScore: true },
        _sum: { ltv: true },
        _count: { _all: true },
      }),
      prisma.crmProfile.findMany({
        select: { segments: true },
      }),
      // Revenue trend (last 30 days)
      prisma.order.groupBy({
        by: ["createdAt"],
        where: { status: "DELIVERED", createdAt: { gte: d30 } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      prisma.crmProfile.findMany({
        where: { ltv: { gt: 0 } },
        orderBy: { ltv: "desc" },
        take: 10,
        select: {
          userId: true, ltv: true, orderCount: true, segments: true,
          engagementScore: true, lastOrderAt: true,
        },
      }),
      prisma.customerTicket.count({ where: { status: { in: ["OPEN", "PENDING", "IN_PROGRESS"] } } }),
      prisma.customerActivity.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      // Customers who ordered in last 30d vs 30-60d (retention)
      Promise.all([
        prisma.order.groupBy({ by: ["userId"], where: { createdAt: { gte: d30 } }, _count: true }),
        prisma.order.groupBy({ by: ["userId"], where: { createdAt: { gte: new Date(now.getTime() - 60 * 86400_000), lt: d30 } }, _count: true }),
      ]),
    ]);

    // Enrich top customers with user info
    const userIds = topCustomers.map((c) => c.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, phone: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    // Segment counts from in-memory aggregation
    const segCounts: Record<string, number> = {};
    for (const p of segmentDist) {
      for (const seg of p.segments) {
        segCounts[seg] = (segCounts[seg] ?? 0) + 1;
      }
    }

    // Ticket stats
    const [ticketsByStatus, ticketsByPriority] = await Promise.all([
      prisma.customerTicket.groupBy({ by: ["status"], _count: true }),
      prisma.customerTicket.groupBy({ by: ["priority"], _count: true }),
    ]);

    // New customers trend (daily, last 14d)
    const newCustomersTrend = await prisma.user.groupBy({
      by: ["createdAt"],
      where: { role: "CUSTOMER", createdAt: { gte: new Date(now.getTime() - 14 * 86400_000) } },
      _count: true,
    });

    const [active30d, active60d] = retentionData;
    const retentionRate = active60d.length > 0
      ? ((active30d.filter((a) => active60d.some((b) => b.userId === a.userId)).length / active60d.length) * 100).toFixed(1)
      : "0";

    return NextResponse.json({
      kpis: {
        totalCustomers,
        newCustomers30d,
        vipCount: segCounts["VIP"] ?? 0,
        highValueCount: segCounts["HIGH_VALUE"] ?? 0,
        atRiskCount: (segCounts["AT_RISK"] ?? 0) + (segCounts["INACTIVE"] ?? 0),
        churnedCount: segCounts["CHURNED"] ?? 0,
        totalLtv: Number(crmProfiles._sum.ltv ?? 0),
        avgLtv: Number(crmProfiles._avg.ltv ?? 0),
        avgEngagement: Number(crmProfiles._avg.engagementScore ?? 0),
        openTickets,
        retentionRate: parseFloat(retentionRate),
        activeCustomers30d: active30d.length,
      },
      segmentCounts: segCounts,
      topCustomers: topCustomers.map((c) => ({ ...c, user: userMap[c.userId] ?? null })),
      ticketsByStatus,
      ticketsByPriority,
      recentActivity,
      newCustomersTrend,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
