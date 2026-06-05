"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TrendingUp, ShoppingBag, Users, IndianRupee, TrendingDown } from "lucide-react";

interface SalesData {
  revenue:  { today: number; yesterday: number; week: number; month: number; lastMonth: number; monthGrowth: number };
  orders:   { today: number; yesterday: number; week: number; month: number };
  customers:{ total: number; newThisMonth: number; returning: number };
  aov:      number;
  paymentMethods: { method: string; revenue: number; count: number }[];
  topProducts:    { productId: string; productName: string; revenue: number; qty: number; orders: number }[];
  topCategories:  { name: string; revenue: number; qty: number }[];
  todayHourly:    { hour: number; orders: number; revenue: number }[];
  generatedAt:    string;
}

function fmt(n: number) { return `₹${n.toLocaleString("en-IN")}` ; }
function pct(now: number, prev: number) {
  if (prev === 0) return null;
  return ((now - prev) / prev) * 100;
}

function KPI({ label, value, sub, color, trend, icon: Icon }: {
  label: string; value: string; sub?: string; color: string; trend?: number | null;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</p>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <p className="text-[28px] font-black leading-none mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-white/35">{sub}</p>}
      {trend !== undefined && trend !== null && (
        <div className="flex items-center gap-1 mt-2">
          {trend >= 0
            ? <TrendingUp className="h-3 w-3 text-[#4ADE80]" />
            : <TrendingDown className="h-3 w-3 text-[#F87171]" />}
          <span className="text-[10px] font-semibold" style={{ color: trend >= 0 ? "#4ADE80" : "#F87171" }}>
            {trend >= 0 ? "+" : ""}{Math.round(trend * 10) / 10}% vs last month
          </span>
        </div>
      )}
    </div>
  );
}

const METHOD_LABELS: Record<string, string> = {
  RAZORPAY_UPI: "UPI", RAZORPAY_CARD: "Card",
  RAZORPAY_NETBANKING: "Net Banking", RAZORPAY_WALLET: "Wallet", COD: "COD",
};

export default function SalesReportPage() {
  const [data, setData]     = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports/sales");
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent mb-3" />
      <p className="text-white/30 text-[13px]">Loading sales data…</p>
    </div>
  );

  if (!data) return <div className="p-8 text-white/40">Failed to load.</div>;

  const { revenue: rev, orders, customers, aov, paymentMethods, topProducts, topCategories, todayHourly } = data;
  const todayVsYest    = pct(rev.today, rev.yesterday);
  const maxHourRev     = Math.max(...todayHourly.map(h => h.revenue), 1);
  const maxHourOrders  = Math.max(...todayHourly.map(h => h.orders), 1);

  return (
    <div className="p-6 lg:p-8 max-w-[1300px]">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
            Daily Sales Report
          </h1>
          <p className="text-white/40 text-[12px]">
            Generated {new Date(data.generatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-semibold text-white/60 hover:text-white"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <Link href="/admin/reports/profit"
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-semibold text-[#F5C518] hover:opacity-80"
            style={{ border: "1px solid rgba(245,197,24,0.3)", background: "rgba(245,197,24,0.08)" }}>
            View Profit →
          </Link>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KPI label="Today Revenue"   value={fmt(rev.today)}     sub={`Yesterday: ${fmt(rev.yesterday)}`} color="#F5C518"  trend={todayVsYest}              icon={IndianRupee} />
        <KPI label="This Week"       value={fmt(rev.week)}      sub={`${orders.week} orders`}            color="#4ADE80"  trend={null}                     icon={TrendingUp}  />
        <KPI label="This Month"      value={fmt(rev.month)}     sub={`${orders.month} orders`}           color="#A78BFA"  trend={rev.monthGrowth}           icon={IndianRupee} />
        <KPI label="Avg Order Value" value={fmt(aov)}           sub={`${customers.total} customers`}     color="#38BDF8"  trend={null}                     icon={ShoppingBag} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPI label="Today Orders"    value={String(orders.today)}    sub={`Yesterday: ${orders.yesterday}`} color="#FB923C" trend={null} icon={ShoppingBag} />
        <KPI label="Month Orders"    value={String(orders.month)}    sub={`Last month: ${orders.yesterday}`} color="#60A5FA" trend={null} icon={ShoppingBag} />
        <KPI label="New Customers"   value={String(customers.newThisMonth)} sub="This month" color="#4ADE80" trend={null} icon={Users}      />
        <KPI label="Returning"       value={String(customers.returning)} sub="2+ orders" color="#F5C518" trend={null} icon={Users}      />
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr_320px] gap-5">
        {/* Today hourly chart */}
        <div className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="text-white font-black text-[14px] mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Today by Hour
          </h3>
          <div className="flex items-end gap-1 h-24">
            {todayHourly.map(h => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10"
                  style={{ minWidth: "60px" }}>
                  <div className="rounded-lg px-2 py-1 text-[9px] text-white" style={{ background: "#2A2A2A" }}>
                    {h.hour}:00 · {h.orders}ord · {fmt(h.revenue)}
                  </div>
                </div>
                <div className="w-full rounded-sm transition-all hover:opacity-100 opacity-80"
                  style={{ height: `${Math.max(4, (h.revenue / maxHourRev) * 80)}px`, background: h.orders > 0 ? "#F5C518" : "rgba(255,255,255,0.08)" }} />
                {h.hour % 6 === 0 && <span className="text-[8px] text-white/25">{h.hour}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Top categories */}
        <div className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="text-white font-black text-[14px] mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Top Categories (Month)
          </h3>
          <div className="space-y-3">
            {topCategories.length === 0 && <p className="text-white/30 text-[12px]">No data yet</p>}
            {topCategories.map((cat, i) => {
              const maxRev = topCategories[0]?.revenue ?? 1;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold text-white/70">{cat.name}</span>
                    <span className="text-[12px] font-bold text-white">{fmt(cat.revenue)}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(cat.revenue / maxRev) * 100}%`, background: i === 0 ? "#F5C518" : "#A78BFA" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment methods */}
        <div className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="text-white font-black text-[14px] mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Payment Methods (Month)
          </h3>
          <div className="space-y-3">
            {paymentMethods.length === 0 && <p className="text-white/30 text-[12px]">No data yet</p>}
            {paymentMethods.map(pm => {
              const total = paymentMethods.reduce((s, p) => s + p.revenue, 0);
              const pct   = total > 0 ? (pm.revenue / total) * 100 : 0;
              return (
                <div key={pm.method}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold text-white/70">{METHOD_LABELS[pm.method] ?? pm.method}</span>
                    <span className="text-[11px] text-white/50">{pm.count} · {Math.round(pct)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full bg-[#4ADE80]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="rounded-2xl overflow-hidden mt-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <h3 className="text-white font-black text-[14px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Top Selling Products (This Month)
          </h3>
        </div>
        {topProducts.length === 0 ? (
          <p className="text-center py-8 text-white/30 text-[12px]">No sales data yet</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {topProducts.map((p, i) => (
              <div key={p.productId} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02]">
                <span className="text-[12px] font-mono text-white/25 w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-white truncate">{p.productName}</p>
                </div>
                <span className="text-[11px] text-white/40">{p.qty} units</span>
                <span className="text-[11px] text-white/40">{p.orders} orders</span>
                <span className="text-[13px] font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {fmt(p.revenue)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
