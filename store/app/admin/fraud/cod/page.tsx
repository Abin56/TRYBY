"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldOff, RefreshCw, ChevronLeft, ChevronRight, X, Plus, Trash2, ShieldCheck } from "lucide-react";

interface CodRecord {
  userId: string; totalCodOrders: number; deliveredCount: number;
  cancelledCount: number; rtoCount: number; successRate: number;
  isBlocked: boolean; blockedAt: string | null; blockReason: string | null;
  user: { id: string; name: string | null; email: string; phone: string | null } | null;
}

interface CodRule {
  id: string; name: string; description: string | null;
  enabled: boolean; minOrders: number; maxSuccessRate: number;
  maxCancelCount: number; autoBlock: boolean;
}

export default function CodAbusePage() {
  const [records, setRecords] = useState<CodRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [rules, setRules] = useState<CodRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [newRule, setNewRule] = useState({ name: "", minOrders: 3, maxSuccessRate: 40, maxCancelCount: 5, autoBlock: true });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [kpis, setKpis] = useState<{ _avg: { successRate: number | null }; _count: { id: number }; _sum: { totalCodOrders: number | null; deliveredCount: number | null; cancelledCount: number | null } } | null>(null);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/fraud/cod?page=${page}&limit=${limit}`);
    const json = await r.json();
    setRecords(json.records ?? []);
    setTotal(json.total ?? 0);
    setRules(json.rules ?? []);
    setKpis(json.kpis);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const runSweep = async () => {
    setSweeping(true);
    const r = await fetch("/api/admin/fraud/cod", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const json = await r.json();
    setSweeping(false);
    alert(`Auto-sweep complete. ${json.blocked} customers blocked.`);
    load();
  };

  const toggleBlock = async (userId: string, isBlocked: boolean) => {
    setActionLoading(userId);
    await fetch("/api/admin/fraud/cod", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: isBlocked ? "unblock" : "block", reason: "Manual toggle" }),
    });
    setActionLoading(null);
    load();
  };

  const addRule = async () => {
    await fetch("/api/admin/fraud/cod/rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newRule) });
    setNewRule({ name: "", minOrders: 3, maxSuccessRate: 40, maxCancelCount: 5, autoBlock: true });
    load();
  };

  const deleteRule = async (id: string) => {
    await fetch("/api/admin/fraud/cod/rules", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  };

  const toggleRule = async (rule: CodRule) => {
    await fetch("/api/admin/fraud/cod/rules", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: rule.id, enabled: !rule.enabled }) });
    load();
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldOff className="w-6 h-6" style={{ color: "#E8FF47" }} /> COD Abuse Center
        </h1>
        <div className="flex gap-2">
          <button onClick={() => setShowRules(v => !v)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#111111", color: "#E8FF47" }}>Rules ({rules.length})</button>
          <button disabled={sweeping} onClick={runSweep} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#E8FF47", color: "#0A0A0A" }}>
            <RefreshCw className={`w-4 h-4 ${sweeping ? "animate-spin" : ""}`} /> Run Auto-Sweep
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total COD Orders", value: kpis._sum.totalCodOrders ?? 0 },
            { label: "Delivered", value: kpis._sum.deliveredCount ?? 0 },
            { label: "Cancelled", value: kpis._sum.cancelledCount ?? 0 },
            { label: "Avg Success %", value: `${Number(kpis._avg.successRate ?? 0).toFixed(1)}%` },
          ].map(k => (
            <div key={k.label} className="rounded-xl p-4" style={{ background: "#111111" }}>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>{k.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Rules Panel */}
      {showRules && (
        <div className="rounded-xl p-4 space-y-4" style={{ background: "#111111" }}>
          <h3 className="text-sm font-semibold text-white">Auto-Block Rules</h3>
          {rules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#0D0D0D" }}>
              <div>
                <p className="text-white font-medium text-sm">{rule.name}</p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Min {rule.minOrders} orders · Success &lt; {Number(rule.maxSuccessRate)}% · Cancel &gt; {rule.maxCancelCount}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${rule.enabled ? "text-green-400" : "text-gray-500"}`} style={{ background: rule.enabled ? "#4ADE8022" : "#ffffff11" }}>{rule.enabled ? "Active" : "Off"}</span>
                <button onClick={() => toggleRule(rule)} className="text-xs px-2 py-1 rounded" style={{ background: "#E8FF4722", color: "#E8FF47" }}>Toggle</button>
                <button onClick={() => deleteRule(rule.id)} className="p-1 rounded" style={{ color: "#F87171" }}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {/* Add Rule */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t" style={{ borderColor: "#1A1A1A" }}>
            <input value={newRule.name} onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))} placeholder="Rule name" className="px-3 py-2 rounded-lg text-sm text-white outline-none" style={{ background: "#0D0D0D" }} />
            <input type="number" value={newRule.minOrders} onChange={e => setNewRule(p => ({ ...p, minOrders: Number(e.target.value) }))} placeholder="Min orders" className="px-3 py-2 rounded-lg text-sm text-white outline-none" style={{ background: "#0D0D0D" }} />
            <input type="number" value={newRule.maxSuccessRate} onChange={e => setNewRule(p => ({ ...p, maxSuccessRate: Number(e.target.value) }))} placeholder="Max success %" className="px-3 py-2 rounded-lg text-sm text-white outline-none" style={{ background: "#0D0D0D" }} />
            <button onClick={addRule} disabled={!newRule.name} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-30" style={{ background: "#E8FF47", color: "#0A0A0A" }}>
              <Plus className="w-4 h-4" /> Add Rule
            </button>
          </div>
        </div>
      )}

      {/* Customer List */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#111111" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #1A1A1A" }}>
              {["Customer", "Total COD", "Delivered", "Cancelled", "Success %", "Status", "Action"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-12"><RefreshCw className="w-5 h-5 animate-spin mx-auto" style={{ color: "#E8FF47" }} /></td></tr>
            : records.map(r => (
              <tr key={r.userId} style={{ borderBottom: "1px solid #1A1A1A" }}>
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{r.user?.name ?? "Unknown"}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{r.user?.email}</p>
                </td>
                <td className="px-4 py-3 text-white">{r.totalCodOrders}</td>
                <td className="px-4 py-3" style={{ color: "#4ADE80" }}>{r.deliveredCount}</td>
                <td className="px-4 py-3" style={{ color: "#F87171" }}>{r.cancelledCount}</td>
                <td className="px-4 py-3">
                  <span style={{ color: Number(r.successRate) < 50 ? "#F87171" : Number(r.successRate) < 70 ? "#FB923C" : "#4ADE80" }} className="font-bold">
                    {Number(r.successRate).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium`} style={{ background: r.isBlocked ? "#F8717122" : "#4ADE8022", color: r.isBlocked ? "#F87171" : "#4ADE80" }}>
                    {r.isBlocked ? "Blocked" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button disabled={actionLoading === r.userId} onClick={() => toggleBlock(r.userId, r.isBlocked)} className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg" style={{ background: r.isBlocked ? "#4ADE8022" : "#F8717122", color: r.isBlocked ? "#4ADE80" : "#F87171" }}>
                    {r.isBlocked ? <><ShieldCheck className="w-3 h-3" /> Unblock</> : <><ShieldOff className="w-3 h-3" /> Block</>}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && records.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: "#9CA3AF" }}>No COD abuse records</td></tr>}
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
    </div>
  );
}
