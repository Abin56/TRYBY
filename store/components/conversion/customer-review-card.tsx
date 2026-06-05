"use client";

import { Star, BadgeCheck } from "lucide-react";

export interface ReviewData {
  id:        string;
  name:      string;
  avatar?:   string;
  initials:  string;
  rating:    number;
  text:      string;
  product:   string;
  date:      string;
  verified?: boolean;
  sport?:    string;
}

interface CustomerReviewCardProps {
  review: ReviewData;
  variant?: "default" | "compact";
}

export function CustomerReviewCard({ review, variant = "default" }: CustomerReviewCardProps) {
  const isCompact = variant === "compact";

  return (
    <div
      className="flex flex-col rounded-2xl bg-white border border-[#F0F0F0] p-5 hover:border-[#E0E0E0] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      {/* Stars */}
      <div className="flex items-center gap-0.5 mb-3">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className="h-3.5 w-3.5"
            fill={s <= review.rating ? "#F5C518" : "none"}
            stroke={s <= review.rating ? "#F5C518" : "#D1D5DB"}
            strokeWidth={1.5}
          />
        ))}
        {review.sport && (
          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
            {review.sport}
          </span>
        )}
      </div>

      {/* Review text */}
      {!isCompact && (
        <p className="text-[13px] text-[#374151] leading-relaxed mb-4 flex-1 line-clamp-3">
          &ldquo;{review.text}&rdquo;
        </p>
      )}

      {/* Product */}
      <p className="text-[11px] text-[#9CA3AF] mb-3 font-medium truncate">
        {review.product}
      </p>

      {/* Reviewer */}
      <div className="flex items-center gap-2.5">
        {review.avatar ? (
          <img
            src={review.avatar}
            alt={review.name}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
            style={{ background: "linear-gradient(135deg, #0D0D0D 0%, #374151 100%)" }}
          >
            {review.initials}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-[12px] font-bold text-[#0D0D0D] truncate">{review.name}</p>
            {review.verified && (
              <BadgeCheck className="h-3.5 w-3.5 text-[#2563EB] shrink-0" />
            )}
          </div>
          <p className="text-[10px] text-[#9CA3AF]">{review.date}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Static review data ───────────────────────────────────────────────────────

export const FEATURED_REVIEWS: ReviewData[] = [
  {
    id: "r1",
    name: "Arjun Mehta",
    initials: "AM",
    rating: 5,
    text: "The Barcelona jersey quality is absolutely premium. Stitching is perfect, fabric is breathable. Arrived in 3 days — faster than expected!",
    product: "Barcelona Home Jersey 2024/25",
    date: "2 days ago",
    verified: true,
    sport: "Football",
  },
  {
    id: "r2",
    name: "Priya Sharma",
    initials: "PS",
    rating: 5,
    text: "Ordered for my brother's birthday. The packaging was beautiful and the jersey looks exactly like on the website. Will definitely order again!",
    product: "India Cricket ODI Jersey",
    date: "1 week ago",
    verified: true,
    sport: "Cricket",
  },
  {
    id: "r3",
    name: "Rahul Nair",
    initials: "RN",
    rating: 5,
    text: "Gym wear is top notch. Comfortable, doesn't stretch out. Tried 3 other brands before — TRYBY is the best value for money.",
    product: "Pro Gym Performance Tee",
    date: "3 days ago",
    verified: true,
    sport: "Gym",
  },
  {
    id: "r4",
    name: "Sneha Iyer",
    initials: "SI",
    rating: 4,
    text: "Great experience overall. Return process was smooth when I needed to exchange size. Customer support was very responsive.",
    product: "Real Madrid Away Jersey",
    date: "5 days ago",
    verified: true,
    sport: "Football",
  },
  {
    id: "r5",
    name: "Vikram Bose",
    initials: "VB",
    rating: 5,
    text: "Fan edition jersey looks identical to the official one at half the price. Great quality control. Fast delivery to Kolkata too!",
    product: "PSG Home Jersey Fan Edition",
    date: "1 week ago",
    verified: false,
    sport: "Football",
  },
  {
    id: "r6",
    name: "Ananya Reddy",
    initials: "AR",
    rating: 5,
    text: "Bought the cricket kit for my son. He loves it — says it feels professional. The size guide was accurate.",
    product: "IPL Premium Training Kit",
    date: "4 days ago",
    verified: true,
    sport: "Cricket",
  },
];
