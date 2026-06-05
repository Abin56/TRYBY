"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Search, RefreshCw, Ban, ShieldOff, ShieldCheck, ChevronLeft, ChevronRight, X } from "lucide-react";

interface Profile {
  userId: string; riskScore: number; riskLevel: string;
  totalOrders: number; totalReturns: number; totalRefunds: number;
  totalRefundAmount: number; totalCodOrders: number; totalCodDelivered: number;
  totalCodCancelled: number; avgOrderValue: number; flaggedOrderCount: number;
  isBlacklisted: boolean; isCodBlocked: boolean; multipleAccountScore: number;
  notes: string | null; lastOrderAt: string | null;
  user: { id: string; name: string | null; email: string; phone: string | null; createdAt: string } | null;
}

const RISK_COLOR: Record<string, string> = { LOW: "#4ADE80", MEDIUM: "#F5C518", HIGH: "#FB923C", CRITICAL: "#F87171" };

export default function CustomerRiskPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [saving, setSaving] = useState(false);
  const limit = 20;
  const pages = Math.ceil(total / limit);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    if (riskLevel) params.set("riskLevel", riskLevel);
    const r = await fetch(`/api/admin/fraud/customers?${params}`);
    const json = await r.json();
    setProfiles(json.profiles ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page, search, riskLevel]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (userId: string, action: string) => {
    setSaving(true);
    await fetch("/api/admin/fraud/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, reason: actionNote }),
    });
    setSaving(false);
    setActionNote("");
    setSelected(null);
    load();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6" style={{ color: "#E8FF47" }} /> Customer Risk Engine
        </h1>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#E8FF47", color: "#0A0A0A" }}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-48" style={{ background: "#111111" }}>
          <Search className="w-4 h-4" style={{ color: "#9CA3AF" }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name or email…" className="bg-transparent text-white text-sm outline-none flex-1" />
        </div>
        <select value={riskLevel} onChange={e => { setRiskLevel(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg text-sm text-white outline-none" style={{ background: "#111111" }}>
          <option value="">All Levels</option>
          {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#111111" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #1A1A1A" }}>
              {["Customer", "Risk Score", "Orders", "Returns", "Refunds", "COD", "Status", "Action"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12"><RefreshCw className="w-5 h-5 animate-spin mx-auto" style={{ color: "#E8FF47" }} /></td></tr>
            ) : profiles.map(p => (
              <tr key={p.userId} className="cursor-pointer hover:bg-white/5 transition-colors" style={{ borderBottom: "1px solid #1A1A1A" }} onClick={() => setSelected(p)}>
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{p.user?.name ?? "Unknown"}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{p.user?.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold text-lg" style={{ color: RISK_COLOR[p.riskLevel] }}>{p.riskScore}</span>
                  <span className="block text-xs" style={{ color: RISK_COLOR[p.riskLevel] }}>{p.riskLevel}</span>
                </td>
                <td className="px-4 py-3 text-white">{p.totalOrders}</td>
                <td className="px-4 py-3 text-white">{p.totalReturns}</td>
                <td className="px-4 py-3">
                  <span className="text-white">{p.totalRefunds}</span>
                  <span className="block text-xs" style={{ color: "#9CA3AF" }}>₹{Number(p.totalRefundAmount).toLocaleString("en-IN")}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-white">{p.totalCodOrders} orders</span>
                  <span className="block text-xs" style={{ color: "#9CA3AF" }}>{p.totalCodDelivered}✓ {p.totalCodCancelled}✗</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {p.isBlacklisted && <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "#F8717122", color: "#F87171" }}>Blacklisted</span>}
                    {p.isCodBlocked && <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "#FB923C22", color: "#FB923C" }}>COD Blocked</span>}
                    {!p.isBlacklisted && !p.isCodBlocked && <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "#4ADE8022", color: "#4ADE80" }}>Clear</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button onClick={e => { e.stopPropagation(); setSelected(p); }} className="text-xs px-3 py-1 rounded-lg" style={{ background: "#E8FF4722", color: "#E8FF47" }}>Manage</button>
                </td>
              </tr>
            ))}
            {!loading && profiles.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-sm" style={{ color: "#9CA3AF" }}>No profiles found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "#9CA3AF" }}>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg disabled:opacity-30" style={{ background: "#111111" }}><ChevronLeft className="w-4 h-4 text-white" /></button>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg disabled:opacity-30" style={{ background: "#111111" }}><ChevronRight className="w-4 h-4 text-white" /></button>
          </div>
        </div>
      )}

      {/* Detail / Action Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl p-6 w-full max-w-lg space-y-4" style={{ background: "#111111" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{selected.user?.name ?? "Customer"}</h2>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5" style={{ color: "#9CA3AF" }} /></button>
            </div>
            <p style={{ color: "#9CA3AF" }} className="text-sm">{selected.user?.email} · {selected.user?.phone}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Risk Score", value: selected.riskScore, color: RISK_COLOR[selected.riskLevel] },
                { label: "Orders", value: selected.totalOrders, color: "#fff" },
                { label: "Refunds", value: selected.totalRefunds, color: "#fff" },
                { label: "COD Orders", value: selected.totalCodOrders, color: "#fff" },
                { label: "COD Cancelled", value: selected.totalCodCancelled, color: "#FB923C" },
                { label: "Refund ₹", value: `₹${Number(selected.totalRefundAmount).toLocaleString("en-IN")}`, color: "#A78BFA" },
              ].map(item => (
                <div key={item.label} className="rounded-lg p-3" style={{ background: "#0D0D0D" }}>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{item.label}</p>
                  <p className="font-bold" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>
            <textarea value={actionNote} onChange={e => setActionNote(e.target.value)} rows={2} placeholder="Reason / note (optional)…" className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none" style={{ background: "#0D0D0D" }} />
            <div className="flex flex-wrap gap-2">
              {!selected.isBlacklisted
                ? <button disabled={saving} onClick={() => doAction(selected.userId, "blacklist")} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm" style={{ background: "#F8717122", color: "#F87171" }}><Ban className="w-3 h-3" /> Blacklist</button>
                : <button disabled={saving} onClick={() => doAction(selected.userId, "unblacklist")} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm" style={{ background: "#4ADE8022", color: "#4ADE80" }}><ShieldCheck className="w-3 h-3" /> Lift Blacklist</button>
              }
              {!selected.isCodBlocked
                ? <button disabled={saving} onClick={() => doAction(selected.userId, "block_cod")} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm" style={{ background: "#FB923C22", color: "#FB923C" }}><ShieldOff className="w-3 h-3" /> Block COD</button>
                : <button disabled={saving} onClick={() => doAction(selected.userId, "unblock_cod")} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm" style={{ background: "#4ADE8022", color: "#4ADE80" }}><ShieldCheck className="w-3 h-3" /> Unblock COD</button>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
