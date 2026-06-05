"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  RefreshCw, TrendingUp, TrendingDown, IndianRupee,
  ShoppingBag, Users, AlertTriangle, Package, Download,
  BarChart2, ArrowUpRight, Eye, Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RevenueData {
  today: number; yesterday: number; week: number;
  month: number; lastMonth: number; total: number; growth: number;
}

interface ProfitPeriod {
  revenue: number; cogs: number; shipping: number; packaging: number;
  gateway: number; refunds: number; gross: number; net: number; margin: number;
}

interface ProfitData {
  today: ProfitPeriod;
  month: ProfitPeriod;
  lastMonth: { gross: number; net: number; margin: number };
  growth: number;
}

interface OrdersData {
  total: number; today: number; month: number; lastMonth: number;
  pending: number; cancelled: number; growth: number; cancelRate: number;
}

interface CustomersData {
  total: number; newToday: number; newThisMonth: number;
  returning: number; repeatRate: number; aov: number; refundRate: number;
}

interface ChartPoint   { date: string; revenue: number; }
interface MonthlyPoint { month: string; revenue: number; }

interface ProductRow {
  productId: string; name: string; slug: string | null;
  units: number; revenue: number; profit?: number; margin?: number;
  totalSoldCount?: number; weeklySoldCount?: number;
}

interface CategoryRow {
  name: string; revenue: number; profit: number;
  orders: number; units: number; margin: number;
}

interface InventoryVariant {
  id: string; sku: string; size?: string | null; color?: string | null;
  stock: number; productName: string; productSlug: string;
}

interface InventoryData {
  outOfStock: number;
  lowStock:   InventoryVariant[];
  deadStock:  Array<{ id: string; sku: string; stock: number; productName: string; productSlug: string }>;
}

interface FounderSummary {
  revenueToday: number; profitToday: number; ordersToday: number;
  refundsToday: number; customersToday: number;
}

interface BusinessData {
  revenue:        RevenueData;
  profit:         ProfitData;
  orders:         OrdersData;
  customers:      CustomersData;
  charts:         { daily: ChartPoint[]; weekly: ChartPoint[]; monthly: MonthlyPoint[] };
  products: {
    topSelling:    ProductRow[];
    worstSelling:  ProductRow[];
    mostSold:      ProductRow[];
    highestProfit: ProductRow[];
  };
  inventory:      InventoryData;
  categories:     CategoryRow[];
  founderSummary: FounderSummary;
  generatedAt:    string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }
function fmtK(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000)      return `₹${(n / 1_000).toFixed(1)}K`;
  return fmt(n);
}

function GrowthBadge({ v, suffix = "%" }: { v: number; suffix?: string }) {
  const up = v >= 0;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold"
      style={{ color: up ? "#4ADE80" : "#F87171" }}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}{Math.abs(v).toFixed(1)}{suffix}
    </span>
  );
}

function Sparkbar({ data, color = "#F5C518", height = 40 }: {
  data: number[]; color?: string; height?: number;
}) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-[2px] transition-all"
          style={{
            height: `${Math.max(2, (v / max) * height)}px`,
            background: v > 0 ? color : "rgba(255,255,255,0.07)",
          }} />
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-white font-black mb-3 flex items-center gap-2"
      style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", letterSpacing: "0.08em" }}>
      {children}
    </h2>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl ${className}`}
      style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
      {children}
    </div>
  );
}

function CardHeader({ title, href, hrefLabel = "All →" }: { title: string; href?: string; hrefLabel?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      <span className="text-white font-black text-[12px]"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{title}</span>
      {href && (
        <Link href={href} className="text-[10px] text-[#F5C518] hover:underline">{hrefLabel}</Link>
      )}
    </div>
  );
}

// ─── CSV / XLSX export ────────────────────────────────────────────────────────

function exportCSV(data: BusinessData) {
  const rows: string[][] = [
    ["TRYBY Sales Intelligence Center — Export"],
    ["Generated", new Date(data.generatedAt).toLocaleString("en-IN")],
    [],
    ["REVENUE"],
    ["Period", "Amount (₹)"],
    ["Today",      String(data.revenue.today)],
    ["Yesterday",  String(data.revenue.yesterday)],
    ["This Week",  String(data.revenue.week)],
    ["This Month", String(data.revenue.month)],
    ["Last Month", String(data.revenue.lastMonth)],
    ["Total",      String(data.revenue.total)],
    [],
    ["PROFIT (THIS MONTH)"],
    ["Gross Profit", String(data.profit.month.gross)],
    ["Net Profit",   String(data.profit.month.net)],
    ["Margin %",     String(data.profit.month.margin)],
    ["COGS",         String(data.profit.month.cogs)],
    ["Shipping",     String(data.profit.month.shipping)],
    ["Gateway",      String(data.profit.month.gateway)],
    ["Refunds",      String(data.profit.month.refunds)],
    [],
    ["ORDERS"],
    ["Today",      String(data.orders.today)],
    ["This Month", String(data.orders.month)],
    ["Pending",    String(data.orders.pending)],
    ["Cancel Rate %", String(data.orders.cancelRate)],
    [],
    ["CUSTOMERS"],
    ["Total",           String(data.customers.total)],
    ["New Today",       String(data.customers.newToday)],
    ["New This Month",  String(data.customers.newThisMonth)],
    ["Returning",       String(data.customers.returning)],
    ["Repeat Rate %",   String(data.customers.repeatRate)],
    ["Avg Order Value", String(data.customers.aov)],
    [],
    ["TOP SELLING PRODUCTS (30 DAYS)"],
    ["Product", "Units", "Revenue (₹)"],
    ...data.products.topSelling.map(p => [p.name, String(p.units), String(p.revenue)]),
    [],
    ["HIGHEST PROFIT PRODUCTS (30 DAYS)"],
    ["Product", "Profit (₹)", "Margin %"],
    ...data.products.highestProfit.map(p => [p.name, String(p.profit ?? 0), String(p.margin ?? 0)]),
    [],
    ["CATEGORY PERFORMANCE (30 DAYS)"],
    ["Category", "Revenue (₹)", "Profit (₹)", "Orders", "Margin %"],
    ...data.categories.map(c => [c.name, String(c.revenue), String(c.profit), String(c.orders), String(c.margin)]),
  ];
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `tryby-intelligence-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ChartTab = "daily" | "weekly" | "monthly";
type ProductTab = "topSelling" | "worstSelling" | "mostSold" | "highestProfit";

export default function BusinessPage() {
  const [data, setData]     = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState<ChartTab>("daily");
  const [productTab, setProductTab] = useState<ProductTab>("topSelling");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/business");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
      <p className="text-white/30 text-[12px]">Loading intelligence…</p>
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-white/30">Failed to load data.</p>
    </div>
  );

  const d = data;
  const marginColor = (m: number) => m >= 30 ? "#4ADE80" : m >= 15 ? "#F5C518" : "#F87171";

  // Chart data for selected tab
  const chartData =
    chartTab === "daily"   ? d.charts.daily.map(x => ({ label: x.date.slice(5), value: x.revenue })) :
    chartTab === "weekly"  ? d.charts.weekly.map(x => ({ label: x.date.slice(5), value: x.revenue })) :
    d.charts.monthly.map(x => ({ label: x.month, value: x.revenue }));

  const chartMax = Math.max(...chartData.map(c => c.value), 1);

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white font-black leading-none"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "30px", letterSpacing: "-0.01em" }}>
            Sales Intelligence Center
          </h1>
          <p className="text-white/35 text-[11px] mt-0.5">
            Updated {new Date(d.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportCSV(d)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-semibold text-white/50 hover:text-white hover:bg-white/05 transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button onClick={load}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/05 transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Founder Summary Card ── */}
      <div className="rounded-2xl p-4"
        style={{ background: "linear-gradient(135deg, rgba(245,197,24,0.10) 0%, rgba(245,197,24,0.03) 100%)", border: "1px solid rgba(245,197,24,0.18)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-[#F5C518]" />
          <span className="text-[#F5C518] font-black text-[12px]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
            TODAY AT A GLANCE
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Revenue",   value: fmtK(d.founderSummary.revenueToday),  color: "#F5C518", icon: IndianRupee },
            { label: "Profit",    value: fmtK(d.founderSummary.profitToday),   color: d.founderSummary.profitToday >= 0 ? "#4ADE80" : "#F87171", icon: TrendingUp },
            { label: "Orders",    value: String(d.founderSummary.ordersToday),  color: "#60A5FA", icon: ShoppingBag },
            { label: "Refunds",   value: fmtK(d.founderSummary.refundsToday),  color: "#F87171", icon: ArrowUpRight },
            { label: "Customers", value: String(d.founderSummary.customersToday), color: "#A78BFA", icon: Users },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" style={{ color, opacity: 0.7 }} />
                <span className="text-white/40 text-[10px]">{label}</span>
              </div>
              <span className="font-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", color }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Revenue Dashboard ── */}
      <div>
        <SectionTitle><IndianRupee className="h-3.5 w-3.5 text-[#F5C518]" /> Revenue Dashboard</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Today",      value: d.revenue.today,     prev: d.revenue.yesterday, prevLabel: "yday" },
            { label: "Yesterday",  value: d.revenue.yesterday, prev: null,                prevLabel: "" },
            { label: "This Week",  value: d.revenue.week,      prev: null,                prevLabel: "" },
            { label: "This Month", value: d.revenue.month,     prev: d.revenue.lastMonth, prevLabel: "last month", growth: d.revenue.growth },
            { label: "Total",      value: d.revenue.total,     prev: null,                prevLabel: "" },
          ].map(({ label, value, prev, prevLabel, growth }) => (
            <Card key={label} className="p-4">
              <p className="text-white/35 text-[10px] mb-2">{label}</p>
              <p className="font-black leading-none mb-2"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", color: "#F5C518" }}>
                {fmtK(value)}
              </p>
              {growth !== undefined ? (
                <GrowthBadge v={growth} />
              ) : prev !== null ? (
                <p className="text-white/25 text-[10px]">{fmtK(prev)} {prevLabel}</p>
              ) : null}
            </Card>
          ))}
        </div>
      </div>

      {/* ── Profit Dashboard ── */}
      <div>
        <SectionTitle><TrendingUp className="h-3.5 w-3.5 text-[#4ADE80]" /> Profit Dashboard</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Today */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Today</span>
              <span className="font-black text-[18px]"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color: marginColor(d.profit.today.margin) }}>
                {d.profit.today.margin}% margin
              </span>
            </div>
            <div className="flex items-end gap-4 mb-3">
              <div>
                <p className="text-white/30 text-[10px]">Gross</p>
                <p className="font-black text-[20px]"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#4ADE80" }}>
                  {fmtK(d.profit.today.gross)}
                </p>
              </div>
              <div>
                <p className="text-white/30 text-[10px]">Net</p>
                <p className="font-black text-[20px]"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", color: d.profit.today.net >= 0 ? "#4ADE80" : "#F87171" }}>
                  {fmtK(d.profit.today.net)}
                </p>
              </div>
            </div>
            <div className="space-y-1 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              {[
                ["Revenue",      fmt(d.profit.today.revenue),  "white"],
                ["Product Cost", `-${fmt(d.profit.today.cogs)}`, "#F87171"],
                ["Shipping",     `-${fmt(d.profit.today.shipping)}`, "#FB923C"],
                ["Gateway Fee",  `-${fmt(d.profit.today.gateway)}`, "#FB923C"],
                ["Refunds",      `-${fmt(d.profit.today.refunds)}`, "#F87171"],
              ].map(([k, v, c]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-[10px] text-white/35">{k}</span>
                  <span className="text-[11px] font-semibold" style={{ color: c === "white" ? "rgba(255,255,255,0.7)" : c }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* This Month */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest">This Month</span>
              <div className="flex items-center gap-2">
                <span className="font-black text-[18px]"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", color: marginColor(d.profit.month.margin) }}>
                  {d.profit.month.margin}% margin
                </span>
                <GrowthBadge v={d.profit.growth} />
              </div>
            </div>
            <div className="flex items-end gap-4 mb-3">
              <div>
                <p className="text-white/30 text-[10px]">Gross</p>
                <p className="font-black text-[20px]"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#4ADE80" }}>
                  {fmtK(d.profit.month.gross)}
                </p>
              </div>
              <div>
                <p className="text-white/30 text-[10px]">Net</p>
                <p className="font-black text-[20px]"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", color: d.profit.month.net >= 0 ? "#4ADE80" : "#F87171" }}>
                  {fmtK(d.profit.month.net)}
                </p>
              </div>
              <div>
                <p className="text-white/30 text-[10px]">Last Month Net</p>
                <p className="text-[14px] font-bold text-white/40"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {fmtK(d.profit.lastMonth.net)}
                </p>
              </div>
            </div>
            <div className="space-y-1 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              {[
                ["Revenue",      fmt(d.profit.month.revenue),  "white"],
                ["Product Cost", `-${fmt(d.profit.month.cogs)}`, "#F87171"],
                ["Shipping",     `-${fmt(d.profit.month.shipping)}`, "#FB923C"],
                ["Gateway Fee",  `-${fmt(d.profit.month.gateway)}`, "#FB923C"],
                ["Refunds",      `-${fmt(d.profit.month.refunds)}`, "#F87171"],
              ].map(([k, v, c]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-[10px] text-white/35">{k}</span>
                  <span className="text-[11px] font-semibold" style={{ color: c === "white" ? "rgba(255,255,255,0.7)" : c }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Sales Analytics Chart ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle><BarChart2 className="h-3.5 w-3.5 text-[#60A5FA]" /> Sales Analytics</SectionTitle>
          <div className="flex items-center gap-1">
            {(["daily", "weekly", "monthly"] as ChartTab[]).map(t => (
              <button key={t}
                onClick={() => setChartTab(t)}
                className="h-7 px-3 rounded-lg text-[10px] font-semibold capitalize transition-all"
                style={{
                  background: chartTab === t ? "rgba(96,165,250,0.15)" : "transparent",
                  color: chartTab === t ? "#60A5FA" : "rgba(255,255,255,0.35)",
                  border: `1px solid ${chartTab === t ? "rgba(96,165,250,0.3)" : "transparent"}`,
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <Card className="p-4">
          <div className="flex items-end gap-px" style={{ height: "100px" }}>
            {chartData.map((c, i) => (
              <div key={i} className="flex-1 group relative">
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block z-10
                  whitespace-nowrap rounded-lg px-2 py-1 text-[9px] text-white pointer-events-none"
                  style={{ background: "#2A2A2A" }}>
                  {c.label}: {fmtK(c.value)}
                </div>
                <div className="w-full rounded-[2px] transition-all"
                  style={{
                    height: `${Math.max(2, (c.value / chartMax) * 96)}px`,
                    background: c.value > 0 ? "#60A5FA" : "rgba(255,255,255,0.06)",
                  }} />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <span className="text-[10px] text-white/25">{chartData[0]?.label}</span>
            <span className="text-[10px] text-white/25">
              Total: {fmtK(chartData.reduce((s, c) => s + c.value, 0))}
            </span>
            <span className="text-[10px] text-white/25">{chartData[chartData.length - 1]?.label}</span>
          </div>
        </Card>
      </div>

      {/* ── Product Performance ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle><Package className="h-3.5 w-3.5 text-[#A78BFA]" /> Product Performance</SectionTitle>
          <div className="flex items-center gap-1 flex-wrap">
            {([
              ["topSelling",    "Top Selling"],
              ["worstSelling",  "Worst Selling"],
              ["mostSold",      "Most Sold"],
              ["highestProfit", "Top Profit"],
            ] as [ProductTab, string][]).map(([t, label]) => (
              <button key={t}
                onClick={() => setProductTab(t)}
                className="h-7 px-3 rounded-lg text-[10px] font-semibold transition-all"
                style={{
                  background: productTab === t ? "rgba(167,139,250,0.15)" : "transparent",
                  color: productTab === t ? "#A78BFA" : "rgba(255,255,255,0.35)",
                  border: `1px solid ${productTab === t ? "rgba(167,139,250,0.3)" : "transparent"}`,
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <Card>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {d.products[productTab].length === 0 ? (
              <p className="py-8 text-center text-white/30 text-[12px]">No data</p>
            ) : d.products[productTab].slice(0, 10).map((p, i) => (
              <div key={p.productId ?? p.name} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02]">
                <span className="text-[10px] font-mono text-white/20 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-white/80 truncate">{p.name}</p>
                  {productTab === "topSelling" || productTab === "worstSelling" ? (
                    <p className="text-[10px] text-white/30">{p.units} units</p>
                  ) : productTab === "highestProfit" ? (
                    <p className="text-[10px]" style={{ color: marginColor(p.margin ?? 0) }}>{p.margin}% margin</p>
                  ) : (
                    <p className="text-[10px] text-white/30">
                      {p.totalSoldCount} total · {p.weeklySoldCount} this week
                    </p>
                  )}
                </div>
                <span className="font-black text-[13px]"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#A78BFA" }}>
                  {productTab === "highestProfit" ? fmtK(p.profit ?? 0) : fmtK(p.revenue ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Inventory Risk ── */}
      <div>
        <SectionTitle><AlertTriangle className="h-3.5 w-3.5 text-[#F87171]" /> Inventory Risk</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Out of stock */}
          <Card>
            <CardHeader title="Out of Stock" href="/admin/inventory" />
            <div className="p-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: "rgba(248,113,113,0.12)" }}>
                <span className="font-black text-[24px]"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#F87171" }}>
                  {d.inventory.outOfStock}
                </span>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-white/60">variants OOS</p>
                <Link href="/admin/inventory" className="text-[10px] text-[#F5C518] hover:underline">
                  Fix stock →
                </Link>
              </div>
            </div>
          </Card>

          {/* Low stock */}
          <Card>
            <CardHeader title={`Low Stock (≤5) — ${d.inventory.lowStock.length} variants`} href="/admin/inventory" />
            <div className="divide-y max-h-40 overflow-y-auto" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {d.inventory.lowStock.length === 0 ? (
                <p className="py-4 text-center text-white/30 text-[11px]">All good</p>
              ) : d.inventory.lowStock.map(v => (
                <div key={v.id} className="flex items-center justify-between px-4 py-2">
                  <div className="min-w-0">
                    <p className="text-[11px] text-white/70 truncate">{v.productName}</p>
                    <p className="text-[10px] text-white/30">{v.sku} {v.size ? `· ${v.size}` : ""} {v.color ? `· ${v.color}` : ""}</p>
                  </div>
                  <span className="font-black text-[14px] ml-2 shrink-0"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#F5C518" }}>
                    {v.stock}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Dead stock */}
          <Card>
            <CardHeader title={`Dead Stock — ${d.inventory.deadStock.length} variants`} href="/admin/inventory" />
            <div className="divide-y max-h-40 overflow-y-auto" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {d.inventory.deadStock.length === 0 ? (
                <p className="py-4 text-center text-white/30 text-[11px]">No dead stock</p>
              ) : d.inventory.deadStock.map(v => (
                <div key={v.id} className="flex items-center justify-between px-4 py-2">
                  <div className="min-w-0">
                    <p className="text-[11px] text-white/70 truncate">{v.productName}</p>
                    <p className="text-[10px] text-white/30">{v.sku}</p>
                  </div>
                  <span className="text-[11px] font-bold text-white/40 ml-2 shrink-0">{v.stock} units</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Category Performance ── */}
      <div>
        <SectionTitle><BarChart2 className="h-3.5 w-3.5 text-[#FB923C]" /> Category Performance (30 Days)</SectionTitle>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {["Category", "Revenue", "Profit", "Orders", "Margin"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-white/30 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {d.categories.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-white/30 text-[11px]">No data</td></tr>
                ) : d.categories.map(cat => (
                  <tr key={cat.name} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white/70 font-semibold">{cat.name}</td>
                    <td className="px-4 py-3 font-black"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#FB923C" }}>
                      {fmtK(cat.revenue)}
                    </td>
                    <td className="px-4 py-3 font-semibold"
                      style={{ color: cat.profit >= 0 ? "#4ADE80" : "#F87171" }}>
                      {fmtK(cat.profit)}
                    </td>
                    <td className="px-4 py-3 text-white/50">{cat.orders}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold" style={{ color: marginColor(cat.margin) }}>{cat.margin}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── Customer Analytics ── */}
      <div>
        <SectionTitle><Users className="h-3.5 w-3.5 text-[#60A5FA]" /> Customer Analytics</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Customers",  value: String(d.customers.total),       color: "#60A5FA", sub: null },
            { label: "New Today",        value: String(d.customers.newToday),    color: "#4ADE80", sub: null },
            { label: "New This Month",   value: String(d.customers.newThisMonth), color: "#4ADE80", sub: null },
            { label: "Returning",        value: String(d.customers.returning),   color: "#A78BFA", sub: null },
            { label: "Repeat Rate",      value: `${d.customers.repeatRate}%`,    color: "#F5C518", sub: null },
            { label: "Avg Order Value",  value: fmtK(d.customers.aov),           color: "#FB923C", sub: null },
          ].map(({ label, value, color }) => (
            <Card key={label} className="p-4">
              <p className="text-white/35 text-[10px] mb-2">{label}</p>
              <p className="font-black leading-none"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", color }}>
                {value}
              </p>
            </Card>
          ))}
        </div>

        {/* Mini sparklines */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Card className="p-4">
            <p className="text-white/35 text-[10px] mb-2">Order Cancel Rate (month)</p>
            <div className="flex items-center gap-3">
              <p className="font-black text-[28px]"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color: d.orders.cancelRate > 10 ? "#F87171" : "#4ADE80" }}>
                {d.orders.cancelRate}%
              </p>
              <p className="text-white/30 text-[11px]">{d.orders.cancelled} of {d.orders.month} orders</p>
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-white/35 text-[10px] mb-2">Refund Rate (month)</p>
            <div className="flex items-center gap-3">
              <p className="font-black text-[28px]"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color: d.customers.refundRate > 5 ? "#F87171" : "#4ADE80" }}>
                {d.customers.refundRate}%
              </p>
              <p className="text-white/30 text-[11px]">
                {fmtK(d.profit.month.refunds)} refunded
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Order KPIs ── */}
      <div>
        <SectionTitle><ShoppingBag className="h-3.5 w-3.5 text-[#F5C518]" /> Order KPIs</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Orders",     value: String(d.orders.total),    color: "#F5C518" },
            { label: "Orders Today",     value: String(d.orders.today),    color: "#4ADE80" },
            { label: "This Month",       value: String(d.orders.month),    color: "#4ADE80", growth: d.orders.growth },
            { label: "Pending",          value: String(d.orders.pending),  color: "#FB923C" },
          ].map(({ label, value, color, growth }) => (
            <Card key={label} className="p-4">
              <p className="text-white/35 text-[10px] mb-2">{label}</p>
              <p className="font-black leading-none mb-2"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px", color }}>
                {value}
              </p>
              {growth !== undefined && <GrowthBadge v={growth} />}
            </Card>
          ))}
        </div>

        {/* Daily sparkline */}
        <Card className="p-4 mt-3">
          <p className="text-white/35 text-[10px] mb-3">Revenue — Last 30 Days</p>
          <Sparkbar data={d.charts.daily.map(x => x.revenue)} height={48} />
        </Card>
      </div>

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-6">
        {[
          { href: "/admin/reports/profit",  icon: TrendingUp,  label: "Full Profit Report",  color: "#4ADE80" },
          { href: "/admin/reports/kpi",     icon: BarChart2,   label: "Business KPIs",        color: "#F5C518" },
          { href: "/admin/orders",          icon: ShoppingBag, label: "All Orders",            color: "#60A5FA" },
          { href: "/admin/inventory",       icon: Eye,         label: "Inventory",             color: "#A78BFA" },
        ].map(({ href, icon: Icon, label, color }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 rounded-2xl p-4 hover:bg-white/[0.03] transition-all"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Icon className="h-4 w-4 shrink-0" style={{ color }} />
            <span className="text-[12px] font-semibold text-white/70">{label}</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-white/20 ml-auto" />
          </Link>
        ))}
      </div>
    </div>
  );
}
