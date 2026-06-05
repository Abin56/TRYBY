"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface LogRow {
  id: string; reason: string;
  stockBefore: number; stockAfter: number; delta: number;
  note: string | null; adminId: string | null; createdAt: string;
  product: { id: string; name: string };
  variant: { id: string; sku: string; size: string | null; color: string | null };
  warehouse: { id: string; name: string; code: string } | null;
}

const REASON_LABELS: Record<string, string> = {
  MANUAL_ADJUSTMENT: "Manual", BULK_UPDATE: "Bulk Update",
  ORDER_FULFILLED: "Order Fulfilled", ORDER_CANCELLED: "Order Cancelled",
  RETURN_RECEIVED: "Return", CSV_IMPORT: "CSV Import",
  INITIAL_STOCK: "Initial Stock", PURCHASE_ORDER_RECEIVED: "PO Received",
  WAREHOUSE_TRANSFER: "Transfer", DAMAGE_WRITE_OFF: "Write-off", THEFT_SHRINKAGE: "Shrinkage",
};

const REASON_COLOR: Record<string, string> = {
  ORDER_FULFILLED: "#F87171", ORDER_CANCELLED: "#4ADE80", RETURN_RECEIVED: "#4ADE80",
  MANUAL_ADJUSTMENT: "#F5C518", PURCHASE_ORDER_RECEIVED: "#4ADE80",
  DAMAGE_WRITE_OFF: "#F87171", THEFT_SHRINKAGE: "#F87171", INITIAL_STOCK: "#A78BFA",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function InventoryLogsPage() {
  const [logs, setLogs]       = useState<LogRow[]>([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [debouncedQ, setDQ]   = useState("");
  const [reason, setReason]   = useState("");
  const [page, setPage]       = useState(1);

  useEffect(() => { const t = setTimeout(() => { setDQ(search); setPage(1); }, 350); return () => clearTimeout(t); }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (debouncedQ) params.set("q", debouncedQ);
    if (reason)     params.set("reason", reason);
    try {
      const res = await fetch(`/api/admin/inventory/logs?${params}`);
      if (res.ok) { const d = await res.json(); setLogs(d.logs); setTotal(d.total); setPages(d.pages); }
    } finally { setLoading(false); }
  }, [page, debouncedQ, reason]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>Movement Log</h1>
          <p className="text-white/40 text-[13px]">Every stock change — immutable audit trail</p>
        </div>
        <a href="/admin/inventory" className="rounded-xl px-3.5 py-2 text-[12px] font-bold text-white/50 hover:text-white" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          ← Inventory
        </a>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SKU, product, note..."
            className="w-full rounded-xl pl-10 pr-4 text-[13px] text-white placeholder:text-white/25 outline-none"
            style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }} />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30"><X className="h-4 w-4" /></button>}
        </div>
        <div className="relative">
          <select value={reason} onChange={e => { setReason(e.target.value); setPage(1); }}
            className="rounded-xl pl-3.5 pr-9 text-[12px] font-bold text-white outline-none appearance-none"
            style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}>
            <option value="">All Reasons</option>
            {Object.entries(REASON_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="hidden lg:grid px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white/30 border-b"
          style={{ gridTemplateColumns: "1fr 140px 100px 80px 80px 80px 110px", borderColor: "rgba(255,255,255,0.05)" }}>
          <span>Product / SKU</span><span>Reason</span><span>Warehouse</span>
          <span className="text-right">Before</span><span className="text-center">Delta</span>
          <span className="text-right">After</span><span>Time</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-7 w-7 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin" />
          </div>
        ) : !logs.length ? (
          <p className="text-center py-12 text-white/30 text-[13px]">No movements found</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {logs.map(log => (
              <div key={log.id} className="hidden lg:grid px-5 py-3 items-center gap-3"
                style={{ gridTemplateColumns: "1fr 140px 100px 80px 80px 80px 110px" }}>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-white/80 truncate">{log.product.name}</p>
                  <p className="text-[10px] font-mono text-white/35">{log.variant.sku}{log.variant.size ? ` · ${log.variant.size}` : ""}</p>
                  {log.note && <p className="text-[10px] text-white/25 truncate italic">{log.note}</p>}
                </div>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black"
                  style={{ background: `${REASON_COLOR[log.reason] ?? "#888"}18`, color: REASON_COLOR[log.reason] ?? "#888" }}>
                  {REASON_LABELS[log.reason] ?? log.reason}
                </span>
                <p className="text-[11px] text-white/40 truncate">{log.warehouse?.code ?? "Global"}</p>
                <p className="text-[12px] font-semibold text-white/50 text-right">{log.stockBefore}</p>
                <div className="flex items-center justify-center gap-0.5">
                  {log.delta > 0
                    ? <><ArrowUp className="h-3 w-3 text-[#4ADE80]" /><span className="text-[12px] font-black text-[#4ADE80]">+{log.delta}</span></>
                    : <><ArrowDown className="h-3 w-3 text-[#F87171]" /><span className="text-[12px] font-black text-[#F87171]">{log.delta}</span></>
                  }
                </div>
                <p className="text-[12px] font-bold text-white text-right">{log.stockAfter}</p>
                <p className="text-[10px] text-white/35">{fmtDate(log.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-[12px] text-white/35">{((page-1)*50)+1}–{Math.min(page*50, total)} of {total}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className={cn("flex h-8 w-8 items-center justify-center rounded-lg", page === 1 ? "text-white/20" : "text-white/50 hover:text-white hover:bg-white/08")}><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-[12px] font-semibold text-white/50">{page} / {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages} className={cn("flex h-8 w-8 items-center justify-center rounded-lg", page === pages ? "text-white/20" : "text-white/50 hover:text-white hover:bg-white/08")}><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
