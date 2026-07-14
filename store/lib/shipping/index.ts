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
import { normalizePincode, isPincodeServiceable } from "./serviceability";
import { isMockServiceabilityEnabled, findServiceableArea } from "./serviceable-pincodes";
import type { ShippingProvider, ServiceabilityResult, CourierQuote } from "./types";

export type { ShippingProvider, ServiceabilityResult, CourierQuote };
export type { CreateShipmentInput, CreateShipmentResult, TrackShipmentResult, GenerateLabelResult } from "./types";
export {
  normalizePincode, isPincodeServiceable, normalizeState,
  resolveDeliveryState, normalizeCourierAddress,
} from "./serviceability";

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
  // ── Serviceability layer — deterministic checks BEFORE any courier API call ──

  // 1. Normalize + validate the destination pincode format. (STEP A + B)
  const destPincode = normalizePincode(toPincode);
  if (!destPincode) {
    return { serviceable: false, success: false, codAvailable: false, estimatedDays: null, quotes: [], reason: "Enter a valid 6-digit pincode", message: "Enter a valid 6-digit pincode" };
  }

  // 0. MOCK MODE (testing only) — answer purely from the dummy SERVICEABLE_AREAS
  //    list and never touch a courier API. Off by default; see
  //    NEXT_PUBLIC_SHIPPING_MOCK_MODE. Real logic below runs when it is off.
  if (isMockServiceabilityEnabled()) {
    return mockServiceability(destPincode, restrictedPincodes, isCOD);
  }

  // 2. Explicit block-list (admin-managed in DB) wins.
  if (restrictedPincodes.map(p => normalizePincode(p) ?? p).includes(destPincode)) {
    return { serviceable: false, success: false, codAvailable: false, estimatedDays: null, quotes: [], reason: "Delivery not available for this pincode", message: "Delivery not available for this pincode" };
  }

  // 3. Non-serviceable zones (e.g. APO/FPO 9xxxxx) — clean answer, no network call.
  if (!isPincodeServiceable(destPincode)) {
    return { serviceable: false, success: false, codAvailable: false, estimatedDays: null, quotes: [], reason: "Delivery not available for this pincode", message: "Delivery not available for this pincode" };
  }

  // ── Live courier quotes (best-effort) ──
  const normFrom = normalizePincode(fromPincode) ?? fromPincode;
  const results = await Promise.allSettled(
    getAllProviders().map(p => p.checkServiceability(normFrom, destPincode, weightGrams, isCOD, orderValue))
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
    // The pincode passed the serviceability layer above, so it IS deliverable —
    // we simply couldn't fetch live rates this time (provider down, credentials
    // not configured in staging, transient error, etc.). Don't block the
    // customer with a misleading "no courier available"; allow the order with a
    // standard estimate. Genuinely undeliverable pincodes were already rejected.
    console.warn(`[shipping] no live courier quotes for ${normFrom}→${destPincode}; falling back to standard delivery (pincode is serviceable)`);
    return {
      serviceable:   true,
      success:       true,
      fallback:      true,
      codAvailable:  isCOD,
      estimatedDays: null,
      quotes:        [],
      message:       "Standard delivery available",
    };
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
    success:       true,
    codAvailable:  anyCOD,
    estimatedDays: minDays === Infinity ? null : minDays,
    quotes:        allQuotes.sort((a, b) => a.rate - b.rate),
  };
}

// ── Mock serviceability (testing only) ────────────────────────────────────────

/**
 * Answer serviceability from the hard-coded SERVICEABLE_AREAS list, never
 * calling a courier API. Used only when mock mode is enabled. Returns the same
 * ServiceabilityResult shape as the live path so every caller (checkout, orders,
 * public route) works unchanged.
 */
function mockServiceability(
  destPincode: string,
  restrictedPincodes: string[],
  isCOD: boolean,
): ServiceabilityResult {
  if (restrictedPincodes.map(p => normalizePincode(p) ?? p).includes(destPincode)) {
    return { serviceable: false, success: false, codAvailable: false, estimatedDays: null, quotes: [], reason: "Delivery not available for this pincode", message: "Delivery not available for this pincode" };
  }

  const area = findServiceableArea(destPincode);
  if (!area) {
    return { serviceable: false, success: false, codAvailable: false, estimatedDays: null, quotes: [], reason: "Delivery not available for this pincode", message: "Delivery not available for this pincode" };
  }

  const quotes: CourierQuote[] = area.couriers.map((courier, i) => ({
    provider:      courier.toUpperCase(),
    providerLabel: courier,
    courierId:     `mock-${courier.toLowerCase()}`,
    courierName:   `${courier} (Mock)`,
    estimatedDays: area.etaMinDays,
    estimatedDate: "",
    rate:          0,
    codAvailable:  true,
    codCharge:     0,
    isBest:        i === 0,
    isFastest:     i === 0,
    isCheapest:    i === 0,
  }));

  return {
    serviceable:   true,
    success:       true,
    codAvailable:  isCOD ? true : quotes.some(q => q.codAvailable),
    estimatedDays: area.etaMinDays,
    quotes,
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
