"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Truck, RefreshCw, ChevronLeft, ChevronRight, X, CheckCircle2,
  Package, ExternalLink, Search, Edit2, Save,
} from "lucide-react";

type ShipmentOrder = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  user: { name: string | null; email: string | null };
  shippingAddress: {
    fullName: string; line1: string; city: string; state: string;
    pincode: string; phone: string;
  } | null;
  items: { productName: string; quantity: number; variantSku: string; size: string | null; color: string | null }[];
};

type Shipment = {
  id: string;
  orderId: string;
  status: string;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  awbCode: string | null;
  estimatedAt: string | null;
  packedAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  order: ShipmentOrder;
  events: { id: string; status: string; location: string | null; description: string | null; eventAt: string }[];
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:          "#9CA3AF",
  PACKED:           "#F5C518",
  PICKED_UP:        "#60A5FA",
  IN_TRANSIT:       "#60A5FA",
  OUT_FOR_DELIVERY: "#4ADE80",
  DELIVERED:        "#4ADE80",
  FAILED_DELIVERY:  "#F87171",
  RETURNED:         "#F87171",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:          "Awaiting Pickup",
  PACKED:           "Packed",
  PICKED_UP:        "Picked Up",
  IN_TRANSIT:       "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED:        "Delivered",
  FAILED_DELIVERY:  "Failed Delivery",
  RETURNED:         "Returned",
};

const COURIER_OPTIONS = [
  "SHIPROCKET", "DELHIVERY", "DTDC", "INDIA_POST",
  "BLUEDART", "XPRESSBEES", "ECOM_EXPRESS", "OTHER",
];

export default function SupplierShippingPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [status, setStatus]       = useState("");
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({
    trackingNumber: "", awbCode: "", carrierName: "",
    courier: "", trackingUrl: "", estimatedAt: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    const res  = await fetch(`/api/supplier/shipping?${params}`);
    const data = await res.json();
    setShipments(data.shipments ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (s: Shipment) => {
    setForm({
      trackingNumber: s.trackingNumber ?? "",
      awbCode:        s.awbCode ?? "",
      carrierName:    s.carrierName ?? "",
      courier:        "",
      trackingUrl:    s.trackingUrl ?? "",
      estimatedAt:    s.estimatedAt ? s.estimatedAt.slice(0, 10) : "",
    });
    setEditing(s.orderId);
  };

  const save = async (orderId: string, markShipped = false) => {
    setSaving(true);
    await fetch("/api/supplier/shipping", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        orderId,
        ...form,
        estimatedAt: form.estimatedAt || undefined,
        ...(markShipped ? { action: "mark_shipped" } : {}),
      }),
    });
    setSaving(false);
    setEditing(null);
    load();
  };

  const filtered = search
    ? shipments.filter(s =>
        s.order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        (s.trackingNumber ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : shipments;

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-white font-black"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}
          >
            Shipment Management
          </h1>
          <p className="text-white/40 text-[13px] mt-0.5">{total} shipment{total !== 1 ? "s" : ""} total</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-opacity hover:opacity-70"
          style={{ background: "rgba(255,255,255,0.07)", color: "#fff" }}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Search className="h-3.5 w-3.5 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order or tracking…"
            className="bg-transparent text-white text-[13px] outline-none flex-1 placeholder:text-white/25"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl text-[13px] text-white/70 outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="h-5 w-5 animate-spin text-[#F5C518]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-white/25 text-[14px]">No shipments found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div
              key={s.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {/* Top row */}
              <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-white font-bold text-[15px]">#{s.order.orderNumber}</span>
                    <span className="text-white/30 text-[12px] ml-2">{new Date(s.order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                  </div>
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${STATUS_COLOR[s.status] ?? "#9CA3AF"}18`, color: STATUS_COLOR[s.status] ?? "#9CA3AF" }}
                  >
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {s.trackingUrl && (
                    <a href={s.trackingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[12px] text-white/40 hover:text-white transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" /> Track
                    </a>
                  )}
                  <button
                    onClick={() => editing === s.orderId ? setEditing(null) : openEdit(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-opacity hover:opacity-70"
                    style={{ background: "rgba(245,197,24,0.12)", color: "#F5C518" }}
                  >
                    <Edit2 className="h-3 w-3" /> {editing === s.orderId ? "Cancel" : "Update"}
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-5 py-4">
                {/* Items */}
                <div>
                  <p className="text-white/30 text-[11px] font-semibold uppercase tracking-wide mb-2">Items</p>
                  <div className="space-y-1">
                    {s.order.items.slice(0, 3).map((item, i) => (
                      <p key={i} className="text-white/70 text-[13px]">
                        {item.productName} × {item.quantity}
                        {(item.size || item.color) && (
                          <span className="text-white/30"> ({[item.size, item.color].filter(Boolean).join(", ")})</span>
                        )}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Ship to */}
                <div>
                  <p className="text-white/30 text-[11px] font-semibold uppercase tracking-wide mb-2">Ship to</p>
                  {s.order.shippingAddress ? (
                    <div className="text-white/70 text-[13px] space-y-0.5">
                      <p className="text-white font-medium">{s.order.shippingAddress.fullName}</p>
                      <p>{s.order.shippingAddress.line1}</p>
                      <p>{s.order.shippingAddress.city}, {s.order.shippingAddress.state} – {s.order.shippingAddress.pincode}</p>
                      <p className="text-white/40">{s.order.shippingAddress.phone}</p>
                    </div>
                  ) : <p className="text-white/30 text-[13px]">No address</p>}
                </div>

                {/* Tracking */}
                <div>
                  <p className="text-white/30 text-[11px] font-semibold uppercase tracking-wide mb-2">Tracking</p>
                  <div className="text-[13px] space-y-0.5">
                    {s.trackingNumber
                      ? <p className="text-white font-mono">{s.trackingNumber}</p>
                      : <p className="text-white/25 italic">No tracking yet</p>
                    }
                    {s.carrierName && <p className="text-white/50">{s.carrierName}</p>}
                    {s.awbCode && <p className="text-white/50">AWB: {s.awbCode}</p>}
                    {s.estimatedAt && (
                      <p className="text-white/40">ETA: {new Date(s.estimatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit form */}
              {editing === s.orderId && (
                <div
                  className="px-5 py-4 space-y-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(245,197,24,0.03)" }}
                >
                  <p className="text-[#F5C518] text-[12px] font-bold uppercase tracking-wide">Update Shipment Details</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { key: "trackingNumber", label: "Tracking Number",   placeholder: "AWB / Tracking ID" },
                      { key: "awbCode",        label: "AWB Code",          placeholder: "Airway bill" },
                      { key: "carrierName",    label: "Carrier Name",      placeholder: "e.g. Delhivery" },
                      { key: "trackingUrl",    label: "Tracking URL",      placeholder: "https://track.xxx" },
                      { key: "estimatedAt",    label: "Expected Delivery", placeholder: "YYYY-MM-DD", type: "date" },
                    ].map(({ key, label, placeholder, type }) => (
                      <div key={key}>
                        <label className="block text-white/40 text-[11px] mb-1">{label}</label>
                        <input
                          type={type ?? "text"}
                          value={form[key as keyof typeof form]}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full px-3 py-2 rounded-xl text-[13px] text-white outline-none"
                          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-white/40 text-[11px] mb-1">Courier</label>
                      <select
                        value={form.courier}
                        onChange={e => setForm(f => ({ ...f, courier: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl text-[13px] text-white outline-none"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
                      >
                        <option value="">Select courier…</option>
                        {COURIER_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      disabled={saving}
                      onClick={() => save(s.orderId)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold disabled:opacity-40 transition-opacity hover:opacity-70"
                      style={{ background: "rgba(255,255,255,0.10)", color: "#fff" }}
                    >
                      <Save className="h-3.5 w-3.5" /> Save Details
                    </button>
                    <button
                      disabled={saving || !form.trackingNumber}
                      onClick={() => save(s.orderId, true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold disabled:opacity-40 transition-opacity hover:opacity-70"
                      style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Save & Mark Shipped
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-white/30 text-[13px]">{total} total</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-xl disabled:opacity-25 transition-opacity hover:opacity-70"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            <span className="text-white/40 text-[13px]">{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-xl disabled:opacity-25 transition-opacity hover:opacity-70"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
