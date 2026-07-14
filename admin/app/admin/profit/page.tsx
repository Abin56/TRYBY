"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, RefreshCw, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { formatPrice, formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { describeFetchError } from "@/lib/api";
import { FetchError } from "@/components/ui/fetch-error";

const STORE_API = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

interface ProfitSummary {
  revenue: number; cogs: number; shipping: number; packaging: number;
  profit: number; margin: number;
}

interface ProductProfit {
  productId: string; name: string; slug: string;
  revenue: number; cogs: number; shipping: number; packaging: number;
  profit: number; margin: number; unitsSold: number;
}

interface ProfitData {
  today:     ProfitSummary;
  thisMonth: ProfitSummary;
  lastMonth: ProfitSummary;
  period:    ProfitSummary;
  profitGrowth: number;
  days: number;
  topProfit:    ProductProfit[];
  lowestMargin: ProductProfit[];
  alerts: { lowStock: number; missingCost: number };
}

const DAYS_OPTS = [7, 14, 30, 90] as const;
type DaysOpt = typeof DAYS_OPTS[number];

function KPICard({ label, value, sub, growth, color = "#2563EB", loading }: {
  label: string; value: number; sub?: string; growth?: number;
  color?: string; loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <p className="text-xs font-medium text-[#6B7280] mb-2">{label}</p>
      {loading
        ? <div className="h-7 w-24 rounded bg-[#F3F4F6] animate-pulse mb-1" />
        : <p className="text-2xl font-extrabold" style={{ color }}>{formatPrice(value)}</p>
      }
      {sub && <p className="text-xs text-[#9CA3AF] mt-1">{sub}</p>}
      {growth !== undefined && !loading && (
        <div className={cn("flex items-center gap-1 mt-1 text-xs font-semibold", growth >= 0 ? "text-[#16A34A]" : "text-[#DC2626]")}>
          {growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(growth).toFixed(1)}% vs last month
        </div>
      )}
    </div>
  );
}

function CostBreakdown({ data, label }: { data: ProfitSummary; label: string }) {
  const items = [
    { label: "Revenue",    value: data.revenue,   positive: true  },
    { label: "COGS",       value: data.cogs,      positive: false },
    { label: "Shipping",   value: data.shipping,  positive: false },
    { label: "Packaging",  value: data.packaging, positive: false },
  ];

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <p className="text-sm font-bold text-[#111827] mb-4">{label}</p>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-xs text-[#6B7280]">{item.label}</span>
            <span className={cn("text-sm font-semibold", item.positive ? "text-[#111827]" : "text-[#DC2626]")}>
              {item.positive ? "" : "-"}{formatPrice(item.value)}
            </span>
          </div>
        ))}
        <div className="pt-2 border-t border-[#F3F4F6]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#374151]">Net Profit</span>
            <span className={cn("text-sm font-extrabold", data.profit >= 0 ? "text-[#16A34A]" : "text-[#DC2626]")}>
              {data.profit >= 0 ? "+" : ""}{formatPrice(data.profit)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-[#9CA3AF]">Margin</span>
            <span className={cn("text-xs font-bold", data.margin >= 30 ? "text-[#16A34A]" : data.margin >= 15 ? "text-[#D97706]" : "text-[#DC2626]")}>
              {data.margin.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductTable({ products, title, variant }: {
  products: ProductProfit[]; title: string; variant: "profit" | "margin";
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F3F4F6]">
        <p className="text-sm font-bold text-[#111827]">{title}</p>
      </div>
      <div className="divide-y divide-[#F9FAFB]">
        {products.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-[#9CA3AF]">No data — add cost prices to products first</p>
          </div>
        ) : products.map((p, i) => (
          <div key={p.productId} className="flex items-center gap-3 px-5 py-3">
            <span className="text-xs font-bold text-[#D1D5DB] w-5 shrink-0">#{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#111827] truncate">{p.name}</p>
              <p className="text-xs text-[#9CA3AF]">{formatNumber(p.unitsSold)} sold · {formatPrice(p.revenue)} revenue</p>
            </div>
            <div className="text-right shrink-0">
              {variant === "profit" ? (
                <p className={cn("text-sm font-extrabold", p.profit >= 0 ? "text-[#16A34A]" : "text-[#DC2626]")}>
                  {p.profit >= 0 ? "+" : ""}{formatPrice(p.profit)}
                </p>
              ) : (
                <p className={cn("text-sm font-extrabold", p.margin >= 30 ? "text-[#16A34A]" : p.margin >= 15 ? "text-[#D97706]" : "text-[#DC2626]")}>
                  {p.margin.toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfitPage() {
  const [data,    setData]    = useState<ProfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [days,    setDays]    = useState<DaysOpt>(30);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${STORE_API}/api/admin/profit?days=${days}`, { credentials: "include" });
      setData(await res.json());
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Profit Engine</h1>
          <p className="text-sm text-[#9CA3AF]">Revenue, costs, and margin breakdown</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[#E5E7EB] overflow-hidden">
            {DAYS_OPTS.map((d) => (
              <button key={d} onClick={() => setDays(d)}
                className={cn("px-3 py-1.5 text-xs font-semibold transition-colors", days === d ? "bg-[#111827] text-white" : "text-[#6B7280] hover:text-[#111827]")}>
                {d}D
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E7EB] px-3 text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {error && <FetchError message={error} onRetry={load} loading={loading} />}

      {/* Alerts */}
      {data && (data.alerts.missingCost > 0 || data.alerts.lowStock > 0) && (
        <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-[#D97706] shrink-0 mt-0.5" />
          <p className="text-sm text-[#92400E]">
            {data.alerts.missingCost > 0 && <><span className="font-semibold">{data.alerts.missingCost} variants missing cost price.</span> Profit calculations are inaccurate until you fill them in. </>}
            {data.alerts.lowStock > 0 && <span>{data.alerts.lowStock} variants at low stock (≤5 units).</span>}
          </p>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Today's Profit"   value={data?.today.profit    ?? 0} color={(data?.today.profit    ?? 0) >= 0 ? "#16A34A" : "#DC2626"} sub={`${(data?.today.margin    ?? 0).toFixed(1)}% margin`} loading={loading} />
        <KPICard label="Monthly Profit"   value={data?.thisMonth.profit ?? 0} color={(data?.thisMonth.profit ?? 0) >= 0 ? "#16A34A" : "#DC2626"} sub={`${(data?.thisMonth.margin ?? 0).toFixed(1)}% margin`} loading={loading} growth={data?.profitGrowth} />
        <KPICard label={`${days}D Revenue`} value={data?.period.revenue ?? 0} color="#2563EB" sub={`${formatPrice(data?.period.cogs ?? 0)} cost`} loading={loading} />
        <KPICard label={`${days}D Net`}   value={data?.period.profit   ?? 0} color={(data?.period.profit   ?? 0) >= 0 ? "#16A34A" : "#DC2626"} sub={`${(data?.period.margin   ?? 0).toFixed(1)}% margin`} loading={loading} />
      </div>

      {/* Cost breakdown */}
      <div className="grid lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-xl border border-[#E5E7EB] bg-white h-48 animate-pulse" />)
          : data && <>
              <CostBreakdown data={data.today}     label="Today" />
              <CostBreakdown data={data.thisMonth} label="This Month" />
              <CostBreakdown data={data.period}    label={`Last ${days} Days`} />
            </>
        }
      </div>

      {/* Product tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {loading
          ? Array.from({ length: 2 }).map((_, i) => <div key={i} className="rounded-xl border border-[#E5E7EB] bg-white h-64 animate-pulse" />)
          : data && <>
              <ProductTable products={data.topProfit}    title={`Top Profit Products (${days}D)`} variant="profit" />
              <ProductTable products={data.lowestMargin} title="Lowest Margin Products"           variant="margin" />
            </>
        }
      </div>
    </div>
  );
}
