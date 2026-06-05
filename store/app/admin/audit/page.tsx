"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen, Search, Download, RefreshCw, Filter,
  Loader2, ChevronLeft, ChevronRight, Shield, Globe,
  Monitor, Clock, User, Activity, AlertTriangle,
  CheckCircle2, LogIn, LogOut, Package, ShoppingBag,
  Settings, Trash2, Edit2, Plus,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface AuditLog {
  id:           string;
  action:       string;
  resourceType: string | null;
  resourceId:   string | null;
  resourceName: string | null;
  ipAddress:    string | null;
  userAgent:    string | null;
  createdAt:    string;
  admin: {
    adminRole: string;
    user: { id: string; name: string | null; email: string | null; image: string | null } | null;
  };
}

interface LoginAttempt {
  id:           string;
  email:        string;
  ip:           string | null;
  success:      boolean;
  failureReason: string | null;
  createdAt:    string;
}

// ── Action metadata ──────────────────────────────────────────────────────────

const ACTION_META: Record<string, { color: string; icon: typeof Activity }> = {
  LOGIN:            { color: "#4ADE80", icon: LogIn          },
  LOGOUT:           { color: "#9CA3AF", icon: LogOut         },
  LOGIN_FAILED:     { color: "#F87171", icon: AlertTriangle  },
  ACCOUNT_LOCKED:   { color: "#F97316", icon: AlertTriangle  },
  ACCOUNT_UNLOCKED: { color: "#34D399", icon: CheckCircle2   },
  ADMIN_CREATED:    { color: "#60A5FA", icon: Plus           },
  ADMIN_UPDATED:    { color: "#FBBF24", icon: Edit2          },
  ADMIN_DISABLED:   { color: "#F87171", icon: Trash2         },
  ADMIN_ENABLED:    { color: "#4ADE80", icon: CheckCircle2   },
  PRODUCT_CREATED:  { color: "#60A5FA", icon: Package        },
  PRODUCT_UPDATED:  { color: "#FBBF24", icon: Package        },
  PRODUCT_DELETED:  { color: "#F87171", icon: Package        },
  ORDER_STATUS_CHANGED: { color: "#A78BFA", icon: ShoppingBag },
  ORDER_REFUNDED:   { color: "#F87171", icon: ShoppingBag    },
  SESSION_REVOKED:  { color: "#F97316", icon: Shield         },
  FORCE_LOGOUT:     { color: "#F97316", icon: LogOut         },
  SETTINGS_UPDATED: { color: "#FBBF24", icon: Settings       },
};

function getActionMeta(action: string) {
  return ACTION_META[action] ?? { color: "#6B7280", icon: Activity };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000); if (d > 0) return `${d}d ago`;
  const h = Math.floor(diff / 3600000);  if (h > 0) return `${h}h ago`;
  const m = Math.floor(diff / 60000);    return `${m}m ago`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function parseUA(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (/mobile/i.test(ua)) return "Mobile";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/edge/i.test(ua)) return "Edge";
  return "Browser";
}

const CARD = "rounded-2xl border p-5";
const CD   = { background: "#111", borderColor: "rgba(255,255,255,0.06)" };

const ACTION_OPTIONS = [
  "LOGIN", "LOGOUT", "LOGIN_FAILED", "ACCOUNT_LOCKED",
  "ADMIN_CREATED", "ADMIN_UPDATED", "ADMIN_DISABLED", "ADMIN_ENABLED",
  "PRODUCT_CREATED", "PRODUCT_UPDATED", "PRODUCT_DELETED",
  "ORDER_STATUS_CHANGED", "ORDER_REFUNDED",
  "SETTINGS_UPDATED", "SESSION_REVOKED", "FORCE_LOGOUT",
  "SUPPLIER_APPROVED", "SUPPLIER_SUSPENDED", "PAYOUT_PROCESSED",
  "PERMISSION_CHANGED", "OTHER",
];

const RESOURCE_OPTIONS = [
  "admin", "product", "order", "return", "supplier",
  "payout", "setting", "session", "content", "coupon",
];

// ── Tab ──────────────────────────────────────────────────────────────────────

type Tab = "actions" | "login_history";

// ── Login History Tab ────────────────────────────────────────────────────────

function LoginHistoryTab() {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [total,    setTotal]    = useState(0);
  const [stats,    setStats]    = useState<{ last24hFailed: number; last24hSuccess: number } | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [filters,  setFilters]  = useState({ email: "", ip: "", success: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (filters.email)   params.set("email",   filters.email);
      if (filters.ip)      params.set("ip",       filters.ip);
      if (filters.success) params.set("success",  filters.success);
      const res = await fetch(`/api/admin/audit/login-history?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAttempts(data.attempts);
        setTotal(data.total);
        setStats(data.stats);
      }
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.max(1, Math.ceil(total / 50));

  async function exportCsv() {
    const params = new URLSearchParams({ export: "csv" });
    if (filters.email)   params.set("email",   filters.email);
    if (filters.ip)      params.set("ip",       filters.ip);
    if (filters.success) params.set("success",  filters.success);
    window.open(`/api/admin/audit/login-history?${params}`, "_blank");
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Failed (24h)",  value: stats?.last24hFailed,  color: "#F87171" },
          { label: "Success (24h)", value: stats?.last24hSuccess, color: "#4ADE80" },
          { label: "Total shown",   value: total,                 color: "#60A5FA" },
          { label: "Page",          value: `${page} / ${pages}`,  color: "#9CA3AF" },
        ].map(({ label, value, color }) => (
          <div key={label} className={CARD} style={CD}>
            <p className="text-[11px] font-bold text-white/40 mb-1">{label}</p>
            <p className="font-black text-[24px] leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>
              {value ?? "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {[
          { ph: "Filter by email…", key: "email" },
          { ph: "Filter by IP…",    key: "ip"    },
        ].map(({ ph, key }) => (
          <input
            key={key}
            value={filters[key as keyof typeof filters]}
            onChange={e => { setFilters(f => ({ ...f, [key]: e.target.value })); setPage(1); }}
            placeholder={ph}
            className="h-9 px-3 rounded-xl text-[12px] text-white outline-none"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        ))}
        <select
          value={filters.success}
          onChange={e => { setFilters(f => ({ ...f, success: e.target.value })); setPage(1); }}
          className="h-9 px-3 rounded-xl text-[12px] text-white outline-none"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <option value="">All attempts</option>
          <option value="false">Failed only</option>
          <option value="true">Successful only</option>
        </select>
        <button onClick={exportCsv}
          className="ml-auto h-9 px-3 rounded-xl text-[12px] font-bold flex items-center gap-1.5 border transition-all hover:bg-white/5"
          style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className={CARD} style={CD}>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
        ) : attempts.length === 0 ? (
          <p className="text-center text-white/30 py-10">No login attempts found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  {["Email", "IP", "Status", "Reason", "Device", "Time"].map(h => (
                    <th key={h} className="pb-2 text-left text-[10px] font-bold text-white/30 uppercase tracking-widest pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {attempts.map(a => (
                  <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-white/70 max-w-[180px] truncate">{a.email}</td>
                    <td className="py-2.5 pr-4 font-mono text-white/40">{a.ip ?? "—"}</td>
                    <td className="py-2.5 pr-4">
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          background: a.success ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
                          color:      a.success ? "#4ADE80" : "#F87171",
                        }}>
                        {a.success ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
                        {a.success ? "Success" : "Failed"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-white/40">{a.failureReason?.replace(/_/g, " ") ?? "—"}</td>
                    <td className="py-2.5 pr-4 text-white/30">{parseUA(null)}</td>
                    <td className="py-2.5 text-white/30 whitespace-nowrap">{timeAgo(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="h-8 w-8 flex items-center justify-center rounded-xl border disabled:opacity-40 hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <ChevronLeft className="h-4 w-4 text-white/50" />
          </button>
          <span className="text-white/40 text-[12px]">{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
            className="h-8 w-8 flex items-center justify-center rounded-xl border disabled:opacity-40 hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <ChevronRight className="h-4 w-4 text-white/50" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Action History Tab ────────────────────────────────────────────────────────

function ActionHistoryTab() {
  const [logs,      setLogs]      = useState<AuditLog[]>([]);
  const [total,     setTotal]     = useState(0);
  const [breakdown, setBreakdown] = useState<{ action: string; count: number }[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [filters,   setFilters]   = useState({
    q: "", action: "", resource: "", adminId: "", ip: "",
    since: "", until: "",
  });
  const [expanded, setExpanded]   = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (filters.q)       params.set("q",        filters.q);
      if (filters.action)  params.set("action",   filters.action);
      if (filters.resource)params.set("resource", filters.resource);
      if (filters.adminId) params.set("adminId",  filters.adminId);
      if (filters.ip)      params.set("ip",        filters.ip);
      if (filters.since)   params.set("since",    new Date(filters.since).toISOString());
      if (filters.until)   params.set("until",    new Date(filters.until + "T23:59:59").toISOString());
      const res = await fetch(`/api/admin/audit?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
        setBreakdown(data.actionBreakdown ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(load, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / 50));

  async function exportCsv() {
    const params = new URLSearchParams({ export: "csv" });
    if (filters.action)   params.set("action",   filters.action);
    if (filters.resource) params.set("resource", filters.resource);
    if (filters.adminId)  params.set("adminId",  filters.adminId);
    window.open(`/api/admin/audit?${params}`, "_blank");
  }

  return (
    <div>
      {/* Action breakdown mini-chart */}
      {breakdown.length > 0 && (
        <div className={`${CARD} mb-4`} style={CD}>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-white/40" />
            <p className="text-[12px] font-bold text-white/60">Action Breakdown</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {breakdown.slice(0, 12).map(r => {
              const m = getActionMeta(r.action);
              return (
                <button
                  key={r.action}
                  onClick={() => setFilters(f => ({ ...f, action: f.action === r.action ? "" : r.action }))}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all"
                  style={{
                    background:  filters.action === r.action ? `${m.color}22` : "rgba(255,255,255,0.04)",
                    color:       filters.action === r.action ? m.color : "rgba(255,255,255,0.5)",
                    border:      `1px solid ${filters.action === r.action ? `${m.color}44` : "rgba(255,255,255,0.06)"}`,
                  }}>
                  {r.action.replace(/_/g, " ")}
                  <span className="font-black" style={{ color: m.color }}>{r.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input
            value={filters.q}
            onChange={e => { setFilters(f => ({ ...f, q: e.target.value })); setPage(1); }}
            placeholder="Search resource name…"
            className="w-full h-9 pl-8 pr-3 rounded-xl text-[12px] text-white outline-none"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>
        <select
          value={filters.action}
          onChange={e => { setFilters(f => ({ ...f, action: e.target.value })); setPage(1); }}
          className="h-9 px-3 rounded-xl text-[12px] text-white outline-none"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <option value="">All actions</option>
          {ACTION_OPTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
        </select>
        <select
          value={filters.resource}
          onChange={e => { setFilters(f => ({ ...f, resource: e.target.value })); setPage(1); }}
          className="h-9 px-3 rounded-xl text-[12px] text-white outline-none"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <option value="">All resources</option>
          {RESOURCE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <input
          type="date"
          value={filters.since}
          onChange={e => { setFilters(f => ({ ...f, since: e.target.value })); setPage(1); }}
          className="h-9 px-3 rounded-xl text-[12px] text-white outline-none"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
        />
        <input
          type="date"
          value={filters.until}
          onChange={e => { setFilters(f => ({ ...f, until: e.target.value })); setPage(1); }}
          className="h-9 px-3 rounded-xl text-[12px] text-white outline-none"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
        />
        <button onClick={exportCsv}
          className="h-9 px-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 border transition-all hover:bg-white/5"
          style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {/* Log list */}
      <div className={CARD} style={CD}>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-white/40" />
          <p className="text-[13px] font-bold text-white/70">{total.toLocaleString()} events</p>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/30 ml-auto" />}
        </div>

        {logs.length === 0 && !loading ? (
          <p className="text-center text-white/30 py-10">No audit logs found</p>
        ) : (
          <div className="space-y-1">
            {logs.map(log => {
              const m        = getActionMeta(log.action);
              const isOpen   = expanded === log.id;
              return (
                <div key={log.id}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : log.id)}
                    className="w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
                  >
                    {/* Action icon */}
                    <div className="mt-0.5 h-6 w-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${m.color}18` }}>
                      <m.icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold rounded-full px-2 py-0.5"
                          style={{ background: `${m.color}18`, color: m.color }}>
                          {log.action.replace(/_/g, " ")}
                        </span>
                        {log.resourceName && (
                          <span className="text-[12px] text-white/70 truncate max-w-[200px]">{log.resourceName}</span>
                        )}
                        {log.resourceType && (
                          <span className="text-[10px] text-white/30 font-mono">{log.resourceType}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-white/30">
                        {log.admin.user && (
                          <span className="flex items-center gap-1">
                            <User className="h-2.5 w-2.5" />
                            {log.admin.user.name ?? log.admin.user.email}
                          </span>
                        )}
                        {log.ipAddress && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-2.5 w-2.5" /> {log.ipAddress}
                          </span>
                        )}
                        {log.userAgent && (
                          <span className="flex items-center gap-1">
                            <Monitor className="h-2.5 w-2.5" /> {parseUA(log.userAgent)}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="shrink-0 text-[10px] text-white/25 mt-1">{timeAgo(log.createdAt)}</span>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="mx-3 mb-2 rounded-xl p-3 text-[11px]"
                      style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-white/50">
                        <div><span className="text-white/25">ID:</span> <span className="font-mono">{log.id}</span></div>
                        <div><span className="text-white/25">Time:</span> {formatDate(log.createdAt)}</div>
                        <div><span className="text-white/25">Resource ID:</span> <span className="font-mono">{log.resourceId ?? "—"}</span></div>
                        <div><span className="text-white/25">IP:</span> {log.ipAddress ?? "—"}</div>
                        <div className="col-span-2"><span className="text-white/25">User Agent:</span> {log.userAgent ?? "—"}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="h-8 w-8 flex items-center justify-center rounded-xl border disabled:opacity-40 hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <ChevronLeft className="h-4 w-4 text-white/50" />
          </button>
          <span className="text-white/40 text-[12px]">{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
            className="h-8 w-8 flex items-center justify-center rounded-xl border disabled:opacity-40 hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <ChevronRight className="h-4 w-4 text-white/50" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [tab, setTab] = useState<Tab>("actions");

  const tabs: { key: Tab; label: string; icon: typeof Activity }[] = [
    { key: "actions",       label: "Action History",  icon: BookOpen },
    { key: "login_history", label: "Login History",   icon: LogIn    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Audit Center
          </h1>
          <p className="text-white/40 text-[13px]">
            Complete immutable record of every admin action, login attempt, and security event
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-bold transition-all"
            style={{
              background: tab === t.key ? "#1E1E1E" : "transparent",
              color:      tab === t.key ? "#fff" : "rgba(255,255,255,0.4)",
              border:     tab === t.key ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
            }}>
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "actions"       && <ActionHistoryTab />}
      {tab === "login_history" && <LoginHistoryTab />}
    </div>
  );
}
