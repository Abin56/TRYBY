"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Zap, CheckCircle2, XCircle, Info } from "lucide-react";

interface FeatureFlag {
  id:          string;
  key:         string;
  name:        string;
  description: string | null;
  enabled:     boolean;
  rolloutPct:  number;
  updatedAt:   string;
}

const CARD = "rounded-2xl border";
const CARD_S = { background: "#111", borderColor: "rgba(255,255,255,0.06)" };

const FLAG_CATEGORIES: Record<string, string[]> = {
  "Customer Features": ["loyalty_enabled", "referral_enabled", "reviews_enabled", "wishlist_enabled", "community_enabled"],
  "Commerce":          ["coupons_enabled", "cod_enabled", "prelaunch_mode"],
  "Marketplace":       ["supplier_marketplace_enabled"],
  "Auth & Comms":      ["google_oauth_enabled", "whatsapp_notifications"],
  "System":            ["maintenance_bypass_admins"],
};

export default function FeatureFlagsPage() {
  const [flags,   setFlags]   = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/feature-flags").catch(() => null);
    if (res?.ok) setFlags(await res.json());
    setLoading(false);
  }

  async function toggle(flag: FeatureFlag) {
    setToggling(flag.key);
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ key: flag.key, enabled: !flag.enabled }),
      });
      if (res.ok) {
        setFlags(prev => prev.map(f => f.key === flag.key ? { ...f, enabled: !f.enabled } : f));
      }
    } finally { setToggling(null); }
  }

  async function seed() {
    await fetch("/api/admin/feature-flags", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "seed" }),
    });
    await load();
  }

  const flagMap = Object.fromEntries(flags.map(f => [f.key, f]));
  const allKnownKeys = new Set(Object.values(FLAG_CATEGORIES).flat());
  const uncategorized = flags.filter(f => !allKnownKeys.has(f.key));

  const enabledCount = flags.filter(f => f.enabled).length;

  return (
    <div className="p-6 lg:p-8 max-w-[800px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>Feature Flags</h1>
          <p className="text-white/40 text-[13px]">{enabledCount}/{flags.length} flags enabled · toggle features without redeploying</p>
        </div>
        <div className="flex gap-2">
          <button onClick={seed}
            className="h-9 px-3 rounded-xl text-[12px] font-bold border transition-all"
            style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
            Seed Defaults
          </button>
          <button onClick={load} disabled={loading}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold disabled:opacity-50"
            style={{ background: "#E8FF47", color: "#0D0D0D" }}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {Object.entries(FLAG_CATEGORIES).map(([category, keys]) => {
        const categoryFlags = keys.map(k => flagMap[k]).filter(Boolean);
        if (!categoryFlags.length) return null;
        return (
          <div key={category} className="mb-6">
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider px-1 mb-2">{category}</p>
            <div className={`${CARD} divide-y`} style={{ ...CARD_S, borderColor: "rgba(255,255,255,0.06)" }}>
              {categoryFlags.map(flag => (
                <div key={flag.key} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-bold text-white">{flag.name}</p>
                      {flag.rolloutPct < 100 && (
                        <span className="text-[10px] font-bold rounded-full px-2 py-0.5"
                          style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24" }}>
                          {flag.rolloutPct}% rollout
                        </span>
                      )}
                    </div>
                    {flag.description && (
                      <p className="text-[12px] text-white/40 mt-0.5">{flag.description}</p>
                    )}
                    <p className="font-mono text-[10px] text-white/20 mt-0.5">{flag.key}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {flag.enabled ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-white/20" />}
                    <button
                      onClick={() => toggle(flag)}
                      disabled={toggling === flag.key}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-all disabled:opacity-60"
                      style={{ background: flag.enabled ? "#4ADE80" : "rgba(255,255,255,0.1)" }}>
                      <span className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
                        style={{ transform: flag.enabled ? "translateX(26px)" : "translateX(2px)" }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {uncategorized.length > 0 && (
        <div className="mb-6">
          <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider px-1 mb-2">Other</p>
          <div className={`${CARD} divide-y`} style={CARD_S}>
            {uncategorized.map(flag => (
              <div key={flag.key} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-white">{flag.name}</p>
                  <p className="font-mono text-[10px] text-white/20">{flag.key}</p>
                </div>
                <button onClick={() => toggle(flag)} disabled={toggling === flag.key}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-all"
                  style={{ background: flag.enabled ? "#4ADE80" : "rgba(255,255,255,0.1)" }}>
                  <span className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
                    style={{ transform: flag.enabled ? "translateX(26px)" : "translateX(2px)" }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl p-3.5 border flex items-start gap-2" style={{ background: "rgba(99,102,241,0.06)", borderColor: "rgba(99,102,241,0.15)" }}>
        <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-white/40 leading-relaxed">
          Flag changes take effect within 60 seconds (server-side cache TTL).
          Client-side code must call <code className="text-white/60">isEnabled(key)</code> from <code className="text-white/60">lib/feature-flags.ts</code> to check flags dynamically.
        </p>
      </div>
    </div>
  );
}
