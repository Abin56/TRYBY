import { prisma } from "@/lib/db";
import { SyncStatus, SyncFrequency } from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SupplierFeedItem {
  supplierSku: string;
  stock: number;
  costPrice?: number;
}

export interface SyncResult {
  sessionId: string;
  supplierId: string;
  supplierName: string;
  stockChanges: number;
  priceChanges: number;
  hiddenProducts: number;
  reenabledProducts: number;
  failedItems: number;
  skippedItems: number;
  totalItems: number;
  durationMs: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateSessionId() {
  return `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function calcNextSyncAt(freq: SyncFrequency): Date {
  const now = Date.now();
  const msMap: Record<SyncFrequency, number> = {
    MINUTES_15: 15 * 60 * 1000,
    MINUTES_30: 30 * 60 * 1000,
    HOURS_1:    60 * 60 * 1000,
    HOURS_6:    6  * 60 * 60 * 1000,
    DAILY:      24 * 60 * 60 * 1000,
  };
  return new Date(now + msMap[freq]);
}

function calcSellingPrice(costPrice: number, marginPercent: number, minProfit: number): number {
  const byMargin = costPrice / (1 - marginPercent);
  const byMinProfit = costPrice + minProfit;
  return Math.max(byMargin, byMinProfit);
}

// ── Core Sync Functions ───────────────────────────────────────────────────────

/**
 * Sync inventory stock levels for a single supplier from a provided feed.
 */
export async function syncSupplierInventory(
  supplierId: string,
  feed: SupplierFeedItem[],
  sessionId?: string,
): Promise<{ stockChanges: number; hiddenProducts: number; reenabledProducts: number; failedItems: number; skippedItems: number }> {
  const sid = sessionId ?? generateSessionId();

  const profile = await prisma.supplierSyncProfile.findUnique({ where: { supplierId } });
  const autoHide = profile?.autoHideOutOfStock ?? true;

  const skuMaps = await prisma.supplierSkuMap.findMany({
    where: { supplierId },
    include: { variant: { include: { product: true } } },
  });

  const skuMapIndex = new Map(skuMaps.map((m) => [m.supplierSku, m]));

  let stockChanges = 0, hiddenProducts = 0, reenabledProducts = 0, failedItems = 0, skippedItems = 0;

  for (const item of feed) {
    const mapping = skuMapIndex.get(item.supplierSku);

    if (!mapping) {
      await prisma.stockSyncLog.create({
        data: {
          syncSessionId: sid,
          supplierId,
          supplierSku: item.supplierSku,
          supplierStock: item.stock,
          status: SyncStatus.NO_MAPPING,
        },
      });
      skippedItems++;
      continue;
    }

    if (mapping.ignoreUpdates) {
      await prisma.stockSyncLog.create({
        data: {
          syncSessionId: sid,
          supplierId,
          supplierSku: item.supplierSku,
          variantId: mapping.variantId,
          supplierStock: item.stock,
          status: SyncStatus.SKIPPED,
        },
      });
      skippedItems++;
      continue;
    }

    if (mapping.manualOverride) {
      await prisma.stockSyncLog.create({
        data: {
          syncSessionId: sid,
          supplierId,
          supplierSku: item.supplierSku,
          variantId: mapping.variantId,
          supplierStock: item.stock,
          status: SyncStatus.OVERRIDDEN,
        },
      });
      skippedItems++;
      continue;
    }

    try {
      const variant = mapping.variant;
      const product = variant.product;
      const newStock = Math.max(0, item.stock - mapping.bufferStock);
      const oldStock = variant.stock;

      const stockChanged = newStock !== oldStock;
      const goingOOS    = newStock === 0 && oldStock > 0;
      const returning   = newStock > 0 && oldStock === 0;

      await prisma.$transaction(async (tx) => {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: newStock },
        });

        if (autoHide && goingOOS && product.isActive) {
          await tx.product.update({
            where: { id: product.id },
            data: { isActive: false, showOnHomepage: false },
          });

          await tx.inventoryLog.create({
            data: {
              productId: product.id,
              variantId: variant.id,
              reason: "MANUAL_ADJUSTMENT",
              stockBefore: oldStock,
              stockAfter: newStock,
              delta: newStock - oldStock,
              note: `Auto-hidden: supplier stock = 0 (sync session ${sid})`,
            },
          });

          hiddenProducts++;
        }

        if (autoHide && returning && !product.isActive) {
          await tx.product.update({
            where: { id: product.id },
            data: { isActive: true },
          });
          reenabledProducts++;
        }

        await tx.supplierSkuMap.update({
          where: { id: mapping.id },
          data: { lastSyncedAt: new Date() },
        });
      });

      if (stockChanged) stockChanges++;

      await prisma.stockSyncLog.create({
        data: {
          syncSessionId: sid,
          supplierId,
          supplierSku: item.supplierSku,
          variantId: variant.id,
          stockBefore: oldStock,
          stockAfter: newStock,
          supplierStock: item.stock,
          bufferApplied: mapping.bufferStock,
          status: SyncStatus.SUCCESS,
        },
      });
    } catch (err) {
      failedItems++;
      await prisma.stockSyncLog.create({
        data: {
          syncSessionId: sid,
          supplierId,
          supplierSku: item.supplierSku,
          variantId: mapping.variantId,
          supplierStock: item.stock,
          status: SyncStatus.FAILED,
          errorReason: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  return { stockChanges, hiddenProducts, reenabledProducts, failedItems, skippedItems };
}

/**
 * Sync cost prices for a supplier and recalculate selling prices using margin rules.
 */
export async function syncSupplierPrices(
  supplierId: string,
  feed: SupplierFeedItem[],
  sessionId?: string,
): Promise<{ priceChanges: number; failedItems: number }> {
  const sid = sessionId ?? generateSessionId();

  const profile = await prisma.supplierSyncProfile.findUnique({ where: { supplierId } });
  if (!profile?.autoAdjustPrice) return { priceChanges: 0, failedItems: 0 };

  const margin = Number(profile.marginPercent);
  const minProfit = Number(profile.minProfitAmount);

  const skuMaps = await prisma.supplierSkuMap.findMany({
    where: { supplierId },
    include: { variant: true },
  });
  const skuMapIndex = new Map(skuMaps.map((m) => [m.supplierSku, m]));

  let priceChanges = 0, failedItems = 0;

  for (const item of feed) {
    if (item.costPrice === undefined) continue;

    const mapping = skuMapIndex.get(item.supplierSku);
    if (!mapping || mapping.ignoreUpdates || mapping.manualOverride) continue;

    try {
      const variant = mapping.variant;
      const newCost  = item.costPrice;
      const oldCost  = variant.costPrice ? Number(variant.costPrice) : undefined;

      if (oldCost === newCost) continue;

      const newSellPrice = calcSellingPrice(newCost, margin, minProfit);
      const oldSellPrice = Number(variant.price);

      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { costPrice: newCost, price: newSellPrice },
      });

      await prisma.priceSyncLog.create({
        data: {
          syncSessionId: sid,
          supplierId,
          variantId: variant.id,
          supplierSku: item.supplierSku,
          oldCostPrice: oldCost,
          newCostPrice: newCost,
          oldSellPrice,
          newSellPrice,
          marginUsed: margin,
          minProfitUsed: minProfit,
        },
      });

      priceChanges++;
    } catch (err) {
      failedItems++;
      // price failure is non-fatal — continue processing rest
      console.error(`[supplier-sync] price update failed for sku ${item.supplierSku}:`, err);
    }
  }

  return { priceChanges, failedItems };
}

/**
 * Full sync for a single supplier: stock + prices in one session.
 */
export async function syncSingleSupplier(
  supplierId: string,
  feed: SupplierFeedItem[],
): Promise<SyncResult> {
  const start = Date.now();
  const sessionId = generateSessionId();

  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { companyName: true, syncProfile: true },
  });
  if (!supplier) throw new Error(`Supplier ${supplierId} not found`);

  let stockRes = { stockChanges: 0, hiddenProducts: 0, reenabledProducts: 0, failedItems: 0, skippedItems: 0 };
  let priceRes = { priceChanges: 0, failedItems: 0 };

  try {
    [stockRes, priceRes] = await Promise.all([
      syncSupplierInventory(supplierId, feed, sessionId),
      syncSupplierPrices(supplierId, feed, sessionId),
    ]);

    await prisma.supplierSyncProfile.upsert({
      where: { supplierId },
      create: {
        supplierId,
        syncEnabled: true,
        lastSyncAt: new Date(),
        nextSyncAt: calcNextSyncAt(supplier.syncProfile?.syncFrequency ?? SyncFrequency.HOURS_1),
        consecutiveFailures: 0,
      },
      update: {
        lastSyncAt: new Date(),
        nextSyncAt: calcNextSyncAt(supplier.syncProfile?.syncFrequency ?? SyncFrequency.HOURS_1),
        consecutiveFailures: 0,
      },
    });
  } catch (err) {
    await prisma.supplierSyncProfile.upsert({
      where: { supplierId },
      create: { supplierId, syncEnabled: true, consecutiveFailures: 1 },
      update: { consecutiveFailures: { increment: 1 } },
    });
    throw err;
  }

  return {
    sessionId,
    supplierId,
    supplierName: supplier.companyName,
    stockChanges: stockRes.stockChanges,
    priceChanges: priceRes.priceChanges,
    hiddenProducts: stockRes.hiddenProducts,
    reenabledProducts: stockRes.reenabledProducts,
    failedItems: stockRes.failedItems + priceRes.failedItems,
    skippedItems: stockRes.skippedItems,
    totalItems: feed.length,
    durationMs: Date.now() - start,
  };
}

/**
 * Run sync for all suppliers that have syncEnabled = true.
 * Used by cron/scheduled jobs.
 */
export async function syncAllSuppliers(
  feedProvider: (supplierId: string) => Promise<SupplierFeedItem[]>,
): Promise<SyncResult[]> {
  const profiles = await prisma.supplierSyncProfile.findMany({
    where: { syncEnabled: true },
    select: { supplierId: true },
  });

  const results: SyncResult[] = [];
  for (const { supplierId } of profiles) {
    try {
      const feed = await feedProvider(supplierId);
      const result = await syncSingleSupplier(supplierId, feed);
      results.push(result);
    } catch (err) {
      console.error(`[supplier-sync] syncAllSuppliers: supplier ${supplierId} failed:`, err);
    }
  }
  return results;
}
