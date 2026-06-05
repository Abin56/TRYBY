"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, RefreshCw, DollarSign, Package, Truck, Percent } from "lucide-react";

interface Summary {
  revenue: number; cogs: number; shippingCost: number;
  profit: number; margin: number;
  orderCount: number; missingCostVariants: number;
}
interface ProductProfit {
  productId: string; name: string;
  revenue: number; cogs: number; shippingCost: number;
  unitsSold: number; profit: number; margin: number;
}

const RANGES = [
  { label: "7 days",  days: 7  },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

function fmt(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function MarginBar({ margin }: { margin: number }) {
  const capped = Math.max(0, Math.min(100, margin));
  const color = margin >= 40 ? "#4ADE80" : margin >= 20 ? "#F5C518" : "#F87171";
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${capped}%`, background: color }} />
      </div>
      <span className="text-[11px] font-bold shrink-0" style={{ color }}>{margin.toFixed(1)}%</span>
    </div>
  );
}

export default function ProfitPage() {
  const [data, setData] = useState<{ summary: Summary; products: ProductProfit[]; days: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/profit?days=${days}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [days]); // eslint-disable-line

  const s = data?.summary;

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Profit Dashboard
          </h1>
          <p className="text-white/40 text-[13px]">Revenue minus cost of goods and shipping — per product</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            {RANGES.map(r => (
              <button key={r.days} onClick={() => setDays(r.days)}
                className="rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
                style={{
                  background: days === r.days ? "#F5C518" : "transparent",
                  color: days === r.days ? "#0D0D0D" : "rgba(255,255,255,0.40)",
                }}>
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={load} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Missing cost price alert */}
      {s && s.missingCostVariants > 0 && (
        <div className="flex items-center gap-3 rounded-2xl px-5 py-4 mb-5" style={{ background: "rgba(245,197,24,0.06)", border: "1px solid rgba(245,197,24,0.2)" }}>
          <AlertTriangle className="h-5 w-5 text-[#F5C518] shrink-0" />
          <p className="text-[13px] text-white/70">
            <strong className="text-[#F5C518]">{s.missingCostVariants} variants</strong> have no cost price set — profit calculations for those are incomplete.
            Set cost prices in <a href="/admin/products" className="text-[#F5C518] underline">Products → Variants & Images</a>.
          </p>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: DollarSign, label: "Revenue",     value: s ? fmt(s.revenue)       : "—", color: "#4ADE80", sub: `${s?.orderCount ?? 0} orders` },
          { icon: Package,    label: "Cost of Goods",value: s ? fmt(s.cogs)          : "—", color: "#F87171", sub: "Purchase cost" },
          { icon: Truck,      label: "Shipping Cost",value: s ? fmt(s.shippingCost)  : "—", color: "#F5C518", sub: "Fulfillment cost" },
          { icon: Percent,    label: "Net Profit",   value: s ? fmt(s.profit)        : "—", color: s && s.profit >= 0 ? "#4ADE80" : "#F87171", sub: s ? `${s.margin.toFixed(1)}% margin` : "" },
        ].map(({ icon: Icon, label, value, color, sub }) => (
          <div key={label} className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl mb-3" style={{ background: `${color}18` }}>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-[22px] font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{loading ? "…" : value}</p>
            {sub && <p className="text-[11px] text-white/30 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Profit waterfall */}
      {s && (
        <div className="rounded-2xl p-5 mb-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-white font-black text-[15px] mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Profit Breakdown
          </h2>
          <div className="space-y-3">
            {[
              { label: "Gross Revenue",     value: s.revenue,        color: "#4ADE80", sign: "" },
              { label: "− Cost of Goods",   value: s.cogs,           color: "#F87171", sign: "−" },
              { label: "− Shipping Costs",  value: s.shippingCost,   color: "#F5C518", sign: "−" },
              { label: "= Net Profit",      value: s.profit,         color: s.profit >= 0 ? "#4ADE80" : "#F87171", sign: "", bold: true },
            ].map(({ label, value, color, sign, bold }) => (
              <div key={label} className={`flex items-center justify-between gap-4 ${bold ? "pt-3 border-t" : ""}`} style={bold ? { borderColor: "rgba(255,255,255,0.07)" } : {}}>
                <span className={`text-[${bold ? "14" : "13"}px] ${bold ? "font-black text-white" : "font-semibold text-white/60"}`}>{label}</span>
                <div className="flex items-center gap-3 flex-1 max-w-[400px]">
                  {!bold && s.revenue > 0 && (
                    <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(value / s.revenue * 100).toFixed(0)}%`, background: color }} />
                    </div>
                  )}
                  <span className={`${bold ? "text-[18px] font-black" : "text-[14px] font-bold"} shrink-0`} style={{ color, fontFamily: bold ? "'Barlow Condensed', sans-serif" : undefined }}>
                    {sign}{fmt(value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-product table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <h2 className="text-white font-black text-[15px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Product Profitability
          </h2>
          <p className="text-white/35 text-[12px]">Top 20 by profit</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><RefreshCw className="h-6 w-6 animate-spin text-white/20" /></div>
        ) : !data?.products.length ? (
          <div className="flex flex-col items-center py-16 text-white/30">
            <TrendingUp className="h-8 w-8 mb-3 opacity-30" />
            <p className="text-[13px] font-semibold">No order data in this period</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {/* Header */}
            <div className="hidden md:grid px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/25"
              style={{ gridTemplateColumns: "2fr 90px 90px 90px 80px 160px" }}>
              <span>Product</span><span>Revenue</span><span>COGS</span><span>Shipping</span><span>Profit</span><span>Margin</span>
            </div>
            {data.products.map(p => (
              <div key={p.productId}
                className="flex md:grid items-center gap-3 px-5 py-3.5"
                style={{ gridTemplateColumns: "2fr 90px 90px 90px 80px 160px" }}>
                <div className="flex-1 md:flex-none min-w-0">
                  <p className="text-[13px] font-semibold text-white truncate">{p.name}</p>
                  <p className="text-[11px] text-white/30">{p.unitsSold} units sold</p>
                </div>
                <span className="hidden md:block text-[12px] font-semibold text-[#4ADE80]">{fmt(p.revenue)}</span>
                <span className="hidden md:block text-[12px] font-semibold text-white/50">{p.cogs > 0 ? fmt(p.cogs) : <span className="text-[#F5C518]">no cost</span>}</span>
                <span className="hidden md:block text-[12px] font-semibold text-white/50">{p.shippingCost > 0 ? fmt(p.shippingCost) : "—"}</span>
                <span className="hidden md:block text-[12px] font-bold" style={{ color: p.profit >= 0 ? "#4ADE80" : "#F87171" }}>{fmt(p.profit)}</span>
                <div className="hidden md:block w-full">
                  {p.cogs > 0 ? <MarginBar margin={p.margin} /> : <span className="text-[10px] text-white/25">set cost price</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="mt-5 rounded-2xl px-5 py-4" style={{ background: "rgba(245,197,24,0.05)", border: "1px solid rgba(245,197,24,0.1)" }}>
        <p className="text-[12px] text-white/40 leading-relaxed">
          <strong className="text-[#F5C518]">How profit is calculated:</strong> Net Profit = Selling Price − Cost Price − Shipping Cost per unit, summed across all units sold in the period.
          Set cost prices per variant in <a href="/admin/products" className="text-[#F5C518] underline">Products → Variants & Images</a>.
          Set shipping cost per product in <a href="/admin/products" className="text-[#F5C518] underline">Edit Product → Profit Settings</a>.
        </p>
      </div>
    </div>
  );
}
