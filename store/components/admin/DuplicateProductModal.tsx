"use client";

import { useState, useEffect } from "react";
import { Copy, X, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface Category { id: string; name: string; }

interface Props {
  productId: string;
  productName: string;
  onClose: () => void;
}

export function DuplicateProductModal({ productId, productName, onClose }: Props) {
  const router = useRouter();
  const [newName, setNewName]           = useState(`${productName} (Copy)`);
  const [categoryId, setCategoryId]     = useState("");
  const [includeImages, setIncludeImages]   = useState(true);
  const [includeVariants, setIncludeVariants] = useState(true);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [duplicating, setDuplicating]   = useState(false);
  const [error, setError]               = useState("");

  useEffect(() => {
    fetch("/api/admin/categories").then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  async function handleDuplicate() {
    if (!newName.trim()) { setError("Name is required"); return; }
    setDuplicating(true); setError("");
    try {
      const res = await fetch("/api/admin/products/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId, newName: newName.trim(),
          categoryId: categoryId || undefined,
          includeImages, includeVariants,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to duplicate"); return; }
      onClose();
      router.push(`/admin/products/${data.id}/edit`);
    } catch { setError("Network error"); }
    finally { setDuplicating(false); }
  }

  const inp = "w-full rounded-xl px-3.5 text-[13px] text-white placeholder:text-white/25 outline-none bg-[#111] border border-white/08 h-10 focus:border-[#F5C518]/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(245,197,24,0.12)" }}>
            <Copy className="h-5 w-5 text-[#F5C518]" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-black text-[16px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Duplicate Product
            </h2>
            <p className="text-[11px] text-white/30 truncate">{productName}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-white/35 mb-1.5 uppercase tracking-widest">New Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} className={inp} />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-white/35 mb-1.5 uppercase tracking-widest">Category (optional)</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inp}>
              <option value="">Same as original</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            {[
              { label: "Copy variants & sizes", desc: "Stock resets to 0", value: includeVariants, set: setIncludeVariants },
              { label: "Copy images", desc: "Same Cloudinary URLs", value: includeImages, set: setIncludeImages },
            ].map(({ label, desc, value, set }) => (
              <button key={label} onClick={() => set(v => !v)}
                className="flex items-center justify-between w-full rounded-xl px-4 py-3 transition-all"
                style={{
                  background: value ? "rgba(245,197,24,0.06)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${value ? "rgba(245,197,24,0.25)" : "rgba(255,255,255,0.06)"}`,
                }}>
                <div className="text-left">
                  <p className="text-[12px] font-semibold text-white">{label}</p>
                  <p className="text-[10px] text-white/30">{desc}</p>
                </div>
                <div className={`h-5 w-9 rounded-full transition-all flex items-center px-0.5 ${value ? "bg-[#F5C518]" : "bg-white/15"}`}>
                  <div className={`h-4 w-4 rounded-full bg-white shadow transition-all ${value ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </button>
            ))}
          </div>

          <p className="text-[10px] text-white/25">Cloned product starts as inactive. Review before publishing.</p>

          {error && (
            <div className="rounded-xl px-4 py-3 text-[12px] font-semibold text-[#F87171]"
              style={{ background: "rgba(248,113,113,0.08)" }}>{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} disabled={duplicating}
              className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              Cancel
            </button>
            <button onClick={handleDuplicate} disabled={duplicating}
              className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-[13px] font-black text-[#0D0D0D] disabled:opacity-40"
              style={{ background: "#F5C518" }}>
              {duplicating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
              {duplicating ? "Cloning…" : "Duplicate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
