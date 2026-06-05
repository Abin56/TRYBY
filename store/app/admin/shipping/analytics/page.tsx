"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Truck, Clock, CheckCircle2, XCircle, AlertTriangle,
  TrendingUp, RotateCcw, ChevronDown, RefreshCw,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CourierStat {
  name: string;
  total: number;
  delivered: number;
  failed: number;
  returned: number;
  successRate: number;
  failedRate: number;
  rtoRate: number;
  avgDeliveryHours: number | null;
}

interface AnalyticsData {
  period: { days: number; since: string };
  totals: {
    total: number; delivered: number; inTransit: number;
    failed: number; returned: number; pending: number; delayed: number;
  };
  delivery: { avgHours: number | null; medianHours: number | null; avgDays: number | null };
  couriers: CourierStat[];
  statusBreakdown: Record<string, number>;
  dailyTrend: { date: string; count: number }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDays(hours: number | null): string {
  if (hours === null) return "—";
  const d = Math.floor(hours / 24);
  const h = Math.round(hours % 24);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}

const DAY_OPTIONS = [7, 14, 30, 60, 90];

const STATUS_COLORS: Record<string, string> = {
  DELIVERED:        "#4ADE80",
  IN_TRANSIT:       "#A78BFA",
  OUT_FOR_DELIVERY: "#FB923C",
  PICKED_UP:        "#60A5FA",
  PACKED:           "#60A5FA",
  PENDING:          "#F5C518",
  FAILED_DELIVERY:  "#F87171",
  RETURNED:         "#F87171",
  LOST:             "#F87171",
};

function StatusDonut({ breakdown }: { breakdown: Record<string, number> }) {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  if (total === 0) return <div className="h-24 flex items-center justify-center text-white/20 text-[12px]">No data</div>;

  let cumulative = 0;
  const segments: { color: string; pct: number; startAngle: number; endAngle: number }[] = [];
  for (const [status, count] of Object.entries(breakdown)) {
    const pct = count / total;
    const startAngle = cumulative * 360;
    cumulative += pct;
    const endAngle = cumulative * 360;
    segments.push({ color: STATUS_COLORS[status] ?? "#555", pct, startAngle, endAngle });
  }

  // SVG arc donut
  const r = 40; const cx = 50; const cy = 50; const sw = 14;
  function polarToXY(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  function arcPath(start: number, end: number) {
    const s = polarToXY(start); const e = polarToXY(end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24">
      {segments.map((seg, i) => (
        <path key={i} d={arcPath(seg.startAngle, seg.endAngle)}
          fill="none" stroke={seg.color} strokeWidth={sw} strokeLinecap="butt" />
      ))}
      <text x={cx} y={cy + 4} textAnchor="middle"
        style={{ fontSize: "13px", fontWeight: 900, fill: "white", fontFamily: "'Barlow Condensed', sans-serif" }}>
        {total}
      </text>
    </svg>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ShippingAnalyticsPage() {
  const [days, setDays]           = useState(30);
  const [data, setData]           = useState<AnalyticsData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/shipping/analytics?days=${days}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  // Bar chart max
  const maxDispatch = Math.max(...(data?.dailyTrend.map(d => d.count) ?? [1]), 1);

  return (
    <div className="p-6 lg:p-8 max-w-[1300px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
            Shipping Analytics
          </h1>
          <p className="text-white/40 text-[13px]">Courier performance · Delivery times · Trends</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowPicker(v => !v)}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold text-white/50 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              Last {days} days <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showPicker && (
              <div className="absolute right-0 top-10 z-50 rounded-xl overflow-hidden py-1 w-36"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                {DAY_OPTIONS.map(d => (
                  <button key={d} onClick={() => { setDays(d); setShowPicker(false); }}
                    className="flex w-full px-4 py-2 text-[12px] font-semibold text-left hover:bg-white/05 transition-colors"
                    style={{ color: days === d ? "#F5C518" : "rgba(255,255,255,0.6)" }}>
                    Last {d} days
                  </button>
                ))}
              </div>
            )}
          </div>
          <a href="/admin/shipping/profitability"
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold text-white/50 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            Profitability →
          </a>
          <button onClick={load}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold text-white/50 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin" />
        </div>
      ) : data ? (
        <div className="space-y-6">

          {/* Overview cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Shipments", value: data.totals.total,     icon: Truck,        color: "#A78BFA", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" },
              { label: "Delivered",       value: data.totals.delivered,  icon: CheckCircle2, color: "#4ADE80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.2)"  },
              { label: "Failed / Returned",value: data.totals.failed + data.totals.returned, icon: XCircle, color: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
              { label: "Delayed",         value: data.totals.delayed,   icon: AlertTriangle, color: "#F5C518", bg: "rgba(245,197,24,0.08)", border: "rgba(245,197,24,0.2)"  },
            ].map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className="rounded-2xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-white/50">{label}</p>
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <p className="font-black text-white text-[28px] leading-none"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Delivery time + donut */}
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Delivery time */}
            <div className="rounded-2xl p-6" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-5">
                <Clock className="h-4 w-4 text-white/40" />
                <p className="text-[13px] font-bold text-white">Delivery Times</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Avg Delivery", value: fmtDays(data.delivery.avgHours), sub: data.delivery.avgDays ? `${data.delivery.avgDays} days` : null },
                  { label: "Median",       value: fmtDays(data.delivery.medianHours), sub: "50th percentile" },
                  { label: "In Transit",   value: String(data.totals.inTransit), sub: "active shipments" },
                  { label: "Pending",      value: String(data.totals.pending), sub: "not yet dispatched" },
                ].map(({ label, value, sub }) => (
                  <div key={label}>
                    <p className="text-[10px] text-white/30 mb-1">{label}</p>
                    <p className="font-black text-white text-[20px] leading-none"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
                    {sub && <p className="text-[10px] text-white/25 mt-0.5">{sub}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Status donut */}
            <div className="rounded-2xl p-6" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[13px] font-bold text-white mb-5">Status Distribution</p>
              <div className="flex items-center gap-6">
                <StatusDonut breakdown={data.statusBreakdown} />
                <div className="space-y-2">
                  {Object.entries(data.statusBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 6)
                    .map(([status, count]) => (
                    <div key={status} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: STATUS_COLORS[status] ?? "#555" }} />
                      <span className="text-[11px] text-white/50 truncate">{status.replace(/_/g, " ")}</span>
                      <span className="text-[11px] font-bold text-white ml-auto">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Courier performance table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <TrendingUp className="h-4 w-4 text-white/40" />
              <p className="text-[13px] font-bold text-white">Courier Performance</p>
            </div>
            {!data.couriers.length ? (
              <p className="text-center py-10 text-white/30 text-[13px]">No courier data yet</p>
            ) : (
              <>
                <div className="hidden lg:grid px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/25 border-b"
                  style={{ gridTemplateColumns: "1fr 70px 70px 70px 70px 110px 90px 90px", borderColor: "rgba(255,255,255,0.04)" }}>
                  <span>Courier</span>
                  <span className="text-right">Total</span>
                  <span className="text-right">Delivered</span>
                  <span className="text-right">Failed</span>
                  <span className="text-right">RTO</span>
                  <span className="text-right">Avg Delivery</span>
                  <span className="text-right">Success %</span>
                  <span className="text-right">RTO Rate</span>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {data.couriers.map((c, i) => (
                    <div key={i} className="hidden lg:grid px-5 py-3.5 items-center"
                      style={{ gridTemplateColumns: "1fr 70px 70px 70px 70px 110px 90px 90px" }}>
                      <p className="text-[13px] font-bold text-white/80">{c.name}</p>
                      <p className="text-[13px] font-bold text-white text-right">{c.total}</p>
                      <p className="text-[13px] font-semibold text-[#4ADE80] text-right">{c.delivered}</p>
                      <p className="text-[13px] font-semibold text-[#F87171] text-right">{c.failed}</p>
                      <p className="text-[13px] font-semibold text-[#FB923C] text-right">{c.returned}</p>
                      <p className="text-[13px] font-semibold text-white/60 text-right">{fmtDays(c.avgDeliveryHours)}</p>
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="h-1.5 w-12 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${c.successRate}%`, background: c.successRate >= 90 ? "#4ADE80" : c.successRate >= 70 ? "#F5C518" : "#F87171" }} />
                        </div>
                        <span className="text-[11px] font-bold" style={{ color: c.successRate >= 90 ? "#4ADE80" : c.successRate >= 70 ? "#F5C518" : "#F87171" }}>
                          {c.successRate}%
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-[11px] font-bold text-right"
                          style={{ color: (c.rtoRate ?? 0) <= 5 ? "#4ADE80" : (c.rtoRate ?? 0) <= 15 ? "#F5C518" : "#F87171" }}>
                          {c.rtoRate ?? 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Daily dispatch trend */}
          {data.dailyTrend.length > 1 && (
            <div className="rounded-2xl p-6" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-5">
                <RotateCcw className="h-4 w-4 text-white/40" />
                <p className="text-[13px] font-bold text-white">Daily Dispatch Volume</p>
              </div>
              <div className="flex items-end gap-1 h-24">
                {data.dailyTrend.slice(-30).map(({ date, count }) => (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full rounded-sm transition-opacity group-hover:opacity-100 opacity-70"
                      style={{
                        height: `${Math.round((count / maxDispatch) * 88)}px`,
                        minHeight: count > 0 ? "3px" : "0px",
                        background: "rgba(245,197,24,0.7)",
                      }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10">
                      <div className="rounded-lg px-2 py-1 text-center whitespace-nowrap"
                        style={{ background: "#2A2A2A", border: "1px solid rgba(255,255,255,0.12)" }}>
                        <p className="text-[10px] font-bold text-white">{count}</p>
                        <p className="text-[9px] text-white/40">{new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-[9px] text-white/20">
                  {new Date(data.dailyTrend[0].date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </p>
                <p className="text-[9px] text-white/20">
                  {new Date(data.dailyTrend[data.dailyTrend.length - 1].date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </p>
              </div>
            </div>
          )}

        </div>
      ) : null}
    </div>
  );
}
