"use client";

import { useState, useEffect, useCallback } from "react";
import { Ban, RefreshCw, Plus, X, ChevronLeft, ChevronRight, Search, Trash2, ShieldCheck } from "lucide-react";

interface BlacklistEntry {
  id: string; type: string; value: string; status: string;
  reason: string | null; addedBy: string | null; hitCount: number;
  lastHitAt: string | null; expiresAt: string | null; createdAt: string;
}

const TYPE_COLOR: Record<string, string> = { EMAIL: "#38BDF8", PHONE: "#4ADE80", IP: "#FB923C", ADDRESS: "#A78BFA" };

export default function BlacklistPage() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: "EMAIL", value: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [counts, setCounts] = useState<{ type: string; _count: { type: number } }[]>([]);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), status });
    if (type) params.set("type", type);
    if (search) params.set("search", search);
    const r = await fetch(`/api/admin/fraud/blacklist?${params}`);
    const json = await r.json();
    setEntries(json.entries ?? []);
    setTotal(json.total ?? 0);
    setCounts(json.counts ?? []);
    setLoading(false);
  }, [page, type, status, search]);

  useEffect(() => { load(); }, [load]);

  const addEntry = async () => {
    if (!form.value) return;
    setSaving(true);
    await fetch("/api/admin/fraud/blacklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowAdd(false);
    setForm({ type: "EMAIL", value: "", reason: "" });
    load();
  };

  const liftEntry = async (id: string) => {
    await fetch("/api/admin/fraud/blacklist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, liftReason: "Lifted by admin" }),
    });
    load();
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Permanently delete this blacklist entry?")) return;
    await fetch("/api/admin/fraud/blacklist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Ban className="w-6 h-6" style={{ color: "#E8FF47" }} /> Blacklist Center
        </h1>
        <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#E8FF47", color: "#0A0A0A" }}>
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      {/* Type Summary */}
      <div className="grid grid-cols-4 gap-3">
        {["EMAIL", "PHONE", "IP", "ADDRESS"].map(t => {
          const entry = counts.find(c => c.type === t);
          return (
            <button key={t} onClick={() => setType(type === t ? "" : t)} className="rounded-xl p-3 text-left transition-opacity hover:opacity-80" style={{ background: "#111111", border: type === t ? `1px solid ${TYPE_COLOR[t]}` : "1px solid transparent" }}>
              <p className="text-xs font-medium" style={{ color: TYPE_COLOR[t] }}>{t}</p>
              <p className="text-2xl font-bold text-white mt-1">{entry?._count?.type ?? 0}</p>
            </button>
          );
        })}
      </div>

      {/* Add Entry Form */}
      {showAdd && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#111111" }}>
          <h3 className="text-sm font-semibold text-white">Add Blacklist Entry</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="px-3 py-2 rounded-lg text-sm text-white outline-none" style={{ background: "#0D0D0D" }}>
              {["EMAIL", "PHONE", "IP", "ADDRESS"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder="Value (email/phone/IP/address)" className="px-3 py-2 rounded-lg text-sm text-white outline-none col-span-2" style={{ background: "#0D0D0D" }} />
            <input value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Reason" className="px-3 py-2 rounded-lg text-sm text-white outline-none" style={{ background: "#0D0D0D" }} />
          </div>
          <div className="flex gap-2">
            <button disabled={saving || !form.value} onClick={addEntry} className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-30" style={{ background: "#E8FF47", color: "#0A0A0A" }}>Add</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm" style={{ background: "#1A1A1A", color: "#9CA3AF" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-48" style={{ background: "#111111" }}>
          <Search className="w-4 h-4" style={{ color: "#9CA3AF" }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search value…" className="bg-transparent text-white text-sm outline-none flex-1" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg text-sm text-white outline-none" style={{ background: "#111111" }}>
          <option value="ACTIVE">Active</option>
          <option value="LIFTED">Lifted</option>
          <option value="">All</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#111111" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #1A1A1A" }}>
              {["Type", "Value", "Reason", "Hits", "Added", "Expires", "Status", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="text-center py-12"><RefreshCw className="w-5 h-5 animate-spin mx-auto" style={{ color: "#E8FF47" }} /></td></tr>
            : entries.map(e => (
              <tr key={e.id} style={{ borderBottom: "1px solid #1A1A1A" }}>
                <td className="px-4 py-3"><span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: `${TYPE_COLOR[e.type]}22`, color: TYPE_COLOR[e.type] }}>{e.type}</span></td>
                <td className="px-4 py-3 text-white font-mono text-xs">{e.value}</td>
                <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: "#9CA3AF" }}>{e.reason ?? "—"}</td>
                <td className="px-4 py-3 text-white">{e.hitCount}</td>
                <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>{new Date(e.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>{e.expiresAt ? new Date(e.expiresAt).toLocaleDateString("en-IN") : "Never"}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: e.status === "ACTIVE" ? "#F8717122" : "#4ADE8022", color: e.status === "ACTIVE" ? "#F87171" : "#4ADE80" }}>{e.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {e.status === "ACTIVE" && (
                      <button onClick={() => liftEntry(e.id)} className="p-1 rounded" style={{ color: "#4ADE80" }} title="Lift"><ShieldCheck className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => deleteEntry(e.id)} className="p-1 rounded" style={{ color: "#F87171" }} title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && entries.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-sm" style={{ color: "#9CA3AF" }}>No blacklist entries</td></tr>}
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
