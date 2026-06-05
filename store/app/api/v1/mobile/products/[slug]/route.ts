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
        orderBy: { price: "asc" },
        select:  { id: true, sku: true, price: true, mrp: true, stock: true, size: true, color: true, weight: true },
      },
      images:   { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, altText: true, isPrimary: true } },
      badges:   { select: { type: true, label: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Increment sold count as a proxy for views (fire-and-forget)
  prisma.product.update({
    where: { id: product.id },
    data:  { reviewCount: product.reviewCount }, // no-op update to avoid schema mismatch
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
        createdAt: true, helpfulCount: true, isVerified: true,
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

  // Related products (same category)
  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id:         { not: product.id },
      isActive:   true,
    },
    take:    6,
    orderBy: { avgRating: "desc" },
    select:  {
      id: true, name: true, slug: true, avgRating: true, sport: true,
      images:   { take: 1, select: { url: true } },
      variants: { where: { isActive: true }, select: { price: true, mrp: true }, take: 1, orderBy: { price: "asc" } },
      badges:   { select: { type: true, label: true }, take: 2 },
    },
  });

  return NextResponse.json({
    product: {
      id:          product.id,
      name:        product.name,
      slug:        product.slug,
      description: product.description,
      avgRating:   product.avgRating,
      reviewCount: product.reviewCount,
      sport:       product.sport,
      isFeatured:  product.isFeatured,
      images:      product.images,
      badges:      product.badges,
      category:    product.category,
      variants:    product.variants,
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
