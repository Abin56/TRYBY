"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TrustStatCard, HOMEPAGE_STATS } from "@/components/conversion/trust-stat-card";
import { CustomerReviewCard, FEATURED_REVIEWS } from "@/components/conversion/customer-review-card";

// ─── Stats row ────────────────────────────────────────────────────────────────

function StatsRow() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {HOMEPAGE_STATS.map((stat, i) => (
        <TrustStatCard key={i} stat={stat} accent="#E8FF47" />
      ))}
    </div>
  );
}

// ─── Reviews carousel ─────────────────────────────────────────────────────────

function ReviewsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  }

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }

  return (
    <div className="relative">
      {/* Left arrow */}
      {canLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-4 hidden md:flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#E0E0E0] shadow-md text-[#0D0D0D] hover:border-[#0D0D0D] transition-all"
          aria-label="Previous reviews"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollPaddingLeft: "0px" }}
      >
        {FEATURED_REVIEWS.map((review) => (
          <div key={review.id} className="snap-start shrink-0 w-[300px] md:w-[320px]">
            <CustomerReviewCard review={review} />
          </div>
        ))}
      </div>

      {/* Right arrow */}
      {canRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-4 hidden md:flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#E0E0E0] shadow-md text-[#0D0D0D] hover:border-[#0D0D0D] transition-all"
          aria-label="Next reviews"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ─── Full section ─────────────────────────────────────────────────────────────

export function SocialProofSection() {
  return (
    <section className="py-16 bg-[#F8F8F8]" aria-label="Social proof">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* Stats */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p
                className="text-[11px] font-black uppercase tracking-[0.18em] text-[#9CA3AF] mb-1"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Our Numbers
              </p>
              <h2
                className="text-[28px] font-black text-[#0D0D0D] leading-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.01em" }}
              >
                Trusted by Athletes
              </h2>
            </div>
          </div>
          <StatsRow />
        </div>

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p
                className="text-[11px] font-black uppercase tracking-[0.18em] text-[#9CA3AF] mb-1"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Customer Love
              </p>
              <h2
                className="text-[28px] font-black text-[#0D0D0D] leading-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.01em" }}
              >
                What They&apos;re Saying
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                {["AM", "PS", "RN"].map((i) => (
                  <div
                    key={i}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[9px] font-black text-white"
                    style={{ background: "#0D0D0D" }}
                  >
                    {i}
                  </div>
                ))}
              </div>
              <span className="text-[12px] font-semibold text-[#555]">4.8 avg rating</span>
            </div>
          </div>
          <ReviewsCarousel />
        </div>

      </div>
    </section>
  );
}
