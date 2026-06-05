"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Star, MessageSquare, ThumbsUp, Filter } from "lucide-react";
import { reviews, type ReviewStatus } from "@/data/mock";
import { ReviewStatusBadge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";

const STATUS_OPTS: { value: ReviewStatus | "all"; label: string }[] = [
  { value: "all",      label: "All Reviews" },
  { value: "pending",  label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function ReviewsPage() {
  const [statusFilter, setStatus] = useState<ReviewStatus | "all">("pending");
  const [ratingFilter, setRating] = useState<number | null>(null);
  const [localReviews, setLocalReviews] = useState(reviews);

  const filtered = localReviews.filter(r => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchRating = ratingFilter === null || r.rating === ratingFilter;
    return matchStatus && matchRating;
  });

  const approve = (id: string) => setLocalReviews(prev => prev.map(r => r.id === id ? { ...r, status: "approved" as ReviewStatus } : r));
  const reject  = (id: string) => setLocalReviews(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" as ReviewStatus } : r));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-[#111827]">Review Moderation</h1>
        <p className="text-sm text-[#9CA3AF]">{localReviews.filter(r => r.status === "pending").length} reviews awaiting moderation</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-[#E5E7EB]">
        {STATUS_OPTS.map(s => (
          <button key={s.value} onClick={() => setStatus(s.value as any)}
            className={cn("px-3 py-2 text-xs font-semibold border-b-2 transition-all -mb-px",
              statusFilter === s.value ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-[#6B7280] hover:text-[#111827]")}>
            {s.label}
            <span className={cn("ml-1 rounded-full px-1.5 py-0.5 text-[10px]",
              statusFilter === s.value ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-[#F3F4F6] text-[#9CA3AF]")}>
              {s.value === "all" ? reviews.length : localReviews.filter(r => r.status === s.value).length}
            </span>
          </button>
        ))}
        {/* Rating filter */}
        <div className="ml-auto flex items-center gap-1 pb-1">
          {[null, 5, 4, 3, 2, 1].map(r => (
            <button key={r ?? "all"} onClick={() => setRating(r)}
              className={cn("rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                ratingFilter === r ? "bg-[#111827] text-white" : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]")}>
              {r === null ? "All" : `${r}★`}
            </button>
          ))}
        </div>
      </div>

      {/* Review cards */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {filtered.map((review, i) => (
            <motion.div key={review.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
              className="rounded-xl border border-[#E5E7EB] bg-white p-5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Left: product + reviewer */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-[#F3F4F6]">
                    <img src={review.product.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className="h-3.5 w-3.5" fill={s <= review.rating ? "#F59E0B" : "none"} stroke={s <= review.rating ? "#F59E0B" : "#D1D5DB"} />
                        ))}
                      </div>
                      <ReviewStatusBadge status={review.status} />
                      {review.isVerified && <span className="text-[10px] font-semibold text-[#22C55E] bg-[#F0FDF4] border border-[#BBF7D0] rounded-full px-2 py-0.5">✓ Verified</span>}
                    </div>
                    {review.title && <p className="text-sm font-bold text-[#111827] mb-1">{review.title}</p>}
                    <p className="text-sm text-[#374151] leading-relaxed">{review.body}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#9CA3AF]">
                      <span className="font-semibold text-[#374151]">{review.customer.name}</span>
                      <span>on</span>
                      <span className="font-semibold text-[#2563EB]">{review.product.name}</span>
                      <span>·</span>
                      <span>{formatRelative(review.createdAt)}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{review.helpfulCount}</span>
                    </div>
                  </div>
                </div>

                {/* Right: actions */}
                {review.status === "pending" && (
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button onClick={() => approve(review.id)}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs font-semibold text-[#16A34A] hover:bg-[#DCFCE7] transition-colors">
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button onClick={() => reject(review.id)}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] text-xs font-semibold text-[#DC2626] hover:bg-[#FFE4E6] transition-colors">
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center rounded-xl border border-[#E5E7EB] bg-white">
            <MessageSquare className="h-10 w-10 text-[#D1D5DB]" />
            <p className="text-sm font-semibold text-[#374151]">No reviews to moderate</p>
            <p className="text-xs text-[#9CA3AF]">All clear — you're up to date!</p>
          </div>
        )}
      </div>
    </div>
  );
}
