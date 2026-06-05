// Homepage Merchandising Engine — manage all homepage product sections
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole, PaymentStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// GET — fetch all homepage sections with their products
export async function GET() {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
  const sevenDaysAgo  = new Date(now.getTime() - 7 * 86_400_000);
  const thirtyDaysAgoNew = new Date(now.getTime() - 14 * 86_400_000);

  const [featured, trendingBadged, bestSellers, newArrivals, staffPicks, supplierFeatured] = await Promise.all([
    // Featured (admin-curated)
    prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      include: {
        images:   { where: { isPrimary: true }, take: 1 },
        variants: { select: { price: true, stock: true }, take: 1 },
        category: { select: { name: true } },
      },
      orderBy: { homepageSortOrder: "asc" },
      take: 20,
    }),

    // Trending (TRENDING badge)
    prisma.product.findMany({
      where: { isActive: true, badges: { some: { type: "TRENDING" } } },
      include: {
        images:   { where: { isPrimary: true }, take: 1 },
        variants: { select: { price: true, stock: true }, take: 1 },
        badges:   { select: { type: true } },
        category: { select: { name: true } },
      },
      orderBy: { weeklySoldCount: "desc" },
      take: 20,
    }),

    // Best sellers (by totalSoldCount)
    prisma.product.findMany({
      where: { isActive: true, totalSoldCount: { gt: 0 } },
      include: {
        images:   { where: { isPrimary: true }, take: 1 },
        variants: { select: { price: true, stock: true }, take: 1 },
        category: { select: { name: true } },
      },
      orderBy: { totalSoldCount: "desc" },
      take: 20,
    }),

    // New arrivals (created in last 14 days)
    prisma.product.findMany({
      where: { isActive: true, createdAt: { gte: thirtyDaysAgoNew } },
      include: {
        images:   { where: { isPrimary: true }, take: 1 },
        variants: { select: { price: true, stock: true }, take: 1 },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),

    // Staff picks (showOnHomepage flag)
    prisma.product.findMany({
      where: { isActive: true, showOnHomepage: true },
      include: {
        images:   { where: { isPrimary: true }, take: 1 },
        variants: { select: { price: true, stock: true }, take: 1 },
        category: { select: { name: true } },
      },
      orderBy: { homepageSortOrder: "asc" },
      take: 20,
    }),

    // Supplier featured (supplier products that are also featured)
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true, supplierId: { not: null } },
      include: {
        images:   { where: { isPrimary: true }, take: 1 },
        variants: { select: { price: true, stock: true }, take: 1 },
        supplier: { select: { companyName: true, logoUrl: true, tier: true } },
        category: { select: { name: true } },
      },
      orderBy: { homepageSortOrder: "asc" },
      take: 20,
    }),
  ]);

  const toCard = (p: typeof featured[0] & { badges?: { type: string }[]; supplier?: { companyName: string; logoUrl: string | null; tier: string } | null }) => ({
    id:           p.id,
    name:         p.name,
    slug:         p.slug,
    sport:        p.sport,
    category:     p.category.name,
    image:        p.images[0]?.url ?? null,
    price:        Number(p.variants[0]?.price ?? 0),
    stock:        p.variants[0]?.stock ?? 0,
    isFeatured:   p.isFeatured,
    showOnHomepage: p.showOnHomepage,
    homepageSortOrder: p.homepageSortOrder,
    badges:       (p as { badges?: { type: string }[] }).badges?.map(b => b.type) ?? [],
    supplier:     (p as { supplier?: { companyName: string; logoUrl: string | null; tier: string } | null }).supplier ?? null,
  });

  return NextResponse.json({
    sections: {
      featured:         { title: "Featured Products",          count: featured.length,         products: featured.map(toCard) },
      trending:         { title: "Trending Now",               count: trendingBadged.length,   products: trendingBadged.map(toCard) },
      bestSellers:      { title: "Best Sellers",               count: bestSellers.length,      products: bestSellers.map(toCard) },
      newArrivals:      { title: "New Arrivals",               count: newArrivals.length,      products: newArrivals.map(toCard) },
      staffPicks:       { title: "Staff Picks",                count: staffPicks.length,       products: staffPicks.map(toCard) },
      supplierFeatured: { title: "Supplier Featured",          count: supplierFeatured.length, products: supplierFeatured.map(toCard) },
    },
  });
}

// PATCH — update sort order or section membership for products
const patchSchema = z.object({
  action: z.enum(["reorder_featured", "reorder_homepage", "toggle_featured", "toggle_homepage", "add_badge", "remove_badge"]),
  productId:         z.string().optional(),
  orderedProductIds: z.array(z.string()).optional(),
  badge:             z.enum(["TRENDING", "NEW", "SALE", "OFFICIAL", "BEST_SELLER", "LIMITED"]).optional(),
  value:             z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { action, productId, orderedProductIds, badge, value } = body.data;

  if (action === "reorder_featured" && orderedProductIds) {
    await Promise.all(orderedProductIds.map((id, index) =>
      prisma.product.update({ where: { id }, data: { homepageSortOrder: index } })
    ));
    return NextResponse.json({ ok: true, updated: orderedProductIds.length });
  }

  if (action === "reorder_homepage" && orderedProductIds) {
    await Promise.all(orderedProductIds.map((id, index) =>
      prisma.product.update({ where: { id }, data: { homepageSortOrder: index } })
    ));
    return NextResponse.json({ ok: true, updated: orderedProductIds.length });
  }

  if ((action === "toggle_featured" || action === "toggle_homepage") && productId) {
    const current = await prisma.product.findUnique({
      where:  { id: productId },
      select: { isFeatured: true, showOnHomepage: true },
    });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (action === "toggle_featured") {
      const newVal = value !== undefined ? value : !current.isFeatured;
      await prisma.product.update({ where: { id: productId }, data: { isFeatured: newVal } });
      return NextResponse.json({ ok: true, isFeatured: newVal });
    } else {
      const newVal = value !== undefined ? value : !current.showOnHomepage;
      await prisma.product.update({ where: { id: productId }, data: { showOnHomepage: newVal } });
      return NextResponse.json({ ok: true, showOnHomepage: newVal });
    }
  }

  if (action === "add_badge" && productId && badge) {
    await prisma.productBadge.upsert({
      where:  { productId_type: { productId, type: badge } },
      create: { productId, type: badge },
      update: {},
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "remove_badge" && productId && badge) {
    await prisma.productBadge.deleteMany({ where: { productId, type: badge } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
