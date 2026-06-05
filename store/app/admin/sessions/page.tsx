"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Monitor, Globe, Clock, LogOut, RefreshCw, Loader2,
  Shield, AlertTriangle, CheckCircle2, Users, XCircle,
  Smartphone, Activity,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface AdminSession {
  id:          string;
  adminId:     string;
  userId:      string;
  sessionToken: string;
  ip:          string | null;
  userAgent:   string | null;
  deviceInfo:  string | null;
  lastSeenAt:  string;
  expiresAt:   string;
  createdAt:   string;
  revokedAt:   string | null;
  user: {
    id:    string;
    name:  string | null;
    email: string | null;
    image: string | null;
    adminProfile: { adminRole: string } | null;
  } | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

import { ROLE_LABELS, ROLE_COLORS } from "@/lib/rbac";
import { AdminRole } from "@prisma/client";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000); if (d > 0) return `${d}d ago`;
  const h = Math.floor(diff / 3600000);  if (h > 0) return `${h}h ago`;
  const m = Math.floor(diff / 60000);    if (m > 0) return `${m}m ago`;
  return "just now";
}

function formatExpiry(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function parseDevice(ua: string | null, deviceInfo: string | null): { label: string; icon: typeof Monitor } {
  const s = (deviceInfo ?? ua ?? "").toLowerCase();
  if (/mobile|android|iphone/.test(s)) return { label: "Mobile",  icon: Smartphone };
  if (/chrome|safari|firefox/.test(s)) return { label: "Browser", icon: Monitor    };
  return { label: "Desktop", icon: Monitor };
}

const CARD = "rounded-2xl border p-5";
const CD   = { background: "#111", borderColor: "rgba(255,255,255,0.06)" };

// ── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({
  session, onRevoke, acting, currentUserId,
}: {
  session:       AdminSession;
  onRevoke:      (id: string) => Promise<void>;
  acting:        string | null;
  currentUserId: string | null;
}) {
  const { label: devLabel, icon: DevIcon } = parseDevice(session.userAgent, session.deviceInfo);
  const isSelf  = session.userId === currentUserId;
  const busy    = acting === session.id;
  const role    = session.user?.adminProfile?.adminRole as AdminRole | undefined;
  const roleColors = role ? ROLE_COLORS[role] : null;

  const expiresIn = new Date(session.expiresAt).getTime() - Date.now();
  const nearExpiry = expiresIn < 2 * 3600 * 1000 && expiresIn > 0;

  return (
    <div className={CARD} style={CD}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {session.user?.image ? (
          <img src={session.user.image} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
        ) : (
          <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 font-bold text-[14px]"
            style={{ background: "#1E1E1E", color: "#E8FF47" }}>
            {(session.user?.name ?? session.user?.email ?? "?")[0].toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-bold text-[14px] truncate">
              {session.user?.name ?? session.user?.email ?? "Unknown"}
            </p>
            {isSelf && (
              <span className="text-[10px] font-bold rounded-full px-2 py-0.5"
                style={{ background: "rgba(232,255,71,0.12)", color: "#E8FF47" }}>
                YOU
              </span>
            )}
            {role && roleColors && (
              <span className="text-[10px] font-bold rounded-full px-2 py-0.5"
                style={{ background: roleColors.bg, color: roleColors.text }}>
                {ROLE_LABELS[role]}
              </span>
            )}
            {nearExpiry && (
              <span className="text-[10px] font-bold rounded-full px-2 py-0.5 flex items-center gap-1"
                style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24" }}>
                <Clock className="h-2.5 w-2.5" /> Expiring soon
              </span>
            )}
          </div>
          <p className="text-white/40 text-[12px] truncate mt-0.5">{session.user?.email}</p>
        </div>

        <button
          onClick={() => onRevoke(session.id)}
          disabled={busy || isSelf}
          title={isSelf ? "Cannot revoke your own session" : "Revoke session"}
          className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-bold border transition-all disabled:opacity-40"
          style={{ borderColor: "rgba(248,113,113,0.3)", color: "#F87171", background: "rgba(248,113,113,0.06)" }}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
          Revoke
        </button>
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-white/25" />
          <div>
            <p className="text-[10px] text-white/25">IP Address</p>
            <p className="text-[12px] font-mono text-white/60">{session.ip ?? "Unknown"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DevIcon className="h-3.5 w-3.5 text-white/25" />
          <div>
            <p className="text-[10px] text-white/25">Device</p>
            <p className="text-[12px] text-white/60">{devLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-white/25" />
          <div>
            <p className="text-[10px] text-white/25">Last Seen</p>
            <p className="text-[12px] text-white/60">{timeAgo(session.lastSeenAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-white/25" />
          <div>
            <p className="text-[10px] text-white/25">Expires</p>
            <p className="text-[12px] text-white/60" style={{ color: nearExpiry ? "#FBBF24" : undefined }}>
              {formatExpiry(session.expiresAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const [sessions,   setSessions]   = useState<AdminSession[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [acting,     setActing]     = useState<string | null>(null);
  const [bulkActing, setBulkActing] = useState(false);
  const [currentUserId] = useState<string | null>(null); // injected from session in future

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sessions?limit=50");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function revokeSession(id: string) {
    setActing(id);
    try {
      await fetch("/api/admin/sessions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "revoke_session", sessionId: id }),
      });
      await load();
    } finally {
      setActing(null);
    }
  }

  async function revokeAll() {
    if (!confirm("Revoke all admin sessions except yours? This will force everyone else to re-login.")) return;
    setBulkActing(true);
    try {
      await fetch("/api/admin/sessions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "revoke_all" }),
      });
      await load();
    } finally {
      setBulkActing(false);
    }
  }

  // Bucket by user
  const byUser = sessions.reduce<Record<string, { user: AdminSession["user"]; sessions: AdminSession[] }>>(
    (acc, s) => {
      const uid = s.userId;
      if (!acc[uid]) acc[uid] = { user: s.user, sessions: [] };
      acc[uid].sessions.push(s);
      return acc;
    },
    {}
  );

  const uniqueUsers = Object.keys(byUser).length;

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Session Management
          </h1>
          <p className="text-white/40 text-[13px]">
            {total} active {total === 1 ? "session" : "sessions"} across {uniqueUsers} {uniqueUsers === 1 ? "admin" : "admins"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="h-9 w-9 flex items-center justify-center rounded-xl border transition-all hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <RefreshCw className={`h-4 w-4 text-white/50 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={revokeAll}
            disabled={bulkActing || sessions.length === 0}
            className="h-9 px-4 rounded-xl text-[12px] font-bold flex items-center gap-2 border disabled:opacity-40 transition-all"
            style={{ borderColor: "rgba(248,113,113,0.3)", color: "#F87171", background: "rgba(248,113,113,0.06)" }}>
            {bulkActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
            Revoke All Others
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Active Sessions",  value: total,        icon: Shield,        color: "#E8FF47" },
          { label: "Unique Admins",    value: uniqueUsers,  icon: Users,         color: "#60A5FA" },
          { label: "Expiring Soon",    value: sessions.filter(s => new Date(s.expiresAt).getTime() - Date.now() < 2 * 3600 * 1000).length, icon: Clock, color: "#FBBF24" },
          { label: "Different IPs",   value: new Set(sessions.map(s => s.ip).filter(Boolean)).size, icon: Globe, color: "#4ADE80" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={CARD} style={CD}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 shrink-0" style={{ color }} />
              <p className="text-[11px] font-bold text-white/40">{label}</p>
            </div>
            <p className="font-black text-[28px] leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Sessions list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-[15px] font-semibold">No active sessions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Group by user */}
          {Object.entries(byUser).map(([uid, { user, sessions: userSessions }]) => (
            <div key={uid}>
              {uniqueUsers > 1 && (
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                    {user?.name ?? user?.email ?? "Unknown Admin"}
                  </p>
                  <span className="text-[10px] text-white/25">({userSessions.length} session{userSessions.length > 1 ? "s" : ""})</span>
                  {user?.adminProfile?.adminRole && (
                    <button
                      onClick={async () => {
                        if (!confirm(`Force logout all sessions for ${user?.email}?`)) return;
                        setBulkActing(true);
                        await fetch("/api/admin/sessions", {
                          method:  "POST",
                          headers: { "Content-Type": "application/json" },
                          body:    JSON.stringify({ action: "force_logout_user", userId: uid }),
                        });
                        await load();
                        setBulkActing(false);
                      }}
                      className="ml-auto flex items-center gap-1 h-6 px-2.5 rounded-lg text-[10px] font-bold border transition-all"
                      style={{ borderColor: "rgba(249,115,22,0.3)", color: "#F97316", background: "rgba(249,115,22,0.06)" }}>
                      <AlertTriangle className="h-2.5 w-2.5" /> Force logout
                    </button>
                  )}
                </div>
              )}
              <div className="space-y-2">
                {userSessions.map(s => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onRevoke={revokeSession}
                    acting={acting}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
