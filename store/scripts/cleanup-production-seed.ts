/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TRYBY — PRODUCTION CATALOG CLEANUP   (scripts/cleanup-production-seed.ts)
 * ─────────────────────────────────────────────────────────────────────────────
 *  External QA found placeholder/test products live in the production catalog
 *  (e.g. name "A product", description "df", no images, no variants). This
 *  script identifies and removes them.
 *
 *  WHAT IT MATCHES (a product is a cleanup candidate if ANY is true):
 *    1. Name is in NAME_BLOCKLIST (case-insensitive, trimmed).
 *    2. Description is junk (in DESC_BLOCKLIST, or < 3 meaningful chars).
 *    3. It has NO images AND NO variants (an un-purchasable shell).
 *
 *  SAFETY (this touches PRODUCTION data — read this):
 *    • DRY RUN BY DEFAULT. It only reports unless you pass --apply.
 *    • A candidate that has REAL commercial history (any orderItems,
 *      returnItems, or purchaseOrderItems) is NEVER hard-deleted — deleting it
 *      would corrupt order history / violate FKs. It is reported and, with
 *      --archive-referenced, soft-archived (isActive=false, isArchived=true).
 *    • Hard delete runs in a transaction and first removes only non-historical
 *      child rows (images, variants, badges, cart/wishlist items, inventory
 *      logs, warehouse stocks, transfer/bundle items).
 *    • Nothing else in the catalog is touched.
 *
 *  USAGE
 *    npm run cleanup:catalog                 # DRY RUN — report only (default)
 *    npm run cleanup:catalog -- --apply      # actually delete safe candidates
 *    npm run cleanup:catalog -- --apply --archive-referenced
 *                                            # also archive history-referenced ones
 *    npm run cleanup:catalog -- --json       # machine-readable report
 *
 *  Requires DATABASE_URL in the environment (same as the app).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Match rules ──────────────────────────────────────────────────────────────

const NAME_BLOCKLIST = [
  "a product",
  "test product",
  "test",
  "demo product",
  "sample product",
  "sample",
  "untitled",
  "untitled product",
  "new product",
  "product",
  "asdf",
  "df",
  "xxx",
];

const DESC_BLOCKLIST = [
  "df",
  "test",
  "asdf",
  "asd",
  "todo",
  "lorem",
  "lorem ipsum",
  "xxx",
  "...",
  "na",
  "n/a",
  "-",
];

// ── CLI flags ──────────────────────────────────────────────────────────────--

const args = process.argv.slice(2);
const APPLY = args.includes("--apply") || args.includes("--confirm");
const ARCHIVE_REFERENCED = args.includes("--archive-referenced");
const JSON_OUT = args.includes("--json");

// ── Helpers ──────────────────────────────────────────────────────────────────

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

/** A description is "junk" if blocklisted, empty, or fewer than 3 letters/digits. */
function isJunkDescription(desc: string | null | undefined): boolean {
  const n = norm(desc);
  if (DESC_BLOCKLIST.includes(n)) return true;
  const meaningful = n.replace(/[^a-z0-9]/g, "");
  return meaningful.length < 3;
}

interface Candidate {
  id: string;
  name: string;
  slug: string;
  reasons: string[];
  images: number;
  variants: number;
  orderItems: number;
  returnItems: number;
  poItems: number;
  safeToDelete: boolean;
}

// ── Scan ───────────────────────────────────────────────────────────────────--

async function scan(): Promise<Candidate[]> {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: {
          images: true,
          variants: true,
          orderItems: true,
          returnItems: true,
          purchaseOrderItems: true,
        },
      },
    },
  });

  const candidates: Candidate[] = [];

  for (const p of products) {
    const reasons: string[] = [];
    if (NAME_BLOCKLIST.includes(norm(p.name))) reasons.push(`blocklisted name "${p.name}"`);
    if (isJunkDescription(p.description)) reasons.push(`junk description "${(p.description ?? "").slice(0, 20)}"`);
    if (p._count.images === 0 && p._count.variants === 0) reasons.push("no images AND no variants");

    if (reasons.length === 0) continue;

    const hasHistory =
      p._count.orderItems > 0 || p._count.returnItems > 0 || p._count.purchaseOrderItems > 0;

    candidates.push({
      id: p.id,
      name: p.name,
      slug: p.slug,
      reasons,
      images: p._count.images,
      variants: p._count.variants,
      orderItems: p._count.orderItems,
      returnItems: p._count.returnItems,
      poItems: p._count.purchaseOrderItems,
      safeToDelete: !hasHistory,
    });
  }

  return candidates;
}

// ── Delete (transactional, FK-safe) ───────────────────────────────────────────

async function hardDelete(productId: string): Promise<void> {
  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId } }),
    prisma.productVariant.deleteMany({ where: { productId } }),
    prisma.productBadge.deleteMany({ where: { productId } }),
    prisma.cartItem.deleteMany({ where: { productId } }),
    prisma.wishlistItem.deleteMany({ where: { productId } }),
    prisma.inventoryLog.deleteMany({ where: { productId } }),
    prisma.warehouseStock.deleteMany({ where: { productId } }),
    prisma.stockTransferItem.deleteMany({ where: { productId } }),
    prisma.bundleItem.deleteMany({ where: { productId } }),
    prisma.product.delete({ where: { id: productId } }),
  ]);
}

async function archive(productId: string): Promise<void> {
  await prisma.product.update({
    where: { id: productId },
    data: { isActive: false, isArchived: true, archivedAt: new Date(), showOnHomepage: false },
  });
}

// ── Main ───────────────────────────────────────────────────────────────────--

async function main() {
  const mode = APPLY ? "APPLY (mutating)" : "DRY RUN (no changes)";
  const candidates = await scan();

  const deletable = candidates.filter((c) => c.safeToDelete);
  const referenced = candidates.filter((c) => !c.safeToDelete);

  if (JSON_OUT) {
    console.log(JSON.stringify({ mode, total: candidates.length, deletable, referenced }, null, 2));
  } else {
    console.log(`\n── TRYBY catalog cleanup — ${mode} ──`);
    console.log(`Found ${candidates.length} candidate(s): ${deletable.length} deletable, ${referenced.length} history-referenced.\n`);

    for (const c of deletable) {
      console.log(`  [DELETE] ${c.name}  (${c.slug})  img=${c.images} var=${c.variants}`);
      console.log(`           reasons: ${c.reasons.join("; ")}`);
    }
    for (const c of referenced) {
      console.log(`  [SKIP — has history] ${c.name}  (${c.slug})  orders=${c.orderItems} returns=${c.returnItems} po=${c.poItems}`);
      console.log(`           reasons: ${c.reasons.join("; ")}  → ${ARCHIVE_REFERENCED ? "will ARCHIVE" : "left untouched (use --archive-referenced)"}`);
    }
  }

  if (!APPLY) {
    console.log(`\nDRY RUN complete. Re-run with --apply to delete the ${deletable.length} safe candidate(s).`);
    return;
  }

  // ── Mutating phase ──────────────────────────────────────────────────────--
  let deleted = 0;
  let archived = 0;

  for (const c of deletable) {
    try {
      await hardDelete(c.id);
      deleted++;
      console.log(`  ✓ deleted ${c.slug}`);
    } catch (err) {
      console.error(`  ✗ failed to delete ${c.slug}:`, (err as Error).message);
    }
  }

  if (ARCHIVE_REFERENCED) {
    for (const c of referenced) {
      try {
        await archive(c.id);
        archived++;
        console.log(`  ✓ archived ${c.slug}`);
      } catch (err) {
        console.error(`  ✗ failed to archive ${c.slug}:`, (err as Error).message);
      }
    }
  }

  console.log(`\nDone. Deleted ${deleted}, archived ${archived}, skipped ${referenced.length - archived}.`);
}

main()
  .catch((e) => {
    console.error("cleanup-production-seed failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
