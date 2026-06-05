"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package, AlertTriangle, TrendingUp, TrendingDown, BarChart2,
  Search, X, ChevronLeft, ChevronRight, RefreshCw, Edit2,
  ArrowUp, ArrowDown, ChevronDown, Check, DollarSign, Layers,
} from "lucide-react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

interface VariantRow {
  variantId: string; sku: string; size: string | null; color: string | null;
  stock: number; price: number; costPrice: number | null; isActive: boolean;
  productId: string; productName: string; sport: string;
  category: string | null; supplier: string | null; image: string | null;
}

interface FastMoving { productId: string; productName: string; image: string | null; totalStock: number; soldQty: number; }
interface DeadStock  { productId: string; productName: string; image: string | null; totalStock: number; stockValue: number; retailValue: number; }

interface KPI {
  totalProducts: number; totalVariants: number; totalUnits: number;
  outOfStockCount: number; lowStockCount: number; overstockCount: number;
  stockValue: number; retailValue: number; potentialProfit: number; reorderAlerts: number;
}

interface ApiData {
  kpi: KPI;
  variants: VariantRow[];
  variantsTotal: number;
  variantsPages: number;
  fastMoving: FastMoving[];
  deadStock: DeadStock[];
  sportBreakdown: Record<string, number>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) { return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)       return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}>Out of Stock</span>;
  if (stock <= 5)        return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: "rgba(245,197,24,0.12)", color: "#F5C518" }}>Low: {stock}</span>;
  if (stock > 200)       return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: "rgba(96,165,250,0.12)", color: "#60A5FA" }}>Overstock: {stock}</span>;
  return <span className="text-[12px] font-bold text-white">{stock}</span>;
}

// ── Quick Adjust Modal ────────────────────────────────────────────────────────

function AdjustModal({
  variant,
  onClose,
  onSuccess,
}: {
  variant: VariantRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [delta, setDelta]   = useState(0);
  const [reason, setReason] = useState("MANUAL_ADJUSTMENT");
  const [note, setNote]     = useState("");
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState("");

  const REASONS = [
    { value: "MANUAL_ADJUSTMENT", label: "Manual Adjustment" },
    { value: "INITIAL_STOCK",     label: "Initial Stock"     },
    { value: "DAMAGE_WRITE_OFF",  label: "Damage / Write-off"},
    { value: "THEFT_SHRINKAGE",   label: "Theft / Shrinkage" },
    { value: "RETURN_RECEIVED",   label: "Return Received"   },
    { value: "BULK_UPDATE",       label: "Bulk Update"       },
  ];

  async function submit() {
    if (delta === 0) { setErr("Delta cannot be zero"); return; }
    setErr(""); setBusy(true);
    try {
      const res = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: variant.variantId, delta, reason, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Failed"); setBusy(false); return; }
      onSuccess();
    } catch { setErr("Network error"); setBusy(false); }
  }

  const newStock = Math.max(0, variant.stock + delta);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-[420px] rounded-2xl overflow-hidden"
        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div>
            <p className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>Adjust Stock</p>
            <p className="text-white/40 text-[11px] font-mono">{variant.sku} · {variant.productName}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between rounded-2xl p-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div>
              <p className="text-[10px] text-white/30 mb-0.5">Current Stock</p>
              <p className="font-black text-white text-[28px] leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{variant.stock}</p>
            </div>
            <div className="text-white/25 text-[20px]">→</div>
            <div>
              <p className="text-[10px] text-white/30 mb-0.5">New Stock</p>
              <p className="font-black text-[28px] leading-none"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color: newStock === 0 ? "#F87171" : newStock <= 5 ? "#F5C518" : "#4ADE80" }}>
                {newStock}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Delta (+ add / - remove)</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setDelta(d => d - 1)} className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0 text-white hover:bg-white/08 transition-colors" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}>
                <ArrowDown className="h-4 w-4" />
              </button>
              <input type="number" value={delta} onChange={e => setDelta(parseInt(e.target.value) || 0)}
                className="flex-1 rounded-xl px-4 text-center text-[18px] font-black text-white outline-none"
                style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "'Barlow Condensed', sans-serif" }} />
              <button onClick={() => setDelta(d => d + 1)} className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0 text-white hover:bg-white/08 transition-colors" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}>
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Reason</label>
            <div className="relative">
              <select value={reason} onChange={e => setReason(e.target.value)}
                className="w-full rounded-xl px-4 pr-10 text-[13px] font-semibold text-white outline-none appearance-none"
                style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}>
                {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Found extra units in back shelf"
              className="w-full rounded-xl px-4 text-[13px] text-white placeholder:text-white/20 outline-none"
              style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>

          {err && <p className="text-[12px] font-semibold text-[#F87171]">{err}</p>}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>Cancel</button>
          <button onClick={submit} disabled={busy || delta === 0}
            className="flex-1 h-10 rounded-xl text-[13px] font-black text-[#0D0D0D] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#F5C518" }}>
            {busy ? <span className="h-4 w-4 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" /> : <><Check className="h-4 w-4" /> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const ALERT_TABS = [
  { value: "",          label: "All"        },
  { value: "oos",       label: "Out of Stock"},
  { value: "low",       label: "Low Stock"  },
  { value: "overstock", label: "Overstock"  },
];

const VIEW_TABS = ["variants", "fast", "dead", "sports"] as const;
type ViewTab = typeof VIEW_TABS[number];

export default function InventoryPage() {
  const [data, setData]         = useState<ApiData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [debouncedQ, setDQ]     = useState("");
  const [alert, setAlert]       = useState("");
  const [page, setPage]         = useState(1);
  const [view, setView]         = useState<ViewTab>("variants");
  const [adjustTarget, setAdjust] = useState<VariantRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDQ(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (debouncedQ) params.set("q", debouncedQ);
    if (alert)      params.set("alert", alert);
    try {
      const res = await fetch(`/api/admin/inventory?${params}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [page, debouncedQ, alert]);

  useEffect(() => { load(); }, [load]);

  const kpi = data?.kpi;
  const sportMax = Math.max(...Object.values(data?.sportBreakdown ?? {}), 1);

  return (
    <div className="p-6 lg:p-8 max-w-[1300px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>Inventory</h1>
          <p className="text-white/40 text-[13px]">Stock levels · Movements · Valuation · Alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/admin/inventory/logs" className="rounded-xl px-3.5 py-2 text-[12px] font-bold text-white/50 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            Movement Log →
          </a>
          <a href="/admin/purchase-orders" className="rounded-xl px-3.5 py-2 text-[12px] font-bold text-white/50 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            Purchase Orders →
          </a>
          <button onClick={load} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Units",     value: kpi?.totalUnits?.toLocaleString("en-IN") ?? "—",  icon: Layers,       color: "#A78BFA", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" },
          { label: "Stock Value",     value: kpi ? fmt(kpi.stockValue)    : "—", icon: DollarSign,  color: "#4ADE80", bg: "rgba(74,222,128,0.08)",   border: "rgba(74,222,128,0.2)"  },
          { label: "Retail Value",    value: kpi ? fmt(kpi.retailValue)   : "—", icon: TrendingUp,  color: "#60A5FA", bg: "rgba(96,165,250,0.08)",   border: "rgba(96,165,250,0.2)"  },
          { label: "Potential Profit",value: kpi ? fmt(kpi.potentialProfit) : "—", icon: BarChart2, color: "#F5C518", bg: "rgba(245,197,24,0.08)",   border: "rgba(245,197,24,0.2)"  },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-white/50">{label}</p>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <p className="font-black text-white text-[22px] leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Alert badges */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Out of Stock", count: kpi?.outOfStockCount ?? 0, color: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", val: "oos"       },
          { label: "Low Stock",    count: kpi?.lowStockCount    ?? 0, color: "#F5C518", bg: "rgba(245,197,24,0.08)", border: "rgba(245,197,24,0.2)",   val: "low"       },
          { label: "Overstock",    count: kpi?.overstockCount   ?? 0, color: "#60A5FA", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)",   val: "overstock" },
        ].map(({ label, count, color, bg, border, val }) => (
          <button key={val} onClick={() => { setAlert(alert === val ? "" : val); setPage(1); setView("variants"); }}
            className="rounded-2xl p-4 text-left transition-all"
            style={{
              background: alert === val ? bg : "rgba(255,255,255,0.03)",
              border: `1px solid ${alert === val ? border : "rgba(255,255,255,0.06)"}`,
            }}>
            <p className="text-[11px] font-semibold text-white/50 mb-1">{label}</p>
            <p className="font-black text-[26px] leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: alert === val ? color : "white" }}>{count}</p>
          </button>
        ))}
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { value: "variants", label: "All Variants" },
          { value: "fast",     label: "Fast Moving"  },
          { value: "dead",     label: "Dead Stock"   },
          { value: "sports",   label: "By Sport"     },
        ].map(({ value, label }) => (
          <button key={value} onClick={() => setView(value as ViewTab)}
            className="shrink-0 rounded-xl px-3.5 py-2 text-[12px] font-bold whitespace-nowrap transition-all"
            style={{
              background: view === value ? "#F5C518" : "rgba(255,255,255,0.05)",
              color:      view === value ? "#0D0D0D"  : "rgba(255,255,255,0.45)",
              fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Variants tab ── */}
      {view === "variants" && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search SKU, product name..."
                className="w-full rounded-xl pl-10 pr-4 text-[13px] text-white placeholder:text-white/25 outline-none"
                style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }} />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>}
            </div>
            <div className="flex items-center gap-1.5">
              {ALERT_TABS.map(({ value, label }) => (
                <button key={value} onClick={() => { setAlert(value); setPage(1); }}
                  className="rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all whitespace-nowrap"
                  style={{
                    background: alert === value ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                    color:      alert === value ? "white" : "rgba(255,255,255,0.35)",
                    border: `1px solid ${alert === value ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="hidden lg:grid px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white/30 border-b"
              style={{ gridTemplateColumns: "1fr 120px 80px 80px 80px 80px 60px", borderColor: "rgba(255,255,255,0.05)" }}>
              <span>Product / SKU</span>
              <span>Category</span>
              <span className="text-right">Stock</span>
              <span className="text-right">Price</span>
              <span className="text-right">Cost</span>
              <span className="text-right">Value</span>
              <span />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-7 w-7 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin" />
              </div>
            ) : !data?.variants.length ? (
              <p className="text-center py-12 text-white/30 text-[13px]">No variants found</p>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {data.variants.map(v => (
                  <div key={v.variantId} className="hidden lg:grid px-5 py-3 items-center gap-3"
                    style={{ gridTemplateColumns: "1fr 120px 80px 80px 80px 80px 60px" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      {v.image
                        ? <img src={v.image} className="h-9 w-9 rounded-lg object-cover shrink-0 bg-[#222]" alt="" />
                        : <div className="h-9 w-9 rounded-lg bg-[#222] flex items-center justify-center shrink-0"><Package className="h-4 w-4 text-white/20" /></div>}
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-white/80 truncate">{v.productName}</p>
                        <p className="text-[10px] font-mono text-white/35">{v.sku}{v.size ? ` · ${v.size}` : ""}{v.color ? ` · ${v.color}` : ""}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-white/40 truncate">{v.category ?? "—"}</p>
                    <div className="text-right"><StockBadge stock={v.stock} /></div>
                    <p className="text-[12px] font-semibold text-white/70 text-right">{fmt(v.price)}</p>
                    <p className="text-[12px] text-white/40 text-right">{v.costPrice ? fmt(v.costPrice) : "—"}</p>
                    <p className="text-[12px] font-semibold text-white text-right">{v.costPrice ? fmt(v.costPrice * v.stock) : "—"}</p>
                    <div className="flex justify-end">
                      <button onClick={() => setAdjust(v)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/08 transition-all">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {data && data.variantsPages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-[12px] text-white/35">{((page-1)*50)+1}–{Math.min(page*50, data.variantsTotal)} of {data.variantsTotal}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className={cn("flex h-8 w-8 items-center justify-center rounded-lg", page === 1 ? "text-white/20 cursor-default" : "text-white/50 hover:text-white hover:bg-white/08")}><ChevronLeft className="h-4 w-4" /></button>
                <span className="text-[12px] font-semibold text-white/50">{page} / {data.variantsPages}</span>
                <button onClick={() => setPage(p => Math.min(data.variantsPages, p+1))} disabled={page === data.variantsPages} className={cn("flex h-8 w-8 items-center justify-center rounded-lg", page === data.variantsPages ? "text-white/20 cursor-default" : "text-white/50 hover:text-white hover:bg-white/08")}><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Fast Moving tab ── */}
      {view === "fast" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <TrendingUp className="h-4 w-4 text-[#4ADE80]" />
            <p className="text-[13px] font-bold text-white">Top 10 Fast-Moving (Last 30 Days)</p>
          </div>
          {!data?.fastMoving.length ? (
            <p className="text-center py-10 text-white/30 text-[13px]">No sales data yet</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {data.fastMoving.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="text-[14px] font-black text-white/20 w-5 text-center shrink-0"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{i + 1}</span>
                  {p.image
                    ? <img src={p.image} className="h-9 w-9 rounded-lg object-cover shrink-0 bg-[#222]" alt="" />
                    : <div className="h-9 w-9 rounded-lg bg-[#222] shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white/80 truncate">{p.productName}</p>
                    <p className="text-[11px] text-white/35">Stock: {p.totalStock}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-[#4ADE80] text-[18px] leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{p.soldQty}</p>
                    <p className="text-[10px] text-white/30">units sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Dead Stock tab ── */}
      {view === "dead" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <TrendingDown className="h-4 w-4 text-[#F87171]" />
            <p className="text-[13px] font-bold text-white">Dead Stock (No sales in 60+ days)</p>
          </div>
          {!data?.deadStock.length ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <p className="text-[13px] text-[#4ADE80] font-bold">No dead stock — great!</p>
              <p className="text-[11px] text-white/30">All active products have had sales in the past 60 days.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {data.deadStock.map(p => (
                <div key={p.productId} className="flex items-center gap-4 px-5 py-3.5">
                  {p.image
                    ? <img src={p.image} className="h-9 w-9 rounded-lg object-cover shrink-0 bg-[#222]" alt="" />
                    : <div className="h-9 w-9 rounded-lg bg-[#222] shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white/80 truncate">{p.productName}</p>
                    <p className="text-[11px] text-white/35">{p.totalStock} units · {fmt(p.stockValue)} tied up</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-bold text-[#F87171]">{fmt(p.retailValue)}</p>
                    <p className="text-[10px] text-white/30">retail value</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Sport Breakdown tab ── */}
      {view === "sports" && data?.sportBreakdown && (
        <div className="rounded-2xl p-6" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[13px] font-bold text-white mb-5">Stock by Sport</p>
          <div className="space-y-3">
            {Object.entries(data.sportBreakdown).sort(([, a], [, b]) => b - a).map(([sport, units]) => (
              <div key={sport} className="flex items-center gap-3">
                <span className="text-[12px] font-bold text-white/60 w-24 shrink-0 capitalize">{sport.toLowerCase()}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(units / sportMax) * 100}%`, background: "#F5C518" }} />
                </div>
                <span className="text-[12px] font-bold text-white w-16 text-right">{units.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {adjustTarget && (
        <AdjustModal
          variant={adjustTarget}
          onClose={() => setAdjust(null)}
          onSuccess={() => { setAdjust(null); load(); }}
        />
      )}
    </div>
  );
}
