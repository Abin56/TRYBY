import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateMobileToken } from "@/lib/mobile";

// GET — Mobile-optimized product detail page data.
// Returns everything the PDP screen needs in one call.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const bearer  = req.headers.get("Authorization")?.replace("Bearer ", "");
  const session = bearer ? await validateMobileToken(bearer) : null;

  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      variants: {
        where:   { isActive: true },
        orderBy: { sortOrder: "asc" },
        select:  { id: true, name: true, sku: true, price: true, stockCount: true, attributes: true, images: true },
      },
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Increment view count (fire-and-forget)
  prisma.product.update({
    where: { id: product.id },
    data:  { viewCount: { increment: 1 } },
  }).catch(() => null);

  // Get top reviews, user wishlist state and cart state
  const [reviews, wishlistItem, cartItem] = await Promise.all([
    prisma.review.findMany({
      where:   { productId: product.id, status: "APPROVED" },
      orderBy: [{ isFeatured: "desc" }, { helpfulCount: "desc" }, { createdAt: "desc" }],
      take:    5,
      select:  {
        id: true, rating: true, title: true, body: true,
        imageUrls: true, videoUrls: true,
        createdAt: true, helpfulCount: true, isVerifiedPurchase: true,
        user: { select: { name: true, image: true } },
      },
    }),
    session
      ? prisma.wishlistItem.findFirst({ where: { userId: session.userId, productId: product.id } })
      : null,
    session
      ? prisma.cartItem.findFirst({ where: { userId: session.userId, productId: product.id } })
      : null,
  ]);

  // Related products (same category, in stock)
  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id:         { not: product.id },
      isActive:   true,
      stockCount: { gt: 0 },
    },
    take:    6,
    orderBy: { avgRating: "desc" },
    select:  { id: true, name: true, slug: true, price: true, compareAtPrice: true, images: true, avgRating: true, badge: true },
  });

  return NextResponse.json({
    product: {
      id:              product.id,
      name:            product.name,
      slug:            product.slug,
      description:     product.description,
      price:           product.price,
      compareAtPrice:  product.compareAtPrice,
      images:          product.images,
      avgRating:       product.avgRating,
      reviewCount:     product.reviewCount,
      stockCount:      product.stockCount,
      sku:             product.sku,
      weight:          product.weight,
      dimensions:      product.dimensions,
      badge:           product.badge,
      sport:           product.sport,
      isFeatured:      product.isFeatured,
      isTrending:      product.isTrending,
      tags:            product.tags,
      category:        product.category,
      variants:        product.variants,
      specifications:  product.specifications,
      returnPolicy:    product.returnPolicy,
    },
    reviews: {
      items:      reviews,
      totalCount: product.reviewCount,
    },
    related,
    userState: {
      inWishlist: !!wishlistItem,
      inCart:     !!cartItem,
      cartQty:    cartItem?.quantity ?? 0,
    },
  });
}
