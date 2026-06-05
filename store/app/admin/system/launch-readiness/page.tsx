"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, AlertCircle, Rocket, ExternalLink } from "lucide-react";

interface DimensionItem {
  label: string; status: "pass" | "warn" | "fail"; detail?: string; score: number;
}
interface Dimension {
  name: string; score: number; weight: number; items: DimensionItem[];
}
interface LaunchData {
  launchScore: number; readyToLaunch: boolean; checkedAt: string; dimensions: Dimension[];
}

const DIMENSION_LINKS: Record<string, string> = {
  "Catalog":             "/admin/products",
  "Inventory":           "/admin/inventory",
  "Suppliers":           "/admin/suppliers",
  "Orders":              "/admin/orders",
  "Payments":            "/admin/payments",
  "SEO":                 "/admin/seo",
  "Content":             "/admin/content/homepage",
  "Customer Experience": "/admin/customers",
};

function StatusIcon({ status }: { status: "pass" | "warn" | "fail" }) {
  if (status === "pass") return <CheckCircle className="h-4 w-4 text-[#4ADE80] shrink-0" />;
  if (status === "warn") return <AlertCircle className="h-4 w-4 text-[#F5C518] shrink-0" />;
  return <XCircle className="h-4 w-4 text-[#F87171] shrink-0" />;
}

export default function LaunchReadinessPage() {
  const [data, setData]       = useState<LaunchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/catalog/launch-readiness");
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
      <RefreshCw className="h-8 w-8 animate-spin text-white/20 mb-3" />
      <p className="text-white/30 text-[13px]">Running readiness checks…</p>
    </div>
  );

  if (!data) return <div className="p-8 text-white/40">Failed to load.</div>;

  const scoreColor = data.launchScore >= 80 ? "#4ADE80" : data.launchScore >= 60 ? "#F5C518" : "#F87171";
  const r = 46, circ = 2 * Math.PI * r;
  const dash = (data.launchScore / 100) * circ;

  return (
    <div className="p-6 lg:p-8 max-w-[900px]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/catalog-center" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px", letterSpacing: "-0.01em" }}>
            Launch Readiness Report
          </h1>
          <p className="text-white/40 text-[12px]">
            Checked {new Date(data.checkedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-semibold text-white/60 hover:text-white"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          <RefreshCw className="h-3.5 w-3.5" /> Recheck
        </button>
      </div>

      {/* Hero score */}
      <div className="rounded-2xl p-6 mb-6 flex items-center gap-8"
        style={{ background: "#1A1A1A", border: `2px solid ${scoreColor}20` }}>
        <div className="relative shrink-0">
          <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" stroke="rgba(255,255,255,0.08)" />
            <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" stroke={scoreColor}
              strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: scoreColor }}>
              {data.launchScore}%
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {data.readyToLaunch ? (
              <div className="flex items-center gap-2 rounded-full px-4 py-1.5" style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)" }}>
                <Rocket className="h-4 w-4 text-[#4ADE80]" />
                <span className="text-[13px] font-black text-[#4ADE80]">Ready to Launch</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full px-4 py-1.5" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)" }}>
                <AlertCircle className="h-4 w-4 text-[#F87171]" />
                <span className="text-[13px] font-black text-[#F87171]">Not Ready</span>
              </div>
            )}
          </div>
          <p className="text-white/50 text-[13px]">
            {data.readyToLaunch
              ? "All critical systems are operational. You can launch the store."
              : "Fix the failing items below before going live. Critical failures block launch."}
          </p>
          <div className="flex items-center gap-3 mt-3">
            {[
              { status: "pass", count: data.dimensions.reduce((s, d) => s + d.items.filter(i => i.status === "pass").length, 0) },
              { status: "warn", count: data.dimensions.reduce((s, d) => s + d.items.filter(i => i.status === "warn").length, 0) },
              { status: "fail", count: data.dimensions.reduce((s, d) => s + d.items.filter(i => i.status === "fail").length, 0) },
            ].map(({ status, count }) => (
              <div key={status} className="flex items-center gap-1.5">
                <StatusIcon status={status as "pass" | "warn" | "fail"} />
                <span className="text-[12px] font-semibold text-white/60">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dimension grid */}
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {data.dimensions.map(dim => {
          const color = dim.score >= 80 ? "#4ADE80" : dim.score >= 60 ? "#F5C518" : "#F87171";
          const failures = dim.items.filter(i => i.status === "fail").length;
          const warnings = dim.items.filter(i => i.status === "warn").length;
          const isOpen = expanded === dim.name;

          return (
            <div key={dim.name} className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: `1px solid ${color}18` }}>
              <button
                onClick={() => setExpanded(e => e === dim.name ? null : dim.name)}
                className="flex items-center gap-3 w-full px-5 py-4 hover:bg-white/[0.02] transition-all text-left">
                {/* Score bar */}
                <div className="shrink-0">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                    <span className="text-[14px] font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{dim.score}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-white">{dim.name}</p>
                    <span className="text-[9px] text-white/25">w:{dim.weight}%</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {failures > 0 && <span className="text-[10px] font-bold text-[#F87171]">{failures} fail{failures !== 1 ? "s" : ""}</span>}
                    {warnings > 0 && <span className="text-[10px] font-bold text-[#F5C518]">{warnings} warn{warnings !== 1 ? "s" : ""}</span>}
                    {failures === 0 && warnings === 0 && <span className="text-[10px] font-bold text-[#4ADE80]">All passing</span>}
                  </div>
                </div>
                <div className="h-1 w-16 rounded-full overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full" style={{ width: `${dim.score}%`, background: color }} />
                </div>
                {DIMENSION_LINKS[dim.name] && (
                  <Link href={DIMENSION_LINKS[dim.name]} onClick={e => e.stopPropagation()}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:text-[#F5C518] transition-all shrink-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
              </button>

              {isOpen && (
                <div className="border-t px-5 py-3 space-y-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  {dim.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 py-1.5">
                      <StatusIcon status={item.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-white/80">{item.label}</p>
                        {item.detail && <p className="text-[10px] text-white/35 mt-0.5">{item.detail}</p>}
                      </div>
                      <span className="text-[10px] font-bold shrink-0"
                        style={{ color: item.score >= 80 ? "#4ADE80" : item.score >= 60 ? "#F5C518" : "#F87171" }}>
                        {item.score}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* System check link */}
      <Link href="/admin/system" className="flex items-center justify-between rounded-2xl px-5 py-4 hover:bg-white/[0.02] transition-all"
        style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <p className="text-[13px] font-semibold text-white">Full System Health Check</p>
          <p className="text-[11px] text-white/35">Services, migrations, audit trail, environment variables</p>
        </div>
        <ExternalLink className="h-4 w-4 text-white/30" />
      </Link>
    </div>
  );
}
