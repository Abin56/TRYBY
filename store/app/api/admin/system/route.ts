import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { checkEnv } from "@/lib/env";

// ── Service connectivity pings ─────────────────────────────────────────────

async function pingDatabase(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const t = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - t };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t, error: (e as Error).message };
  }
}

async function pingCloudinary(): Promise<{ ok: boolean; latencyMs: number; configured: boolean; error?: string }> {
  const t = Date.now();
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key   = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  const configured = !!(cloud && key && secret && !cloud.includes("REPLACE") && !key.includes("REPLACE"));

  if (!configured) return { ok: false, latencyMs: 0, configured: false, error: "Credentials not configured" };

  try {
    const credentials = Buffer.from(`${key}:${secret}`).toString("base64");
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud}/usage`,
      { headers: { Authorization: `Basic ${credentials}` }, signal: AbortSignal.timeout(5000) }
    );
    return { ok: res.ok, latencyMs: Date.now() - t, configured };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t, configured, error: (e as Error).message };
  }
}

async function pingRazorpay(): Promise<{ ok: boolean; latencyMs: number; configured: boolean; mode: string; error?: string }> {
  const t = Date.now();
  const keyId  = process.env.RAZORPAY_KEY_ID ?? "";
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const configured = !!(keyId && secret && !keyId.includes("REPLACE") && !secret.includes("REPLACE"));
  const mode = keyId.startsWith("rzp_live") ? "live" : keyId.startsWith("rzp_test") ? "test" : "unknown";

  if (!configured) return { ok: false, latencyMs: 0, configured, mode: "unknown", error: "Credentials not configured" };

  try {
    const credentials = Buffer.from(`${keyId}:${secret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/payments?count=1", {
      headers: { Authorization: `Basic ${credentials}` },
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.ok, latencyMs: Date.now() - t, configured, mode };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t, configured, mode, error: (e as Error).message };
  }
}

async function pingResend(): Promise<{ ok: boolean; latencyMs: number; configured: boolean; error?: string }> {
  const t = Date.now();
  const key = process.env.RESEND_API_KEY ?? "";
  const configured = !!(key && !key.includes("REPLACE"));

  if (!configured) return { ok: false, latencyMs: 0, configured, error: "API key not configured" };

  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.ok, latencyMs: Date.now() - t, configured };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t, configured, error: (e as Error).message };
  }
}

function pingOAuth(): { google: { configured: boolean } } {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  return {
    google: {
      configured: !!(clientId && clientSecret && !clientId.includes("REPLACE") && !clientSecret.includes("REPLACE")),
    },
  };
}

// ── Main route ─────────────────────────────────────────────────────────────

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const start = Date.now();

  // Run DB queries + service pings in parallel
  const [
    dbPing,
    cloudinaryPing,
    razorpayPing,
    resendPing,
    totalUsers, totalAdmins, totalCustomers, totalSuppliers,
    totalProducts, activeProducts, totalVariants, variantsOOS, variantsLowStock,
    totalCategories,
    totalOrders, pendingOrders,
    totalReturns, pendingReturns,
    totalCoupons, activeCoupons,
    totalReviews, pendingReviews,
    totalContentBlocks, publishedBlocks, draftBlocks,
    totalAnnouncements, activeAnnouncements,
    totalSiteSettings, totalMedia, totalAuditLogs, totalAdminProfiles,
    migrations, recentAudit,
  ] = await Promise.all([
    pingDatabase(),
    pingCloudinary(),
    pingRazorpay(),
    pingResend(),

    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "SUPPLIER" } }),

    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.productVariant.count(),
    prisma.productVariant.count({ where: { stock: 0, isActive: true } }),
    prisma.productVariant.count({ where: { stock: { gt: 0, lte: 5 }, isActive: true } }),
    prisma.category.count(),

    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),

    prisma.returnRequest.count(),
    prisma.returnRequest.count({ where: { status: "REQUESTED" } }),

    prisma.coupon.count(),
    prisma.coupon.count({ where: { isActive: true } }),

    prisma.review.count(),
    prisma.review.count({ where: { status: "PENDING" } }),

    prisma.contentBlock.count(),
    prisma.contentBlock.count({ where: { status: "PUBLISHED" } }),
    prisma.contentBlock.count({ where: { status: "DRAFT" } }),

    prisma.announcementMessage.count(),
    prisma.announcementMessage.count({ where: { isActive: true } }),

    prisma.siteSettings.count(),
    prisma.mediaAsset.count(),
    prisma.auditLog.count(),
    prisma.adminProfile.count(),

    prisma.$queryRaw<{ migration_name: string; finished_at: Date; applied_steps_count: number }[]>`
      SELECT migration_name, finished_at, applied_steps_count
      FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 10
    `,

    prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { admin: { include: { user: { select: { name: true, email: true } } } } },
    }),
  ]);

  const envCheck = checkEnv();
  const oauthStatus = pingOAuth();
  const totalMs = Date.now() - start;

  const allServicesOk = dbPing.ok && cloudinaryPing.ok && razorpayPing.ok && resendPing.ok;

  return NextResponse.json({
    status:    allServicesOk ? "healthy" : "degraded",
    totalMs,
    checkedAt: new Date().toISOString(),

    services: {
      database:   { ...dbPing,   name: "Neon PostgreSQL" },
      cloudinary: { ...cloudinaryPing, name: "Cloudinary CDN" },
      razorpay:   { ...razorpayPing,   name: "Razorpay Payments" },
      resend:     { ...resendPing,     name: "Resend Email" },
      oauth:      { ...oauthStatus,    name: "OAuth Providers" },
    },

    env: {
      ok:           envCheck.ok,
      missing:      envCheck.missing,
      placeholders: envCheck.placeholders,
      warnings:     envCheck.warnings,
    },

    counts: {
      users:    { total: totalUsers, admins: totalAdmins, customers: totalCustomers, suppliers: totalSuppliers, adminProfilesLinked: totalAdminProfiles },
      products: { total: totalProducts, active: activeProducts, inactive: totalProducts - activeProducts, variants: totalVariants, outOfStock: variantsOOS, lowStock: variantsLowStock, categories: totalCategories },
      orders:   { total: totalOrders, pending: pendingOrders },
      returns:  { total: totalReturns, pending: pendingReturns },
      coupons:  { total: totalCoupons, active: activeCoupons },
      reviews:  { total: totalReviews, pending: pendingReviews },
      content:  { blocks: totalContentBlocks, published: publishedBlocks, draft: draftBlocks, announcements: totalAnnouncements, activeAnnouncements, siteSettings: totalSiteSettings, media: totalMedia },
      audit:    { totalLogs: totalAuditLogs },
    },

    migrations: migrations.map(m => ({ name: m.migration_name, appliedAt: m.finished_at, steps: m.applied_steps_count })),

    recentAudit: recentAudit.map(log => ({
      id: log.id, action: log.action, resourceType: log.resourceType, resourceName: log.resourceName,
      adminName: log.admin.user.name ?? log.admin.user.email, createdAt: log.createdAt,
    })),
  });
}
