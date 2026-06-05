"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, BadgeCheck, ThumbsUp, ThumbsDown, Loader2, ChevronLeft, ChevronRight, Crown, Play, X } from "lucide-react";
import { ReviewForm } from "./review-form";
import { cn } from "@/lib/cn";

interface Review {
  id:              string;
  userId:          string;
  rating:          number;
  title?:          string;
  body?:           string;
  isVerified:      boolean;
  isFeatured:      boolean;
  helpfulCount:    number;
  notHelpfulCount: number;
  imageUrls:       string[];
  videoUrls:       string[];
  createdAt:       string;
  user:            { name?: string | null; image?: string | null };
}

interface ReviewSummary {
  avgRating:   number;
  reviewCount: number;
  breakdown:   Record<string, number>;
}

interface ReviewListProps {
  productId:    string;
  productName:  string;
  canReview?:   boolean;
  orderItemId?: string;
  summary?:     ReviewSummary;
}

type SortOption = "helpful" | "newest" | "highest" | "lowest";

function StarBar({ star, count, total, onFilter, active }: {
  star: number; count: number; total: number; onFilter: () => void; active: boolean;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <button onClick={onFilter} className="flex items-center gap-2 w-full group">
      <span className="text-[12px] text-[#555] w-4 shrink-0">{star}</span>
      <Star className="h-3 w-3 text-[#F5C518] shrink-0" fill="#F5C518" />
      <div className={cn("flex-1 h-1.5 rounded-full overflow-hidden", active ? "bg-[#F5C518]/20" : "bg-[#F0F0F0]")}>
        <div className="h-full rounded-full bg-[#F5C518] transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-[11px] w-5 text-right shrink-0", active ? "text-[#0D0D0D] font-bold" : "text-[#9CA3AF]")}>{count}</span>
    </button>
  );
}

function MediaGallery({ imageUrls, videoUrls }: { imageUrls: string[]; videoUrls: string[] }) {
  const [lightbox, setLightbox] = useState<{ type: "image" | "video"; url: string } | null>(null);

  if (!imageUrls.length && !videoUrls.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-3">
        {imageUrls.map((url, i) => (
          <button key={`img-${i}`} onClick={() => setLightbox({ type: "image", url })}
            className="relative group overflow-hidden rounded-xl">
            <img src={url} alt="" className="h-16 w-16 object-cover border border-[#E0E0E0] transition-transform group-hover:scale-105" />
          </button>
        ))}
        {videoUrls.map((url, i) => (
          <button key={`vid-${i}`} onClick={() => setLightbox({ type: "video", url })}
            className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-[#0D0D0D] overflow-hidden group">
            <Play className="h-6 w-6 text-white" />
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white">
            <X className="h-6 w-6" />
          </button>
          {lightbox.type === "image" ? (
            <img src={lightbox.url} alt="" className="max-h-[90vh] max-w-full rounded-2xl object-contain"
              onClick={e => e.stopPropagation()} />
          ) : (
            <video src={lightbox.url} controls autoPlay className="max-h-[90vh] max-w-full rounded-2xl"
              onClick={e => e.stopPropagation()} />
          )}
        </div>
      )}
    </>
  );
}

function ReviewCard({ review, onVote }: { review: Review; onVote: (id: string, helpful: boolean) => void }) {
  const initials = (review.user.name ?? "A").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const date = new Date(review.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className={cn("py-5 border-b border-[#F0F0F0] last:border-0", review.isFeatured && "bg-[#FFFBEB] rounded-2xl px-4 -mx-4 border border-[#FDE68A] mb-3")}>
      <div className="flex items-start gap-3 mb-3">
        {review.user.image ? (
          <img src={review.user.image} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-black text-white" style={{ background: "#0D0D0D" }}>
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[13px] font-bold text-[#0D0D0D]">{review.user.name ?? "Customer"}</span>
            {review.isVerified && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#16A34A]">
                <BadgeCheck className="h-3 w-3" /> Verified Purchase
              </span>
            )}
            {review.isFeatured && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#D97706]">
                <Crown className="h-3 w-3" /> Featured
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className="h-3 w-3" fill={s <= review.rating ? "#F5C518" : "none"} stroke={s <= review.rating ? "#F5C518" : "#D1D5DB"} strokeWidth={1.5} />
              ))}
            </div>
            <span className="text-[11px] text-[#9CA3AF]">{date}</span>
          </div>
        </div>
      </div>

      {review.title && <p className="text-[14px] font-bold text-[#0D0D0D] mb-1">{review.title}</p>}
      {review.body  && <p className="text-[13px] text-[#555] leading-relaxed">{review.body}</p>}

      <MediaGallery imageUrls={review.imageUrls} videoUrls={review.videoUrls} />

      {/* Helpful voting */}
      <div className="flex items-center gap-4 mt-3">
        <span className="text-[11px] text-[#9CA3AF]">Helpful?</span>
        <button
          onClick={() => onVote(review.id, true)}
          className="flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-[#16A34A] transition-colors"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          <span>{review.helpfulCount}</span>
        </button>
        <button
          onClick={() => onVote(review.id, false)}
          className="flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
          <span>{review.notHelpfulCount}</span>
        </button>
      </div>
    </div>
  );
}

export function ReviewList({ productId, productName, canReview, orderItemId, summary: externalSummary }: ReviewListProps) {
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [summary, setSummary]   = useState<ReviewSummary | null>(externalSummary ?? null);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sort, setSort]         = useState<SortOption>("helpful");
  const [ratingFilter, setRF]   = useState<number | null>(null);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalP] = useState(1);
  const [total, setTotal]       = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ productId, sort, page: String(page) });
    if (ratingFilter) params.set("rating", String(ratingFilter));
    const res  = await fetch(`/api/reviews?${params}`);
    const data = await res.json();
    setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    setTotal(data.total ?? 0);
    setTotalP(data.pages ?? 1);
    if (data.summary) setSummary(data.summary);
    setLoading(false);
  }, [productId, sort, page, ratingFilter]);

  useEffect(() => { load(); }, [load]);

  const handleVote = useCallback(async (reviewId: string, isHelpful: boolean) => {
    const res = await fetch(`/api/reviews/${reviewId}/vote`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHelpful }),
    });
    if (res.ok) {
      setReviews(prev => prev.map(r =>
        r.id === reviewId
          ? { ...r, helpfulCount: isHelpful ? r.helpfulCount + 1 : r.helpfulCount, notHelpfulCount: !isHelpful ? r.notHelpfulCount + 1 : r.notHelpfulCount }
          : r
      ));
    }
  }, []);

  const avg   = summary?.avgRating   ?? 0;
  const count = summary?.reviewCount ?? total;
  const bd    = summary?.breakdown   ?? {};

  const SORTS: { key: SortOption; label: string }[] = [
    { key: "helpful", label: "Most Helpful" },
    { key: "newest",  label: "Newest"       },
    { key: "highest", label: "★ High"       },
    { key: "lowest",  label: "★ Low"        },
  ];

  // Separate featured reviews
  const featured  = reviews.filter(r => r.isFeatured);
  const regular   = reviews.filter(r => !r.isFeatured);

  return (
    <section id="reviews">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-[22px] font-black text-[#0D0D0D]"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.01em" }}>
          Customer Reviews
          {count > 0 && <span className="ml-2 text-[#9CA3AF] font-normal text-[18px]">({count})</span>}
        </h2>
        {canReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-xl border-2 border-[#0D0D0D] px-4 py-2 text-[13px] font-black text-[#0D0D0D] hover:bg-[#0D0D0D] hover:text-white transition-all"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}
          >
            <Star className="h-3.5 w-3.5" /> WRITE A REVIEW
          </button>
        )}
      </div>

      {/* Summary block */}
      {count > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 mb-6 rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] p-5">
          <div className="flex flex-col items-center justify-center shrink-0">
            <span className="text-[56px] font-black text-[#0D0D0D] leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {Number(avg).toFixed(1)}
            </span>
            <div className="flex gap-0.5 my-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className="h-4 w-4" fill={s <= Math.round(avg) ? "#F5C518" : "none"} stroke={s <= Math.round(avg) ? "#F5C518" : "#D1D5DB"} strokeWidth={1.5} />
              ))}
            </div>
            <span className="text-[12px] text-[#9CA3AF]">{count} reviews</span>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5,4,3,2,1].map(s => (
              <StarBar
                key={s} star={s}
                count={Number(bd[String(s)] ?? 0)}
                total={count}
                onFilter={() => { setRF(ratingFilter === s ? null : s); setPage(1); }}
                active={ratingFilter === s}
              />
            ))}
          </div>
        </div>
      )}

      {/* Write review form */}
      {showForm && canReview && (
        <div className="mb-6 rounded-2xl border border-[#E0E0E0] bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-black text-[#0D0D0D]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Write Your Review
            </h3>
            <button onClick={() => setShowForm(false)} className="text-[#9CA3AF] hover:text-[#555] text-sm">Cancel</button>
          </div>
          <ReviewForm productId={productId} productName={productName} orderItemId={orderItemId}
            onSubmitted={() => setShowForm(false)} />
        </div>
      )}

      {/* Sort + filter bar */}
      {count > 0 && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-1">
            {SORTS.map(s => (
              <button key={s.key} onClick={() => { setSort(s.key); setPage(1); }}
                className={cn("rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all", sort === s.key ? "bg-[#0D0D0D] text-white" : "bg-[#F5F5F5] text-[#555] hover:bg-[#EBEBEB]")}>
                {s.label}
              </button>
            ))}
          </div>
          {ratingFilter && (
            <button onClick={() => { setRF(null); setPage(1); }}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-semibold bg-[#F5C518] text-[#0D0D0D]">
              {ratingFilter}★ <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-[#9CA3AF]" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA]">
          <p className="text-[14px] text-[#9CA3AF] mb-2">
            {ratingFilter ? `No ${ratingFilter}-star reviews yet` : "No reviews yet — be the first!"}
          </p>
          {canReview && !showForm && !ratingFilter && (
            <button onClick={() => setShowForm(true)} className="text-[13px] font-bold text-[#F5C518] hover:underline">
              Write a review →
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Featured reviews first */}
          {featured.length > 0 && (
            <div className="mb-2">
              {featured.map(r => <ReviewCard key={r.id} review={r} onVote={handleVote} />)}
            </div>
          )}
          {/* Regular reviews */}
          {regular.map(r => <ReviewCard key={r.id} review={r} onVote={handleVote} />)}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-[12px] text-[#9CA3AF]">
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E0E0E0] text-[#555] hover:bg-[#F5F5F5] disabled:opacity-30 transition-all">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-[12px] text-[#555]">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E0E0E0] text-[#555] hover:bg-[#F5F5F5] disabled:opacity-30 transition-all">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
