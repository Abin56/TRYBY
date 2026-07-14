import { PrismaClient, Sport, BadgeType, UserRole } from "@prisma/client";

const prisma = new PrismaClient();
// db is cast to any so new models (ContentBlock, SiteSettings) work before
// the TS language server picks up the freshly-generated Prisma client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

async function main() {
  console.log("🌱 Seeding TRYBY database...");

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@tryby.in" },
    update: {},
    create: {
      email: "admin@tryby.in",
      name: "TRYBY Admin",
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log("✅ Admin user:", admin.email);

  // Categories
  const cricket = await prisma.category.upsert({
    where: { slug: "cricket" },
    update: {},
    create: { name: "Cricket", slug: "cricket", sport: Sport.CRICKET, sortOrder: 1, isActive: true },
  });
  const football = await prisma.category.upsert({
    where: { slug: "football" },
    update: {},
    create: { name: "Football", slug: "football", sport: Sport.FOOTBALL, sortOrder: 2, isActive: true },
  });
  const gym = await prisma.category.upsert({
    where: { slug: "gym" },
    update: {},
    create: { name: "Gym & Fitness", slug: "gym", sport: Sport.GYM, sortOrder: 3, isActive: true },
  });
  const running = await prisma.category.upsert({
    where: { slug: "running" },
    update: {},
    create: { name: "Running", slug: "running", sport: Sport.RUNNING, sortOrder: 4, isActive: true },
  });
  console.log("✅ Categories seeded");

  // Announcement messages
  await prisma.announcementMessage.deleteMany();
  await prisma.announcementMessage.createMany({
    data: [
      { message: "🏏 Official IPL 2026 Jerseys Now Live — Shop Before Stock Runs Out!", ctaText: "Shop Now", ctaUrl: "/products?sport=CRICKET", isActive: true, sortOrder: 1 },
      { message: "Free delivery on orders above ₹499 · Easy 7-day returns", isActive: true, sortOrder: 2 },
      { message: "⚡ Use code TRYBY10 for 10% off your first order", isActive: true, sortOrder: 3 },
    ],
  });
  console.log("✅ Announcements seeded");

  // Welcome coupon
  await prisma.coupon.upsert({
    where: { code: "TRYBY10" },
    update: {},
    create: {
      code: "TRYBY10",
      type: "PERCENTAGE",
      value: 0.10,
      minOrderValue: 299,
      maxDiscount: 200,
      usageLimit: 1000,
      perUserLimit: 1,
      isActive: true,
    },
  });
  await prisma.coupon.upsert({
    where: { code: "FLAT100" },
    update: {},
    create: {
      code: "FLAT100",
      type: "FLAT",
      value: 100,
      minOrderValue: 499,
      usageLimit: 500,
      perUserLimit: 1,
      isActive: true,
    },
  });
  console.log("✅ Coupons seeded");

  // Sample product (placeholder images — replace with Cloudinary URLs)
  const existing = await prisma.product.findUnique({ where: { slug: "mi-paltan-ipl-jersey-2025" } });
  if (!existing) {
    const product = await prisma.product.create({
      data: {
        categoryId: cricket.id,
        name: "MI Paltan IPL Jersey 2025",
        slug: "mi-paltan-ipl-jersey-2025",
        description: "Official Mumbai Indians IPL 2025 home jersey. Moisture-wicking fabric, authentic team badge, player-grade quality.",
        sport: Sport.CRICKET,
        isActive: true,
        isFeatured: true,
        isOfficialLicensed: true,
        teamName: "Mumbai Indians",
        leagueName: "IPL 2025",
        metaTitle: "Buy Mumbai Indians IPL 2025 Jersey | TRYBY",
        metaDescription: "Official MI Paltan jersey. Authentic, player-grade quality. Free delivery above ₹499.",
        variants: {
          create: [
            { sku: "MI-2025-S",  size: "S",  price: 1299, mrp: 1799, stock: 50 },
            { sku: "MI-2025-M",  size: "M",  price: 1299, mrp: 1799, stock: 100 },
            { sku: "MI-2025-L",  size: "L",  price: 1299, mrp: 1799, stock: 100 },
            { sku: "MI-2025-XL", size: "XL", price: 1299, mrp: 1799, stock: 80 },
            { sku: "MI-2025-XXL",size: "XXL",price: 1399, mrp: 1899, stock: 40 },
          ],
        },
        images: {
          create: [
            { url: "https://images.unsplash.com/photo-1553592408-4d80d66e6cd8?w=800", altText: "MI IPL Jersey 2025 Front", isPrimary: true, sortOrder: 0 },
          ],
        },
        badges: {
          create: [
            { type: BadgeType.OFFICIAL, label: "Official" },
            { type: BadgeType.NEW, label: "New" },
          ],
        },
      },
    });
    console.log("✅ Sample product:", product.name);
  }

  // ── Content Blocks ──────────────────────────────────────────────────────────
  // Use upsert so re-running seed never duplicates rows.

  await db.contentBlock.upsert({
    where: { key: "homepage_hero" },
    update: {},
    create: {
      key: "homepage_hero",
      type: "HERO_BANNER",
      title: "Homepage Hero",
      status: "PUBLISHED",
      isActive: true,
      sortOrder: 0,
      publishedAt: new Date(),
      data: {
        tagline: "PLAY. TRAIN. WIN.",
        headline: "Gear Up. Play Your Best.",
        subheadline: "Premium Jerseys & Sports Essentials at Best Prices",
        ctaText: "Shop Now",
        ctaUrl: "/products",
        secondaryCtaText: "Best Deals 🔥",
        secondaryCtaUrl: "/products?filter=sale",
        desktopImageUrl: "/hero-desktop.png",
        mobileImageUrl: "/hero-mobile.png",
        badgeText: "New Season 2026",
        showBadge: true,
      },
    },
  });

  await db.contentBlock.upsert({
    where: { key: "homepage_trust_bar" },
    update: {},
    create: {
      key: "homepage_trust_bar",
      type: "TRUST_BAR",
      title: "Trust Bar",
      status: "PUBLISHED",
      isActive: true,
      sortOrder: 1,
      publishedAt: new Date(),
      data: {
        items: [
          { emoji: "🛡️", title: "Official Quality",  subtitle: "Licensed & Verified Products" },
          { emoji: "🚚", title: "Fast Delivery",      subtitle: "Ships Across India" },
          { emoji: "↩️", title: "Easy Returns",       subtitle: "7-Day Hassle-Free Returns" },
          { emoji: "🔒", title: "Secure Checkout",    subtitle: "UPI, Cards & COD" },
        ],
      },
    },
  });

  await db.contentBlock.upsert({
    where: { key: "footer_columns" },
    update: {},
    create: {
      key: "footer_columns",
      type: "FOOTER_COLUMN",
      title: "Footer Links",
      status: "PUBLISHED",
      isActive: true,
      sortOrder: 0,
      publishedAt: new Date(),
      data: {
        columns: [
          {
            heading: "Shop",
            links: [
              { label: "Cricket",       url: "/products?sport=cricket" },
              { label: "Football",      url: "/products?sport=football" },
              { label: "Gym & Fitness", url: "/products?sport=gym" },
              { label: "Running",       url: "/products?sport=running" },
              { label: "New Arrivals",  url: "/products?sort=newest" },
              { label: "Sale",          url: "/products?sale=1" },
            ],
          },
          {
            heading: "Help",
            links: [
              { label: "FAQ",               url: "/faq" },
              { label: "Shipping Policy",   url: "/shipping" },
              { label: "Returns & Refunds", url: "/returns" },
              { label: "Track My Order",    url: "/orders" },
              { label: "Contact Us",        url: "/contact" },
            ],
          },
          {
            heading: "Company",
            links: [
              { label: "About TRYBY",     url: "/about" },
              { label: "Partner Program", url: "/supplier/apply" },
            ],
          },
          {
            heading: "Legal",
            links: [
              { label: "Privacy Policy",     url: "/privacy-policy" },
              { label: "Terms & Conditions", url: "/terms" },
              { label: "Cookie Policy",      url: "/cookies" },
              { label: "Disclaimer",         url: "/disclaimer" },
            ],
          },
        ],
      },
    },
  });

  await db.contentBlock.upsert({
    where: { key: "homepage_sections" },
    update: {},
    create: {
      key: "homepage_sections",
      type: "STATIC_PAGE",
      title: "Homepage Section Order",
      status: "PUBLISHED",
      isActive: true,
      sortOrder: 0,
      publishedAt: new Date(),
      data: {
        sections: [
          { key: "hero",       isActive: true, sortOrder: 0 },
          { key: "categories", isActive: true, sortOrder: 1 },
          { key: "trending",   isActive: true, sortOrder: 2 },
          { key: "trust",      isActive: true, sortOrder: 3 },
        ],
      },
    },
  });

  // Default homepage SEO
  await db.siteSettings.upsert({
    where: { key: "seo_home" },
    update: {},
    create: {
      key: "seo_home",
      metaTitle: "TRYBY — Buy Sports Jerseys & Gear Online India",
      metaDescription: "Shop India's best sports gear at TRYBY. Official cricket jerseys, football kits, gym wear & sports accessories. Fast delivery, easy returns.",
      ogTitle: "TRYBY Sports Store",
      ogDescription: "Official cricket jerseys, football kits, gym wear & sports accessories. Fast delivery across India.",
      ogImageUrl: "/og-image.png",
      robotsContent: "index,follow",
      canonicalUrl: "https://www.tryby.in",
    },
  });

  console.log("✅ Content blocks & SEO seeded");

  console.log("\n🎉 Database seeded successfully!");
  console.log("Next: add real products via admin panel or expand this seed file.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
