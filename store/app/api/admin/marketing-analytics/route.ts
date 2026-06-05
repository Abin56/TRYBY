import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// GET /api/admin/marketing-analytics
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days  = Math.min(90, Math.max(7, parseInt(searchParams.get("days") ?? "30")));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    campaignStats,
    couponStats,
    loyaltyStats,
    referralStats,
    abandonedCartStats,
    campaignsByType,
    topCampaigns,
  ] = await Promise.all([
    // Campaign aggregate metrics
    prisma.campaign.aggregate({
      where:   { createdAt: { gte: since } },
      _sum:    { sentCount: true, openCount: true, clickCount: true, conversionCount: true, revenueGenerated: true, couponUsedCount: true },
      _count:  { _all: true },
    }),

    // Coupon revenue
    prisma.order.aggregate({
      where:   { createdAt: { gte: since }, couponId: { not: null } },
      _sum:    { total: true, discount: true },
      _count:  { _all: true },
    }),

    // Loyalty redemptions
    prisma.loyaltyPoint.aggregate({
      where:   { createdAt: { gte: since }, type: "REDEEM" },
      _sum:    { points: true },
      _count:  { _all: true },
    }).catch(() => ({ _sum: { points: 0 }, _count: { _all: 0 } })),

    // Referral completions
    prisma.referral.count({
      where: { createdAt: { gte: since }, status: { in: ["COMPLETED", "REWARDED"] } },
    }).catch(() => 0),

    // Abandoned cart recovery
    prisma.abandonedCart.groupBy({
      by:    ["status"],
      _count: { _all: true },
      _sum:   { cartValue: true },
    }).catch(() => []),

    // Campaigns by type
    prisma.campaign.groupBy({
      by:     ["type", "status"],
      _count: { _all: true },
      _sum:   { revenueGenerated: true, sentCount: true },
    }),

    // Top performing campaigns
    prisma.campaign.findMany({
      where:   { status: { in: ["RUNNING", "COMPLETED"] }, revenueGenerated: { gt: 0 } },
      orderBy: { revenueGenerated: "desc" },
      take:    5,
      select:  { id: true, name: true, type: true, status: true, sentCount: true, conversionCount: true, revenueGenerated: true },
    }),
  ]);

  // Repeat purchase rate — customers with 2+ orders in period
  const repeatCustomers = await prisma.order.groupBy({
    by:      ["userId"],
    having:  { userId: { _count: { gte: 2 } } },
    where:   { createdAt: { gte: since }, status: { in: ["DELIVERED", "SHIPPED", "OUT_FOR_DELIVERY"] } },
  }).catch(() => []);

  const uniqueCustomers = await prisma.order.findMany({
    where:   { createdAt: { gte: since } },
    select:  { userId: true },
    distinct: ["userId"],
  }).catch(() => []);

  const repeatRate = uniqueCustomers.length > 0
    ? ((repeatCustomers.length / uniqueCustomers.length) * 100).toFixed(1)
    : "0.0";

  // Daily campaign revenue for chart
  const dailyRevenue = await prisma.campaign.findMany({
    where:   { startedAt: { gte: since }, revenueGenerated: { gt: 0 } },
    select:  { startedAt: true, revenueGenerated: true, type: true },
    orderBy: { startedAt: "asc" },
  }).catch(() => []);

  return NextResponse.json({
    period: { days, since: since.toISOString() },
    campaigns: {
      total:        campaignStats._count._all,
      sent:         campaignStats._sum.sentCount ?? 0,
      opens:        campaignStats._sum.openCount ?? 0,
      clicks:       campaignStats._sum.clickCount ?? 0,
      conversions:  campaignStats._sum.conversionCount ?? 0,
      revenue:      Number(campaignStats._sum.revenueGenerated ?? 0),
      couponUsed:   campaignStats._sum.couponUsedCount ?? 0,
      openRate:     campaignStats._sum.sentCount
        ? ((campaignStats._sum.openCount ?? 0) / campaignStats._sum.sentCount * 100).toFixed(1)
        : "0.0",
      conversionRate: campaignStats._sum.sentCount
        ? ((campaignStats._sum.conversionCount ?? 0) / campaignStats._sum.sentCount * 100).toFixed(2)
        : "0.00",
    },
    coupons: {
      ordersWithCoupon: couponStats._count._all,
      totalDiscount:    Number(couponStats._sum.discount ?? 0),
      revenueWithCoupon: Number(couponStats._sum.total ?? 0),
    },
    loyalty: {
      redemptions:    loyaltyStats._count._all,
      pointsRedeemed: loyaltyStats._sum.points ?? 0,
      // 10 pts = ₹1
      valueRedeemed:  Math.floor(Math.abs(loyaltyStats._sum.points ?? 0) / 10),
    },
    referrals: {
      completed: referralStats,
    },
    abandonedCart: {
      byStatus: abandonedCartStats,
    },
    repeatRate,
    campaignsByType,
    topCampaigns,
    dailyRevenue,
  });
}
