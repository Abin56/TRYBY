/**
 * Shiprocket provider implementation.
 * Docs: https://apidocs.shiprocket.in
 *
 * Auth:      JWT token (23 h TTL) — auto-refreshed.
 * Credentials resolution order:
 *   1. DB: SiteSettings["shiprocket_credentials"].extraData
 *   2. Env: SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD
 * All amounts in rupees. Weights in grams → kg for the API.
 */

import type {
  ShippingProvider, ServiceabilityResult, CourierQuote,
  CreateShipmentInput, CreateShipmentResult,
  TrackShipmentResult, GenerateLabelResult, CancelShipmentResult,
} from "./types";
import {
  normalizePincode, normalizeCourierAddress,
  logCourierRequest, logCourierResponse,
} from "./serviceability";

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

// ── Auth token cache ──────────────────────────────────────────────────────────

let _token: string | null = null;
let _tokenExpiry           = 0;
let _credsCacheKey         = "";   // invalidate token when creds change

/**
 * Resolve Shiprocket credentials.
 * Priority: DB (shiprocket_credentials) → env vars.
 * Lazy-imports prisma to avoid circular dep issues at module init time.
 */
async function resolveCredentials(): Promise<{ email: string; password: string; pickupLocation: string }> {
  try {
    const { prisma } = await import("@/lib/db");
    const row = await prisma.siteSettings
      .findUnique({ where: { key: "shiprocket_credentials" } })
      .catch(() => null);
    const stored = (row?.extraData ?? {}) as Record<string, unknown>;
    if (stored.email && stored.password) {
      return {
        email:          stored.email          as string,
        password:       stored.password       as string,
        pickupLocation: (stored.pickupLocation as string | undefined) ?? "Primary",
      };
    }
  } catch {
    // DB unavailable — fall through to env
  }

  const email    = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password || email.startsWith("REPLACE")) {
    throw new Error(
      "Shiprocket credentials not configured. " +
      "Set them in Admin → Settings → Shipping → Shiprocket, " +
      "or via SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD env vars."
    );
  }
  return { email, password, pickupLocation: "Primary" };
}

async function getToken(): Promise<string> {
  const creds    = await resolveCredentials();
  const cacheKey = creds.email + ":" + creds.password.slice(0, 4);

  // Invalidate cached token when credentials changed
  if (cacheKey !== _credsCacheKey) {
    _token         = null;
    _tokenExpiry   = 0;
    _credsCacheKey = cacheKey;
  }

  if (_token && Date.now() < _tokenExpiry) return _token;

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email: creds.email, password: creds.password }),
    signal:  AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const msg = await res.json()
      .then((d: Record<string, unknown>) => (d.message as string | undefined) ?? `HTTP ${res.status}`)
      .catch(() => `HTTP ${res.status}`);
    throw new Error(`Shiprocket auth failed: ${msg}`);
  }

  const data   = await res.json();
  _token       = data.token as string;
  _tokenExpiry = Date.now() + 23 * 60 * 60 * 1000; // 23 h
  return _token;
}

/** Call this after updating credentials so the next request re-authenticates. */
export function invalidateShiprocketToken() {
  _token         = null;
  _tokenExpiry   = 0;
  _credsCacheKey = "";
}

async function srFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  return fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
      ...(opts.headers ?? {}),
    },
    signal: opts.signal ?? AbortSignal.timeout(20_000),
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function kgFromGrams(g: number): number { return +(g / 1000).toFixed(3); }

function daysFromEDD(edd: string | undefined): number {
  if (!edd) return 5;
  const diff = new Date(edd).getTime() - Date.now();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

// ── ShiprocketProvider ────────────────────────────────────────────────────────

export class ShiprocketProvider implements ShippingProvider {
  readonly name = "SHIPROCKET";

  async checkServiceability(
    fromPincode: string,
    toPincode:   string,
    weightGrams: number,
    isCOD:       boolean,
    orderValue:  number,
  ): Promise<ServiceabilityResult> {
    try {
      const params = new URLSearchParams({
        pickup_postcode:   normalizePincode(fromPincode) ?? fromPincode,
        delivery_postcode: normalizePincode(toPincode) ?? toPincode,
        weight:            String(kgFromGrams(weightGrams)),
        cod:               isCOD ? "1" : "0",
        declared_value:    String(orderValue),
      });

      logCourierRequest("shiprocket", "serviceability", Object.fromEntries(params));
      const res  = await srFetch(`/courier/serviceability/?${params}`);
      const data = await res.json();
      logCourierResponse("shiprocket", "serviceability", res.status, data);

      if (!res.ok || data.status !== 200) {
        return {
          serviceable:   false,
          codAvailable:  false,
          estimatedDays: null,
          quotes:        [],
          reason:        data.message ?? "Not serviceable",
        };
      }

      const couriers = (data.data?.available_courier_companies ?? []) as Record<string, unknown>[];
      if (!couriers.length) {
        return {
          serviceable: false, codAvailable: false, estimatedDays: null, quotes: [],
          reason: "No courier available for this pincode",
        };
      }

      const quotes: CourierQuote[] = couriers.map((c) => ({
        provider:      "SHIPROCKET",
        providerLabel: "Shiprocket",
        courierId:     c.courier_company_id as string,
        courierName:   c.courier_name as string,
        estimatedDays: daysFromEDD(c.estimated_delivery_date as string),
        estimatedDate: (c.estimated_delivery_date as string) ?? "",
        rate:          Number(c.rate ?? c.freight_charge ?? 0),
        codAvailable:  Boolean(c.cod),
        codCharge:     Number(c.cod_charges ?? 0),
        isBest:        false,
        isFastest:     false,
        isCheapest:    false,
      }));

      const minRate = Math.min(...quotes.map(q => q.rate));
      const minDays = Math.min(...quotes.map(q => q.estimatedDays));

      for (const q of quotes) {
        q.isCheapest = q.rate === minRate;
        q.isFastest  = q.estimatedDays === minDays;
        q.isBest     = q.isCheapest && q.isFastest;
      }
      if (!quotes.some(q => q.isBest)) {
        const best = quotes.find(q => q.isFastest) ?? quotes[0];
        best.isBest = true;
      }

      return {
        serviceable:   true,
        codAvailable:  quotes.some(q => q.codAvailable),
        estimatedDays: minDays,
        quotes,
      };
    } catch (err) {
      console.error("[shiprocket] serviceability error:", err);
      return { serviceable: false, codAvailable: false, estimatedDays: null, quotes: [], reason: "Provider error" };
    }
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    try {
      const creds = await resolveCredentials().catch(() => ({ pickupLocation: "Primary" }));

      // Reconcile state/city/pincode against the destination pincode so we never
      // ship with a wrong/defaulted state (e.g. Karnataka on a Kerala pincode).
      const addr = normalizeCourierAddress({ city: input.city, state: input.state, pincode: input.pincode });

      const body = {
        order_id:              input.orderNumber,
        order_date:            new Date().toISOString().slice(0, 10),
        pickup_location:       (creds as { pickupLocation: string }).pickupLocation,
        billing_customer_name: input.customerName,
        billing_last_name:     "",
        billing_address:       input.address,
        billing_city:          addr.city,
        billing_pincode:       addr.pincode,
        billing_state:         addr.state,
        billing_country:       "India",
        billing_email:         input.customerEmail ?? "",
        billing_phone:         input.customerPhone,
        shipping_is_billing:   1,
        order_items:           input.items.map(i => ({
          name: i.name,
          sku:  i.sku ?? i.name.slice(0, 40),
          units: i.quantity,
          selling_price: i.price,
          discount: 0,
        })),
        payment_method: input.isCOD ? "COD" : "Prepaid",
        sub_total:      input.orderValue,
        length:         input.lengthCm,
        breadth:        input.widthCm,
        height:         input.heightCm,
        weight:         kgFromGrams(input.weightGrams),
        ...(input.courierId ? { courier_id: input.courierId } : {}),
      };

      logCourierRequest("shiprocket", "create-order", body);
      const res  = await srFetch("/orders/create/adhoc", { method: "POST", body: JSON.stringify(body) });
      const data = await res.json();
      logCourierResponse("shiprocket", "create-order", res.status, data);

      if (!res.ok || !data.order_id) {
        return { success: false, error: data.message ?? "Shiprocket order creation failed", rawResponse: data };
      }

      // Auto-assign courier (or use preferred courierId)
      const assignRes  = await srFetch("/courier/assign/awb", {
        method: "POST",
        body:   JSON.stringify({
          shipment_id: data.shipment_id,
          ...(input.courierId ? { courier_id: String(input.courierId) } : {}),
        }),
      });
      const assignData = await assignRes.json();

      const awb         = (assignData.response?.data?.awb_code ?? data.awb_code ?? "") as string;
      const labelUrl    = (assignData.response?.data?.label_url ?? null) as string | null;
      const edd         = (assignData.response?.data?.assigned_date_time ?? null) as string | null;
      const courierName = (assignData.response?.data?.courier_name ?? "") as string;

      if (!awb) {
        return {
          success: false,
          error:   (assignData.response?.data?.awb_assign_error as string | undefined) ?? "AWB assignment failed",
          rawResponse: { order: data, assign: assignData },
        };
      }

      return {
        success:           true,
        awbCode:           awb,
        courierShipmentId: String(data.shipment_id),
        courierOrderId:    String(data.order_id),
        trackingUrl:       `https://shiprocket.co/tracking/${awb}`,
        labelUrl:          labelUrl ?? undefined,
        estimatedDays:     edd ? daysFromEDD(edd) : undefined,
        estimatedDate:     edd ?? undefined,
        courierName:       courierName || undefined,
        rawResponse:       { order: data, assign: assignData },
      };
    } catch (err) {
      console.error("[shiprocket] createShipment error:", err);
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  async trackShipment(awbCode: string): Promise<TrackShipmentResult> {
    try {
      const res  = await srFetch(`/courier/track/awb/${awbCode}`);
      const data = await res.json();

      if (!res.ok) return { success: false, events: [], error: data.message };

      const raw        = data.tracking_data ?? {};
      const activities = (raw.shipment_track_activities ?? []) as Record<string, unknown>[];

      const events = activities.map((a) => ({
        status:      String(a["sr-status-label"] ?? a.activity ?? ""),
        location:    String(a.location ?? ""),
        description: String(a.activity ?? ""),
        eventAt:     String(a.date ?? new Date().toISOString()),
      }));

      return { success: true, currentStatus: String(raw["current-status"] ?? ""), events };
    } catch (err) {
      return { success: false, events: [], error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  async generateLabel(awbCode: string): Promise<GenerateLabelResult> {
    try {
      const res  = await srFetch("/courier/generate/label", {
        method: "POST",
        body:   JSON.stringify({ shipment_id: [awbCode] }),
      });
      const data = await res.json();
      const url  = (data.label_url as string | undefined) ?? `https://shiprocket.co/label/${awbCode}`;
      return { success: !!url, url };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  async generateBulkLabel(awbCodes: string[]): Promise<GenerateLabelResult> {
    try {
      const res  = await srFetch("/courier/generate/label", {
        method: "POST",
        body:   JSON.stringify({ shipment_id: awbCodes }),
      });
      const data = await res.json();
      return { success: !!data.label_url, url: data.label_url };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  async cancelShipment(awbCode: string): Promise<CancelShipmentResult> {
    try {
      const res = await srFetch("/orders/cancel/shipment/awbs", {
        method: "POST",
        body:   JSON.stringify({ awbs: [awbCode] }),
      });
      return { success: res.ok };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  /**
   * Request manifest generation for a list of shipment IDs.
   * Manifests must be generated before handing parcels to the courier.
   */
  async requestManifest(shipmentIds: string[]): Promise<{ success: boolean; manifestUrl?: string; error?: string }> {
    try {
      const res  = await srFetch("/manifests/generate", {
        method: "POST",
        body:   JSON.stringify({ shipment_id: shipmentIds }),
      });
      const data = await res.json();
      return {
        success:     res.ok && !!data.manifest_url,
        manifestUrl: (data.manifest_url as string | undefined) ?? undefined,
        error:       !res.ok ? ((data.message as string | undefined) ?? `HTTP ${res.status}`) : undefined,
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  /**
   * Schedule a pickup request for given shipment IDs.
   */
  async schedulePickup(
    shipmentIds: string[],
    pickupDate?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await srFetch("/courier/generate/pickup", {
        method: "POST",
        body:   JSON.stringify({
          shipment_id: shipmentIds,
          ...(pickupDate ? { pickup_date: pickupDate } : {}),
        }),
      });
      const data = await res.json();
      return {
        success: res.ok,
        error:   !res.ok ? ((data.message as string | undefined) ?? `HTTP ${res.status}`) : undefined,
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }
}
