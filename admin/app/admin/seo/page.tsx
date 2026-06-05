"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Search, Globe, AlertCircle, CheckCircle2, Loader2,
  Eye, EyeOff, ChevronDown, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/cn";

const STORE_API = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SiteSettings {
  id: string;
  key: string;
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  robotsContent?: string;
  canonicalUrl?: string;
  updatedAt: string;
}

// ─── Page configs ─────────────────────────────────────────────────────────────

const PAGES = [
  { key: "seo_home",     label: "Homepage",        url: "/" },
  { key: "seo_products", label: "Products (PLP)",  url: "/products" },
  { key: "seo_cart",     label: "Cart",            url: "/cart" },
  { key: "seo_checkout", label: "Checkout",        url: "/checkout" },
  { key: "seo_about",    label: "About",           url: "/about" },
  { key: "seo_orders",   label: "My Orders",       url: "/orders" },
] as const;

const ROBOTS_OPTS = [
  "index,follow",
  "noindex,follow",
  "index,nofollow",
  "noindex,nofollow",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CharCount({ value, max }: { value: string; max: number }) {
  const n = value.length;
  const pct = n / max;
  return (
    <span className={cn("text-[10px] font-medium tabular-nums",
      pct > 1 ? "text-[#DC2626]" : pct > 0.9 ? "text-[#D97706]" : "text-[#9CA3AF]")}>
      {n}/{max}
    </span>
  );
}

function Field({
  label, value, onChange, placeholder, rows, maxLength, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; maxLength?: number; hint?: string;
}) {
  const cls = "w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] transition-all";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-[#374151]">{label}</label>
        {maxLength && <CharCount value={value} max={maxLength} />}
      </div>
      {rows ? (
        <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} className={cn(cls, "resize-none")} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} className={cn(cls, "h-9")} />
      )}
      {hint && <p className="text-[10px] text-[#9CA3AF] mt-1">{hint}</p>}
    </div>
  );
}

// ─── Google Preview ───────────────────────────────────────────────────────────

function GooglePreview({ title, description, url }: { title: string; description: string; url: string }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF] mb-3 flex items-center gap-1.5">
        <Eye className="h-3 w-3" /> Google Preview
      </p>
      <div className="space-y-0.5">
        <p className="text-xs text-[#006621]">tryby.in{url}</p>
        <p className="text-base text-[#1a0dab] font-medium hover:underline cursor-pointer leading-snug line-clamp-1">
          {title || <span className="text-[#9CA3AF]">Page title will appear here</span>}
        </p>
        <p className="text-xs text-[#545454] leading-relaxed line-clamp-2">
          {description || <span className="text-[#9CA3AF]">Meta description will appear here</span>}
        </p>
      </div>
    </div>
  );
}

// ─── OG Preview ──────────────────────────────────────────────────────────────

function OGPreview({ title, description, imageUrl }: { title: string; description: string; imageUrl: string }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] overflow-hidden bg-white">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF] px-4 pt-3 pb-2 flex items-center gap-1.5">
        <Globe className="h-3 w-3" /> Social Share Preview
      </p>
      {imageUrl && (
        <div className="h-32 bg-[#F3F4F6] border-y border-[#E5E7EB]">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="px-3 py-3 border-t border-[#E5E7EB]">
        <p className="text-[10px] uppercase text-[#9CA3AF]">tryby.in</p>
        <p className="text-sm font-semibold text-[#111827] line-clamp-1">{title || "Title"}</p>
        <p className="text-xs text-[#6B7280] line-clamp-2">{description || "Description"}</p>
      </div>
    </div>
  );
}

// ─── Page SEO Editor ─────────────────────────────────────────────────────────

function PageSEOEditor({
  pageKey, pageUrl, setting, onSaved,
}: {
  pageKey: string;
  pageUrl: string;
  setting?: SiteSettings;
  onSaved: (s: SiteSettings) => void;
}) {
  const [form, setForm] = useState({
    metaTitle:       setting?.metaTitle       ?? "",
    metaDescription: setting?.metaDescription ?? "",
    ogTitle:         setting?.ogTitle         ?? "",
    ogDescription:   setting?.ogDescription   ?? "",
    ogImageUrl:      setting?.ogImageUrl       ?? "",
    robotsContent:   setting?.robotsContent    ?? "index,follow",
    canonicalUrl:    setting?.canonicalUrl      ?? "",
  });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showOG, setShowOG] = useState(false);

  const set = (key: keyof typeof form, val: string) => {
    setForm(p => ({ ...p, [key]: val }));
    setDirty(true); setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${STORE_API}/api/admin/seo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key: pageKey, ...form }),
      });
      const data = await res.json();
      onSaved(data);
      setDirty(false); setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const ogTitle = form.ogTitle || form.metaTitle;
  const ogDesc  = form.ogDescription || form.metaDescription;

  return (
    <div className="space-y-5 pb-4">
      {/* Google preview */}
      <GooglePreview title={form.metaTitle} description={form.metaDescription} url={pageUrl} />

      {/* Meta tags */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">Meta Tags</p>
        <Field label="Meta Title" value={form.metaTitle} onChange={v => set("metaTitle", v)}
          placeholder="TRYBY Sports | Cricket Jerseys & Sports Gear"
          maxLength={60} hint="Ideal: 50–60 characters" />
        <Field label="Meta Description" value={form.metaDescription} onChange={v => set("metaDescription", v)}
          placeholder="Shop official cricket jerseys, football kits and sports gear at TRYBY Sports."
          rows={3} maxLength={160} hint="Ideal: 120–160 characters" />
      </div>

      {/* Robots & canonical */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">Indexing</p>
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1.5">Robots directive</label>
          <select value={form.robotsContent} onChange={e => set("robotsContent", e.target.value)}
            className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm text-[#111827] outline-none focus:border-[#2563EB] transition-all">
            {ROBOTS_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <Field label="Canonical URL" value={form.canonicalUrl} onChange={v => set("canonicalUrl", v)}
          placeholder="https://tryby.in/" hint="Leave blank to use the page URL" />
      </div>

      {/* Open Graph */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
        <button onClick={() => setShowOG(!showOG)}
          className="flex w-full items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#9CA3AF]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">Open Graph</span>
          </div>
          {showOG ? <ChevronDown className="h-4 w-4 text-[#6B7280]" /> : <ChevronRight className="h-4 w-4 text-[#6B7280]" />}
        </button>
        <AnimatePresence>
          {showOG && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="border-t border-[#F3F4F6] px-5 py-4 space-y-4">
                <OGPreview title={ogTitle} description={ogDesc} imageUrl={form.ogImageUrl} />
                <Field label="OG Title" value={form.ogTitle} onChange={v => set("ogTitle", v)}
                  placeholder="Same as Meta Title if left blank" maxLength={70} />
                <Field label="OG Description" value={form.ogDescription} onChange={v => set("ogDescription", v)}
                  rows={2} placeholder="Same as Meta Description if left blank" maxLength={200} />
                <Field label="OG Image URL" value={form.ogImageUrl} onChange={v => set("ogImageUrl", v)}
                  placeholder="https://res.cloudinary.com/..." hint="Recommended: 1200×630px" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between pt-2">
        {(dirty || saved) && (
          <span className={cn("flex items-center gap-1.5 text-xs font-medium",
            saved ? "text-[#16A34A]" : "text-[#D97706]")}>
            {saved
              ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved</>
              : <><AlertCircle className="h-3.5 w-3.5" /> Unsaved changes</>}
          </span>
        )}
        <div className="ml-auto">
          <button onClick={save} disabled={saving || !dirty}
            className="flex items-center gap-1.5 h-9 rounded-lg bg-[#111827] px-5 text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SEOPage() {
  const [settings, setSettings] = useState<SiteSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState(PAGES[0].key);

  useEffect(() => {
    fetch(`${STORE_API}/api/admin/seo`, { credentials: "include" })
      .then(r => r.json())
      .then((data: SiteSettings[]) => { setSettings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const onSaved = (s: SiteSettings) => {
    setSettings(prev =>
      prev.some(p => p.key === s.key)
        ? prev.map(p => p.key === s.key ? s : p)
        : [...prev, s]
    );
  };

  const getSettingFor = (key: string) => settings.find(s => s.key === key);
  const activePage = PAGES.find(p => p.key === activeKey)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-[#111827]">SEO Manager</h1>
        <p className="text-sm text-[#9CA3AF]">Manage meta tags, Open Graph and indexing per page</p>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        {/* Page list */}
        <div className="space-y-0.5">
          {PAGES.map(p => {
            const hasSetting = settings.some(s => s.key === p.key);
            return (
              <button key={p.key} onClick={() => setActiveKey(p.key)}
                className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2.5 transition-colors text-left",
                  activeKey === p.key ? "bg-[#F0F9FF] text-[#2563EB]" : "text-[#6B7280] hover:text-[#374151] hover:bg-[#F3F4F6]")}>
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-[10px] font-mono opacity-60">{p.url}</p>
                  </div>
                </div>
                <span className={cn("h-2 w-2 rounded-full shrink-0",
                  hasSetting ? "bg-[#22C55E]" : "bg-[#E5E7EB]")} />
              </button>
            );
          })}
        </div>

        {/* Editor */}
        <div>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" /></div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={activeKey} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mb-4">
                  <p className="text-base font-bold text-[#111827]">{activePage.label}</p>
                  <p className="text-xs text-[#9CA3AF] font-mono">{activePage.url}</p>
                </div>
                <PageSEOEditor
                  key={activeKey}
                  pageKey={activeKey}
                  pageUrl={activePage.url}
                  setting={getSettingFor(activeKey)}
                  onSaved={onSaved}
                />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
