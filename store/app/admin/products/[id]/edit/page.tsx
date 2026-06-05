"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Copy } from "lucide-react";
import Link from "next/link";
import { ProductQualityChecklist } from "@/components/admin/ProductQualityChecklist";
import { DuplicateProductModal } from "@/components/admin/DuplicateProductModal";

const SPORTS = ["CRICKET", "FOOTBALL", "GYM", "RUNNING", "RACKET", "COMBAT", "OTHER"] as const;

interface Category { id: string; name: string; }
interface Product {
  id: string; name: string; slug: string; sport: string; categoryId: string;
  description: string; isActive: boolean; isFeatured: boolean; isOfficialLicensed: boolean;
  showOnHomepage: boolean;
  teamName?: string; leagueName?: string; metaTitle?: string; metaDescription?: string;
  variants: { id: string; sku: string; size?: string; price: number; mrp: number; stock: number; costPrice?: number; }[];
  images: { url: string; isPrimary: boolean; }[];
}

const inp = "w-full rounded-xl px-3.5 text-[13px] text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#F5C518]/50 bg-[#111] border border-white/08 h-10";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [showDup, setShowDup] = useState(false);

  const [form, setForm] = useState({
    name: "", sport: "CRICKET", categoryId: "", description: "",
    isActive: true, isFeatured: false, isOfficialLicensed: false,
    showOnHomepage: false,
    teamName: "", leagueName: "", metaTitle: "", metaDescription: "",
    shippingCost: "0",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/products/${id}`).then(r => r.json()),
      fetch("/api/admin/categories").then(r => r.json()),
    ]).then(([p, cats]) => {
      setProduct(p);
      setCategories(cats);
      setForm({
        name: p.name, sport: p.sport, categoryId: p.categoryId,
        description: p.description, isActive: p.isActive, isFeatured: p.isFeatured,
        isOfficialLicensed: p.isOfficialLicensed, showOnHomepage: p.showOnHomepage ?? false,
        teamName: p.teamName ?? "", leagueName: p.leagueName ?? "",
        metaTitle: p.metaTitle ?? "", metaDescription: p.metaDescription ?? "",
        shippingCost: String(Number(p.shippingCost ?? 0)),
      });
    }).catch(() => setError("Failed to load product"));
  }, [id]);

  function update<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    setError(""); setSuccess(false);
    setSaving(true);
    try {
      const { shippingCost, ...rest } = form;
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          shippingCost: parseFloat(shippingCost) || 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/admin/products"), 1000);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (!product) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <p className="text-white/40 text-[13px]">{error || "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[900px]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px" }}>
            Edit Product
          </h1>
          <p className="text-white/30 text-[12px] font-mono">{product.slug}</p>
        </div>
        <button
          onClick={() => setShowDup(true)}
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12px] font-semibold text-white/50 hover:text-white transition-all"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          title="Duplicate this product"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <Link
          href={`/admin/products/${id}/variants`}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white transition-all"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          Variants & Images
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-black text-[#0D0D0D] disabled:opacity-40 transition-all"
          style={{ background: success ? "#4ADE80" : "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px" }}
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : success ? "Saved!" : "Save Changes"}
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
            <Field label="Product Name">
              <input value={form.name} onChange={e => update("name", e.target.value)} className={inp} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sport">
                <select value={form.sport} onChange={e => update("sport", e.target.value)} className={inp}>
                  {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select value={form.categoryId} onChange={e => update("categoryId", e.target.value)} className={inp}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Description">
              <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={3} className={inp + " resize-none"} />
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

          <Section title="Profit Settings">
            <p className="text-[11px] text-white/30 -mt-2 mb-3">
              Used in the Profit Dashboard. Set cost price per variant in{" "}
              <a href={`/admin/products/${id}/variants`} className="text-[#F5C518] hover:underline">Variants & Images</a>.
            </p>
            <Field label="Shipping Cost per Unit (₹)">
              <input
                type="number"
                value={form.shippingCost}
                onChange={e => update("shippingCost", e.target.value)}
                placeholder="e.g. 49"
                className={inp}
              />
            </Field>
          </Section>

          <Section title="SEO">
            <Field label="Meta Title">
              <input value={form.metaTitle} onChange={e => update("metaTitle", e.target.value)} className={inp} />
            </Field>
            <Field label="Meta Description">
              <textarea value={form.metaDescription} onChange={e => update("metaDescription", e.target.value)} rows={2} className={inp + " resize-none"} />
            </Field>
          </Section>

          {/* Variants (read-only summary) */}
          <Section title="Variants">
            <p className="text-[11px] text-white/30 mb-3">Edit stock & price for each variant. Full variant editor coming soon.</p>
            <div className="space-y-2">
              {product.variants.map(v => (
                <div key={v.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <span className="text-[12px] font-bold text-white">{v.sku}</span>
                    {v.size && <span className="ml-2 text-[11px] text-white/40">Size: {v.size}</span>}
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-bold text-white">₹{Number(v.price).toLocaleString("en-IN")}</p>
                    <p className={`text-[11px] ${v.stock === 0 ? "text-[#F87171]" : "text-white/40"}`}>{v.stock} in stock</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Visibility">
            {[
              { key: "isActive" as const, label: "Active", desc: "Visible on store" },
              { key: "isFeatured" as const, label: "Featured", desc: "In featured sections" },
              { key: "showOnHomepage" as const, label: "Show on Homepage", desc: "Appears in homepage product grids" },
              { key: "isOfficialLicensed" as const, label: "Official Licensed", desc: "Show official badge" },
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

          {product.images[0] && (
            <Section title="Primary Image">
              <img src={product.images[0].url} alt={product.name} className="w-full aspect-square rounded-xl object-cover" />
            </Section>
          )}

          <ProductQualityChecklist product={{
            name: form.name,
            description: form.description,
            metaTitle: form.metaTitle,
            metaDescription: form.metaDescription,
            images: product.images,
            variants: product.variants,
          }} />
        </div>
      </div>

      {showDup && product && (
        <DuplicateProductModal
          productId={id}
          productName={product.name}
          onClose={() => setShowDup(false)}
        />
      )}
    </div>
  );
}

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
