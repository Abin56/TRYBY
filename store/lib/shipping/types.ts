// ── Shared types for the shipping provider abstraction layer ──────────────────

export interface CourierQuote {
  provider:         string;         // "SHIPROCKET" | "DELHIVERY" | etc.
  providerLabel:    string;         // Human-readable name
  courierId:        string | number; // Provider's internal courier ID
  courierName:      string;         // Provider's courier name (Delhivery Express, etc.)
  estimatedDays:    number;
  estimatedDate:    string;          // ISO date
  rate:             number;          // ₹ inclusive
  codAvailable:     boolean;
  codCharge:        number;
  isBest:           boolean;
  isFastest:        boolean;
  isCheapest:       boolean;
}

export interface ServiceabilityResult {
  serviceable:   boolean;
  codAvailable:  boolean;
  estimatedDays: number | null;
  quotes:        CourierQuote[];
  reason?:       string;           // if not serviceable
  // ── Deterministic-layer status fields (additive; existing consumers read
  //    `serviceable`/`reason`, these mirror them for spec-style { success, message }) ──
  success?:      boolean;          // mirrors `serviceable`
  message?:      string;           // human-readable status (mirrors `reason` when set)
  fallback?:     boolean;          // true when serviceable via the no-live-quotes fallback
}

export interface CreateShipmentInput {
  orderId:        string;
  orderNumber:    string;
  // Pickup
  pickupPincode:  string;
  // Delivery
  customerName:   string;
  customerPhone:  string;
  customerEmail?: string;
  address:        string;
  city:           string;
  state:          string;
  pincode:        string;
  // Parcel
  weightGrams:    number;
  lengthCm:       number;
  widthCm:        number;
  heightCm:       number;
  // Order value & payment
  orderValue:     number;
  isCOD:          boolean;
  codAmount?:     number;
  // Items (for manifest)
  items: {
    name:     string;
    sku?:     string;
    quantity: number;
    price:    number;
  }[];
  // Provider-specific courier selection
  courierId?: string | number;
}

export interface CreateShipmentResult {
  success:            boolean;
  awbCode?:           string;
  courierShipmentId?: string;
  courierOrderId?:    string;
  trackingUrl?:       string;
  labelUrl?:          string;
  estimatedDays?:     number;
  estimatedDate?:     string;
  courierName?:       string;   // Name of the assigned courier (e.g. "Delhivery Surface")
  rawResponse?:       unknown;
  error?:             string;
}

export interface TrackingEvent {
  status:      string;
  location:    string | null;
  description: string | null;
  eventAt:     string;           // ISO datetime
}

export interface TrackShipmentResult {
  success:      boolean;
  currentStatus?: string;
  events:       TrackingEvent[];
  error?:       string;
}

export interface GenerateLabelResult {
  success:  boolean;
  url?:     string;           // PDF label URL
  base64?:  string;           // base64 PDF (fallback)
  error?:   string;
}

export interface CancelShipmentResult {
  success: boolean;
  error?:  string;
}

// ── Provider interface ────────────────────────────────────────────────────────

export interface ShippingProvider {
  readonly name: string;  // "SHIPROCKET" | "DELHIVERY" | etc.

  checkServiceability(
    fromPincode: string,
    toPincode:   string,
    weightGrams: number,
    isCOD:       boolean,
    orderValue:  number,
  ): Promise<ServiceabilityResult>;

  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;

  trackShipment(awbCode: string): Promise<TrackShipmentResult>;

  generateLabel(awbCode: string): Promise<GenerateLabelResult>;

  generateBulkLabel(awbCodes: string[]): Promise<GenerateLabelResult>;

  cancelShipment(awbCode: string): Promise<CancelShipmentResult>;
}
