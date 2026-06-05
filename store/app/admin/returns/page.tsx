"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  RefreshCw, Search, ChevronLeft, ChevronRight, X,
  CheckCircle, XCircle, AlertCircle, Clock, Package,
  IndianRupee, RotateCcw, Truck, MessageSquare,
  TrendingDown, Store, Download, Info,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ReturnStatus = "REQUESTED" | "APPROVED" | "PICKUP_SCHEDULED" | "RECEIVED" | "REFUNDED" | "REJECTED";
type ReturnReason = "DAMAGED" | "WRONG_ITEM" | "NOT_AS_DESCRIBED" | "CHANGED_MIND" | "DEFECTIVE" | "SIZE_ISSUE" | "OTHER";

interface ReturnItem {
  id: string; productName: string; variantSku?: string;
  size?: string; color?: string; quantity: number; unitPrice: number; imageUrl?: string;
  product: { name: string; slug: string; supplierId: string | null };
}

interface ReturnRequest {
  id: string; returnNumber: string; status: ReturnStatus;
  reason: ReturnReason; reasonNote?: string; adminNote?: string;
  refundAmount: number; refundMethod: string;
  refundedAt?: string; pickupDate?: string;
  requestedAt: string; resolvedAt?: string; createdAt: string;
  imageUrls: string[];
  user:  { id: string; name: string | null; email: string | null; phone?: string | null; image?: string | null };
  order: {
    id: string; orderNumber: string; total: number; createdAt: string;
    payment: { id: string; method: string; status: string; razorpayPaymentId?: string } | null;
    items?: { productId: string; productName: string; quantity: number; unitPrice: number; imageUrl?: string; size?: string; color?: string; variantSku?: string; variant?: { costPrice?: number }; product?: { supplierId?: string } }[];
  };
  items: ReturnItem[];
}

interface Analytics {
  overview: {
    byStatus: Record<ReturnStatus, number>;
    totalRefunded: number; pendingRefundAmount: number;
    periodReturns: number; periodOrders: number; returnRate: number;
  };
  reasons: { reason: ReturnReason; count: number; refundAmount: number }[];
  topReturnedProducts: { productId: string; productName: string; quantity: number; incidents: number }[];
  categoryBreakdown: { name: string; returns: number; orders: number; returnRate: number }[];
  supplierImpact: { supplierId: string; companyName: string; deductions: number; returnCount: number }[];
  daily: { date: string; count: number; amount: number }[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ReturnStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  REQUESTED:        { label: "Pending",          color: "#F5C518", bg: "rgba(245,197,24,0.12)",   icon: Clock          },
  APPROVED:         { label: "Approved",          color: "#4ADE80", bg: "rgba(74,222,128,0.12)",  icon: CheckCircle    },
  PICKUP_SCHEDULED: { label: "Pickup Scheduled", color: "#38BDF8", bg: "rgba(56,189,248,0.12)",   icon: Truck          },
  RECEIVED:         { label: "Received",          color: "#A78BFA", bg: "rgba(167,139,250,0.12)", icon: Package        },
  REFUNDED:         { label: "Refunded",          color: "#4ADE80", bg: "rgba(74,222,128,0.12)",  icon: IndianRupee    },
  REJECTED:         { label: "Rejected",          color: "#F87171", bg: "rgba(248,113,113,0.12)", icon: XCircle        },
};

const REASON_LABELS: Record<ReturnReason, string> = {
  DAMAGED: "Damaged", WRONG_ITEM: "Wrong Item", NOT_AS_DESCRIBED: "Not as Described",
  CHANGED_MIND: "Changed Mind", DEFECTIVE: "Defective", SIZE_ISSUE: "Size Issue", OTHER: "Other",
};

const ALL_STATUSES = Object.keys(STATUS_CFG) as ReturnStatus[];
const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });

// ─── Return Detail Modal ──────────────────────────────────────────────────────

function ReturnDetailModal({ ret, onClose, onUpdate }: {
  ret: ReturnRequest; onClose: () => void; onUpdate: () => void;
}) {
  const [note, setNote]               = useState(ret.adminNote ?? "");
  const [pickupDate, setPickupDate]   = useState(ret.pickupDate ? ret.pickupDate.slice(0, 10) : "");
  const [processGateway, setProcessGateway] = useState(false);
  const [applying, setApplying]       = useState(false);
  const [error, setError]             = useState("");
  const [tab, setTab]                 = useState<"details" | "items" | "images">("details");

  async function applyAction(status: ReturnStatus) {
    setApplying(true); setError("");
    try {
      const body: Record<string, unknown> = { status, adminNote: note || undefined };
      if (status === "PICKUP_SCHEDULED" && pickupDate) body.pickupDate = new Date(pickupDate).toISOString();
      if (status === "REFUNDED") body.processGatewayRefund = processGateway;
      const res = await fetch(`/api/admin/returns/${ret.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      onUpdate(); onClose();
    } catch { setError("Network error"); }
    finally { setApplying(false); }
  }

  async function saveNote() {
    setApplying(true); setError("");
    try {
      const res = await fetch(`/api/admin/returns/${ret.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: note }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      onUpdate();
    } catch { setError("Network error"); }
    finally { setApplying(false); }
  }

  const sc        = STATUS_CFG[ret.status];
  const StatusIcon = sc.icon;
  const canApprove = ret.status === "REQUESTED";
  const canSchedule = ret.status === "APPROVED";
  const canReceive  = ret.status === "PICKUP_SCHEDULED";
  const canRefund   = ret.status === "RECEIVED" || ret.status === "APPROVED";
  const canReject   = ret.status === "REQUESTED" || ret.status === "APPROVED";
  const hasGateway  = !!ret.order.payment?.razorpayPaymentId;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0" style={{ background: sc.bg }}>
            <StatusIcon className="h-4 w-4" style={{ color: sc.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-black text-[15px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {ret.returnNumber}
              </p>
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black" style={{ background: sc.bg, color: sc.color }}>
                {sc.label}
              </span>
            </div>
            <p className="text-white/40 text-[11px]">{ret.user.name} · {ret.user.email}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 shrink-0">
          {[
            { key: "details", label: "Details"  },
            { key: "items",   label: `Items (${ret.items.length})` },
            { key: "images",  label: `Images (${ret.imageUrls.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className="h-8 px-3 rounded-lg text-[11px] font-semibold transition-all"
              style={{
                background: tab === t.key ? "rgba(245,197,24,0.12)" : "transparent",
                color: tab === t.key ? "#F5C518" : "rgba(255,255,255,0.4)",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {tab === "details" && (
            <>
              {/* Return info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Order",        value: ret.order.orderNumber },
                  { label: "Reason",       value: REASON_LABELS[ret.reason] },
                  { label: "Refund Amt",   value: fmt(Number(ret.refundAmount)) },
                  { label: "Refund Via",   value: ret.refundMethod.replace("_", " ") },
                  { label: "Requested",    value: fmtDate(ret.requestedAt) },
                  { label: "Payment",      value: ret.order.payment?.method?.replace("RAZORPAY_", "") ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-0.5">{label}</p>
                    <p className="text-[12px] font-semibold text-white/80">{value}</p>
                  </div>
                ))}
              </div>

              {/* Customer note */}
              {ret.reasonNote && (
                <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">Customer Note</p>
                  <p className="text-[12px] text-white/70">{ret.reasonNote}</p>
                </div>
              )}

              {/* Admin note */}
              <div>
                <label className="block text-[10px] font-bold text-white/35 mb-1.5 uppercase tracking-widest">
                  Admin Note
                </label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                  placeholder="Internal notes, rejection reason, instructions…"
                  className="w-full rounded-xl px-4 py-3 text-[12px] text-white outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
                <button onClick={saveNote} disabled={applying} className="mt-1.5 text-[10px] text-[#F5C518] hover:underline disabled:opacity-50">
                  Save note only
                </button>
              </div>

              {/* Pickup date */}
              {(canSchedule || ret.status === "PICKUP_SCHEDULED") && (
                <div>
                  <label className="block text-[10px] font-bold text-white/35 mb-1.5 uppercase tracking-widest">
                    Pickup Date
                  </label>
                  <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)}
                    className="w-full h-9 rounded-xl px-3 text-[12px] text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              )}

              {/* Gateway refund toggle */}
              {canRefund && hasGateway && (
                <button onClick={() => setProcessGateway(v => !v)}
                  className="flex items-center justify-between w-full rounded-xl px-4 py-3 transition-all"
                  style={{
                    background: processGateway ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${processGateway ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.08)"}`,
                  }}>
                  <div className="text-left">
                    <p className="text-[12px] font-semibold text-white">Process Razorpay Refund</p>
                    <p className="text-[10px] text-white/35">Auto-initiate gateway refund of {fmt(Number(ret.refundAmount))}</p>
                  </div>
                  <div className={`h-5 w-9 rounded-full flex items-center px-0.5 ${processGateway ? "bg-[#4ADE80]" : "bg-white/15"}`}>
                    <div className={`h-4 w-4 rounded-full bg-white shadow transition-all ${processGateway ? "translate-x-4" : ""}`} />
                  </div>
                </button>
              )}

              {error && <p className="text-[11px] text-[#F87171] font-semibold">{error}</p>}
            </>
          )}

          {tab === "items" && (
            <div className="space-y-3">
              {ret.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden" style={{ background: "#2A2A2A" }}>
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      : <Package className="h-5 w-5 m-3.5 text-white/20" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white truncate">{item.productName}</p>
                    <p className="text-[10px] text-white/40">
                      {item.variantSku}{item.size ? ` · ${item.size}` : ""}{item.color ? ` · ${item.color}` : ""}
                    </p>
                    {item.product.supplierId && (
                      <p className="text-[9px] text-white/25">Has supplier mapping</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-bold text-white">{fmt(Number(item.unitPrice))}</p>
                    <p className="text-[10px] text-white/40">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "images" && (
            ret.imageUrls.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-white/25">
                <Package className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-[12px]">No images submitted</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {ret.imageUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer"
                    className="aspect-square rounded-xl overflow-hidden block hover:opacity-90 transition-opacity">
                    <img src={url} alt={`Return image ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )
          )}
        </div>

        {/* Action buttons */}
        {ret.status !== "REFUNDED" && ret.status !== "REJECTED" && (
          <div className="px-6 py-4 border-t flex flex-wrap gap-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {canApprove && (
              <button onClick={() => applyAction("APPROVED")} disabled={applying}
                className="flex items-center gap-2 h-10 px-4 rounded-xl text-[12px] font-black text-[#0D0D0D] disabled:opacity-40"
                style={{ background: "#4ADE80" }}>
                <CheckCircle className="h-4 w-4" /> Approve
              </button>
            )}
            {canSchedule && (
              <button onClick={() => applyAction("PICKUP_SCHEDULED")} disabled={applying || !pickupDate}
                className="flex items-center gap-2 h-10 px-4 rounded-xl text-[12px] font-black text-[#0D0D0D] disabled:opacity-40"
                style={{ background: "#38BDF8" }}>
                <Truck className="h-4 w-4" /> Schedule Pickup
              </button>
            )}
            {canReceive && (
              <button onClick={() => applyAction("RECEIVED")} disabled={applying}
                className="flex items-center gap-2 h-10 px-4 rounded-xl text-[12px] font-black text-[#0D0D0D] disabled:opacity-40"
                style={{ background: "#A78BFA" }}>
                <Package className="h-4 w-4" /> Mark Received
              </button>
            )}
            {canRefund && (
              <button onClick={() => applyAction("REFUNDED")} disabled={applying}
                className="flex items-center gap-2 h-10 px-4 rounded-xl text-[12px] font-black text-[#0D0D0D] disabled:opacity-40"
                style={{ background: "#F5C518" }}>
                <IndianRupee className="h-4 w-4" /> Process Refund
              </button>
            )}
            {canReject && (
              <button onClick={() => applyAction("REJECTED")} disabled={applying}
                className="flex items-center gap-2 h-10 px-4 rounded-xl text-[12px] font-semibold text-[#F87171] disabled:opacity-40"
                style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)" }}>
                <XCircle className="h-4 w-4" /> Reject
              </button>
            )}
            {applying && <span className="text-[11px] text-white/30 self-center">Saving…</span>}
          </div>
        )}

        {(ret.status === "REFUNDED" || ret.status === "REJECTED") && (
          <div className="px-6 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <p className="text-[11px] text-white/30">
              {ret.status === "REFUNDED"
                ? `Refunded ${ret.refundedAt ? fmtDate(ret.refundedAt) : ""} · ${fmt(Number(ret.refundAmount))}`
                : `Rejected${ret.resolvedAt ? ` on ${fmtDate(ret.resolvedAt)}` : ""}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminReturnsPage() {
  const [returns, setReturns]       = useState<ReturnRequest[]>([]);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [kpis, setKpis]             = useState<{ totalRefunded: number; pendingCount: number; resolvedCount: number } | null>(null);
  const [analytics, setAnalytics]   = useState<Analytics | null>(null);
  const [loading, setLoading]       = useState(true);
  const [q, setQ]                   = useState("");
  const [status, setStatus]         = useState<ReturnStatus | "">("");
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState<ReturnRequest | null>(null);
  const [view, setView]             = useState<"list" | "analytics">("list");

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page) });
      if (q)      p.set("q", q);
      if (status) p.set("status", status);
      const res = await fetch(`/api/admin/returns?${p}`);
      if (res.ok) {
        const d = await res.json();
        setReturns(d.returns ?? []);
        setTotal(d.total ?? 0);
        setPages(d.pages ?? 1);
        setKpis(d.kpis);
      }
    } finally { setLoading(false); }
  }, [q, status, page]);

  const loadAnalytics = useCallback(async () => {
    const res = await fetch("/api/admin/returns/analytics?days=30");
    if (res.ok) setAnalytics(await res.json());
  }, []);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { if (view === "analytics") loadAnalytics(); }, [view, loadAnalytics]);

  function fmt2(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }
  const maxDaily = analytics ? Math.max(...analytics.daily.map(d => d.count), 1) : 1;

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
            Returns & Refunds
          </h1>
          <p className="text-white/40 text-[13px]">{total.toLocaleString("en-IN")} total requests</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadList} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {[
            { key: "list",      label: "Requests" },
            { key: "analytics", label: "Analytics" },
          ].map(t => (
            <button key={t.key} onClick={() => setView(t.key as "list" | "analytics")}
              className="h-9 px-4 rounded-xl text-[12px] font-semibold transition-all"
              style={{
                background: view === t.key ? "rgba(245,197,24,0.12)" : "rgba(255,255,255,0.05)",
                color:      view === t.key ? "#F5C518" : "rgba(255,255,255,0.4)",
                border:     view === t.key ? "1px solid rgba(245,197,24,0.3)" : "1px solid transparent",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI bar */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Pending Review",   value: kpis.pendingCount,                 color: "#F5C518", href: "?status=REQUESTED"  },
            { label: "Total Refunded",   value: fmt2(kpis.totalRefunded),          color: "#4ADE80", href: "?status=REFUNDED"   },
            { label: "Resolved",         value: kpis.resolvedCount,                color: "#A78BFA", href: ""                   },
            { label: "Return Rate",      value: analytics ? `${analytics.overview.returnRate}%` : "—", color: analytics?.overview.returnRate && analytics.overview.returnRate > 5 ? "#F87171" : "#4ADE80", href: "" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">{label}</p>
              <p className="text-[24px] font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── LIST VIEW ──────────────────────────────────────────────────────── */}
      {view === "list" && (
        <>
          {/* Status tabs */}
          <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            {([{ value: "", label: "All" }, ...ALL_STATUSES.map(s => ({ value: s, label: STATUS_CFG[s].label }))] as { value: string; label: string }[]).map(tab => {
              const isActive = status === tab.value;
              const cfg      = tab.value ? STATUS_CFG[tab.value as ReturnStatus] : null;
              return (
                <button key={tab.value}
                  onClick={() => { setStatus(tab.value as ReturnStatus | ""); setPage(1); }}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold whitespace-nowrap transition-all shrink-0"
                  style={{
                    background: isActive ? (cfg?.bg ?? "rgba(245,197,24,0.12)") : "rgba(255,255,255,0.04)",
                    color:      isActive ? (cfg?.color ?? "#F5C518") : "rgba(255,255,255,0.4)",
                    border:     isActive ? `1px solid ${(cfg?.color ?? "#F5C518")}30` : "1px solid rgba(255,255,255,0.06)",
                  }}>
                  {tab.label}
                  {analytics && tab.value && (
                    <span className="font-mono text-[9px] opacity-70">
                      {analytics.overview.byStatus[tab.value as ReturnStatus] ?? 0}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
            <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
              placeholder="Search return #, customer, order…"
              className="w-full rounded-xl pl-10 pr-4 text-[13px] text-white placeholder:text-white/25 outline-none"
              style={{ height: "40px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="hidden lg:grid px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/25 border-b"
              style={{ gridTemplateColumns: "110px 1fr 130px 90px 100px 120px 80px", borderColor: "rgba(255,255,255,0.05)" }}>
              <span>Return #</span><span>Customer</span><span>Reason</span>
              <span>Items</span><span className="text-right">Refund</span><span>Status</span><span className="text-right">Action</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
              </div>
            ) : returns.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-white/25">
                <RotateCcw className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-[14px] font-semibold">No return requests</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {returns.map(r => {
                  const sc = STATUS_CFG[r.status];
                  const SI = sc.icon;
                  return (
                    <div key={r.id}
                      className="hidden lg:grid items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                      style={{ gridTemplateColumns: "110px 1fr 130px 90px 100px 120px 80px" }}
                      onClick={() => setSelected(r)}>
                      <div>
                        <p className="text-[11px] font-mono font-bold text-white/80">{r.returnNumber}</p>
                        <p className="text-[9px] text-white/30">{fmtDate(r.createdAt)}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-white truncate">{r.user.name ?? "—"}</p>
                        <p className="text-[10px] text-white/35 truncate">{r.order.orderNumber}</p>
                      </div>
                      <span className="text-[11px] text-white/60">{REASON_LABELS[r.reason]}</span>
                      <span className="text-[11px] text-white/50">{r.items.length} item{r.items.length !== 1 ? "s" : ""}</span>
                      <p className="text-[13px] font-black text-white text-right" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {fmt(Number(r.refundAmount))}
                      </p>
                      <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black w-fit"
                        style={{ background: sc.bg, color: sc.color }}>
                        <SI className="h-3 w-3" />
                        {sc.label}
                      </span>
                      <button className="text-right text-[11px] font-semibold text-[#F5C518] hover:underline" onClick={e => { e.stopPropagation(); setSelected(r); }}>
                        Review
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-[12px] text-white/35">Page {page} of {pages}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/08 disabled:opacity-30">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/08 disabled:opacity-30">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ANALYTICS VIEW ──────────────────────────────────────────────── */}
      {view === "analytics" && (
        analytics ? (
          <div className="space-y-5">
            {/* Daily trend */}
            <div className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="text-white font-black text-[13px] mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                Return Volume — Last 30 Days
              </h3>
              <div className="flex items-end gap-0.5 h-16">
                {analytics.daily.map(d => (
                  <div key={d.date} className="flex-1 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap rounded-lg px-2 py-1 text-[9px] text-white" style={{ background: "#2A2A2A" }}>
                      {d.date.slice(5)}: {d.count} returns
                    </div>
                    <div className="w-full rounded-sm" style={{
                      height: `${Math.max(3, (d.count / maxDaily) * 60)}px`,
                      background: d.count > 0 ? "#F87171" : "rgba(255,255,255,0.08)",
                    }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
              {/* Return reasons */}
              <div className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-white font-black text-[13px] mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Return Reasons
                </h3>
                <div className="space-y-3">
                  {analytics.reasons.length === 0 && <p className="text-white/30 text-[12px]">No data yet</p>}
                  {analytics.reasons.map(r => {
                    const max = analytics.reasons[0]?.count ?? 1;
                    return (
                      <div key={r.reason}>
                        <div className="flex justify-between mb-1">
                          <span className="text-[11px] text-white/60">{REASON_LABELS[r.reason as ReturnReason]}</span>
                          <span className="text-[11px] font-bold text-white">{r.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <div className="h-full rounded-full bg-[#F87171]" style={{ width: `${(r.count / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top returned products */}
              <div className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-white font-black text-[13px] mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Most Returned Products
                </h3>
                <div className="space-y-2">
                  {analytics.topReturnedProducts.length === 0 && <p className="text-white/30 text-[12px]">No data yet</p>}
                  {analytics.topReturnedProducts.map((p, i) => (
                    <div key={p.productId} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-white/25 w-4">{i + 1}</span>
                      <p className="flex-1 text-[11px] text-white/70 truncate">{p.productName}</p>
                      <span className="text-[11px] font-bold text-[#F87171]">{p.quantity} units</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category return rates */}
              <div className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-white font-black text-[13px] mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Return Rate by Category
                </h3>
                <div className="space-y-3">
                  {analytics.categoryBreakdown.length === 0 && <p className="text-white/30 text-[12px]">No data yet</p>}
                  {analytics.categoryBreakdown.slice(0, 6).map(cat => (
                    <div key={cat.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] text-white/60">{cat.name}</span>
                        <span className="text-[11px] font-bold" style={{ color: cat.returnRate > 10 ? "#F87171" : cat.returnRate > 5 ? "#F5C518" : "#4ADE80" }}>
                          {cat.returnRate}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, cat.returnRate * 5)}%`,
                          background: cat.returnRate > 10 ? "#F87171" : cat.returnRate > 5 ? "#F5C518" : "#4ADE80" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Supplier impact */}
            {analytics.supplierImpact.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <h3 className="text-white font-black text-[13px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    Supplier Impact — Ledger Deductions
                  </h3>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {analytics.supplierImpact.map(s => (
                    <div key={s.supplierId} className="flex items-center gap-4 px-5 py-3">
                      <Store className="h-4 w-4 text-white/25 shrink-0" />
                      <p className="flex-1 text-[12px] font-semibold text-white/80">{s.companyName}</p>
                      <span className="text-[11px] text-white/40">{s.returnCount} returns</span>
                      <span className="text-[12px] font-bold text-[#F87171]">-{fmt2(s.deductions)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
          </div>
        )
      )}

      {/* Detail modal */}
      {selected && (
        <ReturnDetailModal
          ret={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => { loadList(); if (view === "analytics") loadAnalytics(); }}
        />
      )}
    </div>
  );
}
