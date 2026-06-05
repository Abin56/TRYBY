"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

const SPORTS = ["CRICKET", "FOOTBALL", "GYM", "RUNNING", "RACKET", "COMBAT", "OTHER"] as const;
const SIZES  = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

interface Category { id: string; name: string; sport?: string; }
interface Variant { sku: string; size: string; price: string; mrp: string; stock: string; }

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState({
    name: "", sport: "CRICKET" as typeof SPORTS[number],
    categoryId: "", description: "",
    isActive: true, isFeatured: false, isOfficialLicensed: false,
    teamName: "", leagueName: "", metaTitle: "", metaDescription: "",
  });

  const [variants, setVariants] = useState<Variant[]>([
    { sku: "", size: "M", price: "", mrp: "", stock: "" },
  ]);

  const [imageUrls, setImageUrls] = useState<string[]>([""]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  function update<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function updateVariant(i: number, k: keyof Variant, v: string) {
    setVariants(prev => prev.map((vt, j) => j === i ? { ...vt, [k]: v } : vt));
  }

  function addVariant() {
    setVariants(prev => [...prev, { sku: "", size: "M", price: "", mrp: "", stock: "" }]);
  }

  function removeVariant(i: number) {
    setVariants(prev => prev.filter((_, j) => j !== i));
  }

  async function handleSave() {
    setError("");
    if (!form.name.trim())        { setError("Product name is required"); return; }
    if (!form.categoryId)         { setError("Select a category"); return; }
    if (!form.description.trim()) { setError("Description is required"); return; }

    for (const v of variants) {
      if (!v.sku.trim())  { setError("All variants need a SKU"); return; }
      if (!v.price)       { setError("All variants need a price"); return; }
      if (!v.mrp)         { setError("All variants need an MRP"); return; }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug: slugify(form.name),
          variants: variants.map(v => ({
            sku: v.sku,
            size: v.size || undefined,
            price: parseFloat(v.price),
            mrp: parseFloat(v.mrp),
            stock: parseInt(v.stock || "0"),
          })),
          imageUrls: imageUrls.filter(u => u.trim().startsWith("http")),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message ?? data.error ?? "Failed to create product");
        return;
      }

      router.push("/admin/products");
    } catch {
      setError("Network error — try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-[900px]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-white font-black flex-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px", letterSpacing: "-0.01em" }}>
          Add New Product
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-black text-[#0D0D0D] transition-all disabled:opacity-40"
          style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", letterSpacing: "0.05em" }}
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Product"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-[13px] font-semibold text-[#F87171]" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-4">

          <Section title="Product Info">
            <Field label="Product Name *">
              <input value={form.name} onChange={e => update("name", e.target.value)} placeholder="e.g. MI Paltan IPL Jersey 2025" className={inp} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sport *">
                <select value={form.sport} onChange={e => update("sport", e.target.value as typeof SPORTS[number])} className={inp}>
                  {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Category *">
                <select value={form.categoryId} onChange={e => update("categoryId", e.target.value)} className={inp}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Description *">
              <textarea value={form.description} onChange={e => update("description", e.target.value)} placeholder="Product description..." rows={3} className={inp + " resize-none"} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Team Name">
                <input value={form.teamName} onChange={e => update("teamName", e.target.value)} placeholder="e.g. Mumbai Indians" className={inp} />
              </Field>
              <Field label="League">
                <input value={form.leagueName} onChange={e => update("leagueName", e.target.value)} placeholder="e.g. IPL 2025" className={inp} />
              </Field>
            </div>
          </Section>

          {/* Variants */}
          <Section title="Variants (Sizes & Pricing)">
            <p className="text-[11px] text-white/30 -mt-2 mb-3">Add one row per size. SKU must be unique.</p>
            <div className="space-y-3">
              {variants.map((v, i) => (
                <div key={i} className="grid gap-2 items-end" style={{ gridTemplateColumns: "90px 80px 90px 90px 80px 32px" }}>
                  <Field label={i === 0 ? "Size" : ""}>
                    <select value={v.size} onChange={e => updateVariant(i, "size", e.target.value)} className={inp}>
                      {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label={i === 0 ? "SKU *" : ""}>
                    <input value={v.sku} onChange={e => updateVariant(i, "sku", e.target.value)} placeholder="MI-25-M" className={inp} />
                  </Field>
                  <Field label={i === 0 ? "Price (₹) *" : ""}>
                    <input type="number" value={v.price} onChange={e => updateVariant(i, "price", e.target.value)} placeholder="1299" className={inp} />
                  </Field>
                  <Field label={i === 0 ? "MRP (₹) *" : ""}>
                    <input type="number" value={v.mrp} onChange={e => updateVariant(i, "mrp", e.target.value)} placeholder="1799" className={inp} />
                  </Field>
                  <Field label={i === 0 ? "Stock" : ""}>
                    <input type="number" value={v.stock} onChange={e => updateVariant(i, "stock", e.target.value)} placeholder="50" className={inp} />
                  </Field>
                  <button onClick={() => removeVariant(i)} disabled={variants.length === 1} className="h-10 flex items-center justify-center rounded-xl text-white/30 hover:text-[#F87171] disabled:opacity-20 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addVariant} className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-[#F5C518] hover:opacity-80 transition-opacity">
              <Plus className="h-3.5 w-3.5" /> Add Size
            </button>
          </Section>

          {/* Images */}
          <Section title="Image URLs">
            <p className="text-[11px] text-white/30 -mt-2 mb-3">Paste Cloudinary or Unsplash URLs. First image is the primary.</p>
            <div className="space-y-2">
              {imageUrls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={url}
                    onChange={e => setImageUrls(prev => prev.map((u, j) => j === i ? e.target.value : u))}
                    placeholder="https://res.cloudinary.com/..."
                    className={inp + " flex-1"}
                  />
                  {i === 0 && <span className="flex items-center text-[10px] font-bold text-[#F5C518] shrink-0">PRIMARY</span>}
                  {i > 0 && (
                    <button onClick={() => setImageUrls(prev => prev.filter((_, j) => j !== i))} className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl text-white/30 hover:text-[#F87171] transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setImageUrls(prev => [...prev, ""])} className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-[#F5C518] hover:opacity-80 transition-opacity">
              <Plus className="h-3.5 w-3.5" /> Add Image
            </button>
          </Section>

          {/* SEO */}
          <Section title="SEO (Optional)">
            <Field label="Meta Title">
              <input value={form.metaTitle} onChange={e => update("metaTitle", e.target.value)} placeholder="Buy MI Jersey 2025 | TRYBY" className={inp} />
            </Field>
            <Field label="Meta Description">
              <textarea value={form.metaDescription} onChange={e => update("metaDescription", e.target.value)} placeholder="Official MI IPL jersey..." rows={2} className={inp + " resize-none"} />
            </Field>
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Section title="Visibility">
            {[
              { key: "isActive" as const,          label: "Active",           desc: "Visible on store" },
              { key: "isFeatured" as const,         label: "Featured",         desc: "Show on homepage" },
              { key: "isOfficialLicensed" as const, label: "Official Licensed",desc: "Show official badge" },
            ].map(({ key, label, desc }) => (
              <button
                key={key}
                onClick={() => update(key, !form[key])}
                className="flex items-center justify-between w-full rounded-xl px-4 py-3 transition-all"
                style={{
                  background: form[key] ? "rgba(245,197,24,0.08)" : "rgba(255,255,255,0.03)",
                  border: form[key] ? "1px solid rgba(245,197,24,0.3)" : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-white">{label}</p>
                  <p className="text-[11px] text-white/35">{desc}</p>
                </div>
                <div className={`h-5 w-9 rounded-full transition-all ${form[key] ? "bg-[#F5C518]" : "bg-white/15"} flex items-center px-0.5`}>
                  <div className={`h-4 w-4 rounded-full bg-white shadow transition-all ${form[key] ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </button>
            ))}
          </Section>

          <div className="rounded-2xl p-4 space-y-2" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Slug Preview</p>
            <p className="text-[12px] text-white/50 font-mono break-all">
              /products/<span className="text-[#F5C518]">{slugify(form.name) || "product-slug"}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-xl px-3.5 text-[13px] text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#F5C518]/50 bg-[#111] border border-white/08 h-10";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 space-y-3" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h3 className="text-white font-black text-[14px] mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <label className="block text-[11px] font-semibold text-white/40 mb-1.5 uppercase tracking-widest">{label}</label>}
      {children}
    </div>
  );
}
