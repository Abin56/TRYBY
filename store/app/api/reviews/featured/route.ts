import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ReviewStatus } from "@prisma/client";

export const revalidate = 300; // 5-minute cache

export async function GET() {
  const reviews = await prisma.review.findMany({
    where: {
      status:  ReviewStatus.APPROVED,
      rating:  { gte: 4 },
      body:    { not: null },
    },
    include: {
      user:    { select: { name: true, image: true } },
      product: { select: { name: true, slug: true, sport: true } },
    },
    orderBy: [
      { isFeatured:  "desc" },
      { isVerified:  "desc" },
      { helpfulCount: "desc" },
      { createdAt:   "desc" },
    ],
    take: 12,
  });

  // Platform aggregate
  const stats = await prisma.review.aggregate({
    where:  { status: ReviewStatus.APPROVED },
    _count: { id: true },
    _avg:   { rating: true },
  });

  return NextResponse.json({
    reviews,
    stats: {
      total:     stats._count.id,
      avgRating: Number(stats._avg.rating ?? 0).toFixed(1),
    },
  });
}
