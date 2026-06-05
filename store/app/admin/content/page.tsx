"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, Megaphone, Tag, ToggleLeft, ToggleRight } from "lucide-react";

interface Announcement {
  id: string; message: string; ctaText?: string; ctaUrl?: string;
  isActive: boolean; sortOrder: number;
}
interface Category {
  id: string; name: string; slug: string; sport?: string; isActive: boolean; sortOrder: number; imageUrl?: string | null;
}

const SPORTS = ["CRICKET", "FOOTBALL", "GYM", "RUNNING", "RACKET", "COMBAT", "OTHER"];
const inp = "w-full rounded-xl px-3.5 text-[13px] text-white placeholder:text-white/25 outline-none transition-colors bg-[#111] border border-white/08 h-10 focus:border-[#F5C518]/50";

export default function AdminContentPage() {
  const [tab, setTab] = useState<"announcements" | "categories">("announcements");

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [aForm, setAForm] = useState({ message: "", ctaText: "", ctaUrl: "", sortOrder: 0 });
  const [aSaving, setASaving] = useState(false);
  const [editA, setEditA] = useState<Announcement | null>(null);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [cForm, setCForm] = useState({ name: "", sport: "CRICKET", imageUrl: "", sortOrder: 0 });
  const [cSaving, setCSaving] = useState(false);

  useEffect(() => {
    if (tab === "announcements") {
      fetch("/api/admin/announcements").then(r => r.json()).then(setAnnouncements).catch(() => {});
    } else {
      fetch("/api/admin/categories").then(r => r.json()).then(setCategories).catch(() => {});
    }
  }, [tab]);

  async function saveAnnouncement() {
    if (!aForm.message.trim()) return;
    setASaving(true);
    try {
      if (editA) {
        const res = await fetch(`/api/admin/announcements/${editA.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aForm),
        });
        if (res.ok) {
          const updated = await res.json();
          setAnnouncements(prev => prev.map(a => a.id === editA.id ? updated : a));
          setEditA(null);
        }
      } else {
        const res = await fetch("/api/admin/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...aForm, isActive: true }),
        });
        if (res.ok) {
          const item = await res.json();
          setAnnouncements(prev => [...prev, item]);
        }
      }
      setAForm({ message: "", ctaText: "", ctaUrl: "", sortOrder: 0 });
    } finally {
      setASaving(false);
    }
  }

  async function toggleAnnouncement(a: Announcement) {
    const res = await fetch(`/api/admin/announcements/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !a.isActive }),
    });
    if (res.ok) {
      setAnnouncements(prev => prev.map(x => x.id === a.id ? { ...x, isActive: !x.isActive } : x));
    }
  }

  async function deleteAnnouncement(id: string) {
    const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    if (res.ok) setAnnouncements(prev => prev.filter(a => a.id !== id));
  }

  async function saveCategory() {
    if (!cForm.name.trim()) return;
    setCSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...cForm, isActive: true }),
      });
      if (res.ok) {
        const cat = await res.json();
        setCategories(prev => [...prev, cat]);
        setCForm({ name: "", sport: "CRICKET", imageUrl: "", sortOrder: 0 });
      }
    } finally {
      setCSaving(false);
    }
  }

  async function deleteCategory(id: string) {
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories(prev => prev.filter(c => c.id !== id));
    } else {
      const data = await res.json();
      alert(data.error ?? "Cannot delete");
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-[900px]">
      <h1 className="text-white font-black mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
        Content Management
      </h1>
      <p className="text-white/40 text-[13px] mb-6">Manage announcement bar messages and product categories</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        {(["announcements", "categories"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold capitalize transition-all"
            style={{
              background: tab === t ? "#F5C518" : "transparent",
              color: tab === t ? "#0D0D0D" : "rgba(255,255,255,0.40)",
            }}
          >
            {t === "announcements" ? <Megaphone className="h-3.5 w-3.5" /> : <Tag className="h-3.5 w-3.5" />}
            {t === "announcements" ? "Announcements" : "Categories"}
          </button>
        ))}
      </div>

      {/* ─── ANNOUNCEMENTS ─── */}
      {tab === "announcements" && (
        <div className="space-y-5">
          {/* Form */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-white font-black text-[14px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {editA ? "Edit Announcement" : "New Announcement"}
            </h2>
            <input
              value={aForm.message} onChange={e => setAForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Announcement text (e.g. 🏏 IPL jerseys now live!)"
              className={inp}
            />
            <div className="grid grid-cols-2 gap-3">
              <input value={aForm.ctaText} onChange={e => setAForm(f => ({ ...f, ctaText: e.target.value }))} placeholder="CTA text (e.g. Shop Now)" className={inp} />
              <input value={aForm.ctaUrl} onChange={e => setAForm(f => ({ ...f, ctaUrl: e.target.value }))} placeholder="CTA URL (e.g. /products)" className={inp} />
            </div>
            <div className="flex items-center gap-3">
              <input type="number" value={aForm.sortOrder} onChange={e => setAForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} placeholder="Sort order" className={inp + " w-32"} />
              <div className="flex gap-2 ml-auto">
                {editA && (
                  <button onClick={() => { setEditA(null); setAForm({ message: "", ctaText: "", ctaUrl: "", sortOrder: 0 }); }} className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-semibold text-white/60 hover:text-white transition-colors" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                )}
                <button
                  onClick={saveAnnouncement}
                  disabled={aSaving || !aForm.message.trim()}
                  className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-black text-[#0D0D0D] disabled:opacity-40 transition-all"
                  style={{ background: "#F5C518" }}
                >
                  <Save className="h-3.5 w-3.5" />
                  {aSaving ? "Saving..." : editA ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            {announcements.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-white/30">
                <Megaphone className="h-8 w-8 mb-3 opacity-40" />
                <p className="text-[13px] font-semibold">No announcements yet</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {announcements.map(a => (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-semibold truncate ${a.isActive ? "text-white" : "text-white/40 line-through"}`}>{a.message}</p>
                      {a.ctaText && <p className="text-[11px] text-white/30 mt-0.5">{a.ctaText} → {a.ctaUrl}</p>}
                    </div>
                    <span className="text-[11px] text-white/30 shrink-0">#{a.sortOrder}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggleAnnouncement(a)} title={a.isActive ? "Deactivate" : "Activate"}>
                        {a.isActive ? <ToggleRight className="h-5 w-5 text-[#4ADE80]" /> : <ToggleLeft className="h-5 w-5 text-white/25" />}
                      </button>
                      <button
                        onClick={() => { setEditA(a); setAForm({ message: a.message, ctaText: a.ctaText ?? "", ctaUrl: a.ctaUrl ?? "", sortOrder: a.sortOrder }); }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 hover:text-[#F5C518] transition-all"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteAnnouncement(a.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 hover:text-[#F87171] transition-all">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── CATEGORIES ─── */}
      {tab === "categories" && (
        <div className="space-y-5">
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-white font-black text-[14px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>New Category</h2>
            <div className="grid grid-cols-2 gap-3">
              <input value={cForm.name} onChange={e => setCForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name (e.g. Cricket)" className={inp} />
              <select value={cForm.sport} onChange={e => setCForm(f => ({ ...f, sport: e.target.value }))} className={inp}>
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <input value={cForm.imageUrl} onChange={e => setCForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="Category image URL (optional)" className={inp} />
            <button
              onClick={saveCategory}
              disabled={cSaving || !cForm.name.trim()}
              className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-black text-[#0D0D0D] disabled:opacity-40 transition-all"
              style={{ background: "#F5C518" }}
            >
              <Plus className="h-4 w-4" />
              {cSaving ? "Creating..." : "Create Category"}
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            {categories.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-white/30">
                <Tag className="h-8 w-8 mb-3 opacity-40" />
                <p className="text-[13px] font-semibold">No categories yet</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {categories.map(c => (
                  <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} className="h-9 w-9 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-9 w-9 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#2A2A2A" }}>
                        <Tag className="h-4 w-4 text-white/20" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate">{c.name}</p>
                      <p className="text-[11px] text-white/30">{c.slug} · {c.sport}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${c.isActive ? "text-[#4ADE80]" : "text-white/30"}`} style={{ background: c.isActive ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)" }}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                    <button onClick={() => deleteCategory(c.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 hover:text-[#F87171] transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
