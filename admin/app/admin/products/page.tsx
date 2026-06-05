"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Download, ChevronUp, ChevronDown, ChevronsUpDown,
  Pencil, Trash2, Eye, Package, ChevronLeft, ChevronRight, X,
  Star, AlertTriangle, Loader2, Plus,
} from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { useUIStore } from "@/store/ui";
import { formatPrice, formatNumber, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

const STORE_API = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductVariant {
  id: string;
  sku: string;
  size?: string;
  color?: string;
  price: number;
  mrp: number;
  costPrice?: number;
  stock: number;
  isActive: boolean;
}

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  sport: string;
  isActive: boolean;
  isFeatured: boolean;
  totalSoldCount: number;
  avgRating: number;
  reviewCount: number;
  metaTitle?: string;
  metaDescription?: string;
  category: { id: string; name: string };
  variants: ProductVariant[];
  images: ProductImage[];
  createdAt: string;
}

type SortKey = "name" | "totalSoldCount" | "avgRating" | "createdAt";
type SortDir = "asc" | "desc";

const SPORT_OPTS = [
  { value: "", label: "All Sports" },
  { value: "CRICKET",  label: "Cricket" },
  { value: "FOOTBALL", label: "Football" },
  { value: "GYM",      label: "Gym" },
  { value: "RUNNING",  label: "Running" },
  { value: "RACKET",   label: "Racket" },
  { value: "COMBAT",   label: "Combat" },
  { value: "OTHER",    label: "Other" },
];

const STATUS_TABS = [
  { value: "",         label: "All" },
  { value: "active",   label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// ─── Product Form ─────────────────────────────────────────────────────────────

function ProductForm({ product, onClose, onSaved }: { product?: Product; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name:            product?.name            ?? "",
    slug:            product?.slug            ?? "",
    description:     product?.description     ?? "",
    sport:           product?.sport           ?? "CRICKET",
    categoryId:      product?.category?.id    ?? "",
    isActive:        product?.isActive        ?? true,
    isFeatured:      product?.isFeatured      ?? false,
    shippingCost:    0,
    packagingCost:   0,
    metaTitle:       product?.metaTitle       ?? "",
    metaDescription: product?.metaDescription ?? "",
  });
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>(
    product?.variants ?? [{ sku: "", price: 0, mrp: 0, stock: 0 }]
  );
  const [imageUrls, setImageUrls] = useState<string[]>(
    product?.images?.map(i => i.url) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const url = product
        ? `${STORE_API}/api/admin/products/${product.id}`
        : `${STORE_API}/api/admin/products`;
      const res = await fetch(url, {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, variants, imageUrls }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error?.formErrors?.[0] ?? d.error ?? "Failed to save");
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] transition-all";
  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-xs font-semibold text-[#374151] mb-1">{children}</label>
  );

  return (
    <div className="px-6 py-5 space-y-5">
      {error && (
        <div className="rounded-lg border border-[#FCA5A5] bg-[#FFF1F2] px-3 py-2 text-xs text-[#DC2626]">{error}</div>
      )}

      {/* Basic info */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-3">Basic Information</p>
        <div className="space-y-3">
          <div>
            <Label>Product Name <span className="text-[#EF4444]">*</span></Label>
            <input value={form.name}
              onChange={e => setField("name", e.target.value)}
              className={inputCls} placeholder="Official Cricket Jersey" />
          </div>
          <div>
            <Label>Slug</Label>
            <input value={form.slug}
              onChange={e => setField("slug", e.target.value)}
              className={cn(inputCls, "font-mono text-[#6B7280]")} placeholder="auto-generated" />
          </div>
          <div>
            <Label>Description</Label>
            <textarea value={form.description} onChange={e => setField("description", e.target.value)} rows={3}
              className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] focus:bg-white transition-all resize-none"
              placeholder="Product description" />
          </div>
        </div>
      </div>

      {/* Sport + Status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Sport</Label>
          <select value={form.sport} onChange={e => setField("sport", e.target.value)}
            className={cn(inputCls, "appearance-none")}>
            {SPORT_OPTS.filter(o => o.value).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <Label>Status</Label>
          <select value={form.isActive ? "active" : "inactive"} onChange={e => setField("isActive", e.target.value === "active")}
            className={cn(inputCls, "appearance-none")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Shipping + packaging costs — used by profit engine */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-3">Cost Structure (Profit Engine)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Shipping Cost per Unit (₹)</Label>
            <input type="number" step="0.01"
              value={(form as Record<string, unknown>).shippingCost as number ?? 0}
              onChange={e => setField("shippingCost", Number(e.target.value))}
              className={inputCls} placeholder="49" />
          </div>
          <div>
            <Label>Packaging Cost per Unit (₹)</Label>
            <input type="number" step="0.01"
              value={(form as Record<string, unknown>).packagingCost as number ?? 0}
              onChange={e => setField("packagingCost", Number(e.target.value))}
              className={inputCls} placeholder="15" />
          </div>
        </div>
        <p className="text-[10px] text-[#9CA3AF] mt-1.5">Set variant cost prices below to enable accurate profit margin calculations.</p>
      </div>

      {/* Variants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">Variants</p>
          <button onClick={() => setVariants(p => [...p, { sku: "", price: 0, mrp: 0, stock: 0 }])}
            className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
            <Plus className="h-3 w-3" /> Add Variant
          </button>
        </div>
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div key={i} className="rounded-lg border border-[#E5E7EB] p-3 grid grid-cols-2 gap-2">
              <div>
                <Label>SKU</Label>
                <input value={v.sku ?? ""} onChange={e => setVariants(p => p.map((x, j) => j === i ? { ...x, sku: e.target.value } : x))}
                  className={cn(inputCls, "font-mono")} placeholder="SKU-001" />
              </div>
              <div>
                <Label>Size</Label>
                <input value={v.size ?? ""} onChange={e => setVariants(p => p.map((x, j) => j === i ? { ...x, size: e.target.value } : x))}
                  className={inputCls} placeholder="M" />
              </div>
              <div>
                <Label>Price (₹)</Label>
                <input type="number" value={v.price ?? 0} onChange={e => setVariants(p => p.map((x, j) => j === i ? { ...x, price: Number(e.target.value) } : x))}
                  className={inputCls} />
              </div>
              <div>
                <Label>MRP (₹)</Label>
                <input type="number" value={v.mrp ?? 0} onChange={e => setVariants(p => p.map((x, j) => j === i ? { ...x, mrp: Number(e.target.value) } : x))}
                  className={inputCls} />
              </div>
              <div>
                <Label>Cost Price (₹)</Label>
                <input type="number" value={v.costPrice ?? ""} onChange={e => setVariants(p => p.map((x, j) => j === i ? { ...x, costPrice: Number(e.target.value) } : x))}
                  className={inputCls} placeholder="(optional)" />
              </div>
              <div>
                <Label>Stock</Label>
                <input type="number" value={v.stock ?? 0} onChange={e => setVariants(p => p.map((x, j) => j === i ? { ...x, stock: Number(e.target.value) } : x))}
                  className={inputCls} />
              </div>
              <div className="col-span-2">
                <Label>Variant Image URL <span className="text-[#9CA3AF] font-normal">(optional — overrides product gallery for this variant)</span></Label>
                <input value={(v as Record<string, unknown>).imageUrl as string ?? ""} onChange={e => setVariants(p => p.map((x, j) => j === i ? { ...x, imageUrl: e.target.value } : x))}
                  className={inputCls} placeholder="https://res.cloudinary.com/... (leave blank to use product images)" />
              </div>
              {variants.length > 1 && (
                <button onClick={() => setVariants(p => p.filter((_, j) => j !== i))}
                  className="col-span-2 text-xs text-[#DC2626] hover:underline text-right mt-1">
                  Remove variant
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Images */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-3">Image URLs</p>
        <div className="space-y-2">
          {(imageUrls.length ? imageUrls : [""]).map((url, i) => (
            <div key={i} className="flex gap-2">
              <input value={url} onChange={e => {
                const next = [...(imageUrls.length ? imageUrls : [""])];
                next[i] = e.target.value;
                setImageUrls(next);
              }} className={cn(inputCls, "flex-1")} placeholder="https://..." />
              {imageUrls.length > 0 && (
                <button onClick={() => setImageUrls(p => p.filter((_, j) => j !== i))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FFF1F2] transition-all">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setImageUrls(p => [...p, ""])}
            className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
            <Plus className="h-3 w-3" /> Add image URL
          </button>
        </div>
      </div>

      {/* SEO */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-3">SEO</p>
        <div className="space-y-3">
          <div>
            <Label>Meta Title</Label>
            <input value={form.metaTitle} onChange={e => setField("metaTitle", e.target.value)}
              className={inputCls} placeholder={form.name} />
          </div>
          <div>
            <Label>Meta Description</Label>
            <textarea value={form.metaDescription} onChange={e => setField("metaDescription", e.target.value)} rows={2}
              className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#2563EB] focus:bg-white transition-all resize-none"
              placeholder={form.description} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#F3F4F6]">
        <button onClick={onClose} className="h-9 px-4 rounded-lg border border-[#E5E7EB] text-sm font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors">
          Cancel
        </button>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-[#111827] text-sm font-semibold text-white hover:bg-[#1F2937] transition-colors disabled:opacity-60">
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {product ? "Save Changes" : "Publish Product"}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { productDrawer, openProductDrawer, closeProductDrawer } = useUIStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch]     = useState("");
  const [sportFilter, setSport] = useState("");
  const [statusFilter, setStatus] = useState("");
  const [sortKey, setSortKey]   = useState<SortKey>("createdAt");
  const [sortDir, setSortDir]   = useState<SortDir>("desc");
  const [page, setPage]         = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editProduct, setEditProduct] = useState<Product | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        ...(search && { q: search }),
        ...(sportFilter && { sport: sportFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`${STORE_API}/api/admin/products?${params}`, { credentials: "include" });
      const data = await res.json();
      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, sportFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronsUpDown className="h-3 w-3 text-[#D1D5DB]" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3 text-[#2563EB]" /> : <ChevronDown className="h-3 w-3 text-[#2563EB]" />;
  };

  const paged = [...products].sort((a, b) => {
    const av = a[sortKey] as number | string;
    const bv = b[sortKey] as number | string;
    const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const allSelected = paged.length > 0 && paged.every(p => selected.has(p.id));

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await fetch(`${STORE_API}/api/admin/products/${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  const drawerProduct = productDrawer.productId
    ? products.find(p => p.id === productDrawer.productId)
    : undefined;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Products</h1>
          <p className="text-sm text-[#9CA3AF]">{total} total products</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button onClick={() => { setEditProduct(undefined); openProductDrawer(); }}
            className="flex items-center gap-1.5 h-9 rounded-lg bg-[#111827] px-4 text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors">
            + Add Product
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-[#E5E7EB] pb-0">
        {STATUS_TABS.map(s => (
          <button key={s.value} onClick={() => { setStatus(s.value); setPage(1); }}
            className={cn("px-3 py-2 text-xs font-semibold border-b-2 transition-all -mb-px",
              statusFilter === s.value ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-[#6B7280] hover:text-[#111827]")}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products, SKU…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] transition-all" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"><X className="h-3.5 w-3.5" /></button>}
        </div>
        <select value={sportFilter} onChange={e => { setSport(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#374151] outline-none focus:border-[#2563EB] transition-all appearance-none">
          {SPORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5">
              <span className="text-xs font-semibold text-[#2563EB]">{selected.size} selected</span>
              <button onClick={() => setSelected(new Set())} className="text-[#6B7280] hover:text-[#374151]"><X className="h-3.5 w-3.5" /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allSelected}
                    onChange={() => {
                      if (allSelected) { const s = new Set(selected); paged.forEach(p => s.delete(p.id)); setSelected(s); }
                      else { const s = new Set(selected); paged.forEach(p => s.add(p.id)); setSelected(s); }
                    }}
                    className="h-3.5 w-3.5 rounded border-[#D1D5DB] accent-[#2563EB]" />
                </th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-left cursor-pointer hover:text-[#111827]"
                  onClick={() => { if (sortKey === "totalSoldCount") setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey("totalSoldCount"); setSortDir("desc"); } }}>
                  <div className="flex items-center gap-1">Sales <SortIcon k="totalSoldCount" /></div>
                </th>
                <th className="px-4 py-3 text-left">Rating</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9FAFB]">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF] mx-auto" />
                </td></tr>
              ) : paged.map((product, i) => {
                const primaryImage = product.images?.[0]?.url;
                const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
                const minPrice = Math.min(...product.variants.map(v => Number(v.price)));
                const maxPrice = Math.max(...product.variants.map(v => Number(v.price)));
                const LOW = 5;

                return (
                  <motion.tr key={product.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className={cn("hover:bg-[#F9FAFB] transition-colors", selected.has(product.id) && "bg-[#F0F9FF]")}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(product.id)}
                        onChange={() => { const s = new Set(selected); s.has(product.id) ? s.delete(product.id) : s.add(product.id); setSelected(s); }}
                        className="h-3.5 w-3.5 rounded border-[#D1D5DB] accent-[#2563EB]" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-[#F3F4F6]">
                          {primaryImage
                            ? <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
                            : <Package className="h-5 w-5 text-[#D1D5DB] m-auto mt-2.5" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#111827] truncate max-w-[180px]">{product.name}</p>
                          <p className="text-xs text-[#9CA3AF]">{product.sport} · {product.category?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-[#111827]">
                        {minPrice === maxPrice ? formatPrice(minPrice) : `${formatPrice(minPrice)}–${formatPrice(maxPrice)}`}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">{product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      {totalStock === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1F2] px-2 py-0.5 text-[10px] font-semibold text-[#DC2626]">
                          Out of stock
                        </span>
                      ) : totalStock <= LOW ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-[#D97706]">
                          <AlertTriangle className="h-3 w-3" /> {totalStock}
                        </span>
                      ) : (
                        <span className="text-sm text-[#374151]">{formatNumber(totalStock)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#374151]">{formatNumber(product.totalSoldCount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-[#F59E0B]" fill="#F59E0B" />
                        <span className="text-xs font-semibold text-[#374151]">{Number(product.avgRating).toFixed(1)}</span>
                        <span className="text-xs text-[#9CA3AF]">({formatNumber(product.reviewCount)})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        product.isActive ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#F3F4F6] text-[#6B7280]")}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <a href={`http://localhost:3000/products/${product.slug}`} target="_blank" rel="noopener noreferrer"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-all">
                          <Eye className="h-3.5 w-3.5" />
                        </a>
                        <button onClick={() => { setEditProduct(product); openProductDrawer(product.id); }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7280] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-all">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteProduct(product.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7280] hover:text-[#DC2626] hover:bg-[#FFF1F2] transition-all">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Package className="h-10 w-10 text-[#D1D5DB]" />
            <p className="text-sm font-semibold text-[#374151]">No products found</p>
            <p className="text-xs text-[#9CA3AF]">Try adjusting your search or filters</p>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#F3F4F6]">
            <p className="text-xs text-[#6B7280]">Page {page} of {pages} · {total} products</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] disabled:opacity-40">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={cn("h-7 w-7 rounded-lg text-xs font-semibold transition-colors",
                    p === page ? "bg-[#111827] text-white" : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]")}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] disabled:opacity-40">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Drawer */}
      <Drawer
        open={productDrawer.open}
        onClose={closeProductDrawer}
        title={editProduct ? "Edit Product" : "Add New Product"}
        subtitle={editProduct ? `${editProduct.sport} · ${editProduct.category?.name}` : "Fill in the details below"}
        footer={null}
      >
        <ProductForm
          product={editProduct}
          onClose={closeProductDrawer}
          onSaved={load}
        />
      </Drawer>
    </div>
  );
}
