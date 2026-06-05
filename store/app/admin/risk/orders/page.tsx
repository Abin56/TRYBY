"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag, RefreshCw, Loader2, AlertTriangle, CheckCircle2,
  ChevronLeft, ChevronRight, XCircle, Eye,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface OrderAssessment {
  id:              string;
  orderId:         string;
  riskScore:       number;
  riskLevel:       string;
  flags:           string[];
  ipAddress:       string | null;
  sameIpOrderCount:number;
  isHighValue:     boolean;
  velocityFlag:    boolean;
  requiresReview:  boolean;
  reviewedBy:      string | null;
  reviewedAt:      string | null;
  reviewNote:      string | null;
  createdAt:       string;
  order: {
    orderNumber: string; total: number; status: string; createdAt: string;
    user:    { name: string | null; email: string | null } | null;
    payment: { method: string; status: string } | null;
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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000); if (d > 0) return `${d}d ago`;
  const h = Math.floor(diff / 3600000);  if (h > 0) return `${h}h ago`;
  const m = Math.floor(diff / 60000);    return `${m}m ago`;
}

const FLAG_COLORS: Record<string, string> = {
  HIGH_VALUE:            "#F87171",
  COD_HIGH_VALUE:        "#F97316",
  IP_VELOCITY_HIGH:      "#C084FC",
  IP_VELOCITY_MEDIUM:    "#A78BFA",
  BLACKLISTED_IP:        "#F87171",
  BLACKLISTED_EMAIL:     "#F87171",
  BLACKLISTED_PHONE:     "#F87171",
  BLACKLISTED_CUSTOMER:  "#F87171",
  CRITICAL_CUSTOMER:     "#F87171",
  HIGH_RISK_CUSTOMER:    "#F97316",
  COD_BLOCKED_CUSTOMER:  "#FBBF24",
};

// ── Review Modal ──────────────────────────────────────────────────────────────

function ReviewModal({
  assessment, onClose, onDone,
}: {
  assessment: OrderAssessment;
  onClose:    () => void;
  onDone:     () => void;
}) {
  const [note,  setNote]  = useState(assessment.reviewNote ?? "");
  const [saving,setSaving]= useState(false);

  async function submit(action: "clear" | "flag") {
    setSaving(true);
    await fetch("/api/admin/fraud/orders", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ orderId: assessment.orderId, action, reviewNote: note }),
    });
    setSaving(false);
    onDone();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-2xl border"
        style={{ background: "#111", borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-[16px]">Review Order {assessment.order?.orderNumber}</p>
              <p className="text-white/40 text-[12px] mt-0.5">
                {assessment.order?.user?.name ?? assessment.order?.user?.email} · ₹{Number(assessment.order?.total ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
            <RiskBadge level={assessment.riskLevel} />
          </div>
        </div>
        <div className="p-5 space-y-4">
          {/* Flags */}
          <div>
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">Risk Flags</p>
            <div className="flex flex-wrap gap-1.5">
              {assessment.flags.map(f => (
                <span key={f} className="text-[10px] font-bold rounded-full px-2.5 py-1"
                  style={{ background: `${FLAG_COLORS[f] ?? "#9CA3AF"}18`, color: FLAG_COLORS[f] ?? "#9CA3AF" }}>
                  {f.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>

          {/* Meta */}
          {assessment.ipAddress && (
            <p className="text-[12px] text-white/50">IP: <span className="font-mono text-white/70">{assessment.ipAddress}</span>
              {assessment.sameIpOrderCount > 1 && <span className="text-orange-400 ml-2">· {assessment.sameIpOrderCount} orders same IP</span>}
            </p>
          )}

          {/* Note */}
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Review Note</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-xl px-3 py-2 text-[13px] text-white outline-none resize-none"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}
              placeholder="Add a note…"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 h-10 rounded-xl text-[13px] font-bold border transition-all hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
              Cancel
            </button>
            <button onClick={() => submit("clear")} disabled={saving}
              className="flex-1 h-10 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.25)" }}>
              <CheckCircle2 className="h-4 w-4" /> Clear
            </button>
            <button onClick={() => submit("flag")} disabled={saving}
              className="flex-1 h-10 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: "rgba(248,113,113,0.12)", color: "#F87171", border: "1px solid rgba(248,113,113,0.25)" }}>
              <AlertTriangle className="h-4 w-4" /> Flag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OrderRiskPage() {
  const [assessments, setAssessments] = useState<OrderAssessment[]>([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [riskFilter,  setRiskFilter]  = useState("");
  const [reviewFilter,setReviewFilter]= useState("");
  const [reviewing,   setReviewing]   = useState<OrderAssessment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: "25" });
      if (riskFilter)   p.set("riskLevel",      riskFilter);
      if (reviewFilter) p.set("requiresReview",  reviewFilter);
      const res = await fetch(`/api/admin/fraud/orders?${p}`);
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.assessments);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, riskFilter, reviewFilter]);

  useEffect(() => { load(); }, [load]);

  const pages   = Math.max(1, Math.ceil(total / 25));
  const pending = assessments.filter(a => a.requiresReview && !a.reviewedBy).length;

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Order Risk Engine
          </h1>
          <p className="text-white/40 text-[13px]">
            {total.toLocaleString()} flagged orders
            {pending > 0 && <span className="text-orange-400 font-bold"> · {pending} pending review</span>}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="h-9 w-9 flex items-center justify-center rounded-xl border hover:bg-white/5 transition-all"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <RefreshCw className={`h-4 w-4 text-white/50 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        {[
          { value: "",         label: "All Risk Levels" },
          { value: "CRITICAL", label: "Critical"        },
          { value: "HIGH",     label: "High"            },
          { value: "MEDIUM",   label: "Medium"          },
        ].map(opt => (
          <button key={opt.value}
            onClick={() => { setRiskFilter(opt.value); setPage(1); }}
            className="h-9 px-3 rounded-xl text-[12px] font-bold transition-all"
            style={{
              background: riskFilter === opt.value ? (RISK_BG[opt.value] ?? "rgba(255,255,255,0.1)") : "#1A1A1A",
              color:      riskFilter === opt.value ? (RISK_COLORS[opt.value] ?? "#fff") : "rgba(255,255,255,0.5)",
              border:     `1px solid ${riskFilter === opt.value ? (RISK_COLORS[opt.value] ?? "#fff") + "40" : "rgba(255,255,255,0.08)"}`,
            }}>
            {opt.label}
          </button>
        ))}
        <select value={reviewFilter} onChange={e => { setReviewFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-xl text-[12px] text-white outline-none ml-auto"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}>
          <option value="">All Orders</option>
          <option value="1">Needs Review</option>
          <option value="0">Reviewed</option>
        </select>
      </div>

      {/* Table */}
      <div className={CARD} style={CD}>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
        ) : assessments.length === 0 ? (
          <div className="text-center py-10 text-white/30">
            <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No flagged orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  {["Order", "Customer", "Total", "Method", "Risk Score", "Flags", "IP / Velocity", "Status", ""].map(h => (
                    <th key={h} className="pb-3 text-left text-[10px] font-bold text-white/30 uppercase tracking-widest pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {assessments.map(a => (
                  <tr key={a.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 pr-3 font-mono text-white/70">{a.order?.orderNumber ?? "—"}</td>
                    <td className="py-3 pr-3 max-w-[130px] truncate">
                      <p className="font-bold text-white/80 truncate">{a.order?.user?.name ?? "—"}</p>
                      <p className="text-white/40 truncate">{a.order?.user?.email}</p>
                    </td>
                    <td className="py-3 pr-3 font-bold text-white">₹{Number(a.order?.total ?? 0).toLocaleString("en-IN")}</td>
                    <td className="py-3 pr-3 text-white/50">{a.order?.payment?.method?.replace("RAZORPAY_", "") ?? "—"}</td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <RiskBadge level={a.riskLevel} />
                        <span className="font-black text-[14px]" style={{ color: RISK_COLORS[a.riskLevel] }}>{a.riskScore}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {a.flags.slice(0, 2).map(f => (
                          <span key={f} className="text-[9px] font-bold rounded px-1.5 py-0.5"
                            style={{ background: `${FLAG_COLORS[f] ?? "#9CA3AF"}18`, color: FLAG_COLORS[f] ?? "#9CA3AF" }}>
                            {f.replace(/_/g, " ")}
                          </span>
                        ))}
                        {a.flags.length > 2 && <span className="text-[9px] text-white/30">+{a.flags.length - 2}</span>}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      {a.ipAddress ? (
                        <div>
                          <p className="font-mono text-[10px] text-white/40">{a.ipAddress}</p>
                          {a.sameIpOrderCount > 1 && (
                            <p className="text-[10px] font-bold text-orange-400">{a.sameIpOrderCount}× same IP</p>
                          )}
                        </div>
                      ) : <span className="text-white/20">—</span>}
                    </td>
                    <td className="py-3 pr-3">
                      {a.reviewedBy ? (
                        <span className="flex items-center gap-1 text-[10px] text-green-400">
                          <CheckCircle2 className="h-3 w-3" /> Reviewed
                        </span>
                      ) : a.requiresReview ? (
                        <span className="flex items-center gap-1 text-[10px] text-orange-400">
                          <AlertTriangle className="h-3 w-3" /> Pending
                        </span>
                      ) : (
                        <span className="text-[10px] text-white/20">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => setReviewing(a)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                        title="Review">
                        <Eye className="h-3.5 w-3.5 text-white/40" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

      {reviewing && (
        <ReviewModal assessment={reviewing} onClose={() => setReviewing(null)} onDone={load} />
      )}
    </div>
  );
}
