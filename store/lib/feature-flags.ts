/**
 * Feature flag system — database-backed toggle with caching.
 * Super Admins can toggle flags without redeployment.
 */

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ── Default flags seeded on first boot ─────────────────────────────────────

export const DEFAULT_FLAGS = [
  { key: "loyalty_enabled",              name: "Loyalty Points",            description: "Earn and redeem loyalty points on orders",         enabled: true  },
  { key: "referral_enabled",             name: "Referral Program",          description: "Invite friends and earn rewards",                  enabled: true  },
  { key: "supplier_marketplace_enabled", name: "Supplier Marketplace",      description: "Allow suppliers to list and manage products",      enabled: true  },
  { key: "reviews_enabled",              name: "Product Reviews",           description: "Customers can leave star ratings and reviews",     enabled: true  },
  { key: "community_enabled",            name: "Community Page",            description: "Show /community feed and social proof posts",      enabled: false },
  { key: "google_oauth_enabled",         name: "Google Login",              description: "Allow sign in with Google",                       enabled: false },
  { key: "whatsapp_notifications",       name: "WhatsApp Notifications",    description: "Send order updates via WhatsApp",                  enabled: false },
  { key: "cod_enabled",                  name: "Cash on Delivery",          description: "Allow COD payment option at checkout",             enabled: true  },
  { key: "coupons_enabled",              name: "Coupon Codes",              description: "Allow customers to apply coupon codes",            enabled: true  },
  { key: "wishlist_enabled",             name: "Wishlist",                  description: "Allow customers to save products to wishlist",     enabled: true  },
  { key: "maintenance_bypass_admins",    name: "Admin Maintenance Bypass",  description: "Admins can access site during maintenance",        enabled: true  },
  { key: "prelaunch_mode",               name: "Pre-launch Mode",           description: "Show coming-soon splash before public launch",     enabled: false },
  { key: "shiprocket_auto_awb",         name: "Shiprocket Auto AWB",       description: "Auto-generate AWB via Shiprocket instead of manual entry", enabled: false },
] as const;

export type FlagKey = typeof DEFAULT_FLAGS[number]["key"];

// ── TTL cache (in-process, 60s) ─────────────────────────────────────────────

const cache = new Map<string, { value: boolean; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

function cacheGet(key: string): boolean | undefined {
  const hit = cache.get(key);
  if (!hit || Date.now() > hit.expiresAt) { cache.delete(key); return undefined; }
  return hit.value;
}

function cacheSet(key: string, value: boolean): void {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateCache(key?: string): void {
  if (key) cache.delete(key); else cache.clear();
}

// ── Core API ────────────────────────────────────────────────────────────────

/** Check if a flag is enabled. Returns false on any error. */
export async function isEnabled(key: string): Promise<boolean> {
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;

  try {
    const flag = await prisma.featureFlag.findUnique({ where: { key }, select: { enabled: true } });
    const value = flag?.enabled ?? false;
    cacheSet(key, value);
    return value;
  } catch {
    return false; // fail open — missing flag = feature off
  }
}

/** Read all flags with metadata. */
export async function getAllFlags() {
  return prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
}

/** Toggle a flag. Creates it if it doesn't exist. Returns the new state. */
export async function setFlag(
  key: string,
  enabled: boolean,
  updatedBy: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  const flag = await prisma.featureFlag.upsert({
    where:  { key },
    create: { key, name: key, enabled, updatedBy, ...(metadata && { metadata: metadata as Prisma.InputJsonValue }) },
    update: { enabled, updatedBy, ...(metadata && { metadata: metadata as Prisma.InputJsonValue }) },
  });
  invalidateCache(key);
  return flag.enabled;
}

/** Seed default flags that don't yet exist in DB. Call from instrumentation. */
export async function seedDefaultFlags(): Promise<void> {
  for (const flag of DEFAULT_FLAGS) {
    await prisma.featureFlag.upsert({
      where:  { key: flag.key },
      create: flag,
      update: {}, // don't overwrite admin changes
    }).catch(() => null);
  }
}
