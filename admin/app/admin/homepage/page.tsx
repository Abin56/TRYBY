"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  GripVertical, Eye, EyeOff, Save, Loader2, CheckCircle2,
  AlertCircle, LayoutDashboard, ChevronRight, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { describeFetchError } from "@/lib/api";
import { FetchError } from "@/components/ui/fetch-error";

const STORE_API = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

interface Section {
  key: string;
  label: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

const SECTION_META: Record<string, { label: string; description: string }> = {
  hero:       { label: "Hero Banner",       description: "Full-width hero with headline, CTA and image" },
  categories: { label: "Category Row",      description: "Sport category chips — Cricket, Football, Gym…" },
  trending:   { label: "Trending Products", description: "Horizontally scrollable trending gear carousel" },
  trust:      { label: "Trust Bar",         description: "4-tile quality/shipping/returns/payment strip" },
};

const DEFAULT_SECTIONS: Section[] = Object.entries(SECTION_META).map(([key, meta], i) => ({
  key,
  ...meta,
  isActive: true,
  sortOrder: i,
}));

// Content block status badge
function StatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" | "SCHEDULED" }) {
  const styles = {
    DRAFT:     "bg-[#F3F4F6] text-[#6B7280]",
    PUBLISHED: "bg-[#DCFCE7] text-[#16A34A]",
    SCHEDULED: "bg-[#FEF3C7] text-[#D97706]",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", styles[status])}>
      {status}
    </span>
  );
}

// Publish controls for a content block
function PublishControl({
  blockKey, currentStatus, onStatusChange,
}: {
  blockKey: string;
  currentStatus: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  onStatusChange: (status: "DRAFT" | "PUBLISHED") => void;
}) {
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    const next = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setSaving(true);
    try {
      await fetch(`${STORE_API}/api/admin/content/${blockKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: next, isActive: next === "PUBLISHED" }),
      });
      onStatusChange(next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all",
        currentStatus === "PUBLISHED"
          ? "bg-[#DCFCE7] text-[#16A34A] hover:bg-[#FEE2E2] hover:text-[#DC2626]"
          : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#DCFCE7] hover:text-[#16A34A]"
      )}
    >
      {saving
        ? <Loader2 className="h-3 w-3 animate-spin" />
        : currentStatus === "PUBLISHED"
          ? <><Eye className="h-3 w-3" /> Published</>
          : <><EyeOff className="h-3 w-3" /> Draft</>
      }
    </button>
  );
}

// Section row with drag handle, toggle, and link to editor
function SectionRow({
  section,
  onToggle,
}: {
  section: Section;
  onToggle: (key: string) => void;
}) {
  return (
    <Reorder.Item value={section} id={section.key} className="list-none">
      <motion.div
        layout
        className={cn(
          "flex items-center gap-3 rounded-xl border bg-white p-4 transition-colors",
          section.isActive ? "border-[#E5E7EB]" : "border-dashed border-[#E5E7EB] opacity-60"
        )}
      >
        <div className="cursor-grab active:cursor-grabbing text-[#D1D5DB] hover:text-[#9CA3AF] transition-colors">
          <GripVertical className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#111827]">{section.label}</p>
            <span className="text-xs text-[#9CA3AF] font-mono">#{section.sortOrder + 1}</span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">{section.description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`/admin/content`}
            className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
          >
            Edit content <ChevronRight className="h-3 w-3" />
          </a>

          <button
            onClick={() => onToggle(section.key)}
            className={cn(
              "relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200",
              section.isActive ? "bg-[#111827]" : "bg-[#D1D5DB]"
            )}
            aria-label={section.isActive ? "Disable section" : "Enable section"}
          >
            <span className={cn(
              "absolute h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
              section.isActive ? "translate-x-6" : "translate-x-1"
            )} />
          </button>
        </div>
      </motion.div>
    </Reorder.Item>
  );
}

// Content blocks status panel
interface ContentBlock {
  id: string;
  key: string;
  type: string;
  title?: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  isActive: boolean;
  updatedAt: string;
}

function ContentBlocksPanel() {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${STORE_API}/api/admin/content`, { credentials: "include" });
      const data: ContentBlock[] = await res.json();
      setBlocks(data);
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = (key: string, status: "DRAFT" | "PUBLISHED") => {
    setBlocks((prev) => prev.map((b) => b.key === key ? { ...b, status } : b));
  };

  if (error) return <FetchError message={error} onRetry={load} loading={loading} />;

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" /></div>;

  if (!blocks.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#E5E7EB] py-10 text-center">
        <p className="text-sm text-[#9CA3AF]">No content blocks created yet.</p>
        <p className="text-xs text-[#9CA3AF] mt-1">Create content in the Content tab, then publish it here.</p>
      </div>
    );
  }

  const BLOCK_LABELS: Record<string, string> = {
    homepage_hero:       "Hero Banner",
    homepage_trust_bar:  "Trust Bar",
    footer_columns:      "Footer Links",
    homepage_sections:   "Section Order",
  };

  return (
    <div className="space-y-2">
      {blocks.map((block) => (
        <div key={block.id} className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[#111827]">
                {BLOCK_LABELS[block.key] ?? block.title ?? block.key}
              </p>
              <StatusBadge status={block.status} />
            </div>
            <p className="text-xs text-[#9CA3AF] font-mono mt-0.5">{block.key}</p>
          </div>
          <PublishControl
            blockKey={block.key}
            currentStatus={block.status}
            onStatusChange={(status) => updateStatus(block.key, status)}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomepageBuilderPage() {
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<"sections" | "publish">("sections");

  // Reorder updates sort order
  const handleReorder = (newOrder: Section[]) => {
    setSections(newOrder.map((s, i) => ({ ...s, sortOrder: i })));
    setDirty(true); setSaved(false);
  };

  const toggleSection = (key: string) => {
    setSections((prev) => prev.map((s) => s.key === key ? { ...s, isActive: !s.isActive } : s));
    setDirty(true); setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${STORE_API}/api/admin/content/homepage_sections`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: "PUBLISHED",
          isActive: true,
          data: { sections: sections.map(({ key, isActive, sortOrder }) => ({ key, isActive, sortOrder })) },
        }),
      });
      setDirty(false); setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Homepage Builder</h1>
          <p className="text-sm text-[#9CA3AF]">Control section visibility, order, and publishing status</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E7EB] px-3 text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors">
            <ExternalLink className="h-3.5 w-3.5" /> Preview
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#E5E7EB]">
        {[
          { id: "sections", label: "Section Order" },
          { id: "publish",  label: "Publish Status" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={cn("px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-all",
              tab === t.id ? "border-[#111827] text-[#111827]" : "border-transparent text-[#6B7280] hover:text-[#374151]")}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "sections" ? (
          <motion.div key="sections" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-3">
              <p className="text-xs text-[#9CA3AF]">Drag to reorder · Toggle to show/hide sections on the homepage</p>
            </div>

            <Reorder.Group axis="y" values={sections} onReorder={handleReorder} className="space-y-2">
              {sections.map((section) => (
                <SectionRow key={section.key} section={section} onToggle={toggleSection} />
              ))}
            </Reorder.Group>

            <div className="mt-4 pt-4 border-t border-[#F3F4F6] flex items-center justify-between">
              <AnimatePresence>
                {(dirty || saved) && (
                  <motion.span
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className={cn("flex items-center gap-1.5 text-xs font-medium",
                      saved ? "text-[#16A34A]" : "text-[#D97706]")}
                  >
                    {saved
                      ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved</>
                      : <><AlertCircle className="h-3.5 w-3.5" /> Unsaved changes</>
                    }
                  </motion.span>
                )}
              </AnimatePresence>
              <button
                onClick={save}
                disabled={saving || !dirty}
                className="ml-auto flex items-center gap-1.5 h-9 rounded-lg bg-[#111827] px-5 text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Save Order
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="publish" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-3">
              <p className="text-xs text-[#9CA3AF]">Publish or unpublish content blocks. Drafts are invisible to storefront visitors.</p>
            </div>
            <ContentBlocksPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
