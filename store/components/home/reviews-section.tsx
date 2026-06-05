"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star, BadgeCheck } from "lucide-react";
import { LiveRatingBadge } from "./live-rating-badge";

type Review = {
  name: string;
  city: string;
  sport: string;
  sportEmoji: string;
  sportColor: string;
  rating: number;
  text: string;
  product: string;
  productImage: string;
  avatar: string;
};

const REVIEWS: Review[] = [
  {
    name: "Arjun Sharma",
    city: "Mumbai",
    sport: "Cricket",
    sportEmoji: "🏏",
    sportColor: "#4CAF50",
    rating: 5,
    text: "Got the MI jersey for the season — the quality is insane. Stitching is perfect, fits true to size. Official feel all the way!",
    product: "MI Jersey 2026",
    productImage: "https://images.unsplash.com/photo-1580087256394-dc596e1c8f4f?w=60&h=60&fit=crop",
    avatar: "AS",
  },
  {
    name: "Rahul Verma",
    city: "Delhi",
    sport: "Football",
    sportEmoji: "⚽",
    sportColor: "#2196F3",
    rating: 5,
    text: "Barcelona jersey looks exactly like the real deal. Got loads of compliments at the game. Delivery was super fast!",
    product: "Barcelona FC Jersey",
    productImage: "https://images.unsplash.com/photo-1624526267942-ab0ff8a3b972?w=60&h=60&fit=crop",
    avatar: "RV",
  },
  {
    name: "Priya Nair",
    city: "Bangalore",
    sport: "Gym",
    sportEmoji: "💪",
    sportColor: "#FF3B30",
    rating: 5,
    text: "The resistance band set is brilliant for home workouts. Really solid quality and the carry case is a nice touch!",
    product: "Gym Resistance Set",
    productImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=60&h=60&fit=crop",
    avatar: "PN",
  },
  {
    name: "Vikram Singh",
    city: "Pune",
    sport: "Running",
    sportEmoji: "🏃",
    sportColor: "#FF9800",
    rating: 4,
    text: "Running shoes arrived in 2 days — way faster than expected. Comfortable from day one, no breaking in needed. Worth every rupee.",
    product: "Running Performance Shoes",
    productImage: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=60&h=60&fit=crop",
    avatar: "VS",
  },
  {
    name: "Meena Krishnan",
    city: "Chennai",
    sport: "Cricket",
    sportEmoji: "🏏",
    sportColor: "#4CAF50",
    rating: 5,
    text: "CSK jersey for my son — he hasn't taken it off since! The fabric quality is top-notch. Will definitely order India jersey next.",
    product: "CSK Jersey 2026",
    productImage: "https://images.unsplash.com/photo-1614632537423-1e6c2317a90e?w=60&h=60&fit=crop",
    avatar: "MK",
  },
  {
    name: "Aditya Patel",
    city: "Ahmedabad",
    sport: "Football",
    sportEmoji: "⚽",
    sportColor: "#2196F3",
    rating: 5,
    text: "Ordered a Real Madrid jersey for my birthday. Arrived on time, packed brilliantly. The authenticity certificate was a nice touch!",
    product: "Real Madrid Jersey",
    productImage: "https://images.unsplash.com/photo-1614632537423-1e6c2317a90e?w=60&h=60&fit=crop&crop=center",
    avatar: "AP",
  },
  {
    name: "Kavya Reddy",
    city: "Hyderabad",
    sport: "Gym",
    sportEmoji: "💪",
    sportColor: "#FF3B30",
    rating: 5,
    text: "Protein shakers are top quality. No leaking, no smell. Ordered 3 sets already. Customer support was helpful too.",
    product: "Gym Shaker Set",
    productImage: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=60&h=60&fit=crop",
    avatar: "KR",
  },
  {
    name: "Rohit Das",
    city: "Kolkata",
    sport: "Cricket",
    sportEmoji: "🏏",
    sportColor: "#4CAF50",
    rating: 5,
    text: "RCB jersey quality is on par with what I saw at the stadium. Ordered L and it fits perfectly. TRYBY is my go-to for sports gear!",
    product: "RCB Jersey 2026",
    productImage: "https://images.unsplash.com/photo-1556906781-9a412961a28c?w=60&h=60&fit=crop",
    avatar: "RD",
  },
];

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 w-[300px] sm:w-[320px] shrink-0 mx-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF3B30] text-xs font-black text-white shrink-0"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {review.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-[#111827] truncate">{review.name}</p>
            <BadgeCheck className="h-3.5 w-3.5 text-[#2196F3] shrink-0" fill="#2196F3" />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-[#9CA3AF]">{review.city}</p>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
              style={{ backgroundColor: `${review.sportColor}18`, color: review.sportColor }}
            >
              {review.sportEmoji} {review.sport}
            </span>
          </div>
        </div>
      </div>

      {/* Stars */}
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="h-3.5 w-3.5"
            fill={i < review.rating ? "#FFB800" : "#E5E7EB"}
            stroke={i < review.rating ? "#FFB800" : "#E5E7EB"}
          />
        ))}
      </div>

      {/* Review text */}
      <p className="text-sm text-[#374151] leading-relaxed line-clamp-3">&ldquo;{review.text}&rdquo;</p>

      {/* Product */}
      <div className="flex items-center gap-2.5 rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-2.5">
        <img
          src={review.productImage}
          alt={review.product}
          className="h-9 w-9 rounded-lg object-cover"
          loading="lazy"
        />
        <div>
          <p className="text-[10px] text-[#9CA3AF]">Verified purchase</p>
          <p className="text-xs font-semibold text-[#111827] truncate max-w-[160px]">{review.product}</p>
        </div>
      </div>
    </div>
  );
}

export function ReviewsSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const row1 = [...REVIEWS.slice(0, 4), ...REVIEWS.slice(0, 4)];
  const row2 = [...REVIEWS.slice(4), ...REVIEWS.slice(4)];

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-[#FAFAFA] overflow-hidden" aria-labelledby="reviews-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="text-center"
        >
          <p className="sport-label text-xs text-[#FF3B30] mb-2">⭐ Athlete Reviews</p>
          <h2
            id="reviews-heading"
            className="section-headline text-[clamp(28px,5vw,44px)] text-[#111827] mb-5"
          >
            Trusted by 50,000+ Athletes.
          </h2>
          {/* Live badge — shows real DB data when available, falls back to nothing */}
          <LiveRatingBadge />
        </motion.div>
      </div>

      {/* Row 1 — scrolls left */}
      <div className="marquee-container overflow-hidden mb-4" aria-hidden="true">
        <div className="marquee-track">
          {row1.map((r, i) => <ReviewCard key={`r1-${i}`} review={r} />)}
        </div>
      </div>

      {/* Row 2 — scrolls right */}
      <div className="marquee-container overflow-hidden" aria-hidden="true">
        <div className="marquee-track-reverse">
          {row2.map((r, i) => <ReviewCard key={`r2-${i}`} review={r} />)}
        </div>
      </div>

      {/* Screen-reader copy */}
      <ul className="sr-only">
        {REVIEWS.map((r) => (
          <li key={r.name}>
            <strong>{r.name}</strong> from {r.city} ({r.sport}): {r.text} — rated {r.rating}/5 for {r.product}
          </li>
        ))}
      </ul>
    </section>
  );
}
