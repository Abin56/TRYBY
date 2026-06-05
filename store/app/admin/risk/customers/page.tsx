"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users, Search, RefreshCw, Loader2, Ban, XCircle,
  CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight,
  MoreVertical, TrendingUp, IndianRupee, ShoppingBag,
  Shield, UserX, Download, Zap,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface RiskProfile {
  userId:              string;
  riskScore:           number;
  riskLevel:           string;
  totalOrders:         number;
  totalReturns:        number;
  totalRefunds:        number;
  totalRefundAmount:   number;
  totalCodOrders:      number;
  totalCodDelivered:   number;
  totalCodCancelled:   number;
  flaggedOrderCount:   number;
  isBlacklisted:       boolean;
  isCodBlocked:        boolean;
  multipleAccountScore:number;
  lastOrderAt:         string | null;
  lastFlaggedAt:       string | null;
  notes:               string | null;
  user: {
    id: string; name: string | null; email: string | null;
    phone: string | null; createdAt: string;
  } | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const CARD = "rounded-2xl border p-5";
const CD   = { background: "#111", borderColor: "rgba(255,255,255,0.06)" };

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "#F87171", HIGH: "#F97316", MEDIUM: "#FBBF24", LOW: "#4ADE80",
};
const RISK_BG: Record<string, string> = {
  CRITICAL: "rgba(248,113,113,0.12)", HIGH: "rgba(249,115,22,0.12)",
  MEDIUM:   "rgba(251,191,36,0.12)", LOW:  "rgba(74,222,128,0.12)",
};

function RiskBadge({ level }: { level: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black"
      style={{ background: RISK_BG[level] ?? "#111", color: RISK_COLORS[level] ?? "#9CA3AF" }}>
      {level}
    </span>
  );
}

function RiskMeter({ score }: { score: number }) {
  const color = score >= 75 ? "#F87171" : score >= 50 ? "#F97316" : score >= 25 ? "#FBBF24" : "#4ADE80";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[11px] font-black" style={{ color }}>{score}</span>
    </div>
  );
}

function timeAgo(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000); if (d > 0) return `${d}d ago`;
  const h = Math.floor(diff / 3600000);  return `${h}h ago`;
}

// ── Customer Drawer ───────────────────────────────────────────────────────────

function CustomerDrawer({
  profile, onClose, onAction,
}: {
  profile:  RiskProfile;
  onClose:  () => void;
  onAction: (userId: string, action: string) => Promise<void>;
}) {
  const [acting, setActing] = useState(false);

  async function doAction(action: string) {
    setActing(true);
    await onAction(profile.userId, action);
    setActing(false);
  }

  const codSuccessRate = profile.totalCodOrders > 0
    ? Math.round((profile.totalCodDelivered / profile.totalCodOrders) * 100)
    : 100;
  const refundRate = profile.totalOrders > 0
    ? Math.round((profile.totalRefunds / profile.totalOrders) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg h-full overflow-y-auto border-l"
        style={{ background: "#111", borderColor: "rgba(255,255,255,0.1)" }}>

        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b sticky top-0 z-10"
          style={{ background: "#111", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-bold text-[16px] truncate">
                {profile.user?.name ?? profile.user?.email ?? "Unknown"}
              </p>
              <RiskBadge level={profile.riskLevel} />
            </div>
            <p className="text-white/40 text-[12px] truncate">{profile.user?.email}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 shrink-0">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Risk score */}
          <div className={CARD} style={CD}>
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">Risk Score</p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="font-black text-[48px] leading-none"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", color: RISK_COLORS[profile.riskLevel] }}>
                  {profile.riskScore}
                </p>
                <p className="text-[11px] text-white/30">out of 100</p>
              </div>
              <div className="flex-1 space-y-2">
                {[
                  { label: "COD Cancel Rate",  value: `${100 - codSuccessRate}%`, bad: codSuccessRate < 70 },
                  { label: "Refund Rate",       value: `${refundRate}%`,          bad: refundRate > 20 },
                  { label: "Flagged Orders",    value: profile.flaggedOrderCount, bad: profile.flaggedOrderCount > 2 },
                  { label: "Multi-account",     value: profile.multipleAccountScore > 0 ? "⚠ Suspected" : "Clean", bad: profile.multipleAccountScore > 0 },
                ].map(({ label, value, bad }) => (
                  <div key={label} className="flex items-center justify-between text-[12px]">
                    <span className="text-white/50">{label}</span>
                    <span className="font-bold" style={{ color: bad ? "#F87171" : "#4ADE80" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total Orders",   value: profile.totalOrders,       icon: ShoppingBag, color: "#60A5FA" },
              { label: "Returns",        value: profile.totalReturns,      icon: TrendingUp,  color: "#FBBF24" },
              { label: "Refund Amount",  value: `₹${Math.round(profile.totalRefundAmount / 1000)}K`, icon: IndianRupee, color: "#F87171" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: "#161616" }}>
                <Icon className="h-4 w-4 mx-auto mb-1" style={{ color }} />
                <p className="font-black text-[18px] leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* COD stats */}
          <div className={CARD} style={CD}>
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">COD Performance</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Total COD",   value: profile.totalCodOrders,    color: "#60A5FA" },
                { label: "Delivered",   value: profile.totalCodDelivered, color: "#4ADE80" },
                { label: "Cancelled",   value: profile.totalCodCancelled, color: "#F87171" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="font-black text-[22px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
                  <p className="text-[10px] text-white/30">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${codSuccessRate}%`, background: codSuccessRate < 60 ? "#F87171" : "#4ADE80" }} />
              </div>
              <span className="text-[11px] font-bold" style={{ color: codSuccessRate < 60 ? "#F87171" : "#4ADE80" }}>
                {codSuccessRate}% success
              </span>
            </div>
          </div>

          {/* Status flags */}
          <div className="flex flex-wrap gap-2">
            {profile.isBlacklisted && (
              <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold"
                style={{ background: "rgba(248,113,113,0.12)", color: "#F87171", border: "1px solid rgba(248,113,113,0.25)" }}>
                <XCircle className="h-3 w-3" /> Blacklisted
              </span>
            )}
            {profile.isCodBlocked && (
              <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold"
                style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.25)" }}>
                <Ban className="h-3 w-3" /> COD Blocked
              </span>
            )}
            {profile.multipleAccountScore > 0 && (
              <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold"
                style={{ background: "rgba(192,132,252,0.12)", color: "#C084FC", border: "1px solid rgba(192,132,252,0.25)" }}>
                <Shield className="h-3 w-3" /> Multi-account suspected
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {profile.isCodBlocked ? (
                <button onClick={() => doAction("unblock_cod")} disabled={acting}
                  className="flex items-center justify-center gap-2 h-9 rounded-xl text-[12px] font-bold disabled:opacity-50 transition-all"
                  style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.25)" }}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Unblock COD
                </button>
              ) : (
                <button onClick={() => doAction("block_cod")} disabled={acting}
                  className="flex items-center justify-center gap-2 h-9 rounded-xl text-[12px] font-bold disabled:opacity-50 transition-all"
                  style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.25)" }}>
                  <Ban className="h-3.5 w-3.5" /> Block COD
                </button>
              )}
              {profile.isBlacklisted ? (
                <button onClick={() => doAction("unblacklist")} disabled={acting}
                  className="flex items-center justify-center gap-2 h-9 rounded-xl text-[12px] font-bold disabled:opacity-50 transition-all"
                  style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.25)" }}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Remove Blacklist
                </button>
              ) : (
                <button onClick={() => doAction("blacklist")} disabled={acting}
                  className="flex items-center justify-center gap-2 h-9 rounded-xl text-[12px] font-bold disabled:opacity-50 transition-all"
                  style={{ background: "rgba(248,113,113,0.12)", color: "#F87171", border: "1px solid rgba(248,113,113,0.25)" }}>
                  <XCircle className="h-3.5 w-3.5" /> Blacklist
                </button>
              )}
              <button onClick={() => onAction(profile.userId, "rescore")} disabled={acting}
                className="flex items-center justify-center gap-2 h-9 rounded-xl text-[12px] font-bold disabled:opacity-50 border transition-all hover:bg-white/5"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                <Zap className="h-3.5 w-3.5" /> Rescore
              </button>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-white/40">
            <div>Last order: {timeAgo(profile.lastOrderAt)}</div>
            <div>Last flagged: {timeAgo(profile.lastFlaggedAt)}</div>
            <div>Member since: {profile.user?.createdAt ? timeAgo(profile.user.createdAt) : "—"}</div>
            <div>Phone: {profile.user?.phone ?? "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CustomerRiskPage() {
  const [profiles, setProfiles] = useState<RiskProfile[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [riskLevel,setRiskLevel]= useState("");
  const [codFilter,setCodFilter]= useState("");
  const [selected, setSelected] = useState<RiskProfile | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: "25", sort: "riskScore_desc" });
      if (search)    p.set("search",       search);
      if (riskLevel) p.set("riskLevel",    riskLevel);
      if (codFilter === "cod") p.set("isCodBlocked",  "1");
      if (codFilter === "bl")  p.set("isBlacklisted", "1");
      const res = await fetch(`/api/admin/fraud/customers?${p}`);
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, riskLevel, codFilter]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(load, 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [load]);

  async function handleAction(userId: string, action: string) {
    if (action === "rescore") {
      await fetch(`/api/admin/fraud/customers/${userId}`, { method: "POST" });
    } else {
      await fetch("/api/admin/fraud/customers", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId, action }),
      });
    }
    await load();
    if (selected?.userId === userId) {
      const updated = await fetch(`/api/admin/fraud/customers/${userId}`).then(r => r.json());
      setSelected(s => s ? { ...s, ...updated.profile } : null);
    }
  }

  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Customer Risk Scoring
          </h1>
          <p className="text-white/40 text-[13px]">{total.toLocaleString()} risk profiles · sorted by score</p>
        </div>
        <button onClick={load} disabled={loading}
          className="h-9 w-9 flex items-center justify-center rounded-xl border hover:bg-white/5 transition-all"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <RefreshCw className={`h-4 w-4 text-white/50 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search email, name, phone…"
            className="w-full h-9 pl-8 pr-3 rounded-xl text-[12px] text-white outline-none"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>
        {[
          { value: "",         label: "All Levels"  },
          { value: "CRITICAL", label: "Critical"    },
          { value: "HIGH",     label: "High"        },
          { value: "MEDIUM",   label: "Medium"      },
          { value: "LOW",      label: "Low"         },
        ].map(opt => (
          <button key={opt.value}
            onClick={() => { setRiskLevel(opt.value); setPage(1); }}
            className="h-9 px-3 rounded-xl text-[12px] font-bold transition-all"
            style={{
              background:  riskLevel === opt.value ? (RISK_BG[opt.value] ?? "rgba(255,255,255,0.1)") : "#1A1A1A",
              color:       riskLevel === opt.value ? (RISK_COLORS[opt.value] ?? "#fff") : "rgba(255,255,255,0.5)",
              border:      `1px solid ${riskLevel === opt.value ? (RISK_COLORS[opt.value] ?? "#fff") + "40" : "rgba(255,255,255,0.08)"}`,
            }}>
            {opt.label}
          </button>
        ))}
        <select value={codFilter} onChange={e => { setCodFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-xl text-[12px] text-white outline-none"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}>
          <option value="">All Customers</option>
          <option value="cod">COD Blocked</option>
          <option value="bl">Blacklisted</option>
        </select>
      </div>

      {/* Table */}
      <div className={CARD} style={CD}>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-10 text-white/30">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No risk profiles found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  {["Customer", "Risk", "Orders", "COD Cancel", "Refund Rate", "Status", "Last Order", ""].map(h => (
                    <th key={h} className="pb-3 text-left text-[10px] font-bold text-white/30 uppercase tracking-widest pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {profiles.map(p => {
                  const codRate = p.totalCodOrders > 0 ? Math.round((p.totalCodCancelled / p.totalCodOrders) * 100) : 0;
                  const refRate = p.totalOrders > 0 ? Math.round((p.totalRefunds / p.totalOrders) * 100) : 0;
                  return (
                    <tr key={p.userId} className="hover:bg-white/[0.02] cursor-pointer" onClick={() => setSelected(p)}>
                      <td className="py-3 pr-4">
                        <p className="font-bold text-white truncate max-w-[160px]">{p.user?.name ?? "—"}</p>
                        <p className="text-white/40 truncate max-w-[160px]">{p.user?.email}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <RiskBadge level={p.riskLevel} />
                          <RiskMeter score={p.riskScore} />
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-white/70">{p.totalOrders}</td>
                      <td className="py-3 pr-4">
                        <span style={{ color: codRate > 30 ? "#F87171" : "#4ADE80" }}>{codRate}%</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span style={{ color: refRate > 20 ? "#F87171" : "#4ADE80" }}>{refRate}%</span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-1">
                          {p.isCodBlocked  && <Ban     className="h-3.5 w-3.5 text-yellow-400" aria-label="COD blocked" />}
                          {p.isBlacklisted && <XCircle className="h-3.5 w-3.5 text-red-400"    aria-label="Blacklisted"  />}
                          {!p.isCodBlocked && !p.isBlacklisted && <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-white/30">{timeAgo(p.lastOrderAt)}</td>
                      <td className="py-3">
                        <MoreVertical className="h-4 w-4 text-white/20" />
                      </td>
                    </tr>
                  );
                })}
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

      {selected && (
        <CustomerDrawer
          profile={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
