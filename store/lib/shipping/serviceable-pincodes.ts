/**
 * TEMPORARY / MOCK serviceable-pincode list.
 *
 * Purpose: let checkout + serviceability be tested end-to-end WITHOUT a live
 * Shiprocket/Delhivery dependency. When mock mode is enabled (see
 * isMockServiceabilityEnabled) the serviceability layer answers purely from this
 * hard-coded list — only these pincodes are deliverable, with the courier names
 * and ETA shown below, and NO courier API is ever called.
 *
 * This is a throwaway test harness, NOT production data:
 *   - It does not touch payments / Razorpay.
 *   - It does not replace the real shipping logic — that path is untouched and
 *     runs whenever mock mode is off (the default).
 *   - Remove this file + the SHIPPING_MOCK_MODE flag once real courier
 *     credentials are wired up.
 *
 * Kept dependency-free (pure data + helpers) so it is safe to import from both
 * server routes and client components.
 */

export interface ServiceableArea {
  pincode:   string;
  city:      string;
  state:     string;
  /** Human-readable courier names available for this area (test data). */
  couriers:  string[];
  etaMinDays: number;
  etaMaxDays: number;
  /** Pre-formatted ETA label for display, e.g. "3–5 days". */
  etaLabel:  string;
}

export const SERVICEABLE_AREAS: ServiceableArea[] = [
  {
    pincode: "689121", city: "Chengannur", state: "Kerala",
    couriers: ["Shiprocket", "Delhivery"], etaMinDays: 3, etaMaxDays: 5, etaLabel: "3–5 days",
  },
  {
    pincode: "682001", city: "Ernakulam", state: "Kerala",
    couriers: ["Shiprocket"], etaMinDays: 2, etaMaxDays: 4, etaLabel: "2–4 days",
  },
  {
    pincode: "695001", city: "Trivandrum", state: "Kerala",
    couriers: ["Delhivery"], etaMinDays: 3, etaMaxDays: 6, etaLabel: "3–6 days",
  },
];

/** Look up a serviceable area by pincode (digits-only, tolerant of spaces). */
export function findServiceableArea(pincode: string | null | undefined): ServiceableArea | null {
  const pin = String(pincode ?? "").replace(/\D/g, "");
  return SERVICEABLE_AREAS.find(a => a.pincode === pin) ?? null;
}

/**
 * Is the mock serviceability harness active?
 *
 * Controlled by NEXT_PUBLIC_SHIPPING_MOCK_MODE so the SAME flag is readable on
 * the server (gating the serviceability layer) and in the browser (gating the
 * test-only UI). SHIPPING_MOCK_MODE is also accepted for server-only setups.
 * Defaults to OFF — real shipping logic is unchanged unless you opt in.
 */
export function isMockServiceabilityEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_SHIPPING_MOCK_MODE === "true" ||
    process.env.SHIPPING_MOCK_MODE === "true"
  );
}
