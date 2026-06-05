/**
 * Delhivery provider implementation.
 * Docs: https://api.delhivery.com/api
 *
 * Auth: Static Bearer token (API key).
 * Staging base: https://staging-express.delhivery.com
 * Production base: https://express.delhivery.com
 */

import type {
  ShippingProvider, ServiceabilityResult, CourierQuote,
  CreateShipmentInput, CreateShipmentResult,
  TrackShipmentResult, GenerateLabelResult, CancelShipmentResult,
} from "./types";

function getBase(): string {
  return process.env.DELHIVERY_API_BASE ?? "https://express.delhivery.com";
}

function getKey(): string {
  const key = process.env.DELHIVERY_API_KEY;
  if (!key || key.startsWith("REPLACE")) throw new Error("Delhivery API key not configured");
  return key;
}

async function dlFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  return fetch(`${getBase()}${path}`, {
    ...opts,
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Token ${getKey()}`,
      ...(opts.headers ?? {}),
    },
  });
}

// ── DelhiveryProvider ─────────────────────────────────────────────────────────

export class DelhiveryProvider implements ShippingProvider {
  readonly name = "DELHIVERY";

  async checkServiceability(
    _fromPincode: string,
    toPincode:    string,
    weightGrams:  number,
    isCOD:        boolean,
    _orderValue:  number,
  ): Promise<ServiceabilityResult> {
    try {
      const params = new URLSearchParams({
        md:     "S",                             // Surface mode
        ss:     "Delivered",
        d_pin:  toPincode,
        o_pin:  _fromPincode,
        cgm:    String(Math.ceil(weightGrams)),  // weight in grams
        pt:     isCOD ? "COD" : "Pre-paid",
        cod:    isCOD ? "Y" : "N",
      });

      const res  = await dlFetch(`/api/kinko/v1/invoice/charges/.json?${params}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        return { serviceable: false, codAvailable: false, estimatedDays: null, quotes: [], reason: data.error ?? "Not serviceable" };
      }

      const rate = Number(data.total_amount ?? 0);
      const edd  = data.estimated_date;
      const days = edd ? Math.max(1, Math.round((new Date(edd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 4;

      const quote: CourierQuote = {
        provider:      "DELHIVERY",
        providerLabel: "Delhivery",
        courierId:     "delhivery",
        courierName:   "Delhivery Express",
        estimatedDays: days,
        estimatedDate: edd ?? "",
        rate,
        codAvailable:  isCOD,
        codCharge:     isCOD ? Number(data.cod_charges ?? 0) : 0,
        isBest:        true,
        isFastest:     false,
        isCheapest:    false,
      };

      return { serviceable: true, codAvailable: isCOD, estimatedDays: days, quotes: [quote] };
    } catch (err) {
      console.error("[delhivery] serviceability error:", err);
      return { serviceable: false, codAvailable: false, estimatedDays: null, quotes: [], reason: "Provider error" };
    }
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    try {
      // Step 1: Create pickup location (idempotent)
      const waybillRes = await dlFetch("/api/p/apiv2/waybill?count=1");
      const waybillData = await waybillRes.json();
      const awb = waybillData.waybill_list?.[0] ?? waybillData.waybill;
      if (!awb) return { success: false, error: "Could not allocate waybill", rawResponse: waybillData };

      // Step 2: Create shipment
      const shipData = {
        format:  "json",
        data: JSON.stringify({
          shipments: [{
            name:             input.customerName,
            add:              input.address,
            pin:              input.pincode,
            city:             input.city,
            state:            input.state,
            country:          "India",
            phone:            input.customerPhone,
            order:            input.orderNumber,
            payment_mode:     input.isCOD ? "COD" : "Pre-paid",
            return_pin:       input.pickupPincode,
            return_city:      "",
            return_phone:     "",
            return_name:      "TRYBY Sports",
            return_add:       "",
            return_time:      "0",
            return_shipment:  0,
            products_desc:    input.items.map(i => i.name).join(", "),
            hsn_code:         "",
            cod_amount:       String(input.isCOD ? (input.codAmount ?? input.orderValue) : 0),
            order_date:       new Date().toISOString().slice(0, 10),
            total_amount:     String(input.orderValue),
            seller_add:       "",
            seller_name:      "TRYBY Sports",
            seller_inv:       input.orderNumber,
            quantity:         String(input.items.reduce((s, i) => s + i.quantity, 0)),
            shipment_width:   String(input.widthCm),
            shipment_height:  String(input.heightCm),
            weight:           String(Math.ceil(input.weightGrams / 1000 * 10) / 10),
            seller_gst_tin:   "",
            shipping_mode:    "Surface",
            address_type:     "home",
            waybill:          awb,
          }],
        }),
      };

      const form = new URLSearchParams(shipData);
      const res  = await fetch(`${getBase()}/api/cmu/create.json`, {
        method:  "POST",
        headers: { "Authorization": `Token ${getKey()}`, "Content-Type": "application/x-www-form-urlencoded" },
        body:    form,
      });
      const data = await res.json();

      const packages = data.packages ?? [];
      if (!packages.length || packages[0].status !== "Success") {
        return { success: false, error: packages[0]?.remarks ?? "Delhivery shipment creation failed", rawResponse: data };
      }

      return {
        success:          true,
        awbCode:          awb,
        courierShipmentId: awb,
        courierOrderId:   input.orderNumber,
        trackingUrl:      `https://www.delhivery.com/track-v2/package?wbno=${awb}`,
        rawResponse:      data,
      };
    } catch (err) {
      console.error("[delhivery] createShipment error:", err);
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  async trackShipment(awbCode: string): Promise<TrackShipmentResult> {
    try {
      const res  = await dlFetch(`/api/v1/packages/json/?waybill=${awbCode}&ref_ids=1`);
      const data = await res.json();

      const pkg    = data.ShipmentData?.[0]?.Shipment;
      if (!pkg) return { success: false, events: [], error: "Shipment not found" };

      const events = (pkg.Scans ?? []).map((s: Record<string, any>) => ({
        status:      s.ScanDetail?.Instructions ?? s.ScanType ?? "",
        location:    s.ScanDetail?.ScannedLocation ?? "",
        description: s.ScanDetail?.Instructions ?? "",
        eventAt:     s.ScanDetail?.ScanDateTime ?? new Date().toISOString(),
      }));

      return { success: true, currentStatus: pkg.Status?.Status ?? "", events };
    } catch (err) {
      return { success: false, events: [], error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  async generateLabel(awbCode: string): Promise<GenerateLabelResult> {
    // Delhivery provides label PDF via tracking URL — no dedicated label endpoint
    const url = `https://www.delhivery.com/api/p/packing-slip/?wbns=${awbCode}&pdf=true`;
    return { success: true, url };
  }

  async generateBulkLabel(awbCodes: string[]): Promise<GenerateLabelResult> {
    const url = `https://www.delhivery.com/api/p/packing-slip/?wbns=${awbCodes.join(",")}&pdf=true`;
    return { success: true, url };
  }

  async cancelShipment(awbCode: string): Promise<CancelShipmentResult> {
    try {
      const res = await dlFetch(`/api/p/edit?cancel=true&waybill=${awbCode}&cancellation=true`);
      return { success: res.ok };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }
}
