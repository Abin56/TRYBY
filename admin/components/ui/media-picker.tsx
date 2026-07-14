"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon, Search, X, Check, Upload, Loader2, ZoomIn, Filter,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { describeFetchError } from "@/lib/api";
import { FetchError } from "@/components/ui/fetch-error";

const STORE_API = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

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
}

interface MediaPickerProps {
  value?: string;
  onChange: (url: string, asset?: MediaAsset) => void;
  label?: string;
  hint?: string;
  accept?: string; // asset type filter e.g. "HERO_IMAGE"
}

const TYPE_OPTS = [
  { value: "", label: "All" },
  { value: "PRODUCT_IMAGE", label: "Product" },
  { value: "HERO_IMAGE", label: "Hero" },
  { value: "BANNER_IMAGE", label: "Banner" },
  { value: "CATEGORY_IMAGE", label: "Category" },
  { value: "MISC", label: "Misc" },
];

function formatBytes(b?: number) {
  if (!b) return "";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)}KB`;
  return `${(b / 1024 / 1024).toFixed(1)}MB`;
}

export function MediaPicker({ value, onChange, label = "Image", hint, accept }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(accept ?? "");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "24" });
      if (typeFilter) params.set("type", typeFilter);
      if (search) params.set("q", search);
      const res = await fetch(`${STORE_API}/api/admin/media?${params}`, { credentials: "include" });
      const data = await res.json();
      setAssets(data.assets ?? []);
      setPages(data.pages ?? 1);
    } catch (err) {
      // Store API unreachable / blocked — surface instead of crashing the picker.
      setError(describeFetchError(err));
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, search]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "tryby/content");
      fd.append("assetType", accept || "MISC");
      const res = await fetch(`${STORE_API}/api/admin/upload`, { method: "POST", credentials: "include", body: fd });
      if (res.ok) {
        const asset = await res.json();
        setAssets((prev) => [asset, ...prev]);
        setSelected(asset);
      } else {
        setError(`Upload failed (HTTP ${res.status}).`);
      }
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setUploading(false);
    }
  };

  const confirm = () => {
    if (!selected) return;
    onChange(selected.url, selected);
    setOpen(false);
    setSelected(null);
  };

  const clearValue = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <>
      {/* Trigger */}
      <div>
        {label && (
          <label className="block text-xs font-semibold text-[#374151] mb-1.5">{label}</label>
        )}
        <div
          onClick={() => setOpen(true)}
          className={cn(
            "relative group cursor-pointer rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] overflow-hidden transition-all hover:border-[#2563EB] hover:bg-white",
            value ? "h-32" : "h-20 flex items-center justify-center"
          )}
        >
          {value ? (
            <>
              <img src={value} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <button
                onClick={clearValue}
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#374151] hover:text-[#DC2626] opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-[#9CA3AF]">
              <ImageIcon className="h-5 w-5" />
              <span className="text-xs font-medium">Click to select from library</span>
            </div>
          )}
        </div>
        {hint && <p className="text-[10px] text-[#9CA3AF] mt-1">{hint}</p>}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-3xl max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6] shrink-0">
                <p className="text-sm font-bold text-[#111827]">Media Library</p>
                <button onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[#F3F4F6] shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
                  <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search assets…"
                    className="w-full h-8 pl-9 pr-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-sm outline-none focus:border-[#2563EB] transition-all" />
                </div>
                <div className="flex items-center gap-1.5 h-8 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-2">
                  <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
                  <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                    className="text-xs text-[#374151] bg-transparent outline-none">
                    {TYPE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 h-8 rounded-lg bg-[#111827] px-3 text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors disabled:opacity-60"
                  >
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    Upload
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto p-5">
                {error && (
                  <div className="mb-4">
                    <FetchError message={error} onRetry={load} loading={loading} />
                  </div>
                )}
                {loading ? (
                  <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" /></div>
                ) : assets.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-16">
                    <ImageIcon className="h-8 w-8 text-[#D1D5DB]" />
                    <p className="text-sm text-[#9CA3AF]">No images found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {assets.map((asset) => {
                      const isSelected = selected?.id === asset.id;
                      return (
                        <button
                          key={asset.id}
                          onClick={() => setSelected(isSelected ? null : asset)}
                          className={cn(
                            "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                            isSelected ? "border-[#2563EB] shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" : "border-transparent hover:border-[#CBD5E1]"
                          )}
                        >
                          <img src={asset.url} alt={asset.filename ?? ""} className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-[#2563EB]/20 flex items-center justify-center">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB]">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex justify-center gap-1 mt-4">
                    {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
                      <button key={p} onClick={() => setPage(p)}
                        className={cn("h-7 w-7 rounded-lg text-xs font-semibold transition-colors",
                          p === page ? "bg-[#111827] text-white" : "text-[#6B7280] hover:bg-[#F3F4F6]")}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="shrink-0 border-t border-[#F3F4F6] px-5 py-4 flex items-center justify-between">
                <div className="min-w-0">
                  {selected ? (
                    <div>
                      <p className="text-xs font-semibold text-[#374151] truncate">{selected.filename ?? selected.publicId}</p>
                      <p className="text-[10px] text-[#9CA3AF]">
                        {selected.width && selected.height ? `${selected.width}×${selected.height} · ` : ""}
                        {formatBytes(selected.bytes)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#9CA3AF]">Select an image to insert</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setOpen(false)} className="h-9 px-4 rounded-lg border border-[#E5E7EB] text-sm font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={confirm}
                    disabled={!selected}
                    className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-[#2563EB] text-sm font-semibold text-white hover:bg-[#1D4ED8] transition-colors disabled:opacity-40"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Insert Image
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
