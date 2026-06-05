"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, X, Check, ChevronLeft, ChevronRight, Search,
  AlertTriangle, Package, Truck, ChevronDown, RefreshCw,
  ExternalLink, CheckCircle2, Clock, ArrowDownToLine,
} from "lucide-react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

type POStatus = "DRAFT" | "SENT" | "ACKNOWLEDGED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";

interface PORow {
  id: string;
  poNumber: string;
  status: POStatus;
  totalCost: number;
  expectedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  supplier: { id: string; companyName: string } | null;
  warehouse: { id: string; name: string; code: string } | null;
  items: { orderedQty: number; receivedQty: number; totalCost: number }[];
  _count: { items: number };
}

interface Supplier { id: string; companyName: string; }
interface Warehouse { id: string; name: string; code: string; }
interface Variant   { id: string; sku: string; size: string | null; color: string | null; price: number; costPrice: number | null; productId: string; product: { name: string; } }

interface ApiData { pos: PORow[]; total: number; pages: number; counts: Partial<Record<POStatus, number>>; }

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) { return "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_CONFIG: Record<POStatus, { label: string; color: string; bg: string }> = {
  DRAFT:               { label: "Draft",             color: "#9CA3AF", bg: "rgba(156,163,175,0.12)" },
  SENT:                { label: "Sent",               color: "#60A5FA", bg: "rgba(96,165,250,0.12)"  },
  ACKNOWLEDGED:        { label: "Acknowledged",       color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
  PARTIALLY_RECEIVED:  { label: "Partly Received",    color: "#F5C518", bg: "rgba(245,197,24,0.12)"  },
  RECEIVED:            { label: "Received",           color: "#4ADE80", bg: "rgba(74,222,128,0.12)"  },
  CANCELLED:           { label: "Cancelled",          color: "#F87171", bg: "rgba(248,113,113,0.12)" },
};

function POStatusBadge({ status }: { status: POStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ── Receive Modal ─────────────────────────────────────────────────────────────

function ReceiveModal({ po, onClose, onSuccess }: { po: PORow; onClose: () => void; onSuccess: () => void; }) {
  const [items, setItems] = useState<Record<string, number>>({});
  const [note, setNote]   = useState("");
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState("");
  const [fullPO, setFullPO] = useState<{ items: { id: string; variantSku: string; productName: string; size: string | null; color: string | null; orderedQty: number; receivedQty: number; }[] } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/purchase-orders/${po.id}`)
      .then(r => r.json())
      .then(d => {
        setFullPO(d);
        const init: Record<string, number> = {};
        for (const item of d.items) {
          init[item.id] = item.orderedQty - item.receivedQty;
        }
        setItems(init);
      });
  }, [po.id]);

  async function submit() {
    setErr(""); setBusy(true);
    try {
      const receiveItems = Object.entries(items)
        .filter(([, qty]) => qty > 0)
        .map(([itemId, receivedQty]) => ({ itemId, receivedQty }));
      if (!receiveItems.length) { setErr("Enter at least 1 unit to receive"); setBusy(false); return; }
      const res = await fetch(`/api/admin/purchase-orders/${po.id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: receiveItems, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Failed"); setBusy(false); return; }
      onSuccess();
    } catch { setErr("Network error"); setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-[540px] rounded-2xl overflow-hidden max-h-[85vh] flex flex-col"
        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div>
            <p className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>Receive Stock</p>
            <p className="text-white/40 text-[11px] font-mono mt-0.5">{po.poNumber}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70"><X className="h-4 w-4" /></button>
        </div>

        <div className="overflow-y-auto flex-1">
          {!fullPO ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {fullPO.items.map(item => {
                const remaining = item.orderedQty - item.receivedQty;
                if (remaining <= 0) return null;
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-white/80 truncate">{item.productName}</p>
                      <p className="text-[10px] font-mono text-white/35">{item.variantSku}{item.size ? ` · ${item.size}` : ""}</p>
                      <p className="text-[10px] text-white/25">Ordered: {item.orderedQty} · Already received: {item.receivedQty}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setItems(p => ({ ...p, [item.id]: Math.max(0, (p[item.id] ?? 0) - 1) }))}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-white hover:bg-white/08 transition-colors" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}>
                        -
                      </button>
                      <input type="number" min={0} max={remaining} value={items[item.id] ?? 0}
                        onChange={e => setItems(p => ({ ...p, [item.id]: Math.min(remaining, Math.max(0, parseInt(e.target.value) || 0)) }))}
                        className="w-14 text-center rounded-lg text-[14px] font-black text-white outline-none"
                        style={{ height: "32px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "'Barlow Condensed', sans-serif" }} />
                      <button onClick={() => setItems(p => ({ ...p, [item.id]: Math.min(remaining, (p[item.id] ?? 0) + 1) }))}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-white hover:bg-white/08 transition-colors" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}>
                        +
                      </button>
                      <button onClick={() => setItems(p => ({ ...p, [item.id]: remaining }))}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg text-white/50 hover:text-white transition-colors" style={{ background: "#1A1A1A" }}>
                        All
                      </button>
                    </div>
                  </div>
                );
              })}
              <div>
                <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Note (optional)</label>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Shipment from carrier X"
                  className="w-full rounded-xl px-4 text-[13px] text-white placeholder:text-white/20 outline-none"
                  style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              {err && <p className="text-[12px] font-semibold text-[#F87171]">{err}</p>}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-4 border-t shrink-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <button onClick={onClose} className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>Cancel</button>
          <button onClick={submit} disabled={busy}
            className="flex-1 h-10 rounded-xl text-[13px] font-black text-[#0D0D0D] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#F5C518" }}>
            {busy ? <span className="h-4 w-4 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" /> : <><ArrowDownToLine className="h-4 w-4" /> Receive</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create PO Modal ───────────────────────────────────────────────────────────

function CreatePOModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void; }) {
  const [supplierId,  setSupplierId]  = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [expectedAt,  setExpectedAt]  = useState("");
  const [notes,       setNotes]       = useState("");
  const [itemLines,   setItemLines]   = useState<{ sku: string; variantId: string; productName: string; qty: number; unitCost: number }[]>([]);
  const [skuSearch,   setSkuSearch]   = useState("");
  const [skuResults,  setSkuResults]  = useState<Variant[]>([]);
  const [suppliers,   setSuppliers]   = useState<Supplier[]>([]);
  const [warehouses,  setWarehouses]  = useState<Warehouse[]>([]);
  const [busy,        setBusy]        = useState(false);
  const [err,         setErr]         = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/suppliers?limit=100").then(r => r.ok ? r.json() : { suppliers: [] }),
      fetch("/api/admin/warehouses").then(r => r.ok ? r.json() : []),
    ]).then(([s, w]) => {
      setSuppliers(s.suppliers ?? []);
      setWarehouses(Array.isArray(w) ? w : []);
    });
  }, []);

  useEffect(() => {
    if (skuSearch.length < 2) { setSkuResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/admin/products?q=${encodeURIComponent(skuSearch)}&limit=20`)
        .then(r => r.ok ? r.json() : { products: [] })
        .then(d => {
          const variants: Variant[] = [];
          for (const p of d.products ?? []) {
            for (const v of p.variants ?? []) {
              variants.push({ id: v.id, sku: v.sku, size: v.size, color: v.color, price: Number(v.price), costPrice: v.costPrice ? Number(v.costPrice) : null, productId: p.id, product: { name: p.name } });
            }
          }
          setSkuResults(variants.slice(0, 10));
        });
    }, 300);
    return () => clearTimeout(t);
  }, [skuSearch]);

  function addLine(v: Variant) {
    if (itemLines.find(l => l.variantId === v.id)) return;
    setItemLines(prev => [...prev, { sku: v.sku, variantId: v.id, productName: v.product.name, qty: 1, unitCost: v.costPrice ?? 0 }]);
    setSkuSearch(""); setSkuResults([]);
  }

  function removeLine(idx: number) { setItemLines(prev => prev.filter((_, i) => i !== idx)); }

  const totalCost = itemLines.reduce((s, l) => s + l.qty * l.unitCost, 0);

  async function submit() {
    if (!itemLines.length) { setErr("Add at least one item"); return; }
    setErr(""); setBusy(true);
    try {
      const res = await fetch("/api/admin/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId:  supplierId  || undefined,
          warehouseId: warehouseId || undefined,
          expectedAt:  expectedAt  ? new Date(expectedAt).toISOString() : undefined,
          notes:       notes       || undefined,
          items: itemLines.map(l => ({ variantId: l.variantId, orderedQty: l.qty, unitCost: l.unitCost })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Failed"); setBusy(false); return; }
      onSuccess();
    } catch { setErr("Network error"); setBusy(false); }
  }

  function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
    return (
      <div>
        <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">{label}</label>
        <div className="relative">
          <select value={value} onChange={e => onChange(e.target.value)}
            className="w-full rounded-xl px-4 pr-10 text-[13px] font-semibold text-white outline-none appearance-none"
            style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}>
            <option value="">None</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-[620px] rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>Create Purchase Order</p>
          <button onClick={onClose} className="text-white/30 hover:text-white/70"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Supplier" value={supplierId} onChange={setSupplierId}
              options={suppliers.map(s => ({ value: s.id, label: s.companyName }))} />
            <Select label="Warehouse" value={warehouseId} onChange={setWarehouseId}
              options={warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.code})` }))} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Expected Delivery</label>
            <input type="date" value={expectedAt} onChange={e => setExpectedAt(e.target.value)}
              className="w-full rounded-xl px-4 text-[13px] text-white outline-none"
              style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", colorScheme: "dark" }} />
          </div>

          {/* SKU search */}
          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Add Items (search SKU / product)</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
              <input value={skuSearch} onChange={e => setSkuSearch(e.target.value)} placeholder="Type SKU or product name..."
                className="w-full rounded-xl pl-10 pr-4 text-[13px] text-white placeholder:text-white/20 outline-none"
                style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
            {skuResults.length > 0 && (
              <div className="mt-1 rounded-xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}>
                {skuResults.map(v => (
                  <button key={v.id} onClick={() => addLine(v)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/05 transition-colors">
                    <Package className="h-4 w-4 text-white/30 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-white/80 truncate">{v.product.name}</p>
                      <p className="text-[10px] font-mono text-white/35">{v.sku}{v.size ? ` · ${v.size}` : ""}{v.color ? ` · ${v.color}` : ""}</p>
                    </div>
                    <p className="text-[11px] text-white/40 shrink-0">{v.costPrice ? fmt(v.costPrice) : "No cost"}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item lines */}
          {itemLines.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Order Lines</p>
              {itemLines.map((line, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-white/80 truncate">{line.productName}</p>
                    <p className="text-[10px] font-mono text-white/35">{line.sku}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div>
                      <p className="text-[9px] text-white/30 mb-0.5">Qty</p>
                      <input type="number" min={1} value={line.qty}
                        onChange={e => setItemLines(prev => prev.map((l, j) => j === i ? { ...l, qty: Math.max(1, parseInt(e.target.value) || 1) } : l))}
                        className="w-14 text-center rounded-lg text-[13px] font-bold text-white outline-none"
                        style={{ height: "32px", background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                    <div>
                      <p className="text-[9px] text-white/30 mb-0.5">Unit Cost ₹</p>
                      <input type="number" min={0} step="0.01" value={line.unitCost}
                        onChange={e => setItemLines(prev => prev.map((l, j) => j === i ? { ...l, unitCost: parseFloat(e.target.value) || 0 } : l))}
                        className="w-20 text-center rounded-lg text-[13px] font-bold text-white outline-none"
                        style={{ height: "32px", background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                    <p className="text-[12px] font-bold text-white/50 w-16 text-right">{fmt(line.qty * line.unitCost)}</p>
                    <button onClick={() => removeLine(i)} className="text-white/25 hover:text-[#F87171] transition-colors ml-1"><X className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <p className="text-[13px] font-black text-white">Total: {fmt(totalCost)}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Internal notes..."
              className="w-full rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/20 outline-none resize-none"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>

          {err && <p className="text-[12px] font-semibold text-[#F87171]">{err}</p>}
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-4 border-t shrink-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <button onClick={onClose} className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>Cancel</button>
          <button onClick={submit} disabled={busy || !itemLines.length}
            className="flex-1 h-10 rounded-xl text-[13px] font-black text-[#0D0D0D] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#F5C518" }}>
            {busy ? <span className="h-4 w-4 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" /> : <><Check className="h-4 w-4" /> Create PO</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const STATUS_TABS: { value: POStatus | "ALL"; label: string }[] = [
  { value: "ALL",               label: "All"            },
  { value: "DRAFT",             label: "Draft"          },
  { value: "SENT",              label: "Sent"           },
  { value: "ACKNOWLEDGED",      label: "Acknowledged"   },
  { value: "PARTIALLY_RECEIVED",label: "Partly Received"},
  { value: "RECEIVED",          label: "Received"       },
  { value: "CANCELLED",         label: "Cancelled"      },
];

export default function PurchaseOrdersPage() {
  const [data, setData]           = useState<ApiData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [debouncedQ, setDQ]       = useState("");
  const [statusFilter, setStatus] = useState<POStatus | "ALL">("ALL");
  const [page, setPage]           = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [receiveTarget, setReceive] = useState<PORow | null>(null);

  useEffect(() => { const t = setTimeout(() => { setDQ(search); setPage(1); }, 350); return () => clearTimeout(t); }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (debouncedQ) params.set("q", debouncedQ);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    try {
      const res = await fetch(`/api/admin/purchase-orders?${params}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [page, debouncedQ, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(poId: string, status: POStatus) {
    await fetch(`/api/admin/purchase-orders/${poId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1300px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>Purchase Orders</h1>
          <p className="text-white/40 text-[13px]">Supplier POs · Receiving · Stock replenishment</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-black text-[#0D0D0D]"
            style={{ background: "#F5C518" }}>
            <Plus className="h-4 w-4" /> New PO
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-5">
        {(["DRAFT","SENT","ACKNOWLEDGED","PARTIALLY_RECEIVED","RECEIVED","CANCELLED"] as POStatus[]).map(s => (
          <button key={s} onClick={() => { setStatus(statusFilter === s ? "ALL" : s); setPage(1); }}
            className="rounded-xl p-3 text-left transition-all"
            style={{
              background: statusFilter === s ? STATUS_CONFIG[s].bg : "rgba(255,255,255,0.03)",
              border: `1px solid ${statusFilter === s ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)"}`,
            }}>
            <p className="text-[10px] text-white/30 mb-0.5">{STATUS_CONFIG[s].label}</p>
            <p className="font-black text-[18px] leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: STATUS_CONFIG[s].color }}>
              {data?.counts?.[s] ?? 0}
            </p>
          </button>
        ))}
      </div>

      {/* Filter + search */}
      <div className="flex items-center gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PO number or supplier..."
            className="w-full rounded-xl pl-10 pr-4 text-[13px] text-white placeholder:text-white/25 outline-none"
            style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }} />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30"><X className="h-4 w-4" /></button>}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {STATUS_TABS.slice(0, 4).map(({ value, label }) => (
            <button key={value} onClick={() => { setStatus(value); setPage(1); }}
              className="shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold whitespace-nowrap transition-all"
              style={{
                background: statusFilter === value ? "#F5C518" : "rgba(255,255,255,0.05)",
                color:      statusFilter === value ? "#0D0D0D"  : "rgba(255,255,255,0.45)",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="hidden lg:grid px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white/30 border-b"
          style={{ gridTemplateColumns: "140px 1fr 120px 100px 100px 110px 120px", borderColor: "rgba(255,255,255,0.05)" }}>
          <span>PO Number</span>
          <span>Supplier · Warehouse</span>
          <span>Items</span>
          <span className="text-right">Total Cost</span>
          <span>Status</span>
          <span>Expected</span>
          <span />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-7 w-7 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin" />
          </div>
        ) : !data?.pos.length ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Package className="h-10 w-10 text-white/10" />
            <p className="text-[13px] text-white/30">No purchase orders yet</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {data.pos.map(po => {
              const totalOrdered  = po.items.reduce((s, i) => s + i.orderedQty, 0);
              const totalReceived = po.items.reduce((s, i) => s + i.receivedQty, 0);
              const canReceive    = !["RECEIVED", "CANCELLED", "DRAFT"].includes(po.status);
              return (
                <div key={po.id} className="hidden lg:grid px-5 py-3.5 items-center gap-3"
                  style={{ gridTemplateColumns: "140px 1fr 120px 100px 100px 110px 120px" }}>
                  <p className="text-[12px] font-bold font-mono text-white/80">{po.poNumber}</p>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-white/70 truncate">{po.supplier?.companyName ?? "—"}</p>
                    {po.warehouse && <p className="text-[10px] text-white/30 truncate">{po.warehouse.name} · {po.warehouse.code}</p>}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-white/70">{po._count.items} lines</p>
                    <p className="text-[10px] text-white/35">{totalReceived}/{totalOrdered} units</p>
                    {totalOrdered > 0 && (
                      <div className="mt-1 h-1 rounded-full overflow-hidden w-16" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div className="h-full rounded-full" style={{ width: `${(totalReceived / totalOrdered) * 100}%`, background: "#4ADE80" }} />
                      </div>
                    )}
                  </div>
                  <p className="text-[13px] font-black text-white text-right" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{fmt(Number(po.totalCost))}</p>
                  <POStatusBadge status={po.status} />
                  <p className="text-[11px] text-white/35">{po.expectedAt ? fmtDate(po.expectedAt) : "—"}</p>
                  <div className="flex items-center gap-1.5 justify-end">
                    {canReceive && (
                      <button onClick={() => setReceive(po)}
                        className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-bold text-[#0D0D0D]"
                        style={{ background: "#F5C518" }}>
                        <ArrowDownToLine className="h-3 w-3" /> Receive
                      </button>
                    )}
                    {po.status === "DRAFT" && (
                      <button onClick={() => updateStatus(po.id, "SENT")}
                        className="flex h-7 px-2.5 rounded-lg text-[11px] font-bold text-white/50 hover:text-white items-center gap-1"
                        style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                        Send →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-[12px] text-white/35">{((page-1)*20)+1}–{Math.min(page*20, data.total)} of {data.total}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className={cn("flex h-8 w-8 items-center justify-center rounded-lg", page === 1 ? "text-white/20" : "text-white/50 hover:text-white hover:bg-white/08")}><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-[12px] font-semibold text-white/50">{page} / {data.pages}</span>
            <button onClick={() => setPage(p => Math.min(data.pages, p+1))} disabled={page === data.pages} className={cn("flex h-8 w-8 items-center justify-center rounded-lg", page === data.pages ? "text-white/20" : "text-white/50 hover:text-white hover:bg-white/08")}><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {showCreate  && <CreatePOModal onClose={() => setShowCreate(false)}  onSuccess={() => { setShowCreate(false);  load(); }} />}
      {receiveTarget && <ReceiveModal po={receiveTarget} onClose={() => setReceive(null)} onSuccess={() => { setReceive(null); load(); }} />}
    </div>
  );
}
