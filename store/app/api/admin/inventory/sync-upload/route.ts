/**
 * Supplier Stock Sync — CSV Upload & Apply
 *
 * POST /api/admin/inventory/sync-upload
 *   Content-Type: multipart/form-data
 *   Fields: file (CSV), supplierId, preview (boolean string)
 *
 * CSV format:
 *   supplierSku, stock
 *   (header row required; extra columns ignored)
 *
 * Architecture note:
 *   The parseCSV / applySync functions are pure — they receive rows
 *   and call prisma. Swapping CSV for an API feed (Shiprocket, ERP)
 *   only requires replacing the CSV-parse step with an API fetch
 *   that emits the same FeedRow[] type. The sync engine is unchanged.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, AdminRole, SyncStatus } from "@prisma/client";
import { randomUUID } from "crypto";

function adminOnly(role?: string) {
  return role !== UserRole.ADMIN && role !== AdminRole.SUPER_ADMIN;
}

interface FeedRow {
  supplierSku: string;
  supplierStock: number;
}

interface PreviewRow {
  supplierSku: string;
  variantId:   string | null;
  variantSku:  string | null;
  productName: string | null;
  supplierStock: number;
  currentStock: number | null;
  projectedStock: number | null;
  bufferApplied: number;
  status: "UPDATE" | "NO_CHANGE" | "NO_MAPPING" | "SKIP" | "OVERRIDE";
  note?: string;
}

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSV(text: string): FeedRow[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  // Detect header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes("sku") || firstLine.includes("supplier");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const rows: FeedRow[] = [];
  for (const line of dataLines) {
    // Split on comma, handle quoted fields
    const parts = line.split(",").map(p => p.trim().replace(/^"|"$/g, ""));
    if (parts.length < 2) continue;
    const sku   = parts[0].trim();
    const stock = parseInt(parts[1].trim(), 10);
    if (!sku || isNaN(stock) || stock < 0) continue;
    rows.push({ supplierSku: sku, supplierStock: stock });
  }
  return rows;
}

// ── Preview — no DB writes ────────────────────────────────────────────────────

async function buildPreview(supplierId: string, rows: FeedRow[]): Promise<PreviewRow[]> {
  const supplierSkus = rows.map(r => r.supplierSku);

  // Fetch all relevant mappings in one query
  const maps = await prisma.supplierSkuMap.findMany({
    where: { supplierId, supplierSku: { in: supplierSkus } },
    include: {
      variant: { select: { id: true, sku: true, stock: true, product: { select: { name: true } } } },
    },
  });

  const mapBySupplierSku = new Map(maps.map(m => [m.supplierSku, m]));

  return rows.map(row => {
    const map = mapBySupplierSku.get(row.supplierSku);

    if (!map) {
      return {
        supplierSku:    row.supplierSku,
        variantId:      null,
        variantSku:     null,
        productName:    null,
        supplierStock:  row.supplierStock,
        currentStock:   null,
        projectedStock: null,
        bufferApplied:  0,
        status:         "NO_MAPPING" as const,
        note:           "No SKU mapping found",
      };
    }

    if (map.ignoreUpdates) {
      return {
        supplierSku:    row.supplierSku,
        variantId:      map.variantId,
        variantSku:     map.variant.sku,
        productName:    map.variant.product.name,
        supplierStock:  row.supplierStock,
        currentStock:   map.variant.stock,
        projectedStock: map.variant.stock,
        bufferApplied:  0,
        status:         "SKIP" as const,
        note:           "ignoreUpdates is enabled",
      };
    }

    if (map.manualOverride) {
      return {
        supplierSku:    row.supplierSku,
        variantId:      map.variantId,
        variantSku:     map.variant.sku,
        productName:    map.variant.product.name,
        supplierStock:  row.supplierStock,
        currentStock:   map.variant.stock,
        projectedStock: map.variant.stock,
        bufferApplied:  0,
        status:         "OVERRIDE" as const,
        note:           "manualOverride is enabled — supplier update suppressed",
      };
    }

    const projected = Math.max(0, row.supplierStock - map.bufferStock);
    const noChange  = projected === map.variant.stock;

    return {
      supplierSku:    row.supplierSku,
      variantId:      map.variantId,
      variantSku:     map.variant.sku,
      productName:    map.variant.product.name,
      supplierStock:  row.supplierStock,
      currentStock:   map.variant.stock,
      projectedStock: projected,
      bufferApplied:  map.bufferStock,
      status:         noChange ? "NO_CHANGE" as const : "UPDATE" as const,
    };
  });
}

// ── Apply — writes stock adjustments and sync logs ───────────────────────────

async function applySync(
  supplierId: string,
  rows: FeedRow[],
  adminId: string | null,
): Promise<{ sessionId: string; success: number; skipped: number; noMapping: number; failed: number; overridden: number }> {
  const sessionId = randomUUID();
  const supplierSkus = rows.map(r => r.supplierSku);

  const maps = await prisma.supplierSkuMap.findMany({
    where: { supplierId, supplierSku: { in: supplierSkus } },
    include: { variant: { select: { id: true, sku: true, stock: true, productId: true } } },
  });
  const mapBySupplierSku = new Map(maps.map(m => [m.supplierSku, m]));

  let success = 0, skipped = 0, noMapping = 0, failed = 0, overridden = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logRows: any[] = [];
  const variantUpdates: { id: string; newStock: number; oldStock: number; productId: string; buffer: number; supplierStock: number }[] = [];

  for (const row of rows) {
    const map = mapBySupplierSku.get(row.supplierSku);

    if (!map) {
      noMapping++;
      logRows.push({
        syncSessionId: sessionId,
        supplierId,
        supplierSku:  row.supplierSku,
        variantId:    null,
        stockBefore:  null,
        stockAfter:   null,
        supplierStock: row.supplierStock,
        bufferApplied: 0,
        status:       SyncStatus.NO_MAPPING,
        errorReason:  "No SKU mapping",
      });
      continue;
    }

    if (map.ignoreUpdates) {
      skipped++;
      logRows.push({
        syncSessionId: sessionId,
        supplierId,
        supplierSku:   row.supplierSku,
        variantId:     map.variantId,
        stockBefore:   map.variant.stock,
        stockAfter:    map.variant.stock,
        supplierStock: row.supplierStock,
        bufferApplied: 0,
        status:        SyncStatus.SKIPPED,
        errorReason:   "ignoreUpdates enabled",
      });
      continue;
    }

    if (map.manualOverride) {
      overridden++;
      logRows.push({
        syncSessionId: sessionId,
        supplierId,
        supplierSku:   row.supplierSku,
        variantId:     map.variantId,
        stockBefore:   map.variant.stock,
        stockAfter:    map.variant.stock,
        supplierStock: row.supplierStock,
        bufferApplied: 0,
        status:        SyncStatus.OVERRIDDEN,
        errorReason:   "manualOverride enabled",
      });
      continue;
    }

    const projected = Math.max(0, row.supplierStock - map.bufferStock);
    variantUpdates.push({
      id: map.variantId,
      newStock: projected,
      oldStock: map.variant.stock,
      productId: map.variant.productId,
      buffer: map.bufferStock,
      supplierStock: row.supplierStock,
    });

    logRows.push({
      syncSessionId: sessionId,
      supplierId,
      supplierSku:   row.supplierSku,
      variantId:     map.variantId,
      stockBefore:   map.variant.stock,
      stockAfter:    projected,
      supplierStock: row.supplierStock,
      bufferApplied: map.bufferStock,
      status:        SyncStatus.SUCCESS,
    });
    success++;
  }

  // Apply all stock updates + write inventory logs in a single transaction
  if (variantUpdates.length > 0) {
    await prisma.$transaction(async tx => {
      for (const u of variantUpdates) {
        if (u.newStock === u.oldStock) continue;
        await tx.productVariant.update({
          where: { id: u.id },
          data: { stock: u.newStock },
        });
        await tx.inventoryLog.create({
          data: {
            variantId:   u.id,
            productId:   u.productId,
            adminId,
            reason:      "CSV_IMPORT",
            stockBefore: u.oldStock,
            stockAfter:  u.newStock,
            delta:       u.newStock - u.oldStock,
            note:        `Supplier sync · buffer ${u.buffer} · supplier stock ${u.supplierStock}`,
          },
        });
      }
    });
  }

  // Update lastSyncedAt on all mapped variants
  const mappedVariantIds = maps.map(m => m.variantId);
  if (mappedVariantIds.length > 0) {
    await prisma.supplierSkuMap.updateMany({
      where: { supplierId, variantId: { in: mappedVariantIds } },
      data: { lastSyncedAt: new Date() },
    });
  }

  // Write all sync logs
  await prisma.stockSyncLog.createMany({ data: logRows });

  return { sessionId, success, skipped, noMapping, failed, overridden };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Multipart form required" }, { status: 400 });

  const file        = form.get("file") as File | null;
  const supplierId  = (form.get("supplierId") as string | null)?.trim();
  const isPreview   = form.get("preview") !== "false";   // default preview=true

  if (!file || !supplierId) {
    return NextResponse.json({ error: "file and supplierId are required" }, { status: 400 });
  }

  // Verify supplier exists
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { id: true, companyName: true },
  });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const text = await file.text();
  const rows = parseCSV(text);
  if (!rows.length) return NextResponse.json({ error: "No valid rows found in CSV" }, { status: 400 });

  if (isPreview) {
    const preview = await buildPreview(supplierId, rows);
    const counts = {
      total:     preview.length,
      update:    preview.filter(r => r.status === "UPDATE").length,
      noChange:  preview.filter(r => r.status === "NO_CHANGE").length,
      noMapping: preview.filter(r => r.status === "NO_MAPPING").length,
      skip:      preview.filter(r => r.status === "SKIP").length,
      override:  preview.filter(r => r.status === "OVERRIDE").length,
    };
    return NextResponse.json({ preview, counts, supplier });
  }

  // Apply
  const adminProfileId = session.user.id; // use userId as adminId reference
  const result = await applySync(supplierId, rows, adminProfileId);
  return NextResponse.json({ ok: true, ...result, supplier });
}
