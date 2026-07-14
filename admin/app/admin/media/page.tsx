"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Search, X, Trash2, Copy, Check, Grid3X3, List,
  Image as ImageIcon, Loader2, ZoomIn, Monitor, Tablet, Smartphone,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { describeFetchError } from "@/lib/api";
import { FetchError } from "@/components/ui/fetch-error";

const STORE_API = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MediaAsset {
  id: string;
  url: string;
  publicId: string;
  filename?: string;
  folder?: string;
  type: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  focalPointX?: number;
  focalPointY?: number;
  createdAt: string;
}

type ViewMode = "grid" | "list";
type PreviewDevice = "desktop" | "tablet" | "mobile";

const TYPE_OPTS = [
  { value: "",               label: "All Types" },
  { value: "PRODUCT_IMAGE",  label: "Product" },
  { value: "HERO_IMAGE",     label: "Hero" },
  { value: "BANNER_IMAGE",   label: "Banner" },
  { value: "CATEGORY_IMAGE", label: "Category" },
  { value: "BRAND_LOGO",     label: "Logo" },
  { value: "MISC",           label: "Misc" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(b?: number) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7280] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-all">
      {copied ? <Check className="h-3.5 w-3.5 text-[#22C55E]" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({ assetType, onUploaded }: { assetType: string; onUploaded: (a: MediaAsset) => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError("");
    setProgress(`Uploading ${file.name}…`);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", `tryby/${assetType.toLowerCase()}`);
      fd.append("assetType", assetType || "MISC");

      const res = await fetch(`${STORE_API}/api/admin/upload`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Upload failed");
      }
      const asset = await res.json();
      onUploaded(asset);
      setProgress("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setProgress("");
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    Array.from(files).forEach(upload);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => !uploading && inputRef.current?.click()}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all",
        dragging ? "border-[#2563EB] bg-[#EFF6FF]" : "border-[#E5E7EB] hover:border-[#CBD5E1] bg-[#F9FAFB] hover:bg-white"
      )}
    >
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      {uploading ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
          <p className="text-sm text-[#374151] font-medium">{progress}</p>
        </>
      ) : (
        <>
          <Upload className="h-8 w-8 text-[#9CA3AF]" />
          <div>
            <p className="text-sm font-semibold text-[#374151]">Drop images here or click to upload</p>
            <p className="text-xs text-[#9CA3AF] mt-1">JPG, PNG, WebP · Max 10 MB per file</p>
          </div>
        </>
      )}
      {error && <p className="text-xs text-[#DC2626] font-medium">{error}</p>}
    </div>
  );
}

// ─── Focal Point Picker ───────────────────────────────────────────────────────

function FocalPointPicker({
  src, x, y, onChange,
}: { src: string; x: number; y: number; onChange: (x: number, y: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  const pick = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    onChange(Math.round(nx * 100) / 100, Math.round(ny * 100) / 100);
  };

  return (
    <div>
      <p className="text-xs font-semibold text-[#374151] mb-2">
        Focal Point <span className="text-[#9CA3AF] font-normal">— click to set</span>
      </p>
      <div ref={ref} onClick={pick}
        className="relative rounded-lg overflow-hidden border border-[#E5E7EB] h-40 cursor-crosshair bg-[#F3F4F6]">
        <img src={src} alt="" className="w-full h-full object-cover" />
        <div
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#2563EB] shadow-lg pointer-events-none"
          style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
        />
      </div>
      <p className="text-[10px] text-[#9CA3AF] mt-1">x: {x.toFixed(2)}, y: {y.toFixed(2)}</p>
    </div>
  );
}

// ─── Asset Detail Panel ───────────────────────────────────────────────────────

function AssetDetail({
  asset, onClose, onDelete, onFocalUpdate,
}: {
  asset: MediaAsset;
  onClose: () => void;
  onDelete: (id: string) => void;
  onFocalUpdate: (id: string, x: number, y: number) => void;
}) {
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [fx, setFx] = useState(asset.focalPointX ?? 0.5);
  const [fy, setFy] = useState(asset.focalPointY ?? 0.5);
  const [savingFocal, setSavingFocal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const previewAspect: Record<PreviewDevice, string> = {
    desktop: "16/6",
    tablet:  "4/3",
    mobile:  "9/16",
  };

  const saveFocal = async () => {
    setSavingFocal(true);
    try {
      await fetch(`${STORE_API}/api/admin/media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: asset.id, focalPointX: fx, focalPointY: fy }),
      });
      onFocalUpdate(asset.id, fx, fy);
    } finally {
      setSavingFocal(false);
    }
  };

  const del = async () => {
    if (!confirm("Delete this image permanently?")) return;
    setDeleting(true);
    try {
      await fetch(`${STORE_API}/api/admin/media`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: asset.id }),
      });
      onDelete(asset.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative ml-auto h-full w-[480px] max-w-full bg-white shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4 shrink-0">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#111827] truncate">{asset.filename ?? asset.publicId}</p>
            <p className="text-xs text-[#9CA3AF]">{asset.format?.toUpperCase()} · {asset.width}×{asset.height} · {formatBytes(asset.bytes)}</p>
          </div>
          <button onClick={onClose} className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Preview devices */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              {(["desktop", "tablet", "mobile"] as PreviewDevice[]).map(d => {
                const icons = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
                const Icon = icons[d];
                return (
                  <button key={d} onClick={() => setDevice(d)}
                    className={cn("flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                      device === d ? "bg-[#111827] text-white" : "text-[#6B7280] hover:bg-[#F3F4F6]")}>
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                );
              })}
              <span className="ml-1 text-xs text-[#9CA3AF] capitalize">{device} preview</span>
            </div>
            <div
              className="relative rounded-lg overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6]"
              style={{ aspectRatio: previewAspect[device] }}
            >
              <img
                src={asset.url}
                alt=""
                className="w-full h-full object-cover"
                style={{ objectPosition: `${fx * 100}% ${fy * 100}%` }}
              />
            </div>
          </div>

          {/* Focal point */}
          <FocalPointPicker src={asset.url} x={fx} y={fy} onChange={(x, y) => { setFx(x); setFy(y); }} />
          <button onClick={saveFocal} disabled={savingFocal}
            className="flex items-center gap-1.5 h-8 rounded-lg bg-[#111827] px-4 text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors disabled:opacity-60">
            {savingFocal ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Save Focal Point
          </button>

          {/* URL */}
          <div>
            <p className="text-xs font-semibold text-[#374151] mb-1.5">Image URL</p>
            <div className="flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2">
              <p className="flex-1 text-xs font-mono text-[#374151] truncate">{asset.url}</p>
              <CopyButton text={asset.url} />
            </div>
          </div>

          {/* Meta */}
          <div className="rounded-xl border border-[#E5E7EB] divide-y divide-[#F3F4F6]">
            {[
              { label: "Type",    value: asset.type },
              { label: "Folder",  value: asset.folder ?? "—" },
              { label: "Format",  value: asset.format?.toUpperCase() ?? "—" },
              { label: "Size",    value: formatBytes(asset.bytes) },
              { label: "Dimensions", value: asset.width ? `${asset.width} × ${asset.height}` : "—" },
            ].map(row => (
              <div key={row.label} className="flex justify-between px-4 py-2.5">
                <span className="text-xs text-[#9CA3AF]">{row.label}</span>
                <span className="text-xs font-semibold text-[#374151]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#F3F4F6] px-5 py-4">
          <button onClick={del} disabled={deleting}
            className="flex w-full items-center justify-center gap-2 h-9 rounded-lg border border-[#FCA5A5] text-[#DC2626] text-sm font-semibold hover:bg-[#FFF1F2] transition-colors disabled:opacity-60">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete Image
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (typeFilter) params.set("type", typeFilter);
      if (search) params.set("q", search);

      const res = await fetch(`${STORE_API}/api/admin/media?${params}`, { credentials: "include" });
      const data = await res.json();
      setAssets(data.assets ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, search]);

  useEffect(() => { load(); }, [load]);

  const onUploaded = (asset: MediaAsset) => {
    setAssets(prev => [asset, ...prev]);
    setTotal(t => t + 1);
    setShowUpload(false);
  };

  const onDelete = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    setTotal(t => t - 1);
  };

  const onFocalUpdate = (id: string, x: number, y: number) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, focalPointX: x, focalPointY: y } : a));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Media Studio</h1>
          <p className="text-sm text-[#9CA3AF]">{total} assets</p>
        </div>
        <button onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-1.5 h-9 rounded-lg bg-[#111827] px-4 text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors">
          <Upload className="h-3.5 w-3.5" /> Upload
        </button>
      </div>

      {error && <FetchError message={error} onRetry={load} loading={loading} />}

      {/* Upload zone */}
      <AnimatePresence>
        {showUpload && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <UploadZone assetType={typeFilter || "MISC"} onUploaded={onUploaded} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by filename, folder…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E5E7EB] bg-white text-sm placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] transition-all" />
          {search && <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF]"><X className="h-3.5 w-3.5" /></button>}
        </div>
        <div className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E7EB] bg-white px-2">
          <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="text-sm text-[#374151] bg-transparent outline-none">
            {TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-[#E5E7EB] bg-white p-1">
          <button onClick={() => setViewMode("grid")}
            className={cn("flex h-7 w-7 items-center justify-center rounded transition-colors",
              viewMode === "grid" ? "bg-[#111827] text-white" : "text-[#6B7280] hover:bg-[#F3F4F6]")}>
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setViewMode("list")}
            className={cn("flex h-7 w-7 items-center justify-center rounded transition-colors",
              viewMode === "list" ? "bg-[#111827] text-white" : "text-[#6B7280] hover:bg-[#F3F4F6]")}>
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Grid / List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#9CA3AF]" /></div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <ImageIcon className="h-10 w-10 text-[#D1D5DB]" />
          <p className="text-sm font-semibold text-[#374151]">No assets found</p>
          <p className="text-xs text-[#9CA3AF]">Upload images to get started</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {assets.map((a, i) => (
            <motion.button key={a.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }}
              onClick={() => setSelected(a)}
              className="group relative aspect-square rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6] hover:border-[#2563EB] hover:shadow-md transition-all"
            >
              <img src={a.url} alt={a.filename ?? ""} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white truncate">{a.filename ?? a.publicId}</p>
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">Image</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">Filename</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">Size</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">Dimensions</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9FAFB]">
              {assets.map(a => (
                <tr key={a.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-4 py-3">
                    <div className="h-10 w-10 rounded-lg overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6]">
                      <img src={a.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[#111827] font-medium truncate max-w-[180px]">{a.filename ?? a.publicId}</p>
                    <p className="text-xs text-[#9CA3AF]">{a.folder}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#374151]">{a.type}</td>
                  <td className="px-4 py-3 text-xs text-[#374151]">{formatBytes(a.bytes)}</td>
                  <td className="px-4 py-3 text-xs text-[#374151]">{a.width ? `${a.width}×${a.height}` : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(a)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7280] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-all">
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                      <CopyButton text={a.url} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={cn("h-8 w-8 rounded-lg text-xs font-semibold transition-colors",
                p === page ? "bg-[#111827] text-white" : "text-[#6B7280] hover:bg-[#F3F4F6]")}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <AssetDetail
            asset={selected}
            onClose={() => setSelected(null)}
            onDelete={onDelete}
            onFocalUpdate={onFocalUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
