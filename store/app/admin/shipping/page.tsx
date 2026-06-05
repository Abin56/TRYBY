"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, X, ChevronLeft, ChevronRight, Truck, Package,
  CheckCircle2, XCircle, Clock, RotateCcw, AlertTriangle,
  MapPin, Copy, Check, ExternalLink, Send, ChevronDown, Zap, Loader2,
} from "lucide-react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

type ShipmentStatus =
  | "PENDING" | "PACKED" | "PICKED_UP" | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED_DELIVERY" | "RETURNED" | "LOST";

type CourierProvider =
  | "SHIPROCKET" | "DELHIVERY" | "DTDC" | "INDIA_POST"
  | "BLUEDART" | "XPRESSBEES" | "ECOM_EXPRESS" | "OTHER";

interface ShipmentRow {
  id: string;
  status: ShipmentStatus;
  courier: CourierProvider | null;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  awbCode: string | null;
  dispatchedAt: string | null;
  estimatedAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  deliveryAttempts: number;
  internalNote: string | null;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    user: { id: string; name: string | null; email: string | null };
    items: { productName: string; quantity: number }[];
    shippingAddress: { fullName: string; city: string; state: string; pincode: string };
    payment: { method: string; status: string } | null;
  };
}

interface PendingOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  user: { name: string | null; email: string | null };
  items: { productName: string; quantity: number }[];
  shippingAddress: { fullName: string; city: string; state: string; pincode: string };
  shipment: null | { dispatchedAt: string | null };
}

interface ApiData {
  shipments: ShipmentRow[];
  total: number;
  pages: number;
  counts: Partial<Record<ShipmentStatus, number>>;
  pendingFulfillment: number;
}

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ShipmentStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING:          { label: "Pending",          color: "#F5C518", bg: "rgba(245,197,24,0.12)",   icon: Clock        },
  PACKED:           { label: "Packed",            color: "#60A5FA", bg: "rgba(96,165,250,0.12)",   icon: Package      },
  PICKED_UP:        { label: "Picked Up",         color: "#60A5FA", bg: "rgba(96,165,250,0.12)",   icon: Truck        },
  IN_TRANSIT:       { label: "In Transit",        color: "#A78BFA", bg: "rgba(167,139,250,0.12)",  icon: Truck        },
  OUT_FOR_DELIVERY: { label: "Out for Delivery",  color: "#FB923C", bg: "rgba(251,146,60,0.12)",   icon: Truck        },
  DELIVERED:        { label: "Delivered",         color: "#4ADE80", bg: "rgba(74,222,128,0.12)",   icon: CheckCircle2 },
  FAILED_DELIVERY:  { label: "Failed Delivery",   color: "#F87171", bg: "rgba(248,113,113,0.12)",  icon: XCircle      },
  RETURNED:         { label: "Returned",          color: "#F87171", bg: "rgba(248,113,113,0.12)",  icon: RotateCcw    },
  LOST:             { label: "Lost",              color: "#F87171", bg: "rgba(248,113,113,0.12)",  icon: AlertTriangle},
};

const COURIER_LABELS: Partial<Record<CourierProvider, string>> = {
  SHIPROCKET: "Shiprocket", DELHIVERY: "Delhivery", DTDC: "DTDC",
  INDIA_POST: "India Post", BLUEDART: "BlueDart", XPRESSBEES: "Xpressbees",
  ECOM_EXPRESS: "Ecom Express", OTHER: "Other",
};

const COURIER_OPTIONS: { value: CourierProvider; label: string }[] = [
  { value: "SHIPROCKET",  label: "Shiprocket"   },
  { value: "DELHIVERY",   label: "Delhivery"    },
  { value: "DTDC",        label: "DTDC"          },
  { value: "INDIA_POST",  label: "India Post"   },
  { value: "BLUEDART",    label: "BlueDart"      },
  { value: "XPRESSBEES",  label: "Xpressbees"   },
  { value: "ECOM_EXPRESS",label: "Ecom Express" },
  { value: "OTHER",       label: "Other"         },
];

const FILTER_TABS: { value: ShipmentStatus | "ALL"; label: string }[] = [
  { value: "ALL",              label: "All"            },
  { value: "PENDING",          label: "Pending"        },
  { value: "PACKED",           label: "Packed"         },
  { value: "IN_TRANSIT",       label: "In Transit"     },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery"},
  { value: "DELIVERED",        label: "Delivered"      },
  { value: "FAILED_DELIVERY",  label: "Failed"         },
  { value: "RETURNED",         label: "Returned"       },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: ShipmentStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}>
      <Icon className="h-2.5 w-2.5" />{cfg.label}
    </span>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="ml-1 text-white/25 hover:text-white/60 transition-colors shrink-0">
      {copied ? <Check className="h-3 w-3 text-[#4ADE80]" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

// ── Ship Modal ────────────────────────────────────────────────────────────────

function ShipModal({
  orderId,
  orderNumber,
  existingShipment,
  onClose,
  onSuccess,
}: {
  orderId: string;
  orderNumber: string;
  existingShipment?: Partial<ShipmentRow>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [courier, setCourier]           = useState<CourierProvider | "">(existingShipment?.courier ?? "");
  const [carrierName, setCarrierName]   = useState(existingShipment?.carrierName ?? "");
  const [trackingNumber, setTracking]   = useState(existingShipment?.trackingNumber ?? "");
  const [awbCode, setAwb]               = useState(existingShipment?.awbCode ?? "");
  const [trackingUrl, setTrackingUrl]   = useState(existingShipment?.trackingUrl ?? "");
  const [estimatedAt, setEstimatedAt]   = useState("");
  const [status, setStatus]             = useState<ShipmentStatus>("PICKED_UP");
  const [note, setNote]                 = useState(existingShipment?.internalNote ?? "");
  const [busy, setBusy]                 = useState(false);
  const [err, setErr]                   = useState("");

  async function submit() {
    if (!courier && !carrierName) { setErr("Select a courier or enter carrier name"); return; }
    setErr(""); setBusy(true);
    try {
      const res = await fetch("/api/admin/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId, courier: courier || undefined, carrierName: carrierName || undefined,
          trackingNumber: trackingNumber || undefined,
          awbCode: awbCode || undefined,
          trackingUrl: trackingUrl || undefined,
          estimatedAt: estimatedAt || undefined,
          internalNote: note || undefined,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Failed"); setBusy(false); return; }
      onSuccess();
    } catch { setErr("Network error"); setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-[500px] rounded-2xl overflow-hidden"
        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div>
            <p className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
              {existingShipment ? "Update Shipment" : "Mark as Shipped"}
            </p>
            <p className="text-white/40 text-[12px] font-mono mt-0.5">{orderNumber}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Shipment status */}
          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Shipment Status</label>
            <div className="relative">
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ShipmentStatus)}
                className="w-full rounded-xl px-4 pr-10 text-[13px] font-semibold text-white outline-none appearance-none"
                style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {(["PACKED","PICKED_UP","IN_TRANSIT","OUT_FOR_DELIVERY","DELIVERED","FAILED_DELIVERY","RETURNED"] as ShipmentStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
            </div>
          </div>

          {/* Courier */}
          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Courier</label>
            <div className="relative">
              <select
                value={courier}
                onChange={e => setCourier(e.target.value as CourierProvider | "")}
                className="w-full rounded-xl px-4 pr-10 text-[13px] font-semibold text-white outline-none appearance-none"
                style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <option value="">Select courier...</option>
                {COURIER_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
            </div>
          </div>

          {courier === "OTHER" && (
            <div>
              <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Carrier Name</label>
              <input value={carrierName} onChange={e => setCarrierName(e.target.value)}
                placeholder="e.g. Shadowfax, Ekart..."
                className="w-full rounded-xl px-4 text-[13px] text-white placeholder:text-white/20 outline-none"
                style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
          )}

          {/* AWB / Tracking */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">AWB Code</label>
              <input value={awbCode} onChange={e => setAwb(e.target.value)}
                placeholder="Airway Bill No."
                className="w-full rounded-xl px-4 text-[13px] text-white placeholder:text-white/20 outline-none"
                style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Tracking No.</label>
              <input value={trackingNumber} onChange={e => setTracking(e.target.value)}
                placeholder="Tracking number"
                className="w-full rounded-xl px-4 text-[13px] text-white placeholder:text-white/20 outline-none"
                style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Tracking URL</label>
            <input value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)}
              placeholder="https://track.delhivery.com/..."
              className="w-full rounded-xl px-4 text-[13px] text-white placeholder:text-white/20 outline-none"
              style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Expected Delivery Date</label>
            <input type="date" value={estimatedAt} onChange={e => setEstimatedAt(e.target.value)}
              className="w-full rounded-xl px-4 text-[13px] text-white outline-none"
              style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", colorScheme: "dark" }} />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Internal Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              rows={2} placeholder="Optional internal note..."
              className="w-full rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/20 outline-none resize-none"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>

          {err && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-[#F87171]"
              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
              <AlertTriangle className="h-4 w-4 shrink-0" /> {err}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            Cancel
          </button>
          <button onClick={submit} disabled={busy}
            className="flex-1 h-10 rounded-xl text-[13px] font-black text-[#0D0D0D] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#F5C518" }}>
            {busy ? <span className="h-4 w-4 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" />
              : <><Send className="h-3.5 w-3.5" /> Confirm</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shipment Detail Drawer ────────────────────────────────────────────────────

function GenerateAwbButton({
  orderId,
  onSuccess,
}: {
  orderId: string;
  onSuccess: () => void;
}) {
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState("");
  const [done, setDone]   = useState(false);
  const [awb, setAwb]     = useState("");

  async function generate() {
    setBusy(true); setErr("");
    try {
      const res  = await fetch("/api/admin/shipping/book", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Booking failed"); return; }
      setAwb(data.booking?.awbCode ?? data.shipment?.awbCode ?? "");
      setDone(true);
      setTimeout(onSuccess, 1200);
    } catch { setErr("Network error"); }
    finally { setBusy(false); }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-bold text-[#4ADE80]"
        style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        AWB Generated: <span className="font-mono">{awb}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={generate}
        disabled={busy}
        className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-[13px] font-black disabled:opacity-60"
        style={{ background: "rgba(245,197,24,0.15)", border: "1px solid rgba(245,197,24,0.4)", color: "#F5C518" }}>
        {busy
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Booking...</>
          : <><Zap className="h-3.5 w-3.5" /> Generate AWB via Shiprocket</>}
      </button>
      {err && (
        <p className="text-[11px] text-[#F87171] px-1">{err}</p>
      )}
    </div>
  );
}

function ShipmentDrawer({
  shipment,
  onClose,
  onUpdate,
  autoAwbEnabled,
}: {
  shipment: ShipmentRow;
  onClose: () => void;
  onUpdate: () => void;
  autoAwbEnabled: boolean;
}) {
  const [showShipModal, setShowShipModal] = useState(false);
  const cfg = STATUS_CONFIG[shipment.status];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative flex flex-col w-full max-w-[480px] h-full overflow-y-auto"
        style={{ background: "#111111", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
          style={{ background: "#111111", borderColor: "rgba(255,255,255,0.08)" }}>
          <div>
            <p className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
              Shipment Details
            </p>
            <p className="text-white/40 text-[11px] font-mono mt-0.5">{shipment.order.orderNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={shipment.status} />
            <button onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/08 transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer & address */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Deliver To</p>
            <p className="text-[13px] font-bold text-white">{shipment.order.shippingAddress.fullName}</p>
            <div className="flex items-start gap-2 text-[12px] text-white/50">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-white/25" />
              <span>
                {shipment.order.shippingAddress.city}, {shipment.order.shippingAddress.state} – {shipment.order.shippingAddress.pincode}
              </span>
            </div>
            <p className="text-[11px] text-white/30">{shipment.order.user.email}</p>
          </div>

          {/* Items */}
          <div className="rounded-2xl p-5 space-y-2" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Items · {fmt(shipment.order.total)}</p>
            {shipment.order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-[12px]">
                <span className="text-white/60 truncate">{item.productName}</span>
                <span className="text-white/40 ml-2 shrink-0">×{item.quantity}</span>
              </div>
            ))}
          </div>

          {/* Courier & tracking */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Courier & Tracking</p>
            {[
              { label: "Courier",     value: COURIER_LABELS[shipment.courier ?? "OTHER" as CourierProvider] ?? shipment.carrierName },
              { label: "AWB Code",    value: shipment.awbCode,         copy: true },
              { label: "Tracking #",  value: shipment.trackingNumber,  copy: true },
            ].map(({ label, value, copy }) => value ? (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[12px] text-white/40">{label}</span>
                <div className="flex items-center">
                  <span className="text-[12px] font-semibold text-white font-mono">{value}</span>
                  {copy && <CopyBtn text={value} />}
                </div>
              </div>
            ) : null)}
            {shipment.trackingUrl && (
              <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[12px] font-semibold text-[#60A5FA] hover:underline">
                <ExternalLink className="h-3.5 w-3.5" /> Track Live
              </a>
            )}
          </div>

          {/* Timeline dates */}
          <div className="rounded-2xl p-5 space-y-2.5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Timeline</p>
            {[
              { label: "Dispatched",       value: shipment.dispatchedAt },
              { label: "Expected",         value: shipment.estimatedAt  },
              { label: "Delivered",        value: shipment.deliveredAt  },
              { label: "Failed Attempt",   value: shipment.failedAt     },
            ].map(({ label, value }) => value ? (
              <div key={label} className="flex justify-between text-[12px]">
                <span className="text-white/40">{label}</span>
                <span className="font-semibold text-white">{fmtDate(value)}</span>
              </div>
            ) : null)}
          </div>

          {/* Internal note */}
          {shipment.internalNote && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(245,197,24,0.06)", border: "1px solid rgba(245,197,24,0.15)" }}>
              <p className="text-[10px] font-bold text-[#F5C518]/70 mb-1 uppercase tracking-widest">Note</p>
              <p className="text-[12px] text-white/60">{shipment.internalNote}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2.5">
            {/* Auto-AWB: show when flag enabled and no AWB yet */}
            {autoAwbEnabled && !shipment.awbCode && (
              <GenerateAwbButton
                orderId={shipment.order.id}
                onSuccess={() => { onUpdate(); onClose(); }}
              />
            )}
            <button
              onClick={() => setShowShipModal(true)}
              className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-[13px] font-black text-[#0D0D0D]"
              style={{ background: "#F5C518" }}>
              <Truck className="h-3.5 w-3.5" /> Update Shipment Status
            </button>
            {shipment.awbCode && (
              <a
                href={`/api/admin/shipping/label?awb=${shipment.awbCode}&provider=${shipment.courier ?? "SHIPROCKET"}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
                <Package className="h-3.5 w-3.5" /> Print Shipping Label
              </a>
            )}
            <a href={`/admin/orders/${shipment.order.id}`}
              className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
              <ExternalLink className="h-3.5 w-3.5" /> View Full Order
            </a>
          </div>
        </div>
      </div>

      {showShipModal && (
        <ShipModal
          orderId={shipment.order.id}
          orderNumber={shipment.order.orderNumber}
          existingShipment={shipment}
          onClose={() => setShowShipModal(false)}
          onSuccess={() => { setShowShipModal(false); onUpdate(); onClose(); }}
        />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminShippingPage() {
  const [data, setData]           = useState<ApiData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [statusFilter, setStatus] = useState<ShipmentStatus | "ALL">("ALL");
  const [page, setPage]           = useState(1);
  const [drawer, setDrawer]       = useState<ShipmentRow | null>(null);
  const [shipTarget, setShipTarget] = useState<PendingOrder | null>(null);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [autoAwbEnabled, setAutoAwbEnabled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (debouncedQ) params.set("q", debouncedQ);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    try {
      const res = await fetch(`/api/admin/shipping?${params}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [page, debouncedQ, statusFilter]);

  useEffect(() => { load(); }, [load]);

  // Load pending (unshipped) orders for quick-ship
  useEffect(() => {
    fetch("/api/admin/orders?status=CONFIRMED&limit=50")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.orders) setPendingOrders(d.orders); })
      .catch(() => {});
  }, []);

  // Check Shiprocket auto-AWB feature flag
  useEffect(() => {
    fetch("/api/admin/feature-flags")
      .then(r => r.ok ? r.json() : null)
      .then((flags: { key: string; enabled: boolean }[] | null) => {
        const flag = flags?.find(f => f.key === "shiprocket_auto_awb");
        if (flag?.enabled) setAutoAwbEnabled(true);
      })
      .catch(() => {});
  }, []);

  const summaryCards = [
    { label: "Pending",     value: data?.pendingFulfillment ?? 0, color: "#F5C518", bg: "rgba(245,197,24,0.08)",   border: "rgba(245,197,24,0.2)"   },
    { label: "In Transit",  value: (data?.counts?.IN_TRANSIT ?? 0) + (data?.counts?.PICKED_UP ?? 0), color: "#A78BFA", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" },
    { label: "Delivered",   value: data?.counts?.DELIVERED ?? 0, color: "#4ADE80",  bg: "rgba(74,222,128,0.08)",   border: "rgba(74,222,128,0.2)"   },
    { label: "Failed",      value: (data?.counts?.FAILED_DELIVERY ?? 0) + (data?.counts?.RETURNED ?? 0), color: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1300px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
            Shipping
          </h1>
          <p className="text-white/40 text-[13px]">Fulfillment · Tracking · Delivery management</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/admin/shipping/analytics"
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold text-white/50 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            Analytics →
          </a>
          <a href="/admin/shipping/profitability"
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold text-white/50 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            Profitability →
          </a>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {summaryCards.map(({ label, value, color, bg, border }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
            <p className="text-[11px] font-semibold text-white/50 mb-1.5">{label}</p>
            <p className="font-black text-white text-[28px] leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Pending fulfilment quick-ship banner */}
      {(data?.pendingFulfillment ?? 0) > 0 && (
        <div className="rounded-2xl px-5 py-4 mb-5 flex items-center gap-4"
          style={{ background: "rgba(245,197,24,0.07)", border: "1px solid rgba(245,197,24,0.2)" }}>
          <AlertTriangle className="h-5 w-5 text-[#F5C518] shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-bold text-white">
              {data!.pendingFulfillment} order{data!.pendingFulfillment !== 1 ? "s" : ""} awaiting fulfilment
            </p>
            <p className="text-[11px] text-white/40">These orders are confirmed but have no dispatched shipment yet.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_TABS.map(({ value, label }) => (
          <button key={value}
            onClick={() => { setStatus(value); setPage(1); }}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold whitespace-nowrap transition-all shrink-0"
            style={{
              background: statusFilter === value ? "#F5C518" : "rgba(255,255,255,0.05)",
              color:      statusFilter === value ? "#0D0D0D"  : "rgba(255,255,255,0.45)",
              fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em",
            }}>
            {label}
            {value !== "ALL" && (data?.counts?.[value as ShipmentStatus] ?? 0) > 0 && (
              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none"
                style={{
                  background: statusFilter === value ? "rgba(13,13,13,0.2)" : "rgba(255,255,255,0.08)",
                  color:      statusFilter === value ? "#0D0D0D" : "rgba(255,255,255,0.5)",
                }}>
                {data!.counts[value as ShipmentStatus]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by order number, AWB, tracking, customer name..."
          className="w-full rounded-xl pl-10 pr-4 text-[13px] text-white placeholder:text-white/25 outline-none"
          style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }} />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="hidden lg:grid px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white/30 border-b"
          style={{ gridTemplateColumns: "1fr 140px 140px 120px 110px 120px", borderColor: "rgba(255,255,255,0.05)" }}>
          <span>Order / Customer</span>
          <span>Courier / AWB</span>
          <span>Destination</span>
          <span className="text-right">Amount</span>
          <span>Status</span>
          <span>Dispatched</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-7 w-7 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin" />
          </div>
        ) : !data?.shipments.length ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Truck className="h-10 w-10 text-white/10" />
            <p className="text-center py-2 text-white/30 text-[13px]">No shipments found</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {data.shipments.map(s => (
              <button key={s.id} onClick={() => setDrawer(s)}
                className="hidden lg:grid w-full items-center px-5 py-3.5 text-left transition-colors gap-3 hover:bg-white/[0.02]"
                style={{ gridTemplateColumns: "1fr 140px 140px 120px 110px 120px" }}>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-white/80 truncate">{s.order.orderNumber}</p>
                  <p className="text-[11px] text-white/35 truncate">{s.order.user.name ?? s.order.user.email}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-white/70">
                    {COURIER_LABELS[s.courier ?? "OTHER" as CourierProvider] ?? s.carrierName ?? "—"}
                  </p>
                  {(s.awbCode ?? s.trackingNumber) && (
                    <p className="text-[10px] font-mono text-white/30 truncate">{s.awbCode ?? s.trackingNumber}</p>
                  )}
                </div>
                <p className="text-[11px] text-white/50 truncate">
                  {s.order.shippingAddress.city}, {s.order.shippingAddress.state}
                </p>
                <p className="text-[13px] font-black text-white text-right"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {fmt(s.order.total)}
                </p>
                <div><StatusBadge status={s.status} /></div>
                <p className="text-[11px] text-white/35">
                  {s.dispatchedAt ? fmtDateShort(s.dispatchedAt) : "—"}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-[12px] text-white/35">
            Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                page === 1 ? "text-white/20 cursor-default" : "text-white/50 hover:text-white hover:bg-white/08")}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[12px] font-semibold text-white/50">{page} / {data.pages}</span>
            <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
              className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                page === data.pages ? "text-white/20 cursor-default" : "text-white/50 hover:text-white hover:bg-white/08")}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {drawer && (
        <ShipmentDrawer
          shipment={drawer}
          onClose={() => setDrawer(null)}
          onUpdate={load}
          autoAwbEnabled={autoAwbEnabled}
        />
      )}

      {shipTarget && (
        <ShipModal
          orderId={shipTarget.id}
          orderNumber={shipTarget.orderNumber}
          onClose={() => setShipTarget(null)}
          onSuccess={() => { setShipTarget(null); load(); }}
        />
      )}
    </div>
  );
}
