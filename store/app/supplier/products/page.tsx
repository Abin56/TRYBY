"use client";

import { useEffect, useState, useCallback } from "react";
import { Package, Plus, Search, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type Variant = { id: string; sku: string; size: string | null; color: string | null; price: number; stock: number; isActive: boolean };
type Product = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  category: { name: string };
  variants: Variant[];
  images: { url: string }[];
  _count: { orderItems: number };
};

export default function SupplierProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [q, setQ]               = useState("");
  const [loading, setLoading]   = useState(true);
  const [showNew, setShowNew]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), q });
    const res = await fetch(`/api/supplier/products?${params}`);
    const data = await res.json();
    setProducts(data.products ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, q]);

  useEffect(() => { load(); }, [load]);

  const minPrice = (variants: Variant[]) =>
    variants.length ? Math.min(...variants.map(v => Number(v.price))) : 0;

  const totalStock = (variants: Variant[]) =>
    variants.reduce((s, v) => s + v.stock, 0);

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-white font-black"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}
          >
            My Products
          </h1>
          <p className="text-white/40 text-[13px] mt-0.5">{total} product{total !== 1 ? "s" : ""} in your catalogue</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 font-black text-[13px] transition-all hover:brightness-110"
          style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}
        >
          <Plus className="h-4 w-4" />
          New Product
        </button>
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2 rounded-xl px-4 mb-6"
        style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", height: "44px" }}
      >
        <Search className="h-4 w-4 text-white/30 shrink-0" />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="Search products…"
          className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/25"
        />
      </div>

      {/* Products table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
        </div>
      ) : products.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Package className="h-10 w-10 text-white/15 mb-3" />
          <p className="text-white/40 text-[14px] font-medium">No products yet</p>
          <p className="text-white/25 text-[12px] mt-1">Click &ldquo;New Product&rdquo; to add your first product</p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Product", "Category", "Price", "Stock", "Orders", "Status", ""].map(h => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[11px] font-bold tracking-wider text-white/30"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.12em" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-white/02 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {p.images[0] ? (
                          <img src={p.images[0].url} alt={p.name} className="h-9 w-9 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div
                            className="h-9 w-9 rounded-lg shrink-0 flex items-center justify-center"
                            style={{ background: "rgba(255,255,255,0.05)" }}
                          >
                            <Package className="h-4 w-4 text-white/20" />
                          </div>
                        )}
                        <div>
                          <p className="text-[13px] font-semibold text-white/85 truncate max-w-[180px]">{p.name}</p>
                          <p className="text-[11px] text-white/35">{p.variants.length} variant{p.variants.length !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[12px] text-white/50">{p.category.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-[14px] font-black text-white"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        ₹{minPrice(p.variants).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-[13px] font-semibold"
                        style={{ color: totalStock(p.variants) < 5 ? "#F87171" : totalStock(p.variants) < 20 ? "#F5C518" : "#4ADE80" }}
                      >
                        {totalStock(p.variants)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[13px] text-white/60">{p._count.orderItems}</span>
                    </td>
                    <td className="px-5 py-3">
                      {p.isActive ? (
                        <span
                          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold w-fit"
                          style={{ background: "rgba(74,222,128,0.10)", color: "#4ADE80" }}
                        >
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span
                          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold w-fit"
                          style={{ background: "rgba(245,197,24,0.10)", color: "#F5C518" }}
                        >
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/products/${p.slug}`}
                        className="text-[12px] text-white/30 hover:text-white transition-colors"
                        target="_blank"
                      >
                        View ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-[12px] text-white/35">Page {page} of {pages}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/08 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/08 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* New Product modal */}
      {showNew && <NewProductModal onClose={() => { setShowNew(false); load(); }} />}
    </div>
  );
}

/* ── New Product Modal ─────────────────────────────────────────────── */

type Category = { id: string; name: string; slug: string };

function NewProductModal({ onClose }: { onClose: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", sport: "CRICKET", categoryId: "",
  });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then(r => r.json())
      .then(d => setCategories(d.categories ?? d ?? []));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: value,
      ...(name === "name" ? { slug: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") } : {}),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/supplier/products", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to create product");
      return;
    }
    setSuccess(true);
    setTimeout(onClose, 1500);
  }

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6"
        style={{ background: "#1C1C1C", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        <h2
          className="text-white font-black mb-5"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px" }}
        >
          New Product
        </h2>
        <p
          className="rounded-xl px-4 py-3 text-[12px] mb-5"
          style={{ background: "rgba(245,197,24,0.08)", color: "rgba(245,197,24,0.80)", border: "1px solid rgba(245,197,24,0.15)" }}
        >
          Products require admin approval before going live. You&apos;ll see them as &ldquo;Pending&rdquo; until approved.
        </p>

        {success ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <CheckCircle2 className="h-10 w-10 text-[#4ADE80]" />
            <p className="text-white font-semibold">Product submitted for approval!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-[12px] text-[#F87171] px-1">{error}</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Product Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required
                  className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                  placeholder="e.g. Barcelona Home Jersey 2024"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">URL Slug *</label>
                <input name="slug" value={form.slug} onChange={handleChange} required
                  className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white/70 outline-none font-mono"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Sport *</label>
                <select name="sport" value={form.sport} onChange={handleChange} required
                  className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  {["CRICKET","FOOTBALL","GYM","RUNNING","RACKET","COMBAT","OTHER"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Category *</label>
                <select name="categoryId" value={form.categoryId} onChange={handleChange} required
                  className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <option value="">Select…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Description *</label>
                <textarea name="description" value={form.description} onChange={handleChange} required rows={3}
                  className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                  placeholder="Describe your product…"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white/40 hover:text-white hover:bg-white/06 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-black disabled:opacity-50 transition-all"
                style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}>
                {saving ? "Submitting…" : "Submit for Approval"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
