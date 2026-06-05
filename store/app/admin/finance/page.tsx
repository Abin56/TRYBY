"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, TrendingDown, IndianRupee, Clock, CheckCircle,
  ShieldAlert, Download, RefreshCw, ArrowUpRight, ArrowDownRight,
  Wallet, BarChart2, Package, Users, AlertTriangle, ChevronDown,
} from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────

type ProfitSlice = {
  revenue: number; supplierCosts: number; refunds: number;
  shipping: number; gatewayFees: number; commission: number;
  gst: number; grossProfit: number; netProfit: number; margin: number;
};

type CashSlice = {
  incoming: number; outgoing: number;
  payoutsOut: number; refundsOut: number; net: number;
};

type SettlSlice = { count: number; amount: number };

type MonthRow = {
  month: string; revenue: number; supplierCosts: number;
  refunds: number; shipping: number; gatewayFees: number;
  grossProfit: number; netProfit: number; margin: number;
};

type Supplier = {
  id: string; companyName: string; tier: string; commissionRate: number;
  totalSales: number; totalOrders: number; lifetimeEarnings: number;
  availableBalance?: number;
  user?: { name: string; email: string };
};

type TopProduct = {
  productId: string | null;
  product: { id: string; name: string; slug: string } | null;
  amount: number; count: number;
};

type DayPoint = { date: string; gmv: number; commission: number };

type FinanceData = {
  revenue: {
    today: number; yesterday: number; week: number;
    month: number; lifetime: number;
    last30: number; prev30: number; growthPct: number;
  };
  profit: { month: ProfitSlice; lifetime: ProfitSlice };
  settlements: {
    openDisputes: number; totalLiability: number;
    holding: SettlSlice; available: SettlSlice; paid: SettlSlice;
  };
  cashFlow: { month: CashSlice; lifetime: CashSlice };
  topSuppliers: { byRevenue: Supplier[]; byOrders: Supplier[] };
  refunds: {
    lifetime: { amount: number; count: number };
    month:    { amount: number; count: number };
    last30:   { amount: number; count: number };
    ratePct: number; growthPct: number;
    topProducts: TopProduct[];
  };
  monthlyPnL: MonthRow[];
  dailySparkline: DayPoint[];
  meta: { generatedAt: string; gatewayFeeRate: number; shippingCostPct: number };
};

// ── Formatting ────────────────────────────────────────────────────────────

function fmt(n: number, compact = false): string {
  if (compact) {
    if (Math.abs(n) >= 10_00_000) return `₹${(n / 10_00_000).toFixed(1)}L`;
    if (Math.abs(n) >= 1_000)    return `₹${(n / 1_000).toFixed(1)}K`;
    return `₹${Math.round(n)}`;
  }
  return `₹${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(n: number, suffix = "%"): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}${suffix}`;
}

function fmtMonth(iso: string): string {
  const [y, m] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m) - 1]} ${y}`;
}

// ── Mini sparkline ────────────────────────────────────────────────────────

function Sparkline({ data, color = "#F5C518" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const h = 36;
  const w = 120;
  const step = w / Math.max(data.length - 1, 1);
  const pts = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Growth badge ──────────────────────────────────────────────────────────

function GrowthBadge({ pct: p }: { pct: number }) {
  const up = p >= 0;
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold rounded-full px-1.5 py-0.5"
      style={{
        background: up ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
        color:      up ? "#4ADE80" : "#F87171",
      }}>
      {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {Math.abs(p).toFixed(1)}%
    </span>
  );
}

// ── Section header ────────────────────────────────────────────────────────

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
        {title}
      </h2>
      {sub && <p className="text-[11px] text-white/35 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Card shell ────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl ${className}`}
      style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
      {children}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function FinanceCenterPage() {
  const [data,        setData]        = useState<FinanceData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [exporting,   setExporting]   = useState(false);
  const [profitView,  setProfitView]  = useState<"month" | "lifetime">("month");
  const [cashView,    setCashView]    = useState<"month" | "lifetime">("month");
  const [supplierTab, setSupplierTab] = useState<"revenue" | "orders">("revenue");
  const [pnlExpanded, setPnlExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/finance");
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function exportCSV() {
    setExporting(true);
    try {
      const res  = await fetch("/api/admin/finance?export=csv");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "tryby-pnl.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#0D0D0D" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
          <p className="text-white/30 text-[13px]">Loading finance data…</p>
        </div>
      </div>
    );
  }

  const { revenue, profit, settlements, cashFlow, topSuppliers, refunds, monthlyPnL, dailySparkline } = data;
  const P  = profit[profitView];
  const CF = cashFlow[cashView];
  const gmvSparkline = dailySparkline.map(d => d.gmv);
  const commSparkline = dailySparkline.map(d => d.commission);

  const pnlRows = pnlExpanded ? monthlyPnL : monthlyPnL.slice(-6);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-[1200px]" style={{ background: "#0D0D0D" }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "32px", letterSpacing: "0.02em" }}>
            Finance Center
          </h1>
          <p className="text-white/35 text-[13px] mt-0.5">
            TRYBY financial command center · Updated {new Date(data.meta.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/30 hover:text-white hover:bg-white/08 transition-all">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={exportCSV} disabled={exporting}
            className="flex items-center gap-2 rounded-xl px-4 py-2 font-black text-[12px] hover:brightness-110 disabled:opacity-40 transition-all"
            style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}>
            <Download className="h-3.5 w-3.5" />
            {exporting ? "Exporting…" : "Export P&L"}
          </button>
        </div>
      </div>

      {/* ── 1. Revenue Overview ──────────────────────────────────────────── */}
      <div className="mb-8">
        <SectionHead title="Revenue Overview" sub="Customer payments received (GMV)" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Today",     value: revenue.today,     color: "#F5C518", growth: null },
            { label: "Yesterday", value: revenue.yesterday, color: "#60A5FA", growth: null },
            { label: "This Week", value: revenue.week,      color: "#A78BFA", growth: null },
            { label: "This Month",value: revenue.month,     color: "#4ADE80", growth: null },
            { label: "Lifetime",  value: revenue.lifetime,  color: "#F87171", growth: revenue.growthPct },
          ].map(card => (
            <Card key={card.label} className="p-4">
              <p className="text-[10px] text-white/35 mb-2 uppercase tracking-widest">{card.label}</p>
              <p className="font-black leading-none mb-1"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", color: card.color }}>
                {fmt(card.value, true)}
              </p>
              <p className="text-[10px] text-white/25">{fmt(card.value)}</p>
              {card.growth !== null && (
                <div className="mt-2">
                  <GrowthBadge pct={card.growth} />
                  <p className="text-[9px] text-white/20 mt-1">vs prev 30 days</p>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Sparkline */}
        {dailySparkline.length > 0 && (
          <Card className="mt-3 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[12px] font-semibold text-white/50">Daily Revenue — Last 30 Days</p>
              <div className="flex items-center gap-4 text-[10px] text-white/30">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#F5C518]" /> GMV</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#4ADE80]" /> Commission</span>
              </div>
            </div>
            <div className="w-full overflow-x-auto">
              <div className="flex gap-1 min-w-[600px]">
                {dailySparkline.map((d, i) => {
                  const maxGmv = Math.max(...dailySparkline.map(x => x.gmv), 1);
                  const hGmv   = Math.round((d.gmv / maxGmv) * 80);
                  const hComm  = Math.round((d.commission / maxGmv) * 80);
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                      <div className="flex items-end gap-0.5 h-20">
                        <div className="w-2 rounded-t-sm transition-all"
                          style={{ height: `${hGmv}px`, background: hGmv > 0 ? "#F5C518" : "transparent", minHeight: hGmv > 0 ? "2px" : "0" }} />
                        <div className="w-2 rounded-t-sm transition-all"
                          style={{ height: `${hComm}px`, background: hComm > 0 ? "#4ADE80" : "transparent", minHeight: hComm > 0 ? "2px" : "0" }} />
                      </div>
                      <p className="text-[8px] text-white/20 rotate-45 origin-left mt-1 hidden group-hover:block absolute bottom-0">
                        {d.date.slice(5)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* ── 2. Profit Center ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <SectionHead title="Profit Center" sub="Platform earnings after all deductions" />
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            {(["month","lifetime"] as const).map(v => (
              <button key={v} onClick={() => setProfitView(v)}
                className="px-4 py-1.5 text-[11px] font-bold capitalize transition-all"
                style={{
                  background: profitView === v ? "#F5C518" : "transparent",
                  color:      profitView === v ? "#0D0D0D" : "rgba(255,255,255,0.35)",
                }}>
                {v === "month" ? "This Month" : "All Time"}
              </button>
            ))}
          </div>
        </div>

        {/* Waterfall */}
        <Card className="p-6 mb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Waterfall breakdown */}
            <div className="space-y-3">
              {[
                { label: "Gross Revenue (GMV)",    value:  P.revenue,       color: "#60A5FA", sign: "+" },
                { label: "Supplier Costs",          value: -P.supplierCosts, color: "#F87171", sign: "−" },
                { label: "Refunds Issued",          value: -P.refunds,       color: "#F87171", sign: "−" },
                { label: "Shipping Costs",          value: -P.shipping,      color: "#F87171", sign: "−" },
                { label: "Payment Gateway Fees",    value: -P.gatewayFees,   color: "#F87171", sign: "−" },
              ].map((row, i) => (
                <div key={row.label}>
                  {i === 2 && (
                    <div className="border-t my-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-[12px] font-bold text-white/60">Gross Profit (Commission − Refunds)</span>
                        <span className="font-black text-[14px]"
                          style={{ color: P.grossProfit >= 0 ? "#4ADE80" : "#F87171", fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {fmt(P.grossProfit, true)}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold w-4 text-center" style={{ color: row.color }}>{row.sign}</span>
                      <span className="text-[12px] text-white/50">{row.label}</span>
                    </div>
                    <span className="text-[13px] font-semibold" style={{ color: row.color }}>
                      {fmt(Math.abs(row.value), true)}
                    </span>
                  </div>
                  {/* Bar */}
                  <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${Math.min(100, (Math.abs(row.value) / Math.max(P.revenue, 1)) * 100)}%`, background: row.color }} />
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 mt-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-black text-white">Net Profit</span>
                  <span className="font-black text-[20px]"
                    style={{ color: P.netProfit >= 0 ? "#4ADE80" : "#F87171", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {fmt(P.netProfit)}
                  </span>
                </div>
                <p className="text-[11px] mt-1" style={{ color: P.margin >= 0 ? "#4ADE80" : "#F87171" }}>
                  {P.margin.toFixed(1)}% net margin
                </p>
              </div>
            </div>

            {/* Profit KPI cards */}
            <div className="grid grid-cols-2 gap-3 content-start">
              {[
                { label: "Commission Earned",  value: P.commission,   color: "#F5C518" },
                { label: "GST Collected",      value: P.gst,          color: "#A78BFA" },
                { label: "Gross Profit",       value: P.grossProfit,  color: "#4ADE80" },
                { label: "Net Profit",         value: P.netProfit,    color: P.netProfit >= 0 ? "#4ADE80" : "#F87171" },
              ].map(k => (
                <div key={k.label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <p className="text-[10px] text-white/30 mb-1">{k.label}</p>
                  <p className="font-black text-[18px] leading-none"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", color: k.color }}>
                    {fmt(k.value, true)}
                  </p>
                  <p className="text-[9px] text-white/20 mt-0.5">{fmt(k.value)}</p>
                </div>
              ))}

              {/* Margin donut-ish */}
              <div className="col-span-2 rounded-xl p-4 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="relative h-14 w-14 shrink-0">
                  <svg viewBox="0 0 36 36" className="rotate-[-90deg]">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke={P.margin >= 0 ? "#4ADE80" : "#F87171"} strokeWidth="3"
                      strokeDasharray={`${Math.min(100, Math.max(0, P.margin))} 100`}
                      strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white">
                    {P.margin.toFixed(0)}%
                  </span>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-white/60">Net Margin</p>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    Estimated — {(data.meta.gatewayFeeRate * 100).toFixed(0)}% gateway + {(data.meta.shippingCostPct * 100).toFixed(0)}% shipping assumed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── 3. Settlement Overview + 4. Cash Flow (side by side) ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">

        {/* Settlements */}
        <div>
          <SectionHead title="Settlement Overview" sub="Money owed to suppliers" />
          <Card className="p-5 h-full">
            <div className="space-y-3">
              {[
                { label: "In Holding (7-day lock)", value: settlements.holding.amount,   count: settlements.holding.count,   color: "#F5C518", icon: Clock },
                { label: "Available to Pay Out",     value: settlements.available.amount, count: settlements.available.count, color: "#4ADE80", icon: CheckCircle },
                { label: "Total Liability",           value: settlements.totalLiability,  count: null,                        color: "#60A5FA", icon: Wallet },
                { label: "Settled (Paid)",            value: settlements.paid.amount,     count: settlements.paid.count,      color: "#A78BFA", icon: IndianRupee },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${row.color}18` }}>
                    <row.icon className="h-4 w-4" style={{ color: row.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-white/50">{row.label}</p>
                    {row.count !== null && (
                      <p className="text-[10px] text-white/25">{row.count} orders</p>
                    )}
                  </div>
                  <p className="font-black text-[16px] shrink-0"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", color: row.color }}>
                    {fmt(row.value, true)}
                  </p>
                </div>
              ))}

              <div className="border-t pt-3 mt-1 flex items-center justify-between"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-[#F87171]" />
                  <p className="text-[12px] text-white/50">Open Disputes</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-[16px] text-[#F87171]"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {settlements.openDisputes}
                  </span>
                  <Link href="/admin/supplier-settlements?disputed=true"
                    className="text-[10px] text-white/30 hover:text-white transition-colors">
                    View →
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Cash Flow */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <SectionHead title="Cash Flow" />
            <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              {(["month","lifetime"] as const).map(v => (
                <button key={v} onClick={() => setCashView(v)}
                  className="px-3 py-1 text-[10px] font-bold capitalize transition-all"
                  style={{
                    background: cashView === v ? "#F5C518" : "transparent",
                    color:      cashView === v ? "#0D0D0D" : "rgba(255,255,255,0.35)",
                  }}>
                  {v === "month" ? "Month" : "All Time"}
                </button>
              ))}
            </div>
          </div>
          <Card className="p-5 h-full">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "rgba(74,222,128,0.10)" }}>
                  <ArrowUpRight className="h-4 w-4 text-[#4ADE80]" />
                </div>
                <div className="flex-1">
                  <p className="text-[12px] text-white/50">Customer Payments In</p>
                  <p className="text-[10px] text-white/25">Captured via Razorpay</p>
                </div>
                <p className="font-black text-[18px] text-[#4ADE80]"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {fmt(CF.incoming, true)}
                </p>
              </div>

              <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.08)" }}>
                <div className="flex items-center gap-2 text-[12px]">
                  <ArrowDownRight className="h-4 w-4 text-[#F87171] shrink-0" />
                  <span className="text-white/50 flex-1">Supplier Payouts</span>
                  <span className="font-bold text-[#F87171]">{fmt(CF.payoutsOut, true)}</span>
                </div>
                <div className="flex items-center gap-2 text-[12px]">
                  <ArrowDownRight className="h-4 w-4 text-[#F87171] shrink-0" />
                  <span className="text-white/50 flex-1">Refunds Issued</span>
                  <span className="font-bold text-[#F87171]">{fmt(CF.refundsOut, true)}</span>
                </div>
                <div className="border-t pt-2 flex items-center justify-between"
                  style={{ borderColor: "rgba(248,113,113,0.15)" }}>
                  <span className="text-[11px] text-white/40">Total Outgoing</span>
                  <span className="font-black text-[14px] text-[#F87171]"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {fmt(CF.outgoing, true)}
                  </span>
                </div>
              </div>

              <div className="border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-black text-white">Net Cash Position</span>
                  <span className="font-black text-[20px]"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", color: CF.net >= 0 ? "#4ADE80" : "#F87171" }}>
                    {CF.net >= 0 ? "+" : "−"}{fmt(Math.abs(CF.net), true)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── 5. Top Suppliers ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <SectionHead title="Top Suppliers" sub="Ranked by contribution to TRYBY" />
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            {(["revenue","orders"] as const).map(v => (
              <button key={v} onClick={() => setSupplierTab(v)}
                className="px-3 py-1 text-[10px] font-bold capitalize transition-all"
                style={{
                  background: supplierTab === v ? "#F5C518" : "transparent",
                  color:      supplierTab === v ? "#0D0D0D" : "rgba(255,255,255,0.35)",
                }}>
                {v === "revenue" ? "By Revenue" : "By Orders"}
              </button>
            ))}
          </div>
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-white/30 text-[10px]"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["#","Supplier","Tier","Commission","Sales","Orders","Lifetime Earned",""].map(h => (
                    <th key={h} className="py-3 px-4 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {(supplierTab === "revenue" ? topSuppliers.byRevenue : topSuppliers.byOrders).map((s, i) => (
                  <tr key={s.id} className="hover:bg-white/02 transition-colors">
                    <td className="py-3 px-4 text-white/25 font-mono">#{i + 1}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white/80">{s.companyName}</p>
                      {s.user && <p className="text-[10px] text-white/30">{s.user.email}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                        style={{
                          background: s.tier === "GOLD" ? "rgba(245,197,24,0.15)" : s.tier === "SILVER" ? "rgba(148,163,184,0.15)" : "rgba(205,127,50,0.15)",
                          color:      s.tier === "GOLD" ? "#F5C518"               : s.tier === "SILVER" ? "#94A3B8"               : "#CD7F32",
                        }}>
                        {s.tier}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/50">
                      {(Number(s.commissionRate) * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 font-semibold text-white/70">
                      {fmt(Number(s.totalSales), true)}
                    </td>
                    <td className="py-3 px-4 text-white/50">{s.totalOrders}</td>
                    <td className="py-3 px-4 font-bold text-[#4ADE80]">
                      {fmt(Number(s.lifetimeEarnings), true)}
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/admin/suppliers/${s.id}`}
                        className="text-[10px] text-white/30 hover:text-white transition-colors">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── 6. Refund Analytics ───────────────────────────────────────────── */}
      <div className="mb-8">
        <SectionHead title="Refund Analytics" sub="Returns and refunds impact on revenue" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* KPI cards */}
          <div className="space-y-3">
            {[
              { label: "Refund Rate (30d)",  value: `${refunds.ratePct.toFixed(2)}%`, sub: "of GMV refunded", color: refunds.ratePct > 5 ? "#F87171" : "#4ADE80" },
              { label: "Refunds This Month", value: fmt(refunds.month.amount, true),  sub: `${refunds.month.count} orders`, color: "#F87171" },
              { label: "Refunds Lifetime",   value: fmt(refunds.lifetime.amount, true), sub: `${refunds.lifetime.count} total`, color: "#9CA3AF" },
            ].map(k => (
              <Card key={k.label} className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[11px] text-white/35 mb-1">{k.label}</p>
                  <p className="font-black text-[22px]"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", color: k.color }}>
                    {k.value}
                  </p>
                  <p className="text-[10px] text-white/25">{k.sub}</p>
                </div>
                {refunds.growthPct !== 0 && k.label.includes("30d") && (
                  <GrowthBadge pct={-refunds.growthPct} />
                )}
              </Card>
            ))}
          </div>

          {/* Top refunded products */}
          <div className="lg:col-span-2">
            <Card className="p-5">
              <p className="text-[12px] font-semibold text-white/50 mb-4">Top Refunded Products</p>
              {refunds.topProducts.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-white/25 text-[13px]">No refunds yet 🎉</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {refunds.topProducts.map((p, i) => {
                    const maxAmt = refunds.topProducts[0]?.amount ?? 1;
                    return (
                      <div key={p.productId ?? i} className="flex items-center gap-3">
                        <span className="text-[10px] text-white/20 w-4 font-mono shrink-0">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-white/70 truncate">
                            {p.product?.name ?? "Unknown Product"}
                          </p>
                          <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <div className="h-full rounded-full bg-[#F87171]"
                              style={{ width: `${(p.amount / maxAmt) * 100}%` }} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[12px] font-bold text-[#F87171]">{fmt(p.amount, true)}</p>
                          <p className="text-[9px] text-white/25">{p.count} returns</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* ── 7. Monthly P&L ──────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <SectionHead title="Monthly P&L" sub="13-month revenue, cost, and profit view" />
          <button onClick={() => setPnlExpanded(e => !e)}
            className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/60 transition-colors">
            {pnlExpanded ? "Show Less" : "Show All"}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${pnlExpanded ? "rotate-180" : ""}`} />
          </button>
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-white/30 text-[10px]"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Month","Revenue","Supplier Costs","Refunds","Shipping","Gateway","Gross Profit","Net Profit","Margin"].map(h => (
                    <th key={h} className="py-3 px-4 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {pnlRows.map(row => (
                  <tr key={row.month} className="hover:bg-white/02 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white/70 whitespace-nowrap">{fmtMonth(row.month)}</td>
                    <td className="py-3 px-4 text-white/60 whitespace-nowrap">{fmt(row.revenue, true)}</td>
                    <td className="py-3 px-4 text-[#F87171] whitespace-nowrap">{fmt(row.supplierCosts, true)}</td>
                    <td className="py-3 px-4 text-[#F87171] whitespace-nowrap">{fmt(row.refunds, true)}</td>
                    <td className="py-3 px-4 text-[#F87171] whitespace-nowrap">{fmt(row.shipping, true)}</td>
                    <td className="py-3 px-4 text-[#F87171] whitespace-nowrap">{fmt(row.gatewayFees, true)}</td>
                    <td className="py-3 px-4 font-bold whitespace-nowrap"
                      style={{ color: row.grossProfit >= 0 ? "#4ADE80" : "#F87171" }}>
                      {fmt(row.grossProfit, true)}
                    </td>
                    <td className="py-3 px-4 font-bold whitespace-nowrap"
                      style={{ color: row.netProfit >= 0 ? "#4ADE80" : "#F87171" }}>
                      {fmt(row.netProfit, true)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                        style={{
                          background: row.margin >= 0 ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
                          color:      row.margin >= 0 ? "#4ADE80" : "#F87171",
                        }}>
                        {row.margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {monthlyPnL.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <td className="py-3 px-4 font-black text-white/70 text-[11px]">TOTAL</td>
                    {[
                      monthlyPnL.reduce((s, r) => s + r.revenue, 0),
                      monthlyPnL.reduce((s, r) => s + r.supplierCosts, 0),
                      monthlyPnL.reduce((s, r) => s + r.refunds, 0),
                      monthlyPnL.reduce((s, r) => s + r.shipping, 0),
                      monthlyPnL.reduce((s, r) => s + r.gatewayFees, 0),
                      monthlyPnL.reduce((s, r) => s + r.grossProfit, 0),
                      monthlyPnL.reduce((s, r) => s + r.netProfit, 0),
                    ].map((v, i) => (
                      <td key={i} className="py-3 px-4 font-black text-[12px] whitespace-nowrap"
                        style={{ color: i >= 5 ? (v >= 0 ? "#4ADE80" : "#F87171") : "rgba(255,255,255,0.50)" }}>
                        {fmt(v, true)}
                      </td>
                    ))}
                    <td className="py-3 px-4" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      </div>

      {/* ── Footer note ─────────────────────────────────────────────────── */}
      <p className="text-[10px] text-white/15 text-center pb-4">
        Shipping cost estimated at {(data.meta.shippingCostPct * 100).toFixed(0)}% of GMV · Gateway fee at {(data.meta.gatewayFeeRate * 100).toFixed(0)}% (Razorpay standard) · Configure in /api/admin/finance
      </p>

    </div>
  );
}
