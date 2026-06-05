import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { checkEnv } from "@/lib/env";

export async function GET() {
  const session = await auth();
  if (!canAccess(session, "settings:read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [
    productCount, activeProducts, variantsOOS, categories,
    orderCount, pendingOrders, totalRevenue,
    userCount, lockedAccounts,
    reviewCount, pendingReviews, avgRating,
    publishedBlocks, activeAnnouncements,
    rateLimitHits24h, failedLogins24h, securityEvents24h,
    mediaCount,
    migrations,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.productVariant.count({ where: { stock: 0, isActive: true } }),
    prisma.category.count({ where: { isActive: true } }),

    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { notIn: ["CANCELLED", "RETURNED", "REFUNDED"] } } }),

    prisma.user.count(),
    prisma.user.count({ where: { lockedUntil: { gt: new Date() } } }),

    prisma.review.count({ where: { status: "APPROVED" } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.review.aggregate({ _avg: { rating: true } }),

    prisma.contentBlock.count({ where: { status: "PUBLISHED" } }),
    prisma.announcementMessage.count({ where: { isActive: true } }),

    prisma.securityEvent.count({ where: { type: "RATE_LIMIT_HIT", createdAt: { gte: new Date(Date.now() - 86400_000) } } }),
    prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: new Date(Date.now() - 86400_000) } } }),
    prisma.securityEvent.count({ where: { createdAt: { gte: new Date(Date.now() - 86400_000) } } }),

    prisma.mediaAsset.count(),

    prisma.$queryRaw<{ migration_name: string; finished_at: Date }[]>`
      SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1
    `.catch(() => []),
  ]);

  const env = checkEnv();
  const revenueTotal = Number(totalRevenue._sum.total ?? 0);

  // ── Score calculations ─────────────────────────────────────────────────

  // Security score (0–100)
  const securityScore = Math.max(0, 100
    - (lockedAccounts > 0 ? 10 : 0)
    - (rateLimitHits24h > 50 ? 15 : rateLimitHits24h > 10 ? 5 : 0)
    - (failedLogins24h > 20 ? 15 : failedLogins24h > 5 ? 5 : 0)
    - (!env.ok ? 20 : 0)
    - (env.placeholders.length * 5)
  );

  // SEO score (0–100)
  const seoScore = Math.max(0, Math.min(100,
    (publishedBlocks >= 5 ? 30 : publishedBlocks * 6) +
    (activeProducts > 0 ? 20 : 0) +
    (categories > 2 ? 20 : 0) +
    (activeAnnouncements > 0 ? 10 : 0) +
    (mediaCount > 10 ? 20 : mediaCount * 2)
  ));

  // Service score (0–100) — based on env completeness
  const requiredServices = 5; // db, cloudinary, razorpay, resend, nextauth
  const missingServices = env.missing.length + env.placeholders.length;
  const serviceScore = Math.max(0, Math.round(((requiredServices - Math.min(missingServices, requiredServices)) / requiredServices) * 100));

  // Revenue score (0–100) — soft metric
  const revenueScore = Math.min(100, Math.round(
    (orderCount > 0 ? 30 : 0) +
    (revenueTotal > 100000 ? 40 : revenueTotal > 10000 ? 20 : revenueTotal > 0 ? 10 : 0) +
    (activeProducts > 10 ? 30 : activeProducts * 3)
  ));

  // Health score (0–100)
  const healthScore = Math.max(0, Math.min(100, Math.round(
    (activeProducts > 0 ? 20 : 0) +
    (variantsOOS === 0 ? 20 : variantsOOS < 5 ? 15 : 5) +
    (pendingOrders === 0 ? 20 : pendingOrders < 10 ? 15 : 5) +
    (pendingReviews < 5 ? 20 : 10) +
    (migrations.length > 0 ? 20 : 0)
  )));

  const overallScore = Math.round((securityScore + seoScore + serviceScore + revenueScore + healthScore) / 5);

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    overall:  overallScore,
    scores: {
      security: securityScore,
      seo:      seoScore,
      services: serviceScore,
      revenue:  revenueScore,
      health:   healthScore,
    },
    details: {
      products:    { total: productCount, active: activeProducts, outOfStock: variantsOOS, categories },
      orders:      { total: orderCount, pending: pendingOrders, revenueTotal },
      users:       { total: userCount, locked: lockedAccounts },
      reviews:     { approved: reviewCount, pending: pendingReviews, avgRating: Number(avgRating._avg.rating ?? 0).toFixed(1) },
      content:     { published: publishedBlocks, activeAnnouncements, media: mediaCount },
      security:    { rateLimitHits24h, failedLogins24h, securityEvents24h, lockedAccounts },
      env:         { ok: env.ok, missing: env.missing.length, placeholders: env.placeholders.length, warnings: env.warnings.length },
      migration:   migrations[0] ? { name: migrations[0].migration_name, appliedAt: migrations[0].finished_at } : null,
    },
  });
}
