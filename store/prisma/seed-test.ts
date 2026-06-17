/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TRYBY — STAGING / QA TEST SEED   (prisma/seed-test.ts)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Generates deterministic, idempotent test fixtures for **staging / QA only**:
 *    • 10 admin accounts (one per AdminRole)
 *    • 9  customer personas
 *    • 6  supplier accounts
 *    • Products across every Sport enum (+ edge cases)
 *    • Test coupons (every CouponType + every rejection path)
 *    • Order scenarios covering every OrderStatus / PaymentStatus
 *
 *  SAFETY
 *    • Refuses to run when NODE_ENV=production (override: ALLOW_TEST_SEED=1).
 *    • Performs NO network calls — no live Razorpay charges, no courier APIs.
 *      All payment/courier identifiers are fake ("order_TEST…", "pay_TEST…").
 *    • Touches ONLY rows it owns: every created row has a `tst_`-prefixed id,
 *      every account uses the `@test.tryby.in` domain. Reset deletes exactly
 *      those rows and nothing else.
 *
 *  USAGE
 *    npm run seed:test          # idempotent upsert (safe to re-run)
 *    npm run seed:test:reset    # wipe all tst_ rows, then re-seed fresh
 *
 *  Credentials (see docs/STAGING_TEST_ACCOUNTS.md):
 *    • Admin password      → AdminProfile.passwordHash (bcrypt, cost 12)
 *    • Customer/Supplier   → Account.access_token       (bcrypt, cost 12)
 *    • Shared password for every test account: Test@1234
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Constants ────────────────────────────────────────────────────────────────
const TEST_PASSWORD = "Test@1234";
const TEST_DOMAIN = "@test.tryby.in";
const ID = "tst_"; // every row we create is prefixed with this — reset key
const BCRYPT_COST = 12; // must match lib/auth.ts so hashes validate

// Date helpers (plain Node runtime — Date is fine here)
const NOW = new Date();
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const daysFromNow = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

// Cast for models that may not yet exist on a stale generated client.
// (tsx transpiles without type-checking; runtime errors are caught by `safe`.)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

let passwordHash = ""; // populated in main()

// ── Small utilities ──────────────────────────────────────────────────────────

/** Run an optional enrichment step; log + continue if the table/migration is absent. */
async function safe(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (e) {
    const msg = e instanceof Error ? e.message.split("\n")[0] : String(e);
    console.warn(`   ⚠️  skipped "${label}" — ${msg}`);
  }
}

/** deleteMany that never throws (e.g. table not migrated on this DB). */
async function safeDelete(label: string, fn: () => Promise<{ count: number }>) {
  try {
    const { count } = await fn();
    if (count) console.log(`   – ${label}: ${count}`);
  } catch {
    /* table absent or nothing to delete — ignore */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  SAFETY GUARD
// ─────────────────────────────────────────────────────────────────────────────
function assertSafe() {
  const url = process.env.DATABASE_URL ?? "";
  const host = url.replace(/\/\/[^@]*@/, "//***@"); // mask credentials
  console.log(`🔌 Target DB: ${host || "(DATABASE_URL not set)"}`);

  if (process.env.NODE_ENV === "production" && process.env.ALLOW_TEST_SEED !== "1") {
    console.error(
      "❌ Refusing to run the TEST seed with NODE_ENV=production.\n" +
        "   This script is for staging/QA only. If you are absolutely certain this\n" +
        "   is a disposable staging DB, re-run with ALLOW_TEST_SEED=1.",
    );
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  RESET — delete only tst_ rows, child → parent
// ─────────────────────────────────────────────────────────────────────────────
async function wipe() {
  console.log("🧹 Wiping previous test data (tst_ rows only)…");
  const idF = { id: { startsWith: ID } };

  // Order-graph children first
  await safeDelete("reviewHelpfulVotes", () => db.reviewHelpfulVote.deleteMany({ where: idF }));
  await safeDelete("reviews", () => db.review.deleteMany({ where: idF }));
  await safeDelete("returnItems", () => db.returnItem.deleteMany({ where: idF }));
  await safeDelete("returnRequests", () => db.returnRequest.deleteMany({ where: idF }));
  await safeDelete("orderRiskAssessments", () => db.orderRiskAssessment.deleteMany({ where: idF }));
  await safeDelete("orderStatusHistory", () => db.orderStatusHistory.deleteMany({ where: idF }));
  await safeDelete("payments", () => db.payment.deleteMany({ where: idF }));
  await safeDelete("shipmentEvents", () => db.shipmentEvent.deleteMany({ where: idF }));
  await safeDelete("shipments", () => db.shipment.deleteMany({ where: idF }));
  await safeDelete("fulfillmentAllocs", () => db.orderFulfillmentAllocation.deleteMany({ where: idF }));
  await safeDelete("orderItems", () => db.orderItem.deleteMany({ where: idF }));
  await safeDelete("orders", () => db.order.deleteMany({ where: idF }));

  // Supplier finance
  await safeDelete("settlementDisputes", () => db.settlementDispute.deleteMany({ where: idF }));
  await safeDelete("supplierSettlements", () => db.supplierSettlement.deleteMany({ where: idF }));
  await safeDelete("supplierLedger", () => db.supplierLedger.deleteMany({ where: idF }));
  await safeDelete("payouts", () => db.payout.deleteMany({ where: idF }));
  await safeDelete("supplierActivityLogs", () => db.supplierActivityLog.deleteMany({ where: idF }));
  await safeDelete("supplierDocuments", () => db.supplierDocument.deleteMany({ where: idF }));

  // Customer enrichment
  await safeDelete("loyaltyPoints", () => db.loyaltyPoint.deleteMany({ where: idF }));
  await safeDelete("customerSegments", () => db.customerSegment.deleteMany({ where: idF }));

  // Catalog / inventory
  await safeDelete("warehouseStocks", () => db.warehouseStock.deleteMany({ where: idF }));
  await safeDelete("inventoryLogs", () => db.inventoryLog.deleteMany({ where: idF }));
  await safeDelete("cartItems", () => db.cartItem.deleteMany({ where: idF }));
  await safeDelete("wishlistItems", () => db.wishlistItem.deleteMany({ where: idF }));
  await safeDelete("productBadges", () => db.productBadge.deleteMany({ where: idF }));
  await safeDelete("productImages", () => db.productImage.deleteMany({ where: idF }));
  await safeDelete("productVariants", () => db.productVariant.deleteMany({ where: idF }));
  await safeDelete("products", () => db.product.deleteMany({ where: idF }));

  // Accounts
  await safeDelete("suppliers", () => db.supplier.deleteMany({ where: idF }));
  await safeDelete("adminProfiles", () => db.adminProfile.deleteMany({ where: idF }));
  await safeDelete("accounts", () => db.account.deleteMany({ where: idF }));
  await safeDelete("sessions", () => db.session.deleteMany({ where: idF }));
  await safeDelete("addresses", () => db.address.deleteMany({ where: idF }));
  await safeDelete("customerRiskProfiles", () => db.customerRiskProfile.deleteMany({ where: idF }));
  await safeDelete("users", () => db.user.deleteMany({ where: idF }));

  // Reference data
  await safeDelete("categories", () => db.category.deleteMany({ where: idF }));
  await safeDelete("warehouses", () => db.warehouse.deleteMany({ where: idF }));
  await safeDelete("coupons", () => db.coupon.deleteMany({ where: idF }));

  console.log("✅ Wipe complete.\n");
}

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

interface UserSpec {
  id: string;
  accId: string;
  email: string;
  name: string;
  phone?: string | null;
  role: "CUSTOMER" | "SUPPLIER" | "ADMIN";
  isActive?: boolean;
  loginFailures?: number;
  lockedUntil?: Date | null;
  lastFailedLoginAt?: Date | null;
}

/** Create a User + a `credentials` Account whose access_token holds the bcrypt hash. */
async function upsertCredentialUser(u: UserSpec) {
  const lock = {
    loginFailures: u.loginFailures ?? 0,
    lockedUntil: u.lockedUntil ?? null,
    lastFailedLoginAt: u.lastFailedLoginAt ?? null,
  };
  const user = await prisma.user.upsert({
    where: { email: u.email },
    update: { name: u.name, phone: u.phone ?? null, role: u.role, isActive: u.isActive ?? true, ...lock },
    create: {
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone ?? null,
      role: u.role,
      emailVerified: NOW,
      phoneVerified: !!u.phone,
      isActive: u.isActive ?? true,
      ...lock,
    },
  });

  await prisma.account.upsert({
    where: { provider_providerAccountId: { provider: "credentials", providerAccountId: u.email } },
    update: { access_token: passwordHash },
    create: {
      id: u.accId,
      userId: user.id,
      type: "credentials",
      provider: "credentials",
      providerAccountId: u.email,
      access_token: passwordHash, // bcrypt hash — validated in lib/auth.ts
    },
  });
  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
//  1. ADMINS  (one per AdminRole)
// ─────────────────────────────────────────────────────────────────────────────
const ADMINS: { key: string; email: string; name: string; role: string; extra?: Record<string, unknown> }[] = [
  { key: "super", email: `admin.super${TEST_DOMAIN}`, name: "Super Admin", role: "SUPER_ADMIN" },
  { key: "store", email: `admin.store${TEST_DOMAIN}`, name: "Store Admin", role: "ADMIN" },
  { key: "ops", email: `admin.ops${TEST_DOMAIN}`, name: "Ops Manager", role: "OPERATIONS_MANAGER" },
  { key: "content", email: `admin.content${TEST_DOMAIN}`, name: "Content Manager", role: "CONTENT_MANAGER" },
  { key: "product", email: `admin.product${TEST_DOMAIN}`, name: "Product Manager", role: "PRODUCT_MANAGER" },
  { key: "orders", email: `admin.orders${TEST_DOMAIN}`, name: "Order Manager", role: "ORDER_MANAGER" },
  { key: "finance", email: `admin.finance${TEST_DOMAIN}`, name: "Finance Manager", role: "FINANCE_MANAGER" },
  { key: "support", email: `admin.support${TEST_DOMAIN}`, name: "Support Agent", role: "SUPPORT_AGENT" },
  { key: "supplier", email: `admin.supplier${TEST_DOMAIN}`, name: "Supplier Manager", role: "SUPPLIER_MANAGER" },
  { key: "marketing", email: `admin.marketing${TEST_DOMAIN}`, name: "Marketing Manager", role: "MARKETING_MANAGER" },
  // Negative-path admins
  { key: "disabled", email: `admin.disabled${TEST_DOMAIN}`, name: "Disabled Admin", role: "ADMIN", extra: { isDisabled: true } },
  { key: "mustreset", email: `admin.mustreset${TEST_DOMAIN}`, name: "Reset-Me Admin", role: "ADMIN", extra: { mustResetPwd: true } },
];

async function seedAdmins() {
  for (const a of ADMINS) {
    const user = await upsertCredentialUser({
      id: `${ID}usr_adm_${a.key}`,
      accId: `${ID}acc_adm_${a.key}`,
      email: a.email,
      name: a.name,
      role: "ADMIN",
    });
    await prisma.adminProfile.upsert({
      where: { userId: user.id },
      update: {
        adminRole: a.role as never,
        passwordHash,
        permissions: [], // inherit ROLE_PERMISSIONS defaults (lib/rbac.ts)
        isDisabled: (a.extra?.isDisabled as boolean) ?? false,
        mustResetPwd: (a.extra?.mustResetPwd as boolean) ?? false,
      },
      create: {
        id: `${ID}adm_${a.key}`,
        userId: user.id,
        adminRole: a.role as never,
        passwordHash,
        permissions: [],
        isDisabled: (a.extra?.isDisabled as boolean) ?? false,
        mustResetPwd: (a.extra?.mustResetPwd as boolean) ?? false,
      },
    });
  }
  console.log(`✅ Admins: ${ADMINS.length}`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  2. CUSTOMERS  (9 personas)
// ─────────────────────────────────────────────────────────────────────────────
const CUSTOMERS = {
  new: { id: `${ID}usr_c_new`, acc: `${ID}acc_c_new`, email: `customer.new${TEST_DOMAIN}`, name: "Riya (New)", phone: "9800000001" },
  loyal: { id: `${ID}usr_c_loyal`, acc: `${ID}acc_c_loyal`, email: `customer.loyal${TEST_DOMAIN}`, name: "Arjun (Loyal)", phone: "9800000002" },
  cod: { id: `${ID}usr_c_cod`, acc: `${ID}acc_c_cod`, email: `customer.cod${TEST_DOMAIN}`, name: "Neha (COD)", phone: "9800000003" },
  addresses: { id: `${ID}usr_c_addr`, acc: `${ID}acc_c_addr`, email: `customer.addresses${TEST_DOMAIN}`, name: "Vikram (Address Book)", phone: "9800000004" },
  ret: { id: `${ID}usr_c_ret`, acc: `${ID}acc_c_ret`, email: `customer.return${TEST_DOMAIN}`, name: "Sara (Returns)", phone: "9800000005" },
  locked: { id: `${ID}usr_c_lock`, acc: `${ID}acc_c_lock`, email: `customer.locked${TEST_DOMAIN}`, name: "Locked Customer", phone: "9800000006" },
  fraud: { id: `${ID}usr_c_fraud`, acc: `${ID}acc_c_fraud`, email: `customer.fraud${TEST_DOMAIN}`, name: "Risky Buyer", phone: "9800000007" },
  wishlist: { id: `${ID}usr_c_wish`, acc: `${ID}acc_c_wish`, email: `customer.wishlist${TEST_DOMAIN}`, name: "Guest Convert", phone: "9800000008" },
  inactive: { id: `${ID}usr_c_inact`, acc: `${ID}acc_c_inact`, email: `customer.inactive${TEST_DOMAIN}`, name: "Inactive User", phone: "9800000009" },
};

async function seedCustomers() {
  for (const [k, c] of Object.entries(CUSTOMERS)) {
    await upsertCredentialUser({
      id: c.id,
      accId: c.acc,
      email: c.email,
      name: c.name,
      phone: c.phone,
      role: "CUSTOMER",
      isActive: k !== "inactive",
      loginFailures: k === "locked" ? 5 : 0,
      lockedUntil: k === "locked" ? daysFromNow(1) : null,
      lastFailedLoginAt: k === "locked" ? NOW : null,
    });
  }
  console.log(`✅ Customers: ${Object.keys(CUSTOMERS).length}`);
}

// ── Addresses (for customers that place orders) ──────────────────────────────
const ADDR = {
  loyal: `${ID}addr_loyal`,
  cod: `${ID}addr_cod`,
  addr1: `${ID}addr_vik_home`,
  addr2: `${ID}addr_vik_office`,
  ret: `${ID}addr_ret`,
  fraud: `${ID}addr_fraud`,
  new: `${ID}addr_new`,
};

async function seedAddresses() {
  const rows = [
    { id: ADDR.new, userId: CUSTOMERS.new.id, type: "SHIPPING", isDefault: true, fullName: "Riya Sharma", phone: "9800000001", line1: "5 Residency Rd", city: "Bengaluru", state: "Karnataka", pincode: "560025" },
    { id: ADDR.loyal, userId: CUSTOMERS.loyal.id, type: "SHIPPING", isDefault: true, fullName: "Arjun Mehta", phone: "9800000002", line1: "12, MG Road, Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: "560038" },
    { id: ADDR.cod, userId: CUSTOMERS.cod.id, type: "SHIPPING", isDefault: true, fullName: "Neha Verma", phone: "9800000003", line1: "22 Park Street", city: "Kolkata", state: "West Bengal", pincode: "700016" },
    { id: ADDR.addr1, userId: CUSTOMERS.addresses.id, type: "SHIPPING", isDefault: true, fullName: "Vikram Singh", phone: "9800000004", line1: "401 Sea Breeze, Bandra W", city: "Mumbai", state: "Maharashtra", pincode: "400050" },
    { id: ADDR.addr2, userId: CUSTOMERS.addresses.id, type: "SHIPPING", isDefault: false, fullName: "Vikram Singh (Office)", phone: "9800000004", line1: "8th Flr, Cyber City, DLF Ph 2", city: "Gurugram", state: "Haryana", pincode: "122002" },
    { id: ADDR.ret, userId: CUSTOMERS.ret.id, type: "SHIPPING", isDefault: true, fullName: "Sara Khan", phone: "9800000005", line1: "9 Linking Rd", city: "Mumbai", state: "Maharashtra", pincode: "400052" },
    { id: ADDR.fraud, userId: CUSTOMERS.fraud.id, type: "SHIPPING", isDefault: true, fullName: "Risky Buyer", phone: "9800000007", line1: "PO Box 9, Remote Rd", city: "Imphal", state: "Manipur", pincode: "795001" },
  ];
  for (const r of rows) {
    const { id, ...rest } = r;
    await prisma.address.upsert({ where: { id }, update: rest as never, create: { id, ...(rest as any) } });
  }
  console.log(`✅ Addresses: ${rows.length}`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  3. SUPPLIERS  (6)
// ─────────────────────────────────────────────────────────────────────────────
const SUPPLIERS = {
  approved: { id: `${ID}sup_approved`, usr: `${ID}usr_s_app`, acc: `${ID}acc_s_app`, email: `supplier.approved${TEST_DOMAIN}`, company: "Acme Sports Pvt Ltd", slug: "test-acme-sports", status: "APPROVED", tier: "GOLD", commission: 0.12, gstin: "29AABCA1234A1Z5", pan: "AABCA1234A" },
  pending: { id: `${ID}sup_pending`, usr: `${ID}usr_s_pen`, acc: `${ID}acc_s_pen`, email: `supplier.pending${TEST_DOMAIN}`, company: "NewKit Traders", slug: "test-newkit", status: "PENDING", tier: "BRONZE", commission: 0.15, gstin: "33AA_PENDING_____", pan: "AAACN1111A" },
  suspended: { id: `${ID}sup_suspended`, usr: `${ID}usr_s_sus`, acc: `${ID}acc_s_sus`, email: `supplier.suspended${TEST_DOMAIN}`, company: "ShadyGoods LLP", slug: "test-shadygoods", status: "SUSPENDED", tier: "BRONZE", commission: 0.15, gstin: "07AABCS2222S1Z1", pan: "AABCS2222S" },
  platinum: { id: `${ID}sup_platinum`, usr: `${ID}usr_s_plat`, acc: `${ID}acc_s_plat`, email: `supplier.platinum${TEST_DOMAIN}`, company: "EliteGear India", slug: "test-elitegear", status: "APPROVED", tier: "PLATINUM", commission: 0.10, gstin: "27AAECE5678E1Z9", pan: "AAECE5678E" },
  silver: { id: `${ID}sup_silver`, usr: `${ID}usr_s_sil`, acc: `${ID}acc_s_sil`, email: `supplier.silver${TEST_DOMAIN}`, company: "SilverLine Apparel", slug: "test-silverline", status: "APPROVED", tier: "SILVER", commission: 0.15, gstin: "06AAFCS9012F1Z3", pan: "AAFCS9012F" },
  payouts: { id: `${ID}sup_payouts`, usr: `${ID}usr_s_pay`, acc: `${ID}acc_s_pay`, email: `supplier.payouts${TEST_DOMAIN}`, company: "PayoutTest Co", slug: "test-payouttest", status: "APPROVED", tier: "BRONZE", commission: 0.15, gstin: "19AAGCP3456G1Z7", pan: "AAGCP3456G" },
};

async function seedSuppliers() {
  for (const s of Object.values(SUPPLIERS)) {
    const user = await upsertCredentialUser({
      id: s.usr,
      accId: s.acc,
      email: s.email,
      name: s.company,
      role: "SUPPLIER",
    });
    const data = {
      companyName: s.company,
      slug: s.slug,
      gstin: s.gstin,
      panNumber: s.pan,
      status: s.status as never,
      tier: s.tier as never,
      commissionRate: s.commission,
      docsVerified: s.status === "APPROVED",
      docsVerifiedAt: s.status === "APPROVED" ? daysAgo(30) : null,
      onboardedAt: s.status === "APPROVED" ? daysAgo(60) : null,
      suspendReason: s.status === "SUSPENDED" ? "Policy violation — counterfeit goods (TEST)" : null,
      bankAccountName: s.company,
      bankAccountNo: "0001112223334",
      bankIfsc: "HDFC0001234",
    };
    await prisma.supplier.upsert({
      where: { userId: user.id },
      update: data as never,
      create: { id: s.id, userId: user.id, ...(data as any) },
    });
  }
  console.log(`✅ Suppliers: ${Object.keys(SUPPLIERS).length}`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  4. CATEGORIES + PRODUCTS  (every Sport enum + edge cases)
// ─────────────────────────────────────────────────────────────────────────────
const CAT = {
  cricket: { id: `${ID}cat_cricket`, name: "Test Cricket", slug: "test-cricket", sport: "CRICKET" },
  football: { id: `${ID}cat_football`, name: "Test Football", slug: "test-football", sport: "FOOTBALL" },
  gym: { id: `${ID}cat_gym`, name: "Test Gym & Fitness", slug: "test-gym", sport: "GYM" },
  running: { id: `${ID}cat_running`, name: "Test Running", slug: "test-running", sport: "RUNNING" },
  racket: { id: `${ID}cat_racket`, name: "Test Racket", slug: "test-racket", sport: "RACKET" },
  combat: { id: `${ID}cat_combat`, name: "Test Combat", slug: "test-combat", sport: "COMBAT" },
  other: { id: `${ID}cat_other`, name: "Test Other", slug: "test-other", sport: "OTHER" },
};

async function seedCategories() {
  let order = 1;
  for (const c of Object.values(CAT)) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sport: c.sport as never, isActive: true, sortOrder: order },
      create: { id: c.id, name: c.name, slug: c.slug, sport: c.sport as never, isActive: true, sortOrder: order },
    });
    order++;
  }
  console.log(`✅ Categories: ${Object.keys(CAT).length}`);
}

interface VariantSpec { sku: string; size?: string; color?: string; price: number; mrp: number; stock: number; weight?: number }
interface ProductSpec {
  key: string;
  name: string;
  slug: string;
  sport: string;
  catId: string;
  supplierId?: string | null;
  description: string;
  flags?: Record<string, unknown>;
  variants: VariantSpec[];
  badges?: string[];
}

const PRODUCTS: ProductSpec[] = [
  {
    key: "mi_jersey", name: "MI Paltan Jersey 2025 (TEST)", slug: "test-mi-paltan-jersey-2025", sport: "CRICKET", catId: CAT.cricket.id, supplierId: null,
    description: "TEST fixture — official-style cricket jersey, moisture-wicking fabric.",
    flags: { isFeatured: true, isOfficialLicensed: true, showOnHomepage: true, teamName: "Mumbai Indians", leagueName: "IPL 2025" },
    badges: ["OFFICIAL", "NEW"],
    variants: [
      { sku: "TEST-MI-2025-S", size: "S", price: 1299, mrp: 1799, stock: 50 },
      { sku: "TEST-MI-2025-M", size: "M", price: 1299, mrp: 1799, stock: 100 },
      { sku: "TEST-MI-2025-L", size: "L", price: 1299, mrp: 1799, stock: 100 },
      { sku: "TEST-MI-2025-XL", size: "XL", price: 1299, mrp: 1799, stock: 80 },
    ],
  },
  {
    key: "ind_odi", name: "Team India ODI Jersey (TEST)", slug: "test-team-india-odi-jersey", sport: "CRICKET", catId: CAT.cricket.id, supplierId: SUPPLIERS.approved.id,
    description: "TEST fixture — Team India ODI replica jersey.",
    flags: { isFeatured: true, isOfficialLicensed: true },
    variants: [
      { sku: "TEST-IND-ODI-M", size: "M", price: 1499, mrp: 1999, stock: 60 },
      { sku: "TEST-IND-ODI-L", size: "L", price: 1499, mrp: 1999, stock: 60 },
      { sku: "TEST-IND-ODI-XL", size: "XL", price: 1499, mrp: 1999, stock: 30 },
    ],
  },
  {
    key: "city_kit", name: "City FC Home Kit 24/25 (TEST)", slug: "test-city-fc-home-kit", sport: "FOOTBALL", catId: CAT.football.id, supplierId: SUPPLIERS.platinum.id,
    description: "TEST fixture — football club home kit.",
    badges: ["NEW"],
    variants: [
      { sku: "TEST-FB-CITY-S", size: "S", price: 2199, mrp: 2999, stock: 40 },
      { sku: "TEST-FB-CITY-M", size: "M", price: 2199, mrp: 2999, stock: 40 },
      { sku: "TEST-FB-CITY-L", size: "L", price: 2199, mrp: 2999, stock: 25 },
    ],
  },
  {
    key: "football", name: "Match Football Size 5 (TEST)", slug: "test-match-football-size5", sport: "FOOTBALL", catId: CAT.football.id, supplierId: SUPPLIERS.approved.id,
    description: "TEST fixture — size 5 match football.",
    variants: [{ sku: "TEST-FB-BALL-5", size: "5", price: 899, mrp: 1299, stock: 120 }],
  },
  {
    key: "dumbbell", name: "Adjustable Dumbbell 20kg (TEST)", slug: "test-adjustable-dumbbell-20kg", sport: "GYM", catId: CAT.gym.id, supplierId: SUPPLIERS.platinum.id,
    description: "TEST fixture — heavy item for shipping-rule tests.",
    badges: ["BEST_SELLER"],
    variants: [{ sku: "TEST-GYM-DB-20", price: 3499, mrp: 4999, stock: 25, weight: 20 }],
  },
  {
    key: "gym_tee", name: "Dry-Fit Gym Tee (TEST)", slug: "test-gym-tee-dryfit", sport: "GYM", catId: CAT.gym.id, supplierId: SUPPLIERS.silver.id,
    description: "TEST fixture — includes an out-of-stock variant.",
    badges: ["SALE"],
    variants: [
      { sku: "TEST-GYM-TEE-S", size: "S", color: "Black", price: 599, mrp: 999, stock: 0 }, // OUT OF STOCK
      { sku: "TEST-GYM-TEE-M", size: "M", color: "Black", price: 599, mrp: 999, stock: 80 },
      { sku: "TEST-GYM-TEE-L", size: "L", color: "Black", price: 599, mrp: 999, stock: 90 },
    ],
  },
  {
    key: "shoes", name: "AirLite Running Shoes (TEST)", slug: "test-airlite-running-shoes", sport: "RUNNING", catId: CAT.running.id, supplierId: SUPPLIERS.approved.id,
    description: "TEST fixture — multi-size running shoes.",
    badges: ["TRENDING"],
    variants: [
      { sku: "TEST-RUN-AL-8", size: "UK8", price: 2999, mrp: 3999, stock: 40 },
      { sku: "TEST-RUN-AL-9", size: "UK9", price: 2999, mrp: 3999, stock: 35 },
    ],
  },
  {
    key: "shorts", name: "Reflective Running Shorts (TEST)", slug: "test-running-shorts", sport: "RUNNING", catId: CAT.running.id, supplierId: SUPPLIERS.silver.id,
    description: "TEST fixture — running shorts.",
    variants: [
      { sku: "TEST-RUN-SHO-M", size: "M", price: 799, mrp: 1199, stock: 60 },
      { sku: "TEST-RUN-SHO-L", size: "L", price: 799, mrp: 1199, stock: 60 },
    ],
  },
  {
    key: "racket", name: "Pro Badminton Racket G4 (TEST)", slug: "test-pro-badminton-racket", sport: "RACKET", catId: CAT.racket.id, supplierId: SUPPLIERS.payouts.id,
    description: "TEST fixture — badminton racket (owned by PayoutTest supplier for settlement tests).",
    badges: ["NEW"],
    variants: [{ sku: "TEST-RKT-BAD-G4", size: "G4", price: 2499, mrp: 3499, stock: 45 }],
  },
  {
    key: "gloves", name: "Boxing Gloves 12oz (TEST)", slug: "test-boxing-gloves-12oz", sport: "COMBAT", catId: CAT.combat.id, supplierId: SUPPLIERS.platinum.id,
    description: "TEST fixture — combat sport gloves.",
    variants: [
      { sku: "TEST-CMB-GLV-12", size: "12oz", price: 1799, mrp: 2499, stock: 35 },
      { sku: "TEST-CMB-GLV-14", size: "14oz", price: 1799, mrp: 2499, stock: 20 },
    ],
  },
  {
    key: "archived", name: "Old Season Jersey 2019 (TEST)", slug: "test-archived-jersey-2019", sport: "CRICKET", catId: CAT.cricket.id, supplierId: SUPPLIERS.suspended.id,
    description: "TEST fixture — ARCHIVED product (must not appear on storefront).",
    flags: { isArchived: true, archivedAt: daysAgo(120), isActive: false },
    variants: [{ sku: "TEST-ARC-2019-M", size: "M", price: 499, mrp: 1799, stock: 10 }],
  },
  {
    key: "inactive", name: "Inactive Test Product", slug: "test-inactive-product", sport: "OTHER", catId: CAT.other.id, supplierId: SUPPLIERS.silver.id,
    description: "TEST fixture — INACTIVE product (hidden everywhere).",
    flags: { isActive: false },
    variants: [{ sku: "TEST-INACT-001", price: 100, mrp: 100, stock: 999 }],
  },
];

// Registry of variant info needed when building order items.
const variantReg: Record<string, { productId: string; variantId: string; productName: string; sku: string; size?: string; color?: string; price: number; mrp: number }> = {};

async function seedProducts() {
  for (const p of PRODUCTS) {
    const productId = `${ID}prod_${p.key}`;
    const base = {
      categoryId: p.catId,
      supplierId: p.supplierId ?? null,
      name: p.name,
      description: p.description,
      sport: p.sport as never,
      isActive: (p.flags?.isActive as boolean) ?? true,
      isArchived: (p.flags?.isArchived as boolean) ?? false,
      archivedAt: (p.flags?.archivedAt as Date) ?? null,
      isFeatured: (p.flags?.isFeatured as boolean) ?? false,
      isOfficialLicensed: (p.flags?.isOfficialLicensed as boolean) ?? false,
      showOnHomepage: (p.flags?.showOnHomepage as boolean) ?? false,
      teamName: (p.flags?.teamName as string) ?? null,
      leagueName: (p.flags?.leagueName as string) ?? null,
    };
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: base as never,
      create: { id: productId, slug: p.slug, ...(base as any) },
    });

    // Variants
    for (const v of p.variants) {
      const variantId = `${ID}var_${v.sku}`;
      const vdata = { productId, sku: v.sku, size: v.size ?? null, color: v.color ?? null, price: v.price, mrp: v.mrp, stock: v.stock, weight: v.weight ?? null, isActive: true };
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: vdata as never,
        create: { id: variantId, ...(vdata as any) },
      });
      variantReg[v.sku] = { productId, variantId, productName: p.name, sku: v.sku, size: v.size, color: v.color, price: v.price, mrp: v.mrp };
    }

    // Badges (unique on [productId, type])
    for (const b of p.badges ?? []) {
      await safe(`badge ${p.key}/${b}`, () =>
        db.productBadge.upsert({
          where: { productId_type: { productId, type: b } },
          update: { label: b },
          create: { id: `${ID}bdg_${p.key}_${b}`, productId, type: b, label: b },
        }),
      );
    }
  }
  console.log(`✅ Products: ${PRODUCTS.length} (${Object.keys(variantReg).length} variants)`);
}

// ── Warehouse (single default test warehouse) ────────────────────────────────
const WAREHOUSE_ID = `${ID}wh_mum`;
async function seedWarehouse() {
  await prisma.warehouse.upsert({
    where: { code: "TEST-WH-01" },
    update: { name: "Test Warehouse Mumbai", isActive: true, isDefault: true },
    create: { id: WAREHOUSE_ID, name: "Test Warehouse Mumbai", code: "TEST-WH-01", city: "Mumbai", state: "Maharashtra", pincode: "400001", isActive: true, isDefault: true },
  });
  console.log("✅ Warehouse: 1");
}

// ─────────────────────────────────────────────────────────────────────────────
//  5. COUPONS  (every type + every rejection path)
// ─────────────────────────────────────────────────────────────────────────────
const COUPONS = [
  { code: "TESTPCT10", type: "PERCENTAGE", value: 0.10, minOrderValue: 299, maxDiscount: 200, usageLimit: 1000, perUserLimit: 1, isActive: true },
  { code: "TESTFLAT100", type: "FLAT", value: 100, minOrderValue: 499, usageLimit: 500, perUserLimit: 1, isActive: true },
  { code: "TESTSAVE20", type: "PERCENTAGE", value: 0.20, minOrderValue: 1500, maxDiscount: 500, usageLimit: 200, perUserLimit: 2, isActive: true },
  { code: "TESTFREESHIP", type: "FREE_SHIPPING", value: 0, minOrderValue: 999, perUserLimit: 3, isActive: true },
  { code: "TESTFLAT500", type: "FLAT", value: 500, minOrderValue: 4000, usageLimit: 50, perUserLimit: 1, isActive: true },
  { code: "TESTWELCOME50", type: "PERCENTAGE", value: 0.50, maxDiscount: 150, perUserLimit: 1, isActive: true },
  { code: "TESTEXPIRED", type: "PERCENTAGE", value: 0.15, perUserLimit: 1, isActive: true, validUntil: daysAgo(2) },
  { code: "TESTNOTYET", type: "FLAT", value: 200, perUserLimit: 1, isActive: true, validFrom: daysFromNow(7) },
  { code: "TESTDISABLED", type: "FLAT", value: 100, perUserLimit: 1, isActive: false },
  { code: "TESTUSEDUP", type: "FLAT", value: 100, usageLimit: 5, usageCount: 5, perUserLimit: 1, isActive: true },
  { code: "TESTMINHIGH", type: "FLAT", value: 300, minOrderValue: 9999, perUserLimit: 1, isActive: true },
];

async function seedCoupons() {
  for (const c of COUPONS) {
    const { code, ...rest } = c;
    const data = {
      type: rest.type as never,
      value: rest.value,
      minOrderValue: rest.minOrderValue ?? null,
      maxDiscount: rest.maxDiscount ?? null,
      usageLimit: rest.usageLimit ?? null,
      usageCount: rest.usageCount ?? 0,
      perUserLimit: rest.perUserLimit ?? 1,
      isActive: rest.isActive,
      validFrom: rest.validFrom ?? NOW,
      validUntil: rest.validUntil ?? null,
    };
    await prisma.coupon.upsert({
      where: { code },
      update: data as never,
      create: { id: `${ID}cpn_${code}`, code, ...(data as any) },
    });
  }
  console.log(`✅ Coupons: ${COUPONS.length}`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  6. ORDER SCENARIOS  (cover every OrderStatus + PaymentStatus)
// ─────────────────────────────────────────────────────────────────────────────
interface OrderItemInput { sku: string; qty: number }
interface ScenarioInput {
  key: string;
  orderNumber: string;
  userId: string;
  addressId: string;
  items: OrderItemInput[];
  status: string;          // OrderStatus
  payMethod: string;       // PaymentMethod
  payStatus: string;       // PaymentStatus
  couponId?: string | null;
  discount?: number;
  shipping?: number;
  shipment?: { status: string; courier?: string; tracking?: string } | null;
  cod?: boolean;
  failureReason?: string;
  refundedAmount?: number;
  createdAt?: Date;
  note?: string;
}

function lineItems(items: OrderItemInput[]) {
  return items.map((it) => {
    const v = variantReg[it.sku];
    if (!v) throw new Error(`Unknown SKU in scenario: ${it.sku}`);
    return {
      productId: v.productId,
      variantId: v.variantId,
      productName: v.productName,
      variantSku: v.sku,
      size: v.size ?? null,
      color: v.color ?? null,
      quantity: it.qty,
      unitPrice: v.price,
      mrp: v.mrp,
      total: v.price * it.qty,
    };
  });
}

async function createScenario(s: ScenarioInput) {
  const items = lineItems(s.items);
  const subtotal = items.reduce((a, b) => a + b.total, 0);
  const shipping = s.shipping ?? 0;
  const discount = s.discount ?? 0;
  const total = Math.max(0, subtotal + shipping - discount);
  const createdAt = s.createdAt ?? daysAgo(3);
  const orderId = `${ID}ord_${s.key}`;

  // Order (upsert by id). Replace items each run for idempotency.
  await prisma.order.upsert({
    where: { id: orderId },
    update: { status: s.status as never, subtotal, shippingCharge: shipping, discount, total, couponId: s.couponId ?? null, notes: s.note ?? null },
    create: {
      id: orderId,
      orderNumber: s.orderNumber,
      userId: s.userId,
      shippingAddressId: s.addressId,
      couponId: s.couponId ?? null,
      status: s.status as never,
      subtotal,
      shippingCharge: shipping,
      discount,
      total,
      notes: s.note ?? null,
      createdAt,
    },
  });

  await prisma.orderItem.deleteMany({ where: { orderId } });
  let i = 0;
  for (const it of items) {
    await prisma.orderItem.create({ data: { id: `${ID}oit_${s.key}_${i++}`, orderId, ...(it as any) } });
  }

  // Payment (1:1)
  const captured = s.payStatus === "CAPTURED";
  const refunded = s.payStatus === "REFUNDED" || s.payStatus === "PARTIALLY_REFUNDED";
  await prisma.payment.upsert({
    where: { id: `${ID}pay_${s.key}` },
    update: { method: s.payMethod as never, status: s.payStatus as never, amount: total },
    create: {
      id: `${ID}pay_${s.key}`,
      orderId,
      method: s.payMethod as never,
      status: s.payStatus as never,
      amount: total,
      currency: "INR",
      // Fake identifiers only — no real Razorpay objects exist for these.
      razorpayOrderId: s.cod ? null : `order_TEST${s.key}`,
      razorpayPaymentId: captured || refunded ? `pay_TEST${s.key}` : null,
      capturedAt: captured || refunded ? createdAt : null,
      failureReason: s.failureReason ?? null,
      refundedAmount: refunded ? (s.refundedAmount ?? total) : null,
      refundedAt: refunded ? daysAgo(1) : null,
    },
  });

  // Shipment (optional)
  if (s.shipment) {
    await prisma.shipment.upsert({
      where: { id: `${ID}shp_${s.key}` },
      update: { status: s.shipment.status as never },
      create: {
        id: `${ID}shp_${s.key}`,
        orderId,
        status: s.shipment.status as never,
        courier: (s.shipment.courier as never) ?? "SHIPROCKET",
        trackingNumber: s.shipment.tracking ?? `TESTAWB${s.key}`,
        codAmount: s.cod ? total : null,
        codCollected: s.cod && s.shipment.status === "DELIVERED",
        dispatchedAt: ["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "RETURNED"].includes(s.shipment.status) ? daysAgo(2) : null,
        deliveredAt: s.shipment.status === "DELIVERED" ? daysAgo(1) : null,
      },
    });
  }

  // Status history (single representative entry, replaced each run)
  await prisma.orderStatusHistory.deleteMany({ where: { orderId } });
  await prisma.orderStatusHistory.create({
    data: { id: `${ID}osh_${s.key}`, orderId, status: s.status as never, note: "Seeded test scenario" },
  });

  return { orderId, subtotal, total };
}

const SCENARIOS: ScenarioInput[] = [
  // O1 — first-order happy path, % coupon applied (capped at ₹130 = 10% of 1299)
  { key: "o1", orderNumber: "TEST-1001", userId: CUSTOMERS.new.id, addressId: ADDR.new, items: [{ sku: "TEST-IND-ODI-M", qty: 1 }], status: "CONFIRMED", payMethod: "RAZORPAY_CARD", payStatus: "CAPTURED", couponId: `${ID}cpn_TESTPCT10`, discount: 150, shipment: { status: "PENDING" }, note: "O1 confirmed + % coupon" },
  // O2 — full lifecycle, delivered (drives settlement + review + loyalty)
  { key: "o2", orderNumber: "TEST-1002", userId: CUSTOMERS.loyal.id, addressId: ADDR.loyal, items: [{ sku: "TEST-FB-CITY-M", qty: 1 }], status: "DELIVERED", payMethod: "RAZORPAY_UPI", payStatus: "CAPTURED", shipment: { status: "DELIVERED" }, createdAt: daysAgo(12), note: "O2 delivered (settlement source)" },
  // O3 — COD, out for delivery
  { key: "o3", orderNumber: "TEST-1003", userId: CUSTOMERS.cod.id, addressId: ADDR.cod, items: [{ sku: "TEST-MI-2025-M", qty: 2 }], status: "OUT_FOR_DELIVERY", payMethod: "COD", payStatus: "PENDING", cod: true, shipment: { status: "OUT_FOR_DELIVERY" }, note: "O3 COD out-for-delivery" },
  // O4 — shipped / in transit, multi-item
  { key: "o4", orderNumber: "TEST-1004", userId: CUSTOMERS.addresses.id, addressId: ADDR.addr1, items: [{ sku: "TEST-RUN-AL-9", qty: 1 }, { sku: "TEST-RUN-SHO-M", qty: 2 }], status: "SHIPPED", payMethod: "RAZORPAY_CARD", payStatus: "CAPTURED", couponId: `${ID}cpn_TESTSAVE20`, discount: 500, shipment: { status: "IN_TRANSIT" }, note: "O4 shipped multi-item" },
  // O5 — returned + fully refunded
  { key: "o5", orderNumber: "TEST-1005", userId: CUSTOMERS.ret.id, addressId: ADDR.ret, items: [{ sku: "TEST-GYM-TEE-M", qty: 1 }], status: "REFUNDED", payMethod: "RAZORPAY_UPI", payStatus: "REFUNDED", shipment: { status: "RETURNED" }, createdAt: daysAgo(20), note: "O5 returned + refunded" },
  // O6 — processing (paid, not yet shipped)
  { key: "o6", orderNumber: "TEST-1006", userId: CUSTOMERS.loyal.id, addressId: ADDR.loyal, items: [{ sku: "TEST-CMB-GLV-12", qty: 1 }], status: "PROCESSING", payMethod: "RAZORPAY_CARD", payStatus: "CAPTURED", shipment: null, note: "O6 processing" },
  // O7 — failed card payment
  { key: "o7", orderNumber: "TEST-1007", userId: CUSTOMERS.fraud.id, addressId: ADDR.fraud, items: [{ sku: "TEST-GYM-DB-20", qty: 1 }], status: "PENDING", payMethod: "RAZORPAY_CARD", payStatus: "FAILED", shipment: null, failureReason: "Payment declined by bank (TEST simulator → Failure)", note: "O7 failed payment" },
  // O8 — partial return → partially refunded (delivered, 1 of 2 returned)
  { key: "o8", orderNumber: "TEST-1008", userId: CUSTOMERS.loyal.id, addressId: ADDR.loyal, items: [{ sku: "TEST-FB-CITY-M", qty: 2 }], status: "DELIVERED", payMethod: "RAZORPAY_CARD", payStatus: "PARTIALLY_REFUNDED", refundedAmount: 2199, shipment: { status: "DELIVERED" }, createdAt: daysAgo(15), note: "O8 partial refund" },
  // O9 — cancelled before dispatch, refunded
  { key: "o9", orderNumber: "TEST-1009", userId: CUSTOMERS.addresses.id, addressId: ADDR.addr2, items: [{ sku: "TEST-RKT-BAD-G4", qty: 1 }], status: "CANCELLED", payMethod: "RAZORPAY_CARD", payStatus: "REFUNDED", shipment: null, note: "O9 cancelled + refunded" },
  // O10 — fraud-flagged, awaiting review
  { key: "o10", orderNumber: "TEST-1010", userId: CUSTOMERS.fraud.id, addressId: ADDR.fraud, items: [{ sku: "TEST-GYM-DB-20", qty: 3 }], status: "PENDING", payMethod: "RAZORPAY_CARD", payStatus: "AUTHORIZED", couponId: `${ID}cpn_TESTFLAT500`, discount: 500, note: "O10 high-risk hold" },
  // O11 — return requested (not yet completed)
  { key: "o11", orderNumber: "TEST-1011", userId: CUSTOMERS.ret.id, addressId: ADDR.ret, items: [{ sku: "TEST-RUN-SHO-L", qty: 1 }], status: "RETURN_REQUESTED", payMethod: "RAZORPAY_UPI", payStatus: "CAPTURED", shipment: { status: "DELIVERED" }, createdAt: daysAgo(8), note: "O11 return requested" },
  // O12 — returned (received back), status RETURNED
  { key: "o12", orderNumber: "TEST-1012", userId: CUSTOMERS.cod.id, addressId: ADDR.cod, items: [{ sku: "TEST-FB-BALL-5", qty: 1 }], status: "RETURNED", payMethod: "RAZORPAY_UPI", payStatus: "CAPTURED", shipment: { status: "RETURNED" }, createdAt: daysAgo(18), note: "O12 returned" },
  // O13 — delivered, supplier PayoutTest → released settlement + payout
  { key: "o13", orderNumber: "TEST-1013", userId: CUSTOMERS.loyal.id, addressId: ADDR.loyal, items: [{ sku: "TEST-RKT-BAD-G4", qty: 1 }], status: "DELIVERED", payMethod: "RAZORPAY_CARD", payStatus: "CAPTURED", shipment: { status: "DELIVERED" }, createdAt: daysAgo(25), note: "O13 delivered (payout source)" },
];

async function seedOrders() {
  for (const s of SCENARIOS) {
    await createScenario(s);
  }
  console.log(`✅ Orders: ${SCENARIOS.length}`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  7. ENRICHMENT  (settlements, ledger, payouts, returns, reviews, risk, loyalty)
//     Wrapped in `safe()` so a partially-migrated staging DB still seeds core data.
// ─────────────────────────────────────────────────────────────────────────────

/** commission/GST math: net = gross − commission − GST(on commission) */
function settlementMath(gross: number, commissionRate: number, gstRate = 0.18) {
  const commission = +(gross * commissionRate).toFixed(2);
  const gst = +(commission * gstRate).toFixed(2);
  const net = +(gross - commission - gst).toFixed(2);
  return { commission, gst, net };
}

async function seedEnrichment() {
  // O2 → SilverLine/Platinum settlement in HOLDING (City FC kit, supplier = platinum, ₹2199)
  await safe("settlement O2 (holding)", async () => {
    const gross = 2199;
    const { commission, gst, net } = settlementMath(gross, SUPPLIERS.platinum.commission);
    await db.supplierSettlement.upsert({
      where: { orderId: `${ID}ord_o2` },
      update: { status: "HOLDING", netAmount: net },
      create: {
        id: `${ID}stl_o2`, supplierId: SUPPLIERS.platinum.id, orderId: `${ID}ord_o2`, orderNumber: "TEST-1002",
        status: "HOLDING", grossAmount: gross, commissionAmt: commission, gstOnCommission: gst, netAmount: net,
        holdDays: 7, deliveredAt: daysAgo(1), holdUntil: daysFromNow(6),
      },
    });
    await db.supplierLedger.upsert({
      where: { id: `${ID}lgr_o2` },
      update: { netAmount: net },
      create: {
        id: `${ID}lgr_o2`, supplierId: SUPPLIERS.platinum.id, type: "ORDER_EARNING", amount: net,
        grossAmount: gross, commissionAmt: commission, gstOnCommission: gst, netAmount: net, gstRate: 0.18,
        orderId: `${ID}ord_o2`, orderNumber: "TEST-1002", balanceAfter: net, description: "Order earning (TEST O2) — in hold",
      },
    });
  });

  // O13 → PayoutTest settlement RELEASED + a pending Payout
  await safe("settlement+payout O13 (released)", async () => {
    const gross = 2499;
    const { commission, gst, net } = settlementMath(gross, SUPPLIERS.payouts.commission);
    await db.supplierSettlement.upsert({
      where: { orderId: `${ID}ord_o13` },
      update: { status: "AVAILABLE", netAmount: net, releasedAt: daysAgo(1) },
      create: {
        id: `${ID}stl_o13`, supplierId: SUPPLIERS.payouts.id, orderId: `${ID}ord_o13`, orderNumber: "TEST-1013",
        status: "AVAILABLE", grossAmount: gross, commissionAmt: commission, gstOnCommission: gst, netAmount: net,
        holdDays: 7, deliveredAt: daysAgo(10), holdUntil: daysAgo(3), releasedAt: daysAgo(1),
      },
    });
    await db.supplierLedger.upsert({
      where: { id: `${ID}lgr_o13` },
      update: { netAmount: net },
      create: {
        id: `${ID}lgr_o13`, supplierId: SUPPLIERS.payouts.id, type: "ORDER_EARNING", amount: net,
        grossAmount: gross, commissionAmt: commission, gstOnCommission: gst, netAmount: net, gstRate: 0.18,
        orderId: `${ID}ord_o13`, orderNumber: "TEST-1013", balanceAfter: net, description: "Order earning (TEST O13) — released",
      },
    });
    await db.supplier.update({ where: { id: SUPPLIERS.payouts.id }, data: { availableBalance: net, lifetimeEarnings: net, totalOrders: 1 } });
    await db.payout.upsert({
      where: { id: `${ID}payout_o13` },
      update: { amount: net, status: "PENDING" },
      create: {
        id: `${ID}payout_o13`, supplierId: SUPPLIERS.payouts.id, amount: net, status: "PENDING",
        periodStart: daysAgo(30), periodEnd: NOW, notes: "TEST payout — ready to approve/process",
      },
    });
  });

  // O5 → ReturnRequest RETURNED + refunded
  await safe("return O5 (returned)", async () => {
    const v = variantReg["TEST-GYM-TEE-M"];
    await db.returnRequest.upsert({
      where: { id: `${ID}ret_o5` },
      update: { status: "REFUNDED", refundAmount: v.price },
      create: {
        id: `${ID}ret_o5`, returnNumber: "TEST-RET-0001", orderId: `${ID}ord_o5`, userId: CUSTOMERS.ret.id,
        status: "REFUNDED", reason: "DEFECTIVE", reasonNote: "Stitching came loose (TEST)", refundAmount: v.price,
        refundedAt: daysAgo(1), resolvedAt: daysAgo(1),
        items: { create: [{ id: `${ID}rti_o5`, productId: v.productId, variantId: v.variantId, productName: v.productName, variantSku: v.sku, size: v.size, quantity: 1, unitPrice: v.price }] },
      },
    });
  });

  // O11 → ReturnRequest REQUESTED (pending)
  await safe("return O11 (requested)", async () => {
    const v = variantReg["TEST-RUN-SHO-L"];
    await db.returnRequest.upsert({
      where: { id: `${ID}ret_o11` },
      update: { status: "REQUESTED" },
      create: {
        id: `${ID}ret_o11`, returnNumber: "TEST-RET-0002", orderId: `${ID}ord_o11`, userId: CUSTOMERS.ret.id,
        status: "REQUESTED", reason: "SIZE_ISSUE", reasonNote: "Too small (TEST)", refundAmount: v.price,
        items: { create: [{ id: `${ID}rti_o11`, productId: v.productId, variantId: v.variantId, productName: v.productName, variantSku: v.sku, size: v.size, quantity: 1, unitPrice: v.price }] },
      },
    });
  });

  // O2 → verified review by the loyal customer (delivered → eligible)
  await safe("review O2", async () => {
    const v = variantReg["TEST-FB-CITY-M"];
    await db.review.upsert({
      where: { id: `${ID}rev_o2` },
      update: { rating: 5 },
      create: {
        id: `${ID}rev_o2`, userId: CUSTOMERS.loyal.id, productId: v.productId, rating: 5,
        title: "Great kit", body: "Fits perfectly, fast delivery. (TEST review)", status: "APPROVED",
        isVerified: true, approvedAt: daysAgo(1),
      },
    });
  });

  // Loyal customer → loyalty points + segment
  await safe("loyalty + segment (loyal)", async () => {
    await db.loyaltyPoint.upsert({
      where: { id: `${ID}loy_loyal` },
      update: { points: 220, balance: 220 },
      create: { id: `${ID}loy_loyal`, userId: CUSTOMERS.loyal.id, type: "EARN_ORDER", points: 220, balance: 220, description: "TEST loyalty (orders O2/O6/O8/O13)" },
    });
    await db.customerSegment.upsert({
      where: { userId: CUSTOMERS.loyal.id },
      update: { totalOrders: 4, loyaltyPoints: 220 },
      create: { id: `${ID}seg_loyal`, userId: CUSTOMERS.loyal.id, tags: ["RETURNING_CUSTOMER", "LOYALTY_MEMBER"], totalOrders: 4, totalSpent: 9096, loyaltyPoints: 220, firstOrderAt: daysAgo(25), lastOrderAt: daysAgo(1) },
    });
  });

  // Fraud customer → risk profile + flagged order assessment
  await safe("risk profile (fraud)", async () => {
    await db.customerRiskProfile.upsert({
      where: { userId: CUSTOMERS.fraud.id },
      update: { riskScore: 82, riskLevel: "HIGH", flaggedOrderCount: 2 },
      create: {
        id: `${ID}risk_fraud`, userId: CUSTOMERS.fraud.id, riskScore: 82, riskLevel: "HIGH",
        totalOrders: 2, flaggedOrderCount: 2, isCodBlocked: true, notes: "TEST high-risk persona",
      },
    });
    await db.user.update({ where: { id: CUSTOMERS.fraud.id }, data: { customerRiskProfileId: `${ID}risk_fraud` } });
  });
  await safe("order risk assessment (O10)", async () => {
    await db.orderRiskAssessment.upsert({
      where: { orderId: `${ID}ord_o10` },
      update: { requiresReview: true, riskLevel: "HIGH" },
      create: {
        id: `${ID}ora_o10`, orderId: `${ID}ord_o10`, riskScore: 78, riskLevel: "HIGH",
        flags: ["HIGH_VALUE", "SUSPICIOUS_ADDRESS", "VELOCITY"], isHighValue: true, suspiciousAddress: true,
        velocityFlag: true, requiresReview: true, reviewNote: "TEST — manual review required",
      },
    });
  });

  // Wishlist customer → a few wishlist items (no orders)
  await safe("wishlist items", async () => {
    const picks = ["mi_jersey", "shoes", "racket"];
    let n = 0;
    for (const key of picks) {
      const productId = `${ID}prod_${key}`;
      await db.wishlistItem.upsert({
        where: { userId_productId: { userId: CUSTOMERS.wishlist.id, productId } },
        update: {},
        create: { id: `${ID}wsh_${key}`, userId: CUSTOMERS.wishlist.id, productId },
      });
      n++;
    }
    return n;
  });

  console.log("✅ Enrichment: settlements, payouts, returns, review, loyalty, risk, wishlist");
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const reset = process.argv.includes("--reset");
  console.log("\n🌱 TRYBY — staging/QA test seed");
  assertSafe();

  passwordHash = await bcrypt.hash(TEST_PASSWORD, BCRYPT_COST);

  if (reset) await wipe();

  await seedAdmins();
  await seedCustomers();
  await seedAddresses();
  await seedSuppliers();
  await seedCategories();
  await seedWarehouse();
  await seedProducts();
  await seedCoupons();
  await seedOrders();
  await seedEnrichment();

  console.log(
    `\n🎉 Test data ready.\n` +
      `   Admins: ${ADMINS.length} · Customers: ${Object.keys(CUSTOMERS).length} · Suppliers: ${Object.keys(SUPPLIERS).length}\n` +
      `   Products: ${PRODUCTS.length} · Coupons: ${COUPONS.length} · Orders: ${SCENARIOS.length}\n` +
      `   Password for every account: ${TEST_PASSWORD}\n` +
      `   See docs/STAGING_TEST_ACCOUNTS.md for the full credential list.\n`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
