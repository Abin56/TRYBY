"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  RefreshCw, IndianRupee, ShoppingBag, Users, TrendingUp, TrendingDown,
  RotateCcw, Store, Package, AlertTriangle, Percent, Download,
} from "lucide-react";

interface KPIData {
  revenue:   { total: number; today: number; month: number; lastMonth: number; growth: number };
  orders:    { total: number; month: number; lastMonth: number; pending: number; cancelled: number; growth: number; cancelRate: number };
  customers: { total: number; newThisMonth: number; returning: number; repeatRate: number };
  aov:       number;
  refundRate: number;
  inventory: { activeProducts: number; lowStock: number; outOfStock: number };
  topProducts: { productId: string; productName: string; revenue: number; qty: number }[];
  topSuppliers: { id: string; companyName: string; tier: string; totalSales: number; performanceScore: number }[];
  paymentBreakdown: { method: string; revenue: number; count: number }[];
  daily: { date: string; revenue: number }[];
  generatedAt: string;
}

function fmt(n: number)  { return `₹${Math.round(n).toLocaleString("en-IN")}`; }
function fmtK(n: number) { return n >= 1_000_000 ? `₹${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : fmt(n); }

const TIER_COLORS: Record<string, string> = { BRONZE: "#CD7F32", SILVER: "#C0C0C0", GOLD: "#F5C518", PLATINUM: "#E5E4E2" };
const METHOD_LABELS: Record<string, string> = { RAZORPAY_UPI: "UPI", RAZORPAY_CARD: "Card", RAZORPAY_NETBANKING: "Net Banking", RAZORPAY_WALLET: "Wallet", COD: "COD" };

function BigKPI({ label, value, sub, color, growth, icon: Icon, href }: {
  label: string; value: string; sub?: string; color: string;
  growth?: number | null; icon: React.ElementType; href?: string;
}) {
  const inner = (
    <div className="rounded-2xl p-5 h-full" style={{ background: "#1A1A1A", border: `1px solid ${color}15` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        {growth !== undefined && growth !== null && (
          <div className="flex items-center gap-1">
            {growth >= 0 ? <TrendingUp className="h-3 w-3 text-[#4ADE80]" /> : <TrendingDown className="h-3 w-3 text-[#F87171]" />}
            <span className="text-[10px] font-bold" style={{ color: growth >= 0 ? "#4ADE80" : "#F87171" }}>
              {growth >= 0 ? "+" : ""}{growth}%
            </span>
          </div>
        )}
      </div>
      <p className="text-[32px] font-black leading-none mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>
        {value}
      </p>
      <p className="text-[11px] text-white/40">{label}</p>
      {sub && <p className="text-[10px] text-white/25 mt-0.5">{sub}</p>}
    </div>
  );
  return href ? <Link href={href} className="block hover:opacity-90 transition-opacity">{inner}</Link> : inner;
}

export default function KPIDashboardPage() {
  const [data, setData]   = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports/kpi");
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading && !data) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent mb-3" />
      <p className="text-white/30 text-[13px]">Loading KPIs…</p>
    </div>
  );
  if (!data) return <div className="p-8 text-white/40">Failed to load.</div>;

  const maxDaily = Math.max(...data.daily.map(d => d.revenue), 1);

  return (
    <div className="p-6 lg:p-8 max-w-[1300px]">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
            Business KPIs
          </h1>
          <p className="text-white/40 text-[12px]">
            Updated {new Date(data.generatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-semibold text-white/60 hover:text-white"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <Link href="/admin/reports/sales"
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-semibold text-[#F5C518]"
            style={{ border: "1px solid rgba(245,197,24,0.3)", background: "rgba(245,197,24,0.08)" }}>
            Sales Report →
          </Link>
        </div>
      </div>

      {/* Primary KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
        <BigKPI label="Total Revenue"   value={fmtK(data.revenue.total)}   color="#F5C518"  growth={data.revenue.growth}  icon={IndianRupee} href="/admin/reports/sales"    sub={`Today: ${fmtK(data.revenue.today)}`} />
        <BigKPI label="Monthly Revenue" value={fmtK(data.revenue.month)}   color="#4ADE80"  growth={data.revenue.growth}  icon={TrendingUp}  href="/admin/reports/profit"   sub={`Last month: ${fmtK(data.revenue.lastMonth)}`} />
        <BigKPI label="Total Orders"    value={String(data.orders.total)}   color="#60A5FA"  growth={data.orders.growth}   icon={ShoppingBag} href="/admin/orders"           sub={`${data.orders.pending} pending`} />
        <BigKPI label="Avg Order Value" value={fmt(data.aov)}              color="#A78BFA"  growth={null}                 icon={Percent}     href="/admin/reports/sales" />
        <BigKPI label="Total Customers" value={String(data.customers.total)} color="#38BDF8" growth={null}                icon={Users}       href="/admin/customers"        sub={`+${data.customers.newThisMonth} this month`} />
        <BigKPI label="Repeat Customers"value={`${data.customers.repeatRate}%`} color="#FB923C" growth={null}             icon={RotateCcw}   href="/admin/customers"        sub={`${data.customers.returning} returning`} />
        <BigKPI label="Refund Rate"     value={`${data.refundRate}%`}      color={data.refundRate > 5 ? "#F87171" : "#4ADE80"}  growth={null} icon={RotateCcw}   href="/admin/returns" />
        <BigKPI label="Cancel Rate"     value={`${data.orders.cancelRate}%`} color={data.orders.cancelRate > 10 ? "#F87171" : "#F5C518"} growth={null} icon={AlertTriangle} href="/admin/orders" sub={`${data.orders.cancelled} this month`} />
      </div>

      {/* Revenue chart */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-black text-[14px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Revenue — Last 30 Days
          </h2>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-white/30">Total:</span>
            <span className="font-bold text-white">{fmtK(data.daily.reduce((s, d) => s + d.revenue, 0))}</span>
          </div>
        </div>
        <div className="flex items-end gap-1 h-20">
          {data.daily.map(d => (
            <div key={d.date} className="flex-1 group relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap rounded-lg px-2 py-1 text-[9px] text-white" style={{ background: "#2A2A2A" }}>
                {d.date.slice(5)}: {fmtK(d.revenue)}
              </div>
              <div className="w-full rounded-sm transition-all"
                style={{ height: `${Math.max(3, (d.revenue / maxDaily) * 76)}px`, background: d.revenue > 0 ? "#F5C518" : "rgba(255,255,255,0.08)" }} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Top products */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <h3 className="text-white font-black text-[13px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Top Products</h3>
            <Link href="/admin/products/performance" className="text-[11px] text-[#F5C518] hover:underline">All →</Link>
          </div>
          {data.topProducts.length === 0 ? (
            <p className="py-8 text-center text-white/30 text-[12px]">No sales data</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {data.topProducts.slice(0, 6).map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-[10px] font-mono text-white/20 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-white/80 truncate">{p.productName}</p>
                    <p className="text-[9px] text-white/30">{p.qty} units</p>
                  </div>
                  <span className="text-[12px] font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {fmtK(p.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top suppliers */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <h3 className="text-white font-black text-[13px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Top Suppliers</h3>
            <Link href="/admin/reports/suppliers" className="text-[11px] text-[#F5C518] hover:underline">All →</Link>
          </div>
          {data.topSuppliers.length === 0 ? (
            <p className="py-8 text-center text-white/30 text-[12px]">No approved suppliers</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {data.topSuppliers.map(s => (
                <Link key={s.id} href={`/admin/suppliers/${s.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02]">
                  <Store className="h-4 w-4 text-white/20 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-white/80 truncate">{s.companyName}</p>
                    <span className="text-[9px] font-black" style={{ color: TIER_COLORS[s.tier] ?? "#888" }}>{s.tier}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-white/60">{fmtK(s.totalSales)}</p>
                    <p className="text-[9px] text-white/30">Perf {s.performanceScore}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Payment + inventory */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="text-white font-black text-[13px] mb-3" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Payment Methods</h3>
            {data.paymentBreakdown.length === 0 ? (
              <p className="text-white/30 text-[11px]">No data yet</p>
            ) : data.paymentBreakdown.map(pm => {
              const total = data.paymentBreakdown.reduce((s, p) => s + p.revenue, 0);
              const pct   = total > 0 ? Math.round((pm.revenue / total) * 100) : 0;
              return (
                <div key={pm.method} className="mb-2">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[10px] text-white/50">{METHOD_LABELS[pm.method] ?? pm.method}</span>
                    <span className="text-[10px] text-white/35">{fmtK(pm.revenue)} · {pct}%</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full bg-[#4ADE80]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="text-white font-black text-[13px] mb-3 flex items-center gap-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              <AlertTriangle className="h-4 w-4 text-[#F87171]" />
              Inventory
            </h3>
            {[
              { label: "Active Products", value: data.inventory.activeProducts, color: "#4ADE80", href: "/admin/products" },
              { label: "Low Stock",       value: data.inventory.lowStock,       color: "#F5C518", href: "/admin/inventory" },
              { label: "Out of Stock",    value: data.inventory.outOfStock,     color: "#F87171", href: "/admin/inventory" },
            ].map(({ label, value, color, href }) => (
              <Link key={label} href={href} className="flex items-center justify-between py-2 hover:opacity-80 transition-opacity">
                <span className="text-[11px] text-white/50">{label}</span>
                <span className="text-[14px] font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Report links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: "/admin/reports/sales",     label: "Sales Report",     desc: "Daily/weekly/monthly revenue" },
          { href: "/admin/reports/profit",    label: "Profit Report",    desc: "Net profit after all costs" },
          { href: "/admin/reports/suppliers", label: "Supplier Report",  desc: "Performance & fulfillment" },
        ].map(({ href, label, desc }) => (
          <Link key={href} href={href}
            className="rounded-2xl p-4 hover:bg-white/[0.03] transition-all"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[13px] font-semibold text-white mb-0.5">{label}</p>
            <p className="text-[10px] text-white/35">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
