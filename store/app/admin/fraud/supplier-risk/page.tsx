"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, RefreshCw, Truck, TrendingDown, AlertTriangle } from "lucide-react";

interface SupplierRisk {
  id: string;
  companyName: string;
  slug: string | null;
  tier: string;
  status: string;
  cancellationRate: string;
  returnRate: string;
  fulfillmentRate: string;
  performanceScore: string;
  fulfillmentScore: string;
  qualityScore: string;
  slaScore: string;
  avgRating: string;
  totalOrders: number;
  avgShippingHrs: string;
  avgDeliveryDays: string;
}

const TIER_COLORS: Record<string, string> = {
  PLATINUM: "#A78BFA", GOLD: "#F5C518", SILVER: "#9CA3AF", BRONZE: "#D97706",
};

function ScoreBadge({ value, label }: { value: number; label: string }) {
  const color = value >= 65 ? "#22C55E" : value >= 40 ? "#EAB308" : "#EF4444";
  return (
    <div className="text-center">
      <p className="text-[18px] font-bold" style={{ color }}>{value.toFixed(0)}</p>
      <p className="text-white/30 text-[10px]">{label}</p>
    </div>
  );
}

export default function SupplierRiskPage() {
  const [suppliers, setSuppliers] = useState<SupplierRisk[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [risk, setRisk] = useState("high");
  const [agg, setAgg] = useState<{ _avg: { cancellationRate: string | null; returnRate: string | null; performanceScore: string | null } } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), risk });
    const r = await fetch(`/api/admin/fraud/supplier-risk?${params}`);
    const json = await r.json();
    setSuppliers(json.data ?? []);
    setTotal(json.total ?? 0);
    setPages(json.pages ?? 1);
    setAgg(json.agg ?? null);
    setLoading(false);
  }, [page, risk]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const avgCancel = (Number(agg?._avg.cancellationRate ?? 0) * 100).toFixed(1);
  const avgReturn = (Number(agg?._avg.returnRate ?? 0) * 100).toFixed(1);
  const avgPerf = Number(agg?._avg.performanceScore ?? 0).toFixed(0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-black text-2xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
            SUPPLIER RISK MONITOR
          </h1>
          <p className="text-white/40 text-[13px]">{total} suppliers</p>
        </div>
        <Link href="/admin/fraud" className="text-[12px] text-white/40 hover:text-white px-3 py-1.5 rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          ← Risk Center
        </Link>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Avg Cancellation Rate", value: `${avgCancel}%`, color: Number(avgCancel) > 15 ? "#EF4444" : "#22C55E", icon: AlertTriangle },
          { label: "Avg Return Rate", value: `${avgReturn}%`, color: Number(avgReturn) > 10 ? "#F97316" : "#22C55E", icon: TrendingDown },
          { label: "Avg Performance Score", value: avgPerf, color: Number(avgPerf) >= 65 ? "#22C55E" : Number(avgPerf) >= 40 ? "#EAB308" : "#EF4444", icon: Truck },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-xl p-4 flex items-center gap-4" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <p className="text-white font-black text-[24px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
              <p className="text-white/40 text-[12px]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {["high", "medium", ""].map((r) => (
          <button key={r} onClick={() => { setRisk(r); setPage(1); }}
            className="px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all"
            style={{
              background: risk === r ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
              color: risk === r ? "white" : "rgba(255,255,255,0.4)",
              border: `1px solid ${risk === r ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"}`,
            }}>
            {r === "high" ? "High Risk" : r === "medium" ? "Medium Risk" : "All Suppliers"}
          </button>
        ))}
        <button onClick={fetchData} className="ml-auto px-3 py-2 rounded-xl text-white/60 hover:text-white flex items-center gap-1.5 text-[13px]"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && <p className="text-white/30 text-[13px] col-span-2 text-center py-8">Loading…</p>}
        {!loading && suppliers.length === 0 && (
          <div className="col-span-2 text-center py-10">
            <Truck className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-white/30">No risky suppliers found</p>
          </div>
        )}
        {!loading && suppliers.map((s) => {
          const cancelPct = (Number(s.cancellationRate) * 100).toFixed(1);
          const returnPct = (Number(s.returnRate) * 100).toFixed(1);
          const perf = Number(s.performanceScore);
          const isHighRisk = perf < 40 || Number(s.cancellationRate) >= 0.2;
          return (
            <div key={s.id} className="rounded-xl p-5 space-y-4" style={{ background: "#111111", border: `1px solid ${isHighRisk ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)"}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold text-[15px]">{s.companyName}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold"
                      style={{ color: TIER_COLORS[s.tier], background: `${TIER_COLORS[s.tier]}18` }}>
                      {s.tier}
                    </span>
                    {isHighRisk && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-400 font-bold">HIGH RISK</span>
                    )}
                  </div>
                  <p className="text-white/40 text-[12px]">{s.totalOrders} orders</p>
                </div>
                <Link href={`/admin/suppliers/${s.id}`}
                  className="text-[12px] text-white/40 hover:text-white px-2.5 py-1.5 rounded-lg"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  View →
                </Link>
              </div>

              {/* Metrics bars */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-white/50">Cancellation Rate</span>
                    <span style={{ color: Number(cancelPct) >= 20 ? "#EF4444" : "#9CA3AF" }}>{cancelPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/08">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, Number(cancelPct) * 3)}%`, background: Number(cancelPct) >= 20 ? "#EF4444" : "#22C55E" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-white/50">Return Rate</span>
                    <span style={{ color: Number(returnPct) >= 15 ? "#F97316" : "#9CA3AF" }}>{returnPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/08">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, Number(returnPct) * 5)}%`, background: Number(returnPct) >= 15 ? "#F97316" : "#22C55E" }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <ScoreBadge value={Number(s.performanceScore)} label="Perf" />
                <ScoreBadge value={Number(s.fulfillmentScore)} label="Fulfill" />
                <ScoreBadge value={Number(s.qualityScore)} label="Quality" />
                <ScoreBadge value={Number(s.slaScore)} label="SLA" />
              </div>

              <div className="flex gap-4 text-[11px] text-white/40">
                <span>Shipping: {Number(s.avgShippingHrs).toFixed(0)}h avg</span>
                <span>Delivery: {Number(s.avgDeliveryDays).toFixed(1)}d avg</span>
                <span>Rating: {Number(s.avgRating).toFixed(1)}★</span>
              </div>
            </div>
          );
        })}
      </div>

      {pages > 1 && (
        <div className="flex items-center gap-2 justify-center">
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className="h-8 w-8 rounded-lg text-[13px]"
              style={{ background: p === page ? "#E8FF47" : "#111111", color: p === page ? "#0D0D0D" : "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)", fontWeight: p === page ? 700 : 400 }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
