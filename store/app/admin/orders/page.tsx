"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search, RefreshCw, Download, CheckSquare, Square,
  ChevronLeft, ChevronRight, Package, ExternalLink,
  Truck, XCircle, RotateCcw,
} from "lucide-react";

type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "PACKED" | "SHIPPED" |
  "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | "RETURN_REQUESTED" | "RETURNED" | "REFUNDED";

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  user: { name: string | null; email: string | null };
  items: { productName: string; quantity: number }[];
  payment: { status: string; method: string } | null;
  shipment: { trackingNumber: string | null; carrierName: string | null } | null;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  PENDING:          { label: "Pending",         color: "#F5C518", bg: "rgba(245,197,24,0.12)"   },
  CONFIRMED:        { label: "Confirmed",        color: "#60A5FA", bg: "rgba(96,165,250,0.12)"  },
  PROCESSING:       { label: "Processing",       color: "#FB923C", bg: "rgba(251,146,60,0.12)"  },
  PACKED:           { label: "Packed",           color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
  SHIPPED:          { label: "Shipped",          color: "#38BDF8", bg: "rgba(56,189,248,0.12)"  },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "#34D399", bg: "rgba(52,211,153,0.12)"  },
  DELIVERED:        { label: "Delivered",        color: "#4ADE80", bg: "rgba(74,222,128,0.12)"  },
  CANCELLED:        { label: "Cancelled",        color: "#F87171", bg: "rgba(248,113,113,0.12)" },
  RETURN_REQUESTED: { label: "Return Req",       color: "#F97316", bg: "rgba(249,115,22,0.12)"  },
  RETURNED:         { label: "Returned",         color: "#FB923C", bg: "rgba(251,146,60,0.12)"  },
  REFUNDED:         { label: "Refunded",         color: "#94A3B8", bg: "rgba(148,163,184,0.12)" },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as OrderStatus[];
const UPDATABLE: OrderStatus[] = ["CONFIRMED","PROCESSING","PACKED","SHIPPED","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"];

function fmt(n: number) { return `₹${n.toLocaleString("en-IN")}`; }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}

export default function AdminOrdersPage() {
  const [orders, setOrders]     = useState<Order[]>([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(true);
  const [q, setQ]               = useState("");
  const [status, setStatus]     = useState<OrderStatus | "">("");
  const [page, setPage]         = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [counts, setCounts]     = useState<Partial<Record<OrderStatus | "", number>>>({});

  // Bulk update state
  const [bulkStatus, setBulkStatus]   = useState<OrderStatus>("CONFIRMED");
  const [bulkNote, setBulkNote]       = useState("");
  const [applying, setApplying]       = useState(false);
  const [bulkResult, setBulkResult]   = useState("");

  // Single order update
  const [updateModal, setUpdateModal] = useState<Order | null>(null);
  const [newStatus, setNewStatus]     = useState<OrderStatus>("CONFIRMED");
  const [tracking, setTracking]       = useState("");
  const [carrier, setCarrier]         = useState("");
  const [updateNote, setUpdateNote]   = useState("");
  const [updating, setUpdating]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page) });
      if (q)      p.set("q", q);
      if (status) p.set("status", status);
      const res = await fetch(`/api/admin/orders?${p}`);
      if (!res.ok) return;
      const d = await res.json();
      setOrders(d.orders ?? []);
      setTotal(d.total ?? 0);
      setPages(d.pages ?? 1);
    } finally { setLoading(false); }
  }, [q, status, page]);

  // Load status counts in parallel
  useEffect(() => {
    const loadCounts = async () => {
      const all = await Promise.all([
        fetch("/api/admin/orders?page=1").then(r => r.json()).then(d => ({ "": d.total ?? 0 })).catch(() => ({})),
        ...ALL_STATUSES.map(s =>
          fetch(`/api/admin/orders?page=1&status=${s}`).then(r => r.json()).then(d => ({ [s]: d.total ?? 0 })).catch(() => ({}))
        ),
      ]);
      const merged = all.reduce((acc, obj) => ({ ...acc, ...obj }), {});
      setCounts(merged);
    };
    loadCounts();
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSelected(prev => prev.size === orders.length ? new Set() : new Set(orders.map(o => o.id)));
  }

  async function applyBulk() {
    if (!selected.size) return;
    setApplying(true); setBulkResult("");
    let ok = 0;
    for (const id of selected) {
      try {
        const res = await fetch(`/api/admin/orders/${id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: bulkStatus, note: bulkNote || undefined }),
        });
        if (res.ok) ok++;
      } catch { /* continue */ }
    }
    setBulkResult(`Updated ${ok}/${selected.size} orders`);
    setSelected(new Set());
    setApplying(false);
    load();
  }

  async function applyUpdate() {
    if (!updateModal) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${updateModal.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: tracking || undefined,
          carrierName: carrier || undefined,
          note: updateNote || undefined,
        }),
      });
      if (res.ok) { setUpdateModal(null); load(); }
    } finally { setUpdating(false); }
  }

  function openUpdate(order: Order) {
    setUpdateModal(order);
    setNewStatus(order.status);
    setTracking(order.shipment?.trackingNumber ?? "");
    setCarrier(order.shipment?.carrierName ?? "");
    setUpdateNote("");
  }

  function exportCSV() {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (q) p.set("q", q);
    window.open(`/api/admin/orders/export?${p}`, "_blank");
  }

  const allSelected = selected.size > 0 && selected.size === orders.length;

  return (
    <div className="p-6 lg:p-8 max-w-[1300px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
            Orders
          </h1>
          <p className="text-white/40 text-[13px]">{total.toLocaleString("en-IN")} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-semibold text-white/60 hover:text-white transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {([{ value: "", label: "All" }, ...ALL_STATUSES.map(s => ({ value: s, label: STATUS_CONFIG[s].label }))] as { value: string; label: string }[]).map(tab => {
          const count = counts[tab.value as OrderStatus | ""] ?? 0;
          const isActive = status === tab.value;
          const cfg = tab.value ? STATUS_CONFIG[tab.value as OrderStatus] : null;
          return (
            <button key={tab.value} onClick={() => { setStatus(tab.value as OrderStatus | ""); setPage(1); setSelected(new Set()); }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold whitespace-nowrap transition-all shrink-0"
              style={{
                background: isActive ? (cfg?.bg ?? "rgba(245,197,24,0.12)") : "rgba(255,255,255,0.04)",
                color:      isActive ? (cfg?.color ?? "#F5C518") : "rgba(255,255,255,0.4)",
                border:     isActive ? `1px solid ${cfg?.color ?? "#F5C518"}30` : "1px solid rgba(255,255,255,0.06)",
              }}>
              {tab.label}
              {count > 0 && <span className="font-mono text-[9px] opacity-70">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Search + bulk bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Order #, customer name, email…"
            className="w-full rounded-xl pl-10 pr-4 text-[13px] text-white placeholder:text-white/25 outline-none"
            style={{ height: "40px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }} />
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 rounded-xl px-3" style={{ background: "#1A1A1A", border: "1px solid rgba(245,197,24,0.3)" }}>
            <span className="text-[12px] font-bold text-[#F5C518]">{selected.size} selected</span>
            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value as OrderStatus)}
              className="text-[11px] text-white bg-transparent outline-none border-none">
              {UPDATABLE.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>
            <button onClick={applyBulk} disabled={applying}
              className="h-7 px-3 rounded-lg text-[11px] font-black text-[#0D0D0D] disabled:opacity-50"
              style={{ background: "#F5C518" }}>
              {applying ? "…" : "Apply"}
            </button>
            {bulkResult && <span className="text-[10px] text-[#4ADE80]">{bulkResult}</span>}
          </div>
        )}
      </div>

      {/* Select all row */}
      <div className="flex items-center gap-3 px-4 py-2 mb-1 rounded-xl" style={{ background: "#111" }}>
        <button onClick={toggleAll} className="flex items-center gap-2 text-[11px] font-semibold text-white/50 hover:text-white">
          {allSelected ? <CheckSquare className="h-3.5 w-3.5 text-[#F5C518]" /> : <Square className="h-3.5 w-3.5" />}
          {allSelected ? "Deselect all" : "Select all on page"}
        </button>
      </div>

      {/* Orders table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="hidden lg:grid px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/25 border-b"
          style={{ gridTemplateColumns: "28px 110px 1fr 160px 80px 90px 130px 80px", borderColor: "rgba(255,255,255,0.05)" }}>
          <span />
          <span>Order</span>
          <span>Customer</span>
          <span>Items</span>
          <span className="text-right">Total</span>
          <span>Payment</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-white/25">
            <Package className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-[14px] font-semibold">No orders found</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {orders.map(order => {
              const sc  = STATUS_CONFIG[order.status];
              const sel = selected.has(order.id);
              return (
                <div key={order.id}
                  className="hidden lg:grid items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                  style={{ gridTemplateColumns: "28px 110px 1fr 160px 80px 90px 130px 80px",
                    background: sel ? "rgba(245,197,24,0.04)" : undefined }}>
                  <button onClick={() => toggleSelect(order.id)}>
                    {sel ? <CheckSquare className="h-3.5 w-3.5 text-[#F5C518]" /> : <Square className="h-3.5 w-3.5 text-white/20" />}
                  </button>
                  <div>
                    <p className="text-[11px] font-mono font-bold text-white/80">{order.orderNumber}</p>
                    <p className="text-[10px] text-white/30">{fmtDate(order.createdAt)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-white truncate">{order.user.name ?? "—"}</p>
                    <p className="text-[10px] text-white/35 truncate">{order.user.email}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-white/60 truncate">{order.items[0]?.productName ?? "—"}</p>
                    {order.items.length > 1 && <p className="text-[10px] text-white/30">+{order.items.length - 1} more</p>}
                    {order.shipment?.trackingNumber && (
                      <p className="text-[9px] font-mono text-[#38BDF8] truncate">{order.shipment.trackingNumber}</p>
                    )}
                  </div>
                  <p className="text-[13px] font-black text-white text-right" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {fmt(Number(order.total))}
                  </p>
                  <div>
                    <p className="text-[10px] font-semibold text-white/50">{order.payment?.method?.replace("RAZORPAY_", "") ?? "—"}</p>
                    <p className="text-[9px]" style={{ color: order.payment?.status === "CAPTURED" ? "#4ADE80" : "#F87171" }}>
                      {order.payment?.status ?? "—"}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-black w-fit"
                    style={{ background: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                  <div className="flex items-center gap-1 justify-end">
                    <Link href={`/admin/orders/${order.id}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 hover:text-white transition-all">
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <button onClick={() => openUpdate(order)}
                      className="h-7 px-2 rounded-lg text-[10px] font-bold text-[#F5C518] hover:bg-[#F5C518]/10 transition-all">
                      Update
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-[12px] text-white/35">Page {page} of {pages} · {total} orders</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/08 disabled:opacity-30 transition-all">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/08 disabled:opacity-30 transition-all">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Update modal */}
      {updateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={e => { if (e.target === e.currentTarget) setUpdateModal(null); }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <p className="text-white font-black text-[16px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                Update Order
              </p>
              <p className="text-white/40 text-[11px]">{updateModal.orderNumber} · {updateModal.user.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-white/35 mb-2 uppercase tracking-widest">New Status</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {UPDATABLE.map(s => {
                    const sc = STATUS_CONFIG[s];
                    return (
                      <button key={s} onClick={() => setNewStatus(s)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all"
                        style={{
                          background: newStatus === s ? sc.bg : "rgba(255,255,255,0.03)",
                          border: `1px solid ${newStatus === s ? sc.color + "40" : "transparent"}`,
                        }}>
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: sc.color }} />
                        <span className="text-[11px] font-semibold text-white">{sc.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {(newStatus === "SHIPPED" || newStatus === "OUT_FOR_DELIVERY") && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-white/35 mb-1.5 uppercase tracking-widest">Tracking #</label>
                    <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="AWB / Tracking"
                      className="w-full h-9 rounded-xl px-3 text-[12px] text-white outline-none bg-[#111] border border-white/08" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/35 mb-1.5 uppercase tracking-widest">Carrier</label>
                    <input value={carrier} onChange={e => setCarrier(e.target.value)} placeholder="Delhivery / Shiprocket"
                      className="w-full h-9 rounded-xl px-3 text-[12px] text-white outline-none bg-[#111] border border-white/08" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-white/35 mb-1.5 uppercase tracking-widest">Note (optional)</label>
                <input value={updateNote} onChange={e => setUpdateNote(e.target.value)} placeholder="Internal note…"
                  className="w-full h-9 rounded-xl px-3 text-[12px] text-white outline-none bg-[#111] border border-white/08" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setUpdateModal(null)}
                  className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  Cancel
                </button>
                <button onClick={applyUpdate} disabled={updating}
                  className="flex-1 h-10 rounded-xl text-[13px] font-black text-[#0D0D0D] disabled:opacity-40"
                  style={{ background: "#F5C518" }}>
                  {updating ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
