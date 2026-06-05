"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Eye, EyeOff, ChevronUp, ChevronDown, Edit2, Save,
  Plus, Trash2, Check, Globe, FileText, RefreshCw,
  Image as ImageIcon, Type, Link as LinkIcon, AlignLeft,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type BlockStatus = "DRAFT" | "PUBLISHED";
type BlockType =
  | "HERO_BANNER"
  | "TRUST_BAR"
  | "CATEGORY_GRID"
  | "TRENDING_PRODUCTS"
  | "PROMO_BANNER"
  | "FOOTER_COLUMN"
  | "STATIC_PAGE";

interface ContentBlock {
  id: string;
  type: BlockType;
  key: string;
  title?: string;
  isActive: boolean;
  sortOrder: number;
  status: BlockStatus;
  publishedAt?: string;
  data: Record<string, unknown>;
}

// ─── Block definitions (what fields each type has) ───────────────────────────

const BLOCK_META: Record<BlockType, { label: string; icon: string; description: string; fields: FieldDef[] }> = {
  HERO_BANNER: {
    label: "Hero Banner",
    icon: "🖼️",
    description: "Full-width homepage hero — headline, subtext, CTA button, background image",
    fields: [
      { key: "headline",    label: "Headline",           type: "text",     placeholder: "Official IPL Jerseys. Just Landed." },
      { key: "subheadline", label: "Subheadline",        type: "text",     placeholder: "Shop the full 2025 IPL collection" },
      { key: "ctaText",     label: "Button Text",        type: "text",     placeholder: "Shop Now" },
      { key: "ctaUrl",      label: "Button URL",         type: "text",     placeholder: "/products?sport=CRICKET" },
      { key: "imageUrl",    label: "Background Image URL", type: "image",  placeholder: "https://res.cloudinary.com/..." },
      { key: "imageAlt",    label: "Image Alt Text",     type: "text",     placeholder: "IPL 2025 Cricket Jerseys" },
      { key: "overlayOpacity", label: "Overlay Opacity (0–1)", type: "number", placeholder: "0.4" },
      { key: "badge",       label: "Badge Text",         type: "text",     placeholder: "NEW COLLECTION" },
    ],
  },
  TRUST_BAR: {
    label: "Trust Bar",
    icon: "✅",
    description: "Row of trust signals shown below the hero",
    fields: [
      { key: "items", label: "Trust Items (JSON array)", type: "json",
        placeholder: '[{"icon":"🚚","title":"Free Delivery","sub":"On orders above ₹499"},{"icon":"🔄","title":"7-Day Returns","sub":"Hassle-free"}]' },
    ],
  },
  CATEGORY_GRID: {
    label: "Category Grid",
    icon: "🏷️",
    description: "Sport category tiles on the homepage",
    fields: [
      { key: "heading",  label: "Section Heading",  type: "text", placeholder: "Shop by Sport" },
      { key: "categories", label: "Category slugs (comma-separated)", type: "text", placeholder: "cricket,football,gym,running" },
    ],
  },
  TRENDING_PRODUCTS: {
    label: "Trending Products",
    icon: "🔥",
    description: "Auto-pulled trending products section",
    fields: [
      { key: "heading", label: "Section Heading", type: "text", placeholder: "Trending This Week" },
      { key: "sport",   label: "Filter by Sport (leave blank for all)", type: "text", placeholder: "CRICKET" },
      { key: "limit",   label: "Max Products",    type: "number", placeholder: "8" },
    ],
  },
  PROMO_BANNER: {
    label: "Promo Banner",
    icon: "📢",
    description: "Full-width promotional strip with CTA",
    fields: [
      { key: "text",      label: "Banner Text",   type: "text",  placeholder: "Use code TRYBY10 for 10% off" },
      { key: "ctaText",   label: "Button Text",   type: "text",  placeholder: "Shop Now" },
      { key: "ctaUrl",    label: "Button URL",    type: "text",  placeholder: "/products" },
      { key: "bgColor",   label: "Background Color", type: "text", placeholder: "#F5C518" },
      { key: "textColor", label: "Text Color",    type: "text",  placeholder: "#0D0D0D" },
    ],
  },
  FOOTER_COLUMN: {
    label: "Footer Column",
    icon: "📋",
    description: "A column of links in the site footer",
    fields: [
      { key: "heading", label: "Column Heading", type: "text", placeholder: "Quick Links" },
      { key: "links",   label: "Links (JSON array)", type: "json",
        placeholder: '[{"label":"About","href":"/about"},{"label":"FAQ","href":"/faq"}]' },
    ],
  },
  STATIC_PAGE: {
    label: "Static Page",
    icon: "📄",
    description: "Rich text content for static pages (About, etc.)",
    fields: [
      { key: "pageKey", label: "Page Key", type: "text",     placeholder: "about" },
      { key: "body",    label: "Body (Markdown/HTML)", type: "textarea", placeholder: "# About TRYBY\n\nWe are..." },
    ],
  },
};

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "json" | "image";
  placeholder?: string;
}

const BLOCK_TYPES = Object.keys(BLOCK_META) as BlockType[];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inp = "w-full rounded-xl px-3.5 text-[13px] text-white placeholder:text-white/20 outline-none transition-colors bg-[#111] border border-white/08 h-10 focus:border-[#F5C518]/60";
const textareaInp = "w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/20 outline-none transition-colors bg-[#111] border border-white/08 focus:border-[#F5C518]/60 resize-y min-h-[80px]";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
}

// ─── Block Editor ─────────────────────────────────────────────────────────────

function BlockEditor({
  block, onSave, onClose,
}: {
  block: ContentBlock;
  onSave: (updated: ContentBlock) => void;
  onClose: () => void;
}) {
  const meta = BLOCK_META[block.type];
  const [data, setData] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of meta.fields) {
      const v = block.data[f.key];
      init[f.key] = typeof v === "string" ? v : (v != null ? JSON.stringify(v, null, 2) : "");
    }
    return init;
  });
  const [title, setTitle] = useState(block.title ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(publish: boolean) {
    setError(""); setSaving(true);
    try {
      // Parse JSON fields back
      const parsedData: Record<string, unknown> = {};
      for (const f of meta.fields) {
        if (f.type === "json" && data[f.key]) {
          try { parsedData[f.key] = JSON.parse(data[f.key]); }
          catch { setError(`Invalid JSON in "${f.label}"`); setSaving(false); return; }
        } else if (f.type === "number") {
          parsedData[f.key] = data[f.key] ? Number(data[f.key]) : undefined;
        } else {
          parsedData[f.key] = data[f.key] || undefined;
        }
      }

      const res = await fetch(`/api/admin/content/blocks/${block.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || undefined,
          data: parsedData,
          status: publish ? "PUBLISHED" : "DRAFT",
        }),
      });
      if (!res.ok) { setError("Save failed"); return; }
      const updated = await res.json();
      onSave(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0" style={{ background: "rgba(0,0,0,0.80)" }} onClick={onClose}>
      <div
        className="w-full max-w-[680px] rounded-[24px] overflow-hidden flex flex-col max-h-[90vh]"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <span className="text-xl">{meta.icon}</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-black text-[16px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{meta.label}</h2>
            <p className="text-white/35 text-[11px] truncate">{meta.description}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white text-[20px] leading-none">×</button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Internal title */}
          <div>
            <label className="block text-[11px] font-semibold text-white/40 mb-1.5 uppercase tracking-widest">Admin Label</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Homepage Hero — IPL 2025" className={inp} />
          </div>

          {/* Fields */}
          {meta.fields.map(f => (
            <div key={f.key}>
              <label className="block text-[11px] font-semibold text-white/40 mb-1.5 uppercase tracking-widest">
                {f.label}
                {f.type === "image" && <span className="ml-1 text-[#F5C518] normal-case font-normal">← paste from Media Library</span>}
              </label>
              {f.type === "textarea" || f.type === "json" ? (
                <textarea
                  value={data[f.key] ?? ""}
                  onChange={e => setData(d => ({ ...d, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className={textareaInp}
                  rows={f.type === "json" ? 5 : 3}
                />
              ) : (
                <input
                  type={f.type === "number" ? "number" : "text"}
                  value={data[f.key] ?? ""}
                  onChange={e => setData(d => ({ ...d, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className={inp}
                />
              )}
            </div>
          ))}

          {error && (
            <div className="rounded-xl px-4 py-3 text-[12px] font-semibold text-[#F87171]" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center gap-3 px-6 py-4 border-t shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-semibold text-white/60 hover:text-white transition-colors disabled:opacity-40"
            style={{ border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <FileText className="h-3.5 w-3.5" />
            Save as Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-1.5 h-10 px-5 rounded-xl text-[13px] font-black text-[#0D0D0D] disabled:opacity-40 transition-all ml-auto"
            style={{ background: "#F5C518" }}
          >
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New Block Dialog ─────────────────────────────────────────────────────────

function NewBlockDialog({ onCreated, onClose }: {
  onCreated: (block: ContentBlock) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<BlockType>("HERO_BANNER");
  const [key, setKey]   = useState("");
  const [creating, setCreating] = useState(false);

  async function create() {
    if (!key.trim()) return;
    setCreating(true);
    const res = await fetch("/api/admin/content/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, key: slugify(key), title: key, data: {}, status: "DRAFT", isActive: false, sortOrder: 99 }),
    });
    if (res.ok) {
      const block = await res.json();
      onCreated(block);
    }
    setCreating(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.80)" }} onClick={onClose}>
      <div className="w-full max-w-[440px] rounded-[24px] p-6" style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.1)" }} onClick={e => e.stopPropagation()}>
        <h2 className="text-white font-black text-[18px] mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Add Content Block</h2>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-[11px] font-semibold text-white/40 mb-1.5 uppercase tracking-widest">Block Type</label>
            <div className="grid grid-cols-2 gap-2">
              {BLOCK_TYPES.map(t => {
                const m = BLOCK_META[t];
                return (
                  <button
                    key={t} onClick={() => setType(t)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all"
                    style={{
                      background: type === t ? "rgba(245,197,24,0.1)" : "rgba(255,255,255,0.03)",
                      border: type === t ? "1px solid rgba(245,197,24,0.35)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span className="text-base">{m.icon}</span>
                    <span className="text-[12px] font-semibold text-white">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-white/40 mb-1.5 uppercase tracking-widest">Block Key (unique identifier)</label>
            <input
              value={key} onChange={e => setKey(e.target.value)}
              placeholder={`e.g. homepage_hero_summer`}
              className={inp}
            />
            {key && <p className="text-[10px] text-white/25 mt-1 font-mono">key: {slugify(key)}</p>}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white transition-colors" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            Cancel
          </button>
          <button
            onClick={create} disabled={creating || !key.trim()}
            className="flex-1 h-10 rounded-xl text-[13px] font-black text-[#0D0D0D] disabled:opacity-40 transition-all"
            style={{ background: "#F5C518" }}
          >
            {creating ? "Creating…" : "Create Block"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function HomepageBuilderPage() {
  const [blocks, setBlocks]       = useState<ContentBlock[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editBlock, setEditBlock] = useState<ContentBlock | null>(null);
  const [showNew, setShowNew]     = useState(false);
  const [saving, setSaving]       = useState<string | null>(null); // id being saved

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/content/blocks");
    if (res.ok) setBlocks(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  async function toggleActive(block: ContentBlock) {
    setSaving(block.id);
    const res = await fetch(`/api/admin/content/blocks/${block.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !block.isActive }),
    });
    if (res.ok) {
      setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, isActive: !b.isActive } : b));
    }
    setSaving(null);
  }

  async function moveBlock(block: ContentBlock, dir: "up" | "down") {
    const sorted = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex(b => b.id === block.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const a = sorted[idx];
    const b = sorted[swapIdx];
    const newA = a.sortOrder;
    const newB = b.sortOrder;

    setSaving(block.id);
    await Promise.all([
      fetch(`/api/admin/content/blocks/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: newB }) }),
      fetch(`/api/admin/content/blocks/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: newA }) }),
    ]);
    setBlocks(prev => prev.map(bl => {
      if (bl.id === a.id) return { ...bl, sortOrder: newB };
      if (bl.id === b.id) return { ...bl, sortOrder: newA };
      return bl;
    }));
    setSaving(null);
  }

  async function deleteBlock(id: string) {
    if (!confirm("Delete this content block? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/content/blocks/${id}`, { method: "DELETE" });
    if (res.ok) setBlocks(prev => prev.filter(b => b.id !== id));
  }

  const sorted = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="p-6 lg:p-8 max-w-[900px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Homepage Builder
          </h1>
          <p className="text-white/40 text-[13px]">{blocks.length} content blocks · Drag order to re-arrange</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </a>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-black text-[#0D0D0D] transition-opacity hover:opacity-88"
            style={{ background: "#F5C518" }}
          >
            <Plus className="h-4 w-4" /> Add Block
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-5 text-[11px] text-white/30">
        <div className="flex items-center gap-1.5"><Globe className="h-3 w-3 text-[#4ADE80]" /> Published & visible</div>
        <div className="flex items-center gap-1.5"><FileText className="h-3 w-3 text-[#F5C518]" /> Draft (hidden from store)</div>
        <div className="flex items-center gap-1.5"><EyeOff className="h-3 w-3 text-white/30" /> Inactive</div>
      </div>

      {/* Block list */}
      {loading ? (
        <div className="flex flex-col items-center py-20 text-white/30">
          <RefreshCw className="h-7 w-7 animate-spin mb-3 opacity-40" />
          <p className="text-[13px]">Loading blocks…</p>
        </div>
      ) : sorted.length === 0 ? (
        <div
          className="flex flex-col items-center py-20 rounded-2xl text-white/30 cursor-pointer hover:border-white/15 transition-colors"
          style={{ border: "1.5px dashed rgba(255,255,255,0.08)" }}
          onClick={() => setShowNew(true)}
        >
          <Plus className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-[14px] font-semibold">No content blocks yet</p>
          <p className="text-[12px] mt-1">Click to add your first block</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((block, idx) => {
            const meta = BLOCK_META[block.type];
            const isLive = block.isActive && block.status === "PUBLISHED";
            const isSavingThis = saving === block.id;
            return (
              <div
                key={block.id}
                className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-all"
                style={{
                  background: "#1A1A1A",
                  border: `1px solid ${isLive ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)"}`,
                  opacity: isSavingThis ? 0.6 : 1,
                }}
              >
                {/* Sort arrows */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => moveBlock(block, "up")}
                    disabled={idx === 0 || !!saving}
                    className="flex h-5 w-5 items-center justify-center rounded text-white/20 hover:text-white disabled:opacity-0 transition-all"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveBlock(block, "down")}
                    disabled={idx === sorted.length - 1 || !!saving}
                    className="flex h-5 w-5 items-center justify-center rounded text-white/20 hover:text-white disabled:opacity-0 transition-all"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Block type icon */}
                <span className="text-xl shrink-0">{meta.icon}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[13px] font-semibold text-white truncate">
                      {block.title || block.key}
                    </p>
                    {/* Status pill */}
                    {isLive ? (
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-black text-[#4ADE80] shrink-0" style={{ background: "rgba(74,222,128,0.1)" }}>LIVE</span>
                    ) : block.status === "PUBLISHED" && !block.isActive ? (
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-black text-white/30 shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>HIDDEN</span>
                    ) : (
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-black text-[#F5C518] shrink-0" style={{ background: "rgba(245,197,24,0.1)" }}>DRAFT</span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/30">{meta.label} · key: {block.key}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Eye toggle */}
                  <button
                    onClick={() => toggleActive(block)}
                    disabled={!!saving}
                    title={block.isActive ? "Hide from store" : "Show on store"}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-all"
                    style={{ color: block.isActive ? "#4ADE80" : "rgba(255,255,255,0.2)" }}
                  >
                    {block.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => setEditBlock(block)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-[#F5C518] hover:bg-[#F5C518]/08 transition-all"
                    title="Edit content"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/25 hover:text-[#F87171] hover:bg-[#F87171]/08 transition-all"
                    title="Delete block"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Store read note */}
      <div className="mt-6 rounded-2xl px-5 py-4" style={{ background: "rgba(245,197,24,0.05)", border: "1px solid rgba(245,197,24,0.12)" }}>
        <p className="text-[12px] text-white/40 leading-relaxed">
          <strong className="text-[#F5C518]">How it works:</strong> Published + active blocks are read by the storefront homepage every 60 seconds.
          Draft blocks are invisible to customers. Use the eye icon to toggle visibility without losing your draft.
        </p>
      </div>

      {/* Modals */}
      {editBlock && (
        <BlockEditor
          block={editBlock}
          onSave={updated => {
            setBlocks(prev => prev.map(b => b.id === updated.id ? updated : b));
            setEditBlock(null);
          }}
          onClose={() => setEditBlock(null)}
        />
      )}

      {showNew && (
        <NewBlockDialog
          onCreated={block => { setBlocks(prev => [...prev, block]); setShowNew(false); setEditBlock(block); }}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  );
}
