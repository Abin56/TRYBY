"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, TrendingUp, Crown, AlertTriangle, RotateCcw,
  MessageSquare, ChevronRight, Star, Activity, IndianRupee,
  UserCheck, UserX, Clock,
} from "lucide-react";

interface DashboardData {
  kpis: {
    totalCustomers: number;
    newCustomers30d: number;
    vipCount: number;
    highValueCount: number;
    atRiskCount: number;
    churnedCount: number;
    totalLtv: number;
    avgLtv: number;
    avgEngagement: number;
    openTickets: number;
    retentionRate: number;
    activeCustomers30d: number;
  };
  segmentCounts: Record<string, number>;
  topCustomers: {
    userId: string; ltv: string; orderCount: number; segments: string[];
    engagementScore: number; lastOrderAt: string | null;
    user: { id: string; name: string | null; email: string | null } | null;
  }[];
  ticketsByStatus: { status: string; _count: number }[];
  recentActivity: { id: string; userId: string; type: string; metadata: unknown; createdAt: string }[];
}

const SEGMENT_COLORS: Record<string, string> = {
  VIP: "#F5C518", HIGH_VALUE: "#A78BFA", REPEAT_BUYER: "#3B82F6",
  NEW_CUSTOMER: "#22C55E", LOYAL: "#06B6D4", WHOLESALE: "#8B5CF6",
  INACTIVE: "#6B7280", CHURNED: "#EF4444", REFUND_RISK: "#EC4899",
  COD_RISK: "#F97316", AT_RISK: "#EAB308",
};

const SEGMENT_LABELS: Record<string, string> = {
  VIP: "VIP", HIGH_VALUE: "High Value", REPEAT_BUYER: "Repeat Buyer",
  NEW_CUSTOMER: "New Customer", LOYAL: "Loyal", WHOLESALE: "Wholesale",
  INACTIVE: "Inactive", CHURNED: "Churned", REFUND_RISK: "Refund Risk",
  COD_RISK: "COD Risk", AT_RISK: "At Risk",
};

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  ORDER_PLACED: TrendingUp,
  ORDER_CANCELLED: RotateCcw,
  RETURN_REQUESTED: RotateCcw,
  TICKET_OPENED: MessageSquare,
  TICKET_RESOLVED: MessageSquare,
  NOTE_ADDED: Activity,
  TAG_ADDED: Activity,
  BLACKLISTED: AlertTriangle,
};

function KpiCard({ icon: Icon, label, value, sub, color, href }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string; href?: string;
}) {
  const inner = (
    <div className="rounded-xl p-5 hover:opacity-90 transition-opacity"
      style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="h-4.5 w-4.5" style={{ color }} />
        </div>
        {href && <ChevronRight className="h-4 w-4 text-white/20" />}
      </div>
      <p className="text-[26px] font-black text-white leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
        {value}
      </p>
      <p className="text-[12px] text-white/50 mt-1">{label}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color }}>{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function CrmDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/crm/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-6 w-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );

  if (!data) return <p className="text-white/40 p-8">Failed to load.</p>;

  const { kpis, segmentCounts, topCustomers, ticketsByStatus, recentActivity } = data;

  const openTickets = ticketsByStatus.find((t) => t.status === "OPEN")?._count ?? 0;
  const pendingTickets = ticketsByStatus.find((t) => t.status === "PENDING")?._count ?? 0;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.15)" }}>
          <Users className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-white font-black text-2xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
            CUSTOMER SUCCESS CENTER
          </h1>
          <p className="text-white/40 text-[13px]">360° customer intelligence — segments, LTV, tickets, and activity</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Total Customers" value={kpis.totalCustomers.toLocaleString()}
          color="#3B82F6" href="/admin/crm/customers" />
        <KpiCard icon={TrendingUp} label="New (30d)" value={kpis.newCustomers30d}
          sub={`${kpis.activeCustomers30d} active buyers`} color="#22C55E" href="/admin/crm/customers?segment=NEW_CUSTOMER" />
        <KpiCard icon={Crown} label="VIP Customers" value={kpis.vipCount}
          color="#F5C518" href="/admin/crm/customers?segment=VIP" />
        <KpiCard icon={IndianRupee} label="Total LTV" value={`₹${Math.round(kpis.totalLtv / 1000)}K`}
          sub={`Avg ₹${Math.round(kpis.avgLtv).toLocaleString("en-IN")}`} color="#A78BFA" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={UserCheck} label="Retention Rate" value={`${kpis.retentionRate}%`}
          color="#06B6D4" />
        <KpiCard icon={AlertTriangle} label="At Risk" value={kpis.atRiskCount}
          sub={`${kpis.churnedCount} churned`} color="#EAB308" href="/admin/crm/customers?segment=AT_RISK" />
        <KpiCard icon={MessageSquare} label="Open Tickets" value={kpis.openTickets}
          sub={`${pendingTickets} pending`} color="#EC4899" href="/admin/crm/tickets" />
        <KpiCard icon={Star} label="Avg Engagement" value={`${kpis.avgEngagement.toFixed(0)}/100`}
          color="#F97316" />
      </div>

      {/* Segment breakdown + Top customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Segments */}
        <div className="rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <h2 className="text-white font-bold text-[14px]">Customer Segments</h2>
          </div>
          <div className="p-4 space-y-2">
            {Object.entries(SEGMENT_LABELS).map(([key, label]) => {
              const count = segmentCounts[key] ?? 0;
              const total = Object.values(segmentCounts).reduce((a, b) => a + b, 1);
              const pct = Math.round((count / total) * 100);
              return (
                <Link key={key} href={`/admin/crm/customers?segment=${key}`}
                  className="flex items-center gap-3 group hover:bg-white/03 rounded-lg px-2 py-1.5 transition-colors">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: SEGMENT_COLORS[key] }} />
                  <span className="text-[13px] text-white/70 flex-1 group-hover:text-white">{label}</span>
                  <span className="text-[13px] font-bold text-white">{count}</span>
                  <div className="w-16 h-1.5 rounded-full bg-white/08 shrink-0">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: SEGMENT_COLORS[key] }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Top customers by LTV */}
        <div className="lg:col-span-2 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <h2 className="text-white font-bold text-[14px]">Top Customers by LTV</h2>
            <Link href="/admin/crm/customers?sortBy=ltv" className="text-[12px] text-white/40 hover:text-white flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y">
            {topCustomers.map((c, i) => (
              <Link key={c.userId} href={`/admin/crm/customers/${c.userId}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-white/02 transition-colors">
                <span className="text-white/25 text-[12px] font-mono w-5 shrink-0">{i + 1}</span>
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
                  {(c.user?.name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[13px] font-medium truncate">{c.user?.name ?? "—"}</p>
                  <p className="text-white/40 text-[11px] truncate">{c.user?.email}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-white font-bold">₹{Number(c.ltv).toLocaleString("en-IN")}</p>
                  <p className="text-white/40 text-[11px]">{c.orderCount} orders</p>
                </div>
                <div className="flex flex-wrap gap-1 shrink-0 max-w-[100px]">
                  {c.segments.slice(0, 2).map((seg) => (
                    <span key={seg} className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                      style={{ color: SEGMENT_COLORS[seg], background: `${SEGMENT_COLORS[seg]}18` }}>
                      {SEGMENT_LABELS[seg] ?? seg}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Tickets + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket queue */}
        <div className="rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <h2 className="text-white font-bold text-[14px]">Support Tickets</h2>
            <Link href="/admin/crm/tickets" className="text-[12px] text-white/40 hover:text-white flex items-center gap-1">
              Manage <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            {[
              { label: "Open", status: "OPEN", color: "#EF4444" },
              { label: "Pending", status: "PENDING", color: "#F97316" },
              { label: "In Progress", status: "IN_PROGRESS", color: "#3B82F6" },
              { label: "Resolved", status: "RESOLVED", color: "#22C55E" },
            ].map(({ label, status, color }) => {
              const count = ticketsByStatus.find((t) => t.status === status)?._count ?? 0;
              return (
                <Link key={status} href={`/admin/crm/tickets?status=${status}`}
                  className="rounded-xl p-4 hover:opacity-80 transition-opacity"
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}22` }}>
                  <p className="text-[24px] font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{count}</p>
                  <p className="text-white/50 text-[12px]">{label}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <h2 className="text-white font-bold text-[14px]">Recent Activity</h2>
          </div>
          <div className="divide-y max-h-72 overflow-y-auto">
            {recentActivity.slice(0, 12).map((a) => {
              const Icon = ACTIVITY_ICONS[a.type] ?? Activity;
              return (
                <div key={a.id} className="flex items-center gap-3 px-5 py-2.5">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    <Icon className="h-3.5 w-3.5 text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-[12px]">{a.type.replace(/_/g, " ")}</p>
                    <p className="text-white/30 text-[10px]">{new Date(a.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                  <Link href={`/admin/crm/customers/${a.userId}`}
                    className="text-white/25 hover:text-white/60 text-[11px]">
                    →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/admin/crm/customers", label: "All Customers", icon: Users },
          { href: "/admin/crm/tickets", label: "Support Tickets", icon: MessageSquare },
          { href: "/admin/crm/segments", label: "Tags & Segments", icon: Star },
          { href: "/admin/crm/analytics", label: "CRM Analytics", icon: TrendingUp },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-2.5 rounded-xl px-4 py-3 hover:bg-white/04 transition-colors"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Icon className="h-4 w-4 text-white/40" />
            <span className="text-white/70 text-[12px] font-medium">{label}</span>
            <ChevronRight className="h-3 w-3 text-white/20 ml-auto" />
          </Link>
        ))}
      </div>
    </div>
  );
}
