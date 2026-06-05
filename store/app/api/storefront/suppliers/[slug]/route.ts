import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const supplier = await prisma.supplier.findUnique({
    where:  { slug },
    select: {
      id: true, companyName: true, slug: true, logoUrl: true, bannerUrl: true,
      bio: true, status: true, tier: true, onboardedAt: true,
      performanceScore: true, fulfillmentScore: true, qualityScore: true,
      trustScore: true, slaScore: true,
      avgRating: true, totalOrders: true, totalSales: true,
      fulfillmentRate: true, returnRate: true, avgShippingHrs: true, avgDeliveryDays: true,
    },
  });

  if (!supplier || supplier.status !== "APPROVED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Active products
  const [products, reviewSample] = await Promise.all([
    prisma.product.findMany({
      where:   { supplierId: supplier.id, isActive: true },
      select: {
        id: true, name: true, slug: true, sport: true,
        avgRating: true, reviewCount: true, totalSoldCount: true,
        images:   { where: { isPrimary: true }, take: 1, select: { url: true, altText: true } },
        variants: { where: { isActive: true }, take: 1, select: { price: true, mrp: true } },
        badges:   { take: 2, select: { type: true, label: true } },
      },
      orderBy: { totalSoldCount: "desc" },
      take:    24,
    }),
    prisma.review.findMany({
      where: {
        product: { supplierId: supplier.id },
        status:  "APPROVED",
        rating:  { gte: 4 },
      },
      select: {
        id: true, rating: true, title: true, body: true, createdAt: true,
        isVerified: true,
        user:    { select: { name: true, image: true } },
        product: { select: { name: true, slug: true } },
      },
      orderBy: { helpfulCount: "desc" },
      take:    6,
    }),
  ]);

  return NextResponse.json({ supplier, products, reviews: reviewSample });
}
