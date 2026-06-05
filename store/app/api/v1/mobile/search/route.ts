import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET — Mobile search: products + categories, cursor-paginated
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q        = (searchParams.get("q") ?? "").trim();
  const cursor   = searchParams.get("cursor");
  const limit    = Math.min(parseInt(searchParams.get("limit") ?? "20"), 40);
  const sport    = searchParams.get("sport");
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const sort     = searchParams.get("sort") ?? "relevance";

  if (!q && !sport) {
    return NextResponse.json({ products: [], categories: [], nextCursor: null, hasMore: false, total: 0 });
  }

  const where: Record<string, unknown> = { isActive: true, stockCount: { gt: 0 } };

  if (q) {
    where.OR = [
      { name:        { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { tags:        { has: q } },
      { sku:         { contains: q, mode: "insensitive" } },
    ];
  }

  if (sport) where.sport = sport;
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) (where.price as Record<string, number>).gte = minPrice;
    if (maxPrice !== undefined) (where.price as Record<string, number>).lte = maxPrice;
  }
  if (cursor) where.id = { lt: cursor };

  const orderBy: Record<string, string> =
    sort === "price_asc"  ? { price: "asc" }     :
    sort === "price_desc" ? { price: "desc" }    :
    sort === "rating"     ? { avgRating: "desc" } :
    sort === "newest"     ? { createdAt: "desc" } :
    { viewCount: "desc" };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      take:   limit + 1,
      select: {
        id: true, name: true, slug: true, price: true, compareAtPrice: true,
        images: true, avgRating: true, reviewCount: true, stockCount: true, badge: true, sport: true,
      },
    }),
    cursor
      ? Promise.resolve(0)
      : prisma.product.count({ where }),
    cursor
      ? Promise.resolve([])
      : prisma.category.findMany({
          where:   { isActive: true, name: { contains: q, mode: "insensitive" } },
          take:    3,
          select:  { id: true, name: true, slug: true, imageUrl: true },
        }),
  ]);

  const hasMore   = products.length > limit;
  const items     = hasMore ? products.slice(0, -1) : products;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({
    products: items,
    categories,
    nextCursor,
    hasMore,
    total: cursor ? undefined : total,
  });
}
