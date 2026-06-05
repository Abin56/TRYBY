import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Sport } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sport     = searchParams.get("sport") as Sport | null;
  const category  = searchParams.get("category");
  const sort      = searchParams.get("sort") ?? "createdAt_desc";
  const page      = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit     = Math.min(40, Number(searchParams.get("limit") ?? "20"));
  const skip      = (page - 1) * limit;
  const minPrice  = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice  = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const minRating = searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined;

  // Sort: support field_dir and price_asc/price_desc (sort on variant price not top-level)
  const lastUnderscore = sort.lastIndexOf("_");
  const orderByField = sort.slice(0, lastUnderscore);
  const orderDir = sort.slice(lastUnderscore + 1) as "asc" | "desc";

  const validSortFields: Record<string, object> = {
    createdAt:      { createdAt: orderDir },
    totalSoldCount: { totalSoldCount: orderDir },
    avgRating:      { avgRating: orderDir },
    price:          { variants: { _min: { price: orderDir } } },
  };

  const where = {
    isActive: true,
    ...(sport ? { sport } : {}),
    ...(category ? { category: { name: { contains: category, mode: "insensitive" as const } } } : {}),
    ...(minRating !== undefined ? { avgRating: { gte: minRating } } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? { variants: { some: { isActive: true, price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } } } }
      : {}),
  };

  const [rawProducts, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true, name: true, slug: true, description: true,
        sport: true, categoryId: true,
        isActive: true, isFeatured: true, isOfficialLicensed: true,
        teamName: true, leagueName: true, teamBadgeUrl: true,
        totalSoldCount: true, weeklySoldCount: true,
        showOnHomepage: true, homepageSortOrder: true,
        avgRating: true, reviewCount: true,
        metaTitle: true, metaDescription: true,
        createdAt: true, updatedAt: true,
        images: { where: { isPrimary: true }, take: 1 },
        variants: { where: { isActive: true }, select: { price: true, mrp: true, stock: true, size: true, color: true } },
        badges: true,
      },
      orderBy: validSortFields[orderByField] ?? { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);
  const products = rawProducts;

  return NextResponse.json({ products, total, page, limit });
}
