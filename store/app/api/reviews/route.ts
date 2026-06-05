import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { ReviewStatus } from "@prisma/client";

// ── GET — list approved reviews for a product ─────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const page    = parseInt(searchParams.get("page") ?? "1");
  const limit   = 20;
  const sort    = searchParams.get("sort") ?? "helpful"; // helpful | newest | highest | lowest
  const ratingF = searchParams.get("rating"); // filter by exact star

  const where: Record<string, unknown> = {
    productId,
    status: ReviewStatus.APPROVED,
  };
  if (ratingF) where.rating = parseInt(ratingF);

  const orderBy =
    sort === "newest"  ? [{ createdAt:   "desc" as const }] :
    sort === "highest" ? [{ rating:      "desc" as const }, { createdAt: "desc" as const }] :
    sort === "lowest"  ? [{ rating:      "asc"  as const }, { createdAt: "desc" as const }] :
    /* helpful */        [{ isFeatured:  "desc" as const }, { isVerified: "desc" as const }, { helpfulCount: "desc" as const }, { createdAt: "desc" as const }];

  const [reviews, total, breakdown] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { user: { select: { name: true, image: true } } },
      orderBy,
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    prisma.review.count({ where }),

    // Rating breakdown for this product
    prisma.review.groupBy({
      by:    ["rating"],
      where: { productId, status: ReviewStatus.APPROVED },
      _count: { id: true },
    }),
  ]);

  const ratingBreakdown = Object.fromEntries(
    [1, 2, 3, 4, 5].map(r => [String(r), breakdown.find(b => b.rating === r)?._count.id ?? 0])
  );

  // Product summary
  const product = await prisma.product.findUnique({
    where:  { id: productId },
    select: { avgRating: true, reviewCount: true },
  });

  return NextResponse.json({
    reviews,
    total,
    pages: Math.ceil(total / limit),
    summary: {
      avgRating:    Number(product?.avgRating ?? 0),
      reviewCount:  product?.reviewCount ?? 0,
      breakdown:    ratingBreakdown,
    },
  });
}

// ── POST — submit a review ─────────────────────────────────────────────────

const reviewSchema = z.object({
  productId:   z.string().cuid(),
  orderItemId: z.string().cuid().optional(),
  rating:      z.number().int().min(1).max(5),
  title:       z.string().max(100).optional(),
  body:        z.string().min(10).max(2000),
  imageUrls:   z.array(z.string().url()).max(8).optional().default([]),
  videoUrls:   z.array(z.string().url()).max(2).optional().default([]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = reviewSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { productId, orderItemId, rating, title, body: reviewBody, imageUrls, videoUrls } = body.data;

  // Check not already reviewed
  const existing = await prisma.review.findFirst({
    where: { userId: session.user.id, productId },
  });
  if (existing) return NextResponse.json({ error: "You have already reviewed this product" }, { status: 409 });

  // Verify purchase — must have bought to be verified
  let isVerified = false;
  let verifiedOrderItemId = orderItemId;

  if (orderItemId) {
    const item = await prisma.orderItem.findFirst({
      where: { id: orderItemId, order: { userId: session.user.id, status: "DELIVERED" } },
    });
    isVerified = !!item;
  } else {
    // Auto-detect: find any delivered order with this product
    const item = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId: session.user.id, status: "DELIVERED" },
        review: null,
      },
    });
    if (item) {
      isVerified = true;
      verifiedOrderItemId = item.id;
    }
  }

  // Non-purchasers can still review but won't be verified
  const review = await prisma.review.create({
    data: {
      userId:      session.user.id,
      productId,
      orderItemId: verifiedOrderItemId ?? null,
      rating,
      title:       title?.trim() || null,
      body:        reviewBody.trim(),
      imageUrls:   imageUrls ?? [],
      videoUrls:   videoUrls ?? [],
      isVerified,
      status:      ReviewStatus.PENDING,
    },
  });

  return NextResponse.json(review, { status: 201 });
}
