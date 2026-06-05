"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package, ShoppingBag, Users, IndianRupee, AlertTriangle,
  TrendingUp, TrendingDown, ArrowUpRight, RefreshCw,
  Boxes, Store, BarChart2,
} from "lucide-react";

interface KPIData {
  revenue:   { total: number; today: number; month: number; lastMonth: number; growth: number };
  orders:    { total: number; month: number; pending: number; cancelled: number; growth: number; cancelRate: number };
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

interface Alert {
  outOfStock: { count: number };
  lowStock:   { count: number };
  pendingApproval: { count: number; items: { id: string; name: string; waitingDays: number }[] };
  inactiveSupplierProducts: { count: number };
}

function fmt(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }
function fmtK(n: number) { return n >= 1_000_000 ? `₹${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : fmt(n); }

const TIER_COLORS: Record<string, string> = { BRONZE: "#CD7F32", SILVER: "#C0C0C0", GOLD: "#F5C518", PLATINUM: "#E5E4E2" };
const METHOD_LABELS: Record<string, string> = { RAZORPAY_UPI: "UPI", RAZORPAY_CARD: "Card", RAZORPAY_NETBANKING: "Net Banking", RAZORPAY_WALLET: "Wallet", COD: "COD" };

export default function AdminDashboard() {
  const [kpi, setKpi]       = useState<KPIData | null>(null);
  const [alerts, setAlerts] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [kpiRes, alertRes] = await Promise.all([
        fetch("/api/admin/reports/kpi"),
        fetch("/api/admin/reports/inventory-alerts"),
      ]);
      if (kpiRes.ok)   setKpi(await kpiRes.json());
      if (alertRes.ok) setAlerts(await alertRes.json());
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading && !kpi) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent mb-3" />
      <p className="text-white/30 text-[13px]">Loading dashboard…</p>
    </div>
  );

  const maxDaily = kpi ? Math.max(...kpi.daily.map(d => d.revenue), 1) : 1;

  return (
    <div className="p-6 lg:p-8 max-w-[1300px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
            Dashboard
          </h1>
          {kpi && (
            <p className="text-white/40 text-[12px]">
              Updated {new Date(kpi.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all"
            title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/admin/reports/kpi"
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-semibold text-[#F5C518] hover:opacity-80"
            style={{ border: "1px solid rgba(245,197,24,0.3)", background: "rgba(245,197,24,0.08)" }}>
            <BarChart2 className="h-3.5 w-3.5" /> Full KPIs
          </Link>
        </div>
      </div>

      {kpi && (
        <>
          {/* Primary KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Monthly Revenue", value: fmtK(kpi.revenue.month), sub: `Today: ${fmtK(kpi.revenue.today)}`, href: "/admin/reports/sales", color: "#F5C518", icon: IndianRupee, growth: kpi.revenue.growth },
              { label: "Monthly Orders",  value: String(kpi.orders.month), sub: `${kpi.orders.pending} pending`, href: "/admin/orders", color: "#4ADE80", icon: ShoppingBag, growth: kpi.orders.growth },
              { label: "Customers",       value: String(kpi.customers.total), sub: `+${kpi.customers.newThisMonth} this month`, href: "/admin/customers", color: "#60A5FA", icon: Users, growth: null },
              { label: "Avg Order Value", value: fmt(kpi.aov), sub: `${kpi.customers.repeatRate}% repeat`, href: "/admin/reports/kpi", color: "#A78BFA", icon: TrendingUp, growth: null },
            ].map(({ label, value, sub, href, color, icon: Icon, growth }) => (
              <Link key={label} href={href}
                className="flex flex-col gap-3 rounded-2xl p-4 transition-all hover:brightness-110 group"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
                <div>
                  <p className="text-white font-black leading-none mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px", color }}>
                    {value}
                  </p>
                  <p className="text-white/40 text-[11px]">{label}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {growth !== null && growth !== undefined ? (
                    <>
                      {growth >= 0 ? <TrendingUp className="h-3 w-3 text-[#4ADE80]" /> : <TrendingDown className="h-3 w-3 text-[#F87171]" />}
                      <span className="text-[10px] font-semibold" style={{ color: growth >= 0 ? "#4ADE80" : "#F87171" }}>
                        {growth >= 0 ? "+" : ""}{growth}% vs last month
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-white/30">{sub}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Revenue sparkline */}
          <div className="rounded-2xl p-5 mb-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-black text-[14px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                Revenue — Last 30 Days
              </h2>
              <Link href="/admin/reports/sales" className="text-[11px] text-[#F5C518] hover:underline">Full report →</Link>
            </div>
            <div className="flex items-end gap-0.5 h-16">
              {kpi.daily.map(d => (
                <div key={d.date} className="flex-1 group relative">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap rounded-lg px-2 py-1 text-[9px] text-white" style={{ background: "#2A2A2A" }}>
                    {d.date.slice(5)}: {fmtK(d.revenue)}
                  </div>
                  <div className="w-full rounded-sm transition-all"
                    style={{ height: `${Math.max(3, (d.revenue / maxDaily) * 60)}px`, background: d.revenue > 0 ? "#F5C518" : "rgba(255,255,255,0.08)" }} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_1fr_320px] gap-5 mb-5">
            {/* Top products */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <h3 className="text-white font-black text-[13px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Top Products</h3>
                <Link href="/admin/products/performance" className="text-[11px] text-[#F5C518] hover:underline">All →</Link>
              </div>
              {kpi.topProducts.length === 0 ? (
                <p className="py-8 text-center text-white/30 text-[12px]">No sales data yet</p>
              ) : (
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {kpi.topProducts.map((p, i) => (
                    <div key={p.productId} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02]">
                      <span className="text-[10px] font-mono text-white/25 w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-white/80 truncate">{p.productName}</p>
                        <p className="text-[10px] text-white/30">{p.qty} units</p>
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
              {kpi.topSuppliers.length === 0 ? (
                <p className="py-8 text-center text-white/30 text-[12px]">No approved suppliers</p>
              ) : (
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {kpi.topSuppliers.map(s => (
                    <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02]">
                      <Store className="h-4 w-4 text-white/20 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-white/80 truncate">{s.companyName}</p>
                        <span className="text-[9px] font-black" style={{ color: TIER_COLORS[s.tier] ?? "#888" }}>{s.tier}</span>
                      </div>
                      <span className="text-[11px] font-bold text-white/50">Perf {s.performanceScore}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory alerts + payment breakdown */}
            <div className="space-y-4">
              {/* Inventory alerts */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <h3 className="text-white font-black text-[13px] flex items-center gap-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <AlertTriangle className="h-4 w-4 text-[#F87171]" />
                    Inventory Alerts
                  </h3>
                  <Link href="/admin/inventory" className="text-[11px] text-[#F5C518] hover:underline">Fix →</Link>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {[
                    { label: "Out of Stock", count: alerts?.outOfStock.count ?? kpi.inventory.outOfStock, color: "#F87171", href: "/admin/inventory" },
                    { label: "Low Stock (≤5)", count: alerts?.lowStock.count ?? kpi.inventory.lowStock, color: "#F5C518", href: "/admin/inventory" },
                    { label: "Pending Approval", count: alerts?.pendingApproval.count ?? 0, color: "#FB923C", href: "/admin/supplier-products" },
                  ].map(({ label, count, color, href }) => (
                    <Link key={label} href={href}
                      className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <span className="text-[12px] text-white/60">{label}</span>
                      <span className="font-black text-[14px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{count}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Payment breakdown */}
              <div className="rounded-2xl p-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-white font-black text-[12px] mb-3" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Payment Methods
                </h3>
                {kpi.paymentBreakdown.length === 0 ? (
                  <p className="text-white/30 text-[11px]">No data yet</p>
                ) : (
                  <div className="space-y-2">
                    {kpi.paymentBreakdown.map(pm => {
                      const total = kpi.paymentBreakdown.reduce((s, p) => s + p.revenue, 0);
                      const pct   = total > 0 ? (pm.revenue / total) * 100 : 0;
                      return (
                        <div key={pm.method}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] text-white/50">{METHOD_LABELS[pm.method] ?? pm.method}</span>
                            <span className="text-[10px] text-white/35">{Math.round(pct)}%</span>
                          </div>
                          <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <div className="h-full rounded-full bg-[#4ADE80]" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/admin/orders",          icon: ShoppingBag,   label: "Orders",          sub: `${kpi.orders.pending} pending`     },
              { href: "/admin/reports/profit",   icon: TrendingUp,    label: "Profit Report",   sub: "Revenue − costs"                   },
              { href: "/admin/reports/suppliers", icon: Store,        label: "Supplier Report", sub: `${kpi.topSuppliers.length} suppliers` },
              { href: "/admin/inventory",        icon: Boxes,         label: "Inventory",       sub: `${kpi.inventory.outOfStock} OOS`   },
            ].map(({ href, icon: Icon, label, sub }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 rounded-2xl p-4 hover:bg-white/[0.03] transition-all"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Icon className="h-5 w-5 text-[#F5C518] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-white truncate">{label}</p>
                  <p className="text-[10px] text-white/35">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
