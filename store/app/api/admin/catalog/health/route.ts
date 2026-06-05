// Catalog Intelligence Center — unified health scoring
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, PaymentStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET() {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();

  const [
    // Products
    totalProducts, activeProducts,
    noImage, noMetaTitle, noMetaDesc, shortDesc, noCostPrice, noVariants, noSupplier,

    // Inventory
    totalVariants, oosVariants, lowStockVariants, noWarehouseStock,

    // Suppliers
    totalSuppliers, approvedSuppliers, pendingSuppliers,

    // Orders / Payments
    totalOrders, pendingOrders, totalRevenue,

    // Homepage
    publishedHeroBlocks, publishedContentBlocks,
    featuredProducts, homepageProducts,

    // SEO
    productsWithSeo, categoriesWithSeo, siteSettingsSeo,

    // Content
    totalCategories, totalMedia,
    activeAnnouncements,
  ] = await Promise.all([
    // Product health
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, images: { none: {} } } }),
    prisma.product.count({ where: { isActive: true, OR: [{ metaTitle: null }, { metaTitle: "" }] } }),
    prisma.product.count({ where: { isActive: true, OR: [{ metaDescription: null }, { metaDescription: "" }] } }),
    prisma.product.count({ where: { isActive: true, description: { contains: "" } } })
      .then(() => prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM "Product" WHERE "isActive" = true AND LENGTH(description) < 50`
        .then(r => Number(r[0]?.count ?? 0))),
    prisma.productVariant.count({ where: { isActive: true, costPrice: null } }),
    prisma.product.count({ where: { isActive: true, variants: { none: {} } } }),
    prisma.product.count({ where: { isActive: true, supplierId: null } }),

    // Inventory
    prisma.productVariant.count({ where: { isActive: true } }),
    prisma.productVariant.count({ where: { isActive: true, stock: 0 } }),
    prisma.productVariant.count({ where: { isActive: true, stock: { gt: 0, lte: 5 } } }),
    prisma.productVariant.count({ where: { isActive: true, warehouseStocks: { none: {} } } }),

    // Suppliers
    prisma.supplier.count(),
    prisma.supplier.count({ where: { status: "APPROVED" } }),
    prisma.supplier.count({ where: { status: "PENDING" } }),

    // Orders
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: PaymentStatus.CAPTURED } }),

    // Homepage
    prisma.contentBlock.count({ where: { status: "PUBLISHED", type: "HERO_BANNER" } }),
    prisma.contentBlock.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count({ where: { isFeatured: true, isActive: true } }),
    prisma.product.count({ where: { showOnHomepage: true, isActive: true } }),

    // SEO
    prisma.product.count({ where: { isActive: true, metaTitle: { not: null }, metaDescription: { not: null } } }),
    prisma.category.count({ where: { isActive: true, metaTitle: { not: null } } }),
    prisma.siteSettings.count(),

    // Content
    prisma.category.count({ where: { isActive: true } }),
    prisma.mediaAsset.count(),
    prisma.announcementMessage.count({ where: { isActive: true } }),
  ]);

  // ── Score calculations ──────────────────────────────────────────────────────

  // Product health score (0–100)
  const pHealthIssues = noImage + noMetaTitle + noMetaDesc + noCostPrice + noVariants;
  const pHealthScore  = totalProducts > 0
    ? Math.max(0, Math.round(100 - (pHealthIssues / (totalProducts * 5)) * 100))
    : 0;

  // Inventory health score (0–100)
  const invPct       = totalVariants > 0 ? oosVariants / totalVariants : 0;
  const invScore     = Math.max(0, Math.round(100 - invPct * 100 - (lowStockVariants / Math.max(1, totalVariants)) * 30));

  // Supplier health score (0–100)
  const supplierScore = totalSuppliers === 0 ? 0
    : Math.round((approvedSuppliers / totalSuppliers) * 100);

  // Homepage readiness (0–100)
  const hpScore = Math.min(100, Math.round(
    (publishedHeroBlocks > 0 ? 30 : 0) +
    (publishedContentBlocks >= 3 ? 25 : publishedContentBlocks * 8) +
    (featuredProducts >= 5 ? 25 : featuredProducts * 5) +
    (homepageProducts >= 3 ? 20 : homepageProducts * 6)
  ));

  // SEO readiness (0–100)
  const seoScore = totalProducts > 0
    ? Math.min(100, Math.round(
        (productsWithSeo / totalProducts) * 50 +
        (totalCategories > 0 ? (categoriesWithSeo / totalCategories) * 30 : 0) +
        (siteSettingsSeo > 0 ? 20 : 0)
      ))
    : 0;

  // Overall catalog score
  const overallScore = Math.round(
    (pHealthScore * 0.25) +
    (invScore     * 0.20) +
    (supplierScore * 0.15) +
    (hpScore      * 0.20) +
    (seoScore     * 0.20)
  );

  return NextResponse.json({
    overallScore,
    checkedAt: now.toISOString(),

    productHealth: {
      score:            pHealthScore,
      totalActive:      totalProducts,
      missingImage:     noImage,
      missingMetaTitle: noMetaTitle,
      missingMetaDesc:  noMetaDesc,
      shortDescription: shortDesc,
      missingCostPrice: noCostPrice,
      missingVariants:  noVariants,
      missingSupplier:  noSupplier,
    },

    inventoryHealth: {
      score:             invScore,
      totalVariants,
      outOfStock:        oosVariants,
      lowStock:          lowStockVariants,
      noWarehouseStock,
      oosRate:           totalVariants > 0 ? Math.round((oosVariants / totalVariants) * 1000) / 10 : 0,
    },

    supplierHealth: {
      score:    supplierScore,
      total:    totalSuppliers,
      approved: approvedSuppliers,
      pending:  pendingSuppliers,
    },

    homepageReadiness: {
      score:              hpScore,
      heroPublished:      publishedHeroBlocks > 0,
      publishedBlocks:    publishedContentBlocks,
      featuredProducts,
      homepageProducts,
    },

    seoReadiness: {
      score:              seoScore,
      productsWithSeo,
      totalProducts,
      categoriesWithSeo,
      totalCategories,
      siteSettingsConfigured: siteSettingsSeo > 0,
      seoCompletionPct: totalProducts > 0 ? Math.round((productsWithSeo / totalProducts) * 100) : 0,
    },

    content: {
      categories:    totalCategories,
      media:         totalMedia,
      announcements: activeAnnouncements,
    },

    commerce: {
      totalOrders,
      pendingOrders,
      totalRevenue: Math.round(Number(totalRevenue._sum.amount ?? 0)),
    },
  });
}
