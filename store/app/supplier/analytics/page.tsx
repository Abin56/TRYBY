"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, IndianRupee, ShoppingBag, Package,
  Wallet, ArrowUpRight, ArrowDownRight, Star, Target,
} from "lucide-react";

type PeriodStats = {
  earnings: number; grossRevenue: number; growthPct: number; orders: number;
};

type AllTime = {
  grossRevenue: number; supplierEarnings: number; platformFees: number;
  totalOrders: number; totalUnitsSold: number; pendingPayout: number;
};

type ChartPoint = { date: string; revenue: number; orders: number };

type TopProduct = {
  productId: string; name: string; slug: string; imageUrl: string | null;
  avgRating: number; totalRevenue: number; unitsSold: number;
};

type Payout = { id: string; amount: number; status: string; createdAt: string; processedAt: string | null };

type Analytics = {
  commissionRate:   number;
  performanceScore: number;
  fulfillmentRate:  number;
  returnRate:       number;
  supplierAvgRating: number;
  period:           PeriodStats;
  allTime:          AllTime;
  chartData:        ChartPoint[];
  topProducts:      TopProduct[];
  recentPayouts:    Payout[];
};

const RANGES = [
  { label: "7d",  value: "7"  },
  { label: "30d", value: "30" },
  { label: "90d", value: "90" },
];

const PAYOUT_COLOR: Record<string, string> = {
  PENDING:   "#F5C518",
  APPROVED:  "#60A5FA",
  PROCESSED: "#4ADE80",
  REJECTED:  "#F87171",
  FAILED:    "#F87171",
};

export default function SupplierAnalyticsPage() {
  const [data, setData]       = useState<Analytics | null>(null);
  const [range, setRange]     = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/supplier/analytics?range=${range}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, [range]);

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
      </div>
    );
  }

  const { allTime, period, chartData, topProducts, recentPayouts, commissionRate, performanceScore, fulfillmentRate, returnRate, supplierAvgRating } = data;
  const yourPct  = ((1 - commissionRate) * 100).toFixed(0);
  const isGrowth = period.growthPct >= 0;
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Analytics
          </h1>
          <p className="text-white/40 text-[13px] mt-0.5">Revenue and performance overview</p>
        </div>
        <div className="flex items-center gap-1">
          {RANGES.map(r => (
            <button key={r.value} onClick={() => setRange(r.value)}
              className="rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-all"
              style={{
                background: range === r.value ? "#F5C518" : "rgba(255,255,255,0.06)",
                color:      range === r.value ? "#0D0D0D" : "rgba(255,255,255,0.50)",
              }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Period highlight + growth */}
      <div
        className="rounded-2xl p-5 mb-6 flex items-center justify-between gap-4"
        style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div>
          <p className="text-white/40 text-[12px] mb-1">Earnings — last {range} days</p>
          <p className="font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "34px" }}>
            {fmt(period.earnings)}
          </p>
          <p className="text-[12px] text-white/35 mt-1">{period.orders} orders · gross {fmt(period.grossRevenue)}</p>
        </div>
        <div className="text-right shrink-0">
          <div
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 mb-1 w-fit ml-auto"
            style={{ background: isGrowth ? "rgba(74,222,128,0.10)" : "rgba(248,113,113,0.10)" }}
          >
            {isGrowth ? (
              <ArrowUpRight className="h-4 w-4 text-[#4ADE80]" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-[#F87171]" />
            )}
            <span
              className="font-black text-[15px]"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: isGrowth ? "#4ADE80" : "#F87171" }}
            >
              {pct(period.growthPct)}
            </span>
          </div>
          <p className="text-[11px] text-white/30">vs previous {range} days</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Your Earnings (all time)", value: fmt(allTime.supplierEarnings), icon: IndianRupee, color: "#4ADE80", sub: `${yourPct}% of gross` },
          { label: "Total Orders",             value: allTime.totalOrders,            icon: ShoppingBag, color: "#60A5FA", sub: `${allTime.totalUnitsSold} units sold` },
          { label: "Platform Fees Paid",       value: fmt(allTime.platformFees),      icon: Package,    color: "#F87171", sub: `${(commissionRate * 100).toFixed(1)}% commission` },
          { label: "Pending Payout",           value: fmt(allTime.pendingPayout),     icon: Wallet,     color: "#A78BFA", sub: "Available to withdraw" },
        ].map(card => (
          <div key={card.label} className="flex flex-col gap-3 rounded-2xl p-4"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${card.color}18` }}>
              <card.icon className="h-4 w-4" style={{ color: card.color }} />
            </div>
            <div>
              <p className="text-white font-black leading-none mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px" }}>
                {card.value}
              </p>
              <p className="text-white/40 text-[11px] font-medium">{card.label}</p>
            </div>
            <p className="text-[11px]" style={{ color: card.color }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px" }}>
            Earnings — Last {range} days
          </h2>
          {period.growthPct !== 0 && (
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{
                background: isGrowth ? "rgba(74,222,128,0.10)" : "rgba(248,113,113,0.10)",
                color:      isGrowth ? "#4ADE80" : "#F87171",
              }}
            >
              {isGrowth ? "↑" : "↓"} {Math.abs(period.growthPct).toFixed(1)}% vs prior period
            </span>
          )}
        </div>
        {chartData.length === 0 ? (
          <p className="text-white/30 text-[13px] py-4 text-center">No revenue data in this period</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {chartData.map(d => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 100)}%`, background: "rgba(245,197,24,0.60)", minHeight: "4px" }}
                />
                <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 bg-black/90 rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap pointer-events-none">
                  {d.date}<br />₹{d.revenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance score */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-[#F5C518]" />
          <h2 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px" }}>
            Performance Score
          </h2>
          <span
            className="ml-auto font-black text-[28px]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: performanceScore >= 70 ? "#4ADE80" : performanceScore >= 40 ? "#F5C518" : "#F87171" }}
          >
            {performanceScore}<span className="text-[14px] text-white/30">/100</span>
          </span>
        </div>
        <div className="space-y-3">
          <ScoreBar label="Fulfilment Rate" value={Math.round(fulfillmentRate * 100)} color="#4ADE80" unit="%" />
          <ScoreBar label="Low Return Rate" value={Math.round((1 - returnRate) * 100)} color="#60A5FA" unit="%" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/40">Avg Customer Rating</span>
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-[#F5C518] fill-[#F5C518]" />
              <span className="font-black text-[15px] text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {supplierAvgRating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-white/25 mt-3">
          Score = Fulfilment (40pts) + Low Returns (30pts) + Rating (30pts). Updated as orders complete.
        </p>
      </div>

      {/* Top products + payouts */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Top products */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <h2 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px" }}>Top Products</h2>
          </div>
          {topProducts.length === 0 ? (
            <p className="px-5 py-6 text-[13px] text-white/30 text-center">No sales yet</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-[13px] font-black text-white/20 w-5 shrink-0" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {i + 1}
                  </span>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-8 w-8 rounded-lg shrink-0" style={{ background: "rgba(255,255,255,0.05)" }} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-white/80 truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-white/35">{p.unitsSold} units</span>
                      {p.avgRating > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-white/30">
                          <Star className="h-2.5 w-2.5 text-[#F5C518] fill-[#F5C518]" /> {p.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 font-black text-white text-[14px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {fmt(p.totalRevenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent payouts */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <h2 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px" }}>Recent Payouts</h2>
          </div>
          {recentPayouts.length === 0 ? (
            <p className="px-5 py-6 text-[13px] text-white/30 text-center">No payouts yet</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {recentPayouts.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                      style={{ background: `${PAYOUT_COLOR[p.status] ?? "#999"}18`, color: PAYOUT_COLOR[p.status] ?? "#999" }}
                    >
                      {p.status}
                    </span>
                    <p className="text-[11px] text-white/35 mt-1">
                      {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className="font-black text-white text-[15px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {fmt(Number(p.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function ScoreBar({ label, value, color, unit }: { label: string; value: number; color: string; unit: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[12px] text-white/40">{label}</span>
        <span className="text-[12px] font-bold" style={{ color }}>{value}{unit}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, value)}%`, background: color }} />
      </div>
    </div>
  );
}
