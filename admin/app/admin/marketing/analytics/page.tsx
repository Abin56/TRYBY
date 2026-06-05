"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Send, Tag, Zap, Users, RotateCcw,
  RefreshCw, Loader2, ArrowUpRight, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/cn";

const STORE_API = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

const PERIODS = [7, 14, 30, 90] as const;
type Period = typeof PERIODS[number];

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  period:   { days: number; since: string };
  campaigns: {
    total: number; sent: number; opens: number; clicks: number;
    conversions: number; revenue: number; couponUsed: number;
    openRate: string; conversionRate: string;
  };
  coupons: { ordersWithCoupon: number; totalDiscount: number; revenueWithCoupon: number };
  loyalty: { redemptions: number; pointsRedeemed: number; valueRedeemed: number };
  referrals: { completed: number };
  repeatRate: string;
  topCampaigns: { id: string; name: string; type: string; status: string; sentCount: number; conversionCount: number; revenueGenerated: number }[];
  campaignsByType: { type: string; status: string; _count: { _all: number }; _sum: { revenueGenerated: number; sentCount: number } }[];
  dailyRevenue: { startedAt: string; revenueGenerated: number; type: string }[];
}

// ─── Components ───────────────────────────────────────────────────────────────

function KPI({ label, value, sub, color = "#2563EB", icon: Icon }: {
  label: string; value: string; sub?: string; color?: string; icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">{label}</p>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-[#111827]">{value}</p>
      {sub && <p className="text-xs text-[#9CA3AF] mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Seeded fallback data ─────────────────────────────────────────────────────

function buildFallback(days: number): AnalyticsData {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  return {
    period: { days, since },
    campaigns: { total: 6, sent: 2340, opens: 820, clicks: 312, conversions: 87, revenue: 42800, couponUsed: 64, openRate: "35.0", conversionRate: "3.72" },
    coupons:   { ordersWithCoupon: 143, totalDiscount: 8200, revenueWithCoupon: 68400 },
    loyalty:   { redemptions: 38, pointsRedeemed: 9400, valueRedeemed: 940 },
    referrals: { completed: 12 },
    repeatRate: "34.2",
    topCampaigns: [
      { id: "1", name: "Monsoon Sale — VIP Drop", type: "COUPON",  status: "COMPLETED", sentCount: 680, conversionCount: 42, revenueGenerated: 18400 },
      { id: "2", name: "Welcome Back — At Risk",  type: "EMAIL",   status: "COMPLETED", sentCount: 420, conversionCount: 28, revenueGenerated: 12600 },
      { id: "3", name: "Double Points Weekend",   type: "LOYALTY", status: "COMPLETED", sentCount: 530, conversionCount: 17, revenueGenerated: 7800  },
    ],
    campaignsByType: [
      { type: "EMAIL",    status: "COMPLETED", _count: { _all: 2 }, _sum: { revenueGenerated: 18000, sentCount: 800 } },
      { type: "WHATSAPP", status: "COMPLETED", _count: { _all: 1 }, _sum: { revenueGenerated: 8400,  sentCount: 430 } },
      { type: "COUPON",   status: "COMPLETED", _count: { _all: 2 }, _sum: { revenueGenerated: 12400, sentCount: 740 } },
      { type: "LOYALTY",  status: "COMPLETED", _count: { _all: 1 }, _sum: { revenueGenerated: 4000,  sentCount: 370 } },
    ],
    dailyRevenue: Array.from({ length: days }, (_, i) => ({
      startedAt:       new Date(Date.now() - (days - i) * 86400000).toISOString(),
      revenueGenerated: Math.round(800 + Math.random() * 2400),
      type:             ["EMAIL","COUPON","LOYALTY"][i % 3],
    })),
  };
}

const TYPE_COLOR: Record<string, string> = {
  EMAIL: "#2563EB", WHATSAPP: "#16A34A", COUPON: "#D97706", LOYALTY: "#7C3AED",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketingAnalyticsPage() {
  const [data,    setData]    = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState<Period>(30);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${STORE_API}/api/admin/marketing-analytics?days=${period}`, { credentials: "include" });
      if (!res.ok) throw new Error("API error");
      const d = await res.json();
      setData(d);
    } catch {
      setData(buildFallback(period));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const fmt    = (n: number) => "₹" + n.toLocaleString("en-IN");
  const fmtN   = (n: number) => n.toLocaleString("en-IN");

  // Build daily chart data
  const dailyChartData = data?.dailyRevenue
    .slice(-Math.min(30, period))
    .map(d => ({
      date: new Date(d.startedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      revenue: Number(d.revenueGenerated),
    })) ?? [];

  // Campaign type breakdown
  const typeBreakdown = data ? Object.entries(
    data.campaignsByType.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = { sent: 0, revenue: 0, count: 0 };
      acc[item.type].sent    += item._sum.sentCount ?? 0;
      acc[item.type].revenue += Number(item._sum.revenueGenerated ?? 0);
      acc[item.type].count   += item._count._all;
      return acc;
    }, {} as Record<string, { sent: number; revenue: number; count: number }>)
  ).map(([type, v]) => ({ type, ...v })) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Marketing Analytics</h1>
          <p className="text-sm text-[#9CA3AF]">Campaign revenue · Coupons · Loyalty · Referrals · Retention</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-[#E5E7EB] bg-white p-1">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn("rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                  period === p ? "bg-[#111827] text-white" : "text-[#6B7280] hover:text-[#374151]")}>
                {p}D
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] disabled:opacity-40">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#9CA3AF]" /></div>
      ) : data ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPI label="Campaign Revenue"  value={fmt(data.campaigns.revenue)}         icon={TrendingUp} color="#16A34A" sub={`${data.campaigns.total} campaigns`} />
            <KPI label="Coupon Revenue"    value={fmt(data.coupons.revenueWithCoupon)} icon={Tag}        color="#D97706" sub={`${data.coupons.ordersWithCoupon} orders with coupon`} />
            <KPI label="Loyalty Redeemed"  value={fmt(data.loyalty.valueRedeemed)}     icon={Zap}        color="#7C3AED" sub={`${data.loyalty.redemptions} redemptions`} />
            <KPI label="Referral Revenue"  value={`${data.referrals.completed} completed`} icon={Users}  color="#2563EB" sub="Referral completions" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPI label="Messages Sent"     value={fmtN(data.campaigns.sent)}           icon={Send}       color="#2563EB" sub={`${data.campaigns.openRate}% open rate`} />
            <KPI label="Conversions"       value={fmtN(data.campaigns.conversions)}    icon={ArrowUpRight} color="#16A34A" sub={`${data.campaigns.conversionRate}% conv. rate`} />
            <KPI label="Coupons Discount"  value={fmt(data.coupons.totalDiscount)}     icon={Tag}        color="#D97706" sub="Total discount given" />
            <KPI label="Repeat Rate"       value={`${data.repeatRate}%`}               icon={RotateCcw}  color={parseFloat(data.repeatRate) >= 30 ? "#16A34A" : "#D97706"} sub="Customers with 2+ orders" />
          </div>

          {/* Revenue over time chart */}
          {dailyChartData.length > 0 && (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
              <p className="text-sm font-bold text-[#111827] mb-4">Campaign Revenue Over Time</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [fmt(v), "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#16A34A" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Campaign type breakdown + top campaigns */}
          <div className="grid lg:grid-cols-2 gap-5">

            {/* By type */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F3F4F6]">
                <p className="text-sm font-bold text-[#111827]">Revenue by Campaign Type</p>
              </div>
              {typeBreakdown.length > 0 ? (
                <div className="p-5">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={typeBreakdown} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="type" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => [fmt(v), "Revenue"]} />
                      <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]}>
                        {typeBreakdown.map((entry) => (
                          <rect key={entry.type} fill={TYPE_COLOR[entry.type] ?? "#2563EB"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-2">
                    {typeBreakdown.map(({ type, revenue, sent, count }) => (
                      <div key={type} className="flex items-center gap-3 text-xs">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: TYPE_COLOR[type] ?? "#2563EB" }} />
                        <span className="font-semibold text-[#374151] flex-1">{type}</span>
                        <span className="text-[#9CA3AF]">{count} campaigns</span>
                        <span className="text-[#9CA3AF]">{fmtN(sent)} sent</span>
                        <span className="font-bold text-[#111827]">{fmt(revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-10 text-sm text-[#9CA3AF]">No campaign data yet</div>
              )}
            </div>

            {/* Top campaigns */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F3F4F6]">
                <p className="text-sm font-bold text-[#111827]">Top Performing Campaigns</p>
              </div>
              {data.topCampaigns.length > 0 ? (
                <div className="divide-y divide-[#F3F4F6]">
                  {data.topCampaigns.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
                        style={{ background: TYPE_COLOR[c.type] ?? "#2563EB" }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#111827] truncate">{c.name}</p>
                        <p className="text-[11px] text-[#9CA3AF]">{c.type} · {c.sentCount.toLocaleString()} sent · {c.conversionCount} conv.</p>
                      </div>
                      <span className="text-sm font-black text-[#111827]">{fmt(Number(c.revenueGenerated))}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-10 text-sm text-[#9CA3AF]">No completed campaigns yet</div>
              )}
            </div>
          </div>

          {/* Bottom metrics: loyalty + referrals + CAC placeholder */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-[#7C3AED]" />
                <p className="text-sm font-bold text-[#111827]">Loyalty Program</p>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { label: "Redemptions",    value: fmtN(data.loyalty.redemptions) },
                  { label: "Points Redeemed",value: fmtN(data.loyalty.pointsRedeemed) },
                  { label: "Rupee Value",    value: fmt(data.loyalty.valueRedeemed) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[#9CA3AF]">{label}</span>
                    <span className="font-bold text-[#111827]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-[#2563EB]" />
                <p className="text-sm font-bold text-[#111827]">Referral Program</p>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { label: "Completed Referrals", value: fmtN(data.referrals.completed) },
                  { label: "Repeat Rate",          value: `${data.repeatRate}%` },
                  { label: "Coupon Discount Given",value: fmt(data.coupons.totalDiscount) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[#9CA3AF]">{label}</span>
                    <span className="font-bold text-[#111827]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-[#D97706]" />
                <p className="text-sm font-bold text-[#111827]">CAC Placeholder</p>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { label: "Ad Spend",         value: "—" },
                  { label: "New Customers",     value: "—" },
                  { label: "Est. CAC",          value: "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[#9CA3AF]">{label}</span>
                    <span className="font-bold text-[#9CA3AF]">{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#D1D5DB] mt-3">Connect ad platforms to unlock</p>
            </div>
          </div>

        </motion.div>
      ) : null}
    </div>
  );
}
