/**
 * Shipping provider registry.
 * Import from here — never import providers directly in routes.
 *
 * Adding a new provider (BlueDart, XpressBees, etc.):
 *   1. Create lib/shipping/bluedart.ts implementing ShippingProvider
 *   2. Import it here and add to PROVIDERS map
 *   3. Add env vars to .env.local
 *   4. Done — all existing routes work automatically
 */

import { ShiprocketProvider } from "./shiprocket";
import { DelhiveryProvider   } from "./delhivery";
import type { ShippingProvider, ServiceabilityResult, CourierQuote } from "./types";

export type { ShippingProvider, ServiceabilityResult, CourierQuote };
export type { CreateShipmentInput, CreateShipmentResult, TrackShipmentResult, GenerateLabelResult } from "./types";

// ── Registry ──────────────────────────────────────────────────────────────────

const _providers: Record<string, ShippingProvider> = {
  SHIPROCKET: new ShiprocketProvider(),
  DELHIVERY:  new DelhiveryProvider(),
};

export function getProvider(name: string): ShippingProvider | null {
  return _providers[name.toUpperCase()] ?? null;
}

export function getAllProviders(): ShippingProvider[] {
  return Object.values(_providers);
}

// ── Aggregate serviceability across all providers ─────────────────────────────

export async function aggregateServiceability(
  fromPincode: string,
  toPincode:   string,
  weightGrams: number,
  isCOD:       boolean,
  orderValue:  number,
  restrictedPincodes: string[] = [],
): Promise<ServiceabilityResult> {
  // Check local blocked list first
  if (restrictedPincodes.includes(toPincode)) {
    return { serviceable: false, codAvailable: false, estimatedDays: null, quotes: [], reason: "Delivery not available to this pincode" };
  }

  const results = await Promise.allSettled(
    getAllProviders().map(p => p.checkServiceability(fromPincode, toPincode, weightGrams, isCOD, orderValue))
  );

  const allQuotes: CourierQuote[] = [];
  let anyCOD = false;
  let minDays = Infinity;

  for (const r of results) {
    if (r.status === "fulfilled" && r.value.serviceable) {
      allQuotes.push(...r.value.quotes);
      if (r.value.codAvailable) anyCOD = true;
      if (r.value.estimatedDays && r.value.estimatedDays < minDays) minDays = r.value.estimatedDays;
    }
  }

  if (!allQuotes.length) {
    return { serviceable: false, codAvailable: false, estimatedDays: null, quotes: [], reason: "No courier available for this route" };
  }

  // Rank: best = lowest rate among fastest; cheapest = lowest rate; fastest = fewest days
  const minRate      = Math.min(...allQuotes.map(q => q.rate));
  const minEstDays   = Math.min(...allQuotes.map(q => q.estimatedDays));
  const fastQuotes   = allQuotes.filter(q => q.estimatedDays === minEstDays);
  const bestRate     = Math.min(...fastQuotes.map(q => q.rate));

  for (const q of allQuotes) {
    q.isCheapest = q.rate === minRate;
    q.isFastest  = q.estimatedDays === minEstDays;
    q.isBest     = q.estimatedDays === minEstDays && q.rate === bestRate;
  }

  return {
    serviceable:   true,
    codAvailable:  anyCOD,
    estimatedDays: minDays === Infinity ? null : minDays,
    quotes:        allQuotes.sort((a, b) => a.rate - b.rate),
  };
}

// ── Best provider for booking ─────────────────────────────────────────────────

export function pickProvider(preferredCouriers: string[]): ShippingProvider | null {
  for (const name of preferredCouriers) {
    const p = getProvider(name);
    if (p) return p;
  }
  return getProvider("SHIPROCKET") ?? getAllProviders()[0] ?? null;
}
