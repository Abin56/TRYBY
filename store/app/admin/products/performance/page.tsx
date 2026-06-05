"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, RefreshCw, Package, Download, BarChart2 } from "lucide-react";

interface PerfProduct {
  productId: string; productName: string; sport: string; category: string;
  supplierName: string | null; image: string | null; avgRating: number;
  revenue: number; unitsSold: number; orders: number;
  profit: number; margin: number; returnRate: number; wishlistCount: number;
}

const SORT_OPTIONS = [
  { value: "revenue", label: "Revenue" },
  { value: "profit",  label: "Profit" },
  { value: "orders",  label: "Orders" },
  { value: "margin",  label: "Margin %" },
];

export default function ProductPerformancePage() {
  const [products, setProducts] = useState<PerfProduct[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [days, setDays]         = useState(30);
  const [sort, setSort]         = useState("revenue");
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ days: String(days), sort, page: String(page), limit: "20" });
      const res = await fetch(`/api/admin/products/performance?${params}`);
      if (res.ok) {
        const d = await res.json();
        setProducts(d.products);
        setTotal(d.total);
        setPages(d.pages);
      }
    } finally { setLoading(false); }
  }, [days, sort, page]);

  useEffect(() => { load(); }, [load]);

  const totals = products.reduce((acc, p) => ({
    revenue: acc.revenue + p.revenue, profit: acc.profit + p.profit, units: acc.units + p.unitsSold,
  }), { revenue: 0, profit: 0, units: 0 });

  const avgMargin = products.length > 0 ? products.reduce((s, p) => s + p.margin, 0) / products.length : 0;

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/catalog-center" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px", letterSpacing: "-0.01em" }}>
            Product Performance
          </h1>
          <p className="text-white/40 text-[12px]">{total} products · ranked by {SORT_OPTIONS.find(s => s.value === sort)?.label.toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={e => { setDays(parseInt(e.target.value)); setPage(1); }}
            className="h-9 px-3 rounded-xl text-[12px] text-white outline-none bg-[#1A1A1A] border border-white/08">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button onClick={() => window.open("/api/admin/products/export?type=profit", "_blank")}
            className="flex items-center gap-2 h-9 px-3 rounded-xl text-[12px] font-semibold text-white/60 hover:text-white"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: `Revenue (${days}d)`,    value: `₹${Math.round(totals.revenue / 1000)}K`,        color: "#4ADE80" },
          { label: `Profit (${days}d)`,     value: `₹${Math.round(totals.profit / 1000)}K`,         color: "#F5C518" },
          { label: "Units Sold",            value: totals.units.toLocaleString("en-IN"),             color: "#A78BFA" },
          { label: "Avg Margin",            value: `${Math.round(avgMargin * 10) / 10}%`,            color: avgMargin > 30 ? "#4ADE80" : avgMargin > 15 ? "#F5C518" : "#F87171" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-[24px] font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Sort tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {SORT_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => { setSort(opt.value); setPage(1); }}
            className="h-8 px-4 rounded-xl text-[11px] font-bold transition-all"
            style={{
              background: sort === opt.value ? "rgba(245,197,24,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${sort === opt.value ? "rgba(245,197,24,0.3)" : "rgba(255,255,255,0.08)"}`,
              color: sort === opt.value ? "#F5C518" : "rgba(255,255,255,0.4)",
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="hidden md:grid px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/25 border-b"
          style={{ gridTemplateColumns: "32px 48px 1fr 100px 90px 80px 80px 80px 80px", borderColor: "rgba(255,255,255,0.05)" }}>
          <span>#</span><span />
          <span>Product</span>
          <span className="text-right">Revenue</span>
          <span className="text-right">Profit</span>
          <span className="text-right">Margin</span>
          <span className="text-right">Units</span>
          <span className="text-right">Returns</span>
          <span className="text-right">Wishlist</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-white/20" /></div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-white/25">
            <BarChart2 className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-[13px] font-semibold">No sales data for this period</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {products.map((p, idx) => {
              const rank = (page - 1) * 20 + idx + 1;
              return (
                <div key={p.productId} className="hidden md:grid items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                  style={{ gridTemplateColumns: "32px 48px 1fr 100px 90px 80px 80px 80px 80px" }}>
                  <span className="text-[11px] font-mono text-white/30">{rank}</span>
                  <div className="h-9 w-9 rounded-lg overflow-hidden shrink-0" style={{ background: "#2A2A2A" }}>
                    {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <Package className="h-4 w-4 m-2.5 text-white/20" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-white truncate">{p.productName}</p>
                    <p className="text-[10px] text-white/30">{p.category} · {p.sport}{p.supplierName ? ` · ${p.supplierName}` : ""}</p>
                  </div>
                  <p className="text-[13px] font-bold text-white text-right">₹{p.revenue.toLocaleString("en-IN")}</p>
                  <p className={`text-[12px] font-bold text-right ${p.profit >= 0 ? "text-[#4ADE80]" : "text-[#F87171]"}`}>₹{p.profit.toLocaleString("en-IN")}</p>
                  <p className={`text-[12px] font-bold text-right ${p.margin > 30 ? "text-[#4ADE80]" : p.margin > 15 ? "text-[#F5C518]" : "text-[#F87171]"}`}>{p.margin}%</p>
                  <p className="text-[12px] text-white/60 text-right">{p.unitsSold}</p>
                  <p className={`text-[12px] text-right ${p.returnRate > 10 ? "text-[#F87171]" : "text-white/40"}`}>{p.returnRate}%</p>
                  <p className="text-[12px] text-white/40 text-right">{p.wishlistCount}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="h-9 px-4 rounded-xl text-[12px] font-semibold text-white/50 hover:text-white disabled:opacity-30"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}>← Prev</button>
          <span className="text-[12px] text-white/40">Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            className="h-9 px-4 rounded-xl text-[12px] font-semibold text-white/50 hover:text-white disabled:opacity-30"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}>Next →</button>
        </div>
      )}
    </div>
  );
}
