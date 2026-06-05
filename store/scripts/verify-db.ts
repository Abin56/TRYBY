import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("\n─── TRYBY Database Verification ───────────────────────────\n");

  const [
    users, admins, customers,
    products, variants, categories,
    orders,
    contentBlocks, announcements, siteSettings,
    media,
    coupons, reviews, returnRequests,
    adminProfiles, auditLogs,
    migrations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.contentBlock.count(),
    prisma.announcementMessage.count(),
    prisma.siteSettings.count(),
    prisma.mediaAsset.count(),
    prisma.coupon.count(),
    prisma.review.count(),
    prisma.returnRequest.count(),
    prisma.adminProfile.count(),
    prisma.auditLog.count(),
    prisma.$queryRaw<{migration_name: string, finished_at: Date}[]>`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      ORDER BY finished_at DESC
      LIMIT 1
    `,
  ]);

  // Verify admin user
  const adminUser = await prisma.user.findUnique({
    where: { email: "admin@tryby.in" },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  // Verify content blocks
  const contentKeys = await prisma.contentBlock.findMany({
    select: { key: true, status: true, isActive: true, type: true },
  });

  // Verify categories
  const cats = await prisma.category.findMany({ select: { name: true, sport: true } });

  // Verify coupons
  const couponList = await prisma.coupon.findMany({ select: { code: true, type: true, isActive: true } });

  // Verify variants (stock check)
  const variantsWithCost = await prisma.productVariant.count({ where: { costPrice: { not: null } } });
  const variantsOOS = await prisma.productVariant.count({ where: { stock: 0 } });

  // Verify published blocks
  const publishedBlocks = await prisma.contentBlock.count({ where: { status: "PUBLISHED" } });
  const draftBlocks = await prisma.contentBlock.count({ where: { status: "DRAFT" } });

  console.log("USERS");
  console.log(`  Total:      ${users}`);
  console.log(`  Admins:     ${admins}`);
  console.log(`  Customers:  ${customers}`);
  console.log(`  AdminProfiles: ${adminProfiles}`);

  console.log("\nADMIN USER");
  if (adminUser) {
    console.log(`  ✅ ${adminUser.email} | role=${adminUser.role} | active=${adminUser.isActive}`);
  } else {
    console.log("  ❌ admin@tryby.in NOT FOUND");
  }

  console.log("\nPRODUCTS");
  console.log(`  Products:   ${products}`);
  console.log(`  Variants:   ${variants}`);
  console.log(`  With cost:  ${variantsWithCost}`);
  console.log(`  OOS:        ${variantsOOS}`);
  console.log(`  Categories: ${categories}`);
  cats.forEach(c => console.log(`    • ${c.name} (${c.sport})`));

  console.log("\nORDERS & COMMERCE");
  console.log(`  Orders:     ${orders}`);
  console.log(`  Returns:    ${returnRequests}`);
  console.log(`  Coupons:    ${coupons}`);
  couponList.forEach(c => console.log(`    • ${c.code} | ${c.type} | active=${c.isActive}`));
  console.log(`  Reviews:    ${reviews}`);

  console.log("\nCMS & CONTENT");
  console.log(`  ContentBlocks:    ${contentBlocks} (${publishedBlocks} published, ${draftBlocks} draft)`);
  console.log(`  Announcements:    ${announcements}`);
  console.log(`  SiteSettings:     ${siteSettings}`);
  console.log(`  Media assets:     ${media}`);
  console.log(`  AuditLogs:        ${auditLogs}`);
  contentKeys.forEach(b => console.log(`    • ${b.key} | ${b.type} | ${b.status} | active=${b.isActive}`));

  console.log("\nMIGRATIONS");
  if (migrations.length > 0) {
    const m = migrations[0];
    console.log(`  ✅ Last: ${m.migration_name}`);
    console.log(`     At:   ${m.finished_at}`);
  }

  console.log("\n─────────────────────────────────────────────────────────\n");

  // Final verdict
  const checks = [
    { name: "Admin user exists",         pass: !!adminUser },
    { name: "Categories seeded",         pass: categories >= 4 },
    { name: "Coupons seeded",            pass: coupons >= 2 },
    { name: "Announcements seeded",      pass: announcements >= 1 },
    { name: "Content blocks seeded",     pass: contentBlocks >= 4 },
    { name: "Published content exists",  pass: publishedBlocks >= 4 },
    { name: "Migration applied",         pass: migrations.length > 0 },
    { name: "Sample product exists",     pass: products >= 1 },
  ];

  console.log("VERIFICATION SUMMARY");
  let allPass = true;
  for (const c of checks) {
    const icon = c.pass ? "✅" : "❌";
    if (!c.pass) allPass = false;
    console.log(`  ${icon} ${c.name}`);
  }
  console.log(allPass ? "\n✅ All checks passed — database is healthy\n" : "\n⚠️  Some checks failed\n");
}

main()
  .catch(e => { console.error("❌ Error:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
