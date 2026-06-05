"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Search, CheckSquare, Square, RefreshCw, Package, Save } from "lucide-react";

interface Variant {
  id: string; sku: string; size?: string; color?: string;
  price: number; mrp: number; costPrice?: number; stock: number; isActive: boolean;
  productId: string; productName: string; productImage?: string;
}

export default function BulkVariantEditorPage() {
  const [variants, setVariants]   = useState<Variant[]>([]);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [loading, setLoading]     = useState(true);
  const [applying, setApplying]   = useState(false);
  const [result, setResult]       = useState("");
  const [q, setQ]                 = useState("");
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);

  // Bulk edit fields
  const [editStock, setEditStock]     = useState("");
  const [editCost, setEditCost]       = useState("");
  const [editPrice, setEditPrice]     = useState("");
  const [editMrp, setEditMrp]         = useState("");
  const [editActive, setEditActive]   = useState<string>("");
  const [editNote, setEditNote]       = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "40" });
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/products?${params}&limit=40`);
      if (!res.ok) return;
      const data = await res.json();
      setTotal(data.total);
      // Flatten products into variants
      const flat: Variant[] = [];
      for (const p of data.products) {
        for (const v of p.variants) {
          flat.push({
            ...v,
            productId:    p.id,
            productName:  p.name,
            productImage: p.images?.[0]?.url,
          });
        }
      }
      setVariants(flat);
    } finally { setLoading(false); }
  }, [q, page]);

  useEffect(() => { load(); }, [load]);

  function toggle(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleAll() {
    if (selected.size === variants.length) setSelected(new Set());
    else setSelected(new Set(variants.map(v => v.id)));
  }

  async function apply() {
    if (!selected.size) return;
    const payload: Record<string, unknown> = { variantIds: Array.from(selected) };
    if (editStock !== "")  payload.stock     = parseInt(editStock);
    if (editCost  !== "")  payload.costPrice  = parseFloat(editCost);
    if (editPrice !== "")  payload.price      = parseFloat(editPrice);
    if (editMrp   !== "")  payload.mrp        = parseFloat(editMrp);
    if (editActive !== "") payload.isActive   = editActive === "true";
    if (editNote)          payload.note       = editNote;

    if (Object.keys(payload).length === 1) { setResult("Select at least one field to update"); return; }

    setApplying(true); setResult("");
    try {
      const res = await fetch("/api/admin/products/bulk-variants", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`Updated ${data.affected} variant${data.affected !== 1 ? "s" : ""}`);
        setSelected(new Set());
        setEditStock(""); setEditCost(""); setEditPrice(""); setEditMrp(""); setEditActive(""); setEditNote("");
        load();
      } else { setResult(data.error?.message ?? data.error ?? "Failed"); }
    } finally { setApplying(false); }
  }

  // Margin preview for selected
  const selectedVariants = variants.filter(v => selected.has(v.id));
  const avgMargin = selectedVariants.length
    ? selectedVariants.reduce((s, v) => {
        const p = editPrice ? parseFloat(editPrice) : Number(v.price);
        const c = editCost  ? parseFloat(editCost)  : Number(v.costPrice ?? 0);
        return s + (p > 0 ? ((p - c) / p) * 100 : 0);
      }, 0) / selectedVariants.length
    : null;

  const inp = "rounded-xl px-3 text-[13px] text-white outline-none bg-[#1A1A1A] border border-white/08 h-9 focus:border-[#F5C518]/50 w-full";

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px", letterSpacing: "-0.01em" }}>
            Bulk Variant Editor
          </h1>
          <p className="text-white/40 text-[12px]">Select variants then update stock, cost price, or status together</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        <div className="space-y-3">
          {/* Search + select bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
              <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search products…"
                className="w-full pl-9 h-10 rounded-xl text-[13px] text-white outline-none bg-[#1A1A1A] border border-white/08" />
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={toggleAll} className="flex items-center gap-2 text-[12px] font-semibold text-white/60 hover:text-white">
              {selected.size === variants.length && variants.length > 0
                ? <CheckSquare className="h-4 w-4 text-[#F5C518]" />
                : <Square className="h-4 w-4" />}
              {selected.size === variants.length && variants.length > 0 ? "Deselect All" : "Select All on Page"}
            </button>
            {selected.size > 0 && <span className="text-[12px] font-bold text-[#F5C518] ml-auto">{selected.size} selected</span>}
          </div>

          {/* Variant list */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            {loading ? (
              <div className="flex justify-center py-10"><RefreshCw className="h-6 w-6 animate-spin text-white/20" /></div>
            ) : variants.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-white/25">
                <Package className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-[13px]">No variants found</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <div className="grid px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-white/20"
                  style={{ gridTemplateColumns: "28px 36px 1fr 70px 70px 70px 60px 60px" }}>
                  <span />
                  <span />
                  <span>SKU / Product</span>
                  <span className="text-center">Stock</span>
                  <span className="text-center">Price</span>
                  <span className="text-center">Cost</span>
                  <span className="text-center">Margin</span>
                  <span className="text-center">Status</span>
                </div>
                {variants.map(v => {
                  const isSelected = selected.has(v.id);
                  const margin = Number(v.costPrice) > 0 && Number(v.price) > 0
                    ? ((Number(v.price) - Number(v.costPrice)) / Number(v.price) * 100).toFixed(0)
                    : null;
                  return (
                    <div key={v.id} onClick={() => toggle(v.id)}
                      className="grid items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-white/[0.02] transition-all"
                      style={{ gridTemplateColumns: "28px 36px 1fr 70px 70px 70px 60px 60px",
                        background: isSelected ? "rgba(245,197,24,0.04)" : undefined }}>
                      {isSelected
                        ? <CheckSquare className="h-4 w-4 text-[#F5C518]" />
                        : <Square className="h-4 w-4 text-white/15" />}
                      <div className="h-8 w-8 rounded-lg overflow-hidden shrink-0" style={{ background: "#2A2A2A" }}>
                        {v.productImage ? <img src={v.productImage} alt="" className="w-full h-full object-cover" /> : <Package className="h-3.5 w-3.5 m-2 text-white/20" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-mono font-semibold text-white/70">{v.sku}</p>
                        <p className="text-[10px] text-white/30 truncate">{v.productName}{v.size ? ` · ${v.size}` : ""}{v.color ? ` / ${v.color}` : ""}</p>
                      </div>
                      <p className={`text-[12px] font-bold text-center ${v.stock === 0 ? "text-[#F87171]" : v.stock <= 5 ? "text-[#FB923C]" : "text-white"}`}>{v.stock}</p>
                      <p className="text-[11px] text-white/60 text-center">₹{Number(v.price).toLocaleString("en-IN")}</p>
                      <p className="text-[11px] text-white/40 text-center">{Number(v.costPrice) > 0 ? `₹${Number(v.costPrice)}` : "—"}</p>
                      <p className={`text-[11px] font-bold text-center ${margin ? (parseInt(margin) > 30 ? "text-[#4ADE80]" : parseInt(margin) > 15 ? "text-[#F5C518]" : "text-[#F87171]") : "text-white/20"}`}>
                        {margin ? `${margin}%` : "—"}
                      </p>
                      <div className="flex justify-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${v.isActive ? "bg-[#4ADE80]/10 text-[#4ADE80]" : "bg-[#F87171]/10 text-[#F87171]"}`}>
                          {v.isActive ? "On" : "Off"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Edit panel */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-white font-black text-[14px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>
              UPDATE FIELDS
            </h2>
            <p className="text-[10px] text-white/30 -mt-2">Leave blank to keep existing value</p>

            {[
              { label: "Stock",      value: editStock,  set: setEditStock,  placeholder: "e.g. 50",   type: "number" },
              { label: "Cost Price ₹", value: editCost, set: setEditCost,   placeholder: "e.g. 600",  type: "number" },
              { label: "Price ₹",    value: editPrice,  set: setEditPrice,  placeholder: "e.g. 1299", type: "number" },
              { label: "MRP ₹",      value: editMrp,    set: setEditMrp,    placeholder: "e.g. 1799", type: "number" },
            ].map(({ label, value, set, placeholder, type }) => (
              <div key={label}>
                <label className="block text-[10px] font-bold text-white/35 mb-1.5 uppercase tracking-widest">{label}</label>
                <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder} className={inp} />
              </div>
            ))}

            <div>
              <label className="block text-[10px] font-bold text-white/35 mb-1.5 uppercase tracking-widest">Status</label>
              <div className="flex gap-2">
                {[["", "Keep"], ["true", "Active"], ["false", "Inactive"]].map(([v, label]) => (
                  <button key={v} onClick={() => setEditActive(v)}
                    className="flex-1 h-9 rounded-xl text-[11px] font-semibold transition-all"
                    style={{
                      background: editActive === v ? "rgba(245,197,24,0.1)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${editActive === v ? "rgba(245,197,24,0.3)" : "rgba(255,255,255,0.08)"}`,
                      color: editActive === v ? "#F5C518" : "rgba(255,255,255,0.35)",
                    }}>{label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/35 mb-1.5 uppercase tracking-widest">Note (optional)</label>
              <input value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="Reason for change…" className={inp} />
            </div>

            {/* Margin preview */}
            {avgMargin !== null && (
              <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p className="text-[10px] text-white/30 mb-0.5">Avg Margin Preview</p>
                <p className={`text-[20px] font-black ${avgMargin > 30 ? "text-[#4ADE80]" : avgMargin > 15 ? "text-[#F5C518]" : "text-[#F87171]"}`}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {avgMargin.toFixed(1)}%
                </p>
              </div>
            )}

            <button onClick={apply} disabled={applying || selected.size === 0}
              className="w-full h-11 rounded-xl flex items-center justify-center gap-2 font-black text-[14px] text-[#0D0D0D] transition-all disabled:opacity-40"
              style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif" }}>
              {applying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {applying ? "Updating…" : `Update ${selected.size} variant${selected.size !== 1 ? "s" : ""}`}
            </button>

            {result && (
              <div className={`rounded-xl px-4 py-3 text-[12px] font-semibold ${result.startsWith("Updated") ? "text-[#4ADE80]" : "text-[#F87171]"}`}
                style={{ background: result.startsWith("Updated") ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)" }}>
                {result}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
