"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, Megaphone, ToggleLeft, ToggleRight } from "lucide-react";

interface Announcement {
  id: string; message: string; ctaText?: string; ctaUrl?: string;
  isActive: boolean; sortOrder: number;
}

const inp = "w-full rounded-xl px-3.5 text-[13px] text-white placeholder:text-white/25 outline-none transition-colors bg-[#111] border border-white/08 h-10 focus:border-[#F5C518]/50";

export default function AnnouncementsPage() {
  const [items, setItems]   = useState<Announcement[]>([]);
  const [form, setForm]     = useState({ message: "", ctaText: "", ctaUrl: "", sortOrder: 0 });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/announcements").then(r => r.json()).then(setItems).catch(() => {});
  }, []);

  async function save() {
    if (!form.message.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        const res = await fetch(`/api/admin/announcements/${editId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
        });
        if (res.ok) { const u = await res.json(); setItems(p => p.map(a => a.id === editId ? u : a)); setEditId(null); }
      } else {
        const res = await fetch("/api/admin/announcements", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, isActive: true }),
        });
        if (res.ok) { const newItem = await res.json(); setItems(p => [...p, newItem]); }
      }
      setForm({ message: "", ctaText: "", ctaUrl: "", sortOrder: 0 });
    } finally { setSaving(false); }
  }

  async function toggle(a: Announcement) {
    const res = await fetch(`/api/admin/announcements/${a.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !a.isActive }),
    });
    if (res.ok) setItems(p => p.map(x => x.id === a.id ? { ...x, isActive: !x.isActive } : x));
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    if (res.ok) setItems(p => p.filter(a => a.id !== id));
  }

  return (
    <div className="p-6 lg:p-8 max-w-[800px]">
      <h1 className="text-white font-black mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>Announcements</h1>
      <p className="text-white/40 text-[13px] mb-6">Manage the announcement bar shown on every storefront page</p>

      {/* Form */}
      <div className="rounded-2xl p-5 space-y-3 mb-6" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-white font-black text-[14px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {editId ? "Edit Announcement" : "New Announcement"}
        </h2>
        <input value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder="Announcement text (e.g. 🏏 IPL jerseys now live!)" className={inp} />
        <div className="grid grid-cols-2 gap-3">
          <input value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))} placeholder="Button text" className={inp} />
          <input value={form.ctaUrl} onChange={e => setForm(f => ({ ...f, ctaUrl: e.target.value }))} placeholder="Button URL" className={inp} />
        </div>
        <div className="flex items-center gap-3">
          <input type="number" value={form.sortOrder}
            onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
            placeholder="Sort order" className={inp + " w-32"} />
          <div className="flex gap-2 ml-auto">
            {editId && (
              <button onClick={() => { setEditId(null); setForm({ message: "", ctaText: "", ctaUrl: "", sortOrder: 0 }); }}
                className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            )}
            <button onClick={save} disabled={saving || !form.message.trim()}
              className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-black text-[#0D0D0D] disabled:opacity-40"
              style={{ background: "#F5C518" }}>
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : editId ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-white/30">
            <Megaphone className="h-8 w-8 mb-3 opacity-40" />
            <p className="text-[13px] font-semibold">No announcements yet</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {[...items].sort((a, b) => a.sortOrder - b.sortOrder).map(a => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-semibold truncate ${a.isActive ? "text-white" : "text-white/35 line-through"}`}>{a.message}</p>
                  {a.ctaText && <p className="text-[11px] text-white/30 mt-0.5">{a.ctaText} → {a.ctaUrl}</p>}
                </div>
                <span className="text-[11px] text-white/25 shrink-0">#{a.sortOrder}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggle(a)} title={a.isActive ? "Deactivate" : "Activate"}>
                    {a.isActive ? <ToggleRight className="h-5 w-5 text-[#4ADE80]" /> : <ToggleLeft className="h-5 w-5 text-white/25" />}
                  </button>
                  <button onClick={() => { setEditId(a.id); setForm({ message: a.message, ctaText: a.ctaText ?? "", ctaUrl: a.ctaUrl ?? "", sortOrder: a.sortOrder }); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-[#F5C518] transition-all">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => remove(a.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/25 hover:text-[#F87171] transition-all">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
