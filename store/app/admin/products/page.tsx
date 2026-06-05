"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Edit2, Trash2, Eye, Package, ToggleLeft, ToggleRight, RefreshCw, Upload, Star, Layers, Boxes } from "lucide-react";

interface Variant { id: string; price: number; mrp: number; stock: number; size?: string; }
interface Category { id: string; name: string; }
interface Product {
  id: string;
  name: string;
  slug: string;
  sport: string;
  isActive: boolean;
  isFeatured: boolean;
  totalSoldCount: number;
  variants: Variant[];
  images: { url: string; isPrimary: boolean }[];
  category: Category;
}

const SPORT_LABEL: Record<string, string> = {
  CRICKET: "Cricket", FOOTBALL: "Football", GYM: "Gym",
  RUNNING: "Running", RACKET: "Racket", COMBAT: "Combat", OTHER: "Other",
};

export default function AdminProductsPage() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [sport, setSport]         = useState("");
  const [status, setStatus]       = useState("");
  const [page, setPage]           = useState(1);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [deleting, setDeleting]   = useState(false);
  const [toggling, setToggling]   = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("q", search);
      if (sport) params.set("sport", sport);
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [search, sport, status, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Debounce search
  useEffect(() => {
    setPage(1);
  }, [search, sport, status]);

  async function toggleActive(product: Product) {
    setToggling(product.id);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
      }
    } finally {
      setToggling(null);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        if (data.soft) {
          setProducts(prev => prev.map(p => p.id === deleteId ? { ...p, isActive: false } : p));
        } else {
          setProducts(prev => prev.filter(p => p.id !== deleteId));
          setTotal(t => t - 1);
        }
      }
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  const minPrice = (p: Product) => {
    if (!p.variants.length) return 0;
    return Math.min(...p.variants.map(v => Number(v.price)));
  };
  const totalStock = (p: Product) => p.variants.reduce((s, v) => s + v.stock, 0);
  const pages = Math.ceil(total / 20);

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
            Products
          </h1>
          <p className="text-white/40 text-[13px]">{total} products total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchProducts} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/admin/products/bulk"
            className="flex items-center gap-2 h-9 px-3 rounded-xl text-[12px] font-semibold text-white/60 hover:text-white transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            title="Bulk edit products"
          >
            <Layers className="h-3.5 w-3.5" />
            Bulk
          </Link>
          <Link
            href="/admin/products/bulk-variants"
            className="flex items-center gap-2 h-9 px-3 rounded-xl text-[12px] font-semibold text-white/60 hover:text-white transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            title="Bulk edit variants"
          >
            <Boxes className="h-3.5 w-3.5" />
            Variants
          </Link>
          <Link
            href="/admin/products/featured"
            className="flex items-center gap-2 h-9 px-3 rounded-xl text-[12px] font-semibold text-white/60 hover:text-white transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            title="Manage featured products"
          >
            <Star className="h-3.5 w-3.5" />
            Featured
          </Link>
          <Link
            href="/admin/products/import"
            className="flex items-center gap-2 h-9 px-3 rounded-xl text-[12px] font-semibold text-white/60 hover:text-white transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            title="Bulk import via CSV"
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </Link>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-black text-[#0D0D0D] transition-opacity hover:opacity-88"
            style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", letterSpacing: "0.05em" }}
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-xl pl-10 pr-4 text-[13px] text-white placeholder:text-white/25 outline-none transition-colors"
            style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>
        <select
          value={sport}
          onChange={e => setSport(e.target.value)}
          className="rounded-xl px-4 text-[13px] text-white outline-none"
          style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", minWidth: "140px" }}
        >
          <option value="">All Sports</option>
          {Object.entries(SPORT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="rounded-xl px-4 text-[13px] text-white outline-none"
          style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", minWidth: "130px" }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          className="hidden md:grid items-center px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white/30 border-b"
          style={{ gridTemplateColumns: "56px 1fr 100px 90px 80px 90px 110px", borderColor: "rgba(255,255,255,0.05)" }}
        >
          <span />
          <span>Product</span>
          <span>Sport</span>
          <span>Price</span>
          <span>Stock</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16 text-white/30">
            <RefreshCw className="h-8 w-8 mb-3 animate-spin opacity-40" />
            <p className="text-[14px] font-semibold">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-white/30">
            <Package className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-[14px] font-semibold">No products found</p>
            {!search && !sport && (
              <Link href="/admin/products/new" className="mt-3 text-[12px] font-semibold text-[#F5C518] hover:underline">
                Add your first product →
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {products.map((product) => (
              <div
                key={product.id}
                className="flex md:grid items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                style={{ gridTemplateColumns: "56px 1fr 100px 90px 80px 90px 110px" }}
              >
                {/* Thumbnail */}
                <div className="h-11 w-11 shrink-0 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: "#2A2A2A" }}>
                  {product.images[0] ? (
                    <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-5 w-5 text-white/20" />
                  )}
                </div>

                {/* Name */}
                <div className="min-w-0 flex-1 md:flex-none">
                  <p className="text-[13px] font-semibold text-white truncate">{product.name}</p>
                  <p className="text-[11px] text-white/30">{product.category?.name} · {product.slug}</p>
                </div>

                <span className="hidden md:block text-[12px] text-white/50">{SPORT_LABEL[product.sport] ?? product.sport}</span>

                <div className="hidden md:block">
                  <p className="text-[13px] font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    ₹{minPrice(product).toLocaleString("en-IN")}
                  </p>
                  {product.variants.length > 1 && <p className="text-[11px] text-white/30">+{product.variants.length - 1} variants</p>}
                </div>

                <div className="hidden md:block">
                  <p className={`text-[13px] font-bold ${totalStock(product) === 0 ? "text-[#F87171]" : totalStock(product) < 10 ? "text-[#F5C518]" : "text-white"}`}>
                    {totalStock(product)}
                  </p>
                  <p className="text-[11px] text-white/30">units</p>
                </div>

                <button
                  onClick={() => toggleActive(product)}
                  disabled={toggling === product.id}
                  className="hidden md:flex items-center gap-1.5 transition-opacity disabled:opacity-50"
                  title={product.isActive ? "Click to deactivate" : "Click to activate"}
                >
                  {product.isActive ? (
                    <ToggleRight className="h-5 w-5 text-[#4ADE80]" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-white/25" />
                  )}
                  <span className={`text-[11px] font-bold ${product.isActive ? "text-[#4ADE80]" : "text-white/25"}`}>
                    {product.isActive ? "Active" : "Off"}
                  </span>
                </button>

                <div className="flex items-center gap-1 md:justify-end shrink-0">
                  <Link
                    href={`/products/${product.slug}`}
                    target="_blank"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 hover:text-white hover:bg-white/08 transition-all"
                    title="View on store"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 hover:text-[#F5C518] hover:bg-[#F5C518]/08 transition-all"
                    title="Edit"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={() => setDeleteId(product.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 hover:text-[#F87171] hover:bg-[#F87171]/08 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl px-4 py-2 text-[13px] font-semibold text-white/50 hover:text-white disabled:opacity-30 transition-all"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            ← Prev
          </button>
          <span className="text-[13px] text-white/40">Page {page} of {pages}</span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="rounded-xl px-4 py-2 text-[13px] font-semibold text-white/50 hover:text-white disabled:opacity-30 transition-all"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => !deleting && setDeleteId(null)}
        >
          <div
            className="rounded-2xl p-6 max-w-sm w-full"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full mb-4" style={{ background: "rgba(248,113,113,0.12)" }}>
              <Trash2 className="h-5 w-5 text-[#F87171]" />
            </div>
            <h3 className="text-white font-black mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
              Delete Product?
            </h3>
            <p className="text-white/50 text-[13px] mb-5">
              Products with order history will be deactivated instead of deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white/60 hover:text-white transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.12)" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 h-10 rounded-xl text-[13px] font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                style={{ background: "#F87171" }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
