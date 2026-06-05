"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, RefreshCw, Search, ChevronLeft, ChevronRight, X, CheckCircle, AlertTriangle } from "lucide-react";

interface Assessment {
  id: string; orderId: string; riskScore: number; riskLevel: string;
  flags: string[]; isHighValue: boolean; velocityFlag: boolean;
  requiresReview: boolean; reviewedBy: string | null; reviewNote: string | null;
  createdAt: string;
  order: { id: string; orderNumber: string; total: number; status: string; paymentMethod: string; createdAt: string; userId: string; user: { name: string | null; email: string } | null } | null;
}

const RISK_COLOR: Record<string, string> = { LOW: "#4ADE80", MEDIUM: "#F5C518", HIGH: "#FB923C", CRITICAL: "#F87171" };
const FLAG_LABEL: Record<string, string> = {
  HIGH_VALUE_ORDER: "High Value", COD_HIGH_VALUE: "COD High ₹", IP_VELOCITY: "IP Velocity",
  ORDER_VELOCITY: "Order Velocity", BLACKLISTED_EMAIL: "BL Email", BLACKLISTED_PHONE: "BL Phone",
  BLACKLISTED_CUSTOMER: "BL Customer", HIGH_RISK_CUSTOMER: "High Risk Customer",
};

export default function OrderRiskPage() {
  const [items, setItems] = useState<Assessment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [riskLevel, setRiskLevel] = useState("");
  const [requiresReview, setRequiresReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Assessment | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const limit = 20;
  const pages = Math.ceil(total / limit);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (riskLevel) params.set("riskLevel", riskLevel);
    if (requiresReview) params.set("requiresReview", requiresReview);
    const r = await fetch(`/api/admin/fraud/orders?${params}`);
    const json = await r.json();
    setItems(json.assessments ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page, riskLevel, requiresReview]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (orderId: string, action: string) => {
    setSaving(true);
    await fetch("/api/admin/fraud/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action, reviewNote }),
    });
    setSaving(false);
    setSelected(null);
    load();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Package className="w-6 h-6" style={{ color: "#E8FF47" }} /> Order Risk Detection
        </h1>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#E8FF47", color: "#0A0A0A" }}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={riskLevel} onChange={e => { setRiskLevel(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg text-sm text-white outline-none" style={{ background: "#111111" }}>
          <option value="">All Levels</option>
          {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={requiresReview} onChange={e => { setRequiresReview(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg text-sm text-white outline-none" style={{ background: "#111111" }}>
          <option value="">All Orders</option>
          <option value="true">Needs Review</option>
          <option value="false">Reviewed</option>
        </select>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "#111111" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #1A1A1A" }}>
              {["Order", "Customer", "Risk", "Flags", "Review Status", "Date", "Action"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12"><RefreshCw className="w-5 h-5 animate-spin mx-auto" style={{ color: "#E8FF47" }} /></td></tr>
            ) : items.map(item => (
              <tr key={item.id} className="cursor-pointer hover:bg-white/5" style={{ borderBottom: "1px solid #1A1A1A" }} onClick={() => setSelected(item)}>
                <td className="px-4 py-3">
                  <p className="text-white font-medium">#{item.order?.orderNumber ?? "—"}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>₹{Number(item.order?.total ?? 0).toLocaleString("en-IN")}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-white">{item.order?.user?.name ?? "—"}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{item.order?.user?.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-lg font-bold" style={{ color: RISK_COLOR[item.riskLevel] }}>{item.riskScore}</span>
                  <span className="block text-xs" style={{ color: RISK_COLOR[item.riskLevel] }}>{item.riskLevel}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {item.flags.slice(0, 2).map(f => (
                      <span key={f} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#FB923C22", color: "#FB923C" }}>{FLAG_LABEL[f] ?? f}</span>
                    ))}
                    {item.flags.length > 2 && <span className="text-xs" style={{ color: "#9CA3AF" }}>+{item.flags.length - 2}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {item.requiresReview && !item.reviewedBy
                    ? <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "#F5C51822", color: "#F5C518" }}>Needs Review</span>
                    : item.reviewedBy
                    ? <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "#4ADE8022", color: "#4ADE80" }}>Reviewed</span>
                    : <span className="text-xs" style={{ color: "#9CA3AF" }}>—</span>
                  }
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>{new Date(item.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">
                  <button onClick={e => { e.stopPropagation(); setSelected(item); }} className="text-xs px-3 py-1 rounded-lg" style={{ background: "#E8FF4722", color: "#E8FF47" }}>Review</button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: "#9CA3AF" }}>No flagged orders</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "#9CA3AF" }}>Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg disabled:opacity-30" style={{ background: "#111111" }}><ChevronLeft className="w-4 h-4 text-white" /></button>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg disabled:opacity-30" style={{ background: "#111111" }}><ChevronRight className="w-4 h-4 text-white" /></button>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl p-6 w-full max-w-lg space-y-4" style={{ background: "#111111" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Order #{selected.order?.orderNumber}</h2>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5" style={{ color: "#9CA3AF" }} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg p-3" style={{ background: "#0D0D0D" }}>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Risk Score</p>
                <p className="font-bold text-xl" style={{ color: RISK_COLOR[selected.riskLevel] }}>{selected.riskScore} — {selected.riskLevel}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: "#0D0D0D" }}>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Order Value</p>
                <p className="font-bold text-white">₹{Number(selected.order?.total ?? 0).toLocaleString("en-IN")}</p>
              </div>
            </div>
            <div>
              <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>Triggered Flags</p>
              <div className="flex flex-wrap gap-2">
                {selected.flags.map(f => (
                  <span key={f} className="text-xs px-2 py-1 rounded" style={{ background: "#FB923C22", color: "#FB923C" }}>{FLAG_LABEL[f] ?? f}</span>
                ))}
              </div>
            </div>
            <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={2} placeholder="Review note…" className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none" style={{ background: "#0D0D0D" }} />
            <div className="flex gap-2">
              <button disabled={saving} onClick={() => doAction(selected.orderId, "clear")} className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm" style={{ background: "#4ADE8022", color: "#4ADE80" }}>
                <CheckCircle className="w-3 h-3" /> Clear
              </button>
              <button disabled={saving} onClick={() => doAction(selected.orderId, "flag_review")} className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm" style={{ background: "#F5C51822", color: "#F5C518" }}>
                <AlertTriangle className="w-3 h-3" /> Escalate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
