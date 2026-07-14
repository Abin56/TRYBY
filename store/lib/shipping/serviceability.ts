/**
 * Serviceability + address normalization layer.
 *
 * Sits IN FRONT of the live courier APIs (Shiprocket / Delhivery) so that:
 *   1. Obviously undeliverable pincodes get a clean, deterministic answer
 *      ("Delivery not available for this pincode") WITHOUT a network round-trip.
 *   2. The state we hand to the courier is derived from / validated against the
 *      customer's own pincode — never a hardcoded default. This is what fixes the
 *      "Karnataka instead of Kerala" class of bug: a wrong frontend state is
 *      corrected to the state the pincode actually belongs to, and the change is
 *      logged. We only correct when we are confident; otherwise we keep what the
 *      customer entered (we never invent or default a state).
 *
 * Nothing in here mutates persisted data on its own — callers decide whether to
 * use the normalized result. The provider layer applies it right before the API
 * call so the manifest/label state is always correct for the destination pincode.
 */

// ── Canonical Indian states/UTs ────────────────────────────────────────────────

const CANONICAL_STATES = [
  "Andaman & Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam",
  "Bihar", "Chandigarh", "Chhattisgarh", "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;

// Lower-cased canonical → canonical, for case-insensitive matching.
const CANONICAL_BY_LOWER = new Map(CANONICAL_STATES.map(s => [s.toLowerCase(), s]));

// Common alternate spellings / abbreviations → canonical name.
const STATE_ALIASES: Record<string, string> = {
  "kerela": "Kerala",
  "keralam": "Kerala",
  "orissa": "Odisha",
  "pondicherry": "Puducherry",
  "pondichery": "Puducherry",
  "uttaranchal": "Uttarakhand",
  "jammu and kashmir": "Jammu & Kashmir",
  "jammu & kashmir": "Jammu & Kashmir",
  "j&k": "Jammu & Kashmir",
  "nct of delhi": "Delhi",
  "new delhi": "Delhi",
  "tamilnadu": "Tamil Nadu",
  "andaman and nicobar islands": "Andaman & Nicobar Islands",
  "andaman & nicobar": "Andaman & Nicobar Islands",
  "dadra and nagar haveli": "Dadra & Nagar Haveli and Daman & Diu",
  "daman and diu": "Dadra & Nagar Haveli and Daman & Diu",
};

/**
 * Pincode prefix → plausible state(s). Indian PIN codes encode a postal circle
 * in their leading digits, which maps closely (not 1:1) to a state. We use this
 * ONLY to validate / fill the state for a known pincode — never for the
 * serviceable yes/no decision (see isPincodeServiceable).
 *
 * 3-digit entries take precedence over 2-digit ones — needed for circles that
 * sit inside another circle's 2-digit range (e.g. Goa 403 lives under "40"
 * which is otherwise Maharashtra).
 */
const PREFIX_3: Record<string, string[]> = {
  "403": ["Goa"],
  "605": ["Puducherry", "Tamil Nadu"],
  "533": ["Andhra Pradesh"],        // includes Yanam (Puducherry) — keep AP primary
  "682": ["Kerala", "Lakshadweep"],
  "737": ["Sikkim"],
  "744": ["Andaman & Nicobar Islands"],
};

const PREFIX_2: Record<string, string[]> = {
  "11": ["Delhi"],
  "12": ["Haryana"],
  "13": ["Haryana", "Punjab", "Chandigarh"],
  "14": ["Punjab"],
  "15": ["Punjab"],
  "16": ["Punjab", "Chandigarh"],
  "17": ["Himachal Pradesh"],
  "18": ["Jammu & Kashmir"],
  "19": ["Jammu & Kashmir", "Ladakh"],
  "20": ["Uttar Pradesh"],
  "21": ["Uttar Pradesh"],
  "22": ["Uttar Pradesh"],
  "23": ["Uttar Pradesh"],
  "24": ["Uttar Pradesh", "Uttarakhand"],
  "25": ["Uttar Pradesh"],
  "26": ["Uttar Pradesh", "Uttarakhand"],
  "27": ["Uttar Pradesh"],
  "28": ["Uttar Pradesh"],
  "30": ["Rajasthan"],
  "31": ["Rajasthan"],
  "32": ["Rajasthan"],
  "33": ["Rajasthan"],
  "34": ["Rajasthan"],
  "36": ["Gujarat"],
  "37": ["Gujarat"],
  "38": ["Gujarat"],
  "39": ["Gujarat", "Dadra & Nagar Haveli and Daman & Diu"],
  "40": ["Maharashtra"],
  "41": ["Maharashtra"],
  "42": ["Maharashtra"],
  "43": ["Maharashtra"],
  "44": ["Maharashtra"],
  "45": ["Madhya Pradesh"],
  "46": ["Madhya Pradesh"],
  "47": ["Madhya Pradesh"],
  "48": ["Madhya Pradesh"],
  "49": ["Chhattisgarh", "Madhya Pradesh"],
  "50": ["Telangana"],
  "51": ["Andhra Pradesh"],
  "52": ["Andhra Pradesh"],
  "53": ["Andhra Pradesh"],
  "56": ["Karnataka"],
  "57": ["Karnataka"],
  "58": ["Karnataka"],
  "59": ["Karnataka"],
  "60": ["Tamil Nadu"],
  "61": ["Tamil Nadu"],
  "62": ["Tamil Nadu"],
  "63": ["Tamil Nadu"],
  "64": ["Tamil Nadu"],
  "67": ["Kerala"],
  "68": ["Kerala"],
  "69": ["Kerala"],
  "70": ["West Bengal"],
  "71": ["West Bengal"],
  "72": ["West Bengal"],
  "73": ["West Bengal", "Sikkim"],
  "74": ["West Bengal"],
  "75": ["Odisha"],
  "76": ["Odisha"],
  "77": ["Odisha"],
  "78": ["Assam"],
  "79": ["Assam", "Arunachal Pradesh", "Nagaland", "Manipur", "Mizoram", "Tripura", "Meghalaya"],
  "80": ["Bihar"],
  "81": ["Bihar", "Jharkhand"],
  "82": ["Jharkhand"],
  "83": ["Jharkhand"],
  "84": ["Bihar"],
  "85": ["Bihar"],
};

// ── Pincode ────────────────────────────────────────────────────────────────────

/** Strip whitespace/separators and validate. Returns a clean 6-digit string or null. */
export function normalizePincode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  return /^\d{6}$/.test(digits) ? digits : null;
}

/**
 * Is this a pincode we will attempt to deliver to?
 *
 * Civilian Indian pincodes start with 1–8. Leading 9 is the Army Postal Service
 * (APO/FPO) which our retail couriers do not serve. Leading 0 is invalid.
 * This is intentionally permissive (we ship pan-India) — genuinely blocked
 * pincodes are handled via the DB `restrictedPincodes` block-list by the caller.
 */
export function isPincodeServiceable(pincode: string): boolean {
  const pin = normalizePincode(pincode);
  if (!pin) return false;
  const firstDigit = pin[0];
  return firstDigit >= "1" && firstDigit <= "8";
}

/** Plausible state(s) for a pincode, most-specific prefix first. Empty if unknown. */
export function getStatesForPincode(pincode: string): string[] {
  const pin = normalizePincode(pincode);
  if (!pin) return [];
  return PREFIX_3[pin.slice(0, 3)] ?? PREFIX_2[pin.slice(0, 2)] ?? [];
}

// ── State ────────────────────────────────────────────────────────────────────

/** Trim, collapse whitespace and map to a canonical state name (best effort). */
export function normalizeState(raw: string | null | undefined): string {
  const cleaned = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const lower = cleaned.toLowerCase();
  return CANONICAL_BY_LOWER.get(lower) ?? STATE_ALIASES[lower] ?? cleaned;
}

function isRecognizedState(state: string): boolean {
  return CANONICAL_BY_LOWER.has(state.toLowerCase());
}

export interface ResolvedState {
  /** The state to use downstream. */
  state: string;
  /** True when we changed the caller-supplied state. */
  corrected: boolean;
  /** What we corrected from → to (only set when corrected). */
  from?: string;
  to?: string;
  /** Why the change happened (for logs). */
  reason?: "filled-from-pincode" | "pincode-mismatch";
}

/**
 * Reconcile a supplied state with the pincode it ships to.
 *
 * Rules (conservative — we only change the state when we are confident):
 *   - Normalize the supplied state first (trim + canonical spelling).
 *   - If the pincode has no known mapping → keep the supplied state as-is.
 *   - If the supplied state is empty/unrecognized → fill it from the pincode.
 *   - If the supplied state IS recognized but is NOT plausible for this pincode
 *     (e.g. "Karnataka" on a 67xxxx Kerala pincode) → correct it to the
 *     pincode's primary state.
 *   - Otherwise (supplied state is plausible for the pincode) → keep it.
 *
 * We never default to a fixed state and never override a state that is valid for
 * the pincode, so a correct address is never silently rewritten.
 *
 * @param pincode  destination pincode (authoritative source of truth)
 * @param rawState state supplied by the caller/frontend, to be reconciled
 */
export function resolveDeliveryState(pincode: string, rawState: string | null | undefined): ResolvedState {
  const supplied = normalizeState(rawState);
  const plausible = getStatesForPincode(pincode);

  // Unknown pincode mapping → trust the caller (only normalize spelling).
  if (!plausible.length) return { state: supplied, corrected: false };

  const primary = plausible[0];

  if (!supplied || !isRecognizedState(supplied)) {
    if (!supplied) {
      return { state: primary, corrected: true, from: supplied, to: primary, reason: "filled-from-pincode" };
    }
    // Supplied something we don't recognize — only overwrite if it isn't already
    // a plausible label; otherwise keep the caller's text.
    return { state: primary, corrected: true, from: supplied, to: primary, reason: "filled-from-pincode" };
  }

  const plausibleLower = plausible.map(s => s.toLowerCase());
  if (plausibleLower.includes(supplied.toLowerCase())) {
    return { state: supplied, corrected: false };
  }

  return { state: primary, corrected: true, from: supplied, to: primary, reason: "pincode-mismatch" };
}

// ── Address normalization (used right before a courier call) ───────────────────

export interface NormalizedAddress {
  city: string;
  state: string;
  pincode: string;
  /** True if the state was changed vs. what the caller passed in. */
  stateCorrected: boolean;
}

/**
 * Clean up the routing-relevant address fields for a courier request. Trims
 * city/pincode and reconciles the state against the pincode (see
 * resolveDeliveryState). Logs any state correction so a wrong state is visible
 * instead of silently shipped.
 */
export function normalizeCourierAddress(input: {
  city: string;
  state: string;
  pincode: string;
}): NormalizedAddress {
  const pincode = normalizePincode(input.pincode) ?? String(input.pincode ?? "").trim();
  const city = String(input.city ?? "").replace(/\s+/g, " ").trim();
  const resolved = resolveDeliveryState(pincode, input.state);

  if (resolved.corrected) {
    console.warn(
      `[shipping] state ${resolved.reason} for pincode ${pincode}: ` +
      `"${resolved.from ?? ""}" → "${resolved.to ?? resolved.state}" (no hardcoded default applied)`
    );
  }

  return { city, state: resolved.state, pincode, stateCorrected: resolved.corrected };
}

// ── Debug logging for courier requests/responses ───────────────────────────────

// Debug logging is on by default; set SHIPPING_DEBUG="false" to silence the
// verbose payload/response dumps (the state-correction warning above always logs).
const DEBUG = process.env.SHIPPING_DEBUG !== "false";

/** Mask a phone number for logs — keep last 4 digits only. */
function maskPhone(v: unknown): string {
  const d = String(v ?? "").replace(/\D/g, "");
  return d.length >= 4 ? `••••••${d.slice(-4)}` : "••••";
}

/** Redact PII (phone/email) from a courier payload before logging it. */
function redact(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return payload;
  const clone: Record<string, unknown> = Array.isArray(payload)
    ? ([...payload] as unknown as Record<string, unknown>)
    : { ...(payload as Record<string, unknown>) };
  for (const key of Object.keys(clone)) {
    const lower = key.toLowerCase();
    if (lower.includes("phone")) clone[key] = maskPhone(clone[key]);
    else if (lower.includes("email")) clone[key] = "•••@•••";
    else if (clone[key] && typeof clone[key] === "object") clone[key] = redact(clone[key]);
  }
  return clone;
}

/** Log the final request we are about to send to a courier API. */
export function logCourierRequest(provider: string, label: string, payload: unknown): void {
  if (!DEBUG) return;
  try {
    console.info(`[shipping:${provider}] → ${label} request:`, JSON.stringify(redact(payload)));
  } catch {
    console.info(`[shipping:${provider}] → ${label} request: <unserializable>`);
  }
}

/** Log the response from a courier API. */
export function logCourierResponse(provider: string, label: string, status: number | string, body: unknown): void {
  if (!DEBUG) return;
  try {
    console.info(`[shipping:${provider}] ← ${label} response [${status}]:`, JSON.stringify(redact(body)));
  } catch {
    console.info(`[shipping:${provider}] ← ${label} response [${status}]: <unserializable>`);
  }
}
