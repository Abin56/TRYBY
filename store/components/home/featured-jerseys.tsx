"use client";

import { motion, useInView, type Variants } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const JERSEYS = [
  {
    team: "Mumbai Indians",
    league: "IPL 2026",
    price: 1299,
    originalPrice: 1799,
    badge: "OFFICIAL",
    image: "https://images.unsplash.com/photo-1580087256394-dc596e1c8f4f?w=400&h=480&fit=crop",
    href: "/products/mi-jersey-2026",
    color: "#004BA0",
    soldOut: false,
  },
  {
    team: "CSK Jersey",
    league: "IPL 2026",
    price: 1299,
    originalPrice: 1799,
    badge: "OFFICIAL",
    image: "https://images.unsplash.com/photo-1614632537423-1e6c2317a90e?w=400&h=480&fit=crop",
    href: "/products/csk-jersey-2026",
    color: "#F9CD05",
    soldOut: false,
  },
  {
    team: "RCB Jersey",
    league: "IPL 2026",
    price: 1199,
    originalPrice: 1599,
    badge: "OFFICIAL",
    image: "https://images.unsplash.com/photo-1556906781-9a412961a28c?w=400&h=480&fit=crop",
    href: "/products/rcb-jersey-2026",
    color: "#D31B23",
    soldOut: false,
  },
  {
    team: "India Cricket",
    league: "National Team",
    price: 1499,
    originalPrice: 1999,
    badge: "OFFICIAL",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=480&fit=crop",
    href: "/products/india-cricket-jersey",
    color: "#002868",
    soldOut: false,
  },
  {
    team: "Real Madrid",
    league: "La Liga 2025/26",
    price: 2499,
    originalPrice: 3199,
    badge: "OFFICIAL",
    image: "https://images.unsplash.com/photo-1614632537423-1e6c2317a90e?w=400&h=480&fit=crop&crop=center",
    href: "/products/real-madrid-jersey",
    color: "#FFFFFF",
    soldOut: false,
  },
  {
    team: "Barcelona FC",
    league: "La Liga 2025/26",
    price: 2499,
    originalPrice: 3199,
    badge: "OFFICIAL",
    image: "https://images.unsplash.com/photo-1624526267942-ab0ff8a3b972?w=400&h=480&fit=crop",
    href: "/products/barcelona-jersey",
    color: "#A50044",
    soldOut: false,
  },
  {
    team: "Manchester City",
    league: "Premier League 25/26",
    price: 2699,
    originalPrice: 3499,
    badge: "OFFICIAL",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=480&fit=crop",
    href: "/products/man-city-jersey",
    color: "#6CABDD",
    soldOut: true,
  },
];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: "easeOut" },
  }),
};

function discount(price: number, orig: number) {
  return Math.round(((orig - price) / orig) * 100);
}

export function FeaturedJerseysSection() {
  const ref = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  const scrollBy = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <section
      ref={ref}
      className="py-20 sm:py-28 bg-[#FAFAFA]"
      aria-labelledby="featured-jerseys-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="flex flex-wrap items-end justify-between gap-4 mb-10 sm:mb-12"
        >
          <div>
            <p className="sport-label text-xs text-[#FF3B30] mb-2">🏅 Official Licensed Jerseys</p>
            <h2
              id="featured-jerseys-heading"
              className="section-headline text-[clamp(28px,5vw,44px)] text-[#111827]"
            >
              Rep Your Team.
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollBy(-1)}
              disabled={!canScrollLeft}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#111827] hover:border-[#D1D5DB] disabled:opacity-30 transition-all duration-150"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollBy(1)}
              disabled={!canScrollRight}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#111827] hover:border-[#D1D5DB] disabled:opacity-30 transition-all duration-150"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <Link
              href="/products?category=jerseys"
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[#FF3B30] hover:gap-2.5 transition-all duration-200 ml-1"
            >
              All Jerseys <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        {/* Horizontal scroll carousel */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          role="list"
          aria-label="Featured jerseys"
        >
          {JERSEYS.map((jersey, i) => (
            <motion.div
              key={jersey.team}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              role="listitem"
              className="shrink-0 w-[240px] sm:w-[268px]"
            >
              <Link
                href={jersey.href}
                className="card-lift group flex flex-col rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden"
                aria-label={`${jersey.team} — ₹${jersey.price}`}
              >
                {/* Image */}
                <div className="relative h-[280px] sm:h-[300px] overflow-hidden bg-[#F5F5F7]">
                  <img
                    src={jersey.image}
                    alt={jersey.team}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* OFFICIAL chip */}
                  <div className="absolute top-3 left-3 rounded-full bg-[#FF3B30] px-2.5 py-1">
                    <span className="text-[9px] font-black text-white tracking-wider" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {jersey.badge}
                    </span>
                  </div>
                  {/* Discount badge */}
                  <div className="absolute top-3 right-3 rounded-full bg-[#111827] px-2 py-1">
                    <span className="text-[9px] font-bold text-white">
                      -{discount(jersey.price, jersey.originalPrice)}%
                    </span>
                  </div>
                  {/* Sold out overlay */}
                  {jersey.soldOut && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <span className="rounded-xl bg-[#111827] px-4 py-2 text-xs font-bold text-white tracking-wide" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                        SOLD OUT
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1">{jersey.league}</p>
                  <h3 className="font-bold text-[#111827] text-sm leading-tight mb-3" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.05rem" }}>
                    {jersey.team}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-black text-[#111827] tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem" }}>
                        ₹{jersey.price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-[#9CA3AF] line-through tabular-nums">₹{jersey.originalPrice.toLocaleString("en-IN")}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-[#FF3B30] group-hover:gap-2 transition-all duration-150">
                      Shop <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-6 flex justify-center sm:hidden">
          <Link
            href="/products?category=jerseys"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl border-2 border-[#FF3B30] text-sm font-bold text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white transition-all duration-200"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}
          >
            VIEW ALL JERSEYS <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
