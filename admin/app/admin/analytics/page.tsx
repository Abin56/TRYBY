"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { formatPrice, formatCompact, formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { fetchJson, describeFetchError } from "@/lib/api";
import { FetchError } from "@/components/ui/fetch-error";
import {
  ArrowUpRight, ArrowDownRight, AlertTriangle, RefreshCw, Package,
} from "lucide-react";

const PERIODS = ["7D", "14D", "30D", "90D"] as const;
type Period = typeof PERIODS[number];

const PERIOD_DAYS: Record<Period, number> = { "7D": 7, "14D": 14, "30D": 30, "90D": 90 };

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayBucket { date: string; revenue: number; orders: number }

interface TopProduct {
  productId: string; productName: string;
  unitsSold: number; revenue: number;
}

interface CouponRow {
  id: string; code: string; type: string; value: number;
  usageCount: number; usageLimit?: number; isActive: boolean;
}

interface LowStockVariant {
  id: string; sku: string; size?: string; color?: string; stock: number;
  productName: string; productSlug: string;
}

interface AnalyticsData {
  kpis: {
    revenue:      { total: number; thisMonth: number; prevMonth: number; growth: number };
    orders:       { total: number; thisMonth: number; prevMonth: number; pending: number; growth: number };
    customers:    { total: number; newThisMonth: number };
    inventory:    { lowStock: number };
    avgOrderValue: number;
  };
  daily: DayBucket[];
  recentOrders: unknown[];
  topProducts:  TopProduct[];
  coupons:      CouponRow[];
  lowStockVariants: LowStockVariant[];
  days: number;
}

// ─── Components ───────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, growth, color = "#2563EB", loading }: {
  label: string; value: string; sub?: string; growth?: number; color?: string; loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <p className="text-xs font-medium text-[#6B7280] mb-2">{label}</p>
      {loading
        ? <div className="h-6 w-20 rounded bg-[#F3F4F6] animate-pulse mb-1" />
        : <p className="text-xl font-extrabold" style={{ color }}>{value}</p>
      }
      {sub && <p className="text-xs text-[#9CA3AF] mt-0.5">{sub}</p>}
      {growth !== undefined && !loading && (
        <div className={cn("flex items-center gap-1 mt-1 text-xs font-semibold", growth >= 0 ? "text-[#16A34A]" : "text-[#DC2626]")}>
          {growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(growth).toFixed(1)}% vs prev period
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period,  setPeriod]  = useState<Period>("30D");
  const [data,    setData]    = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchJson<AnalyticsData>(`/api/admin/analytics?days=${PERIOD_DAYS[period]}`));
    } catch (err) {
      // fetch() rejects with a TypeError ("Failed to fetch") when the store API
      // is unreachable or blocks the cross-origin request — catch it here so it
      // surfaces as an error state instead of an unhandled runtime crash.
      setData(null);
      setError(describeFetchError(err));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const totalRev    = data?.daily.reduce((s, d) => s + d.revenue, 0) ?? 0;
  const totalOrders = data?.daily.reduce((s, d) => s + d.orders, 0) ?? 0;

  // Format X axis date labels
  const tickInterval = PERIOD_DAYS[period] <= 7 ? 0 : PERIOD_DAYS[period] <= 14 ? 1 : PERIOD_DAYS[period] <= 30 ? 4 : 9;
  const fmtDate = (d: string) => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth() + 1}`; };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Analytics</h1>
          <p className="text-sm text-[#9CA3AF]">Performance overview and key metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[#E5E7EB] overflow-hidden">
            {PERIODS.map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn("px-3 py-1.5 text-xs font-semibold transition-colors", period === p ? "bg-[#111827] text-white" : "text-[#6B7280] hover:text-[#111827]")}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E7EB] px-3 text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Error banner — shown when the store API can't be reached or returns an error */}
      {error && <FetchError message={error} onRetry={load} loading={loading} />}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard label={`${period} Revenue`}      value={formatCompact(totalRev)}          sub={`${totalOrders} orders`}                   color="#2563EB"  loading={loading} growth={data?.kpis.revenue.growth} />
        <KPICard label="Monthly Revenue"          value={formatPrice(data?.kpis.revenue.thisMonth ?? 0)}  sub="this calendar month"        color="#2563EB"  loading={loading} />
        <KPICard label="Total Orders"             value={formatNumber(data?.kpis.orders.total ?? 0)}      sub={`${data?.kpis.orders.pending ?? 0} pending`}  color="#111827" loading={loading} growth={data?.kpis.orders.growth} />
        <KPICard label="Avg Order Value"          value={formatPrice(data?.kpis.avgOrderValue ?? 0)}     sub="per transaction"                color="#7C3AED" loading={loading} />
        <KPICard label="Total Customers"          value={formatNumber(data?.kpis.customers.total ?? 0)}  sub={`+${data?.kpis.customers.newThisMonth ?? 0} this month`} color="#059669" loading={loading} />
      </div>

      {/* Revenue area chart */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-medium text-[#6B7280]">Revenue Trend ({period})</p>
            <p className="text-xl font-extrabold text-[#111827] mt-0.5">{formatCompact(totalRev)}</p>
          </div>
        </div>
        {loading ? (
          <div className="h-[220px] bg-[#F9FAFB] rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.daily ?? []}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} tickFormatter={fmtDate} interval={tickInterval} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                formatter={(v: unknown) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                contentStyle={{ borderRadius: "10px", border: "1px solid #E5E7EB", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#revGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Orders bar chart + top products */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily orders bar */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <p className="text-sm font-medium text-[#6B7280] mb-4">Orders by Day</p>
          {loading ? (
            <div className="h-[180px] bg-[#F9FAFB] rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data?.daily ?? []} barSize={PERIOD_DAYS[period] <= 14 ? 12 : 6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} tickFormatter={fmtDate} interval={tickInterval} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip formatter={(v: unknown) => [v, "Orders"]} contentStyle={{ borderRadius: "10px", border: "1px solid #E5E7EB" }} />
                <Bar dataKey="orders" fill="#111827" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top products */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F3F4F6]">
            <p className="text-sm font-bold text-[#111827]">Top Products ({period})</p>
          </div>
          <div className="divide-y divide-[#F9FAFB]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="px-5 py-3 h-12 animate-pulse bg-[#F9FAFB] m-2 rounded" />)
            ) : (data?.topProducts ?? []).length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Package className="h-8 w-8 text-[#D1D5DB] mx-auto mb-2" />
                <p className="text-sm text-[#9CA3AF]">No orders in this period</p>
              </div>
            ) : (
              (data?.topProducts ?? []).slice(0, 8).map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-xs font-bold text-[#D1D5DB] w-4 shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111827] truncate">{p.productName}</p>
                    <p className="text-xs text-[#9CA3AF]">{formatNumber(p.unitsSold)} units sold</p>
                  </div>
                  <p className="text-sm font-bold text-[#111827] shrink-0">{formatPrice(p.revenue)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Coupons + Low stock */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Coupon usage */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F3F4F6]">
            <p className="text-sm font-bold text-[#111827]">Coupon Usage</p>
          </div>
          <div className="divide-y divide-[#F9FAFB]">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="px-5 py-3 h-12 animate-pulse bg-[#F9FAFB] m-2 rounded" />)
            ) : (data?.coupons ?? []).length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#9CA3AF] text-center">No coupons used yet</p>
            ) : (
              (data?.coupons ?? []).map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono font-bold text-[#111827]">{c.code}</p>
                      {!c.isActive && <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-[#F3F4F6] text-[#9CA3AF] font-semibold">Inactive</span>}
                    </div>
                    <p className="text-xs text-[#9CA3AF]">
                      {c.type === "PERCENTAGE" ? `${Number(c.value)}% off` : c.type === "FLAT" ? `₹${Number(c.value)} off` : "Free shipping"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-[#111827]">{formatNumber(c.usageCount)}</p>
                    <p className="text-xs text-[#9CA3AF]">{c.usageLimit ? `of ${c.usageLimit}` : "unlimited"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low stock */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-center justify-between">
            <p className="text-sm font-bold text-[#111827]">Low Stock Variants</p>
            {(data?.lowStockVariants ?? []).length > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-[#D97706]">
                <AlertTriangle className="h-3.5 w-3.5" /> {data!.lowStockVariants.length} variants
              </span>
            )}
          </div>
          <div className="divide-y divide-[#F9FAFB]">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="px-5 py-3 h-12 animate-pulse bg-[#F9FAFB] m-2 rounded" />)
            ) : (data?.lowStockVariants ?? []).length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#9CA3AF] text-center">All variants have healthy stock</p>
            ) : (
              (data?.lowStockVariants ?? []).map((v) => (
                <div key={v.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111827] truncate">{v.productName}</p>
                    <p className="text-xs font-mono text-[#9CA3AF]">{v.sku}{v.size ? ` · ${v.size}` : ""}{v.color ? ` · ${v.color}` : ""}</p>
                  </div>
                  <span className={cn("text-sm font-extrabold shrink-0", v.stock === 0 ? "text-[#DC2626]" : "text-[#D97706]")}>
                    {v.stock === 0 ? "OOS" : `${v.stock} left`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
