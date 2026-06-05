import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateMobileToken } from "@/lib/mobile";

// GET — Mobile home feed: banners, featured products, categories, social proof.
// Batches all homepage data in one request to minimize mobile round-trips.
export async function GET(req: NextRequest) {
  const bearer  = req.headers.get("Authorization")?.replace("Bearer ", "");
  const session = bearer ? await validateMobileToken(bearer) : null;

  const [
    hero,
    featuredProducts,
    newArrivals,
    trending,
    categories,
    announcement,
    reviewStats,
  ] = await Promise.all([
    // Hero / banners
    prisma.contentBlock.findFirst({
      where: { key: "homepage_hero", isActive: true },
      select: { data: true },
    }).catch(() => null),

    // Featured products (in-stock, limit 12)
    prisma.product.findMany({
      where:   { isActive: true, isFeatured: true },
      orderBy: { homepageSortOrder: "asc" },
      take:    12,
      select:  mobilePdpSelect(),
    }).catch(() => []),

    // New arrivals (last 30 days)
    prisma.product.findMany({
      where:   { isActive: true, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: "desc" },
      take:    8,
      select:  mobilePdpSelect(),
    }).catch(() => []),

    // Trending (top selling)
    prisma.product.findMany({
      where:   { isActive: true },
      orderBy: { totalSoldCount: "desc" },
      take:    8,
      select:  mobilePdpSelect(),
    }).catch(() => []),

    // Top categories
    prisma.category.findMany({
      where:   { isActive: true },
      orderBy: { sortOrder: "asc" },
      take:    10,
      select:  { id: true, name: true, slug: true, imageUrl: true, description: true },
    }).catch(() => []),

    // Announcement bar
    prisma.announcementMessage.findFirst({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { message: true, ctaText: true, ctaUrl: true },
    }).catch(() => null),

    // Reviews summary
    prisma.review.aggregate({
      where:  { status: "APPROVED" },
      _avg:   { rating: true },
      _count: { id: true },
    }).catch(() => null),
  ]);

  // User-specific: wishlist IDs so app can show heart state
  let wishlistProductIds: string[] = [];
  let cartCount = 0;
  let unreadNotifications = 0;

  if (session) {
    const [wishlist, cart, notifCount] = await Promise.all([
      prisma.wishlistItem.findMany({
        where:  { userId: session.userId },
        select: { productId: true },
      }).catch(() => []),
      prisma.cartItem.count({ where: { userId: session.userId } }).catch(() => 0),
      prisma.notification.count({ where: { userId: session.userId, isRead: false } }).catch(() => 0),
    ]);
    wishlistProductIds = wishlist.map(w => w.productId);
    cartCount          = cart;
    unreadNotifications = notifCount;
  }

  return NextResponse.json({
    hero:        (hero?.data as Record<string, unknown>) ?? null,
    announcement,
    featuredProducts: attachWishlistState(featuredProducts, wishlistProductIds),
    newArrivals:      attachWishlistState(newArrivals,      wishlistProductIds),
    trending:         attachWishlistState(trending,         wishlistProductIds),
    categories,
    socialProof: {
      avgRating:    reviewStats?._avg?.rating ? Number(reviewStats._avg.rating).toFixed(1) : "4.8",
      reviewCount:  reviewStats?._count?.id ?? 0,
    },
    user: session ? { cartCount, unreadNotifications } : null,
  }, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}

function mobilePdpSelect() {
  return {
    id:          true,
    name:        true,
    slug:        true,
    avgRating:   true,
    reviewCount: true,
    isFeatured:  true,
    sport:       true,
    images:      { take: 1, select: { url: true, altText: true } },
    variants:    { where: { isActive: true }, select: { id: true, price: true, mrp: true, stock: true, size: true, color: true }, take: 5 },
    badges:      { select: { type: true, label: true }, take: 3 },
  } as const;
}

function attachWishlistState(
  products: Array<Record<string, unknown>>,
  wishlistIds: string[]
) {
  if (!wishlistIds.length) return products;
  const set = new Set(wishlistIds);
  return products.map(p => ({ ...p, inWishlist: set.has(p.id as string) }));
}
