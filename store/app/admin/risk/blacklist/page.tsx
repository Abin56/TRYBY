"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Ban, Plus, Search, RefreshCw, Loader2, XCircle, Download,
  CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle,
  Mail, Phone, Globe, MapPin, Trash2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface BlacklistEntry {
  id:         string;
  type:       "EMAIL" | "PHONE" | "IP" | "ADDRESS";
  value:      string;
  status:     "ACTIVE" | "LIFTED";
  reason:     string | null;
  addedBy:    string | null;
  hitCount:   number;
  expiresAt:  string | null;
  createdAt:  string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const CARD = "rounded-2xl border p-5";
const CD   = { background: "#111", borderColor: "rgba(255,255,255,0.06)" };

const TYPE_ICON  = { EMAIL: Mail, PHONE: Phone, IP: Globe, ADDRESS: MapPin };
const TYPE_COLOR = { EMAIL: "#F87171", PHONE: "#FBBF24", IP: "#F97316", ADDRESS: "#C084FC" };
const TYPE_LABEL = { EMAIL: "Email", PHONE: "Phone", IP: "IP Address", ADDRESS: "Address" };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000); if (d > 0) return `${d}d ago`;
  const h = Math.floor(diff / 3600000);  if (h > 0) return `${h}h ago`;
  const m = Math.floor(diff / 60000);    return `${m}m ago`;
}

// ── Add Entry Modal ──────────────────────────────────────────────────────────

function AddModal({
  onClose, onAdded, initialType,
}: {
  onClose:     () => void;
  onAdded:     () => void;
  initialType?: string;
}) {
  const [form, setForm]   = useState({
    type:      initialType ?? "EMAIL",
    value:     "",
    reason:    "FRAUD",
    expiresAt: "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/fraud/blacklist", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-2xl border"
        style={{ background: "#111", borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <h2 className="text-white font-black text-[18px]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Add to Blacklist
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/70">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl text-[13px] text-white outline-none"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}>
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone</option>
                <option value="IP">IP Address</option>
                <option value="ADDRESS">Address</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Reason</label>
              <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl text-[13px] text-white outline-none"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}>
                <option value="FRAUD">Fraud</option>
                <option value="COD_ABUSE">COD Abuse</option>
                <option value="REFUND_ABUSE">Refund Abuse</option>
                <option value="CHARGEBACK">Chargeback</option>
                <option value="FAKE_ORDERS">Fake Orders</option>
                <option value="SUSPICIOUS_ACTIVITY">Suspicious Activity</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
              {TYPE_LABEL[form.type as keyof typeof TYPE_LABEL]}
            </label>
            <input
              required
              value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl text-[13px] text-white outline-none"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}
              placeholder={form.type === "EMAIL" ? "user@example.com" : form.type === "PHONE" ? "+91..." : form.type === "IP" ? "1.2.3.4" : "Address..."}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
              Expires (optional)
            </label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl text-[13px] text-white outline-none"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-[12px]"
              style={{ background: "rgba(248,113,113,0.1)", color: "#F87171" }}>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 rounded-xl text-[13px] font-bold border hover:bg-white/5 transition-all"
              style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 h-10 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: "#E8FF47", color: "#0D0D0D" }}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BlacklistPage() {
  const [entries,  setEntries]  = useState<BlacklistEntry[]>([]);
  const [total,    setTotal]    = useState(0);
  const [counts,   setCounts]   = useState<Record<string, number>>({});
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [search,   setSearch]   = useState("");
  const [showAdd,  setShowAdd]  = useState(false);
  const [acting,   setActing]   = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page) });
      if (typeFilter)   p.set("type",   typeFilter);
      if (statusFilter) p.set("status", statusFilter);
      if (search)       p.set("search", search);
      const res = await fetch(`/api/admin/fraud/blacklist?${p}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.data);
        setTotal(data.total);
        const cm: Record<string, number> = {};
        for (const c of (data.counts ?? [])) cm[c.type] = c._count.type;
        setCounts(cm);
      }
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter, search]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(load, 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [load]);

  async function lift(id: string) {
    setActing(id);
    await fetch("/api/admin/fraud/blacklist", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id }),
    });
    await load();
    setActing(null);
  }

  function exportCsv() {
    const p = new URLSearchParams({ export: "csv" });
    if (typeFilter)   p.set("type",   typeFilter);
    if (statusFilter) p.set("status", statusFilter);
    window.open(`/api/admin/fraud/blacklist?${p}`, "_blank");
  }

  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Blacklist Management
          </h1>
          <p className="text-white/40 text-[13px]">
            {Object.values(counts).reduce((a, b) => a + b, 0)} active entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv}
            className="h-9 px-3 rounded-xl text-[12px] font-bold flex items-center gap-1.5 border hover:bg-white/5 transition-all"
            style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button onClick={() => setShowAdd(true)}
            className="h-9 px-4 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all"
            style={{ background: "#E8FF47", color: "#0D0D0D" }}>
            <Plus className="h-4 w-4" /> Add Entry
          </button>
        </div>
      </div>

      {/* Type counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {(["EMAIL", "PHONE", "IP", "ADDRESS"] as const).map(type => {
          const Icon  = TYPE_ICON[type];
          const color = TYPE_COLOR[type];
          const count = counts[type] ?? 0;
          return (
            <button key={type}
              onClick={() => { setTypeFilter(typeFilter === type ? "" : type); setPage(1); }}
              className={`${CARD} text-left transition-all hover:brightness-110`}
              style={{ ...CD, borderColor: typeFilter === type ? `${color}40` : "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" style={{ color }} />
                <p className="text-[11px] font-bold text-white/40">{TYPE_LABEL[type]}</p>
              </div>
              <p className="font-black text-[28px] leading-none"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color: count > 0 ? color : "rgba(255,255,255,0.2)" }}>
                {count}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search value…"
            className="w-full h-9 pl-8 pr-3 rounded-xl text-[12px] text-white outline-none"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-xl text-[12px] text-white outline-none"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}>
          <option value="ACTIVE">Active</option>
          <option value="LIFTED">Lifted</option>
          <option value="">All</option>
        </select>
        <button onClick={load} className="h-9 w-9 flex items-center justify-center rounded-xl border hover:bg-white/5"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <RefreshCw className={`h-4 w-4 text-white/50 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Table */}
      <div className={CARD} style={CD}>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-10 text-white/30">
            <Ban className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No entries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  {["Type", "Value", "Reason", "Hits", "Status", "Added", "Expires", ""].map(h => (
                    <th key={h} className="pb-3 text-left text-[10px] font-bold text-white/30 uppercase tracking-widest pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {entries.map(e => {
                  const Icon  = TYPE_ICON[e.type];
                  const color = TYPE_COLOR[e.type];
                  const isLifted = e.status === "LIFTED";
                  return (
                    <tr key={e.id} className="hover:bg-white/[0.02]" style={{ opacity: isLifted ? 0.5 : 1 }}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5" style={{ color }} />
                          <span className="font-bold" style={{ color }}>{e.type}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-mono text-white/80 max-w-[200px] truncate">{e.value}</td>
                      <td className="py-3 pr-4 text-white/50">{e.reason?.replace(/_/g, " ") ?? "—"}</td>
                      <td className="py-3 pr-4">
                        <span className="font-black text-[14px]"
                          style={{ color: e.hitCount > 5 ? "#F87171" : "rgba(255,255,255,0.5)" }}>
                          {e.hitCount}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {isLifted ? (
                          <span className="flex items-center gap-1 text-[10px] text-green-400">
                            <CheckCircle2 className="h-3 w-3" /> Lifted
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-red-400">
                            <Ban className="h-3 w-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-white/30">{timeAgo(e.createdAt)}</td>
                      <td className="py-3 pr-4 text-white/30">
                        {e.expiresAt ? new Date(e.expiresAt).toLocaleDateString("en-IN") : "Never"}
                      </td>
                      <td className="py-3">
                        {!isLifted && (
                          <button
                            onClick={() => lift(e.id)}
                            disabled={acting === e.id}
                            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                            title="Lift blacklist">
                            {acting === e.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />
                              : <Trash2 className="h-3.5 w-3.5 text-white/30 hover:text-red-400 transition-colors" />
                            }
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdded={load} initialType={typeFilter || "EMAIL"} />}
    </div>
  );
}
