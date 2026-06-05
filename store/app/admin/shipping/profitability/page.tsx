"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, TrendingDown, Package, RotateCcw,
  Download, RefreshCw, ChevronDown, AlertTriangle,
  DollarSign, Truck, MapPin, ShoppingBag, ArrowUp, ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Overview {
  shippingRevenue: number;
  courierCost:     number;
  shippingProfit:  number;
  margin:          number;
  codCharges:      number;
  rtoCount:        number;
  rtoCost:         number;
  rtoRevenueLost:  number;
  totalOrders:     number;
}

interface FounderSummary {
  lastMonthShippingSpend:    number;
  lastMonthShippingRevenue:  number;
  lastMonthNetAfterShipping: number;
}

interface CourierRow {
  name:     string;
  orders:   number;
  revenue:  number;
  cost:     number;
  profit:   number;
  margin:   number;
  rtoCount: number;
  rtoCost:  number;
}

interface StateRow {
  state:   string;
  orders:  number;
  revenue: number;
  cost:    number;
  profit:  number;
}

interface ProductImpact {
  productId:      string;
  name:           string;
  slug:           string;
  unitsSold:      number;
  totalRevenue:   number;
  totalCogs:      number;
  totalShipping:  number;
  productProfit:  number;
  shippingImpact: number;
  isUnprofitable: boolean;
}

interface RtoProduct {
  productId:   string;
  name:        string;
  count:       number;
  cost:        number;
  revenueLost: number;
}

interface ProfitabilityData {
  period:         { days: number; since: string };
  overview:       Overview;
  founderSummary: FounderSummary;
  couriers:       CourierRow[];
  stateAnalysis:  StateRow[];
  productImpact:  ProductImpact[];
  rtoAnalysis: {
    count:       number;
    cost:        number;
    revenueLost: number;
    topProducts: RtoProduct[];
  };
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function inr(n: number, compact = false): string {
  if (compact && Math.abs(n) >= 100_000) {
    return "₹" + (n / 100_000).toFixed(1) + "L";
  }
  if (compact && Math.abs(n) >= 1_000) {
    return "₹" + (n / 1_000).toFixed(1) + "K";
  }
  return "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function sign(n: number): string {
  return n >= 0 ? "+" : "−";
}

const DAY_OPTIONS = [7, 14, 30, 60, 90];

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color, bg, border, icon: Icon, trend,
}: {
  label:   string;
  value:   string;
  sub?:    string;
  color:   string;
  bg:      string;
  border:  string;
  icon:    React.ElementType;
  trend?:  "up" | "down" | null;
}) {
  return (
    <div className="rounded-2xl p-4 sm:p-5 flex flex-col gap-2" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
        <Icon className="h-4 w-4 opacity-60" style={{ color }} />
      </div>
      <p className="font-black leading-none text-[28px] sm:text-[32px]"
        style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>
        {value}
      </p>
      {sub && (
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</p>
      )}
      {trend && (
        <div className="flex items-center gap-1">
          {trend === "up"
            ? <ArrowUp   className="h-3 w-3 text-[#4ADE80]" />
            : <ArrowDown className="h-3 w-3 text-[#F87171]" />}
        </div>
      )}
    </div>
  );
}

// ── Margin bar ────────────────────────────────────────────────────────────────

function MarginBar({ value }: { value: number }) {
  const clamped = Math.max(-100, Math.min(100, value));
  const isPos   = clamped >= 0;
  const width   = Math.abs(clamped);
  const color   = isPos ? (width >= 20 ? "#4ADE80" : "#F5C518") : "#F87171";

  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${width}%`, background: color }} />
      </div>
      <span className="text-[11px] font-bold w-10 text-right shrink-0" style={{ color }}>
        {isPos ? "" : "−"}{Math.abs(value).toFixed(1)}%
      </span>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
        style={{ background: "rgba(245,197,24,0.1)", border: "1px solid rgba(245,197,24,0.2)" }}>
        <Icon className="h-4 w-4 text-[#F5C518]" />
      </div>
      <div>
        <p className="text-[14px] font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.01em" }}>{title}</p>
        {sub && <p className="text-[11px] text-white/35">{sub}</p>}
      </div>
    </div>
  );
}

// ── Table wrapper ─────────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl overflow-hidden", className)}
      style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
      {children}
    </div>
  );
}

// ── COURIER TABLE ─────────────────────────────────────────────────────────────

function CourierTable({ couriers }: { couriers: CourierRow[] }) {
  const LABEL: Record<string, string> = {
    SHIPROCKET: "Shiprocket", DELHIVERY: "Delhivery", DTDC: "DTDC",
    INDIA_POST: "India Post", BLUEDART: "BlueDart", XPRESSBEES: "Xpressbees",
    ECOM_EXPRESS: "Ecom Express", OTHER: "Other", UNASSIGNED: "Unassigned",
  };

  if (!couriers.length) {
    return (
      <div className="py-12 text-center text-white/25 text-[13px]">No courier data for this period</div>
    );
  }

  return (
    <div>
      {/* Desktop header */}
      <div className="hidden lg:grid px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/25 border-b"
        style={{ gridTemplateColumns: "1.4fr 70px 90px 90px 90px 120px 70px 90px", borderColor: "rgba(255,255,255,0.05)" }}>
        <span>Courier</span>
        <span className="text-right">Orders</span>
        <span className="text-right">Revenue</span>
        <span className="text-right">Cost</span>
        <span className="text-right">Profit</span>
        <span className="text-right">Margin</span>
        <span className="text-right">RTOs</span>
        <span className="text-right">RTO Cost</span>
      </div>

      <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        {couriers.map((c) => {
          const profitColor = c.profit >= 0 ? "#4ADE80" : "#F87171";
          return (
            <div key={c.name}>
              {/* Desktop row */}
              <div className="hidden lg:grid px-5 py-3.5 items-center gap-2"
                style={{ gridTemplateColumns: "1.4fr 70px 90px 90px 90px 120px 70px 90px" }}>
                <p className="text-[13px] font-bold text-white/85">{LABEL[c.name] ?? c.name}</p>
                <p className="text-[13px] text-white/60 text-right">{c.orders}</p>
                <p className="text-[12px] font-semibold text-white/70 text-right">{inr(c.revenue)}</p>
                <p className="text-[12px] font-semibold text-[#F87171] text-right">{inr(c.cost)}</p>
                <p className="text-[12px] font-bold text-right" style={{ color: profitColor }}>
                  {sign(c.profit)}{inr(Math.abs(c.profit))}
                </p>
                <div className="flex justify-end"><MarginBar value={c.margin} /></div>
                <p className="text-[12px] text-white/40 text-right">{c.rtoCount}</p>
                <p className="text-[12px] text-[#FB923C] text-right">{inr(c.rtoCost)}</p>
              </div>

              {/* Mobile row */}
              <div className="lg:hidden px-4 py-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-white/85">{LABEL[c.name] ?? c.name}</p>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: c.profit >= 0 ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)", color: profitColor }}>
                    {sign(c.profit)}{inr(Math.abs(c.profit), true)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <p className="text-white/30">Orders</p>
                    <p className="text-white font-semibold">{c.orders}</p>
                  </div>
                  <div>
                    <p className="text-white/30">Revenue</p>
                    <p className="text-white/70 font-semibold">{inr(c.revenue, true)}</p>
                  </div>
                  <div>
                    <p className="text-white/30">Cost</p>
                    <p className="text-[#F87171] font-semibold">{inr(c.cost, true)}</p>
                  </div>
                </div>
                <MarginBar value={c.margin} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── STATE TABLE ───────────────────────────────────────────────────────────────

function StateTable({ rows, title, emptyMsg }: { rows: StateRow[]; title: string; emptyMsg: string }) {
  if (!rows.length) return <p className="text-[12px] text-white/30 py-4 text-center">{emptyMsg}</p>;

  return (
    <div>
      <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">{title}</p>
      <div className="space-y-2">
        {rows.slice(0, 8).map((s) => {
          const isPos = s.profit >= 0;
          const color = isPos ? "#4ADE80" : "#F87171";
          const maxAbs = Math.max(...rows.map(r => Math.abs(r.profit)), 1);
          const barW   = Math.round((Math.abs(s.profit) / maxAbs) * 100);
          return (
            <div key={s.state} className="flex items-center gap-3">
              <div className="w-[90px] sm:w-[120px] shrink-0">
                <p className="text-[12px] font-semibold text-white/80 truncate">{s.state}</p>
                <p className="text-[10px] text-white/30">{s.orders} orders</p>
              </div>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${barW}%`, background: color }} />
              </div>
              <p className="text-[12px] font-bold w-[72px] text-right shrink-0" style={{ color }}>
                {sign(s.profit)}{inr(Math.abs(s.profit), true)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PRODUCT IMPACT TABLE ──────────────────────────────────────────────────────

function ProductImpactTable({ products }: { products: ProductImpact[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? products : products.slice(0, 10);

  if (!products.length) {
    return <p className="text-[12px] text-white/30 py-6 text-center">No product data for this period</p>;
  }

  return (
    <div>
      {/* Desktop header */}
      <div className="hidden lg:grid px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/25 border-b"
        style={{ gridTemplateColumns: "1.5fr 60px 90px 90px 90px 90px 90px 70px", borderColor: "rgba(255,255,255,0.05)" }}>
        <span>Product</span>
        <span className="text-right">Units</span>
        <span className="text-right">Revenue</span>
        <span className="text-right">COGS</span>
        <span className="text-right">Shipping</span>
        <span className="text-right">Gross Profit</span>
        <span className="text-right">Shipping %</span>
        <span className="text-center">Flag</span>
      </div>

      <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        {visible.map((p) => {
          const flagColor = p.isUnprofitable ? "#F87171" : p.shippingImpact > 50 ? "#F5C518" : "#4ADE80";
          return (
            <div key={p.productId}>
              {/* Desktop */}
              <div className="hidden lg:grid px-5 py-3 items-center gap-2"
                style={{
                  gridTemplateColumns: "1.5fr 60px 90px 90px 90px 90px 90px 70px",
                  background: p.isUnprofitable ? "rgba(248,113,113,0.035)" : undefined,
                }}>
                <div className="flex items-center gap-2 min-w-0">
                  {p.isUnprofitable && <AlertTriangle className="h-3 w-3 text-[#F87171] shrink-0" />}
                  <p className="text-[12px] font-semibold text-white/80 truncate">{p.name}</p>
                </div>
                <p className="text-[12px] text-white/50 text-right">{p.unitsSold}</p>
                <p className="text-[12px] text-white/60 text-right">{inr(p.totalRevenue)}</p>
                <p className="text-[12px] text-white/50 text-right">{inr(p.totalCogs)}</p>
                <p className="text-[12px] text-[#F87171] text-right">{inr(p.totalShipping)}</p>
                <p className="text-[12px] font-semibold text-right"
                  style={{ color: p.productProfit >= 0 ? "#4ADE80" : "#F87171" }}>
                  {sign(p.productProfit)}{inr(Math.abs(p.productProfit))}
                </p>
                <div className="flex justify-end"><MarginBar value={Math.min(p.shippingImpact, 200)} /></div>
                <div className="flex justify-center">
                  {p.isUnprofitable
                    ? <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[rgba(248,113,113,0.15)] text-[#F87171]">LOSS</span>
                    : p.shippingImpact > 50
                    ? <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[rgba(245,197,24,0.12)] text-[#F5C518]">WARN</span>
                    : <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[rgba(74,222,128,0.1)] text-[#4ADE80]">OK</span>
                  }
                </div>
              </div>

              {/* Mobile */}
              <div className="lg:hidden px-4 py-3 space-y-1.5"
                style={{ background: p.isUnprofitable ? "rgba(248,113,113,0.04)" : undefined }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {p.isUnprofitable && <AlertTriangle className="h-3.5 w-3.5 text-[#F87171] shrink-0" />}
                    <p className="text-[12px] font-semibold text-white/80 truncate">{p.name}</p>
                  </div>
                  {p.isUnprofitable
                    ? <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[rgba(248,113,113,0.15)] text-[#F87171] shrink-0">LOSS</span>
                    : p.shippingImpact > 50
                    ? <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[rgba(245,197,24,0.12)] text-[#F5C518] shrink-0">WARN</span>
                    : null}
                </div>
                <div className="grid grid-cols-4 gap-1 text-[11px]">
                  <div><p className="text-white/30">Revenue</p><p className="text-white/60">{inr(p.totalRevenue, true)}</p></div>
                  <div><p className="text-white/30">Shipping</p><p className="text-[#F87171]">{inr(p.totalShipping, true)}</p></div>
                  <div><p className="text-white/30">Profit</p><p style={{ color: p.productProfit >= 0 ? "#4ADE80" : "#F87171" }}>{inr(p.productProfit, true)}</p></div>
                  <div><p className="text-white/30">Impact</p><p style={{ color: flagColor }}>{p.shippingImpact > 200 ? ">200" : p.shippingImpact}%</p></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {products.length > 10 && (
        <button onClick={() => setShowAll(v => !v)}
          className="w-full py-3 text-[12px] font-bold text-white/40 hover:text-white transition-colors border-t"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {showAll ? "Show Less" : `Show ${products.length - 10} more products`}
        </button>
      )}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function ShippingProfitabilityPage() {
  const [days, setDays]             = useState(30);
  const [data, setData]             = useState<ProfitabilityData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [exporting, setExporting]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/shipping/profitability?days=${days}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  async function exportCsv() {
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/shipping/profitability?days=${days}&format=csv`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `shipping-profitability-${days}d.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  }

  const ov    = data?.overview;
  const fs    = data?.founderSummary;
  const isPos = (ov?.shippingProfit ?? 0) >= 0;

  // State splits
  const profitableStates  = (data?.stateAnalysis ?? []).filter(s => s.profit >= 0);
  const lossStates        = (data?.stateAnalysis ?? []).filter(s => s.profit < 0).sort((a, b) => a.profit - b.profit);
  const unprofitableCount = (data?.productImpact ?? []).filter(p => p.isUnprofitable).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
            Shipping Profitability
          </h1>
          <p className="text-white/40 text-[13px]">Revenue · Cost · Margin · RTO · State & Product breakdown</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period picker */}
          <div className="relative">
            <button onClick={() => setShowPicker(v => !v)}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold text-white/50 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              Last {days}d <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showPicker && (
              <div className="absolute right-0 top-10 z-50 rounded-xl overflow-hidden py-1 w-36"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                {DAY_OPTIONS.map(d => (
                  <button key={d} onClick={() => { setDays(d); setShowPicker(false); }}
                    className="flex w-full px-4 py-2 text-[12px] font-semibold text-left hover:bg-white/[0.04] transition-colors"
                    style={{ color: days === d ? "#F5C518" : "rgba(255,255,255,0.6)" }}>
                    Last {d} days
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export */}
          <button onClick={exportCsv} disabled={exporting || loading}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold text-white/50 hover:text-white disabled:opacity-40 transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {exporting
              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              : <Download className="h-3.5 w-3.5" />}
            CSV
          </button>

          {/* Refresh */}
          <button onClick={load} disabled={loading}
            className="flex items-center justify-center h-9 w-9 rounded-xl text-white/40 hover:text-white disabled:opacity-40 transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin" />
        </div>
      ) : data ? (
        <div className="space-y-6">

          {/* ── A. FOUNDER SUMMARY CARD ── */}
          {fs && (
            <div className="rounded-2xl p-5 sm:p-6"
              style={{
                background: fs.lastMonthNetAfterShipping >= 0
                  ? "linear-gradient(135deg, rgba(74,222,128,0.07) 0%, rgba(245,197,24,0.05) 100%)"
                  : "linear-gradient(135deg, rgba(248,113,113,0.07) 0%, rgba(245,197,24,0.05) 100%)",
                border: `1px solid ${fs.lastMonthNetAfterShipping >= 0 ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
              }}>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                  style={{ background: "rgba(245,197,24,0.12)" }}>
                  <DollarSign className="h-4.5 w-4.5 text-[#F5C518]" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1">Last Month — Founder Summary</p>
                  <p className="text-[15px] sm:text-[17px] font-bold text-white leading-relaxed">
                    You spent{" "}
                    <span className="text-[#F87171] font-black">{inr(fs.lastMonthShippingSpend)}</span>
                    {" "}on shipping and{" "}
                    {fs.lastMonthNetAfterShipping >= 0 ? (
                      <>earned <span className="text-[#4ADE80] font-black">{inr(fs.lastMonthNetAfterShipping)}</span> net after shipping costs.</>
                    ) : (
                      <>lost <span className="text-[#F87171] font-black">{inr(Math.abs(fs.lastMonthNetAfterShipping))}</span> on shipping alone.</>
                    )}
                  </p>
                  {fs.lastMonthShippingRevenue > 0 && (
                    <p className="text-[12px] text-white/35 mt-1">
                      Collected {inr(fs.lastMonthShippingRevenue)} in shipping charges from customers.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── A. OVERVIEW CARDS ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">Overview · Last {days} days</p>
              {ov && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{
                    background: isPos ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                    color: isPos ? "#4ADE80" : "#F87171",
                  }}>
                  {ov.totalOrders} orders
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="Shipping Revenue"
                value={inr(ov?.shippingRevenue ?? 0, true)}
                sub="Collected from customers"
                color="#60A5FA"
                bg="rgba(96,165,250,0.07)"
                border="rgba(96,165,250,0.2)"
                icon={TrendingUp}
              />
              <StatCard
                label="Courier Cost"
                value={inr(ov?.courierCost ?? 0, true)}
                sub="Estimated dispatch cost"
                color="#F87171"
                bg="rgba(248,113,113,0.07)"
                border="rgba(248,113,113,0.2)"
                icon={Truck}
              />
              <StatCard
                label="Shipping Profit"
                value={(isPos ? "+" : "−") + inr(Math.abs(ov?.shippingProfit ?? 0), true)}
                sub={`${ov?.margin ?? 0}% margin`}
                color={isPos ? "#4ADE80" : "#F87171"}
                bg={isPos ? "rgba(74,222,128,0.07)" : "rgba(248,113,113,0.07)"}
                border={isPos ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}
                icon={isPos ? TrendingUp : TrendingDown}
              />
              <StatCard
                label="RTO Loss"
                value={inr(ov?.rtoCost ?? 0, true)}
                sub={`${ov?.rtoCount ?? 0} RTOs · ${inr(ov?.rtoRevenueLost ?? 0, true)} lost`}
                color="#FB923C"
                bg="rgba(251,146,60,0.07)"
                border="rgba(251,146,60,0.2)"
                icon={RotateCcw}
              />
            </div>

            {/* COD row */}
            {(ov?.codCharges ?? 0) > 0 && (
              <div className="mt-3 rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: "rgba(245,197,24,0.06)", border: "1px solid rgba(245,197,24,0.15)" }}>
                <p className="text-[12px] text-white/50">COD charges collected this period</p>
                <p className="text-[14px] font-black text-[#F5C518]">{inr(ov!.codCharges)}</p>
              </div>
            )}
          </div>

          {/* ── B. COURIER TABLE ── */}
          <Card>
            <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <SectionHeader icon={Truck} title="Courier Profitability" sub="Per-carrier breakdown" />
            </div>
            <CourierTable couriers={data.couriers} />
          </Card>

          {/* ── C. STATE ANALYSIS ── */}
          <div className="grid lg:grid-cols-2 gap-5">
            <Card className="p-5">
              <SectionHeader icon={MapPin} title="State Analysis" sub="Shipping profit / loss by destination" />
              <div className="space-y-6">
                <StateTable rows={profitableStates} title="Top Profitable States" emptyMsg="No profitable states yet" />
                {lossStates.length > 0 && (
                  <StateTable rows={lossStates} title="Top Loss-Making States" emptyMsg="" />
                )}
              </div>
            </Card>

            {/* ── E. RTO ANALYSIS ── */}
            <Card className="p-5">
              <SectionHeader icon={RotateCcw} title="RTO Cost Analysis" sub="Return-to-origin impact" />
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "RTOs",         value: String(data.rtoAnalysis.count),              color: "#FB923C" },
                  { label: "RTO Cost",     value: inr(data.rtoAnalysis.cost, true),            color: "#F87171" },
                  { label: "Revenue Lost", value: inr(data.rtoAnalysis.revenueLost, true),     color: "#F87171" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl p-3 text-center"
                    style={{ background: "rgba(251,146,60,0.07)", border: "1px solid rgba(251,146,60,0.15)" }}>
                    <p className="text-[10px] text-white/35 mb-1">{label}</p>
                    <p className="text-[16px] font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
                  </div>
                ))}
              </div>

              {data.rtoAnalysis.topProducts.length > 0 ? (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-3">Top Affected Products</p>
                  <div className="space-y-2.5">
                    {data.rtoAnalysis.topProducts.slice(0, 6).map((p) => (
                      <div key={p.productId} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-white/75 truncate">{p.name}</p>
                          <p className="text-[10px] text-white/30">{p.count} RTO{p.count !== 1 ? "s" : ""}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[12px] font-bold text-[#F87171]">{inr(p.cost, true)}</p>
                          <p className="text-[10px] text-white/30">{inr(p.revenueLost, true)} lost</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[12px] text-white/25 text-center py-4">No RTO data this period</p>
              )}
            </Card>
          </div>

          {/* ── D. PRODUCT IMPACT ── */}
          <Card>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <SectionHeader icon={ShoppingBag} title="Product Shipping Impact" sub="Where shipping erodes product margin" />
              {unprofitableCount > 0 && (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#F87171] bg-[rgba(248,113,113,0.12)] px-3 py-1.5 rounded-xl shrink-0">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {unprofitableCount} unprofitable
                </span>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {[
                { color: "#F87171", label: "LOSS — shipping cost > product profit" },
                { color: "#F5C518", label: "WARN — shipping > 50% of profit" },
                { color: "#4ADE80", label: "OK" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                  <span className="text-[10px] text-white/40">{label}</span>
                </div>
              ))}
            </div>

            <ProductImpactTable products={data.productImpact} />
          </Card>

          {/* Period note */}
          <p className="text-[11px] text-white/20 text-center pb-4">
            Data covers orders from {new Date(data.period.since).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} · Courier cost estimated from product-level shipping cost settings.
          </p>

        </div>
      ) : (
        <div className="flex items-center justify-center py-24 text-white/25 text-[13px]">Failed to load data</div>
      )}
    </div>
  );
}
