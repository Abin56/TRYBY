"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag, Plus, Trash2, X, RefreshCw } from "lucide-react";

interface CustomerTag {
  id: string;
  name: string;
  color: string;
  description: string | null;
}

const PRESET_COLORS = [
  "#3B82F6", "#22C55E", "#F5C518", "#EF4444", "#A78BFA",
  "#F97316", "#EC4899", "#06B6D4", "#8B5CF6", "#6B7280",
];

const SEGMENT_INFO = [
  { key: "VIP", label: "VIP", desc: "LTV ≥ ₹50,000", color: "#F5C518" },
  { key: "HIGH_VALUE", label: "High Value", desc: "LTV ≥ ₹15,000", color: "#A78BFA" },
  { key: "REPEAT_BUYER", label: "Repeat Buyer", desc: "2+ orders", color: "#3B82F6" },
  { key: "LOYAL", label: "Loyal", desc: "5+ orders, active ≤60d", color: "#06B6D4" },
  { key: "NEW_CUSTOMER", label: "New Customer", desc: "1 order", color: "#22C55E" },
  { key: "WHOLESALE", label: "Wholesale", desc: "20+ orders", color: "#8B5CF6" },
  { key: "AT_RISK", label: "At Risk", desc: "Inactive 90–180d", color: "#EAB308" },
  { key: "INACTIVE", label: "Inactive", desc: "No order in 90d", color: "#6B7280" },
  { key: "CHURNED", label: "Churned", desc: "No order in 180d", color: "#EF4444" },
  { key: "REFUND_RISK", label: "Refund Risk", desc: "Refund rate ≥30%, 2+ refunds", color: "#EC4899" },
  { key: "COD_RISK", label: "COD Risk", desc: "COD success rate <50%, 3+ COD orders", color: "#F97316" },
];

export default function SegmentsPage() {
  const [tags, setTags] = useState<CustomerTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/crm/segments");
    const json = await r.json();
    setTags(json.tags ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/admin/crm/segments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color, description: desc }),
    });
    setSaving(false);
    setShowAdd(false);
    setName(""); setDesc("");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this tag?")) return;
    setDeleting(id);
    await fetch("/api/admin/crm/segments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeleting(null);
    load();
  }

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-black text-2xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
            SEGMENTS & TAGS
          </h1>
          <p className="text-white/40 text-[13px]">Auto segments + custom tags for customer classification</p>
        </div>
        <Link href="/admin/crm" className="text-[12px] text-white/40 hover:text-white px-3 py-1.5 rounded-lg"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          ← CRM Center
        </Link>
      </div>

      {/* Auto segments */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h2 className="text-white font-bold text-[14px]">Automatic Segments</h2>
          <p className="text-white/40 text-[12px] mt-0.5">Computed by CRM engine on every re-score</p>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {SEGMENT_INFO.map((s) => (
            <Link key={s.key} href={`/admin/crm/customers?segment=${s.key}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/03 transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="h-3 w-3 rounded-full shrink-0" style={{ background: s.color }} />
              <div className="flex-1">
                <p className="text-white text-[13px] font-medium">{s.label}</p>
                <p className="text-white/40 text-[11px]">{s.desc}</p>
              </div>
              <span className="text-white/25 text-[11px]">View →</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Custom tags */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div>
            <h2 className="text-white font-bold text-[14px]">Custom Tags</h2>
            <p className="text-white/40 text-[12px] mt-0.5">Manually assign to customers from their profile</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold"
            style={{ background: "#E8FF47", color: "#0D0D0D" }}>
            <Plus className="h-4 w-4" /> Add Tag
          </button>
        </div>
        <div className="p-4">
          {loading && <p className="text-white/30 text-center py-6">Loading…</p>}
          {!loading && tags.length === 0 && (
            <p className="text-white/30 text-center py-8 text-[13px]">No custom tags yet</p>
          )}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: `${tag.color}15`, border: `1px solid ${tag.color}44` }}>
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: tag.color }} />
                <span className="text-[13px] font-medium" style={{ color: tag.color }}>{tag.name}</span>
                {tag.description && <span className="text-[11px] text-white/40">— {tag.description}</span>}
                <button onClick={() => remove(tag.id)} disabled={deleting === tag.id}
                  className="ml-1 hover:opacity-70 text-white/30 hover:text-red-400 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add tag modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl p-5 w-80 space-y-4" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold">Create Tag</h3>
              <button onClick={() => setShowAdd(false)}><X className="h-4 w-4 text-white/40" /></button>
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tag name"
              className="w-full px-3 py-2 rounded-xl text-[13px] text-white outline-none placeholder:text-white/25"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)"
              className="w-full px-3 py-2 rounded-xl text-[13px] text-white outline-none placeholder:text-white/25"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
            <div>
              <p className="text-white/40 text-[11px] mb-2">Pick color</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)}
                    className="h-7 w-7 rounded-full transition-all"
                    style={{ background: c, outline: color === c ? `3px solid white` : "none", outlineOffset: "2px" }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl text-[13px] text-white/60"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}>Cancel</button>
              <button onClick={save} disabled={saving || !name.trim()}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-40"
                style={{ background: color, color: "#fff" }}>
                {saving ? "Saving…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
