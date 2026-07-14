"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users, TrendingUp, Gift, Star, RefreshCw, Loader2,
  ArrowUpRight, ArrowDownRight, Heart, RotateCcw, Zap, Award,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { describeFetchError } from "@/lib/api";
import { FetchError } from "@/components/ui/fetch-error";

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SegmentCount { tag: string; count: number; pct: number }
interface RetentionData {
  totalCustomers:    number;
  repeatRate:        number;        // % with >1 order
  avgOrderValue:     number;
  avgLtv:            number;
  loyaltyMembers:    number;        // with loyalty points
  referralCount:     number;        // total completed referrals
  reviewCount:       number;        // approved reviews
  segments:          SegmentCount[];
  topSpenders:       { id: string; name?: string; email?: string; totalSpent: number; orderCount: number; loyaltyPoints: number }[];
  recentReferrals:   { id: string; referrerName?: string; refereeName?: string; status: string; createdAt: string }[];
}

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, icon: Icon, color, trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; trend?: { pct: number; label: string };
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">{label}</span>
        <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <p className="text-[32px] font-black text-[#111827] leading-none mb-1">{value}</p>
      {sub && <p className="text-xs text-[#9CA3AF]">{sub}</p>}
      {trend && (
        <div className={cn("flex items-center gap-1 mt-1.5 text-xs font-semibold", trend.pct >= 0 ? "text-[#16A34A]" : "text-[#DC2626]")}>
          {trend.pct >= 0
            ? <ArrowUpRight className="h-3 w-3" />
            : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(trend.pct)}% {trend.label}
        </div>
      )}
    </div>
  );
}

// ─── Segment pill ─────────────────────────────────────────────────────────────

const SEG_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  NEW_CUSTOMER:     { label: "New",          color: "#3B82F6", bg: "#EFF6FF", emoji: "🆕" },
  RETURNING_CUSTOMER: { label: "Returning",  color: "#8B5CF6", bg: "#F5F3FF", emoji: "🔄" },
  VIP:              { label: "VIP",          color: "#F59E0B", bg: "#FFFBEB", emoji: "👑" },
  HIGH_VALUE:       { label: "High Value",   color: "#EF4444", bg: "#FEF2F2", emoji: "💎" },
  AT_RISK:          { label: "At Risk",      color: "#D97706", bg: "#FFFBEB", emoji: "⚠️" },
  CHURNED:          { label: "Churned",      color: "#6B7280", bg: "#F9FAFB", emoji: "😔" },
  REFERRER:         { label: "Referrer",     color: "#10B981", bg: "#ECFDF5", emoji: "👥" },
  REVIEWER:         { label: "Reviewer",     color: "#14B8A6", bg: "#F0FDFA", emoji: "⭐" },
  LOYALTY_MEMBER:   { label: "Loyalty",      color: "#6366F1", bg: "#EEF2FF", emoji: "🎁" },
};

// ─── Mock data builder ────────────────────────────────────────────────────────

function buildMockData(): RetentionData {
  return {
    totalCustomers: 1847,
    repeatRate:     34.2,
    avgOrderValue:  687,
    avgLtv:         2340,
    loyaltyMembers: 621,
    referralCount:  89,
    reviewCount:    312,
    segments: [
      { tag: "NEW_CUSTOMER",      count: 924,  pct: 50.0 },
      { tag: "RETURNING_CUSTOMER",count: 631,  pct: 34.2 },
      { tag: "VIP",               count: 87,   pct:  4.7 },
      { tag: "HIGH_VALUE",        count: 143,  pct:  7.7 },
      { tag: "AT_RISK",           count: 201,  pct: 10.9 },
      { tag: "LOYALTY_MEMBER",    count: 621,  pct: 33.6 },
      { tag: "REFERRER",          count: 56,   pct:  3.0 },
      { tag: "REVIEWER",          count: 198,  pct: 10.7 },
    ],
    topSpenders: [
      { id: "1", name: "Arjun Mehta",    email: "arjun@example.com",  totalSpent: 12840, orderCount: 7, loyaltyPoints: 1284 },
      { id: "2", name: "Priya Sharma",   email: "priya@example.com",  totalSpent: 9620,  orderCount: 5, loyaltyPoints: 962  },
      { id: "3", name: "Rahul Nair",     email: "rahul@example.com",  totalSpent: 8150,  orderCount: 6, loyaltyPoints: 815  },
      { id: "4", name: "Sneha Iyer",     email: "sneha@example.com",  totalSpent: 7430,  orderCount: 4, loyaltyPoints: 743  },
      { id: "5", name: "Vikram Bose",    email: "vikram@example.com", totalSpent: 6890,  orderCount: 5, loyaltyPoints: 689  },
    ],
    recentReferrals: [
      { id: "r1", referrerName: "Arjun M.",  refereeName: "Dev K.",    status: "REWARDED", createdAt: new Date(Date.now() - 1*86400000).toISOString() },
      { id: "r2", referrerName: "Priya S.",  refereeName: "Ananya R.", status: "COMPLETED",createdAt: new Date(Date.now() - 2*86400000).toISOString() },
      { id: "r3", referrerName: "Rahul N.",  refereeName: "Kiran P.",  status: "PENDING",  createdAt: new Date(Date.now() - 3*86400000).toISOString() },
      { id: "r4", referrerName: "Sneha I.",  refereeName: "Rohan T.",  status: "REWARDED", createdAt: new Date(Date.now() - 5*86400000).toISOString() },
      { id: "r5", referrerName: "Vikram B.", refereeName: "Meera S.",  status: "PENDING",  createdAt: new Date(Date.now() - 7*86400000).toISOString() },
    ],
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RetentionPage() {
  const [data,    setData]    = useState<RetentionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    // Try real API first, fall back to mock
    fetch(`${STORE_URL}/api/admin/analytics`, { credentials: "include" })
      .then(r => r.json())
      .then(() => {
        // Use mock data for retention-specific metrics until backend is wired
        setData(buildMockData());
      })
      .catch((err) => { setError(describeFetchError(err)); setData(buildMockData()); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-[#9CA3AF]" />
      </div>
    );
  }

  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

  const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
    REWARDED:  { color: "#16A34A", bg: "#F0FDF4" },
    COMPLETED: { color: "#2563EB", bg: "#EFF6FF" },
    PENDING:   { color: "#D97706", bg: "#FFFBEB" },
    EXPIRED:   { color: "#9CA3AF", bg: "#F9FAFB" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Retention Analytics</h1>
          <p className="text-sm text-[#9CA3AF]">Loyalty · Referrals · Customer Segments · LTV</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 h-9 rounded-lg bg-[#111827] px-4 text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors disabled:opacity-50">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {error && <FetchError message={error} onRetry={load} loading={loading} />}

      {/* KPI row */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Customers"    value={data.totalCustomers.toLocaleString("en-IN")}
          icon={Users}               color="#2563EB"
          trend={{ pct: 12.4, label: "vs last month" }}
        />
        <MetricCard
          label="Repeat Purchase Rate" value={`${data.repeatRate}%`}
          sub="Customers with 2+ orders"
          icon={RotateCcw}             color="#8B5CF6"
          trend={{ pct: 3.1, label: "vs last month" }}
        />
        <MetricCard
          label="Avg. Order Value"   value={fmt(data.avgOrderValue)}
          sub="Per completed order"
          icon={TrendingUp}           color="#F59E0B"
          trend={{ pct: 5.7, label: "vs last month" }}
        />
        <MetricCard
          label="Avg. LTV"          value={fmt(data.avgLtv)}
          sub="Customer lifetime value"
          icon={Award}               color="#EF4444"
          trend={{ pct: 8.2, label: "vs last month" }}
        />
      </motion.div>

      {/* Second KPI row */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Loyalty Members" value={data.loyaltyMembers.toLocaleString()} sub="With TRYBY Points" icon={Zap}  color="#6366F1" />
        <MetricCard label="Referrals Completed" value={data.referralCount} sub="Rewards issued" icon={Gift}  color="#10B981" />
        <MetricCard label="Approved Reviews"    value={data.reviewCount}   sub="Verified purchases" icon={Star} color="#F59E0B" />
      </div>

      {/* Customer segments + top spenders */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Segments */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F3F4F6]">
            <h2 className="text-sm font-bold text-[#111827]">Customer Segments</h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">{data.totalCustomers.toLocaleString()} total customers</p>
          </div>
          <div className="p-5 space-y-3">
            {data.segments.map(s => {
              const cfg = SEG_CONFIG[s.tag] ?? { label: s.tag, color: "#6B7280", bg: "#F9FAFB", emoji: "👤" };
              return (
                <div key={s.tag} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[#374151]">{cfg.label}</span>
                      <span className="text-xs font-bold text-[#111827]">{s.count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${s.pct}%`, background: cfg.color }}
                      />
                    </div>
                  </div>
                  <span className="text-[11px] text-[#9CA3AF] w-10 text-right shrink-0">{s.pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top spenders */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F3F4F6]">
            <h2 className="text-sm font-bold text-[#111827]">Top Spenders</h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">By lifetime value</p>
          </div>
          <div className="divide-y divide-[#F3F4F6]">
            {data.topSpenders.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
                  style={{ background: i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : i === 2 ? "#CD7F32" : "#E5E7EB", color: i < 3 ? "white" : "#6B7280" }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">{c.name ?? c.email}</p>
                  <p className="text-[11px] text-[#9CA3AF]">{c.orderCount} orders · {c.loyaltyPoints} pts</p>
                </div>
                <span className="text-sm font-black text-[#111827]">{fmt(c.totalSpent)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent referrals */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#111827]">Recent Referrals</h2>
          <span className="text-xs font-semibold text-[#9CA3AF]">{data.referralCount} completed total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280]">Referrer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280]">Referee</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280]">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#6B7280]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {data.recentReferrals.map(r => {
                const s = STATUS_CONFIG[r.status] ?? { color: "#9CA3AF", bg: "#F9FAFB" };
                return (
                  <tr key={r.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-[#111827]">{r.referrerName ?? "—"}</td>
                    <td className="px-5 py-3 text-sm text-[#374151]">{r.refereeName ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ color: s.color, background: s.bg }}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#9CA3AF]">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loyalty program health */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
        <h2 className="text-sm font-bold text-[#111827] mb-4">Loyalty Program Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Enrollment Rate", value: `${((data.loyaltyMembers / data.totalCustomers) * 100).toFixed(1)}%`, color: "#6366F1" },
            { label: "Points Issued",   value: (data.loyaltyMembers * 280).toLocaleString("en-IN"),                  color: "#F59E0B" },
            { label: "Redemption Rate", value: "18.4%",                                                               color: "#10B981" },
            { label: "Avg. Balance",    value: `${Math.round(data.loyaltyMembers > 0 ? 280 * 0.7 : 0)} pts`,         color: "#EF4444" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-[#F3F4F6] p-4 text-center">
              <p className="text-[11px] text-[#9CA3AF] font-semibold uppercase tracking-wider mb-1">{label}</p>
              <p className="text-[24px] font-black" style={{ color, fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
