"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowRight, Plus, X, Check, ChevronLeft, ChevronRight,
  Search, RefreshCw, Package, AlertTriangle, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

type TransferStatus = "PENDING" | "IN_TRANSIT" | "RECEIVED" | "CANCELLED";

interface TransferItem {
  id: string; variantSku: string; size: string | null; color: string | null;
  requestedQty: number; transferredQty: number;
  variant: { sku: string; size: string | null; color: string | null };
  product: { name: string };
}

interface TransferRow {
  id: string; transferNumber: string; status: TransferStatus;
  reason: string | null; internalNote: string | null;
  dispatchedAt: string | null; receivedAt: string | null;
  cancelledAt: string | null; createdAt: string;
  fromWarehouse: { id: string; name: string; code: string };
  toWarehouse:   { id: string; name: string; code: string };
  items: TransferItem[];
  _count: { items: number };
}

interface Warehouse { id: string; name: string; code: string; totalUnits?: number; }
interface VariantOption { id: string; sku: string; size: string | null; color: string | null; stock: number; productName: string; }

interface ApiData {
  transfers: TransferRow[];
  total: number; pages: number;
  counts: Partial<Record<TransferStatus, number>>;
}

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TransferStatus, { label: string; color: string; bg: string }> = {
  PENDING:    { label: "Pending",    color: "#F5C518", bg: "rgba(245,197,24,0.12)"  },
  IN_TRANSIT: { label: "In Transit", color: "#60A5FA", bg: "rgba(96,165,250,0.12)"  },
  RECEIVED:   { label: "Received",   color: "#4ADE80", bg: "rgba(74,222,128,0.12)"  },
  CANCELLED:  { label: "Cancelled",  color: "#F87171", bg: "rgba(248,113,113,0.12)" },
};

const TRANSITIONS: Record<TransferStatus, TransferStatus[]> = {
  PENDING:    ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["RECEIVED",   "CANCELLED"],
  RECEIVED:   [],
  CANCELLED:  [],
};

const STATUS_TABS: { value: TransferStatus | "ALL"; label: string }[] = [
  { value: "ALL",        label: "All"        },
  { value: "PENDING",    label: "Pending"    },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "RECEIVED",   label: "Received"   },
  { value: "CANCELLED",  label: "Cancelled"  },
];

function fmt(n: number) { return "₹" + n.toLocaleString("en-IN"); }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: TransferStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ── Create Transfer Modal ─────────────────────────────────────────────────────

function CreateTransferModal({
  warehouses,
  onClose,
  onSuccess,
}: {
  warehouses: Warehouse[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [fromId,  setFromId]  = useState("");
  const [toId,    setToId]    = useState("");
  const [reason,  setReason]  = useState("");
  const [note,    setNote]    = useState("");
  const [variantSearch, setVSearch] = useState("");
  const [variantResults, setVResults] = useState<VariantOption[]>([]);
  const [lines, setLines]   = useState<{ variantId: string; sku: string; productName: string; size: string | null; requestedQty: number }[]>([]);
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState("");

  useEffect(() => {
    if (!fromId || variantSearch.length < 2) { setVResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/warehouses/${fromId}?stock=1`);
      if (!res.ok) return;
      const data = await res.json();
      const opts: VariantOption[] = (data.stocks ?? [])
        .filter((s: { variant: { id: string; sku: string; size: string | null; }; product: { name: string }; stock: number }) =>
          s.variant.sku.toLowerCase().includes(variantSearch.toLowerCase()) ||
          s.product.name.toLowerCase().includes(variantSearch.toLowerCase())
        )
        .slice(0, 10)
        .map((s: { variant: { id: string; sku: string; size: string | null; color: string | null; }; product: { name: string }; stock: number }) => ({
          id: s.variant.id, sku: s.variant.sku, size: s.variant.size ?? null,
          color: s.variant.color ?? null, stock: s.stock, productName: s.product.name,
        }));
      setVResults(opts);
    }, 300);
    return () => clearTimeout(t);
  }, [fromId, variantSearch]);

  function addLine(v: VariantOption) {
    if (lines.find(l => l.variantId === v.id)) return;
    setLines(prev => [...prev, { variantId: v.id, sku: v.sku, productName: v.productName, size: v.size, requestedQty: 1 }]);
    setVSearch(""); setVResults([]);
  }

  async function submit() {
    if (!fromId || !toId) { setErr("Select source and destination warehouses"); return; }
    if (fromId === toId)  { setErr("Source and destination must differ"); return; }
    if (!lines.length)    { setErr("Add at least one item"); return; }
    setErr(""); setBusy(true);
    try {
      const res = await fetch("/api/admin/inventory/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromWarehouseId: fromId,
          toWarehouseId:   toId,
          reason:  reason || undefined,
          internalNote: note || undefined,
          items: lines.map(l => ({ variantId: l.variantId, requestedQty: l.requestedQty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Failed"); setBusy(false); return; }
      onSuccess();
    } catch { setErr("Network error"); setBusy(false); }
  }

  const whOptions = warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.code})` }));

  function SelectField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
      <div>
        <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">{label}</label>
        <div className="relative">
          <select value={value} onChange={e => onChange(e.target.value)}
            className="w-full rounded-xl px-4 pr-10 text-[13px] font-semibold text-white outline-none appearance-none"
            style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}>
            <option value="">Select warehouse...</option>
            {whOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-[560px] rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
            New Stock Transfer
          </p>
          <button onClick={onClose} className="text-white/30 hover:text-white/70"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Warehouses */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <SelectField label="From Warehouse *" value={fromId} onChange={v => { setFromId(v); setLines([]); }} />
            <div className="flex items-center justify-center pb-1">
              <ArrowRight className="h-5 w-5 text-white/20" />
            </div>
          </div>
          <SelectField label="To Warehouse *" value={toId} onChange={setToId} />

          {/* SKU search */}
          {fromId && (
            <div>
              <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Add Items</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                <input value={variantSearch} onChange={e => setVSearch(e.target.value)}
                  placeholder="Search SKU or product in source warehouse..."
                  className="w-full rounded-xl pl-10 pr-4 text-[13px] text-white placeholder:text-white/20 outline-none"
                  style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              {variantResults.length > 0 && (
                <div className="mt-1 rounded-xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {variantResults.map(v => (
                    <button key={v.id} onClick={() => addLine(v)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/05">
                      <Package className="h-4 w-4 text-white/30 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-white/80 truncate">{v.productName}</p>
                        <p className="text-[10px] font-mono text-white/35">{v.sku}{v.size ? ` · ${v.size}` : ""}</p>
                      </div>
                      <p className="text-[11px] text-white/40 shrink-0">{v.stock} avail.</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lines */}
          {lines.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Transfer Lines</p>
              {lines.map((line, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-white/80 truncate">{line.productName}</p>
                    <p className="text-[10px] font-mono text-white/35">{line.sku}{line.size ? ` · ${line.size}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setLines(prev => prev.map((l, j) => j === i ? { ...l, requestedQty: Math.max(1, l.requestedQty - 1) } : l))}
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-white hover:bg-white/08"
                      style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>-</button>
                    <input type="number" min={1} value={line.requestedQty}
                      onChange={e => setLines(prev => prev.map((l, j) => j === i ? { ...l, requestedQty: Math.max(1, parseInt(e.target.value) || 1) } : l))}
                      className="w-14 text-center rounded-lg text-[13px] font-bold text-white outline-none"
                      style={{ height: "28px", background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                    <button onClick={() => setLines(prev => prev.map((l, j) => j === i ? { ...l, requestedQty: l.requestedQty + 1 } : l))}
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-white hover:bg-white/08"
                      style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>+</button>
                  </div>
                  <button onClick={() => setLines(prev => prev.filter((_, j) => j !== i))} className="text-white/25 hover:text-[#F87171]">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Reason</label>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Rebalancing stock for peak season"
              className="w-full rounded-xl px-4 text-[13px] text-white placeholder:text-white/20 outline-none"
              style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>

          {err && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-[#F87171]"
              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
              <AlertTriangle className="h-4 w-4 shrink-0" /> {err}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-4 border-t shrink-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <button onClick={onClose} className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>Cancel</button>
          <button onClick={submit} disabled={busy || !fromId || !toId || !lines.length}
            className="flex-1 h-10 rounded-xl text-[13px] font-black text-[#0D0D0D] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#F5C518" }}>
            {busy ? <span className="h-4 w-4 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" /> : <><Check className="h-4 w-4" /> Create Transfer</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TransfersPage() {
  const [data, setData]         = useState<ApiData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [status, setStatus]     = useState<TransferStatus | "ALL">("ALL");
  const [page, setPage]         = useState(1);
  const [showCreate, setCreate] = useState(false);
  const [warehouses, setWH]     = useState<Warehouse[]>([]);
  const [search, setSearch]     = useState("");
  const [dQ, setDQ]             = useState("");

  useEffect(() => { const t = setTimeout(() => { setDQ(search); setPage(1); }, 350); return () => clearTimeout(t); }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status !== "ALL") params.set("status", status);
    if (dQ)               params.set("q",      dQ);
    try {
      const res = await fetch(`/api/admin/inventory/transfers?${params}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [page, status, dQ]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/admin/warehouses").then(r => r.ok ? r.json() : []).then(setWH).catch(() => {});
  }, []);

  async function transition(id: string, newStatus: TransferStatus) {
    await fetch(`/api/admin/inventory/transfers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>Stock Transfers</h1>
          <p className="text-white/40 text-[13px]">Move inventory between warehouses</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
          <button onClick={() => setCreate(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-black text-[#0D0D0D]"
            style={{ background: "#F5C518" }}>
            <Plus className="h-4 w-4" /> New Transfer
          </button>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {(["PENDING","IN_TRANSIT","RECEIVED","CANCELLED"] as TransferStatus[]).map(s => (
          <button key={s} onClick={() => { setStatus(status === s ? "ALL" : s); setPage(1); }}
            className="rounded-xl p-3 text-left transition-all"
            style={{
              background: status === s ? STATUS_CONFIG[s].bg : "rgba(255,255,255,0.03)",
              border: `1px solid ${status === s ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)"}`,
            }}>
            <p className="text-[10px] text-white/30 mb-0.5">{STATUS_CONFIG[s].label}</p>
            <p className="font-black text-[18px] leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: STATUS_CONFIG[s].color }}>
              {data?.counts?.[s] ?? 0}
            </p>
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transfer number..."
            className="w-full rounded-xl pl-10 pr-4 text-[13px] text-white placeholder:text-white/25 outline-none"
            style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }} />
        </div>
        <div className="flex gap-1.5">
          {STATUS_TABS.map(({ value, label }) => (
            <button key={value} onClick={() => { setStatus(value); setPage(1); }}
              className="shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold whitespace-nowrap transition-all"
              style={{
                background: status === value ? "#F5C518" : "rgba(255,255,255,0.05)",
                color:      status === value ? "#0D0D0D"  : "rgba(255,255,255,0.4)",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="hidden lg:grid px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white/30 border-b"
          style={{ gridTemplateColumns: "140px 1fr 1fr 80px 100px 110px 140px", borderColor: "rgba(255,255,255,0.05)" }}>
          <span>Ref No.</span><span>From</span><span>To</span><span className="text-right">Items</span>
          <span>Status</span><span>Date</span><span />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-7 w-7 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin" />
          </div>
        ) : !data?.transfers.length ? (
          <p className="text-center py-12 text-white/30 text-[13px]">No transfers found</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {data.transfers.map(t => (
              <div key={t.id} className="hidden lg:grid px-5 py-3.5 items-center gap-3"
                style={{ gridTemplateColumns: "140px 1fr 1fr 80px 100px 110px 140px" }}>
                <p className="text-[11px] font-mono font-bold text-white/70">{t.transferNumber}</p>
                <div>
                  <p className="text-[12px] font-bold text-white/80">{t.fromWarehouse.name}</p>
                  <p className="text-[10px] font-mono text-white/30">{t.fromWarehouse.code}</p>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-white/80">{t.toWarehouse.name}</p>
                  <p className="text-[10px] font-mono text-white/30">{t.toWarehouse.code}</p>
                </div>
                <p className="text-[12px] font-semibold text-white/60 text-right">{t._count.items} lines</p>
                <StatusBadge status={t.status} />
                <p className="text-[11px] text-white/35">{fmtDate(t.createdAt)}</p>
                <div className="flex items-center gap-1.5 justify-end">
                  {TRANSITIONS[t.status].map(next => (
                    <button key={next} onClick={() => transition(t.id, next)}
                      className="h-7 px-2.5 rounded-lg text-[11px] font-bold text-white/50 hover:text-white transition-colors whitespace-nowrap"
                      style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                      → {STATUS_CONFIG[next].label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-[12px] text-white/35">{((page-1)*20)+1}–{Math.min(page*20, data.total)} of {data.total}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className={cn("flex h-8 w-8 items-center justify-center rounded-lg", page === 1 ? "text-white/20" : "text-white/50 hover:text-white hover:bg-white/08")}><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-[12px] font-semibold text-white/50">{page} / {data.pages}</span>
            <button onClick={() => setPage(p => Math.min(data.pages, p+1))} disabled={page === data.pages} className={cn("flex h-8 w-8 items-center justify-center rounded-lg", page === data.pages ? "text-white/20" : "text-white/50 hover:text-white hover:bg-white/08")}><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateTransferModal
          warehouses={warehouses}
          onClose={() => setCreate(false)}
          onSuccess={() => { setCreate(false); load(); }}
        />
      )}
    </div>
  );
}
