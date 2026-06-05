"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldAlert, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

interface AuditLog {
  id: string; actionType: string; performedBy: string | null;
  targetId: string | null; targetType: string | null;
  reason: string | null; createdAt: string;
}

const ACTION_LABEL: Record<string, string> = {
  FLAG_ORDER: "Order Flagged", BLOCK_COD: "COD Blocked",
  BLACKLIST_CUSTOMER: "Customer Blacklisted", CANCEL_ORDER: "Order Cancelled",
  OVERRIDE_CLEAR: "Override Cleared", OVERRIDE_FLAG: "Override Flagged",
  BLACKLIST_ADD: "Blacklist Added", BLACKLIST_REMOVE: "Blacklist Lifted",
  COD_RULE_CHANGED: "COD Rule Changed", RISK_SCORE_UPDATED: "Score Updated",
  REQUIRE_VERIFICATION: "Verification Required", MANUAL_REVIEW: "Manual Review",
};

const ACTION_COLOR: Record<string, string> = {
  FLAG_ORDER: "#F5C518", BLOCK_COD: "#FB923C", BLACKLIST_CUSTOMER: "#F87171",
  CANCEL_ORDER: "#F87171", OVERRIDE_CLEAR: "#4ADE80", OVERRIDE_FLAG: "#F5C518",
  BLACKLIST_ADD: "#F87171", BLACKLIST_REMOVE: "#4ADE80", COD_RULE_CHANGED: "#38BDF8",
  RISK_SCORE_UPDATED: "#A78BFA",
};

export default function FraudAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionType, setActionType] = useState("");
  const [targetType, setTargetType] = useState("");
  const [loading, setLoading] = useState(false);
  const limit = 30;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (actionType) params.set("actionType", actionType);
    if (targetType) params.set("targetType", targetType);
    const r = await fetch(`/api/admin/fraud/audit?${params}`);
    const json = await r.json();
    setLogs(json.logs ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page, actionType, targetType]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6" style={{ color: "#E8FF47" }} /> Fraud Audit Logs
        </h1>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#E8FF47", color: "#0A0A0A" }}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={actionType} onChange={e => { setActionType(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg text-sm text-white outline-none" style={{ background: "#111111" }}>
          <option value="">All Actions</option>
          {Object.keys(ACTION_LABEL).map(a => <option key={a} value={a}>{ACTION_LABEL[a]}</option>)}
        </select>
        <select value={targetType} onChange={e => { setTargetType(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg text-sm text-white outline-none" style={{ background: "#111111" }}>
          <option value="">All Targets</option>
          {["customer", "order", "blacklist", "cod_rule", "refund_scan"].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "#111111" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #1A1A1A" }}>
              {["Action", "Performed By", "Target", "Reason", "Date & Time"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center py-12"><RefreshCw className="w-5 h-5 animate-spin mx-auto" style={{ color: "#E8FF47" }} /></td></tr>
            : logs.map(log => (
              <tr key={log.id} style={{ borderBottom: "1px solid #1A1A1A" }}>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: `${ACTION_COLOR[log.actionType] ?? "#9CA3AF"}22`, color: ACTION_COLOR[log.actionType] ?? "#9CA3AF" }}>
                    {ACTION_LABEL[log.actionType] ?? log.actionType}
                  </span>
                </td>
                <td className="px-4 py-3 text-white text-xs">{log.performedBy ?? "system"}</td>
                <td className="px-4 py-3 text-xs">
                  {log.targetType && <span style={{ color: "#9CA3AF" }}>{log.targetType}</span>}
                  {log.targetId && <span className="text-xs font-mono text-white ml-1">·{log.targetId.slice(-6)}</span>}
                </td>
                <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: "#9CA3AF" }}>{log.reason ?? "—"}</td>
                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9CA3AF" }}>
                  {new Date(log.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            ))}
            {!loading && logs.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-sm" style={{ color: "#9CA3AF" }}>No audit logs found</td></tr>}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "#9CA3AF" }}>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg disabled:opacity-30" style={{ background: "#111111" }}><ChevronLeft className="w-4 h-4 text-white" /></button>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg disabled:opacity-30" style={{ background: "#111111" }}><ChevronRight className="w-4 h-4 text-white" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
