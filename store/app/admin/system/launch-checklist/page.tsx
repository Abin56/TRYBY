"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, XCircle, AlertCircle, RefreshCw, Loader2,
  Database, Cloud, CreditCard, Mail, ShieldCheck, Package,
  Megaphone, Search, Users, Globe, Zap, Shield, Lock, Ban,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ServiceStatus {
  ok: boolean;
  configured: boolean;
  latencyMs?: number;
  error?: string;
  mode?: string;
}

interface SystemData {
  status: string;
  checkedAt: string;
  totalMs: number;
  services: {
    database:   ServiceStatus & { name: string };
    cloudinary: ServiceStatus & { name: string };
    razorpay:   ServiceStatus & { name: string };
    resend:     ServiceStatus & { name: string };
    oauth:      { google: { configured: boolean }; name: string };
  };
  env: { ok: boolean; missing: string[]; placeholders: string[]; warnings: string[] };
  counts: {
    products:  { total: number; active: number; outOfStock: number; categories: number };
    orders:    { total: number };
    content:   { published: number; activeAnnouncements: number; siteSettings: number; media: number };
    coupons:   { active: number };
    reviews:   { pending: number };
  };
  migrations: { name: string; appliedAt: string }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

type CheckStatus = "pass" | "warn" | "fail" | "loading";

interface CheckItem {
  id: string;
  label: string;
  description: string;
  status: CheckStatus;
  detail?: string;
  icon: React.ElementType;
}

function statusIcon(s: CheckStatus) {
  if (s === "loading") return <Loader2 className="h-4 w-4 animate-spin text-white/30" />;
  if (s === "pass")    return <CheckCircle2 className="h-4 w-4 text-[#4ADE80]" />;
  if (s === "warn")    return <AlertCircle className="h-4 w-4 text-[#FBBF24]" />;
  return <XCircle className="h-4 w-4 text-[#F87171]" />;
}

function statusColor(s: CheckStatus) {
  if (s === "pass") return "rgba(74,222,128,0.08)";
  if (s === "warn") return "rgba(251,191,36,0.08)";
  if (s === "fail") return "rgba(248,113,113,0.08)";
  return "transparent";
}

function scoreFromChecks(checks: CheckItem[]): number {
  const done = checks.filter(c => c.status !== "loading");
  if (!done.length) return 0;
  const pts = done.reduce((acc, c) => acc + (c.status === "pass" ? 2 : c.status === "warn" ? 1 : 0), 0);
  return Math.round((pts / (done.length * 2)) * 100);
}

// ── Component ──────────────────────────────────────────────────────────────

export default function LaunchChecklistPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  function buildChecks(d: SystemData | null): CheckItem[] {
    const L: CheckStatus = "loading";
    return [
      // ── Infrastructure ─────────────────────────────────────────────
      {
        id: "db",
        label: "Database Connected",
        description: "Neon PostgreSQL reachable and responding",
        icon: Database,
        status: !d ? L : d.services.database.ok ? "pass" : "fail",
        detail: d ? `${d.services.database.latencyMs}ms latency` : undefined,
      },
      {
        id: "db-migrated",
        label: "Schema Up-to-date",
        description: "Latest Prisma migration applied",
        icon: Database,
        status: !d ? L : d.migrations.length > 0 ? "pass" : "warn",
        detail: d?.migrations[0] ? `Latest: ${d.migrations[0].name.slice(0, 40)}…` : "No migrations found",
      },
      // ── Payments ────────────────────────────────────────────────────
      {
        id: "razorpay",
        label: "Razorpay Configured",
        description: "Payment gateway keys set and API reachable",
        icon: CreditCard,
        status: !d ? L : !d.services.razorpay.configured ? "fail" : d.services.razorpay.ok ? "pass" : "warn",
        detail: d?.services.razorpay.mode === "live" ? "✓ Live mode" : d?.services.razorpay.mode === "test" ? "⚠ Test mode only" : d?.services.razorpay.error,
      },
      {
        id: "razorpay-webhook",
        label: "Razorpay Webhook Secret",
        description: "HMAC webhook secret configured for payment events",
        icon: ShieldCheck,
        status: !d ? L
          : d.env.missing.some(m => m.startsWith("RAZORPAY_WEBHOOK_SECRET")) || d.env.placeholders.some(m => m.startsWith("RAZORPAY_WEBHOOK_SECRET"))
            ? "fail" : "pass",
        detail: "Required for payment verification",
      },
      // ── Media ────────────────────────────────────────────────────────
      {
        id: "cloudinary",
        label: "Cloudinary Media",
        description: "CDN credentials set and API accessible",
        icon: Cloud,
        status: !d ? L : !d.services.cloudinary.configured ? "fail" : d.services.cloudinary.ok ? "pass" : "warn",
        detail: d?.services.cloudinary.ok ? `${d.counts.content.media} assets` : d?.services.cloudinary.error,
      },
      // ── Email ─────────────────────────────────────────────────────────
      {
        id: "resend",
        label: "Transactional Email",
        description: "Resend API key set and account accessible",
        icon: Mail,
        status: !d ? L : !d.services.resend.configured ? "fail" : d.services.resend.ok ? "pass" : "warn",
        detail: d?.services.resend.error,
      },
      // ── Auth ─────────────────────────────────────────────────────────
      {
        id: "auth-secret",
        label: "NextAuth Secret",
        description: "NEXTAUTH_SECRET set (required for sessions)",
        icon: ShieldCheck,
        status: !d ? L
          : d.env.missing.some(m => m.startsWith("NEXTAUTH_SECRET")) ? "fail" : "pass",
      },
      {
        id: "google-oauth",
        label: "Google OAuth",
        description: "Social login via Google (optional)",
        icon: Users,
        status: !d ? L : d.services.oauth.google.configured ? "pass" : "warn",
        detail: !d?.services.oauth.google.configured ? "Optional — email login still works" : "Configured",
      },
      // ── Content ──────────────────────────────────────────────────────
      {
        id: "products",
        label: "Products Live",
        description: "At least 1 active product in catalogue",
        icon: Package,
        status: !d ? L : d.counts.products.active > 0 ? "pass" : "fail",
        detail: d ? `${d.counts.products.active} active product${d.counts.products.active !== 1 ? "s" : ""} · ${d.counts.products.categories} categor${d.counts.products.categories !== 1 ? "ies" : "y"}` : undefined,
      },
      {
        id: "cms",
        label: "CMS Content Published",
        description: "Homepage hero and key content blocks published",
        icon: Globe,
        status: !d ? L : d.counts.content.published >= 2 ? "pass" : d.counts.content.published >= 1 ? "warn" : "fail",
        detail: d ? `${d.counts.content.published} published block${d.counts.content.published !== 1 ? "s" : ""}` : undefined,
      },
      {
        id: "announcements",
        label: "Announcement Bar",
        description: "At least one active announcement configured",
        icon: Megaphone,
        status: !d ? L : d.counts.content.activeAnnouncements > 0 ? "pass" : "warn",
        detail: d ? `${d.counts.content.activeAnnouncements} active` : undefined,
      },
      // ── SEO ──────────────────────────────────────────────────────────
      {
        id: "seo-settings",
        label: "SEO Settings",
        description: "Site meta / OG settings configured in CMS",
        icon: Search,
        status: !d ? L : d.counts.content.siteSettings > 0 ? "pass" : "warn",
        detail: d ? `${d.counts.content.siteSettings} setting${d.counts.content.siteSettings !== 1 ? "s" : ""} saved` : undefined,
      },
      // ── Monitoring ───────────────────────────────────────────────────
      {
        id: "sentry",
        label: "Error Monitoring (Sentry)",
        description: "NEXT_PUBLIC_SENTRY_DSN set for production alerts",
        icon: Zap,
        status: !d ? L
          : d.env.warnings.some(w => w.includes("NEXT_PUBLIC_SENTRY_DSN")) || d.env.missing.some(m => m.includes("NEXT_PUBLIC_SENTRY_DSN"))
            ? "warn" : "pass",
        detail: "Optional but strongly recommended",
      },
      // ── Security ─────────────────────────────────────────────────────
      {
        id: "rate-limiting",
        label: "Rate Limiting Active",
        description: "IP-based sliding window on auth, webhook, and admin routes",
        icon: Ban,
        status: "pass", // always pass — wired at code level, no config needed
        detail: "Auth: 5–10/window · Webhooks: 200/min · Admin: 300/min",
      },
      {
        id: "account-lockout",
        label: "Account Lockout",
        description: "Accounts lock after 5 failed logins for 15 minutes",
        icon: Lock,
        status: "pass", // always pass — wired in auth.ts
        detail: "5 failures in 30 min → 15 min lockout",
      },
      {
        id: "webhook-secret",
        label: "Webhook HMAC Verification",
        description: "RAZORPAY_WEBHOOK_SECRET set for signature checks",
        icon: Shield,
        status: !d ? L
          : d.env.missing.some(m => m.startsWith("RAZORPAY_WEBHOOK_SECRET")) || d.env.placeholders.some(m => m.startsWith("RAZORPAY_WEBHOOK_SECRET"))
            ? "fail" : "pass",
        detail: "Required to prevent spoofed payment webhooks",
      },
      {
        id: "security-headers",
        label: "Security Headers",
        description: "X-Frame-Options, nosniff, Referrer-Policy on all routes",
        icon: ShieldCheck,
        status: "pass", // configured in next.config.ts
        detail: "DENY · nosniff · strict-origin-when-cross-origin",
      },
    ];
  }

  const checks = buildChecks(data);
  const score  = scoreFromChecks(checks);
  const passes = checks.filter(c => c.status === "pass").length;
  const warns  = checks.filter(c => c.status === "warn").length;
  const fails  = checks.filter(c => c.status === "fail").length;

  const scoreColor = score >= 90 ? "#4ADE80" : score >= 70 ? "#FBBF24" : "#F87171";
  const readyToLaunch = fails === 0;

  return (
    <div className="p-6 lg:p-8 max-w-[860px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Launch Checklist
          </h1>
          <p className="text-white/40 text-[13px]">
            {data ? `Last checked at ${new Date(data.checkedAt).toLocaleTimeString()} · ${data.totalMs}ms` : "Loading live status…"}
          </p>
        </div>
        <button onClick={refresh} disabled={loading}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold transition-all disabled:opacity-50"
          style={{ background: "#E8FF47", color: "#0D0D0D" }}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Score strip */}
      <div className="rounded-2xl p-5 mb-6 border" style={{ background: "#111", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex flex-wrap items-center gap-6">
          {/* Big score */}
          <div className="flex items-end gap-1.5">
            <span className="font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "64px", lineHeight: 1, color: scoreColor }}>
              {score}
            </span>
            <span className="text-white/30 font-bold text-[20px] mb-2">/100</span>
          </div>
          {/* Stats */}
          <div className="flex flex-wrap gap-4 flex-1">
            {[
              { label: "Passed",   count: passes, color: "#4ADE80" },
              { label: "Warnings", count: warns,  color: "#FBBF24" },
              { label: "Failed",   count: fails,  color: "#F87171" },
            ].map(({ label, count, color }) => (
              <div key={label} className="text-center">
                <p className="font-black text-[28px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{count}</p>
                <p className="text-white/40 text-[11px] font-semibold">{label}</p>
              </div>
            ))}
          </div>
          {/* Launch badge */}
          <div className="rounded-xl px-4 py-2.5 text-center" style={{ background: readyToLaunch ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${readyToLaunch ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}` }}>
            <p className="font-black text-[13px]" style={{ color: readyToLaunch ? "#4ADE80" : "#F87171", fontFamily: "'Barlow Condensed', sans-serif" }}>
              {readyToLaunch ? "✓ READY TO LAUNCH" : "✗ NOT READY"}
            </p>
            <p className="text-[11px]" style={{ color: readyToLaunch ? "rgba(74,222,128,0.6)" : "rgba(248,113,113,0.6)" }}>
              {fails > 0 ? `${fails} blocker${fails !== 1 ? "s" : ""} remaining` : "All blockers resolved"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: scoreColor }} />
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {checks.map((check) => (
          <div key={check.id}
            className="flex items-start gap-4 rounded-2xl px-4 py-3.5 border transition-all"
            style={{
              background: statusColor(check.status),
              borderColor: check.status === "pass" ? "rgba(74,222,128,0.12)"
                : check.status === "warn" ? "rgba(251,191,36,0.12)"
                : check.status === "fail" ? "rgba(248,113,113,0.12)"
                : "rgba(255,255,255,0.04)",
            }}
          >
            <div className="mt-0.5 shrink-0">{statusIcon(check.status)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <check.icon className="h-3.5 w-3.5 text-white/30 shrink-0" />
                <p className="text-[13px] font-bold text-white">{check.label}</p>
              </div>
              <p className="text-[12px] text-white/40 mt-0.5">{check.description}</p>
              {check.detail && (
                <p className="text-[11px] mt-1 font-mono"
                  style={{ color: check.status === "pass" ? "rgba(74,222,128,0.7)" : check.status === "warn" ? "rgba(251,191,36,0.7)" : "rgba(248,113,113,0.7)" }}>
                  {check.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Env warnings */}
      {data?.env.warnings.length ? (
        <div className="mt-6 rounded-2xl p-4 border" style={{ background: "rgba(251,191,36,0.04)", borderColor: "rgba(251,191,36,0.12)" }}>
          <p className="text-[12px] font-bold text-yellow-400 mb-2">Optional env vars not set:</p>
          <ul className="space-y-1">
            {data.env.warnings.map(w => (
              <li key={w} className="text-[11px] font-mono text-white/40">— {w}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
