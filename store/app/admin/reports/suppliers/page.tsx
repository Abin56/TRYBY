"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Store, RefreshCw, ChevronDown, ChevronUp, Download } from "lucide-react";

interface SupplierRow {
  id: string; companyName: string; logoUrl: string | null; tier: string;
  contactName: string | null; contactEmail: string | null;
  revenue: number; commission: number; pendingPayout: number;
  unitsFulfilled: number; ordersFulfilled: number; returns: number;
  returnRatePct: number; cancellationRatePct: number;
  avgShippingHrs: number; avgDeliveryDays: number;
  performanceScore: number; slaScore: number; qualityScore: number;
  avgRating: number; totalOrders: number;
  activeProducts: number; totalProducts: number; totalSoldUnits: number;
  onboardedAt: string | null;
}

const TIER_COLORS: Record<string, string> = { BRONZE: "#CD7F32", SILVER: "#C0C0C0", GOLD: "#F5C518", PLATINUM: "#E5E4E2" };
const SORT_OPTIONS = [
  { key: "revenue",          label: "Revenue" },
  { key: "performanceScore", label: "Performance" },
  { key: "slaScore",         label: "SLA" },
  { key: "returnRatePct",    label: "Return Rate ↑" },
];

function fmt(n: number)  { return `₹${Math.round(n).toLocaleString("en-IN")}`; }
function fmtK(n: number) { return n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : fmt(n); }

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <span className="text-[11px] font-bold shrink-0 w-6 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

export default function SupplierReportPage() {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [days, setDays]           = useState(30);
  const [sort, setSort]           = useState("revenue");
  const [expanded, setExpanded]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/suppliers?days=${days}`);
      if (res.ok) { const d = await res.json(); setSuppliers(d.suppliers ?? []); }
    } finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const sorted = [...suppliers].sort((a, b) => {
    if (sort === "performanceScore") return b.performanceScore - a.performanceScore;
    if (sort === "slaScore")         return b.slaScore - a.slaScore;
    if (sort === "returnRatePct")    return a.returnRatePct - b.returnRatePct;
    return b.revenue - a.revenue;
  });

  const totals = suppliers.reduce((acc, s) => ({
    revenue: acc.revenue + s.revenue, commission: acc.commission + s.commission,
    payout:  acc.payout  + s.pendingPayout, orders: acc.orders + s.ordersFulfilled,
  }), { revenue: 0, commission: 0, payout: 0, orders: 0 });

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
            Supplier Performance
          </h1>
          <p className="text-white/40 text-[12px]">{suppliers.length} suppliers · last {days} days</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={e => setDays(parseInt(e.target.value))}
            className="h-9 px-3 rounded-xl text-[12px] text-white outline-none bg-[#1A1A1A] border border-white/08">
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </select>
          <button onClick={load} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Revenue",   value: fmtK(totals.revenue),    color: "#4ADE80" },
          { label: "Commission Earned", value: fmtK(totals.commission), color: "#F5C518" },
          { label: "Pending Payouts",  value: fmtK(totals.payout),    color: "#FB923C" },
          { label: "Orders Fulfilled", value: String(totals.orders),   color: "#A78BFA" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-[24px] font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Sort */}
      <div className="flex gap-1.5 mb-4">
        {SORT_OPTIONS.map(o => (
          <button key={o.key} onClick={() => setSort(o.key)}
            className="h-8 px-3 rounded-xl text-[11px] font-bold transition-all"
            style={{
              background: sort === o.key ? "rgba(245,197,24,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${sort === o.key ? "rgba(245,197,24,0.3)" : "rgba(255,255,255,0.08)"}`,
              color: sort === o.key ? "#F5C518" : "rgba(255,255,255,0.4)",
            }}>
            {o.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-white/25">
          <Store className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-[13px]">No approved suppliers</p>
          <Link href="/admin/suppliers" className="mt-2 text-[12px] text-[#F5C518] hover:underline">Manage Suppliers →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((s, idx) => (
            <div key={s.id} className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <button className="flex items-center gap-4 w-full px-5 py-4 hover:bg-white/[0.02] transition-all"
                onClick={() => setExpanded(e => e === s.id ? null : s.id)}>
                <span className="text-[11px] font-mono text-white/25 w-5">{idx + 1}</span>
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
                  <p className="text-[10px] text-white/30">{s.activeProducts} products · {s.ordersFulfilled} orders</p>
                </div>
                <div className="hidden lg:grid grid-cols-5 gap-6 text-right shrink-0">
                  {[
                    { label: "Revenue",    value: fmtK(s.revenue),        color: "#4ADE80" },
                    { label: "Commission", value: fmtK(s.commission),      color: "#F5C518" },
                    { label: "Return %",   value: `${s.returnRatePct}%`,   color: s.returnRatePct > 10 ? "#F87171" : "#4ADE80" },
                    { label: "Avg Ship",   value: `${s.avgShippingHrs.toFixed(0)}h`,  color: "rgba(255,255,255,0.5)" },
                    { label: "Perf",       value: `${s.performanceScore}`,  color: s.performanceScore >= 80 ? "#4ADE80" : s.performanceScore >= 60 ? "#F5C518" : "#F87171" },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <p className="text-[9px] text-white/25 uppercase tracking-widest mb-0.5">{label}</p>
                      <p className="text-[13px] font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
                    </div>
                  ))}
                </div>
                {expanded === s.id ? <ChevronUp className="h-4 w-4 text-white/25 shrink-0" /> : <ChevronDown className="h-4 w-4 text-white/25 shrink-0" />}
              </button>

              {expanded === s.id && (
                <div className="border-t px-5 py-4 grid sm:grid-cols-3 lg:grid-cols-4 gap-5"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Scores</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] text-white/40 mb-1">Performance</p>
                        <ScoreBar value={s.performanceScore} color={s.performanceScore >= 80 ? "#4ADE80" : s.performanceScore >= 60 ? "#F5C518" : "#F87171"} />
                      </div>
                      <div>
                        <p className="text-[10px] text-white/40 mb-1">SLA</p>
                        <ScoreBar value={s.slaScore} color={s.slaScore >= 80 ? "#4ADE80" : "#F5C518"} />
                      </div>
                      <div>
                        <p className="text-[10px] text-white/40 mb-1">Quality</p>
                        <ScoreBar value={s.qualityScore} color="#A78BFA" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Fulfillment</p>
                    <div className="space-y-1.5">
                      {[
                        { label: "Orders", value: String(s.ordersFulfilled) },
                        { label: "Units",  value: String(s.unitsFulfilled) },
                        { label: "Avg Ship", value: `${s.avgShippingHrs.toFixed(1)}h` },
                        { label: "Avg Delivery", value: `${s.avgDeliveryDays.toFixed(1)} days` },
                        { label: "Cancel %", value: `${s.cancellationRatePct}%` },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-[10px] text-white/35">{label}</span>
                          <span className="text-[11px] font-semibold text-white/70">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Finance</p>
                    <div className="space-y-1.5">
                      {[
                        { label: "Revenue",     value: fmtK(s.revenue) },
                        { label: "Commission",  value: fmtK(s.commission) },
                        { label: "Pending Payout", value: fmtK(s.pendingPayout) },
                        { label: "Total Orders",   value: String(s.totalOrders) },
                        { label: "Avg Rating",     value: `${s.avgRating.toFixed(1)} ★` },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-[10px] text-white/35">{label}</span>
                          <span className="text-[11px] font-semibold text-white/70">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link href={`/admin/suppliers/${s.id}`}
                      className="h-8 px-4 rounded-xl text-[11px] font-semibold text-white/50 hover:text-white flex items-center justify-center"
                      style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                      View Supplier
                    </Link>
                    <Link href={`/admin/payouts?supplier=${s.id}`}
                      className="h-8 px-4 rounded-xl text-[11px] font-black text-[#0D0D0D] flex items-center justify-center"
                      style={{ background: "#F5C518" }}>
                      Manage Payouts
                    </Link>
                    <Link href={`/admin/supplier-products?q=${encodeURIComponent(s.companyName)}`}
                      className="h-8 px-4 rounded-xl text-[11px] font-semibold text-white/40 hover:text-white flex items-center justify-center"
                      style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                      Products
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
