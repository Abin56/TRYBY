// Launch Readiness V2 — operational scorecard across all dimensions
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, PaymentStatus } from "@prisma/client";
import { checkEnv } from "@/lib/env";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

interface DimensionItem {
  label:   string;
  status:  "pass" | "warn" | "fail";
  detail?: string;
  score:   number;   // 0–100
}

interface Dimension {
  name:    string;
  score:   number;
  weight:  number;   // relative weight in overall
  items:   DimensionItem[];
}

function itemScore(items: DimensionItem[]) {
  if (!items.length) return 100;
  return Math.round(items.reduce((s, i) => s + i.score, 0) / items.length);
}

export async function GET() {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const envCheck = checkEnv();

  const [
    totalProducts, activeProducts, productsWithImages, productsWithSeo, productsWithVariants,
    totalCategories, activeCategories,
    totalSuppliers, approvedSuppliers,
    pendingProductQueue,
    totalVariants, oosVariants,
    defaultWarehouse,
    totalOrders, totalRevenue,
    capturedPayments,
    razorpayWebhookSecret,
    totalContentBlocks, publishedBlocks,
    heroBlock,
    siteSettings,
    totalMedia,
    activeAnnouncements,
    totalCustomers, verifiedCustomers,
    pendingReviews, totalReviews,
    totalAuditLogs,
    adminProfiles,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, images: { some: {} } } }),
    prisma.product.count({ where: { isActive: true, metaTitle: { not: null }, metaDescription: { not: null } } }),
    prisma.product.count({ where: { isActive: true, variants: { some: {} } } }),

    prisma.category.count(),
    prisma.category.count({ where: { isActive: true } }),

    prisma.supplier.count(),
    prisma.supplier.count({ where: { status: "APPROVED" } }),
    prisma.product.count({ where: { isActive: false, supplierId: { not: null } } }),

    prisma.productVariant.count({ where: { isActive: true } }),
    prisma.productVariant.count({ where: { isActive: true, stock: 0 } }),
    prisma.warehouse.findFirst({ where: { isDefault: true, isActive: true } }),

    prisma.order.count(),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: PaymentStatus.CAPTURED } }),
    prisma.payment.count({ where: { status: PaymentStatus.CAPTURED } }),

    Promise.resolve(!!process.env.RAZORPAY_WEBHOOK_SECRET && !process.env.RAZORPAY_WEBHOOK_SECRET.includes("REPLACE")),

    prisma.contentBlock.count(),
    prisma.contentBlock.count({ where: { status: "PUBLISHED" } }),
    prisma.contentBlock.findFirst({ where: { type: "HERO_BANNER", status: "PUBLISHED" } }),

    prisma.siteSettings.count(),
    prisma.mediaAsset.count(),
    prisma.announcementMessage.count({ where: { isActive: true } }),

    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "CUSTOMER", emailVerified: { not: null } } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.review.count(),
    prisma.auditLog.count(),
    prisma.adminProfile.count(),
  ]);

  const catalogItems: DimensionItem[] = [
    {
      label:  "Active products",
      status: activeProducts >= 10 ? "pass" : activeProducts >= 3 ? "warn" : "fail",
      detail: `${activeProducts} active`,
      score:  activeProducts >= 10 ? 100 : activeProducts >= 3 ? 60 : 20,
    },
    {
      label:  "Products with images",
      status: activeProducts > 0 && (productsWithImages / activeProducts) >= 0.9 ? "pass" : (productsWithImages / Math.max(1, activeProducts)) >= 0.6 ? "warn" : "fail",
      detail: `${productsWithImages}/${activeProducts}`,
      score:  activeProducts > 0 ? Math.round((productsWithImages / activeProducts) * 100) : 0,
    },
    {
      label:  "Products with variants",
      status: activeProducts > 0 && (productsWithVariants / activeProducts) >= 0.95 ? "pass" : "warn",
      detail: `${productsWithVariants}/${activeProducts}`,
      score:  activeProducts > 0 ? Math.round((productsWithVariants / activeProducts) * 100) : 0,
    },
    {
      label:  "Active categories",
      status: activeCategories >= 3 ? "pass" : activeCategories >= 1 ? "warn" : "fail",
      detail: `${activeCategories} categories`,
      score:  activeCategories >= 3 ? 100 : activeCategories >= 1 ? 60 : 0,
    },
  ];

  const inventoryItems: DimensionItem[] = [
    {
      label:  "Default warehouse configured",
      status: defaultWarehouse ? "pass" : "fail",
      detail: defaultWarehouse ? `"${defaultWarehouse.name}"` : "No default warehouse",
      score:  defaultWarehouse ? 100 : 0,
    },
    {
      label:  "Stock levels",
      status: totalVariants > 0 && (oosVariants / totalVariants) < 0.1 ? "pass" : (oosVariants / Math.max(1, totalVariants)) < 0.3 ? "warn" : "fail",
      detail: `${oosVariants}/${totalVariants} out of stock`,
      score:  totalVariants > 0 ? Math.round((1 - oosVariants / totalVariants) * 100) : 0,
    },
    {
      label:  "Supplier product queue",
      status: pendingProductQueue === 0 ? "pass" : pendingProductQueue <= 5 ? "warn" : "fail",
      detail: `${pendingProductQueue} pending approval`,
      score:  pendingProductQueue === 0 ? 100 : pendingProductQueue <= 5 ? 70 : 30,
    },
  ];

  const supplierItems: DimensionItem[] = [
    {
      label:  "Approved suppliers",
      status: approvedSuppliers >= 1 ? "pass" : "fail",
      detail: `${approvedSuppliers}/${totalSuppliers}`,
      score:  totalSuppliers > 0 ? Math.round((approvedSuppliers / totalSuppliers) * 100) : 0,
    },
  ];

  const ordersItems: DimensionItem[] = [
    {
      label:  "Payment gateway (Razorpay)",
      status: !!(process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes("REPLACE")) ? "pass" : "fail",
      detail: process.env.RAZORPAY_KEY_ID?.startsWith("rzp_live") ? "Live mode" : "Test mode",
      score:  !!(process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes("REPLACE")) ? 100 : 0,
    },
    {
      label:  "Webhook secret configured",
      status: razorpayWebhookSecret ? "pass" : "fail",
      score:  razorpayWebhookSecret ? 100 : 0,
    },
    {
      label:  "Orders processed",
      status: totalOrders > 0 ? "pass" : "warn",
      detail: `${totalOrders} orders · ₹${Math.round(Number(totalRevenue._sum.amount ?? 0)).toLocaleString("en-IN")} revenue`,
      score:  totalOrders > 0 ? 100 : 60,
    },
  ];

  const paymentsItems: DimensionItem[] = [
    {
      label:  "Payments captured",
      status: capturedPayments > 0 ? "pass" : "warn",
      detail: `${capturedPayments} captured payments`,
      score:  capturedPayments > 0 ? 100 : 60,
    },
    {
      label:  "Email provider (Resend)",
      status: !!(process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("REPLACE")) ? "pass" : "fail",
      score:  !!(process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("REPLACE")) ? 100 : 0,
    },
    {
      label:  "Media storage (Cloudinary)",
      status: !!(process.env.CLOUDINARY_CLOUD_NAME && !process.env.CLOUDINARY_CLOUD_NAME.includes("REPLACE")) ? "pass" : "fail",
      score:  !!(process.env.CLOUDINARY_CLOUD_NAME && !process.env.CLOUDINARY_CLOUD_NAME.includes("REPLACE")) ? 100 : 0,
    },
  ];

  const seoItems: DimensionItem[] = [
    {
      label:  "Product SEO completion",
      status: activeProducts > 0 && (productsWithSeo / activeProducts) >= 0.8 ? "pass" : (productsWithSeo / Math.max(1, activeProducts)) >= 0.5 ? "warn" : "fail",
      detail: `${productsWithSeo}/${activeProducts} products have meta tags`,
      score:  activeProducts > 0 ? Math.round((productsWithSeo / activeProducts) * 100) : 0,
    },
    {
      label:  "Site settings / homepage SEO",
      status: siteSettings > 0 ? "pass" : "warn",
      detail: `${siteSettings} site setting${siteSettings !== 1 ? "s" : ""} configured`,
      score:  siteSettings > 0 ? 100 : 40,
    },
    {
      label:  "Environment variables",
      status: envCheck.ok ? "pass" : envCheck.missing.length < 3 ? "warn" : "fail",
      detail: envCheck.ok ? "All required vars set" : `${envCheck.missing.length} missing`,
      score:  envCheck.ok ? 100 : Math.max(0, 100 - envCheck.missing.length * 15),
    },
  ];

  const contentItems: DimensionItem[] = [
    {
      label:  "Hero banner published",
      status: heroBlock ? "pass" : "fail",
      score:  heroBlock ? 100 : 0,
    },
    {
      label:  "Published content blocks",
      status: publishedBlocks >= 3 ? "pass" : publishedBlocks >= 1 ? "warn" : "fail",
      detail: `${publishedBlocks}/${totalContentBlocks} published`,
      score:  Math.min(100, publishedBlocks * 33),
    },
    {
      label:  "Media library",
      status: totalMedia >= 5 ? "pass" : totalMedia >= 1 ? "warn" : "fail",
      detail: `${totalMedia} asset${totalMedia !== 1 ? "s" : ""} uploaded`,
      score:  Math.min(100, totalMedia * 10),
    },
  ];

  const cxItems: DimensionItem[] = [
    {
      label:  "Customer accounts",
      status: totalCustomers >= 1 ? "pass" : "warn",
      detail: `${totalCustomers} registered`,
      score:  totalCustomers >= 1 ? 100 : 50,
    },
    {
      label:  "Pending reviews moderation",
      status: pendingReviews === 0 ? "pass" : pendingReviews <= 5 ? "warn" : "fail",
      detail: `${pendingReviews} pending`,
      score:  pendingReviews === 0 ? 100 : Math.max(20, 100 - pendingReviews * 10),
    },
    {
      label:  "Admin team",
      status: adminProfiles >= 1 ? "pass" : "fail",
      detail: `${adminProfiles} admin profile${adminProfiles !== 1 ? "s" : ""}`,
      score:  adminProfiles >= 1 ? 100 : 0,
    },
  ];

  const dimensions: Dimension[] = [
    { name: "Catalog",             weight: 20, items: catalogItems,  score: itemScore(catalogItems)  },
    { name: "Inventory",           weight: 15, items: inventoryItems, score: itemScore(inventoryItems) },
    { name: "Suppliers",           weight: 10, items: supplierItems,  score: itemScore(supplierItems)  },
    { name: "Orders",              weight: 15, items: ordersItems,    score: itemScore(ordersItems)    },
    { name: "Payments",            weight: 15, items: paymentsItems,  score: itemScore(paymentsItems)  },
    { name: "SEO",                 weight: 10, items: seoItems,       score: itemScore(seoItems)       },
    { name: "Content",             weight: 10, items: contentItems,   score: itemScore(contentItems)   },
    { name: "Customer Experience", weight: 5,  items: cxItems,        score: itemScore(cxItems)        },
  ];

  const launchScore = Math.round(
    dimensions.reduce((s, d) => s + d.score * (d.weight / 100), 0)
  );

  const readyToLaunch = launchScore >= 80 &&
    dimensions.every(d => d.score >= 50) &&
    ordersItems.every(i => i.status !== "fail");

  return NextResponse.json({
    launchScore,
    readyToLaunch,
    checkedAt: new Date().toISOString(),
    dimensions,
  });
}
