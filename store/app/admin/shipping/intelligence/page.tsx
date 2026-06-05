"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Package, Truck, AlertTriangle,
  RotateCcw, Clock, MapPin, RefreshCw, ChevronDown,
  CheckCircle2, XCircle, AlertCircle, Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CourierStat {
  name:              string;
  total:             number;
  delivered:         number;
  failedDelivery:    number;
  rto:               number;
  lost:              number;
  successRate:       number;
  rtoRate:           number;
  failedRate:        number;
  avgDeliveryHours:  number | null;
  codOrders:         number;
  codSuccess:        number;
  codSuccessRate:    number;
}

interface StateStat {
  state:             string;
  total:             number;
  delivered:         number;
  avgDeliveryHours:  number | null;
}

interface IntelData {
  period:   { days: number; since: string };
  summary: {
    total:        number;
    delivered:    number;
    rto:          number;
    lost:         number;
    inTransit:    number;
    deliveryRate: number | null;
    rtoRate:      number | null;
  };
  couriers:          CourierStat[];
  stateStats:        StateStat[];
  cod: {
    total:       number;
    collected:   number;
    rto:         number;
    successRate: number;
    rtoRate:     number;
  };
  sla: {
    withEstimate:   number;
    onTime:         number;
    late:           number;
    pendingOverdue: number;
    rate:           number | null;
  };
  topDelayedRegions: { state: string; count: number }[];
}

const COURIER_LABELS: Record<string, string> = {
  SHIPROCKET: "Shiprocket", DELHIVERY: "Delhivery", DTDC: "DTDC",
  INDIA_POST: "India Post", BLUEDART: "BlueDart", XPRESSBEES: "Xpressbees",
  ECOM_EXPRESS: "Ecom Express", OTHER: "Other",
};

const PERIOD_OPTIONS = [
  { label: "Last 7 days",  value: 7  },
  { label: "Last 30 days", value: 30 },
  { label: "Last 60 days", value: 60 },
  { label: "Last 90 days", value: 90 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function hoursToLabel(h: number | null): string {
  if (h === null) return "—";
  if (h < 24)  return `${h}h`;
  const days = Math.floor(h / 24);
  const rem  = h % 24;
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
}

function rateColor(rate: number): string {
  if (rate >= 90) return "#22C55E";
  if (rate >= 75) return "#F59E0B";
  return "#EF4444";
}

function RateBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(value, 100)}%`, background: color }} />
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, sub, color = "#E8FF47",
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "#111111" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `${color}18` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <p className="text-[12px] text-[#666]">{label}</p>
      </div>
      <p className="text-[28px] font-black text-white leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-[#555] mt-1">{sub}</p>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ShippingIntelligencePage() {
  const [data,     setData]     = useState<IntelData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [days,     setDays]     = useState(30);
  const [showPeriod, setShowPeriod] = useState(false);

  async function load(d: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/shipping/intelligence?days=${d}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(days); }, [days]);

  const periodLabel = PERIOD_OPTIONS.find(o => o.value === days)?.label ?? `Last ${days} days`;

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: "#0D0D0D", color: "#FFFFFF" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-black tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E8FF47" }}>
            Shipping Intelligence
          </h1>
          <p className="text-[13px] text-[#555] mt-0.5">Courier performance, delivery SLAs, and regional patterns</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period picker */}
          <div className="relative">
            <button
              onClick={() => setShowPeriod(v => !v)}
              className="flex items-center gap-2 rounded-xl px-4 h-9 text-[13px] font-semibold"
              style={{ background: "#1A1A1A", color: "#CCC", border: "1px solid #2A2A2A" }}
            >
              {periodLabel}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showPeriod && (
              <div className="absolute right-0 top-11 z-20 rounded-xl overflow-hidden shadow-2xl"
                style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", minWidth: 160 }}>
                {PERIOD_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => { setDays(o.value); setShowPeriod(false); }}
                    className={cn("w-full text-left px-4 py-2.5 text-[13px] transition-colors",
                      days === o.value ? "font-bold text-[#E8FF47]" : "text-[#CCC] hover:bg-[#222]"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => load(days)}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl px-4 h-9 text-[13px] font-semibold transition-opacity disabled:opacity-50"
            style={{ background: "#E8FF47", color: "#0D0D0D" }}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin text-[#E8FF47]" />
        </div>
      )}

      {data && (
        <div className="space-y-6">

          {/* ── Summary KPIs ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard icon={Package}      label="Total Shipments"  value={data.summary.total}                        color="#E8FF47" />
            <KpiCard icon={CheckCircle2} label="Delivered"        value={data.summary.delivered}                    color="#22C55E" />
            <KpiCard icon={Truck}        label="In Transit"       value={data.summary.inTransit}                    color="#3B82F6" />
            <KpiCard icon={RotateCcw}    label="RTO"              value={data.summary.rto}                          color="#F59E0B" />
            <KpiCard icon={XCircle}      label="Lost"             value={data.summary.lost}                         color="#EF4444" />
            <KpiCard icon={TrendingUp}   label="Delivery Rate"
              value={data.summary.deliveryRate !== null ? `${data.summary.deliveryRate}%` : "—"}
              color={data.summary.deliveryRate !== null ? rateColor(data.summary.deliveryRate) : "#555"}
            />
          </div>

          {/* ── Courier Performance ── */}
          <div className="rounded-2xl p-6" style={{ background: "#111111" }}>
            <h2 className="text-[16px] font-black mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E8FF47" }}>
              Courier Performance
            </h2>

            {data.couriers.length === 0 ? (
              <p className="text-[13px] text-[#555]">No shipment data for this period.</p>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-[12px]" style={{ borderCollapse: "separate", borderSpacing: "0 4px" }}>
                  <thead>
                    <tr className="text-[#555] text-left">
                      <th className="pb-3 pr-4 font-semibold">Courier</th>
                      <th className="pb-3 px-3 font-semibold text-right">Total</th>
                      <th className="pb-3 px-3 font-semibold text-right">Delivered</th>
                      <th className="pb-3 px-3 font-semibold text-right">RTO</th>
                      <th className="pb-3 px-3 font-semibold text-right">Failed</th>
                      <th className="pb-3 px-3 font-semibold text-right">Lost</th>
                      <th className="pb-3 px-3 font-semibold text-right">Avg Delivery</th>
                      <th className="pb-3 pl-3  font-semibold">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.couriers.map(c => {
                      const label = COURIER_LABELS[c.name] ?? c.name;
                      const color = rateColor(c.successRate);
                      return (
                        <tr key={c.name} style={{ background: "#161616" }}>
                          <td className="py-3 pl-4 pr-4 rounded-l-xl font-semibold text-white">{label}</td>
                          <td className="py-3 px-3 text-right text-[#888]">{c.total}</td>
                          <td className="py-3 px-3 text-right font-bold" style={{ color: "#22C55E" }}>{c.delivered}</td>
                          <td className="py-3 px-3 text-right" style={{ color: c.rto > 0 ? "#F59E0B" : "#555" }}>
                            {c.rto > 0 ? `${c.rto} (${c.rtoRate}%)` : "—"}
                          </td>
                          <td className="py-3 px-3 text-right" style={{ color: c.failedDelivery > 0 ? "#EF4444" : "#555" }}>
                            {c.failedDelivery > 0 ? c.failedDelivery : "—"}
                          </td>
                          <td className="py-3 px-3 text-right" style={{ color: c.lost > 0 ? "#EF4444" : "#555" }}>
                            {c.lost > 0 ? c.lost : "—"}
                          </td>
                          <td className="py-3 px-3 text-right text-[#888]">{hoursToLabel(c.avgDeliveryHours)}</td>
                          <td className="py-3 pl-3 pr-4 rounded-r-xl w-[180px]">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-[13px] w-10 shrink-0" style={{ color }}>{c.successRate}%</span>
                              <RateBar value={c.successRate} color={color} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── SLA + COD ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* SLA */}
            <div className="rounded-2xl p-6" style={{ background: "#111111" }}>
              <h2 className="text-[16px] font-black mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E8FF47" }}>
                SLA Performance
              </h2>
              {data.sla.withEstimate === 0 ? (
                <p className="text-[13px] text-[#555]">No shipments with estimated delivery dates.</p>
              ) : (
                <div className="space-y-4">
                  {data.sla.rate !== null && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[12px] text-[#666]">On-time rate</span>
                        <span className="text-[14px] font-black" style={{ color: rateColor(data.sla.rate) }}>
                          {data.sla.rate}%
                        </span>
                      </div>
                      <RateBar value={data.sla.rate} color={rateColor(data.sla.rate)} />
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {[
                      { label: "On Time",       value: data.sla.onTime,         icon: CheckCircle2, color: "#22C55E" },
                      { label: "Late",          value: data.sla.late,           icon: AlertCircle,  color: "#EF4444" },
                      { label: "Overdue (in-flight)", value: data.sla.pendingOverdue, icon: Clock, color: "#F59E0B" },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="rounded-xl p-3 text-center" style={{ background: "#1A1A1A" }}>
                        <Icon className="h-4 w-4 mx-auto mb-1" style={{ color }} />
                        <p className="text-[18px] font-black" style={{ color }}>{value}</p>
                        <p className="text-[10px] text-[#555] mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* COD */}
            <div className="rounded-2xl p-6" style={{ background: "#111111" }}>
              <h2 className="text-[16px] font-black mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E8FF47" }}>
                COD Performance
              </h2>
              {data.cod.total === 0 ? (
                <p className="text-[13px] text-[#555]">No COD shipments in this period.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[12px] text-[#666]">Collection rate</span>
                      <span className="text-[14px] font-black" style={{ color: rateColor(data.cod.successRate) }}>
                        {data.cod.successRate}%
                      </span>
                    </div>
                    <RateBar value={data.cod.successRate} color={rateColor(data.cod.successRate)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {[
                      { label: "COD Orders",  value: data.cod.total,      icon: Package,    color: "#E8FF47" },
                      { label: "Collected",   value: data.cod.collected,  icon: CheckCircle2, color: "#22C55E" },
                      { label: "RTO",         value: data.cod.rto,        icon: RotateCcw,  color: "#F59E0B" },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="rounded-xl p-3 text-center" style={{ background: "#1A1A1A" }}>
                        <Icon className="h-4 w-4 mx-auto mb-1" style={{ color }} />
                        <p className="text-[18px] font-black" style={{ color }}>{value}</p>
                        <p className="text-[10px] text-[#555] mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Regional Performance + Delayed Regions ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* State table */}
            <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: "#111111" }}>
              <h2 className="text-[16px] font-black mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E8FF47" }}>
                Delivery by State
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]" style={{ borderCollapse: "separate", borderSpacing: "0 3px" }}>
                  <thead>
                    <tr className="text-[#555] text-left">
                      <th className="pb-2 pr-4 font-semibold">State</th>
                      <th className="pb-2 px-3 font-semibold text-right">Orders</th>
                      <th className="pb-2 px-3 font-semibold text-right">Delivered</th>
                      <th className="pb-2 pl-3  font-semibold text-right">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stateStats.slice(0, 15).map(s => (
                      <tr key={s.state} style={{ background: "#161616" }}>
                        <td className="py-2.5 pl-3 pr-4 rounded-l-xl font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-[#444]" />
                            {s.state}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#888]">{s.total}</td>
                        <td className="py-2.5 px-3 text-right" style={{ color: "#22C55E" }}>{s.delivered}</td>
                        <td className="py-2.5 pl-3 pr-3 rounded-r-xl text-right text-[#888]">
                          {hoursToLabel(s.avgDeliveryHours)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delayed regions */}
            <div className="rounded-2xl p-6" style={{ background: "#111111" }}>
              <h2 className="text-[16px] font-black mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E8FF47" }}>
                Most Delayed
              </h2>
              {data.topDelayedRegions.length === 0 ? (
                <p className="text-[13px] text-[#555]">No delayed deliveries.</p>
              ) : (
                <div className="space-y-2">
                  {data.topDelayedRegions.map((r, i) => {
                    const maxCount = data.topDelayedRegions[0].count;
                    const pct      = Math.round((r.count / maxCount) * 100);
                    return (
                      <div key={r.state}>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[12px] text-[#CCC] font-semibold">{r.state}</span>
                          <span className="text-[11px] text-[#666]">{r.count} late</span>
                        </div>
                        <div className="h-1 rounded-full bg-[#1A1A1A] overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: i === 0 ? "#EF4444" : "#F59E0B" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Courier COD performance breakdown */}
              <h2 className="text-[16px] font-black mt-6 mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E8FF47" }}>
                COD by Courier
              </h2>
              {data.couriers.filter(c => c.codOrders > 0).length === 0 ? (
                <p className="text-[13px] text-[#555]">No COD data.</p>
              ) : (
                <div className="space-y-3">
                  {data.couriers.filter(c => c.codOrders > 0).map(c => (
                    <div key={c.name}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[12px] text-[#CCC] font-semibold">
                          {COURIER_LABELS[c.name] ?? c.name}
                        </span>
                        <span className="text-[11px]" style={{ color: rateColor(c.codSuccessRate) }}>
                          {c.codSuccessRate}%
                        </span>
                      </div>
                      <RateBar value={c.codSuccessRate} color={rateColor(c.codSuccessRate)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
