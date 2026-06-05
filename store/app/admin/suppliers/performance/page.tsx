"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Store, RefreshCw, Package, ChevronDown, ChevronUp } from "lucide-react";

interface SupplierPerf {
  id: string; companyName: string; logoUrl: string | null; tier: string;
  activeProducts: number; revenue: number; commission: number; pendingPayout: number;
  totalOrders: number; returnRate: number; slaScore: number; qualityScore: number;
  performanceScore: number; avgRating: number;
}

const TIER_COLORS: Record<string, string> = {
  BRONZE: "#CD7F32", SILVER: "#C0C0C0", GOLD: "#F5C518", PLATINUM: "#E5E4E2",
};

const SORT_OPTIONS = [
  { value: "revenue",          label: "Revenue" },
  { value: "performanceScore", label: "Performance" },
  { value: "slaScore",         label: "SLA Score" },
  { value: "returnRate",       label: "Return Rate" },
];

export default function SupplierPerformancePage() {
  const [suppliers, setSuppliers] = useState<SupplierPerf[]>([]);
  const [loading, setLoading]     = useState(true);
  const [days, setDays]           = useState(30);
  const [sort, setSort]           = useState("revenue");
  const [expanded, setExpanded]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/suppliers/performance?days=${days}`);
      if (res.ok) { const d = await res.json(); setSuppliers(d.suppliers ?? []); }
    } finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const sorted = [...suppliers].sort((a, b) => {
    if (sort === "performanceScore") return b.performanceScore - a.performanceScore;
    if (sort === "slaScore")         return b.slaScore - a.slaScore;
    if (sort === "returnRate")       return a.returnRate - b.returnRate;  // lower is better
    return b.revenue - a.revenue;
  });

  const totals = suppliers.reduce((acc, s) => ({
    revenue: acc.revenue + s.revenue, commission: acc.commission + s.commission,
    payout: acc.payout + s.pendingPayout,
  }), { revenue: 0, commission: 0, payout: 0 });

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/catalog-center" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px", letterSpacing: "-0.01em" }}>
            Supplier Performance
          </h1>
          <p className="text-white/40 text-[12px]">{suppliers.length} approved suppliers</p>
        </div>
        <select value={days} onChange={e => setDays(parseInt(e.target.value))}
          className="h-9 px-3 rounded-xl text-[12px] text-white outline-none bg-[#1A1A1A] border border-white/08">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: `Revenue (${days}d)`, value: `₹${Math.round(totals.revenue / 1000)}K`, color: "#4ADE80" },
          { label: "Commission Earned",  value: `₹${Math.round(totals.commission / 1000)}K`, color: "#F5C518" },
          { label: "Pending Payouts",    value: `₹${Math.round(totals.payout / 1000)}K`, color: "#FB923C" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-[24px] font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Sort */}
      <div className="flex gap-1.5 mb-4">
        {SORT_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => setSort(opt.value)}
            className="h-8 px-3 rounded-xl text-[11px] font-bold transition-all"
            style={{
              background: sort === opt.value ? "rgba(245,197,24,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${sort === opt.value ? "rgba(245,197,24,0.3)" : "rgba(255,255,255,0.08)"}`,
              color: sort === opt.value ? "#F5C518" : "rgba(255,255,255,0.4)",
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-white/20" /></div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-white/25">
          <Store className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-[13px]">No approved suppliers yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((s, idx) => (
            <div key={s.id} className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <button className="flex items-center gap-4 w-full px-5 py-4 hover:bg-white/[0.02] transition-all"
                onClick={() => setExpanded(e => e === s.id ? null : s.id)}>

                <span className="text-[11px] font-mono text-white/25 w-6 text-center">{idx + 1}</span>

                <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden" style={{ background: "#2A2A2A" }}>
                  {s.logoUrl ? <img src={s.logoUrl} alt="" className="w-full h-full object-cover" /> : <Store className="h-5 w-5 m-2.5 text-white/20" />}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-white">{s.companyName}</p>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ color: TIER_COLORS[s.tier] ?? "#888", background: `${TIER_COLORS[s.tier] ?? "#888"}15` }}>
                      {s.tier}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/30">{s.activeProducts} products</p>
                </div>

                {/* Metrics */}
                <div className="hidden sm:grid grid-cols-5 gap-4 text-right shrink-0">
                  {[
                    { label: "Revenue",    value: `₹${Math.round(s.revenue / 1000)}K`,    color: "#4ADE80" },
                    { label: "Commission", value: `₹${Math.round(s.commission / 1000)}K`, color: "#F5C518" },
                    { label: "Ret. Rate",  value: `${s.returnRate}%`,                      color: s.returnRate > 10 ? "#F87171" : "#4ADE80" },
                    { label: "SLA",        value: `${s.slaScore}`,                         color: s.slaScore >= 80 ? "#4ADE80" : s.slaScore >= 60 ? "#F5C518" : "#F87171" },
                    { label: "Perf",       value: `${s.performanceScore}`,                  color: s.performanceScore >= 80 ? "#4ADE80" : s.performanceScore >= 60 ? "#F5C518" : "#F87171" },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <p className="text-[9px] text-white/25 uppercase tracking-widest mb-0.5">{label}</p>
                      <p className="text-[13px] font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
                    </div>
                  ))}
                </div>

                {expanded === s.id ? <ChevronUp className="h-4 w-4 text-white/30 shrink-0" /> : <ChevronDown className="h-4 w-4 text-white/30 shrink-0" />}
              </button>

              {expanded === s.id && (
                <div className="border-t px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  {[
                    { label: "Total Orders",    value: s.totalOrders },
                    { label: "Avg Rating",      value: `${s.avgRating.toFixed(1)} ★` },
                    { label: "Quality Score",   value: s.qualityScore },
                    { label: "Pending Payout",  value: `₹${s.pendingPayout.toLocaleString("en-IN")}` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">{label}</p>
                      <p className="text-[16px] font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
                    </div>
                  ))}
                  <div className="col-span-2 sm:col-span-4 flex gap-2 pt-1">
                    <Link href={`/admin/suppliers/${s.id}`}
                      className="h-8 px-4 rounded-xl text-[11px] font-semibold text-white/50 hover:text-white transition-all"
                      style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                      View Supplier
                    </Link>
                    <Link href={`/admin/payouts?supplier=${s.id}`}
                      className="h-8 px-4 rounded-xl text-[11px] font-semibold text-[#F5C518] hover:opacity-80 transition-all"
                      style={{ border: "1px solid rgba(245,197,24,0.3)", background: "rgba(245,197,24,0.08)" }}>
                      Manage Payouts
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
