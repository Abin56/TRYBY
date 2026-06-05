"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, Tag, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from "lucide-react";

interface Category {
  id: string; name: string; slug: string; sport?: string;
  imageUrl?: string; description?: string; isActive: boolean; sortOrder: number;
  metaTitle?: string; metaDescription?: string;
  _count?: { products: number };
}

const SPORTS = ["CRICKET", "FOOTBALL", "GYM", "RUNNING", "RACKET", "COMBAT", "OTHER"];
const inp = "w-full rounded-xl px-3.5 text-[13px] text-white placeholder:text-white/25 outline-none transition-colors bg-[#111] border border-white/08 h-10 focus:border-[#F5C518]/50";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: "", sport: "CRICKET", imageUrl: "", description: "", sortOrder: 0,
    metaTitle: "", metaDescription: "",
  });
  const [saving, setSaving]       = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [expandSeo, setExpandSeo] = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories").then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name,
      sport: form.sport,
      imageUrl: form.imageUrl || undefined,
      description: form.description || undefined,
      sortOrder: form.sortOrder,
      metaTitle: form.metaTitle || undefined,
      metaDescription: form.metaDescription || undefined,
    };
    try {
      if (editId) {
        const res = await fetch(`/api/admin/categories/${editId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (res.ok) { const u = await res.json(); setCategories(p => p.map(c => c.id === editId ? u : c)); setEditId(null); }
      } else {
        const res = await fetch("/api/admin/categories", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, isActive: true }),
        });
        if (res.ok) { const newCat = await res.json(); setCategories(p => [...p, newCat]); }
      }
      setForm({ name: "", sport: "CRICKET", imageUrl: "", description: "", sortOrder: 0, metaTitle: "", metaDescription: "" });
      setExpandSeo(false);
    } finally { setSaving(false); }
  }

  async function toggleActive(cat: Category) {
    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !cat.isActive }),
    });
    if (res.ok) setCategories(p => p.map(c => c.id === cat.id ? { ...c, isActive: !c.isActive } : c));
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) setCategories(p => p.filter(c => c.id !== id));
    else { const d = await res.json(); alert(d.error ?? "Cannot delete"); }
  }

  function startEdit(cat: Category) {
    setEditId(cat.id);
    setForm({
      name: cat.name, sport: cat.sport ?? "CRICKET",
      imageUrl: cat.imageUrl ?? "", description: cat.description ?? "",
      sortOrder: cat.sortOrder,
      metaTitle: cat.metaTitle ?? "", metaDescription: cat.metaDescription ?? "",
    });
    setExpandSeo(!!(cat.metaTitle || cat.metaDescription));
  }

  const seoCount = categories.filter(c => c.metaTitle || c.metaDescription).length;

  return (
    <div className="p-6 lg:p-8 max-w-[800px]">
      <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>Categories</h1>
      <p className="text-white/40 text-[13px] mb-6">
        {categories.length} categories · {seoCount} with SEO
      </p>

      {/* Form */}
      <div className="rounded-2xl p-5 space-y-3 mb-6" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-white font-black text-[14px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {editId ? "Edit Category" : "New Category"}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name (e.g. Cricket Jerseys)" className={inp} />
          <select value={form.sport} onChange={e => setForm(f => ({ ...f, sport: e.target.value }))} className={inp}>
            {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="Category image URL" className={inp} />
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short category description (shown on category pages)" rows={2} className={inp + " resize-none h-auto pt-2.5"} />

        {/* SEO accordion */}
        <button
          onClick={() => setExpandSeo(v => !v)}
          className="flex items-center gap-2 w-full text-[12px] font-semibold text-white/40 hover:text-white/70 transition-colors pt-1"
        >
          {expandSeo ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          SEO Fields {form.metaTitle || form.metaDescription ? <span className="text-[#4ADE80] text-[10px]">✓ filled</span> : <span className="text-[#F5C518] text-[10px]">optional</span>}
        </button>

        {expandSeo && (
          <div className="space-y-3 pl-2 border-l-2" style={{ borderColor: "rgba(245,197,24,0.2)" }}>
            <div>
              <label className="block text-[10px] font-semibold text-white/35 mb-1.5 uppercase tracking-widest">Meta Title</label>
              <input
                value={form.metaTitle}
                onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))}
                placeholder="Buy Cricket Jerseys Online | TRYBY"
                className={inp}
              />
              <p className="text-[10px] text-white/20 mt-1">{form.metaTitle.length}/60 chars · keep under 60 for Google</p>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-white/35 mb-1.5 uppercase tracking-widest">Meta Description</label>
              <textarea
                value={form.metaDescription}
                onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))}
                placeholder="Shop official cricket jerseys from IPL, Test, and T20 teams. Fast delivery across India..."
                rows={3}
                className={inp + " resize-none h-auto pt-2.5"}
              />
              <p className={`text-[10px] mt-1 ${form.metaDescription.length > 160 ? "text-[#F87171]" : form.metaDescription.length >= 120 ? "text-[#4ADE80]" : "text-white/20"}`}>
                {form.metaDescription.length}/160 chars · ideal 120-160
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
            placeholder="Sort order" className={inp + " w-28"} />
          <div className="flex gap-2 ml-auto">
            {editId && (
              <button
                onClick={() => { setEditId(null); setForm({ name: "", sport: "CRICKET", imageUrl: "", description: "", sortOrder: 0, metaTitle: "", metaDescription: "" }); setExpandSeo(false); }}
                className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            )}
            <button onClick={save} disabled={saving || !form.name.trim()}
              className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-black text-[#0D0D0D] disabled:opacity-40"
              style={{ background: "#F5C518" }}>
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving…" : editId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        {categories.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-white/30">
            <Tag className="h-8 w-8 mb-3 opacity-40" />
            <p className="text-[13px] font-semibold">No categories yet</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {[...categories].sort((a, b) => a.sortOrder - b.sortOrder).map(cat => (
              <div key={cat.id} className="px-5 py-4">
                <div className="flex items-center gap-4">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="h-10 w-10 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-xl shrink-0 flex items-center justify-center" style={{ background: "#2A2A2A" }}>
                      <Tag className="h-4 w-4 text-white/20" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-white truncate">{cat.name}</p>
                      {cat.metaTitle ? (
                        <span className="text-[9px] font-bold text-[#4ADE80] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,0.1)" }}>SEO</span>
                      ) : (
                        <span className="text-[9px] font-bold text-white/20 px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>No SEO</span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/30">{cat.slug} · {cat.sport}</p>
                  </div>
                  <span className="text-[10px] text-white/25 shrink-0">#{cat.sortOrder}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActive(cat)} title={cat.isActive ? "Deactivate" : "Activate"}>
                      {cat.isActive ? <ToggleRight className="h-5 w-5 text-[#4ADE80]" /> : <ToggleLeft className="h-5 w-5 text-white/25" />}
                    </button>
                    <button
                      onClick={() => startEdit(cat)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-[#F5C518] transition-all">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => remove(cat.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/25 hover:text-[#F87171] transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {/* SEO preview */}
                {cat.metaTitle && (
                  <div className="mt-2 ml-14 text-[11px] text-white/25 truncate">
                    <span className="text-white/40">{cat.metaTitle}</span>
                    {cat.metaDescription && <span> — {cat.metaDescription.slice(0, 80)}…</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
