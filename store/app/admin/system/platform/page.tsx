"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield, Search, Zap, TrendingUp, Activity, RefreshCw, Loader2,
  CheckCircle2, AlertCircle, XCircle, Package, ShoppingBag, Users,
  Star, Globe, Database, Lock, CreditCard,
} from "lucide-react";

interface AuditData {
  checkedAt: string;
  overall:   number;
  scores: {
    security: number;
    seo:      number;
    services: number;
    revenue:  number;
    health:   number;
  };
  details: {
    products:  { total: number; active: number; outOfStock: number; categories: number };
    orders:    { total: number; pending: number; revenueTotal: number };
    users:     { total: number; locked: number };
    reviews:   { approved: number; pending: number; avgRating: string };
    content:   { published: number; activeAnnouncements: number; media: number };
    security:  { rateLimitHits24h: number; failedLogins24h: number; lockedAccounts: number };
    env:       { ok: boolean; missing: number; placeholders: number; warnings: number };
    migration: { name: string; appliedAt: string } | null;
  };
}

function ScoreGauge({ label, score, icon: Icon, color }: { label: string; score: number; icon: React.ElementType; color: string }) {
  const dash = 2 * Math.PI * 40;
  const offset = dash * (1 - score / 100);
  return (
    <div className="rounded-2xl border p-5 text-center" style={{ background: "#111", borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="relative mx-auto w-24 h-24 mb-3">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={dash} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
            strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-black text-[22px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{score}</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <p className="text-[12px] font-bold text-white/70">{label}</p>
      </div>
      <div className="h-1 rounded-full overflow-hidden mt-2" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

function MetricRow({ icon: Icon, label, value, status }: { icon: React.ElementType; label: string; value: string | number; status?: "ok" | "warn" | "fail" }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
      <Icon className="h-4 w-4 text-white/30 shrink-0" />
      <span className="flex-1 text-[13px] text-white/60">{label}</span>
      <span className="font-semibold text-[13px]" style={{ color: status === "fail" ? "#F87171" : status === "warn" ? "#FBBF24" : "rgba(255,255,255,0.8)" }}>
        {value}
      </span>
      {status && (
        status === "ok" ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> :
        status === "warn" ? <AlertCircle className="h-3.5 w-3.5 text-yellow-400" /> :
        <XCircle className="h-3.5 w-3.5 text-red-400" />
      )}
    </div>
  );
}

const SCORE_CONFIGS = [
  { key: "security" as const, label: "Security",  icon: Shield,    color: "#60A5FA" },
  { key: "seo"      as const, label: "SEO",        icon: Search,    color: "#A78BFA" },
  { key: "services" as const, label: "Services",   icon: Zap,       color: "#4ADE80" },
  { key: "revenue"  as const, label: "Revenue",    icon: TrendingUp,color: "#FBBF24" },
  { key: "health"   as const, label: "Health",     icon: Activity,  color: "#F97316" },
];

export default function PlatformAuditPage() {
  const [data,    setData]    = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/platform-audit").catch(() => null);
    if (res?.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const overallColor = !data ? "#9CA3AF"
    : data.overall >= 85 ? "#4ADE80"
    : data.overall >= 60 ? "#FBBF24"
    : "#F87171";

  return (
    <div className="p-6 lg:p-8 max-w-[1000px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>Platform Audit</h1>
          <p className="text-white/40 text-[13px]">
            {data ? `Last checked ${new Date(data.checkedAt).toLocaleTimeString()}` : "Loading platform metrics…"}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold disabled:opacity-50"
          style={{ background: "#E8FF47", color: "#0D0D0D" }}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {/* Overall score */}
      <div className="rounded-2xl border p-6 mb-6 flex flex-col sm:flex-row items-center gap-6"
        style={{ background: "#111", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="text-center">
          <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Overall Platform Score</p>
          <div className="font-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "80px", color: overallColor }}>
            {loading ? <Loader2 className="h-16 w-16 animate-spin mx-auto" /> : data?.overall ?? "—"}
          </div>
          <p className="text-[11px] text-white/30 mt-1">/ 100</p>
        </div>
        <div className="flex-1 w-full">
          <div className="h-3 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${data?.overall ?? 0}%`, background: overallColor }} />
          </div>
          <p className="text-[12px] text-white/50">
            {!data ? "" :
              data.overall >= 85 ? "✓ Platform is ready for production traffic" :
              data.overall >= 60 ? "⚠ Some areas need attention before launch" :
              "✗ Critical issues must be resolved before launch"}
          </p>
        </div>
      </div>

      {/* Score gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {SCORE_CONFIGS.map(({ key, label, icon, color }) => (
          <ScoreGauge key={key} label={label} score={data?.scores[key] ?? 0} icon={icon} color={color} />
        ))}
      </div>

      {/* Detail sections */}
      <div className="grid sm:grid-cols-2 gap-4">

        {/* Catalogue */}
        <div className="rounded-2xl border p-5" style={{ background: "#111", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-4 w-4 text-purple-400" />
            <p className="text-[13px] font-bold text-white">Catalogue</p>
          </div>
          {data ? <>
            <MetricRow icon={Package}      label="Active Products"    value={data.details.products.active}     status={data.details.products.active > 0 ? "ok" : "fail"} />
            <MetricRow icon={Package}      label="Out of Stock"       value={data.details.products.outOfStock}  status={data.details.products.outOfStock === 0 ? "ok" : "warn"} />
            <MetricRow icon={Globe}        label="Categories"         value={data.details.products.categories}  status={data.details.products.categories > 0 ? "ok" : "warn"} />
            <MetricRow icon={Globe}        label="Published Content"  value={data.details.content.published}    status={data.details.content.published >= 2 ? "ok" : "warn"} />
            <MetricRow icon={Globe}        label="Media Assets"       value={data.details.content.media}        />
          </> : <div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin text-white/20 mx-auto" /></div>}
        </div>

        {/* Commerce */}
        <div className="rounded-2xl border p-5" style={{ background: "#111", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-4 w-4 text-yellow-400" />
            <p className="text-[13px] font-bold text-white">Commerce</p>
          </div>
          {data ? <>
            <MetricRow icon={ShoppingBag}  label="Total Orders"       value={data.details.orders.total}         />
            <MetricRow icon={ShoppingBag}  label="Pending Orders"     value={data.details.orders.pending}       status={data.details.orders.pending < 10 ? "ok" : "warn"} />
            <MetricRow icon={TrendingUp}   label="Total Revenue"      value={`₹${data.details.orders.revenueTotal.toLocaleString("en-IN")}`} />
            <MetricRow icon={Users}        label="Total Users"        value={data.details.users.total}           />
            <MetricRow icon={Star}         label="Avg Rating"         value={`${data.details.reviews.avgRating} ★`} status={Number(data.details.reviews.avgRating) >= 4 ? "ok" : "warn"} />
          </> : <div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin text-white/20 mx-auto" /></div>}
        </div>

        {/* Security */}
        <div className="rounded-2xl border p-5" style={{ background: "#111", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-blue-400" />
            <p className="text-[13px] font-bold text-white">Security</p>
          </div>
          {data ? <>
            <MetricRow icon={Lock}         label="Locked Accounts"    value={data.details.security.lockedAccounts}    status={data.details.security.lockedAccounts === 0 ? "ok" : "warn"} />
            <MetricRow icon={Shield}       label="Rate Limit Hits 24h"value={data.details.security.rateLimitHits24h}   status={data.details.security.rateLimitHits24h < 50 ? "ok" : "warn"} />
            <MetricRow icon={Shield}       label="Failed Logins 24h"  value={data.details.security.failedLogins24h}    status={data.details.security.failedLogins24h < 20 ? "ok" : "warn"} />
            <MetricRow icon={Database}     label="Env Variables"      value={data.details.env.ok ? "All Set" : `${data.details.env.missing + data.details.env.placeholders} issues`} status={data.details.env.ok ? "ok" : "fail"} />
            <MetricRow icon={Database}     label="Last Migration"     value={data.details.migration?.name?.slice(-30) ?? "none"} status={data.details.migration ? "ok" : "warn"} />
          </> : <div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin text-white/20 mx-auto" /></div>}
        </div>

        {/* Reviews & Content */}
        <div className="rounded-2xl border p-5" style={{ background: "#111", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 text-orange-400" />
            <p className="text-[13px] font-bold text-white">Reviews & Content</p>
          </div>
          {data ? <>
            <MetricRow icon={Star}         label="Approved Reviews"   value={data.details.reviews.approved}          />
            <MetricRow icon={Star}         label="Pending Moderation" value={data.details.reviews.pending}           status={data.details.reviews.pending < 5 ? "ok" : "warn"} />
            <MetricRow icon={Globe}        label="Announcements"      value={data.details.content.activeAnnouncements} status={data.details.content.activeAnnouncements > 0 ? "ok" : "warn"} />
            <MetricRow icon={CreditCard}   label="Payment Gateway"    value={data.details.env.ok ? "Configured" : "Not Ready"} status={data.details.env.ok ? "ok" : "fail"} />
          </> : <div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin text-white/20 mx-auto" /></div>}
        </div>
      </div>
    </div>
  );
}
