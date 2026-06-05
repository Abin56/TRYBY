"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Shield, AlertTriangle, RefreshCw, Loader2, TrendingUp,
  Users, ShoppingBag, Ban, ArrowUpRight, Activity,
  IndianRupee, Truck, Lock, CheckCircle2, XCircle,
  UserX, Zap,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  kpis: {
    criticalCustomers:    number;
    highRiskCustomers:    number;
    codBlockedCount:      number;
    blacklistTotal:       number;
    refundAbuseCount:     number;
    suspiciousOrders:     number;
    codSuccessRate:       number;
    avgRefundRate:        number;
    totalRefundAmount:    number;
    newRiskyCustomers7d:  number;
    flaggedOrders7d:      number;
  };
  customerRiskDist: { riskLevel: string; _count: { riskLevel: number } }[];
  orderRiskDist:    { riskLevel: string; _count: { riskLevel: number } }[];
  blacklistCounts:  { type: string; _count: { type: number } }[];
  topRiskyCustomers: {
    userId: string; riskScore: number; riskLevel: string;
    isCodBlocked: boolean; isBlacklisted: boolean;
    totalOrders: number; totalRefundAmount: number;
    user: { name: string | null; email: string | null; phone: string | null } | null;
  }[];
  suspiciousOrders: {
    id: string; orderId: string; riskScore: number; riskLevel: string;
    flags: string[]; requiresReview: boolean; createdAt: string;
    order: {
      orderNumber: string; total: number; status: string;
      user: { name: string | null; email: string | null } | null;
      payment: { method: string } | null;
    } | null;
  }[];
  supplierRisk: {
    id: string; companyName: string; riskScore: number; riskLevel: string;
    cancellationRate: number; returnRate: number; performanceScore: number;
  }[];
  recentAuditLogs: {
    id: string; actionType: string; targetType: string; reason: string | null; createdAt: string;
  }[];
  codKpis: { totalCodOrders: number; delivered: number; cancelled: number; successRate: number };
  generatedAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const CARD = "rounded-2xl border p-5";
const CD   = { background: "#111", borderColor: "rgba(255,255,255,0.06)" };

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "#F87171", HIGH: "#F97316", MEDIUM: "#FBBF24", LOW: "#4ADE80",
};
const RISK_BG: Record<string, string> = {
  CRITICAL: "rgba(248,113,113,0.12)", HIGH: "rgba(249,115,22,0.12)",
  MEDIUM: "rgba(251,191,36,0.12)",    LOW:  "rgba(74,222,128,0.12)",
};

function RiskBadge({ level }: { level: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black"
      style={{ background: RISK_BG[level] ?? "#111", color: RISK_COLORS[level] ?? "#9CA3AF" }}>
      {level}
    </span>
  );
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000); if (h > 0) return `${h}h ago`;
  const m = Math.floor(diff / 60000);   return `${m}m ago`;
}

const AUDIT_COLORS: Record<string, string> = {
  BLOCK_COD:          "#F97316",
  BLACKLIST_CUSTOMER: "#F87171",
  BLACKLIST_ADD:      "#F87171",
  BLACKLIST_REMOVE:   "#4ADE80",
  RISK_SCORE_UPDATED: "#60A5FA",
  FLAG_ORDER:         "#FBBF24",
  OVERRIDE_CLEAR:     "#4ADE80",
  REFUND_FLAGGED:     "#C084FC",
};

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color, href, alert }: {
  label: string; value: string | number; sub?: string;
  icon: typeof Activity; color: string; href: string; alert?: boolean;
}) {
  return (
    <Link href={href}>
      <div className={`${CARD} group cursor-pointer hover:brightness-110 transition-all`}
        style={{ ...CD, borderColor: alert && Number(value) > 0 ? `${color}40` : "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: `${color}18` }}>
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <ArrowUpRight className="h-3.5 w-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
        </div>
        <p className="font-black leading-none mb-1"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "30px", color: alert && Number(value) > 0 ? color : "#fff" }}>
          {value}
        </p>
        <p className="text-[12px] font-semibold text-white/50">{label}</p>
        {sub && <p className="text-[11px] text-white/30 mt-0.5">{sub}</p>}
      </div>
    </Link>
  );
}

// ── Risk distribution bar ────────────────────────────────────────────────────

function RiskBar({ dist }: { dist: { riskLevel: string; _count: { riskLevel: number } }[] }) {
  const levels  = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  const total   = dist.reduce((s, d) => s + d._count.riskLevel, 0);
  if (!total) return <p className="text-white/30 text-[12px]">No data</p>;

  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden gap-px mb-3">
        {levels.map(l => {
          const count = dist.find(d => d.riskLevel === l)?._count.riskLevel ?? 0;
          const pct   = (count / total) * 100;
          if (!pct) return null;
          return (
            <div key={l} className="transition-all" title={`${l}: ${count}`}
              style={{ width: `${pct}%`, background: RISK_COLORS[l] }} />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3">
        {levels.map(l => {
          const count = dist.find(d => d.riskLevel === l)?._count.riskLevel ?? 0;
          return (
            <div key={l} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: RISK_COLORS[l] }} />
              <span className="text-[11px] text-white/50">{l}</span>
              <span className="text-[11px] font-black" style={{ color: RISK_COLORS[l] }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RiskDashboardPage() {
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/fraud/dashboard");
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
        <p>Failed to load Risk Dashboard</p>
      </div>
    );
  }

  const k = data.kpis;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(248,113,113,0.15)" }}>
              <Shield className="h-3.5 w-3.5 text-red-400" />
            </div>
            <span className="text-[11px] font-black tracking-widest uppercase text-white/40">Fraud & Risk</span>
          </div>
          <h1 className="text-white font-black"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "32px" }}>
            Compliance Dashboard
          </h1>
          <p className="text-white/30 text-[12px] mt-0.5">
            Platform-wide fraud prevention and risk monitoring
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="h-9 w-9 flex items-center justify-center rounded-xl border transition-all hover:bg-white/5"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <RefreshCw className={`h-4 w-4 text-white/50 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Critical alert banner */}
      {(k.criticalCustomers > 0 || k.suspiciousOrders > 0) && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-5"
          style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-[13px] text-white/80 font-semibold">
            {k.criticalCustomers > 0 && <span className="text-red-400 font-black">{k.criticalCustomers} CRITICAL</span>}
            {k.criticalCustomers > 0 && k.suspiciousOrders > 0 && " · "}
            {k.suspiciousOrders > 0 && <span className="text-orange-400 font-black">{k.suspiciousOrders} orders</span>}
            {" "}require immediate review
          </p>
          <Link href="/admin/risk/orders?requiresReview=1" className="ml-auto text-[11px] font-bold flex items-center gap-1"
            style={{ color: "#F87171" }}>
            Review now <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <KpiCard label="Critical Customers" value={k.criticalCustomers} icon={UserX}      color="#F87171" href="/admin/risk/customers?riskLevel=CRITICAL" alert />
        <KpiCard label="High Risk"          value={k.highRiskCustomers} icon={AlertTriangle} color="#F97316" href="/admin/risk/customers?riskLevel=HIGH" alert />
        <KpiCard label="COD Blocked"        value={k.codBlockedCount}   icon={Ban}         color="#FBBF24" href="/admin/risk/customers?isCodBlocked=1" />
        <KpiCard label="Blacklisted"        value={k.blacklistTotal}    icon={XCircle}     color="#F87171" href="/admin/risk/blacklist" />
        <KpiCard label="Refund Abusers"     value={k.refundAbuseCount}  icon={IndianRupee} color="#C084FC" href="/admin/risk/customers?tab=refunds" />
        <KpiCard label="Pending Review"     value={k.suspiciousOrders}  icon={ShoppingBag} color="#F97316" href="/admin/risk/orders?requiresReview=1" alert />
      </div>

      {/* Second stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className={CARD} style={CD}>
          <p className="text-[11px] text-white/40 mb-1">COD Success Rate</p>
          <p className="font-black text-[28px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: data.codKpis.successRate < 60 ? "#F87171" : "#4ADE80" }}>
            {Math.round(data.codKpis.successRate)}%
          </p>
          <p className="text-[11px] text-white/30 mt-1">
            {data.codKpis.delivered.toLocaleString()} delivered · {data.codKpis.cancelled.toLocaleString()} cancelled
          </p>
        </div>
        <div className={CARD} style={CD}>
          <p className="text-[11px] text-white/40 mb-1">Avg Refund Rate</p>
          <p className="font-black text-[28px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: k.avgRefundRate > 0.2 ? "#F87171" : "#fff" }}>
            {(k.avgRefundRate * 100).toFixed(1)}%
          </p>
          <p className="text-[11px] text-white/30 mt-1">Total refunded: {fmt(k.totalRefundAmount)}</p>
        </div>
        <div className={CARD} style={CD}>
          <p className="text-[11px] text-white/40 mb-1">New Risky (7d)</p>
          <p className="font-black text-[28px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: k.newRiskyCustomers7d > 0 ? "#F97316" : "rgba(255,255,255,0.3)" }}>
            {k.newRiskyCustomers7d}
          </p>
          <p className="text-[11px] text-white/30 mt-1">HIGH/CRITICAL customers this week</p>
        </div>
        <div className={CARD} style={CD}>
          <p className="text-[11px] text-white/40 mb-1">Orders Flagged (7d)</p>
          <p className="font-black text-[28px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: k.flaggedOrders7d > 0 ? "#FBBF24" : "rgba(255,255,255,0.3)" }}>
            {k.flaggedOrders7d}
          </p>
          <p className="text-[11px] text-white/30 mt-1">Require review this week</p>
        </div>
      </div>

      {/* Risk distribution + Blacklist counts */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className={CARD} style={CD}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-white/40" />
              <p className="text-[13px] font-bold text-white/70">Customer Risk Distribution</p>
            </div>
            <Link href="/admin/risk/customers" className="text-[10px] font-bold"
              style={{ color: "#E8FF47" }}>View all</Link>
          </div>
          <RiskBar dist={data.customerRiskDist} />
        </div>
        <div className={CARD} style={CD}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-white/40" />
              <p className="text-[13px] font-bold text-white/70">Order Risk Distribution</p>
            </div>
            <Link href="/admin/risk/orders" className="text-[10px] font-bold"
              style={{ color: "#E8FF47" }}>View all</Link>
          </div>
          <RiskBar dist={data.orderRiskDist} />
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Top risky customers */}
        <div className={`${CARD} lg:col-span-1`} style={CD}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-400" />
              <p className="text-[13px] font-bold text-white/70">Top Risk Customers</p>
            </div>
            <Link href="/admin/risk/customers?sort=riskScore_desc" className="text-[10px] font-bold"
              style={{ color: "#E8FF47" }}>All</Link>
          </div>
          {data.topRiskyCustomers.length === 0 ? (
            <div className="flex items-center gap-2 text-white/30 text-[12px]">
              <CheckCircle2 className="h-4 w-4 text-green-400" /> No high-risk customers
            </div>
          ) : (
            <div className="space-y-2">
              {data.topRiskyCustomers.slice(0, 6).map((c) => (
                <Link key={c.userId} href={`/admin/risk/customers?userId=${c.userId}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/[0.03] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-white truncate">
                      {c.user?.name ?? c.user?.email ?? "Unknown"}
                    </p>
                    <p className="text-[10px] text-white/30 truncate">{c.user?.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.isCodBlocked  && <Ban     className="h-3 w-3 text-yellow-400" />}
                    {c.isBlacklisted && <XCircle className="h-3 w-3 text-red-400"    />}
                    <RiskBadge level={c.riskLevel} />
                    <span className="text-[11px] font-black" style={{ color: RISK_COLORS[c.riskLevel] ?? "#fff" }}>
                      {c.riskScore}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Suspicious orders */}
        <div className={`${CARD} lg:col-span-2`} style={CD}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <p className="text-[13px] font-bold text-white/70">Flagged Orders — Awaiting Review</p>
            </div>
            <Link href="/admin/risk/orders?requiresReview=1" className="text-[10px] font-bold"
              style={{ color: "#E8FF47" }}>All</Link>
          </div>
          {data.suspiciousOrders.length === 0 ? (
            <div className="flex items-center gap-2 text-white/30 text-[12px]">
              <CheckCircle2 className="h-4 w-4 text-green-400" /> No orders pending review
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    {["Order", "Customer", "Total", "Method", "Risk", "Flags", "Time"].map(h => (
                      <th key={h} className="pb-2 text-left text-[10px] font-bold text-white/30 uppercase tracking-widest pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {data.suspiciousOrders.slice(0, 8).map(o => (
                    <tr key={o.id} className="hover:bg-white/[0.02]">
                      <td className="py-2 pr-3 font-mono text-white/70">{o.order?.orderNumber ?? "—"}</td>
                      <td className="py-2 pr-3 max-w-[120px] truncate text-white/60">{o.order?.user?.name ?? o.order?.user?.email ?? "—"}</td>
                      <td className="py-2 pr-3 font-bold text-white/80">₹{Number(o.order?.total ?? 0).toLocaleString("en-IN")}</td>
                      <td className="py-2 pr-3 text-white/40">{o.order?.payment?.method?.replace("RAZORPAY_", "") ?? "—"}</td>
                      <td className="py-2 pr-3"><RiskBadge level={o.riskLevel} /></td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-wrap gap-1">
                          {o.flags.slice(0, 2).map(f => (
                            <span key={f} className="text-[9px] font-bold rounded px-1.5 py-0.5"
                              style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24" }}>
                              {f.replace(/_/g, " ")}
                            </span>
                          ))}
                          {o.flags.length > 2 && <span className="text-[9px] text-white/30">+{o.flags.length - 2}</span>}
                        </div>
                      </td>
                      <td className="py-2 text-white/30 whitespace-nowrap">{timeAgo(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Supplier risk + Blacklist + Audit */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Supplier risk */}
        <div className={CARD} style={CD}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-400" />
              <p className="text-[13px] font-bold text-white/70">At-Risk Suppliers</p>
            </div>
            <Link href="/admin/risk/suppliers" className="text-[10px] font-bold"
              style={{ color: "#E8FF47" }}>All</Link>
          </div>
          {data.supplierRisk.length === 0 ? (
            <div className="flex items-center gap-2 text-white/30 text-[12px]">
              <CheckCircle2 className="h-4 w-4 text-green-400" /> All suppliers healthy
            </div>
          ) : (
            <div className="space-y-2">
              {data.supplierRisk.slice(0, 5).map(s => (
                <Link key={s.id} href={`/admin/risk/suppliers?id=${s.id}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/[0.03] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-white truncate">{s.companyName}</p>
                    <p className="text-[10px] text-white/30">
                      Cancel {(s.cancellationRate * 100).toFixed(0)}% · Return {(s.returnRate * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <RiskBadge level={s.riskLevel} />
                    <span className="text-[11px] font-black" style={{ color: RISK_COLORS[s.riskLevel] }}>{s.riskScore}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Blacklist counts */}
        <div className={CARD} style={CD}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-red-400" />
              <p className="text-[13px] font-bold text-white/70">Blacklist</p>
            </div>
            <Link href="/admin/risk/blacklist" className="text-[10px] font-bold"
              style={{ color: "#E8FF47" }}>Manage</Link>
          </div>
          <div className="space-y-2">
            {[
              { type: "EMAIL",   label: "Email addresses", icon: "✉",  color: "#F87171" },
              { type: "PHONE",   label: "Phone numbers",   icon: "📱", color: "#FBBF24" },
              { type: "IP",      label: "IP addresses",    icon: "🌐", color: "#F97316" },
              { type: "ADDRESS", label: "Addresses",       icon: "📍", color: "#C084FC" },
            ].map(({ type, label, color }) => {
              const count = data.blacklistCounts.find(b => b.type === type)?._count.type ?? 0;
              return (
                <Link key={type} href={`/admin/risk/blacklist?type=${type}`}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
                  style={{ background: "#161616" }}>
                  <p className="text-[12px] text-white/70">{label}</p>
                  <span className="font-black text-[16px]"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", color: count > 0 ? color : "rgba(255,255,255,0.2)" }}>
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent fraud audit */}
        <div className={CARD} style={CD}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              <p className="text-[13px] font-bold text-white/70">Recent Actions</p>
            </div>
          </div>
          <div className="space-y-2">
            {data.recentAuditLogs.slice(0, 8).map(log => {
              const color = AUDIT_COLORS[log.actionType] ?? "#9CA3AF";
              return (
                <div key={log.id} className="flex items-start gap-2.5">
                  <div className="mt-0.5 h-5 w-5 rounded flex items-center justify-center shrink-0"
                    style={{ background: `${color}18` }}>
                    <Zap className="h-2.5 w-2.5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white/70 truncate">
                      {log.actionType.replace(/_/g, " ")}
                    </p>
                    {log.reason && (
                      <p className="text-[10px] text-white/30 truncate">{log.reason}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] text-white/20">{timeAgo(log.createdAt)}</span>
                </div>
              );
            })}
            {data.recentAuditLogs.length === 0 && (
              <p className="text-white/30 text-[12px]">No recent actions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
