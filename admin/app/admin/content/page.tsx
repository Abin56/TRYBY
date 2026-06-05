"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Plus, Trash2, Eye, EyeOff, GripVertical,
  ChevronDown, ChevronRight, Megaphone, Layers, Shield, AlignLeft,
  ToggleLeft, ToggleRight, AlertCircle, CheckCircle2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { MediaPicker } from "@/components/ui/media-picker";

const STORE_API = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentBlock {
  id: string;
  type: string;
  key: string;
  title: string | null;
  isActive: boolean;
  sortOrder: number;
  data: Record<string, unknown>;
  updatedAt: string;
}

interface AnnouncementItem {
  id: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

// ─── Section tabs ─────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "announcements", label: "Announcement Bar", icon: Megaphone },
  { id: "hero",          label: "Hero Banner",       icon: Layers },
  { id: "trust",         label: "Trust Bar",         icon: Shield },
  { id: "footer",        label: "Footer",            icon: AlignLeft },
] as const;

type Section = (typeof SECTIONS)[number]["id"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, type = "text", placeholder, rows,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; rows?: number;
}) {
  const cls = "w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] transition-all";
  return (
    <div>
      <label className="block text-xs font-semibold text-[#374151] mb-1.5">{label}</label>
      {rows ? (
        <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} className={cn(cls, "resize-none")} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} className={cn(cls, "h-9")} />
      )}
    </div>
  );
}

function Toggle({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[#F3F4F6] last:border-0">
      <div>
        <p className="text-sm font-semibold text-[#374151]">{label}</p>
        {desc && <p className="text-xs text-[#9CA3AF] mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        className={cn("relative flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 mt-0.5",
          value ? "bg-[#2563EB]" : "bg-[#D1D5DB]")}>
        <span className={cn("absolute h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
          value ? "translate-x-4" : "translate-x-0.5")} />
      </button>
    </div>
  );
}

function SaveBar({ dirty, saving, saved, onSave }: { dirty: boolean; saving: boolean; saved: boolean; onSave: () => void }) {
  return (
    <AnimatePresence>
      {dirty && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl bg-[#111827] border border-white/10 px-5 py-3 shadow-2xl"
        >
          {saved ? (
            <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
          ) : (
            <AlertCircle className="h-4 w-4 text-[#F59E0B]" />
          )}
          <span className="text-sm text-white font-medium">
            {saved ? "Saved successfully" : "You have unsaved changes"}
          </span>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#111827] hover:bg-[#F3F4F6] transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Announcement Section ─────────────────────────────────────────────────────

function AnnouncementsSection() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch(`${STORE_API}/api/admin/announcements`, { credentials: "include" })
      .then(r => r.json())
      .then((data: AnnouncementItem[]) => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const mark = () => { setDirty(true); setSaved(false); };

  const update = (id: string, patch: Partial<AnnouncementItem>) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
    mark();
  };

  const addNew = () => {
    const tempItem: AnnouncementItem = {
      id: `new-${Date.now()}`,
      message: "",
      isActive: true,
      sortOrder: items.length,
    };
    setItems(prev => [...prev, tempItem]);
    mark();
  };

  const remove = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
    mark();
  };

  const save = async () => {
    setSaving(true);
    try {
      for (const item of items) {
        if (item.id.startsWith("new-")) {
          await fetch(`${STORE_API}/api/admin/announcements`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(item),
          });
        } else {
          await fetch(`${STORE_API}/api/admin/announcements/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(item),
          });
        }
      }
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" /></div>;

  return (
    <>
      <div className="space-y-3">
        {items.map((item, i) => (
          <motion.div key={item.id} layout
            className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <GripVertical className="h-4 w-4 text-[#D1D5DB] cursor-grab shrink-0" />
              <span className="text-xs font-semibold text-[#9CA3AF]">#{i + 1}</span>
              <div className="flex-1" />
              <button onClick={() => update(item.id, { isActive: !item.isActive })}
                className={cn("flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 transition-colors",
                  item.isActive ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#F3F4F6] text-[#9CA3AF]")}>
                {item.isActive ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                {item.isActive ? "Active" : "Hidden"}
              </button>
              <button onClick={() => remove(item.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FFF1F2] transition-all">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <Field label="Message" value={item.message} onChange={v => update(item.id, { message: v })}
              placeholder="Free shipping on orders above ₹999 🎉" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="CTA Button Text" value={item.ctaText ?? ""} onChange={v => update(item.id, { ctaText: v })}
                placeholder="Shop Now" />
              <Field label="CTA Link" value={item.ctaUrl ?? ""} onChange={v => update(item.id, { ctaUrl: v })}
                placeholder="/products" />
            </div>
          </motion.div>
        ))}

        <button onClick={addNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E5E7EB] py-4 text-sm font-semibold text-[#9CA3AF] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors">
          <Plus className="h-4 w-4" /> Add Announcement
        </button>
      </div>
      <SaveBar dirty={dirty} saving={saving} saved={saved} onSave={save} />
    </>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

const DEFAULT_HERO = {
  headline: "",
  subheadline: "",
  tagline: "",
  ctaText: "",
  ctaUrl: "",
  secondaryCtaText: "",
  secondaryCtaUrl: "",
  desktopImageUrl: "",
  mobileImageUrl: "",
  badgeText: "",
  showBadge: true,
};

function HeroSection() {
  const [data, setData] = useState(DEFAULT_HERO);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch(`${STORE_API}/api/admin/content/homepage_hero`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then((block: ContentBlock | null) => {
        if (block) {
          setData({ ...DEFAULT_HERO, ...(block.data as typeof DEFAULT_HERO) });
          setIsActive(block.isActive);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const set = (key: keyof typeof DEFAULT_HERO, val: string | boolean) => {
    setData(p => ({ ...p, [key]: val }));
    setDirty(true); setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${STORE_API}/api/admin/content/homepage_hero`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive, status: "PUBLISHED", data }),
      });
      setDirty(false); setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" /></div>;

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 space-y-4">
          <Toggle label="Hero section visible" desc="Show or hide the hero banner on the homepage"
            value={isActive} onChange={v => { setIsActive(v); setDirty(true); }} />

          <div className="grid grid-cols-1 gap-4">
            <Field label="Tagline (badge text)" value={data.tagline} onChange={v => set("tagline", v)}
              placeholder="PLAY. TRAIN. WIN." />
            <Field label="Headline" value={data.headline} onChange={v => set("headline", v)}
              placeholder="Gear Up. Play Hard." />
            <Field label="Sub-headline" value={data.subheadline} onChange={v => set("subheadline", v)}
              placeholder="Official jerseys, performance gear & sports equipment." rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Primary CTA Text" value={data.ctaText} onChange={v => set("ctaText", v)} placeholder="Shop Now" />
            <Field label="Primary CTA URL" value={data.ctaUrl} onChange={v => set("ctaUrl", v)} placeholder="/products" />
            <Field label="Secondary CTA Text" value={data.secondaryCtaText} onChange={v => set("secondaryCtaText", v)} placeholder="View Collection" />
            <Field label="Secondary CTA URL" value={data.secondaryCtaUrl} onChange={v => set("secondaryCtaUrl", v)} placeholder="/products?sport=CRICKET" />
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">Hero Images</p>
          <div className="grid grid-cols-2 gap-4">
            <MediaPicker
              label="Desktop Image"
              value={data.desktopImageUrl as string}
              onChange={v => set("desktopImageUrl", v)}
              hint="Recommended: 1200×600px"
              accept="HERO_IMAGE"
            />
            <MediaPicker
              label="Mobile Image"
              value={data.mobileImageUrl as string}
              onChange={v => set("mobileImageUrl", v)}
              hint="Recommended: 750×900px"
              accept="HERO_IMAGE"
            />
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">Badge</p>
          <Toggle label="Show badge" desc="Small badge overlaid on the hero" value={data.showBadge as boolean}
            onChange={v => set("showBadge", v)} />
          <Field label="Badge Text" value={data.badgeText} onChange={v => set("badgeText", v)}
            placeholder="New Season 2025" />
        </div>
      </div>
      <SaveBar dirty={dirty} saving={saving} saved={saved} onSave={save} />
    </>
  );
}

// ─── Trust Bar Section ────────────────────────────────────────────────────────

interface TrustItem { icon: string; title: string; subtitle: string }

const DEFAULT_TRUST: TrustItem[] = [
  { icon: "🚚", title: "Free Shipping", subtitle: "On orders above ₹499" },
  { icon: "🔄", title: "Easy Returns", subtitle: "7-day hassle-free returns" },
  { icon: "🛡️", title: "Secure Payments", subtitle: "100% safe & encrypted" },
  { icon: "⚡", title: "Fast Delivery", subtitle: "2-5 business days" },
];

function TrustBarSection() {
  const [items, setItems] = useState<TrustItem[]>(DEFAULT_TRUST);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch(`${STORE_API}/api/admin/content/homepage_trust_bar`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then((block: ContentBlock | null) => {
        if (block) {
          const d = block.data as { items?: TrustItem[] };
          if (d.items) setItems(d.items);
          setIsActive(block.isActive);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const mark = () => { setDirty(true); setSaved(false); };

  const updateItem = (i: number, patch: Partial<TrustItem>) => {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it));
    mark();
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${STORE_API}/api/admin/content/homepage_trust_bar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive, data: { items } }),
      });
      setDirty(false); setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" /></div>;

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <Toggle label="Trust bar visible" value={isActive} onChange={v => { setIsActive(v); mark(); }} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3">
              <Field label="Icon (emoji)" value={item.icon} onChange={v => updateItem(i, { icon: v })} placeholder="🚚" />
              <Field label="Title" value={item.title} onChange={v => updateItem(i, { title: v })} placeholder="Free Shipping" />
              <Field label="Subtitle" value={item.subtitle} onChange={v => updateItem(i, { subtitle: v })} placeholder="On orders above ₹499" />
            </div>
          ))}
        </div>
      </div>
      <SaveBar dirty={dirty} saving={saving} saved={saved} onSave={save} />
    </>
  );
}

// ─── Footer Section ───────────────────────────────────────────────────────────

interface FooterLink { label: string; url: string }
interface FooterColumn { heading: string; links: FooterLink[] }

const DEFAULT_FOOTER: FooterColumn[] = [
  { heading: "Company", links: [{ label: "About Us", url: "/about" }, { label: "Careers", url: "/careers" }] },
  { heading: "Support", links: [{ label: "FAQ", url: "/faq" }, { label: "Contact Us", url: "/contact" }] },
  { heading: "Legal", links: [{ label: "Privacy Policy", url: "/privacy" }, { label: "Terms of Service", url: "/terms" }] },
];

function FooterSection() {
  const [columns, setColumns] = useState<FooterColumn[]>(DEFAULT_FOOTER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(0);

  useEffect(() => {
    fetch(`${STORE_API}/api/admin/content/footer_columns`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then((block: ContentBlock | null) => {
        if (block) {
          const d = block.data as { columns?: FooterColumn[] };
          if (d.columns) setColumns(d.columns);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const mark = () => { setDirty(true); setSaved(false); };

  const updateColumn = (ci: number, patch: Partial<FooterColumn>) => {
    setColumns(prev => prev.map((c, i) => i === ci ? { ...c, ...patch } : c));
    mark();
  };

  const updateLink = (ci: number, li: number, patch: Partial<FooterLink>) => {
    setColumns(prev => prev.map((c, i) => i === ci
      ? { ...c, links: c.links.map((l, j) => j === li ? { ...l, ...patch } : l) }
      : c));
    mark();
  };

  const addLink = (ci: number) => {
    setColumns(prev => prev.map((c, i) => i === ci
      ? { ...c, links: [...c.links, { label: "", url: "" }] }
      : c));
    mark();
  };

  const removeLink = (ci: number, li: number) => {
    setColumns(prev => prev.map((c, i) => i === ci
      ? { ...c, links: c.links.filter((_, j) => j !== li) }
      : c));
    mark();
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${STORE_API}/api/admin/content/footer_columns`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: true, data: { columns } }),
      });
      setDirty(false); setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" /></div>;

  return (
    <>
      <div className="space-y-3">
        {columns.map((col, ci) => (
          <div key={ci} className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === ci ? null : ci)}
              className="flex w-full items-center justify-between px-5 py-4"
            >
              <span className="text-sm font-semibold text-[#111827]">{col.heading || `Column ${ci + 1}`}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9CA3AF]">{col.links.length} links</span>
                {expanded === ci ? <ChevronDown className="h-4 w-4 text-[#6B7280]" /> : <ChevronRight className="h-4 w-4 text-[#6B7280]" />}
              </div>
            </button>
            <AnimatePresence>
              {expanded === ci && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                  className="overflow-hidden border-t border-[#F3F4F6]"
                >
                  <div className="px-5 py-4 space-y-4">
                    <Field label="Column Heading" value={col.heading} onChange={v => updateColumn(ci, { heading: v })}
                      placeholder="Company" />
                    <div className="space-y-2">
                      {col.links.map((link, li) => (
                        <div key={li} className="flex items-end gap-2">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <Field label={li === 0 ? "Link Label" : ""} value={link.label}
                              onChange={v => updateLink(ci, li, { label: v })} placeholder="About Us" />
                            <Field label={li === 0 ? "URL" : ""} value={link.url}
                              onChange={v => updateLink(ci, li, { url: v })} placeholder="/about" />
                          </div>
                          <button onClick={() => removeLink(ci, li)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FFF1F2] transition-all mb-px">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => addLink(ci)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
                      <Plus className="h-3.5 w-3.5" /> Add Link
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      <SaveBar dirty={dirty} saving={saving} saved={saved} onSave={save} />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContentPage() {
  const [active, setActive] = useState<Section>("announcements");

  const panels: Record<Section, React.ReactNode> = {
    announcements: <AnnouncementsSection />,
    hero:          <HeroSection />,
    trust:         <TrustBarSection />,
    footer:        <FooterSection />,
  };

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-xl font-extrabold text-[#111827]">Content Management</h1>
        <p className="text-sm text-[#9CA3AF]">Edit all storefront content without touching code</p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 border-b border-[#E5E7EB]">
        {SECTIONS.map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={cn("flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-all",
                active === s.id
                  ? "border-[#111827] text-[#111827]"
                  : "border-transparent text-[#6B7280] hover:text-[#374151]")}>
              <Icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <AnimatePresence mode="wait">
        <motion.div key={active}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}>
          {panels[active]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
