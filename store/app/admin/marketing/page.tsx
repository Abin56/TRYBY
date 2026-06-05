"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Megaphone, Tag, Users, Mail, Bell, TrendingUp,
  ChevronRight, Zap, BarChart2, Gift, RotateCcw,
  Play, Pause, CheckCircle, Clock, DollarSign,
} from "lucide-react";

interface MarketingData {
  period: { days: number };
  campaigns: {
    total: number; sent: number; opens: number; clicks: number;
    conversions: number; revenue: number; openRate: string; conversionRate: string;
  };
  coupons: { ordersWithCoupon: number; totalDiscount: number; revenueWithCoupon: number };
  loyalty: { redemptions: number; pointsRedeemed: number; valueRedeemed: number };
  referrals: { completed: number };
  repeatRate: string;
  topCampaigns: {
    id: string; name: string; type: string; status: string;
    sentCount: number; conversionCount: number; revenueGenerated: string;
  }[];
}

interface ActiveCampaign {
  id: string; name: string; type: string; status: string;
  sentCount: number; conversionCount: number; revenueGenerated: string;
  startedAt: string | null; scheduledAt: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  EMAIL: "#3B82F6", WHATSAPP: "#22C55E", COUPON: "#F5C518", LOYALTY: "#A78BFA",
};

const STATUS_COLORS: Record<string, string> = {
  RUNNING: "#22C55E", SCHEDULED: "#3B82F6", PAUSED: "#EAB308",
  COMPLETED: "#6B7280", DRAFT: "#9CA3AF", CANCELLED: "#EF4444",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  RUNNING: Play, SCHEDULED: Clock, PAUSED: Pause,
  COMPLETED: CheckCircle, DRAFT: Clock, CANCELLED: CheckCircle,
};

function KpiCard({ label, value, sub, color, href, icon: Icon }: {
  label: string; value: string | number; sub?: string;
  color: string; href?: string; icon: React.ElementType;
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
      <p className="text-[26px] font-black text-white leading-none"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
      <p className="text-[12px] text-white/50 mt-1">{label}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color }}>{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function MarketingHubPage() {
  const [data, setData] = useState<MarketingData | null>(null);
  const [active, setActive] = useState<ActiveCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/marketing-analytics?days=30").then(r => r.json()),
      fetch("/api/admin/campaigns?status=RUNNING&page=1").then(r => r.json()),
    ]).then(([analytics, campaigns]) => {
      setData(analytics);
      setActive(campaigns.campaigns ?? []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-6 w-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );

  const d = data;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(245,197,24,0.15)" }}>
          <Megaphone className="h-5 w-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-white font-black text-2xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
            MARKETING & GROWTH ENGINE
          </h1>
          <p className="text-white/40 text-[13px]">
            Campaigns · Coupons · Referrals · Email · Push — last 30 days
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href="/admin/marketing/campaigns"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold"
            style={{ background: "#E8FF47", color: "#0D0D0D" }}>
            <Megaphone className="h-4 w-4" /> New Campaign
          </Link>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Megaphone} label="Campaigns Sent" value={d?.campaigns.sent.toLocaleString() ?? "—"}
          sub={`${d?.campaigns.total ?? 0} total campaigns`} color="#F5C518"
          href="/admin/marketing/campaigns" />
        <KpiCard icon={DollarSign} label="Campaign Revenue" value={`₹${Math.round((d?.campaigns.revenue ?? 0)/1000)}K`}
          sub={`${d?.campaigns.conversionRate ?? "0"}% conv. rate`} color="#22C55E"
          href="/admin/marketing/analytics" />
        <KpiCard icon={Tag} label="Coupon Orders" value={d?.coupons.ordersWithCoupon ?? 0}
          sub={`₹${Math.round((d?.coupons.totalDiscount ?? 0)/1000)}K discount given`} color="#A78BFA"
          href="/admin/marketing/coupons" />
        <KpiCard icon={Gift} label="Referrals Completed" value={d?.referrals.completed ?? 0}
          sub="Active referral program" color="#EC4899"
          href="/admin/marketing/referrals" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Mail} label="Email Open Rate" value={`${d?.campaigns.openRate ?? "0"}%`}
          sub={`${d?.campaigns.opens.toLocaleString() ?? 0} opens`} color="#3B82F6"
          href="/admin/marketing/email" />
        <KpiCard icon={TrendingUp} label="Click Rate"
          value={d?.campaigns.sent ? `${((d.campaigns.clicks/d.campaigns.sent)*100).toFixed(1)}%` : "0%"}
          sub={`${d?.campaigns.clicks.toLocaleString() ?? 0} clicks`} color="#06B6D4"
          href="/admin/marketing/analytics" />
        <KpiCard icon={RotateCcw} label="Repeat Purchase Rate" value={`${d?.repeatRate ?? "0"}%`}
          sub="Customers with 2+ orders" color="#F97316"
          href="/admin/marketing/analytics" />
        <KpiCard icon={Zap} label="Loyalty Redeemed" value={`₹${d?.loyalty.valueRedeemed ?? 0}`}
          sub={`${d?.loyalty.redemptions ?? 0} redemptions`} color="#8B5CF6"
          href="/admin/marketing/analytics" />
      </div>

      {/* Quick nav modules */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: "/admin/marketing/campaigns", icon: Megaphone, label: "Campaign Manager", desc: "Email, WhatsApp, Loyalty" },
          { href: "/admin/marketing/coupons",   icon: Tag,       label: "Coupon Center",   desc: "Create & track coupons" },
          { href: "/admin/marketing/referrals", icon: Users,     label: "Referral System", desc: "Invite & reward" },
          { href: "/admin/marketing/email",     icon: Mail,      label: "Email Campaigns", desc: "Resend powered" },
          { href: "/admin/marketing/push",      icon: Bell,      label: "Push Notifications", desc: "Instant & scheduled" },
          { href: "/admin/marketing/analytics", icon: BarChart2, label: "Growth Analytics", desc: "7d · 30d · 90d" },
          { href: "/admin/marketing/content",   icon: Zap,       label: "Content Control", desc: "Banners & announcements" },
          { href: "/admin/crm/segments",        icon: Users,     label: "Audience Segments", desc: "VIP, At Risk, Churned…" },
        ].map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href}
            className="flex items-start gap-3 rounded-xl px-4 py-4 hover:bg-white/03 transition-colors group"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <Icon className="h-4 w-4 text-white/50 group-hover:text-white transition-colors" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-[13px] font-semibold leading-tight">{label}</p>
              <p className="text-white/35 text-[11px] mt-0.5">{desc}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-white/20 ml-auto shrink-0 mt-0.5" />
          </Link>
        ))}
      </div>

      {/* Active Campaigns + Top performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active campaigns */}
        <div className="rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <h2 className="text-white font-bold text-[14px] flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Live Campaigns
            </h2>
            <Link href="/admin/marketing/campaigns?status=RUNNING"
              className="text-[12px] text-white/40 hover:text-white flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y" style={{ divideColor: "rgba(255,255,255,0.04)" }}>
            {active.length === 0 && (
              <div className="px-5 py-8 text-center text-white/30 text-[13px]">
                No campaigns running
              </div>
            )}
            {active.slice(0, 6).map((c) => {
              const StatusIcon = STATUS_ICONS[c.status] ?? Play;
              return (
                <Link key={c.id} href={`/admin/marketing/campaigns/${c.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-white/02 transition-colors">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${TYPE_COLORS[c.type] ?? "#6B7280"}18` }}>
                    <span className="text-[10px] font-bold" style={{ color: TYPE_COLORS[c.type] ?? "#9CA3AF" }}>
                      {c.type.slice(0, 3)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[13px] font-medium truncate">{c.name}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[11px] text-white/40">{c.sentCount} sent</span>
                      <span className="text-[11px] text-white/40">·</span>
                      <span className="text-[11px] text-white/40">{c.conversionCount} converted</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white font-bold text-[13px]">
                      ₹{Number(c.revenueGenerated).toLocaleString("en-IN")}
                    </p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <StatusIcon className="h-2.5 w-2.5" style={{ color: STATUS_COLORS[c.status] }} />
                      <span className="text-[10px]" style={{ color: STATUS_COLORS[c.status] }}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Top performing campaigns */}
        <div className="rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <h2 className="text-white font-bold text-[14px]">Top Performers (30d)</h2>
            <Link href="/admin/marketing/analytics"
              className="text-[12px] text-white/40 hover:text-white flex items-center gap-1">
              Full analytics <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y" style={{ divideColor: "rgba(255,255,255,0.04)" }}>
            {(d?.topCampaigns ?? []).length === 0 && (
              <div className="px-5 py-8 text-center text-white/30 text-[13px]">No data yet</div>
            )}
            {(d?.topCampaigns ?? []).map((c, i) => (
              <Link key={c.id} href={`/admin/marketing/campaigns/${c.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-white/02 transition-colors">
                <span className="text-white/20 text-[12px] font-mono w-4 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[13px] truncate">{c.name}</p>
                  <div className="flex gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                      style={{ color: TYPE_COLORS[c.type], background: `${TYPE_COLORS[c.type]}18` }}>
                      {c.type}
                    </span>
                    <span className="text-[11px] text-white/40">{c.conversionCount} conv.</span>
                  </div>
                </div>
                <p className="text-white font-bold text-[13px] shrink-0">
                  ₹{Number(c.revenueGenerated).toLocaleString("en-IN")}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
