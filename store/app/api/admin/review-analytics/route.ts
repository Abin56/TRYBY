import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, ReviewStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET() {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalReviews,
    pendingCount,
    approvedCount,
    rejectedCount,
    statusBreakdown,
    ratingBreakdown,
    recentReviews,
    poorRatingProducts,
    noReviewProducts,
    avgRating,
    reviewsLast30Days,
    topReviewedProducts,
    verifiedCount,
    withImagesCount,
  ] = await Promise.all([

    prisma.review.count(),

    prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
    prisma.review.count({ where: { status: ReviewStatus.APPROVED } }),
    prisma.review.count({ where: { status: ReviewStatus.REJECTED } }),

    prisma.review.groupBy({ by: ["status"], _count: { id: true } }),

    prisma.review.groupBy({
      by:    ["rating"],
      where: { status: ReviewStatus.APPROVED },
      _count: { id: true },
      orderBy: { rating: "desc" },
    }),

    // Recent 7 days trend
    prisma.review.groupBy({
      by:    ["createdAt"],
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      _count: { id: true },
    }),

    // Products with avg < 3.0 (poor rating) — minimum 3 reviews
    prisma.product.findMany({
      where:   { avgRating: { lt: 3, gt: 0 }, reviewCount: { gte: 3 }, isActive: true },
      select:  { id: true, name: true, slug: true, avgRating: true, reviewCount: true, images: { where: { isPrimary: true }, take: 1 } },
      orderBy: { avgRating: "asc" },
      take:    20,
    }),

    // Products with no reviews
    prisma.product.count({ where: { reviewCount: 0, isActive: true } }),

    prisma.review.aggregate({
      where:  { status: ReviewStatus.APPROVED },
      _avg:   { rating: true },
    }),

    // Volume in last 30 days
    prisma.review.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),

    // Most reviewed products
    prisma.product.findMany({
      where:   { reviewCount: { gt: 0 } },
      select:  { id: true, name: true, slug: true, avgRating: true, reviewCount: true, images: { where: { isPrimary: true }, take: 1 } },
      orderBy: { reviewCount: "desc" },
      take:    10,
    }),

    prisma.review.count({ where: { isVerified: true } }),

    prisma.review.count({ where: { imageUrls: { isEmpty: false } } }),
  ]);

  // Total orders delivered (for conversion rate)
  const deliveredOrders = await prisma.order.count({ where: { status: "DELIVERED" } });
  const conversionRate   = deliveredOrders > 0 ? ((approvedCount / deliveredOrders) * 100).toFixed(1) : "0";

  // Daily breakdown for sparkline (last 30 days)
  const dailyVolume = await prisma.review.findMany({
    where:   { createdAt: { gte: thirtyDaysAgo } },
    select:  { createdAt: true },
  });
  const byDay: Record<string, number> = {};
  for (const r of dailyVolume) {
    const day = r.createdAt.toISOString().slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
  }
  const dailyData = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    overview: {
      total:           totalReviews,
      pending:         pendingCount,
      approved:        approvedCount,
      rejected:        rejectedCount,
      avgRating:       Number(avgRating._avg.rating ?? 0).toFixed(2),
      verifiedPct:     approvedCount > 0 ? ((verifiedCount / approvedCount) * 100).toFixed(0) : "0",
      withImagesPct:   approvedCount > 0 ? ((withImagesCount / approvedCount) * 100).toFixed(0) : "0",
      conversionRate,
      last30Days:      reviewsLast30Days,
      noReviewProducts,
    },
    ratingBreakdown: Object.fromEntries(ratingBreakdown.map(r => [String(r.rating), r._count.id])),
    statusBreakdown: Object.fromEntries(statusBreakdown.map(s => [s.status, s._count.id])),
    poorRatingProducts,
    topReviewedProducts,
    dailyData,
  });
}
