"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, Save, Image as ImageIcon,
  RefreshCw, Star, Link2, Check, Upload, X,
} from "lucide-react";

interface ProductImage {
  id: string; url: string; altText?: string; isPrimary: boolean;
  sortOrder: number; variantId?: string;
}
interface Variant {
  id: string; sku: string; size?: string; color?: string;
  price: number; mrp: number; costPrice?: number;
  stock: number; isActive: boolean;
  images: ProductImage[];
}

const inp = "w-full rounded-xl px-3.5 text-[13px] text-white placeholder:text-white/20 outline-none transition-colors bg-[#111] border border-white/08 h-10 focus:border-[#F5C518]/60";

export default function VariantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [variants, setVariants]   = useState<Variant[]>([]);
  const [images, setImages]       = useState<ProductImage[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [assignVariantId, setAssignVariantId] = useState<string>("");

  // Bulk upload state
  const [uploadQueue, setUploadQueue] = useState<{ file: File; preview: string; status: "pending" | "uploading" | "done" | "error"; url?: string; error?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const bulkFileRef = useRef<HTMLInputElement>(null);

  // New variant form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ sku: "", size: "", color: "", price: "", mrp: "", costPrice: "", stock: "0" });
  const [adding, setAdding]   = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/products/${id}/variants`).then(r => r.json()),
      fetch(`/api/admin/products/${id}/images`).then(r => r.json()),
    ]).then(([v, img]) => {
      setVariants(v);
      setImages(img);
    }).finally(() => setLoading(false));
  }, [id]);

  const onBulkDrop = useCallback((files: FileList | null) => {
    if (!files) return;
    const newItems = Array.from(files)
      .filter(f => f.type.startsWith("image/"))
      .map(f => ({ file: f, preview: URL.createObjectURL(f), status: "pending" as const }));
    setUploadQueue(prev => [...prev, ...newItems]);
  }, []);

  async function uploadAll() {
    const pending = uploadQueue.filter(q => q.status === "pending");
    if (!pending.length) return;
    setUploading(true);

    for (const item of pending) {
      setUploadQueue(prev => prev.map(q => q.file === item.file ? { ...q, status: "uploading" } : q));
      try {
        const fd = new FormData();
        fd.append("file", item.file);
        fd.append("folder", "tryby/products");
        fd.append("assetType", "PRODUCT_IMAGE");
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
        const data = await res.json();

        // Add to product images
        const imgRes = await fetch(`/api/admin/products/${id}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: data.url,
            variantId: assignVariantId || undefined,
            isPrimary: images.length === 0,
            sortOrder: images.length,
          }),
        });
        if (imgRes.ok) {
          const img = await imgRes.json();
          setImages(prev => [...prev, img]);
        }

        setUploadQueue(prev => prev.map(q => q.file === item.file ? { ...q, status: "done", url: data.url } : q));
      } catch (e) {
        setUploadQueue(prev => prev.map(q => q.file === item.file ? { ...q, status: "error", error: e instanceof Error ? e.message : "Failed" } : q));
      }
    }
    setUploading(false);
  }

  async function saveVariant(variantId: string, data: Partial<Variant>) {
    setSaving(variantId);
    try {
      const res = await fetch(`/api/admin/products/${id}/variants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, ...data }),
      });
      if (res.ok) {
        const updated = await res.json();
        setVariants(prev => prev.map(v => v.id === variantId ? { ...v, ...updated } : v));
      }
    } finally { setSaving(null); }
  }

  async function deleteVariant(variantId: string) {
    if (!confirm("Delete variant? Cannot be undone.")) return;
    const res = await fetch(`/api/admin/products/${id}/variants`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variantId }),
    });
    if (res.ok) setVariants(prev => prev.filter(v => v.id !== variantId));
    else { const d = await res.json(); alert(d.error); }
  }

  async function addVariant() {
    setAddError("");
    if (!addForm.sku || !addForm.price || !addForm.mrp) { setAddError("SKU, price, and MRP are required"); return; }
    setAdding(true);
    const res = await fetch(`/api/admin/products/${id}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: addForm.sku, size: addForm.size || undefined, color: addForm.color || undefined,
        price: parseFloat(addForm.price), mrp: parseFloat(addForm.mrp),
        costPrice: addForm.costPrice ? parseFloat(addForm.costPrice) : undefined,
        stock: parseInt(addForm.stock || "0"),
      }),
    });
    if (res.ok) {
      const v = await res.json();
      setVariants(prev => [...prev, { ...v, images: [] }]);
      setShowAdd(false);
      setAddForm({ sku: "", size: "", color: "", price: "", mrp: "", costPrice: "", stock: "0" });
    } else {
      const d = await res.json();
      setAddError(d.error ?? "Failed to add variant");
    }
    setAdding(false);
  }

  async function addImageByUrl() {
    if (!newImageUrl.trim()) return;
    const res = await fetch(`/api/admin/products/${id}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: newImageUrl.trim(),
        variantId: assignVariantId || undefined,
        isPrimary: images.length === 0,
        sortOrder: images.length,
      }),
    });
    if (res.ok) {
      const img = await res.json();
      setImages(prev => [...prev, img]);
      setNewImageUrl("");
    }
  }

  async function deleteImage(imageId: string) {
    const res = await fetch(`/api/admin/products/${id}/images`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageId }),
    });
    if (res.ok) setImages(prev => prev.filter(i => i.id !== imageId));
  }

  async function setPrimary(imageId: string) {
    const img = images.find(i => i.id === imageId);
    if (!img) return;
    // Set new primary by re-posting, delete old
    const res = await fetch(`/api/admin/products/${id}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: img.url, isPrimary: true }),
    });
    if (res.ok) {
      const newImg = await res.json();
      await deleteImage(imageId);
      setImages(prev => [...prev.filter(i => !i.isPrimary), { ...newImg }]);
    }
  }

  if (loading) return <div className="p-8 flex items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-white/20" /></div>;

  const pendingCount = uploadQueue.filter(q => q.status === "pending").length;
  const doneCount = uploadQueue.filter(q => q.status === "done").length;

  return (
    <div className="p-6 lg:p-8 max-w-[1000px]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px" }}>Variants & Images</h1>
          <p className="text-white/30 text-[12px]">{variants.length} variants · {images.length} images</p>
        </div>
        <Link href={`/admin/products/${id}/edit`} className="flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          Edit Product Info
        </Link>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">

        {/* ─ Variants ─ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-black text-[16px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Sizes & Stock</h2>
            <button onClick={() => setShowAdd(v => !v)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-bold text-[#0D0D0D]"
              style={{ background: "#F5C518" }}>
              <Plus className="h-3.5 w-3.5" /> Add Size
            </button>
          </div>

          {showAdd && (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "#1A1A1A", border: "1px solid rgba(245,197,24,0.2)" }}>
              <p className="text-[12px] font-bold text-[#F5C518]">New Variant</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "SKU *", key: "sku", placeholder: "MI-25-M", type: "text" },
                  { label: "Size", key: "size", placeholder: "M", type: "text" },
                  { label: "Color", key: "color", placeholder: "Blue", type: "text" },
                  { label: "Price ₹ *", key: "price", placeholder: "1299", type: "number" },
                  { label: "MRP ₹ *", key: "mrp", placeholder: "1799", type: "number" },
                  { label: "Cost ₹", key: "costPrice", placeholder: "600", type: "number" },
                  { label: "Stock", key: "stock", placeholder: "50", type: "number" },
                ].map(({ label, key, placeholder, type }) => (
                  <div key={key}>
                    <label className="block text-[10px] text-white/35 mb-1 uppercase tracking-widest">{label}</label>
                    <input type={type} value={addForm[key as keyof typeof addForm]}
                      onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder} className={inp} />
                  </div>
                ))}
              </div>
              {addError && <p className="text-[11px] text-[#F87171] font-semibold">{addError}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setShowAdd(false); setAddError(""); }} className="h-9 px-4 rounded-xl text-[12px] font-semibold text-white/50 hover:text-white" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>Cancel</button>
                <button onClick={addVariant} disabled={adding}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[12px] font-black text-[#0D0D0D] disabled:opacity-40"
                  style={{ background: "#F5C518" }}>
                  {adding ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  {adding ? "Adding…" : "Add Variant"}
                </button>
              </div>
            </div>
          )}

          {variants.map(v => (
            <VariantRow
              key={v.id}
              variant={v}
              allImages={images}
              onSave={(data) => saveVariant(v.id, data)}
              onDelete={() => deleteVariant(v.id)}
              isSaving={saving === v.id}
            />
          ))}
        </div>

        {/* ─ Images ─ */}
        <div className="space-y-4">
          <h2 className="text-white font-black text-[16px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Images</h2>

          {/* Assign to variant selector (shared) */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <label className="block text-[10px] text-white/35 uppercase tracking-widest">Assign New Images To</label>
            <select value={assignVariantId} onChange={e => setAssignVariantId(e.target.value)} className={inp}>
              <option value="">All variants (shared)</option>
              {variants.map(v => <option key={v.id} value={v.id}>{v.sku}{v.size ? ` — ${v.size}` : ""}{v.color ? ` / ${v.color}` : ""}</option>)}
            </select>

            {/* Bulk upload zone */}
            <div>
              <label className="block text-[10px] text-white/35 mb-2 uppercase tracking-widest">Upload from Device</label>
              <input
                ref={bulkFileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => onBulkDrop(e.target.files)}
              />
              <div
                onClick={() => bulkFileRef.current?.click()}
                className="rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all"
                style={{ border: "1.5px dashed rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)" }}
              >
                <Upload className="h-6 w-6 text-white/25 mb-1.5" />
                <p className="text-[12px] text-white/40">Click or drag images here</p>
                <p className="text-[10px] text-white/20">JPG, PNG, WebP · max 10 MB each</p>
              </div>
            </div>

            {/* Upload queue */}
            {uploadQueue.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-white/40">{uploadQueue.length} file{uploadQueue.length !== 1 ? "s" : ""} queued · {doneCount} done</p>
                  <button onClick={() => setUploadQueue([])} className="text-[10px] text-white/30 hover:text-white/60">Clear</button>
                </div>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {uploadQueue.map((q, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <img src={q.preview} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" style={{ background: "#111" }} />
                      <span className="text-[11px] text-white/50 truncate flex-1">{q.file.name}</span>
                      {q.status === "pending" && <span className="text-[10px] text-white/25">Pending</span>}
                      {q.status === "uploading" && <RefreshCw className="h-3 w-3 animate-spin text-[#F5C518]" />}
                      {q.status === "done" && <Check className="h-3.5 w-3.5 text-[#4ADE80]" />}
                      {q.status === "error" && <span className="text-[10px] text-[#F87171] truncate max-w-[80px]" title={q.error}>{q.error}</span>}
                      {q.status !== "uploading" && (
                        <button onClick={() => setUploadQueue(prev => prev.filter((_, j) => j !== i))} className="text-white/20 hover:text-white/60">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {pendingCount > 0 && (
                  <button
                    onClick={uploadAll}
                    disabled={uploading}
                    className="w-full h-9 rounded-xl text-[12px] font-black text-[#0D0D0D] disabled:opacity-40"
                    style={{ background: "#F5C518" }}
                  >
                    {uploading ? "Uploading..." : `Upload ${pendingCount} image${pendingCount !== 1 ? "s" : ""}`}
                  </button>
                )}
              </div>
            )}

            {/* URL input */}
            <div>
              <label className="block text-[10px] text-white/35 mb-1.5 uppercase tracking-widest">Or paste Cloudinary URL</label>
              <div className="flex gap-2">
                <input value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/…"
                  className={inp + " flex-1"}
                  onKeyDown={e => e.key === "Enter" && addImageByUrl()}
                />
                <button onClick={addImageByUrl} disabled={!newImageUrl.trim()}
                  className="flex items-center h-10 px-3 rounded-xl text-[12px] font-black text-[#0D0D0D] disabled:opacity-40 shrink-0"
                  style={{ background: "#F5C518" }}>
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Image grid */}
          <div className="grid grid-cols-3 gap-2">
            {[...images].sort((a, b) => (a.isPrimary ? -1 : 1) - (b.isPrimary ? -1 : 1) || a.sortOrder - b.sortOrder).map(img => {
              const linkedVariant = img.variantId ? variants.find(v => v.id === img.variantId) : null;
              return (
                <div key={img.id} className="relative rounded-xl overflow-hidden aspect-square group" style={{ background: "#1A1A1A" }}>
                  <img src={img.url} alt={img.altText ?? ""} className="w-full h-full object-cover" />
                  {img.isPrimary && (
                    <div className="absolute top-1 left-1 flex items-center gap-1 rounded-full px-1.5 py-0.5" style={{ background: "#F5C518" }}>
                      <Star className="h-2.5 w-2.5 text-[#0D0D0D]" />
                      <span className="text-[8px] font-black text-[#0D0D0D]">PRIMARY</span>
                    </div>
                  )}
                  {linkedVariant && (
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="flex items-center gap-1 rounded-full px-1.5 py-0.5" style={{ background: "rgba(0,0,0,0.75)" }}>
                        <Link2 className="h-2.5 w-2.5 text-[#F5C518]" />
                        <span className="text-[8px] font-bold text-white truncate">{linkedVariant.size ?? linkedVariant.color ?? linkedVariant.sku}</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5">
                    {!img.isPrimary && (
                      <button onClick={() => setPrimary(img.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F5C518]/80 hover:bg-[#F5C518]" title="Set as primary">
                        <Star className="h-3 w-3 text-[#0D0D0D]" />
                      </button>
                    )}
                    <button onClick={() => deleteImage(img.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F87171]/80 hover:bg-[#F87171]" title="Delete">
                      <Trash2 className="h-3 w-3 text-white" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {images.length === 0 && (
            <div className="flex flex-col items-center py-10 text-white/25 rounded-2xl" style={{ border: "1.5px dashed rgba(255,255,255,0.08)" }}>
              <ImageIcon className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-[12px]">No images yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Variant Row ─────────────────────────────────────────────────────────────
function VariantRow({
  variant, allImages, onSave, onDelete, isSaving,
}: {
  variant: Variant;
  allImages: ProductImage[];
  onSave: (data: Partial<Variant>) => void;
  onDelete: () => void;
  isSaving: boolean;
}) {
  const [stock, setStock]     = useState(String(variant.stock));
  const [price, setPrice]     = useState(String(Number(variant.price)));
  const [mrp, setMrp]         = useState(String(Number(variant.mrp)));
  const [cost, setCost]       = useState(String(Number(variant.costPrice ?? "")));
  const [dirty, setDirty]     = useState(false);

  function markDirty() { setDirty(true); }

  function saveChanges() {
    onSave({
      stock: parseInt(stock) || 0,
      price: parseFloat(price) || variant.price,
      mrp: parseFloat(mrp) || variant.mrp,
      costPrice: cost ? parseFloat(cost) : undefined,
    });
    setDirty(false);
  }

  const variantImages = allImages.filter(i => i.variantId === variant.id);
  const profit = cost && price ? (parseFloat(price) - parseFloat(cost)) : null;
  const margin = profit && price ? (profit / parseFloat(price) * 100) : null;

  const rowInp = "w-full rounded-xl px-3 text-[12px] text-white placeholder:text-white/20 outline-none transition-colors bg-[#0D0D0D] border border-white/08 h-9 focus:border-[#F5C518]/60 text-center";

  return (
    <div className="rounded-2xl p-4" style={{ background: "#1A1A1A", border: `1px solid ${variant.isActive ? "rgba(255,255,255,0.06)" : "rgba(248,113,113,0.15)"}` }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-white">{variant.sku}</p>
          <p className="text-[11px] text-white/35">
            {variant.size && `Size: ${variant.size}`}{variant.size && variant.color ? " · " : ""}{variant.color && `Color: ${variant.color}`}
          </p>
        </div>
        {variantImages[0] && (
          <div className="h-9 w-9 rounded-lg overflow-hidden shrink-0">
            <img src={variantImages[0].url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onSave({ isActive: !variant.isActive })}
            className={`rounded-full px-2.5 py-1 text-[10px] font-black ${variant.isActive ? "text-[#4ADE80]" : "text-[#F87171]"}`}
            style={{ background: variant.isActive ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)" }}>
            {variant.isActive ? "Active" : "Inactive"}
          </button>
          <button onClick={onDelete} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:text-[#F87171] transition-all">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-2">
        {[
          { label: "Stock", value: stock, set: setStock },
          { label: "Price ₹", value: price, set: setPrice },
          { label: "MRP ₹", value: mrp, set: setMrp },
          { label: "Cost ₹", value: cost, set: setCost },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label className="block text-[9px] text-white/30 mb-1 uppercase tracking-widest text-center">{label}</label>
            <input type="number" value={value} onChange={e => { set(e.target.value); markDirty(); }} className={rowInp} />
          </div>
        ))}
      </div>

      {profit !== null && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-white/30">Margin:</span>
          <span className={`text-[10px] font-bold ${margin && margin > 30 ? "text-[#4ADE80]" : margin && margin > 15 ? "text-[#F5C518]" : "text-[#F87171]"}`}>
            {margin?.toFixed(1)}% (₹{profit.toFixed(0)} profit per unit)
          </span>
        </div>
      )}

      {dirty && (
        <button onClick={saveChanges} disabled={isSaving}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-black text-[#0D0D0D] disabled:opacity-40 w-full justify-center"
          style={{ background: "#F5C518" }}>
          {isSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          {isSaving ? "Saving…" : "Save Changes"}
        </button>
      )}
    </div>
  );
}
