"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload, Trash2, Copy, Check, Image as ImageIcon, RefreshCw, X,
  Crosshair, Monitor, Smartphone, Tablet, Tag, ChevronDown,
} from "lucide-react";

interface Asset {
  id: string; url: string; publicId: string; filename?: string;
  type: string; width?: number; height?: number; bytes?: number; format?: string;
  altText?: string; focalPointX?: number; focalPointY?: number;
}

const ASSET_TYPES = ["ALL", "PRODUCT_IMAGE", "HERO_IMAGE", "BANNER_IMAGE", "CATEGORY_IMAGE", "BRAND_LOGO", "MISC"];

// Cloudinary transformation helpers
function cloudinaryUrl(publicId: string, transforms: string) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "demo";
  return `https://res.cloudinary.com/${cloud}/image/upload/${transforms}/${publicId}`;
}

function formatBytes(b?: number) {
  if (!b) return "";
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)}KB`;
  return `${(b / 1024 / 1024).toFixed(1)}MB`;
}

// ─── Focal Point Picker ───────────────────────────────────────────────────────
function FocalPointPicker({
  url, focalX, focalY, onChange,
}: {
  url: string; focalX: number; focalY: number;
  onChange: (x: number, y: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleClick(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top)  / rect.height));
    onChange(Math.round(x * 100) / 100, Math.round(y * 100) / 100);
  }

  return (
    <div>
      <p className="text-[11px] font-semibold text-white/40 mb-2 uppercase tracking-widest">Focal Point — click to set</p>
      <div
        ref={ref}
        className="relative w-full rounded-xl overflow-hidden cursor-crosshair select-none"
        style={{ paddingBottom: "56.25%" }}
        onClick={handleClick}
      >
        <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        {/* Focal crosshair */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${focalX * 100}%`, top: `${focalY * 100}%` }}
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute w-8 h-px bg-white opacity-90" />
            <div className="absolute h-8 w-px bg-white opacity-90" />
            <div className="h-3 w-3 rounded-full border-2 border-white shadow-lg" style={{ background: "rgba(245,197,24,0.8)" }} />
          </div>
        </div>
      </div>
      <p className="text-[10px] text-white/25 mt-1.5 font-mono">x: {focalX.toFixed(2)} · y: {focalY.toFixed(2)}</p>
    </div>
  );
}

// ─── Responsive Preview ───────────────────────────────────────────────────────
const BREAKPOINTS = [
  { id: "desktop", icon: Monitor, label: "Desktop", w: 1200, h: 480, aspect: "aspect-[5/2]" },
  { id: "tablet",  icon: Tablet,  label: "Tablet",  w: 768,  h: 400, aspect: "aspect-[2/1]" },
  { id: "mobile",  icon: Smartphone, label: "Mobile", w: 390, h: 260, aspect: "aspect-[3/2]" },
] as const;

function ResponsivePreview({ asset }: { asset: Asset }) {
  const [view, setView] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const bp = BREAKPOINTS.find(b => b.id === view)!;

  // Object-position from focal point
  const objPos = asset.focalPointX != null && asset.focalPointY != null
    ? `${(asset.focalPointX * 100).toFixed(0)}% ${(asset.focalPointY * 100).toFixed(0)}%`
    : "center center";

  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        {BREAKPOINTS.map(b => {
          const Icon = b.icon;
          return (
            <button key={b.id} onClick={() => setView(b.id)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-semibold transition-all"
              style={{
                background: view === b.id ? "rgba(245,197,24,0.12)" : "transparent",
                color: view === b.id ? "#F5C518" : "rgba(255,255,255,0.35)",
                border: view === b.id ? "1px solid rgba(245,197,24,0.25)" : "1px solid transparent",
              }}
            >
              <Icon className="h-3 w-3" /> {b.label}
            </button>
          );
        })}
      </div>
      <div className={`w-full ${bp.aspect} rounded-xl overflow-hidden bg-[#0A0A0A]`}>
        <img
          src={asset.url}
          alt={asset.altText ?? ""}
          className="w-full h-full object-cover"
          style={{ objectPosition: objPos }}
        />
      </div>
      <p className="text-[10px] text-white/25 mt-1.5">
        {bp.w}×{bp.h}px · object-position: {objPos}
      </p>
    </div>
  );
}

// ─── Media Studio (full-screen editor) ───────────────────────────────────────
function MediaStudio({ asset, onSave, onClose }: {
  asset: Asset;
  onSave: (updated: Partial<Asset>) => void;
  onClose: () => void;
}) {
  const [altText,  setAltText]  = useState(asset.altText   ?? "");
  const [focalX,   setFocalX]   = useState(asset.focalPointX ?? 0.5);
  const [focalY,   setFocalY]   = useState(asset.focalPointY ?? 0.5);
  const [assetType, setAssetType] = useState(asset.type);
  const [copied,   setCopied]   = useState(false);
  const [saving,   setSaving]   = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: asset.id, altText: altText || undefined, focalPointX: focalX, focalPointY: focalY }),
      });
      // Also update type if changed
      if (assetType !== asset.type) {
        await fetch(`/api/admin/media/${asset.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: assetType }),
        });
      }
      if (res.ok) {
        onSave({ altText: altText || undefined, focalPointX: focalX, focalPointY: focalY, type: assetType });
      }
    } finally {
      setSaving(false);
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(asset.url).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  const inp = "w-full rounded-xl px-3.5 text-[13px] text-white placeholder:text-white/25 outline-none transition-colors bg-[#111] border border-white/08 h-10 focus:border-[#F5C518]/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.90)" }} onClick={onClose}>
      <div
        className="w-full max-w-[880px] max-h-[90vh] rounded-[24px] overflow-hidden flex flex-col"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div>
            <h2 className="text-white font-black text-[16px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Media Studio</h2>
            <p className="text-white/35 text-[11px] truncate max-w-[400px]">{asset.filename ?? asset.publicId}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body — two columns */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x" style={{ borderColor: "rgba(255,255,255,0.06)" }}>

            {/* Left — Focal point */}
            <div className="p-5 space-y-5">
              <FocalPointPicker
                url={asset.url}
                focalX={focalX} focalY={focalY}
                onChange={(x, y) => { setFocalX(x); setFocalY(y); }}
              />
            </div>

            {/* Right — Metadata + preview */}
            <div className="p-5 space-y-5">
              {/* Responsive preview */}
              <ResponsivePreview asset={{ ...asset, focalPointX: focalX, focalPointY: focalY }} />

              {/* Alt text */}
              <div>
                <label className="block text-[11px] font-semibold text-white/40 mb-1.5 uppercase tracking-widest">Alt Text (SEO + Accessibility)</label>
                <input value={altText} onChange={e => setAltText(e.target.value)} placeholder="Describe this image…" className={inp} />
              </div>

              {/* Asset type */}
              <div>
                <label className="block text-[11px] font-semibold text-white/40 mb-1.5 uppercase tracking-widest">Asset Type</label>
                <div className="relative">
                  <select value={assetType} onChange={e => setAssetType(e.target.value)}
                    className={inp + " appearance-none pr-8"}>
                    {ASSET_TYPES.filter(t => t !== "ALL").map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                </div>
              </div>

              {/* File info */}
              <div className="rounded-xl p-3 space-y-1.5" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2">File Info</p>
                {[
                  ["Dimensions", asset.width && asset.height ? `${asset.width}×${asset.height}px` : "—"],
                  ["File size", formatBytes(asset.bytes) || "—"],
                  ["Format", asset.format?.toUpperCase() ?? "—"],
                  ["Public ID", asset.publicId],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <span className="text-[11px] text-white/35 shrink-0">{k}</span>
                    <span className="text-[11px] text-white font-mono truncate">{v}</span>
                  </div>
                ))}
              </div>

              {/* URL copy */}
              <div className="flex gap-2">
                <input value={asset.url} readOnly className="flex-1 rounded-xl px-3 h-9 text-[11px] text-white/40 font-mono outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)" }} />
                <button onClick={copyUrl} className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12px] font-semibold text-[#0D0D0D] shrink-0 transition-all" style={{ background: copied ? "#4ADE80" : "#F5C518" }}>
                  {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy URL</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <p className="text-[11px] text-white/25">Focal point controls how images crop on mobile vs desktop</p>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-black text-[#0D0D0D] disabled:opacity-40"
            style={{ background: "#F5C518" }}
          >
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminMediaPage() {
  const [assets, setAssets]           = useState<Asset[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [typeFilter, setTypeFilter]   = useState("ALL");
  const [page, setPage]               = useState(1);
  const [uploading, setUploading]     = useState(false);
  const [uploadType, setUploadType]   = useState("PRODUCT_IMAGE");
  const [copied, setCopied]           = useState<string | null>(null);
  const [studio, setStudio]           = useState<Asset | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pages = Math.ceil(total / 24);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      const res = await fetch(`/api/admin/media?${params}`);
      if (res.ok) { const d = await res.json(); setAssets(d.assets); setTotal(d.total); }
    } finally { setLoading(false); }
  }, [typeFilter, page]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("assetType", uploadType);
        fd.append("folder", `tryby/${uploadType.toLowerCase()}`);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (res.ok) { const a = await res.json(); setAssets(p => [a, ...p]); setTotal(t => t + 1); }
      }
    } finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  async function deleteAsset(id: string) {
    if (!confirm("Delete this image? Cannot be undone.")) return;
    const res = await fetch("/api/admin/media", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    if (res.ok) { setAssets(p => p.filter(a => a.id !== id)); setTotal(t => t - 1); if (studio?.id === id) setStudio(null); }
  }

  function copyUrl(url: string, e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => { setCopied(url); setTimeout(() => setCopied(null), 2000); });
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>Media Library</h1>
          <p className="text-white/40 text-[13px]">{total} images · Click an image to open Media Studio</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={uploadType} onChange={e => setUploadType(e.target.value)}
            className="rounded-xl px-3 text-[12px] text-white outline-none"
            style={{ height: "40px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}>
            {ASSET_TYPES.filter(t => t !== "ALL").map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
          <label className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-black text-[#0D0D0D] cursor-pointer transition-opacity ${uploading ? "opacity-50 pointer-events-none" : "hover:opacity-88"}`}
            style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px" }}>
            {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Upload"}
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {ASSET_TYPES.map(t => (
          <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
            className="rounded-full px-3 py-1.5 text-[11px] font-bold transition-all"
            style={{
              background: typeFilter === t ? "#F5C518" : "rgba(255,255,255,0.06)",
              color: typeFilter === t ? "#0D0D0D" : "rgba(255,255,255,0.45)",
            }}>
            {t.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center py-20 text-white/30">
          <RefreshCw className="h-8 w-8 mb-3 animate-spin opacity-40" />
          <p className="text-[13px]">Loading…</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-white/30 rounded-2xl" style={{ border: "1.5px dashed rgba(255,255,255,0.08)" }}>
          <ImageIcon className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-[14px] font-semibold">No images yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {assets.map(asset => (
            <div
              key={asset.id}
              className="group relative rounded-xl overflow-hidden aspect-square cursor-pointer"
              style={{ background: "#1A1A1A" }}
              onClick={() => setStudio(asset)}
            >
              <img
                src={asset.url} alt={asset.altText ?? ""}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                style={asset.focalPointX != null ? { objectPosition: `${(asset.focalPointX * 100).toFixed(0)}% ${((asset.focalPointY ?? 0.5) * 100).toFixed(0)}%` } : {}}
                loading="lazy"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-end justify-end p-2 opacity-0 group-hover:opacity-100">
                <button onClick={e => { e.stopPropagation(); deleteAsset(asset.id); }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F87171]/80 hover:bg-[#F87171] transition-all"
                  title="Delete">
                  <Trash2 className="h-3 w-3 text-white" />
                </button>
                <button onClick={e => copyUrl(asset.url, e)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-all ml-1"
                  title="Copy URL">
                  {copied === asset.url ? <Check className="h-3 w-3 text-[#4ADE80]" /> : <Copy className="h-3 w-3 text-white" />}
                </button>
              </div>

              {/* Focal point indicator */}
              {asset.focalPointX != null && (
                <div className="absolute top-1.5 left-1.5 rounded-full p-0.5" style={{ background: "rgba(245,197,24,0.9)" }}>
                  <Crosshair className="h-2.5 w-2.5 text-[#0D0D0D]" />
                </div>
              )}

              {/* Type badge */}
              <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white" style={{ background: "rgba(0,0,0,0.6)" }}>
                  {asset.type.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-xl px-4 py-2 text-[13px] font-semibold text-white/50 hover:text-white disabled:opacity-30"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}>← Prev</button>
          <span className="text-[13px] text-white/40">Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            className="rounded-xl px-4 py-2 text-[13px] font-semibold text-white/50 hover:text-white disabled:opacity-30"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}>Next →</button>
        </div>
      )}

      {/* Media Studio modal */}
      {studio && (
        <MediaStudio
          asset={studio}
          onSave={updated => {
            setAssets(p => p.map(a => a.id === studio.id ? { ...a, ...updated } : a));
            setStudio(prev => prev ? { ...prev, ...updated } : null);
          }}
          onClose={() => setStudio(null)}
        />
      )}
    </div>
  );
}
