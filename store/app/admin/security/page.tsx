"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield, AlertTriangle, Lock, RefreshCw, XCircle,
  CheckCircle2, Loader2, Activity, Ban, Unlock,
  Globe, TrendingUp, Clock, Trash2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface SecurityData {
  summary: {
    windowHours:      number;
    rateLimitHits:    number;
    lockedAccounts:   number;
    failedLogins:     number;
    activeRateLimits: number;
  };
  recentEvents: {
    id: string; type: string; ip: string | null; email: string | null;
    route: string | null; createdAt: string;
  }[];
  lockedAccounts: {
    id: string; email: string | null; name: string | null;
    lockedUntil: string | null; loginFailures: number;
  }[];
  failedLogins: {
    id: string; email: string; ip: string | null;
    failureReason: string | null; createdAt: string;
  }[];
  rateLimitedIps: { ip: string | null; count: number }[];
  activeRateLimits: { key: string; hits: number; expiresAt: string; blocked: boolean }[];
  loginFailuresByEmail: { email: string; count: number }[];
  eventCounts: { type: string; count: number }[];
  checkedAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const EVENT_COLORS: Record<string, string> = {
  RATE_LIMIT_HIT:         "#F87171",
  LOGIN_FAILED:           "#FBBF24",
  ACCOUNT_LOCKED:         "#F97316",
  ACCOUNT_UNLOCKED:       "#4ADE80",
  LOGIN_SUCCESS:          "#34D399",
  SUSPICIOUS_REQUEST:     "#C084FC",
  PASSWORD_RESET_REQUEST: "#60A5FA",
  REGISTRATION:           "#A3E635",
};

function EventBadge({ type }: { type: string }) {
  const color = EVENT_COLORS[type] ?? "#9CA3AF";
  return (
    <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ background: `${color}18`, color }}>
      {type.replace(/_/g, " ")}
    </span>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

const CARD = "rounded-2xl border p-5";
const CARD_DARK = { background: "#111", borderColor: "rgba(255,255,255,0.06)" };

// ── Page ───────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [window24h, setWindow24h] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const since = window24h
        ? new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        : new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const res = await fetch(`/api/admin/security?since=${since}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [window24h]);

  useEffect(() => { refresh(); }, [refresh]);

  async function doAction(payload: Record<string, string>) {
    setActing(JSON.stringify(payload));
    try {
      await fetch("/api/admin/security", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      await refresh();
    } finally {
      setActing(null);
    }
  }

  const s = data?.summary;

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Security Dashboard
          </h1>
          <p className="text-white/40 text-[13px]">
            {data ? `Last checked ${timeAgo(data.checkedAt)} · ${window24h ? "Last 24 hours" : "Last 7 days"}` : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWindow24h(v => !v)}
            className="h-9 px-3 rounded-xl text-[12px] font-bold border transition-all"
            style={{ background: "transparent", color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.1)" }}>
            {window24h ? "24h" : "7d"}
          </button>
          <button onClick={refresh} disabled={loading}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold disabled:opacity-50 transition-all"
            style={{ background: "#E8FF47", color: "#0D0D0D" }}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Rate Limit Hits",    value: s?.rateLimitHits,    icon: Ban,         color: "#F87171" },
          { label: "Failed Logins",      value: s?.failedLogins,     icon: XCircle,     color: "#FBBF24" },
          { label: "Locked Accounts",    value: s?.lockedAccounts,   icon: Lock,        color: "#F97316" },
          { label: "Active Limits",      value: s?.activeRateLimits, icon: Activity,    color: "#60A5FA" },
          { label: "Window",             value: s ? `${s.windowHours}h` : "—", icon: Clock, color: "#A3E635" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`${CARD} flex flex-col gap-2`} style={CARD_DARK}>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0" style={{ color }} />
              <p className="text-[11px] font-semibold text-white/40 truncate">{label}</p>
            </div>
            <p className="font-black text-[28px] leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: value ? color : "rgba(255,255,255,0.3)" }}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : value ?? 0}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Locked Accounts */}
        <div className={CARD} style={CARD_DARK}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-orange-400" />
              <p className="text-white font-bold text-[14px]">Locked Accounts</p>
            </div>
            <span className="text-[11px] font-bold rounded-full px-2 py-0.5"
              style={{ background: "rgba(249,115,22,0.12)", color: "#F97316" }}>
              {data?.lockedAccounts.length ?? 0} active
            </span>
          </div>
          {!data?.lockedAccounts.length ? (
            <div className="flex items-center gap-2 text-white/30 text-[13px]">
              <CheckCircle2 className="h-4 w-4 text-green-400" /> No locked accounts
            </div>
          ) : (
            <div className="space-y-2">
              {data.lockedAccounts.map(acc => (
                <div key={acc.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white truncate">{acc.email}</p>
                    <p className="text-[11px] text-white/40">
                      {acc.loginFailures} failures · locked until {acc.lockedUntil ? new Date(acc.lockedUntil).toLocaleTimeString() : "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => doAction({ action: "unlock_account", email: acc.email ?? "" })}
                    disabled={acting !== null}
                    className="shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-bold transition-all"
                    style={{ background: "#E8FF47", color: "#0D0D0D" }}>
                    <Unlock className="h-3 w-3" /> Unlock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top offender IPs */}
        <div className={CARD} style={CARD_DARK}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-red-400" />
              <p className="text-white font-bold text-[14px]">Top Rate-Limited IPs</p>
            </div>
            <button
              onClick={() => doAction({ action: "clear_rate_limits" })}
              disabled={acting !== null}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-bold transition-all border"
              style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
              <Trash2 className="h-3 w-3" /> Clear Expired
            </button>
          </div>
          {!data?.rateLimitedIps.length ? (
            <div className="flex items-center gap-2 text-white/30 text-[13px]">
              <CheckCircle2 className="h-4 w-4 text-green-400" /> No rate-limited IPs
            </div>
          ) : (
            <div className="space-y-1.5">
              {data.rateLimitedIps.slice(0, 10).map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2"
                  style={{ background: "#1A1A1A" }}>
                  <div className="w-5 text-center text-[11px] font-bold text-white/30">{i + 1}</div>
                  <p className="flex-1 font-mono text-[12px] text-white/80">{item.ip ?? "unknown"}</p>
                  <span className="text-[12px] font-black text-[#F87171]">{item.count}×</span>
                  <button
                    onClick={() => doAction({ action: "unblock_ip", ip: item.ip ?? "" })}
                    disabled={acting !== null}
                    className="h-6 w-6 flex items-center justify-center rounded-lg transition-all hover:bg-white/10"
                    title="Clear rate limit for this IP">
                    <XCircle className="h-3.5 w-3.5 text-white/30 hover:text-white/70" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Failed logins by email */}
        <div className={CARD} style={CARD_DARK}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-yellow-400" />
            <p className="text-white font-bold text-[14px]">Failed Logins by Email</p>
          </div>
          {!data?.loginFailuresByEmail.length ? (
            <div className="flex items-center gap-2 text-white/30 text-[13px]">
              <CheckCircle2 className="h-4 w-4 text-green-400" /> No failed logins
            </div>
          ) : (
            <div className="space-y-1.5">
              {data.loginFailuresByEmail.map((row, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: "#1A1A1A" }}>
                  <div className="w-5 text-center text-[11px] font-bold text-white/30">{i + 1}</div>
                  <p className="flex-1 text-[12px] text-white/80 truncate">{row.email}</p>
                  <span className="text-[12px] font-black text-[#FBBF24]">{row.count}×</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Event type breakdown */}
        <div className={CARD} style={CARD_DARK}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-purple-400" />
            <p className="text-white font-bold text-[14px]">Event Breakdown</p>
          </div>
          {!data?.eventCounts.length ? (
            <p className="text-white/30 text-[13px]">No events in window</p>
          ) : (
            <div className="space-y-2">
              {data.eventCounts.map(row => {
                const max = data.eventCounts[0].count;
                const pct = Math.max(4, Math.round((row.count / max) * 100));
                const color = EVENT_COLORS[row.type] ?? "#9CA3AF";
                return (
                  <div key={row.type} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <EventBadge type={row.type} />
                      <span className="text-[12px] font-bold" style={{ color }}>{row.count}</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent events feed */}
      <div className={`${CARD} mt-4`} style={CARD_DARK}>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-blue-400" />
          <p className="text-white font-bold text-[14px]">Recent Security Events</p>
          <span className="text-[11px] text-white/30 ml-auto">Latest 100 events in window</span>
        </div>
        {!data?.recentEvents.length ? (
          <p className="text-white/30 text-[13px]">No events in selected window</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {data.recentEvents.slice(0, 30).map(ev => (
              <div key={ev.id} className="flex items-start gap-3 py-2.5">
                <div className="shrink-0 mt-0.5">
                  {ev.type.includes("FAILED") || ev.type === "RATE_LIMIT_HIT"
                    ? <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
                    : ev.type.includes("LOCKED")
                    ? <Lock className="h-3.5 w-3.5 text-orange-400" />
                    : <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <EventBadge type={ev.type} />
                    {ev.email && <span className="text-[11px] text-white/50 font-mono">{ev.email}</span>}
                    {ev.ip && <span className="text-[11px] text-white/30 font-mono">{ev.ip}</span>}
                    {ev.route && <span className="text-[10px] text-white/20 font-mono">{ev.route}</span>}
                  </div>
                </div>
                <span className="shrink-0 text-[10px] text-white/25">{timeAgo(ev.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
