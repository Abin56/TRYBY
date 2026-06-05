"use client";

import { useState, useCallback } from "react";
import {
  Database, Cloud, CreditCard, Mail, Users, RefreshCw,
  CheckCircle2, XCircle, AlertCircle, Loader2, Play,
  ChevronDown, ChevronUp, Zap, Shield,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ServiceResult {
  service:    string;
  ok:         boolean;
  configured: boolean;
  latencyMs:  number;
  message:    string;
  action?:    string;
  detail?:    string;
}

interface VerifyResponse {
  ok:       boolean;
  score:    number;
  passing:  number;
  total:    number;
  totalMs:  number;
  testedAt: string;
  results:  ServiceResult[];
}

// ── Config ─────────────────────────────────────────────────────────────────

const SERVICE_META: Record<string, { label: string; icon: React.ElementType; color: string; description: string }> = {
  database:    { label: "Neon PostgreSQL",   icon: Database,  color: "#60A5FA", description: "Live query + record counts" },
  cloudinary:  { label: "Cloudinary CDN",    icon: Cloud,     color: "#A78BFA", description: "Upload test + usage data" },
  razorpay:    { label: "Razorpay Payments", icon: CreditCard,color: "#34D399", description: "API connectivity + mode check" },
  resend:      { label: "Resend Email",      icon: Mail,      color: "#F59E0B", description: "API key + domain list" },
  google_oauth:{ label: "Google OAuth",      icon: Users,     color: "#FB7185", description: "Credentials format + config check" },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function StatusIcon({ r }: { r: ServiceResult | null }) {
  if (!r) return <div className="h-5 w-5 rounded-full border-2 border-white/15" />;
  if (r.ok)          return <CheckCircle2 className="h-5 w-5 text-[#4ADE80]" />;
  if (r.configured)  return <AlertCircle  className="h-5 w-5 text-[#FBBF24]" />;
  return               <XCircle className="h-5 w-5 text-[#F87171]" />;
}

function badge(r: ServiceResult) {
  if (r.ok)         return { label: "PASS",   bg: "rgba(74,222,128,0.12)",  color: "#4ADE80" };
  if (r.configured) return { label: "WARN",   bg: "rgba(251,191,36,0.12)",  color: "#FBBF24" };
  return                   { label: "FAIL",   bg: "rgba(248,113,113,0.12)", color: "#F87171" };
}

const CARD = "rounded-2xl border p-5";
const CARD_DARK = { background: "#111", borderColor: "rgba(255,255,255,0.06)" };

// ── Page ───────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const [data,    setData]    = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [single,  setSingle]  = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const run = useCallback(async (service = "all") => {
    setLoading(true);
    setSingle(service === "all" ? null : service);
    try {
      const res = await fetch("/api/admin/system/verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ service }),
      });
      if (res.ok) {
        const json: VerifyResponse = await res.json();
        if (service === "all") {
          setData(json);
        } else {
          // Merge single result into existing data
          setData(prev => {
            if (!prev) return json;
            const merged = [...prev.results.filter(r => r.service !== service), ...json.results];
            const passing = merged.filter(r => r.ok).length;
            return { ...prev, results: merged, passing, score: Math.round((passing / merged.length) * 100) };
          });
        }
      }
    } finally {
      setLoading(false);
      setSingle(null);
    }
  }, []);

  const resultMap = Object.fromEntries((data?.results ?? []).map(r => [r.service, r]));

  const scoreColor = !data ? "#9CA3AF"
    : data.score === 100 ? "#4ADE80"
    : data.score >= 60 ? "#FBBF24"
    : "#F87171";

  return (
    <div className="p-6 lg:p-8 max-w-[860px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Service Verification
          </h1>
          <p className="text-white/40 text-[13px]">
            {data ? `Last tested ${new Date(data.testedAt).toLocaleTimeString()} · ${data.totalMs}ms` : "Run tests to verify all external services live"}
          </p>
        </div>
        <button onClick={() => run("all")} disabled={loading}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold disabled:opacity-50 transition-all"
          style={{ background: "#E8FF47", color: "#0D0D0D" }}>
          {loading && !single
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Play className="h-4 w-4" />}
          Run All Tests
        </button>
      </div>

      {/* Score strip */}
      {data && (
        <div className={`${CARD} mb-6`} style={CARD_DARK}>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-end gap-1.5">
              <span className="font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "56px", lineHeight: 1, color: scoreColor }}>
                {data.score}
              </span>
              <span className="text-white/30 font-bold text-[18px] mb-1">/100</span>
            </div>
            <div className="flex gap-4 flex-1 flex-wrap">
              <div className="text-center">
                <p className="font-black text-[26px] text-[#4ADE80]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{data.passing}</p>
                <p className="text-[11px] font-semibold text-white/40">Passing</p>
              </div>
              <div className="text-center">
                <p className="font-black text-[26px] text-[#F87171]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{data.total - data.passing}</p>
                <p className="text-[11px] font-semibold text-white/40">Failing</p>
              </div>
            </div>
            <div className="rounded-xl px-4 py-2 text-center" style={{
              background: data.ok ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
              border: `1px solid ${data.ok ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
            }}>
              <p className="font-black text-[13px]" style={{ color: data.ok ? "#4ADE80" : "#F87171", fontFamily: "'Barlow Condensed', sans-serif" }}>
                {data.ok ? "✓ ALL SERVICES OK" : "✗ ISSUES FOUND"}
              </p>
            </div>
          </div>
          <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${data.score}%`, background: scoreColor }} />
          </div>
        </div>
      )}

      {/* Service cards */}
      <div className="space-y-3">
        {Object.entries(SERVICE_META).map(([key, meta]) => {
          const r       = resultMap[key] ?? null;
          const isRunning = loading && single === key;
          const b       = r ? badge(r) : null;
          const isOpen  = expanded[key];

          return (
            <div key={key} className={CARD} style={CARD_DARK}>
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${meta.color}15` }}>
                  <meta.icon className="h-5 w-5" style={{ color: meta.color }} />
                </div>

                {/* Main */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-bold text-white">{meta.label}</p>
                    {isRunning && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />}
                    {r && !isRunning && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: b!.bg, color: b!.color }}>
                        {b!.label}
                      </span>
                    )}
                    {r && <span className="text-[11px] text-white/30">{r.latencyMs}ms</span>}
                  </div>
                  <p className="text-[12px] text-white/40 mt-0.5">{meta.description}</p>
                  {r && (
                    <p className="text-[12px] mt-1 font-mono" style={{ color: r.ok ? "rgba(74,222,128,0.8)" : "rgba(248,113,113,0.8)" }}>
                      {r.message}
                    </p>
                  )}
                  {r?.action && !r.ok && (
                    <p className="text-[11px] mt-1 text-[#FBBF24]">
                      → {r.action}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <StatusIcon r={isRunning ? null : r} />
                  <button onClick={() => run(key)} disabled={loading}
                    className="h-7 w-7 flex items-center justify-center rounded-lg transition-all hover:bg-white/10 disabled:opacity-40"
                    title={`Test ${meta.label}`}>
                    <RefreshCw className="h-3.5 w-3.5 text-white/40" />
                  </button>
                  {r?.detail && (
                    <button onClick={() => setExpanded(p => ({ ...p, [key]: !isOpen }))}
                      className="h-7 w-7 flex items-center justify-center rounded-lg transition-all hover:bg-white/10">
                      {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-white/40" /> : <ChevronDown className="h-3.5 w-3.5 text-white/40" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Detail expand */}
              {isOpen && r?.detail && (
                <div className="mt-4 rounded-xl px-3 py-3 border" style={{ background: "#0D0D0D", borderColor: "rgba(255,255,255,0.06)" }}>
                  <pre className="text-[11px] font-mono text-white/50 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(r.detail, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No data state */}
      {!data && !loading && (
        <div className="mt-6 rounded-2xl border p-8 text-center" style={CARD_DARK}>
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(232,255,71,0.1)" }}>
              <Zap className="h-7 w-7 text-[#E8FF47]" />
            </div>
          </div>
          <p className="text-white font-bold text-[15px] mb-1">No results yet</p>
          <p className="text-white/40 text-[13px] mb-5">Click "Run All Tests" to verify all external services with live connections.</p>
          <button onClick={() => run("all")}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-bold"
            style={{ background: "#E8FF47", color: "#0D0D0D" }}>
            <Play className="h-4 w-4" /> Run All Tests
          </button>
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 rounded-xl p-4 border" style={{ background: "rgba(99,102,241,0.05)", borderColor: "rgba(99,102,241,0.15)" }}>
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-bold text-indigo-300 mb-1">Production safety</p>
            <p className="text-[11px] text-white/40 leading-relaxed">
              Cloudinary tests upload a 1×1 pixel image then delete it immediately. No customer data is used.
              Razorpay and Resend tests make read-only API calls. Google OAuth validation is format-only — no network call.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
