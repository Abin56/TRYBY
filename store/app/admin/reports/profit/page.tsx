"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, TrendingUp, TrendingDown, Download } from "lucide-react";

interface ProfitSummary {
  revenue: number; cogs: number; shipping: number; packaging: number;
  gateway: number; profit: number; margin: number; units: number;
}
interface ProductRow {
  productId: string; name: string; revenue: number; cogs: number;
  shipping: number; packaging: number; gateway: number; profit: number;
  margin: number; units: number;
}
interface CategoryRow { name: string; revenue: number; profit: number; units: number; margin: number; }
interface DailyRow  { date: string; revenue: number; profit: number; }
interface ProfitData {
  summary:      { today: ProfitSummary; month: ProfitSummary; lastMonth: ProfitSummary; period: ProfitSummary; profitGrowth: number; gatewayFeeRate: number };
  topProfit:    ProductRow[];
  lowestMargin: ProductRow[];
  categories:   CategoryRow[];
  daily:        DailyRow[];
  days:         number;
  generatedAt:  string;
}

function fmt(n: number)  { return `₹${Math.round(n).toLocaleString("en-IN")}`; }
function fmtK(n: number) { return n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : fmt(n); }

function SummaryCard({ label, data, highlight }: { label: string; data: ProfitSummary; highlight?: boolean }) {
  const marginColor = data.margin >= 30 ? "#4ADE80" : data.margin >= 15 ? "#F5C518" : "#F87171";
  return (
    <div className="rounded-2xl p-5 space-y-3" style={{
      background: "#1A1A1A",
      border: `1px solid ${highlight ? "rgba(245,197,24,0.2)" : "rgba(255,255,255,0.06)"}`,
    }}>
      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-[28px] font-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: data.profit >= 0 ? "#4ADE80" : "#F87171" }}>
          {fmtK(data.profit)}
        </p>
        <span className="text-[12px] font-bold mb-0.5" style={{ color: marginColor }}>{data.margin}% margin</span>
      </div>
      <div className="space-y-1 pt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {[
          { label: "Revenue",   value: fmtK(data.revenue) },
          { label: "COGS",      value: `-${fmtK(data.cogs)}` },
          { label: "Shipping",  value: `-${fmtK(data.shipping)}` },
          { label: "Gateway",   value: `-${fmtK(data.gateway)}` },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-[10px] text-white/35">{row.label}</span>
            <span className="text-[11px] font-semibold text-white/60">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfitPage() {
  const [data, setData]     = useState<ProfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays]     = useState(30);
  const [tab, setTab]       = useState<"products" | "categories">("products");
  const [sortBy, setSortBy] = useState<"profit" | "margin">("profit");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/profit?days=${days}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent mb-3" />
      <p className="text-white/30 text-[13px]">Calculating profit…</p>
    </div>
  );
  if (!data) return <div className="p-8 text-white/40">Failed to load.</div>;

  const { summary: s, topProfit, lowestMargin, categories, daily } = data;
  const maxDailyProfit = Math.max(...daily.map(d => Math.abs(d.profit)), 1);
  const products = sortBy === "margin" ? lowestMargin : topProfit;

  return (
    <div className="p-6 lg:p-8 max-w-[1300px]">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
            Profit Dashboard
          </h1>
          <p className="text-white/40 text-[12px]">Gateway fee: {(s.gatewayFeeRate * 100).toFixed(0)}% applied to all transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={e => setDays(parseInt(e.target.value))}
            className="h-9 px-3 rounded-xl text-[12px] text-white outline-none bg-[#1A1A1A] border border-white/08">
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </select>
          <button onClick={load}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-semibold text-white/60 hover:text-white"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => window.open("/api/admin/products/export?type=profit", "_blank")}
            className="flex items-center gap-2 h-9 px-3 rounded-xl text-[12px] font-semibold text-white/60 hover:text-white"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Today"      data={s.today} />
        <SummaryCard label="This Month" data={s.month} highlight />
        <SummaryCard label="Last Month" data={s.lastMonth} />
        <SummaryCard label={`${days} Day Period`} data={s.period} />
      </div>

      {/* Growth banner */}
      <div className={`flex items-center gap-3 rounded-2xl px-5 py-4 mb-5 ${s.profitGrowth >= 0 ? "" : ""}`}
        style={{ background: s.profitGrowth >= 0 ? "rgba(74,222,128,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${s.profitGrowth >= 0 ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}` }}>
        {s.profitGrowth >= 0
          ? <TrendingUp className="h-5 w-5 text-[#4ADE80] shrink-0" />
          : <TrendingDown className="h-5 w-5 text-[#F87171] shrink-0" />}
        <p className="text-[13px] font-semibold" style={{ color: s.profitGrowth >= 0 ? "#4ADE80" : "#F87171" }}>
          Profit {s.profitGrowth >= 0 ? "up" : "down"} {Math.abs(s.profitGrowth)}% vs last month
        </p>
      </div>

      {/* Daily profit chart */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 className="text-white font-black text-[13px] mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Daily Profit — {days} days
        </h3>
        <div className="flex items-end gap-0.5 h-20">
          {daily.map(d => {
            const h    = Math.max(4, (Math.abs(d.profit) / maxDailyProfit) * 76);
            const neg  = d.profit < 0;
            const key  = d.date.slice(5); // MM-DD
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap rounded-lg px-2 py-1 text-[9px] text-white" style={{ background: "#2A2A2A" }}>
                  {d.date}: {fmtK(d.profit)}
                </div>
                <div className="w-full rounded-sm"
                  style={{ height: `${h}px`, background: neg ? "#F87171" : d.profit > 0 ? "#4ADE80" : "rgba(255,255,255,0.08)", opacity: 0.85 }} />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1 text-[9px] text-white/20">
          <span>{daily[0]?.date?.slice(5)}</span>
          <span>{daily[Math.floor(daily.length / 2)]?.date?.slice(5)}</span>
          <span>{daily[daily.length - 1]?.date?.slice(5)}</span>
        </div>
      </div>

      {/* Product / Category breakdown */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2">
            {[
              { key: "products",   label: "Products" },
              { key: "categories", label: "Categories" },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as "products" | "categories")}
                className="h-7 px-3 rounded-lg text-[11px] font-bold transition-all"
                style={{
                  background: tab === t.key ? "rgba(245,197,24,0.12)" : "transparent",
                  color: tab === t.key ? "#F5C518" : "rgba(255,255,255,0.4)",
                }}>
                {t.label}
              </button>
            ))}
          </div>
          {tab === "products" && (
            <div className="flex items-center gap-1.5">
              {[{ key: "profit", label: "Top Profit" }, { key: "margin", label: "Lowest Margin" }].map(s => (
                <button key={s.key} onClick={() => setSortBy(s.key as "profit" | "margin")}
                  className="h-6 px-2.5 rounded-full text-[10px] font-bold transition-all"
                  style={{
                    background: sortBy === s.key ? "rgba(245,197,24,0.12)" : "rgba(255,255,255,0.04)",
                    color: sortBy === s.key ? "#F5C518" : "rgba(255,255,255,0.35)",
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {tab === "products" && (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <div className="hidden md:grid px-5 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white/20"
              style={{ gridTemplateColumns: "32px 1fr 90px 80px 80px 80px 80px 70px" }}>
              <span>#</span><span>Product</span>
              <span className="text-right">Revenue</span><span className="text-right">COGS</span>
              <span className="text-right">Ship</span><span className="text-right">Gateway</span>
              <span className="text-right">Profit</span><span className="text-right">Margin</span>
            </div>
            {products.length === 0 && <p className="py-8 text-center text-white/30 text-[12px]">No data yet</p>}
            {products.map((p, i) => (
              <div key={p.productId} className="hidden md:grid items-center px-5 py-3 gap-3 hover:bg-white/[0.015]"
                style={{ gridTemplateColumns: "32px 1fr 90px 80px 80px 80px 80px 70px" }}>
                <span className="text-[11px] font-mono text-white/25">{i + 1}</span>
                <p className="text-[12px] font-semibold text-white truncate">{p.name}</p>
                <p className="text-[11px] text-white/60 text-right">{fmtK(p.revenue)}</p>
                <p className="text-[11px] text-[#F87171] text-right">-{fmtK(p.cogs)}</p>
                <p className="text-[11px] text-[#F87171] text-right">-{fmtK(p.shipping)}</p>
                <p className="text-[11px] text-[#F87171] text-right">-{fmtK(p.gateway)}</p>
                <p className="text-[12px] font-bold text-right" style={{ color: p.profit >= 0 ? "#4ADE80" : "#F87171" }}>{fmtK(p.profit)}</p>
                <p className="text-[11px] font-bold text-right"
                  style={{ color: p.margin >= 30 ? "#4ADE80" : p.margin >= 15 ? "#F5C518" : "#F87171" }}>
                  {p.margin}%
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === "categories" && (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {categories.length === 0 && <p className="py-8 text-center text-white/30 text-[12px]">No data yet</p>}
            {categories.map((c, i) => (
              <div key={c.name} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.015]">
                <span className="text-[11px] font-mono text-white/25 w-5">{i + 1}</span>
                <p className="flex-1 text-[12px] font-semibold text-white">{c.name}</p>
                <span className="text-[11px] text-white/40">{c.units} units</span>
                <span className="text-[11px] text-white/60">{fmtK(c.revenue)}</span>
                <span className="text-[12px] font-bold" style={{ color: c.profit >= 0 ? "#4ADE80" : "#F87171" }}>{fmtK(c.profit)}</span>
                <span className="text-[11px] font-bold w-12 text-right"
                  style={{ color: c.margin >= 30 ? "#4ADE80" : c.margin >= 15 ? "#F5C518" : "#F87171" }}>
                  {c.margin}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
