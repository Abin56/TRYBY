"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Search, CheckSquare, Square, RefreshCw,
  Package, ToggleLeft, ToggleRight, Layers, DollarSign,
  Boxes, Home, Archive, ChevronDown,
} from "lucide-react";

interface Category { id: string; name: string; }
interface Product {
  id: string; name: string; slug: string; sport: string;
  isActive: boolean; showOnHomepage: boolean; isFeatured: boolean;
  images: { url: string }[];
  variants: { price: number; stock: number }[];
  category: { name: string };
}

const SPORTS = ["CRICKET", "FOOTBALL", "GYM", "RUNNING", "RACKET", "COMBAT", "OTHER"];
const inp = "rounded-xl px-3 text-[13px] text-white outline-none transition-colors bg-[#1A1A1A] border border-white/08 h-10 focus:border-[#F5C518]/50";

export default function BulkProductEditorPage() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [loading, setLoading]       = useState(true);
  const [applying, setApplying]     = useState(false);
  const [result, setResult]         = useState<string>("");

  // Filters
  const [q, setQ]           = useState("");
  const [sport, setSport]   = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage]     = useState(1);
  const [total, setTotal]   = useState(0);

  // Actions
  const [action, setAction]         = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priceMode, setPriceMode]   = useState<"percent_increase" | "percent_decrease" | "fixed_set">("percent_increase");
  const [priceValue, setPriceValue] = useState("");
  const [stockValue, setStockValue] = useState("");
  const [showHomepage, setShowHomepage] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (q)      params.set("q", q);
      if (sport)  params.set("sport", sport);
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setTotal(data.total);
      }
    } finally { setLoading(false); }
  }, [q, sport, status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetch("/api/admin/categories").then(r => r.json()).then(setCategories).catch(() => {}); }, []);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === products.length) setSelected(new Set());
    else setSelected(new Set(products.map(p => p.id)));
  }

  async function applyAction() {
    if (!action || selected.size === 0) return;
    setApplying(true);
    setResult("");
    try {
      let body: Record<string, unknown> = { action, productIds: Array.from(selected) };

      if (action === "set_category") {
        if (!categoryId) { setResult("Select a category first"); setApplying(false); return; }
        body.categoryId = categoryId;
      } else if (action === "price_adjust") {
        const v = parseFloat(priceValue);
        if (isNaN(v) || v <= 0) { setResult("Enter a valid value"); setApplying(false); return; }
        body.mode  = priceMode;
        body.value = v;
      } else if (action === "stock_set") {
        const s = parseInt(stockValue);
        if (isNaN(s) || s < 0) { setResult("Enter valid stock"); setApplying(false); return; }
        body.stock = s;
      } else if (action === "set_homepage") {
        body.showOnHomepage = showHomepage;
      }

      const res = await fetch("/api/admin/products/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`Done — ${data.affected} item${data.affected !== 1 ? "s" : ""} updated`);
        setSelected(new Set());
        load();
      } else {
        setResult(data.error?.message ?? data.error ?? "Failed");
      }
    } finally { setApplying(false); }
  }

  const pages = Math.ceil(total / 30);
  const allSelected = selected.size > 0 && selected.size === products.length;

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px", letterSpacing: "-0.01em" }}>
            Bulk Product Editor
          </h1>
          <p className="text-white/40 text-[12px]">Select products then apply an action</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* Product list */}
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
              <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
                placeholder="Search products..." className={inp + " w-full pl-9"} />
            </div>
            <select value={sport} onChange={e => { setSport(e.target.value); setPage(1); }} className={inp}>
              <option value="">All Sports</option>
              {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className={inp}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Select all bar */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={toggleAll} className="flex items-center gap-2 text-[12px] font-semibold text-white/60 hover:text-white transition-colors">
              {allSelected ? <CheckSquare className="h-4 w-4 text-[#F5C518]" /> : <Square className="h-4 w-4" />}
              {allSelected ? "Deselect All" : "Select All on Page"}
            </button>
            {selected.size > 0 && (
              <span className="text-[12px] font-bold text-[#F5C518] ml-auto">
                {selected.size} selected
              </span>
            )}
          </div>

          {/* Product rows */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            {loading ? (
              <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-white/20" /></div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-white/25">
                <Package className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-[13px]">No products found</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {products.map(p => {
                  const isSelected = selected.has(p.id);
                  const minPrice = p.variants.length ? Math.min(...p.variants.map(v => Number(v.price))) : 0;
                  const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleSelect(p.id)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-white/[0.02]"
                      style={{ background: isSelected ? "rgba(245,197,24,0.04)" : undefined }}
                    >
                      {isSelected
                        ? <CheckSquare className="h-4 w-4 text-[#F5C518] shrink-0" />
                        : <Square className="h-4 w-4 text-white/20 shrink-0" />
                      }
                      <div className="h-9 w-9 shrink-0 rounded-lg overflow-hidden" style={{ background: "#2A2A2A" }}>
                        {p.images[0] ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" /> : <Package className="h-4 w-4 text-white/20 m-auto mt-2.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-white/30">{p.category.name} · {p.sport}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-[12px] font-bold text-white">₹{minPrice.toLocaleString("en-IN")}</p>
                          <p className={`text-[10px] ${totalStock === 0 ? "text-[#F87171]" : "text-white/30"}`}>{totalStock} units</p>
                        </div>
                        {p.isActive ? <ToggleRight className="h-4 w-4 text-[#4ADE80]" /> : <ToggleLeft className="h-4 w-4 text-white/20" />}
                        {p.showOnHomepage && <Home className="h-3.5 w-3.5 text-[#F5C518]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
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

        {/* Action panel */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-white font-black text-[14px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>
              BULK ACTION
            </h2>

            <div>
              <label className="block text-[10px] font-bold text-white/35 mb-1.5 uppercase tracking-widest">Action</label>
              <div className="relative">
                <select value={action} onChange={e => setAction(e.target.value)} className={inp + " w-full pr-8 appearance-none"}>
                  <option value="">Select action…</option>
                  <optgroup label="Visibility">
                    <option value="activate">Activate products</option>
                    <option value="deactivate">Deactivate products</option>
                    <option value="archive">Archive products</option>
                    <option value="restore">Restore products</option>
                    <option value="set_homepage">Set homepage visibility</option>
                  </optgroup>
                  <optgroup label="Catalogue">
                    <option value="set_category">Change category</option>
                  </optgroup>
                  <optgroup label="Pricing & Stock">
                    <option value="price_adjust">Adjust prices</option>
                    <option value="stock_set">Set stock to fixed value</option>
                  </optgroup>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
              </div>
            </div>

            {/* Conditional inputs */}
            {action === "set_category" && (
              <div>
                <label className="block text-[10px] font-bold text-white/35 mb-1.5 uppercase tracking-widest">Category</label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inp + " w-full"}>
                  <option value="">Select category…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {action === "price_adjust" && (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-white/35 mb-1.5 uppercase tracking-widest">Adjustment</label>
                <select value={priceMode} onChange={e => setPriceMode(e.target.value as typeof priceMode)} className={inp + " w-full"}>
                  <option value="percent_increase">Increase by %</option>
                  <option value="percent_decrease">Decrease by %</option>
                  <option value="fixed_set">Set fixed price ₹</option>
                </select>
                <input type="number" value={priceValue} onChange={e => setPriceValue(e.target.value)}
                  placeholder={priceMode === "fixed_set" ? "Price in ₹" : "Percentage (e.g. 10)"}
                  className={inp + " w-full"} />
                {priceValue && !isNaN(parseFloat(priceValue)) && (
                  <p className="text-[11px] text-white/30">
                    {priceMode === "percent_increase" ? `Prices will increase by ${priceValue}%` :
                     priceMode === "percent_decrease" ? `Prices will decrease by ${priceValue}%` :
                     `All prices will be set to ₹${priceValue}`}
                  </p>
                )}
              </div>
            )}

            {action === "stock_set" && (
              <div>
                <label className="block text-[10px] font-bold text-white/35 mb-1.5 uppercase tracking-widest">Stock Value</label>
                <input type="number" value={stockValue} onChange={e => setStockValue(e.target.value)}
                  placeholder="Units (e.g. 50)" className={inp + " w-full"} min="0" />
                <p className="text-[10px] text-white/25 mt-1">Sets stock for ALL variants of selected products</p>
              </div>
            )}

            {action === "set_homepage" && (
              <div>
                <label className="block text-[10px] font-bold text-white/35 mb-1.5 uppercase tracking-widest">Homepage</label>
                <div className="flex gap-2">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => setShowHomepage(v)}
                      className="flex-1 h-9 rounded-xl text-[12px] font-semibold transition-all"
                      style={{
                        background: showHomepage === v ? (v ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.1)") : "rgba(255,255,255,0.04)",
                        border: `1px solid ${showHomepage === v ? (v ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)") : "rgba(255,255,255,0.08)"}`,
                        color: showHomepage === v ? (v ? "#4ADE80" : "#F87171") : "rgba(255,255,255,0.4)",
                      }}>
                      {v ? "Show" : "Hide"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Apply button */}
            <button
              onClick={applyAction}
              disabled={applying || selected.size === 0 || !action}
              className="w-full h-11 rounded-xl font-black text-[14px] text-[#0D0D0D] transition-all disabled:opacity-40"
              style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {applying ? "Applying…" : `Apply to ${selected.size} product${selected.size !== 1 ? "s" : ""}`}
            </button>

            {result && (
              <div className={`rounded-xl px-4 py-3 text-[12px] font-semibold ${result.startsWith("Done") ? "text-[#4ADE80]" : "text-[#F87171]"}`}
                style={{ background: result.startsWith("Done") ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)" }}>
                {result}
              </div>
            )}
          </div>

          {/* Action icons */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: ToggleRight, label: "Activate",   action: "activate",   color: "#4ADE80" },
              { icon: ToggleLeft,  label: "Deactivate", action: "deactivate", color: "#F87171" },
              { icon: Archive,     label: "Archive",    action: "archive",    color: "#FB923C" },
              { icon: Layers,      label: "Category",   action: "set_category", color: "#A78BFA" },
              { icon: DollarSign,  label: "Price",      action: "price_adjust", color: "#F5C518" },
              { icon: Boxes,       label: "Stock",      action: "stock_set",   color: "#38BDF8" },
            ].map(({ icon: Icon, label, action: a, color }) => (
              <button key={a} onClick={() => setAction(a)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                style={{
                  background: action === a ? `${color}12` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${action === a ? `${color}30` : "rgba(255,255,255,0.06)"}`,
                }}>
                <Icon className="h-4 w-4" style={{ color: action === a ? color : "rgba(255,255,255,0.3)" }} />
                <span className="text-[10px] font-bold" style={{ color: action === a ? color : "rgba(255,255,255,0.3)" }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
