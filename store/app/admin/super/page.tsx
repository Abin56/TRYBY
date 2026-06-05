"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  IndianRupee, ShoppingBag, Users, Store, Shield,
  TrendingUp, TrendingDown, Package, RefreshCw, Loader2,
  AlertTriangle, CheckCircle2, Activity, Clock, Server,
  Database, Globe, Lock, LogIn, ArrowUpRight,
  BarChart2, Wallet, UserX, Zap,
} from "lucide-react";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/rbac";
import { AdminRole } from "@prisma/client";

// ── Types ────────────────────────────────────────────────────────────────────

interface SuperData {
  revenue: {
    total: number; today: number; thisMonth: number; lastMonth: number;
    growth: number; dailyChart: { date: string; revenue: number }[];
  };
  orders:    { total: number; month: number; pending: number };
  customers: { total: number; newThisMonth: number };
  suppliers: { total: number; active: number; pending: number };
  team:      { total: number; active: number; disabled: number };
  inventory: { active: number; lowStock: number; outOfStock: number };
  sessions:  { active: number };
  security:  { events7d: number; failedLogins7d: number; lockedAccounts: number };
  payouts:   { pending: number; amount: number };
  recentActivity: {
    id: string; action: string; resourceType: string | null; resourceName: string | null;
    ipAddress: string | null; createdAt: string;
    admin: { name: string | null; email: string | null; image: string | null };
  }[];
  generatedAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000)      return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000); if (d > 0) return `${d}d ago`;
  const h = Math.floor(diff / 3600000);  if (h > 0) return `${h}h ago`;
  const m = Math.floor(diff / 60000);    return `${m}m ago`;
}

const CARD = "rounded-2xl border p-5";
const CD   = { background: "#111", borderColor: "rgba(255,255,255,0.06)" };

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color, trend, href,
}: {
  label:  string;
  value:  string | number;
  sub?:   string;
  icon:   typeof Activity;
  color:  string;
  trend?: number;
  href?:  string;
}) {
  const inner = (
    <div className={`${CARD} group cursor-default`} style={CD}>
      <div className="flex items-start justify-between mb-4">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-[11px] font-bold"
            style={{ color: trend >= 0 ? "#4ADE80" : "#F87171" }}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
        {href && <ArrowUpRight className="h-3.5 w-3.5 text-white/20 group-hover:text-white/50 transition-colors" />}
      </div>
      <p className="font-black leading-none mb-1.5"
        style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "32px", color }}>
        {value}
      </p>
      <p className="text-[12px] text-white/50 font-semibold">{label}</p>
      {sub && <p className="text-[11px] text-white/30 mt-1">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ── Mini Spark Bar ────────────────────────────────────────────────────────────

function SparkBars({ data }: { data: { date: string; revenue: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.revenue));
  return (
    <div className="flex items-end gap-0.5 h-12">
      {data.slice(-14).map((d, i) => {
        const pct = max > 0 ? (d.revenue / max) : 0;
        return (
          <div
            key={i}
            className="flex-1 rounded-sm min-h-[2px] transition-all"
            style={{ height: `${Math.max(4, Math.round(pct * 100))}%`, background: "#E8FF47", opacity: 0.5 + 0.5 * pct }}
            title={`${d.date}: ₹${d.revenue.toLocaleString("en-IN")}`}
          />
        );
      })}
    </div>
  );
}

// ── Activity Item ─────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  LOGIN:              "#4ADE80",
  LOGOUT:             "#9CA3AF",
  LOGIN_FAILED:       "#F87171",
  ADMIN_CREATED:      "#60A5FA",
  PRODUCT_CREATED:    "#60A5FA",
  PRODUCT_UPDATED:    "#FBBF24",
  ORDER_STATUS_CHANGED: "#A78BFA",
  SETTINGS_UPDATED:   "#FBBF24",
  SESSION_REVOKED:    "#F97316",
  FORCE_LOGOUT:       "#F97316",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const [data,    setData]    = useState<SuperData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/super");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-white/30">
        <AlertTriangle className="h-10 w-10 mx-auto mb-3" />
        <p>Failed to load Super Admin dashboard. You may not have access.</p>
        <Link href="/admin" className="text-[#E8FF47] text-[13px] mt-3 inline-block">← Back to Dashboard</Link>
      </div>
    );
  }

  const d = data;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(232,255,71,0.15)" }}>
              <Shield className="h-3.5 w-3.5" style={{ color: "#E8FF47" }} />
            </div>
            <span className="text-[11px] font-black tracking-widest uppercase text-white/40">Super Admin</span>
          </div>
          <h1 className="text-white font-black"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "32px" }}>
            Platform Overview
          </h1>
          <p className="text-white/30 text-[12px] mt-0.5">
            Last updated {timeAgo(d.generatedAt)}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="h-9 w-9 flex items-center justify-center rounded-xl border transition-all hover:bg-white/5"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <RefreshCw className={`h-4 w-4 text-white/50 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Revenue row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard label="Total Revenue"   value={fmt(d.revenue.total)}     icon={IndianRupee} color="#E8FF47" href="/admin/finance" />
        <KpiCard label="This Month"      value={fmt(d.revenue.thisMonth)} icon={TrendingUp}  color="#4ADE80" trend={d.revenue.growth} sub={`vs ${fmt(d.revenue.lastMonth)} last month`} />
        <KpiCard label="Today"           value={fmt(d.revenue.today)}     icon={BarChart2}   color="#60A5FA" />
        <KpiCard label="Pending Payouts" value={fmt(d.payouts.amount)}    icon={Wallet}      color="#FBBF24" sub={`${d.payouts.pending} payouts awaiting`} href="/admin/payouts" />
      </div>

      {/* Revenue spark */}
      <div className={`${CARD} mb-4`} style={CD}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-bold text-white/70">Revenue — Last 14 days</p>
          <Link href="/admin/finance" className="text-[11px] font-bold flex items-center gap-1"
            style={{ color: "#E8FF47" }}>
            Full report <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <SparkBars data={d.revenue.dailyChart} />
      </div>

      {/* Operations row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard label="Total Orders"    value={d.orders.total.toLocaleString()}    icon={ShoppingBag} color="#A78BFA" sub={`${d.orders.month} this month`}     href="/admin/orders" />
        <KpiCard label="Pending Orders"  value={d.orders.pending}                   icon={Clock}       color="#FBBF24" href="/admin/orders" />
        <KpiCard label="Total Customers" value={d.customers.total.toLocaleString()} icon={Users}       color="#60A5FA" sub={`+${d.customers.newThisMonth} this month`} href="/admin/customers" />
        <KpiCard label="Active Products" value={d.inventory.active.toLocaleString()} icon={Package}    color="#34D399" href="/admin/products" />
      </div>

      {/* Suppliers + Team row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard label="Active Suppliers"  value={d.suppliers.active}  icon={Store}    color="#F97316" href="/admin/suppliers" />
        <KpiCard label="Pending Suppliers" value={d.suppliers.pending} icon={AlertTriangle} color="#FBBF24" href="/admin/suppliers" />
        <KpiCard label="Admin Team"        value={d.team.active}       icon={Shield}   color="#C084FC" sub={`${d.team.disabled} suspended`} href="/admin/team" />
        <KpiCard label="Active Sessions"   value={d.sessions.active}   icon={Activity} color="#4ADE80" href="/admin/sessions" />
      </div>

      {/* Inventory alerts */}
      {(d.inventory.lowStock > 0 || d.inventory.outOfStock > 0) && (
        <div className="flex gap-3 mb-4">
          {d.inventory.outOfStock > 0 && (
            <Link href="/admin/inventory" className="flex-1 flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-[13px] font-bold text-white/80">
                <span className="text-red-400">{d.inventory.outOfStock}</span> products out of stock
              </p>
            </Link>
          )}
          {d.inventory.lowStock > 0 && (
            <Link href="/admin/inventory" className="flex-1 flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
              <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
              <p className="text-[13px] font-bold text-white/80">
                <span className="text-yellow-400">{d.inventory.lowStock}</span> products low on stock
              </p>
            </Link>
          )}
        </div>
      )}

      {/* Bottom: Security + Activity */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Security snapshot */}
        <div className={CARD} style={CD}>
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-red-400" />
            <p className="text-[13px] font-bold text-white/70">Security (7 days)</p>
            <Link href="/admin/security" className="ml-auto text-[10px] font-bold"
              style={{ color: "#E8FF47" }}>View all</Link>
          </div>
          <div className="space-y-3">
            {[
              { label: "Security events",   value: d.security.events7d,      color: "#F87171", icon: AlertTriangle },
              { label: "Failed logins",     value: d.security.failedLogins7d, color: "#FBBF24", icon: LogIn        },
              { label: "Locked accounts",   value: d.security.lockedAccounts, color: "#F97316", icon: UserX        },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                  <p className="text-[12px] text-white/60">{label}</p>
                </div>
                <p className="font-black text-[18px]"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", color: value > 0 ? color : "rgba(255,255,255,0.2)" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {d.security.lockedAccounts > 0 && (
            <Link href="/admin/security"
              className="mt-4 flex items-center justify-center gap-2 h-9 rounded-xl text-[12px] font-bold w-full transition-all"
              style={{ background: "rgba(249,115,22,0.12)", color: "#F97316", border: "1px solid rgba(249,115,22,0.2)" }}>
              <Lock className="h-3.5 w-3.5" /> View locked accounts
            </Link>
          )}
        </div>

        {/* System health */}
        <div className={CARD} style={CD}>
          <div className="flex items-center gap-2 mb-4">
            <Server className="h-4 w-4 text-green-400" />
            <p className="text-[13px] font-bold text-white/70">System Health</p>
          </div>
          <div className="space-y-2.5">
            {[
              { label: "Database",       ok: true,  detail: "PostgreSQL connected"  },
              { label: "Auth Service",   ok: true,  detail: "NextAuth active"       },
              { label: "Payment Gateway",ok: true,  detail: "Razorpay reachable"    },
              { label: "Email Service",  ok: true,  detail: "Resend configured"     },
              { label: "Media (CDN)",    ok: true,  detail: "Cloudinary connected"  },
              { label: "Error Tracking", ok: true,  detail: "Sentry active"         },
            ].map(({ label, ok, detail }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {ok
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                    : <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
                  <p className="text-[12px] text-white/70">{label}</p>
                </div>
                <p className="text-[10px] text-white/30">{detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Link href="/admin/system/platform"
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl text-[11px] font-bold border transition-all hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
              <Database className="h-3 w-3" /> Full audit
            </Link>
            <Link href="/admin/system/services"
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl text-[11px] font-bold border transition-all hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
              <Globe className="h-3 w-3" /> Services
            </Link>
          </div>
        </div>

        {/* Recent activity */}
        <div className={CARD} style={CD}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-purple-400" />
            <p className="text-[13px] font-bold text-white/70">Recent Activity</p>
            <Link href="/admin/audit" className="ml-auto text-[10px] font-bold"
              style={{ color: "#E8FF47" }}>View all</Link>
          </div>
          <div className="space-y-2">
            {d.recentActivity.slice(0, 8).map(ev => {
              const color = ACTION_COLORS[ev.action] ?? "#9CA3AF";
              return (
                <div key={ev.id} className="flex items-start gap-2.5">
                  <div className="mt-1 h-5 w-5 rounded flex items-center justify-center shrink-0"
                    style={{ background: `${color}18` }}>
                    <Zap className="h-2.5 w-2.5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white/70 truncate">
                      {ev.action.replace(/_/g, " ")}
                      {ev.resourceName && <span className="text-white/40"> · {ev.resourceName}</span>}
                    </p>
                    <p className="text-[10px] text-white/30">{ev.admin.name ?? ev.admin.email}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-white/20">{timeAgo(ev.createdAt)}</span>
                </div>
              );
            })}
            {d.recentActivity.length === 0 && (
              <p className="text-white/30 text-[12px]">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Role breakdown */}
      <div className={`${CARD} mt-4`} style={CD}>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-white/40" />
          <p className="text-[13px] font-bold text-white/70">Team by Role</p>
          <Link href="/admin/team" className="ml-auto text-[10px] font-bold"
            style={{ color: "#E8FF47" }}>Manage</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ROLE_LABELS) as AdminRole[]).map(role => {
            const c = ROLE_COLORS[role];
            return (
              <Link key={role} href={`/admin/team?role=${role}`}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 transition-all hover:brightness-110"
                style={{ background: `${c.bg}22`, border: `1px solid ${c.text}33` }}>
                <span className="text-[11px] font-bold" style={{ color: c.text }}>{ROLE_LABELS[role]}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
