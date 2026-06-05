"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X, Package, RefreshCw, Download, Edit2, Boxes } from "lucide-react";

interface SearchProduct {
  id: string; name: string; slug: string; sport: string; isActive: boolean;
  images: { url: string }[];
  variants: { id: string; sku: string; size?: string; color?: string; price: number; mrp: number; stock: number; costPrice?: number; isActive: boolean }[];
  badges: { type: string }[];
  category: { name: string };
  supplier?: { companyName: string };
}

const SPORTS = ["CRICKET", "FOOTBALL", "GYM", "RUNNING", "RACKET", "COMBAT", "OTHER"];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}

export default function ProductSearchPage() {
  const [q, setQ]               = useState("");
  const [sku, setSku]           = useState("");
  const [sport, setSport]       = useState("");
  const [status, setStatus]     = useState("active");
  const [hasCost, setHasCost]   = useState("");
  const [hasImage, setHasImage] = useState("");
  const [minStock, setMinStock] = useState("");
  const [maxStock, setMaxStock] = useState("");
  const [sortBy, setSortBy]     = useState("createdAt");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage]         = useState(1);

  const [results, setResults]   = useState<SearchProduct[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [pages, setPages]       = useState(0);

  const debouncedQ   = useDebounce(q, 300);
  const debouncedSku = useDebounce(sku, 200);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25", sortBy });
      if (debouncedQ)   params.set("q", debouncedQ);
      if (debouncedSku) params.set("sku", debouncedSku);
      if (sport)        params.set("sport", sport);
      if (status)       params.set("status", status);
      if (hasCost)      params.set("hasCost", hasCost);
      if (hasImage)     params.set("hasImage", hasImage);
      if (minStock)     params.set("minStock", minStock);
      if (maxStock)     params.set("maxStock", maxStock);

      const res = await fetch(`/api/admin/products/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.products); setTotal(data.total); setPages(data.pages);
      }
    } finally { setLoading(false); }
  }, [debouncedQ, debouncedSku, sport, status, hasCost, hasImage, minStock, maxStock, page, sortBy]);

  useEffect(() => { search(); }, [search]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  function clearFilters() {
    setSku(""); setSport(""); setStatus("active"); setHasCost("");
    setHasImage(""); setMinStock(""); setMaxStock(""); setSortBy("createdAt");
  }

  const hasActiveFilters = sku || sport || status !== "active" || hasCost || hasImage || minStock || maxStock;

  const inp = "rounded-xl px-3 text-[13px] text-white outline-none transition-colors bg-[#1A1A1A] border border-white/08 h-9 focus:border-[#F5C518]/50";

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">
      <div className="mb-6">
        <h1 className="text-white font-black mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
          Product Search
        </h1>
        <p className="text-white/40 text-[13px]">Instant search across all products · SKU lookup · Advanced filters</p>
      </div>

      {/* Main search bar */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/30" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Search by name, team, description…"
            className="w-full pl-11 pr-4 h-12 rounded-2xl text-[14px] text-white outline-none transition-colors bg-[#1A1A1A] border border-white/08 focus:border-[#F5C518]/50"
          />
          {q && <button onClick={() => setQ("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"><X className="h-4 w-4" /></button>}
        </div>
        <div className="relative">
          <input value={sku} onChange={e => { setSku(e.target.value); setPage(1); }} placeholder="SKU lookup…"
            className="w-36 h-12 rounded-2xl px-4 text-[13px] text-white outline-none bg-[#1A1A1A] border border-white/08 focus:border-[#F5C518]/50 font-mono" />
        </div>
        <button onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-2 h-12 px-4 rounded-2xl text-[13px] font-semibold transition-all ${showFilters || hasActiveFilters ? "text-[#F5C518]" : "text-white/50"}`}
          style={{ background: showFilters || hasActiveFilters ? "rgba(245,197,24,0.1)" : "#1A1A1A", border: `1px solid ${showFilters || hasActiveFilters ? "rgba(245,197,24,0.3)" : "rgba(255,255,255,0.08)"}` }}>
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-[#F5C518]" />}
        </button>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="rounded-2xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <label className="block text-[9px] font-bold text-white/30 mb-1.5 uppercase tracking-widest">Sport</label>
            <select value={sport} onChange={e => { setSport(e.target.value); setPage(1); }} className={inp + " w-full"}>
              <option value="">All Sports</option>
              {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-white/30 mb-1.5 uppercase tracking-widest">Status</label>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className={inp + " w-full"}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-white/30 mb-1.5 uppercase tracking-widest">Cost Price</label>
            <select value={hasCost} onChange={e => { setHasCost(e.target.value); setPage(1); }} className={inp + " w-full"}>
              <option value="">All</option>
              <option value="missing">Missing cost price</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-white/30 mb-1.5 uppercase tracking-widest">Images</label>
            <select value={hasImage} onChange={e => { setHasImage(e.target.value); setPage(1); }} className={inp + " w-full"}>
              <option value="">All</option>
              <option value="missing">No images</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-white/30 mb-1.5 uppercase tracking-widest">Min Stock</label>
            <input type="number" value={minStock} onChange={e => { setMinStock(e.target.value); setPage(1); }}
              placeholder="0" className={inp + " w-full"} />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-white/30 mb-1.5 uppercase tracking-widest">Max Stock</label>
            <input type="number" value={maxStock} onChange={e => { setMaxStock(e.target.value); setPage(1); }}
              placeholder="9999" className={inp + " w-full"} />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-white/30 mb-1.5 uppercase tracking-widest">Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={inp + " w-full"}>
              <option value="createdAt">Newest first</option>
              <option value="name">Name A–Z</option>
              <option value="price">Price</option>
            </select>
          </div>
          <div className="flex items-end">
            {hasActiveFilters && (
              <button onClick={clearFilters} className="h-9 px-4 rounded-xl text-[12px] font-semibold text-white/40 hover:text-white transition-all w-full"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results meta */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] text-white/40">
          {loading ? "Searching…" : `${total.toLocaleString("en-IN")} result${total !== 1 ? "s" : ""}`}
        </p>
        {total > 0 && (
          <button onClick={() => { const p = new URLSearchParams(); if (q) p.set("q", q); if (sport) p.set("sport", sport); if (status) p.set("status", status); window.open(`/api/admin/products/export?type=products&${p}`, "_blank"); }}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-white/40 hover:text-white transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        )}
      </div>

      {/* Results */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        {loading && results.length === 0 ? (
          <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-white/20" /></div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-white/25">
            <Package className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-[14px] font-semibold">No products found</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {results.map(p => {
              const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
              const minPrice   = p.variants.length ? Math.min(...p.variants.map(v => Number(v.price))) : 0;
              return (
                <div key={p.id} className="px-5 py-4 hover:bg-white/[0.015] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden" style={{ background: "#2A2A2A" }}>
                      {p.images[0] ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" /> : <Package className="h-4 w-4 m-3 text-white/20" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-white truncate">{p.name}</p>
                        {p.badges.map(b => (
                          <span key={b.type} className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-[#F5C518]/15 text-[#F5C518]">{b.type}</span>
                        ))}
                        {!p.isActive && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-[#F87171]/12 text-[#F87171]">INACTIVE</span>}
                      </div>
                      <p className="text-[10px] text-white/30">{p.category.name} · {p.sport} {p.supplier ? `· ${p.supplier.companyName}` : ""}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-[12px] font-bold text-white">₹{minPrice.toLocaleString("en-IN")}</p>
                        <p className={`text-[10px] ${totalStock === 0 ? "text-[#F87171]" : "text-white/30"}`}>{totalStock} units</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/products/${p.id}/edit`} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-[#F5C518] transition-all">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>
                        <Link href={`/admin/products/${p.id}/variants`} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-[#A78BFA] transition-all">
                          <Boxes className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* SKU chips */}
                  {p.variants.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.variants.slice(0, 8).map(v => (
                        <div key={v.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${v.stock === 0 ? "bg-[#F87171]/08" : "bg-white/04"}`}
                          style={{ border: `1px solid ${v.stock === 0 ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                          <span className="text-[10px] font-mono text-white/50">{v.sku}</span>
                          {v.size && <span className="text-[9px] text-white/25">{v.size}</span>}
                          <span className={`text-[10px] font-bold ${v.stock === 0 ? "text-[#F87171]" : "text-white/40"}`}>{v.stock}</span>
                        </div>
                      ))}
                      {p.variants.length > 8 && <span className="text-[10px] text-white/25 self-center">+{p.variants.length - 8} more</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="h-9 px-4 rounded-xl text-[12px] font-semibold text-white/50 hover:text-white disabled:opacity-30"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}>← Prev</button>
          <span className="text-[12px] text-white/40">Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            className="h-9 px-4 rounded-xl text-[12px] font-semibold text-white/50 hover:text-white disabled:opacity-30"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}>Next →</button>
        </div>
      )}
    </div>
  );
}
