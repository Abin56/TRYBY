"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert, ShieldOff, Users, Package, Ban, RefreshCw,
  TrendingDown, AlertTriangle, CheckCircle, Clock, ChevronRight,
  IndianRupee, Truck,
} from "lucide-react";

interface DashboardData {
  kpis: {
    blacklistedCustomers: number;
    codBlockedCustomers: number;
    refundFlaggedCustomers: number;
    pendingOrderReviews: number;
    totalBlacklistEntries: number;
    avgCodSuccessRate: number;
    avgRefundRate: number;
  };
  customerRiskBreakdown: { riskLevel: string; _count: { riskLevel: number } }[];
  orderRiskBreakdown: { riskLevel: string; _count: { riskLevel: number } }[];
  blacklistBreakdown: { type: string; _count: { type: number } }[];
  topRiskyCustomers: {
    userId: string; riskScore: number; riskLevel: string;
    isBlacklisted: boolean; isCodBlocked: boolean;
    user: { name: string | null; email: string } | null;
  }[];
  topRiskySuppliers: {
    id: string; businessName: string; cancellationRate: number | null;
    returnRate: number | null; slaScore: number | null; tier: string | null;
  }[];
  recentAuditLogs: {
    id: string; actionType: string; performedBy: string | null;
    targetType: string | null; reason: string | null; createdAt: string;
  }[];
  codKpis: { _avg: { successRate: number | null } };
  refundKpis: { _avg: { refundRate: number | null } };
}

const RISK_COLOR: Record<string, string> = {
  LOW: "#4ADE80",
  MEDIUM: "#F5C518",
  HIGH: "#FB923C",
  CRITICAL: "#F87171",
};

const ACTION_LABEL: Record<string, string> = {
  FLAG_ORDER: "Order Flagged",
  BLOCK_COD: "COD Blocked",
  BLACKLIST_CUSTOMER: "Customer Blacklisted",
  CANCEL_ORDER: "Order Cancelled",
  OVERRIDE_CLEAR: "Override Cleared",
  OVERRIDE_FLAG: "Override Flagged",
  BLACKLIST_ADD: "Blacklist Added",
  BLACKLIST_REMOVE: "Blacklist Lifted",
  COD_RULE_CHANGED: "COD Rule Changed",
  RISK_SCORE_UPDATED: "Score Updated",
};

export default function FraudDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/admin/fraud/dashboard");
    const json = await r.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "#E8FF47" }} />
      </div>
    );
  }

  const { kpis } = data;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6" style={{ color: "#E8FF47" }} />
            Fraud & Risk Center
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
            Real-time fraud detection, COD abuse prevention, and risk scoring
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80" style={{ background: "#E8FF47", color: "#0A0A0A" }}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Blacklisted Customers", value: kpis.blacklistedCustomers, icon: Ban, color: "#F87171", href: "/admin/fraud/customers?isBlacklisted=true" },
          { label: "COD Blocked", value: kpis.codBlockedCustomers, icon: ShieldOff, color: "#FB923C", href: "/admin/fraud/cod" },
          { label: "Pending Reviews", value: kpis.pendingOrderReviews, icon: Clock, color: "#F5C518", href: "/admin/fraud/orders?requiresReview=true" },
          { label: "Blacklist Entries", value: kpis.totalBlacklistEntries, icon: AlertTriangle, color: "#F87171", href: "/admin/fraud/blacklist" },
          { label: "Refund Flagged", value: kpis.refundFlaggedCustomers, icon: TrendingDown, color: "#A78BFA", href: "/admin/fraud/refunds?isFlagged=true" },
          { label: "Avg COD Success %", value: `${Number(kpis.avgCodSuccessRate ?? 0).toFixed(1)}%`, icon: Truck, color: "#4ADE80", href: "/admin/fraud/cod" },
          { label: "Avg Refund Rate %", value: `${Number(kpis.avgRefundRate ?? 0).toFixed(1)}%`, icon: RefreshCw, color: "#FB923C", href: "/admin/fraud/refunds" },
        ].map((k) => (
          <Link key={k.label} href={k.href} className="rounded-xl p-4 flex flex-col gap-2 transition-opacity hover:opacity-80" style={{ background: "#111111" }}>
            <div className="flex items-center gap-2">
              <k.icon className="w-4 h-4" style={{ color: k.color }} />
              <span className="text-xs" style={{ color: "#9CA3AF" }}>{k.label}</span>
            </div>
            <span className="text-2xl font-bold text-white">{k.value}</span>
          </Link>
        ))}
      </div>

      {/* Risk Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Risk */}
        <div className="rounded-xl p-4" style={{ background: "#111111" }}>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: "#E8FF47" }} /> Customer Risk Levels
          </h3>
          <div className="space-y-2">
            {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((level) => {
              const entry = data.customerRiskBreakdown.find((c) => c.riskLevel === level);
              const count = entry?._count?.riskLevel ?? 0;
              return (
                <div key={level} className="flex items-center justify-between">
                  <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: `${RISK_COLOR[level]}22`, color: RISK_COLOR[level] }}>{level}</span>
                  <span className="text-white font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Risk */}
        <div className="rounded-xl p-4" style={{ background: "#111111" }}>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" style={{ color: "#E8FF47" }} /> Order Risk Levels
          </h3>
          <div className="space-y-2">
            {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((level) => {
              const entry = data.orderRiskBreakdown.find((c) => c.riskLevel === level);
              const count = entry?._count?.riskLevel ?? 0;
              return (
                <div key={level} className="flex items-center justify-between">
                  <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: `${RISK_COLOR[level]}22`, color: RISK_COLOR[level] }}>{level}</span>
                  <span className="text-white font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Blacklist Breakdown */}
        <div className="rounded-xl p-4" style={{ background: "#111111" }}>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Ban className="w-4 h-4" style={{ color: "#E8FF47" }} /> Blacklist by Type
          </h3>
          <div className="space-y-2">
            {["EMAIL", "PHONE", "IP", "ADDRESS"].map((type) => {
              const entry = data.blacklistBreakdown.find((b) => b.type === type);
              const count = entry?._count?.type ?? 0;
              return (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>{type}</span>
                  <span className="text-white font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Risky Customers + Suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Risky Customers */}
        <div className="rounded-xl p-4" style={{ background: "#111111" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: "#E8FF47" }} /> Top Risky Customers
            </h3>
            <Link href="/admin/fraud/customers" className="text-xs hover:opacity-80" style={{ color: "#E8FF47" }}>View all <ChevronRight className="w-3 h-3 inline" /></Link>
          </div>
          <div className="space-y-2">
            {data.topRiskyCustomers.map((c) => (
              <Link key={c.userId} href={`/admin/fraud/customers`} className="flex items-center justify-between p-2 rounded-lg hover:opacity-80 transition-opacity" style={{ background: "#0D0D0D" }}>
                <div>
                  <p className="text-sm text-white font-medium">{c.user?.name ?? "Unknown"}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{c.user?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {c.isBlacklisted && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#F8717122", color: "#F87171" }}>BL</span>}
                  {c.isCodBlocked && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#FB923C22", color: "#FB923C" }}>COD</span>}
                  <span className="text-sm font-bold" style={{ color: RISK_COLOR[c.riskLevel] }}>{c.riskScore}</span>
                </div>
              </Link>
            ))}
            {data.topRiskyCustomers.length === 0 && <p className="text-xs text-center py-4" style={{ color: "#9CA3AF" }}>No high-risk customers</p>}
          </div>
        </div>

        {/* Top Risky Suppliers */}
        <div className="rounded-xl p-4" style={{ background: "#111111" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Truck className="w-4 h-4" style={{ color: "#E8FF47" }} /> Risky Suppliers
            </h3>
            <Link href="/admin/fraud/suppliers" className="text-xs hover:opacity-80" style={{ color: "#E8FF47" }}>View all <ChevronRight className="w-3 h-3 inline" /></Link>
          </div>
          <div className="space-y-2">
            {data.topRiskySuppliers.map((s) => (
              <Link key={s.id} href={`/admin/suppliers/${s.id}`} className="flex items-center justify-between p-2 rounded-lg hover:opacity-80 transition-opacity" style={{ background: "#0D0D0D" }}>
                <div>
                  <p className="text-sm text-white font-medium">{s.businessName}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Cancel: {Number(s.cancellationRate ?? 0).toFixed(1)}% · Return: {Number(s.returnRate ?? 0).toFixed(1)}%</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "#E8FF4722", color: "#E8FF47" }}>{s.tier ?? "—"}</span>
              </Link>
            ))}
            {data.topRiskySuppliers.length === 0 && <p className="text-xs text-center py-4" style={{ color: "#9CA3AF" }}>No risky suppliers</p>}
          </div>
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div className="rounded-xl p-4" style={{ background: "#111111" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" style={{ color: "#E8FF47" }} /> Recent Actions
          </h3>
          <Link href="/admin/fraud/audit" className="text-xs hover:opacity-80" style={{ color: "#E8FF47" }}>Full log <ChevronRight className="w-3 h-3 inline" /></Link>
        </div>
        <div className="space-y-2">
          {data.recentAuditLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b" style={{ borderColor: "#1A1A1A" }}>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3" style={{ color: "#4ADE80" }} />
                <span className="text-white">{ACTION_LABEL[log.actionType] ?? log.actionType}</span>
                {log.targetType && <span className="text-xs" style={{ color: "#9CA3AF" }}>({log.targetType})</span>}
              </div>
              <div className="flex items-center gap-4">
                {log.reason && <span className="text-xs max-w-xs truncate" style={{ color: "#9CA3AF" }}>{log.reason}</span>}
                <span className="text-xs whitespace-nowrap" style={{ color: "#9CA3AF" }}>
                  {new Date(log.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
          {data.recentAuditLogs.length === 0 && <p className="text-xs text-center py-4" style={{ color: "#9CA3AF" }}>No recent actions</p>}
        </div>
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Customer Risk Engine", href: "/admin/fraud/customers", icon: Users, color: "#4ADE80" },
          { label: "Order Risk Detection", href: "/admin/fraud/orders", icon: Package, color: "#F5C518" },
          { label: "COD Abuse Center", href: "/admin/fraud/cod", icon: ShieldOff, color: "#FB923C" },
          { label: "Refund Abuse", href: "/admin/fraud/refunds", icon: TrendingDown, color: "#A78BFA" },
          { label: "Blacklist Center", href: "/admin/fraud/blacklist", icon: Ban, color: "#F87171" },
          { label: "Supplier Risk", href: "/admin/fraud/suppliers", icon: Truck, color: "#38BDF8" },
          { label: "Audit Logs", href: "/admin/fraud/audit", icon: ShieldAlert, color: "#E8FF47" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 p-4 rounded-xl transition-opacity hover:opacity-80" style={{ background: "#111111" }}>
            <item.icon className="w-5 h-5 flex-shrink-0" style={{ color: item.color }} />
            <span className="text-sm font-medium text-white">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
