"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Archive, RotateCcw, Search, Package, RefreshCw } from "lucide-react";

interface ArchivedProduct {
  id: string; name: string; slug: string; sport: string;
  updatedAt: string;
  images: { url: string }[];
  variants: { price: number; stock: number }[];
  category: { name: string };
}

export default function ArchivePage() {
  const [products, setProducts] = useState<ArchivedProduct[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [q, setQ]               = useState("");
  const [page, setPage]         = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState(false);
  const [result, setResult]       = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/products/archive?${params}`);
      if (res.ok) { const d = await res.json(); setProducts(d.products); setTotal(d.total); }
    } finally { setLoading(false); }
  }, [q, page]);

  useEffect(() => { load(); }, [load]);

  function toggle(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function doAction(action: "archive" | "restore") {
    if (!selected.size) return;
    setRestoring(true); setResult("");
    const res = await fetch("/api/admin/products/archive", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, productIds: Array.from(selected) }),
    });
    const data = await res.json();
    if (res.ok) {
      setResult(`${data.affected} product${data.affected !== 1 ? "s" : ""} ${action === "restore" ? "restored" : "archived"}`);
      setSelected(new Set());
      load();
    } else { setResult(data.error ?? "Failed"); }
    setRestoring(false);
  }

  const pages = Math.ceil(total / 20);

  return (
    <div className="p-6 lg:p-8 max-w-[900px]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px", letterSpacing: "-0.01em" }}>
            Product Archive
          </h1>
          <p className="text-white/40 text-[12px]">{total} inactive products · select to restore or permanently archive</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search archived…"
            className="w-full pl-9 h-10 rounded-xl text-[13px] text-white outline-none bg-[#1A1A1A] border border-white/08" />
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-white/60">{selected.size} selected</span>
            <button onClick={() => doAction("restore")} disabled={restoring}
              className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-[12px] font-black text-[#0D0D0D] disabled:opacity-40"
              style={{ background: "#4ADE80" }}>
              <RotateCcw className="h-3.5 w-3.5" />
              {restoring ? "…" : "Restore"}
            </button>
          </div>
        )}
      </div>

      {result && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-[12px] font-semibold ${result.includes("restored") || result.includes("archived") ? "text-[#4ADE80]" : "text-[#F87171]"}`}
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)" }}>
          {result}
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        {loading ? (
          <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-white/20" /></div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-white/25">
            <Archive className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-[14px] font-semibold">Archive is empty</p>
            <p className="text-[11px] mt-1">Deactivated products appear here</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {products.map(p => {
              const isSelected = selected.has(p.id);
              const minPrice = p.variants.length ? Math.min(...p.variants.map(v => Number(v.price))) : 0;
              const ts = new Date(p.updatedAt);
              return (
                <div key={p.id} onClick={() => toggle(p.id)}
                  className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-all"
                  style={{ background: isSelected ? "rgba(245,197,24,0.03)" : undefined }}>
                  <div className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-all ${isSelected ? "border-[#F5C518] bg-[#F5C518]" : "border-white/20"}`}>
                    {isSelected && <span className="text-[#0D0D0D] text-[9px] font-black">✓</span>}
                  </div>
                  <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden" style={{ background: "#2A2A2A" }}>
                    {p.images[0] ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" /> : <Package className="h-4 w-4 m-3 text-white/20" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{p.name}</p>
                    <p className="text-[10px] text-white/30">{p.category.name} · {p.sport}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-bold text-white/60">₹{minPrice.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-white/25">{ts.toLocaleDateString("en-IN")}</p>
                  </div>
                  <Link href={`/admin/products/${p.id}/edit`} onClick={e => e.stopPropagation()}
                    className="shrink-0 h-8 px-3 rounded-lg text-[11px] font-semibold text-white/40 hover:text-[#F5C518] transition-all">
                    Edit
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="h-9 px-4 rounded-xl text-[12px] font-semibold text-white/50 hover:text-white disabled:opacity-30 transition-all"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}>← Prev</button>
          <span className="text-[12px] text-white/40">Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            className="h-9 px-4 rounded-xl text-[12px] font-semibold text-white/50 hover:text-white disabled:opacity-30 transition-all"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}>Next →</button>
        </div>
      )}
    </div>
  );
}
