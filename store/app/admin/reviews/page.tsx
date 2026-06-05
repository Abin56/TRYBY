"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Star, Search, CheckCircle2, XCircle, EyeOff, Crown,
  ChevronLeft, ChevronRight, BadgeCheck, Trash2,
  Image as ImageIcon, Video, ExternalLink,
} from "lucide-react";
import Link from "next/link";

const STATUS_COLOR: Record<string, string> = {
  PENDING:  "#F5C518",
  APPROVED: "#4ADE80",
  REJECTED: "#F87171",
  HIDDEN:   "rgba(255,255,255,0.30)",
};

type Review = {
  id: string; rating: number; title: string | null; body: string | null;
  status: string; isVerified: boolean; isFeatured: boolean;
  helpfulCount: number; imageUrls: string[]; videoUrls: string[];
  createdAt: string; adminNote: string | null;
  user:    { id: string; name: string | null; email: string | null; image: string | null };
  product: { id: string; name: string; slug: string; images: { url: string }[] };
};

export default function AdminReviewsPage() {
  const [reviews, setReviews]       = useState<Review[]>([]);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [page, setPage]             = useState(1);
  const [q, setQ]                   = useState("");
  const [statusFilter, setSF]       = useState("PENDING");
  const [ratingFilter, setRF]       = useState("");
  const [counts, setCounts]         = useState<Record<string, number>>({});
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [actionLoading, setAL]      = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), q });
    if (statusFilter) params.set("status", statusFilter);
    if (ratingFilter) params.set("rating", ratingFilter);
    const res  = await fetch(`/api/admin/reviews?${params}`);
    const data = await res.json();
    setReviews(data.reviews ?? []);
    setTotal(data.total   ?? 0);
    setPages(data.pages   ?? 1);
    setCounts(data.counts ?? {});
    setLoading(false);
  }, [page, q, statusFilter, ratingFilter]);

  useEffect(() => { load(); }, [load]);

  async function singleAction(id: string, action: string) {
    setAL(id);
    await fetch(`/api/admin/reviews/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action }),
    });
    setAL(null);
    load();
  }

  async function bulkAction(action: string) {
    if (!selected.size) return;
    await fetch("/api/admin/reviews", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ids: [...selected], action }),
    });
    setSelected(new Set());
    load();
  }

  async function deleteReview(id: string) {
    if (!confirm("Permanently delete this review?")) return;
    setAL(id);
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    setAL(null);
    load();
  }

  const toggleSelect = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleAll = () =>
    setSelected(selected.size === reviews.length ? new Set() : new Set(reviews.map(r => r.id)));

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const STATUS_TABS = ["PENDING", "APPROVED", "HIDDEN", "REJECTED"];

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Review Moderation
          </h1>
          <p className="text-white/40 text-[13px] mt-0.5">{total} review{total !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/admin/review-analytics"
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold text-white/50 hover:text-white hover:bg-white/06 transition-all">
          <ExternalLink className="h-3.5 w-3.5" /> Analytics
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 mb-4">
        {STATUS_TABS.map(s => {
          const color = STATUS_COLOR[s];
          return (
            <button key={s} onClick={() => { setSF(s); setPage(1); }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all"
              style={{
                background: statusFilter === s ? `${color}20` : "rgba(255,255,255,0.04)",
                color:      statusFilter === s ? color          : "rgba(255,255,255,0.35)",
                border:     `1px solid ${statusFilter === s ? color + "40" : "transparent"}`,
              }}>
              {s}
              {counts[s] ? <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black" style={{ background: color, color: "#0D0D0D" }}>{counts[s]}</span> : null}
            </button>
          );
        })}
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 rounded-xl px-4 flex-1 min-w-[200px]"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", height: "44px" }}>
          <Search className="h-4 w-4 text-white/30 shrink-0" />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Search review, customer, product…"
            className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/25"
          />
        </div>
        {["", "5", "4", "3", "2", "1"].map(r => (
          <button key={r} onClick={() => { setRF(r); setPage(1); }}
            className="rounded-xl px-3 py-2 text-[12px] font-semibold transition-all"
            style={{
              background: ratingFilter === r ? "#F5C518" : "rgba(255,255,255,0.06)",
              color:      ratingFilter === r ? "#0D0D0D" : "rgba(255,255,255,0.50)",
            }}>
            {r ? `${r}★` : "All ★"}
          </button>
        ))}
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4"
          style={{ background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.20)" }}>
          <span className="text-[12px] font-bold text-[#F5C518]">{selected.size} selected</span>
          {[
            { action: "approve",   label: "Approve",   color: "#4ADE80" },
            { action: "reject",    label: "Reject",    color: "#F87171" },
            { action: "hide",      label: "Hide",      color: "rgba(255,255,255,0.40)" },
            { action: "feature",   label: "Feature",   color: "#F5C518" },
            { action: "unfeature", label: "Unfeature", color: "rgba(255,255,255,0.40)" },
          ].map(a => (
            <button key={a.action} onClick={() => bulkAction(a.action)}
              className="rounded-xl px-3 py-1.5 text-[11px] font-bold hover:brightness-110 transition-all"
              style={{ background: `${a.color}15`, color: a.color }}>
              {a.label}
            </button>
          ))}
          <button onClick={() => setSelected(new Set())} className="ml-auto text-[11px] text-white/30 hover:text-white">Cancel</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Star className="h-10 w-10 text-white/15 mb-3" />
          <p className="text-white/40 text-[14px]">No reviews in this view</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th className="px-4 py-3 text-left w-8">
                  <input type="checkbox" checked={selected.size === reviews.length && reviews.length > 0}
                    onChange={toggleAll}
                    className="rounded accent-[#F5C518]" />
                </th>
                {["Review", "Product", "Rating", "Verified", "Media", "Date", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold tracking-wider text-white/30"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.12em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {reviews.map(r => (
                <tr key={r.id} className={`hover:bg-white/02 transition-colors ${selected.has(r.id) ? "bg-white/02" : ""}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)}
                      className="rounded accent-[#F5C518]" />
                  </td>
                  <td className="px-4 py-4 max-w-[280px]">
                    <div className="flex items-center gap-2 mb-1">
                      {r.user.image ? (
                        <img src={r.user.image} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                          style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.40)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {(r.user.name ?? "?").charAt(0)}
                        </div>
                      )}
                      <span className="text-[12px] text-white/60 truncate">{r.user.name ?? r.user.email}</span>
                      {r.isFeatured && <Crown className="h-3 w-3 text-[#F5C518] shrink-0" />}
                    </div>
                    {r.title && <p className="text-[12px] font-semibold text-white/80 truncate">{r.title}</p>}
                    {r.body && <p className="text-[11px] text-white/40 truncate max-w-[240px]">{r.body}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {r.product.images[0] && (
                        <img src={r.product.images[0].url} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                      )}
                      <p className="text-[11px] text-white/60 truncate max-w-[120px]">{r.product.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className="h-3 w-3" fill={s <= r.rating ? "#F5C518" : "none"} stroke={s <= r.rating ? "#F5C518" : "rgba(255,255,255,0.20)"} strokeWidth={1.5} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {r.isVerified ? (
                      <BadgeCheck className="h-4 w-4 text-[#4ADE80]" />
                    ) : (
                      <span className="text-[10px] text-white/25">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {r.imageUrls.length > 0 && (
                        <div className="flex items-center gap-0.5 text-[11px] text-white/40">
                          <ImageIcon className="h-3 w-3" /> {r.imageUrls.length}
                        </div>
                      )}
                      {r.videoUrls.length > 0 && (
                        <div className="flex items-center gap-0.5 text-[11px] text-white/40">
                          <Video className="h-3 w-3" /> {r.videoUrls.length}
                        </div>
                      )}
                      {!r.imageUrls.length && !r.videoUrls.length && <span className="text-[10px] text-white/20">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-white/40">{fmtDate(r.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {r.status === "PENDING" && (
                        <>
                          <button onClick={() => singleAction(r.id, "approve")} disabled={actionLoading === r.id}
                            className="rounded-lg px-2.5 py-1 text-[10px] font-bold disabled:opacity-40 hover:brightness-110"
                            style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>
                            ✓
                          </button>
                          <button onClick={() => singleAction(r.id, "reject")} disabled={actionLoading === r.id}
                            className="rounded-lg px-2.5 py-1 text-[10px] font-bold disabled:opacity-40 hover:brightness-110"
                            style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}>
                            ✕
                          </button>
                        </>
                      )}
                      {r.status === "APPROVED" && (
                        <>
                          <button onClick={() => singleAction(r.id, r.isFeatured ? "unfeature" : "feature")} disabled={actionLoading === r.id}
                            title={r.isFeatured ? "Unfeature" : "Feature"}
                            className="rounded-lg px-2 py-1 text-[10px] font-bold disabled:opacity-40 hover:brightness-110"
                            style={{ background: r.isFeatured ? "rgba(245,197,24,0.20)" : "rgba(245,197,24,0.08)", color: "#F5C518" }}>
                            <Crown className="h-3 w-3" />
                          </button>
                          <button onClick={() => singleAction(r.id, "hide")} disabled={actionLoading === r.id}
                            title="Hide"
                            className="rounded-lg px-2 py-1 text-[10px] font-bold disabled:opacity-40 hover:brightness-110"
                            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.40)" }}>
                            <EyeOff className="h-3 w-3" />
                          </button>
                        </>
                      )}
                      {r.status === "HIDDEN" && (
                        <button onClick={() => singleAction(r.id, "approve")} disabled={actionLoading === r.id}
                          className="rounded-lg px-2.5 py-1 text-[10px] font-bold disabled:opacity-40 hover:brightness-110"
                          style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>
                          Show
                        </button>
                      )}
                      <button onClick={() => deleteReview(r.id)} disabled={actionLoading === r.id}
                        className="rounded-lg px-2 py-1 text-[10px] font-bold text-white/20 hover:text-[#F87171] hover:bg-white/04 disabled:opacity-40 transition-all">
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <Link href={`/products/${r.product.slug}`} target="_blank"
                        className="rounded-lg px-2 py-1 text-[10px] text-white/20 hover:text-white/60 transition-colors">
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-[12px] text-white/35">Page {page} of {pages}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/08 disabled:opacity-30 transition-all">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/08 disabled:opacity-30 transition-all">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
