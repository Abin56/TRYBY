"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Users, RotateCcw, IndianRupee, RefreshCw } from "lucide-react";

interface AnalyticsData {
  period: { days: number; start: string; end: string };
  kpis: { repeatRate: number; churnRate: number; newCustomers: number; activeBuyers: number };
  revenueByDay: { createdAt: string; _sum: { total: string | null }; _count: { _all: number } }[];
  newCustomersByDay: { createdAt: string; _count: number }[];
  aovByDay: { createdAt: string; _avg: { total: string | null }; _count: { _all: number } }[];
  ltvBuckets: Record<string, number>;
  segmentBreakdown: Record<string, number>;
  topCustomers: {
    userId: string; ltv: string; orderCount: number; segments: string[];
    user: { id: string; name: string | null; email: string | null } | null;
  }[];
}

const SEGMENT_COLORS: Record<string, string> = {
  VIP: "#F5C518", HIGH_VALUE: "#A78BFA", REPEAT_BUYER: "#3B82F6",
  NEW_CUSTOMER: "#22C55E", LOYAL: "#06B6D4", WHOLESALE: "#8B5CF6",
  INACTIVE: "#6B7280", CHURNED: "#EF4444", REFUND_RISK: "#EC4899",
  COD_RISK: "#F97316", AT_RISK: "#EAB308",
};

export default function CrmAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/admin/crm/analytics?days=${days}`);
    const json = await r.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => { load(); }, [days]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-6 w-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );

  if (!data) return <p className="text-white/40 p-8">Failed to load.</p>;

  const { kpis, ltvBuckets, segmentBreakdown, topCustomers, revenueByDay } = data;

  // Total revenue
  const totalRevenue = revenueByDay.reduce((s, d) => s + Number(d._sum.total ?? 0), 0);
  const totalOrders = revenueByDay.reduce((s, d) => s + d._count._all, 0);

  // Sort segment breakdown by count
  const sortedSegments = Object.entries(segmentBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const maxSeg = Math.max(...sortedSegments.map(([, c]) => c), 1);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white font-black text-2xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
            CRM ANALYTICS
          </h1>
          <p className="text-white/40 text-[13px]">Customer retention, LTV, and segment intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className="px-3 py-1.5 rounded-lg text-[13px] font-medium"
              style={{
                background: days === d ? "#E8FF47" : "#111111",
                color: days === d ? "#0D0D0D" : "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
              {d}d
            </button>
          ))}
          <Link href="/admin/crm" className="text-[12px] text-white/40 hover:text-white px-3 py-1.5 rounded-lg"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            ← CRM
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Revenue", value: `₹${Math.round(totalRevenue / 1000)}K`, sub: `${totalOrders} orders`, color: "#A78BFA", icon: IndianRupee },
          { label: "Repeat Purchase Rate", value: `${kpis.repeatRate}%`, sub: "customers buying 2+", color: "#3B82F6", icon: TrendingUp },
          { label: "Churn Rate", value: `${kpis.churnRate}%`, sub: "lost vs prev period", color: kpis.churnRate > 30 ? "#EF4444" : "#22C55E", icon: RotateCcw },
          { label: "Active Buyers", value: kpis.activeBuyers.toLocaleString(), sub: `${kpis.newCustomers} new`, color: "#22C55E", icon: Users },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="rounded-xl p-5" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
            </div>
            <p className="text-[26px] font-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
            <p className="text-white/50 text-[12px] mt-1">{label}</p>
            <p className="text-white/30 text-[11px] mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* LTV + Segment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LTV Distribution */}
        <div className="rounded-xl p-5" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-white font-bold text-[14px] mb-4">LTV Distribution</h2>
          <div className="space-y-3">
            {Object.entries(ltvBuckets).map(([bucket, count]) => {
              const maxCount = Math.max(...Object.values(ltvBuckets), 1);
              const pct = (count / maxCount) * 100;
              return (
                <div key={bucket}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-white/60">₹{bucket}</span>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/08">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Segment Breakdown */}
        <div className="rounded-xl p-5" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-white font-bold text-[14px] mb-4">Segment Breakdown</h2>
          <div className="space-y-2.5">
            {sortedSegments.map(([seg, count]) => (
              <div key={seg}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span style={{ color: SEGMENT_COLORS[seg] ?? "#9CA3AF" }}>{seg.replace(/_/g, " ")}</span>
                  <span className="text-white font-bold">{count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/08">
                  <div className="h-full rounded-full" style={{ width: `${(count / maxSeg) * 100}%`, background: SEGMENT_COLORS[seg] ?? "#9CA3AF" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top customers by spend */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h2 className="text-white font-bold text-[14px]">Top Customers by Lifetime Value</h2>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["#", "Customer", "Segments", "LTV", "Orders"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-white/40 font-medium text-[11px] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topCustomers.map((c, i) => (
              <tr key={c.userId} className="border-t hover:bg-white/02" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <td className="px-5 py-3 text-white/25 font-mono text-[12px]">{i + 1}</td>
                <td className="px-5 py-3">
                  <Link href={`/admin/crm/customers/${c.userId}`} className="group">
                    <p className="text-white group-hover:text-blue-400">{c.user?.name ?? "—"}</p>
                    <p className="text-white/40 text-[11px]">{c.user?.email}</p>
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.segments.slice(0, 2).map((seg) => (
                      <span key={seg} className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                        style={{ color: SEGMENT_COLORS[seg], background: `${SEGMENT_COLORS[seg]}18` }}>
                        {seg.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3 text-white font-bold">₹{Number(c.ltv).toLocaleString("en-IN")}</td>
                <td className="px-5 py-3 text-white/60">{c.orderCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
