"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Store, RefreshCw, Loader2, AlertTriangle, CheckCircle2,
  ChevronLeft, ChevronRight, TrendingDown, ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

interface ScoredSupplier {
  id:               string;
  companyName:      string;
  email:            string | null;
  status:           string;
  tier:             string;
  riskScore:        number;
  riskLevel:        string;
  cancellationRate: number;
  returnRate:       number;
  slaScore:         number;
  performanceScore: number;
  fulfillmentRate:  number;
  totalOrders:      number;
  suspendReason:    string | null;
}

const CARD = "rounded-2xl border p-5";
const CD   = { background: "#111", borderColor: "rgba(255,255,255,0.06)" };
const RISK_COLORS: Record<string, string> = {
  CRITICAL: "#F87171", HIGH: "#F97316", MEDIUM: "#FBBF24", LOW: "#4ADE80",
};
const TIER_COLORS: Record<string, string> = {
  BRONZE: "#CD7F32", SILVER: "#C0C0C0", GOLD: "#F5C518", PLATINUM: "#E5E4E2",
};

function RiskBadge({ level }: { level: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black"
      style={{ background: `${RISK_COLORS[level] ?? "#9CA3AF"}18`, color: RISK_COLORS[level] ?? "#9CA3AF" }}>
      {level}
    </span>
  );
}

function ScoreMeter({ value, label, reverse = false }: { value: number; label: string; reverse?: boolean }) {
  const pct   = Math.min(100, Math.round(value * 100));
  const bad   = reverse ? pct < 50 : pct > 30;
  const color = bad ? "#F87171" : "#4ADE80";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-white/40">{label}</span>
        <span className="font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function SupplierRiskPage() {
  const [suppliers, setSuppliers] = useState<ScoredSupplier[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [riskFilter,setRiskFilter]= useState("");
  const [highRisk,  setHighRisk]  = useState(0);
  const [critical,  setCritical]  = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: "25" });
      if (riskFilter) p.set("riskLevel", riskFilter);
      const res = await fetch(`/api/admin/fraud/suppliers?${p}`);
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers);
        setTotal(data.total);
        setHighRisk(data.highRiskCount ?? 0);
        setCritical(data.criticalCount ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, riskFilter]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Supplier Risk Monitoring
          </h1>
          <p className="text-white/40 text-[13px]">
            {total.toLocaleString()} suppliers · scored on cancellations, returns & SLA
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="h-9 w-9 flex items-center justify-center rounded-xl border hover:bg-white/5 transition-all"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <RefreshCw className={`h-4 w-4 text-white/50 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Critical Risk",   value: critical,  color: "#F87171", filter: "CRITICAL" },
          { label: "High Risk",       value: highRisk,  color: "#F97316", filter: "HIGH"     },
          { label: "Total Suppliers", value: total,     color: "#60A5FA", filter: ""         },
          { label: "Healthy",         value: suppliers.filter(s => s.riskLevel === "LOW").length, color: "#4ADE80", filter: "LOW" },
        ].map(({ label, value, color, filter }) => (
          <button key={label}
            onClick={() => { setRiskFilter(riskFilter === filter ? "" : filter); setPage(1); }}
            className={`${CARD} text-left transition-all hover:brightness-110`}
            style={{ ...CD, borderColor: riskFilter === filter ? `${color}40` : "rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] text-white/40 mb-1">{label}</p>
            <p className="font-black text-[28px] leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: value > 0 ? color : "rgba(255,255,255,0.2)" }}>
              {value}
            </p>
          </button>
        ))}
      </div>

      {/* Risk level filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {["", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map(level => (
          <button key={level}
            onClick={() => { setRiskFilter(level); setPage(1); }}
            className="h-9 px-3 rounded-xl text-[12px] font-bold transition-all"
            style={{
              background: riskFilter === level ? `${RISK_COLORS[level] ?? "rgba(255,255,255,0.1)"}18` : "#1A1A1A",
              color:      riskFilter === level ? (RISK_COLORS[level] ?? "#fff") : "rgba(255,255,255,0.5)",
              border:     `1px solid ${riskFilter === level ? (RISK_COLORS[level] ?? "#fff") + "40" : "rgba(255,255,255,0.08)"}`,
            }}>
            {level || "All Levels"}
          </button>
        ))}
      </div>

      {/* Supplier list */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-white/30" /></div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <Store className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No suppliers match filters</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {suppliers.map(s => (
            <div key={s.id} className={CARD} style={{ ...CD, borderColor: s.riskLevel === "CRITICAL" ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.06)" }}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-bold text-[14px] truncate">{s.companyName}</p>
                    <span className="text-[9px] font-bold rounded px-1.5 py-0.5"
                      style={{ background: `${TIER_COLORS[s.tier] ?? "#9CA3AF"}18`, color: TIER_COLORS[s.tier] ?? "#9CA3AF" }}>
                      {s.tier}
                    </span>
                  </div>
                  <p className="text-white/40 text-[11px] truncate">{s.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <RiskBadge level={s.riskLevel} />
                  <span className="font-black text-[20px]"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", color: RISK_COLORS[s.riskLevel] }}>
                    {s.riskScore}
                  </span>
                </div>
              </div>

              {/* Risk meters */}
              <div className="space-y-2 mb-4">
                <ScoreMeter value={s.cancellationRate} label="Cancellation Rate" />
                <ScoreMeter value={s.returnRate}       label="Return Rate"       />
                <ScoreMeter value={s.slaScore / 100}   label="SLA Score"  reverse />
                <ScoreMeter value={s.performanceScore / 100} label="Performance" reverse />
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between pt-3 border-t text-[11px] text-white/30"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <span>{s.totalOrders.toLocaleString()} orders</span>
                <span>{(s.fulfillmentRate * 100).toFixed(0)}% fulfillment</span>
                <Link href={`/admin/suppliers/${s.id}`}
                  className="flex items-center gap-1 hover:text-white/60 transition-colors">
                  View <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              {s.suspendReason && (
                <div className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-[11px]"
                  style={{ background: "rgba(248,113,113,0.08)", color: "#F87171" }}>
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {s.suspendReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="h-8 w-8 flex items-center justify-center rounded-xl border disabled:opacity-40 hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <ChevronLeft className="h-4 w-4 text-white/50" />
          </button>
          <span className="text-white/40 text-[12px]">{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
            className="h-8 w-8 flex items-center justify-center rounded-xl border disabled:opacity-40 hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <ChevronRight className="h-4 w-4 text-white/50" />
          </button>
        </div>
      )}
    </div>
  );
}
