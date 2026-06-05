"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search, RefreshCw, Plus, Trash2, Edit2, Check, X,
  AlertTriangle, ChevronLeft, ChevronRight, Shield, Layers,
} from "lucide-react";
import { cn } from "@/lib/cn";

// ── Types ──────────────────────────────────────────────────────────────────────

interface MappingRow {
  id:             string;
  supplierId:     string;
  supplierSku:    string;
  variantId:      string;
  bufferStock:    number;
  manualOverride: boolean;
  ignoreUpdates:  boolean;
  lastSyncedAt:   string | null;
  supplier:       { id: string; companyName: string };
  variant: {
    id: string; sku: string; size: string | null; color: string | null; stock: number;
    product: { id: string; name: string; slug: string };
  };
}

interface ListResponse {
  rows:          MappingRow[];
  total:         number;
  pages:         number;
  page:          number;
  unmappedCount: number;
}

interface SupplierOption { id: string; companyName: string; }

// Unmapped variant (for add mapping dialog)
interface UnmappedVariant {
  id: string; sku: string; size: string | null; color: string | null; stock: number;
  product: { name: string; slug: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60)    return `${d}s ago`;
  if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

// ── Add Mapping Modal ─────────────────────────────────────────────────────────

function AddMappingModal({
  suppliers,
  onClose,
  onSaved,
}: {
  suppliers: SupplierOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [supplierId,    setSupplierId]    = useState(suppliers[0]?.id ?? "");
  const [supplierSku,   setSupplierSku]   = useState("");
  const [variantSearch, setVariantSearch] = useState("");
  const [variants,      setVariants]      = useState<UnmappedVariant[]>([]);
  const [selectedVar,   setSelectedVar]   = useState<UnmappedVariant | null>(null);
  const [bufferStock,   setBufferStock]   = useState(0);
  const [manualOverride, setManualOverride] = useState(false);
  const [ignoreUpdates, setIgnoreUpdates] = useState(false);
  const [saving, setSaving]              = useState(false);
  const [error, setError]                = useState("");

  useEffect(() => {
    if (variantSearch.length < 2) { setVariants([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/inventory/sku-mappings?supplierId=${supplierId}&q=${encodeURIComponent(variantSearch)}&page=1`);
      if (res.ok) {
        // Actually fetch unmapped variants directly
        const vRes = await fetch(`/api/admin/products?q=${encodeURIComponent(variantSearch)}&supplierId=${supplierId}&unmapped=1&page=1`);
        if (vRes.ok) {
          const d = await vRes.json();
          setVariants(d.variants ?? []);
        }
      }
    }, 300);
    return () => clearTimeout(t);
  }, [variantSearch, supplierId]);

  async function save() {
    if (!supplierId || !supplierSku.trim() || !selectedVar) {
      setError("Fill all required fields");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/inventory/sku-mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, supplierSku: supplierSku.trim(), variantId: selectedVar.id, bufferStock, manualOverride, ignoreUpdates }),
      });
      if (res.ok) { onSaved(); onClose(); }
      else {
        const d = await res.json();
        setError(d.error?.fieldErrors ? JSON.stringify(d.error.fieldErrors) : "Failed to save");
      }
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-[520px] rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-white font-black text-[14px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Add SKU Mapping</p>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <p className="text-[11px] text-[#F87171] font-semibold">{error}</p>}

          {/* Supplier */}
          <div>
            <label className="block text-white/40 text-[10px] mb-1 font-semibold uppercase tracking-wider">Supplier *</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
              className="w-full h-10 rounded-xl border px-3 text-[13px] text-white bg-[#111] outline-none"
              style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
            </select>
          </div>

          {/* Supplier SKU */}
          <div>
            <label className="block text-white/40 text-[10px] mb-1 font-semibold uppercase tracking-wider">Supplier SKU *</label>
            <input
              value={supplierSku} onChange={e => setSupplierSku(e.target.value)}
              placeholder="e.g. SUP-001-RED-XL"
              className="w-full h-10 rounded-xl border px-3 text-[13px] text-white bg-[#111] outline-none"
              style={{ border: "1px solid rgba(255,255,255,0.10)" }}
            />
          </div>

          {/* TRYBY Variant search */}
          <div>
            <label className="block text-white/40 text-[10px] mb-1 font-semibold uppercase tracking-wider">TRYBY Variant *</label>
            {selectedVar ? (
              <div className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.2)" }}>
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-white">{selectedVar.product.name}</p>
                  <p className="text-[10px] text-white/40">{selectedVar.sku} {selectedVar.size && `· ${selectedVar.size}`} {selectedVar.color && `· ${selectedVar.color}`}</p>
                </div>
                <button onClick={() => setSelectedVar(null)} className="text-white/30 hover:text-white"><X className="h-3.5 w-3.5" /></button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 pointer-events-none" />
                <input value={variantSearch} onChange={e => setVariantSearch(e.target.value)}
                  placeholder="Search by product name or SKU…"
                  className="w-full h-10 rounded-xl border pl-9 pr-3 text-[13px] text-white bg-[#111] outline-none"
                  style={{ border: "1px solid rgba(255,255,255,0.10)" }} />
                {variants.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-10 rounded-xl overflow-hidden"
                    style={{ background: "#222", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {variants.slice(0, 8).map(v => (
                      <button key={v.id} onClick={() => { setSelectedVar(v); setVariantSearch(""); }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.05] transition-colors">
                        <div>
                          <p className="text-[12px] font-semibold text-white">{v.product.name}</p>
                          <p className="text-[10px] text-white/40">{v.sku} · stock {v.stock}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Buffer stock */}
          <div>
            <label className="block text-white/40 text-[10px] mb-1 font-semibold uppercase tracking-wider">Buffer Stock</label>
            <input type="number" min={0} value={bufferStock} onChange={e => setBufferStock(parseInt(e.target.value) || 0)}
              className="w-full h-10 rounded-xl border px-3 text-[13px] text-white bg-[#111] outline-none"
              style={{ border: "1px solid rgba(255,255,255,0.10)" }} />
            <p className="mt-1 text-[10px] text-white/25">TRYBY stock = supplier stock − buffer. Keeps a safety margin.</p>
          </div>

          {/* Flags */}
          <div className="space-y-2">
            {[
              { label: "Manual Override", sub: "Ignore ALL supplier updates — admin controls stock manually", val: manualOverride, set: setManualOverride },
              { label: "Ignore Updates", sub: "Skip this SKU during sync runs only", val: ignoreUpdates, set: setIgnoreUpdates },
            ].map(({ label, sub, val, set }) => (
              <button key={label} onClick={() => set(!val)}
                className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all",
                  val ? "bg-[#F5C518]/10 border border-[#F5C518]/25" : "bg-white/[0.03] border border-white/[0.06]")}>
                <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                  val ? "border-[#F5C518] bg-[#F5C518]" : "border-white/20")}>
                  {val && <Check className="h-3 w-3 text-[#0D0D0D]" />}
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-white">{label}</p>
                  <p className="text-[10px] text-white/30">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button onClick={onClose} className="h-9 px-4 rounded-xl text-[12px] font-semibold text-white/40 hover:text-white transition-colors">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-bold text-[#0D0D0D] disabled:opacity-40 transition-all"
            style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif" }}>
            {saving ? <span className="h-3.5 w-3.5 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save Mapping
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline edit row ───────────────────────────────────────────────────────────

function EditableRow({
  row,
  onSaved,
  onDelete,
}: {
  row: MappingRow;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing]         = useState(false);
  const [buffer,  setBuffer]          = useState(row.bufferStock);
  const [manual,  setManual]          = useState(row.manualOverride);
  const [ignore,  setIgnore]          = useState(row.ignoreUpdates);
  const [saving,  setSaving]          = useState(false);
  const [deleting, setDeleting]       = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/admin/inventory/sku-mappings/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bufferStock: buffer, manualOverride: manual, ignoreUpdates: ignore }),
      });
      setEditing(false);
      onSaved();
    } finally { setSaving(false); }
  }

  async function del() {
    if (!confirm("Delete this mapping?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/inventory/sku-mappings/${row.id}`, { method: "DELETE" });
      onDelete();
    } finally { setDeleting(false); }
  }

  return (
    <tr className={cn("group hover:bg-white/[0.02]", editing && "bg-[#F5C518]/[0.03]")}>
      <td className="px-4 py-3 font-mono text-[11px] text-white/50">{row.supplierSku}</td>
      <td className="px-4 py-3 max-w-[180px]">
        <p className="text-[12px] font-semibold text-white/80 truncate">{row.variant.product.name}</p>
        <p className="text-[10px] text-white/30">{row.variant.sku}</p>
      </td>
      <td className="px-4 py-3 text-[11px] text-white/50">{row.supplier.companyName}</td>
      <td className="px-4 py-3">
        <span className={cn("font-bold text-[12px]", row.variant.stock === 0 ? "text-[#F87171]" : row.variant.stock <= 5 ? "text-[#F5C518]" : "text-[#4ADE80]")}>
          {row.variant.stock}
        </span>
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <input type="number" min={0} value={buffer} onChange={e => setBuffer(parseInt(e.target.value) || 0)}
            className="w-16 h-7 rounded-lg border px-2 text-[12px] text-white bg-[#111] outline-none"
            style={{ border: "1px solid rgba(245,197,24,0.3)" }} />
        ) : (
          <span className="text-[11px] text-white/40">{row.bufferStock > 0 ? `-${row.bufferStock}` : "—"}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {editing ? (
            <button onClick={() => setManual(!manual)}
              className={cn("h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all", manual ? "border-[#F5C518] bg-[#F5C518]" : "border-white/20")}>
              {manual && <Check className="h-3 w-3 text-[#0D0D0D]" />}
            </button>
          ) : (
            row.manualOverride ? <Shield className="h-3.5 w-3.5 text-[#A78BFA]" /> : null
          )}
          {editing ? (
            <button onClick={() => setIgnore(!ignore)}
              className={cn("h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all", ignore ? "border-[#F5C518] bg-[#F5C518]" : "border-white/20")}>
              {ignore && <Check className="h-3 w-3 text-[#0D0D0D]" />}
            </button>
          ) : (
            row.ignoreUpdates ? <span className="text-[9px] font-bold text-[#F5C518]">SKIP</span> : null
          )}
          {!editing && !row.manualOverride && !row.ignoreUpdates && <span className="text-[10px] text-white/20">—</span>}
        </div>
      </td>
      <td className="px-4 py-3 text-[10px] text-white/25">
        {row.lastSyncedAt ? timeAgo(row.lastSyncedAt) : "Never"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {editing ? (
            <>
              <button onClick={save} disabled={saving}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-[#4ADE80] hover:bg-[#4ADE80]/10 transition-colors">
                {saving ? <span className="h-3.5 w-3.5 rounded-full border border-[#4ADE80] border-t-transparent animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => setEditing(false)}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/05 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/05 transition-colors">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={del} disabled={deleting}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-white/30 hover:text-[#F87171] hover:bg-[#F87171]/10 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SupplierSkuPage() {
  const [data,    setData]    = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [filterSupplier, setFilterSupplier] = useState("");
  const [q, setQ]            = useState("");
  const [page, setPage]      = useState(1);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (filterSupplier) params.set("supplierId", filterSupplier);
      if (q) params.set("q", q);
      const [listRes, supRes] = await Promise.all([
        fetch(`/api/admin/inventory/sku-mappings?${params}`),
        fetch("/api/admin/inventory/sync-stats"),
      ]);
      if (listRes.ok) setData(await listRes.json());
      if (supRes.ok) {
        const sd = await supRes.json();
        setSuppliers(sd.suppliers?.map((s: { id: string; companyName: string }) => ({ id: s.id, companyName: s.companyName })) ?? []);
      }
    } finally { setLoading(false); }
  }, [filterSupplier, q, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 lg:p-6 max-w-[1200px] space-y-5">
      {showAdd && <AddMappingModal suppliers={suppliers} onClose={() => setShowAdd(false)} onSaved={load} />}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white font-black leading-none"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "26px", letterSpacing: "-0.01em" }}>
            Supplier SKU Mappings
          </h1>
          <p className="text-white/35 text-[11px] mt-0.5">Map supplier SKUs to TRYBY variants for stock sync</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/inventory/sync"
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-semibold text-white/50 hover:text-white transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <Layers className="h-3.5 w-3.5" /> Sync Center
          </Link>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-bold text-[#0D0D0D]"
            style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif" }}>
            <Plus className="h-3.5 w-3.5" /> Add Mapping
          </button>
          <button onClick={load}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/40 hover:text-white transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Unmapped warning */}
      {data && data.unmappedCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: "rgba(245,197,24,0.07)", border: "1px solid rgba(245,197,24,0.2)" }}>
          <AlertTriangle className="h-4 w-4 text-[#F5C518] shrink-0" />
          <p className="text-[12px] text-[#F5C518] font-semibold">
            {data.unmappedCount} active variant{data.unmappedCount !== 1 ? "s" : ""} in this supplier have no SKU mapping
          </p>
          <button onClick={() => setShowAdd(true)} className="ml-auto text-[11px] text-[#F5C518] underline shrink-0">Add mapping →</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25 pointer-events-none" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Search SKU or product…"
            className="h-9 pl-9 pr-3 rounded-xl border text-[12px] text-white bg-[#111] outline-none transition-all w-64"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>
        <select value={filterSupplier} onChange={e => { setFilterSupplier(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-xl border text-[12px] text-white bg-[#111] outline-none appearance-none"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <option value="">All suppliers</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
        </select>
        {(q || filterSupplier) && (
          <button onClick={() => { setQ(""); setFilterSupplier(""); setPage(1); }}
            className="flex items-center gap-1 h-9 px-3 rounded-xl text-[11px] text-white/40 hover:text-white transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
        {data && <span className="text-[11px] text-white/25 ml-auto">{data.total} mappings</span>}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["Supplier SKU", "TRYBY Product", "Supplier", "Stock", "Buffer", "Flags", "Last Sync", ""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[9px] font-bold text-white/25 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center"><span className="h-5 w-5 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin inline-block" /></td></tr>
              ) : !data || data.rows.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-white/30 text-[12px]">No mappings found</td></tr>
              ) : data.rows.map(row => (
                <EditableRow key={row.id} row={row} onSaved={load} onDelete={load} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 h-8 px-3 rounded-xl text-[11px] text-white/40 disabled:opacity-30 hover:text-white transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <span className="text-[11px] text-white/30">Page {page} of {data.pages}</span>
            <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
              className="flex items-center gap-1 h-8 px-3 rounded-xl text-[11px] text-white/40 disabled:opacity-30 hover:text-white transition-colors">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
