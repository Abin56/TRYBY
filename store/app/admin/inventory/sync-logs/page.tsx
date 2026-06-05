"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search, RefreshCw, ChevronLeft, ChevronRight, X,
  CheckCircle2, XCircle, AlertTriangle, Clock, BarChart2,
} from "lucide-react";
import { cn } from "@/lib/cn";

// ── Types ──────────────────────────────────────────────────────────────────────

interface LogRow {
  id:            string;
  syncSessionId: string;
  supplierSku:   string;
  variantId:     string | null;
  stockBefore:   number | null;
  stockAfter:    number | null;
  supplierStock: number;
  bufferApplied: number;
  status:        string;
  errorReason:   string | null;
  createdAt:     string;
  supplier:      { id: string; companyName: string };
}

interface LogsResponse {
  logs:       LogRow[];
  total:      number;
  pages:      number;
  page:       number;
  sessions:   { sessionId: string; date: string }[];
  statusCounts: Record<string, number>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  SUCCESS:    { label: "Success",    color: "#4ADE80", icon: CheckCircle2 },
  SKIPPED:    { label: "Skipped",    color: "#F5C518", icon: Clock },
  NO_MAPPING: { label: "No Mapping", color: "#F87171", icon: AlertTriangle },
  FAILED:     { label: "Failed",     color: "#F87171", icon: XCircle },
  OVERRIDDEN: { label: "Overridden", color: "#A78BFA", icon: Clock },
};

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: "#9CA3AF", icon: Clock };
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black"
      style={{ background: `${meta.color}18`, color: meta.color }}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function StockDelta({ before, after }: { before: number | null; after: number | null }) {
  if (before === null || after === null) return <span className="text-white/20">—</span>;
  const delta = after - before;
  return (
    <span className="font-bold text-[11px]" style={{ color: delta === 0 ? "#9CA3AF" : delta > 0 ? "#4ADE80" : "#F87171" }}>
      {before} → {after} {delta !== 0 && `(${delta > 0 ? "+" : ""}${delta})`}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const STATUSES = ["SUCCESS", "SKIPPED", "NO_MAPPING", "FAILED", "OVERRIDDEN"];

export default function SyncLogsPage() {
  const [data,    setData]    = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [q,       setQ]       = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("q") ?? "";
    }
    return "";
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("status") ?? "";
    }
    return "";
  });
  const [sessionFilter, setSessionFilter] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("sessionId") ?? "";
    }
    return "";
  });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (q)             params.set("q", q);
      if (statusFilter)  params.set("status", statusFilter);
      if (sessionFilter) params.set("sessionId", sessionFilter);
      const res = await fetch(`/api/admin/inventory/sync-logs?${params}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [q, statusFilter, sessionFilter, page]);

  useEffect(() => { load(); }, [load]);

  function clearFilters() {
    setQ(""); setStatusFilter(""); setSessionFilter(""); setPage(1);
  }

  const d = data;
  const hasFilter = q || statusFilter || sessionFilter;

  return (
    <div className="p-4 lg:p-6 max-w-[1200px] space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white font-black leading-none"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "26px", letterSpacing: "-0.01em" }}>
            Sync Logs
          </h1>
          <p className="text-white/35 text-[11px] mt-0.5">Full audit trail of all stock sync operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/inventory/sync"
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-semibold text-white/50 hover:text-white transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <BarChart2 className="h-3.5 w-3.5" /> Sync Center
          </Link>
          <button onClick={load}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/40 hover:text-white transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Status count badges */}
      {d && (
        <div className="flex items-center gap-2 flex-wrap">
          {STATUSES.map(s => {
            const cnt  = d.statusCounts[s] ?? 0;
            const meta = STATUS_META[s];
            return cnt > 0 ? (
              <button key={s}
                onClick={() => { setStatusFilter(statusFilter === s ? "" : s); setPage(1); }}
                className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold transition-all",
                  statusFilter === s ? "ring-1 ring-offset-0" : "opacity-70 hover:opacity-100")}
                style={{
                  background: `${meta.color}15`,
                  color: meta.color,
                  ringColor: meta.color,
                }}>
                {cnt} {meta.label}
              </button>
            ) : null;
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25 pointer-events-none" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Search supplier SKU…"
            className="h-9 pl-9 pr-3 rounded-xl border text-[12px] text-white bg-[#111] outline-none w-56"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>

        {d && d.sessions.length > 0 && (
          <select value={sessionFilter} onChange={e => { setSessionFilter(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-xl border text-[12px] text-white bg-[#111] outline-none appearance-none"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <option value="">All sessions</option>
            {d.sessions.map(s => (
              <option key={s.sessionId} value={s.sessionId}>
                {new Date(s.date).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })} — {s.sessionId.slice(0, 8)}
              </option>
            ))}
          </select>
        )}

        {hasFilter && (
          <button onClick={clearFilters}
            className="flex items-center gap-1 h-9 px-3 rounded-xl text-[11px] text-white/40 hover:text-white transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
        {d && <span className="text-[11px] text-white/25 ml-auto">{d.total} entries</span>}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["Status", "Supplier SKU", "Supplier", "Supplier Stock", "Stock Change", "Buffer", "Error", "Time", "Session"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[9px] font-bold text-white/25 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {loading ? (
                <tr><td colSpan={9} className="py-12 text-center"><span className="h-5 w-5 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin inline-block" /></td></tr>
              ) : !d || d.logs.length === 0 ? (
                <tr><td colSpan={9} className="py-10 text-center text-white/30">No logs found</td></tr>
              ) : d.logs.map(log => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3"><StatusPill status={log.status} /></td>
                  <td className="px-4 py-3 font-mono text-white/60">{log.supplierSku}</td>
                  <td className="px-4 py-3 text-white/50 max-w-[120px] truncate">{log.supplier.companyName}</td>
                  <td className="px-4 py-3 font-bold text-white">{log.supplierStock}</td>
                  <td className="px-4 py-3"><StockDelta before={log.stockBefore} after={log.stockAfter} /></td>
                  <td className="px-4 py-3 text-white/30">{log.bufferApplied > 0 ? `-${log.bufferApplied}` : "—"}</td>
                  <td className="px-4 py-3 max-w-[140px]">
                    {log.errorReason
                      ? <span className="text-[10px] text-[#F87171] truncate block" title={log.errorReason}>{log.errorReason}</span>
                      : <span className="text-white/20">—</span>}
                  </td>
                  <td className="px-4 py-3 text-white/30 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3 font-mono text-[9px] text-white/20">{log.syncSessionId.slice(0, 8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {d && d.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 h-8 px-3 rounded-xl text-[11px] text-white/40 disabled:opacity-30 hover:text-white transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <span className="text-[11px] text-white/30">Page {page} of {d.pages}</span>
            <button onClick={() => setPage(p => Math.min(d.pages, p + 1))} disabled={page === d.pages}
              className="flex items-center gap-1 h-8 px-3 rounded-xl text-[11px] text-white/40 disabled:opacity-30 hover:text-white transition-colors">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
