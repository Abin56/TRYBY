"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Download, Terminal } from "lucide-react";

interface EnvResult {
  ok:           boolean;
  missing:      string[];
  placeholders: string[];
  warnings:     string[];
}

interface EnvGroup {
  label:    string;
  vars:     { key: string; required: boolean; description: string; group: string }[];
}

const CARD = "rounded-2xl border p-5";
const CARD_S = { background: "#111", borderColor: "rgba(255,255,255,0.06)" };

export default function EnvironmentPage() {
  const [result,  setResult]  = useState<EnvResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/system").catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setResult(data.env ?? null);
    }
    setLoading(false);
  }

  function statusFor(key: string): "pass" | "placeholder" | "missing" | "warning" {
    if (!result) return "warning";
    if (result.missing.some(m => m.startsWith(key)))      return "missing";
    if (result.placeholders.some(p => p.startsWith(key))) return "placeholder";
    if (result.warnings.some(w => w.startsWith(key)))     return "warning";
    return "pass";
  }

  const ENV_GROUPS: EnvGroup[] = [
    {
      label: "Database & Auth",
      vars: [
        { key: "DATABASE_URL",      required: true,  description: "Neon PostgreSQL connection string",      group: "db" },
        { key: "NEXTAUTH_SECRET",   required: true,  description: "NextAuth.js JWT signing secret",         group: "db" },
        { key: "NEXTAUTH_URL",      required: true,  description: "Application base URL",                   group: "db" },
      ],
    },
    {
      label: "Cloudinary (Media CDN)",
      vars: [
        { key: "CLOUDINARY_CLOUD_NAME",             required: true,  description: "Cloud name from dashboard", group: "cloudinary" },
        { key: "CLOUDINARY_API_KEY",                required: true,  description: "API key",                   group: "cloudinary" },
        { key: "CLOUDINARY_API_SECRET",             required: true,  description: "API secret",                group: "cloudinary" },
        { key: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", required: true,  description: "Public cloud name",         group: "cloudinary" },
      ],
    },
    {
      label: "Razorpay (Payments)",
      vars: [
        { key: "RAZORPAY_KEY_ID",              required: true,  description: "Key ID (rzp_live_* or rzp_test_*)", group: "razorpay" },
        { key: "RAZORPAY_KEY_SECRET",          required: true,  description: "Key secret",                        group: "razorpay" },
        { key: "NEXT_PUBLIC_RAZORPAY_KEY_ID",  required: true,  description: "Public key ID for checkout.js",     group: "razorpay" },
        { key: "RAZORPAY_WEBHOOK_SECRET",      required: true,  description: "Webhook HMAC secret",               group: "razorpay" },
      ],
    },
    {
      label: "Resend (Email)",
      vars: [
        { key: "RESEND_API_KEY",    required: true,  description: "Resend API key (re_*)",       group: "resend" },
        { key: "RESEND_FROM_EMAIL", required: true,  description: "From email address",           group: "resend" },
      ],
    },
    {
      label: "Google OAuth (optional)",
      vars: [
        { key: "GOOGLE_CLIENT_ID",     required: false, description: "OAuth 2.0 client ID",    group: "oauth" },
        { key: "GOOGLE_CLIENT_SECRET", required: false, description: "OAuth 2.0 client secret", group: "oauth" },
      ],
    },
    {
      label: "Sentry (optional)",
      vars: [
        { key: "NEXT_PUBLIC_SENTRY_DSN", required: false, description: "Sentry DSN for error monitoring", group: "sentry" },
        { key: "SENTRY_AUTH_TOKEN",      required: false, description: "Source map upload token",          group: "sentry" },
      ],
    },
  ];

  function downloadReport() {
    if (!result) return;
    const lines = [
      "TRYBY Environment Audit Report",
      `Generated: ${new Date().toISOString()}`,
      `Status: ${result.ok ? "PASS" : "FAIL"}`,
      "",
      "MISSING REQUIRED:",
      ...(result.missing.length ? result.missing.map(m => `  ✗ ${m}`) : ["  none"]),
      "",
      "PLACEHOLDER VALUES:",
      ...(result.placeholders.length ? result.placeholders.map(p => `  ⚠ ${p}`) : ["  none"]),
      "",
      "OPTIONAL / WARNINGS:",
      ...(result.warnings.length ? result.warnings.map(w => `  - ${w}`) : ["  none"]),
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "tryby-env-audit.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  const statusIcon = (s: ReturnType<typeof statusFor>) => {
    if (s === "pass")        return <CheckCircle2 className="h-4 w-4 text-[#4ADE80]" />;
    if (s === "placeholder") return <AlertCircle  className="h-4 w-4 text-[#FBBF24]" />;
    if (s === "missing")     return <XCircle      className="h-4 w-4 text-[#F87171]" />;
    return                          <AlertCircle  className="h-4 w-4 text-white/20"  />;
  };

  const blockers = (result?.missing.length ?? 0) + (result?.placeholders.length ?? 0);

  return (
    <div className="p-6 lg:p-8 max-w-[860px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>Environment Audit</h1>
          <p className="text-white/40 text-[13px]">
            {result ? (result.ok ? "All required variables are configured." : `${blockers} blocker${blockers !== 1 ? "s" : ""} — site will not work correctly until resolved.`) : "Checking…"}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadReport} disabled={!result}
            className="h-9 px-3 rounded-xl text-[12px] font-bold border flex items-center gap-1.5 transition-all disabled:opacity-40"
            style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button onClick={load} disabled={loading}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold disabled:opacity-50"
            style={{ background: "#E8FF47", color: "#0D0D0D" }}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      {result && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Missing",     count: result.missing.length,      color: "#F87171", bg: "rgba(248,113,113,0.1)" },
            { label: "Placeholder", count: result.placeholders.length,  color: "#FBBF24", bg: "rgba(251,191,36,0.1)" },
            { label: "Warnings",   count: result.warnings.length,      color: "#60A5FA", bg: "rgba(96,165,250,0.1)" },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className="rounded-2xl border p-4 text-center" style={{ background: bg, borderColor: `${color}30` }}>
              <p className="font-black text-[28px] leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{count}</p>
              <p className="text-[11px] font-semibold text-white/50 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Groups */}
      {ENV_GROUPS.map(group => (
        <div key={group.label} className={`${CARD} mb-4`} style={CARD_S}>
          <p className="text-[12px] font-bold text-white/40 uppercase tracking-wider mb-4">{group.label}</p>
          <div className="space-y-2">
            {group.vars.map(v => {
              const s = statusFor(v.key);
              return (
                <div key={v.key} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "#0D0D0D" }}>
                  {loading ? <div className="h-4 w-4 rounded-full border-2 border-white/10 animate-pulse" /> : statusIcon(s)}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[12px] font-bold text-white">{v.key}</p>
                    <p className="text-[11px] text-white/35">{v.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!v.required && <span className="text-[10px] text-white/25 font-semibold">optional</span>}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: s === "pass" ? "rgba(74,222,128,0.12)" : s === "placeholder" ? "rgba(251,191,36,0.12)" : s === "missing" ? "rgba(248,113,113,0.12)" : "rgba(255,255,255,0.06)",
                        color: s === "pass" ? "#4ADE80" : s === "placeholder" ? "#FBBF24" : s === "missing" ? "#F87171" : "rgba(255,255,255,0.3)",
                      }}>
                      {s === "pass" ? "SET" : s === "placeholder" ? "PLACEHOLDER" : s === "missing" ? "MISSING" : "UNSET"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="rounded-xl p-4 border flex items-start gap-2" style={{ background: "rgba(99,102,241,0.05)", borderColor: "rgba(99,102,241,0.15)" }}>
        <Terminal className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-white/40 leading-relaxed">
          All sensitive values are read server-side and never exposed to this page. Status is derived from <code className="text-white/60">lib/env.ts</code> which checks for placeholder patterns like <code className="text-white/60">REPLACE_WITH_*</code>. Edit <code className="text-white/60">.env.local</code> and restart the dev server to apply changes.
        </p>
      </div>
    </div>
  );
}
