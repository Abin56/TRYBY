"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Star, GripVertical, RefreshCw, Home, Package, ToggleLeft, ToggleRight } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  sport: string;
  isFeatured: boolean;
  showOnHomepage: boolean;
  homepageSortOrder: number;
  images: { url: string; isPrimary: boolean }[];
  variants: { price: number }[];
}

export default function FeaturedProductsPage() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [featured, setFeatured]   = useState<Product[]>([]);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products?limit=100&status=active");
      if (!res.ok) return;
      const data = await res.json();
      const all: Product[] = data.products;
      setProducts(all);
      setFeatured(all.filter(p => p.isFeatured).sort((a, b) => a.homepageSortOrder - b.homepageSortOrder));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleFeatured(product: Product) {
    setSaving(product.id);
    const newVal = !product.isFeatured;
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: newVal }),
      });
      if (!res.ok) return;
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isFeatured: newVal } : p));
      setFeatured(prev =>
        newVal
          ? [...prev, { ...product, isFeatured: true }].sort((a, b) => a.homepageSortOrder - b.homepageSortOrder)
          : prev.filter(p => p.id !== product.id)
      );
    } finally { setSaving(null); }
  }

  async function toggleHomepage(product: Product) {
    setSaving(product.id + "_hp");
    const newVal = !product.showOnHomepage;
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnHomepage: newVal }),
      });
      if (!res.ok) return;
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, showOnHomepage: newVal } : p));
      setFeatured(prev => prev.map(p => p.id === product.id ? { ...p, showOnHomepage: newVal } : p));
    } finally { setSaving(null); }
  }

  async function updateSortOrder(productId: string, order: number) {
    await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homepageSortOrder: order }),
    });
  }

  function moveFeatured(idx: number, dir: -1 | 1) {
    const newList = [...featured];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= newList.length) return;
    [newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]];
    newList.forEach((p, i) => { p.homepageSortOrder = i; });
    setFeatured(newList);
    // Persist new sort orders
    newList.forEach((p, i) => updateSortOrder(p.id, i));
  }

  const notFeatured = products.filter(p =>
    !p.isFeatured &&
    (search === "" || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-white/20" /></div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px", letterSpacing: "-0.01em" }}>
            Featured Products
          </h1>
          <p className="text-white/40 text-[12px]">{featured.length} featured · drag to reorder · shown on homepage sections</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-5">

        {/* Featured list (ordered) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-[#F5C518]" />
            <h2 className="text-white font-black text-[15px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Featured ({featured.length})
            </h2>
          </div>

          {featured.length === 0 && (
            <div className="rounded-2xl p-8 flex flex-col items-center" style={{ border: "1.5px dashed rgba(255,255,255,0.08)" }}>
              <Star className="h-8 w-8 text-white/15 mb-2" />
              <p className="text-[13px] text-white/30">No featured products yet</p>
              <p className="text-[11px] text-white/20 mt-1">Add products from the panel on the right</p>
            </div>
          )}

          {featured.map((product, idx) => (
            <div key={product.id} className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: "#1A1A1A", border: "1px solid rgba(245,197,24,0.15)" }}>

              {/* Sort handle */}
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => moveFeatured(idx, -1)}
                  disabled={idx === 0}
                  className="h-5 w-5 flex items-center justify-center rounded text-white/25 hover:text-white/60 disabled:opacity-20 transition-colors"
                >
                  ▲
                </button>
                <span className="text-[10px] text-white/25 font-mono text-center">{idx + 1}</span>
                <button
                  onClick={() => moveFeatured(idx, 1)}
                  disabled={idx === featured.length - 1}
                  className="h-5 w-5 flex items-center justify-center rounded text-white/25 hover:text-white/60 disabled:opacity-20 transition-colors"
                >
                  ▼
                </button>
              </div>

              {/* Image */}
              <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden" style={{ background: "#2A2A2A" }}>
                {product.images[0] ? (
                  <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-white/20" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{product.name}</p>
                <p className="text-[11px] text-white/30">{product.sport}</p>
              </div>

              {/* Homepage toggle */}
              <button
                onClick={() => toggleHomepage(product)}
                disabled={saving === product.id + "_hp"}
                className="flex items-center gap-1.5 text-[11px] font-semibold shrink-0 transition-opacity disabled:opacity-50"
                title={product.showOnHomepage ? "Remove from homepage" : "Show on homepage"}
              >
                {product.showOnHomepage ? (
                  <><Home className="h-3.5 w-3.5 text-[#4ADE80]" /><span className="text-[#4ADE80]">Homepage</span></>
                ) : (
                  <><Home className="h-3.5 w-3.5 text-white/20" /><span className="text-white/25">Hidden</span></>
                )}
              </button>

              {/* Unfeature */}
              <button
                onClick={() => toggleFeatured(product)}
                disabled={saving === product.id}
                className="flex h-8 items-center gap-1.5 px-3 rounded-xl text-[11px] font-bold text-[#F87171] transition-all disabled:opacity-50 shrink-0"
                style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Not featured — search + add */}
        <div className="space-y-3">
          <h2 className="text-white font-black text-[15px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Add to Featured
          </h2>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-xl px-4 text-[13px] text-white placeholder:text-white/25 outline-none"
            style={{ height: "40px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
          />

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {notFeatured.length === 0 && (
              <p className="text-[12px] text-white/30 py-4 text-center">All active products are featured</p>
            )}
            {notFeatured.map(product => (
              <div key={product.id} className="rounded-xl p-3 flex items-center gap-3"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="h-9 w-9 shrink-0 rounded-lg overflow-hidden" style={{ background: "#2A2A2A" }}>
                  {product.images[0] ? (
                    <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-4 w-4 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-white truncate">{product.name}</p>
                  <p className="text-[10px] text-white/30">{product.sport}</p>
                </div>
                <button
                  onClick={() => toggleFeatured(product)}
                  disabled={saving === product.id}
                  className="flex items-center gap-1 h-7 px-3 rounded-lg text-[11px] font-bold text-[#0D0D0D] disabled:opacity-50 shrink-0"
                  style={{ background: "#F5C518" }}
                >
                  <Star className="h-3 w-3" /> Feature
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
