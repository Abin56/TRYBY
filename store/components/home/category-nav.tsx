"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

/* ── SVG outline icons — matches Figma line-art style ─────────── */

function IconJersey() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7l4-3h10l4 3-3 3v10H6V10L3 7z" />
      <path d="M9 4c0 1.657 1.343 3 3 3s3-1.343 3-3" />
    </svg>
  );
}

function IconFootball() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c0 0-2 3-2 9s2 9 2 9" />
      <path d="M3 12h18" />
      <path d="M5.5 6.5L12 9l6.5-2.5" />
      <path d="M5.5 17.5L12 15l6.5 2.5" />
    </svg>
  );
}

function IconCricket() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="10" y="2" width="4" height="14" rx="1" />
      <path d="M10 16l-6 5" />
      <path d="M14 16l6 5" />
      <circle cx="12" cy="20" r="1.5" />
    </svg>
  );
}

function IconGym() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12" />
    </svg>
  );
}

function IconRunning() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="14" cy="4" r="1.5" />
      <path d="M9 18l2-5 3 3 2-4" />
      <path d="M6 21l3-3 2 2 3-6 3 2" />
      <path d="M13 9l-2 4-3-1-2 3" />
    </svg>
  );
}

function IconAccessories() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h12l2 6H4L6 3z" />
      <path d="M4 9c0 5 2 10 8 12 6-2 8-7 8-12" />
      <path d="M12 9v12" />
    </svg>
  );
}

function IconCycling() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="16" r="3.5" />
      <circle cx="18" cy="16" r="3.5" />
      <path d="M6 16l4-8h4l2 8" />
      <path d="M10 8l4 8" />
      <circle cx="13" cy="5" r="1.2" />
    </svg>
  );
}

function IconSale() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <text x="12" y="16.5" textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor" stroke="none">%</text>
    </svg>
  );
}

/* ── Category data ─────────────────────────────────────────────── */

const CHIPS = [
  { slug: "jerseys",       label: "Jerseys",       href: "/products?category=jerseys",      Icon: IconJersey,      saleBadge: false },
  { slug: "football",      label: "Football",      href: "/products?sport=football",         Icon: IconFootball,    saleBadge: false },
  { slug: "cricket",       label: "Cricket",       href: "/products?sport=cricket",          Icon: IconCricket,     saleBadge: false },
  { slug: "gym-fitness",   label: "Gym & Fitness", href: "/products?sport=gym",              Icon: IconGym,         saleBadge: false },
  { slug: "running",       label: "Running",       href: "/products?sport=running",          Icon: IconRunning,     saleBadge: false },
  { slug: "accessories",   label: "Accessories",   href: "/products?category=accessories",   Icon: IconAccessories, saleBadge: false },
  { slug: "cycling",       label: "Cycling",       href: "/products?sport=cycling",          Icon: IconCycling,     saleBadge: false },
  { slug: "deals",         label: "Sale",          href: "/products?filter=sale",            Icon: IconSale,        saleBadge: true  },
];

/* ── Component ─────────────────────────────────────────────────── */

export function CategoryNavSection() {
  return (
    <section
      className="bg-white border-b border-[#EFEFEF]"
      aria-label="Shop by category"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-stretch gap-0">

          {/* ── Chip strip ────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 py-4">
            {/* Desktop: single non-wrapping row */}
            <div className="hidden sm:flex items-center gap-2 overflow-x-auto scrollbar-hide flex-nowrap">
              {CHIPS.map((chip, i) => (
                <motion.div
                  key={chip.slug}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
                >
                  <CategoryChip chip={chip} />
                </motion.div>
              ))}
            </div>

            {/* Mobile: horizontal scroll with snap + right fade hint */}
            <div className="sm:hidden relative">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
                {CHIPS.map((chip) => (
                  <div key={chip.slug} className="flex-none snap-start">
                    <CategoryChip chip={chip} />
                  </div>
                ))}
                {/* Spacer so last item isn't hidden under fade */}
                <div className="flex-none w-4 shrink-0" aria-hidden="true" />
              </div>
              {/* Right fade — signals scrollability */}
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-10"
                style={{ background: "linear-gradient(to right, transparent, #ffffff)" }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* ── Divider ───────────────────────────────────────────── */}
          <div
            className="hidden lg:block w-px self-stretch my-3 mx-3 shrink-0"
            style={{ background: "#EFEFEF" }}
            aria-hidden="true"
          />

          {/* ── New Arrivals promo card ────────────────────────────── */}
          <div className="hidden lg:flex items-center shrink-0 py-3" style={{ width: "220px" }}>
            <Link href="/products?filter=new" className="group block w-full h-full rounded-2xl overflow-hidden relative">
              <div
                className="relative w-full h-full rounded-2xl overflow-hidden flex flex-col justify-end p-4"
                style={{
                  background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                  minHeight: "110px",
                }}
              >
                {/* Athlete image */}
                <img
                  src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop&crop=top"
                  alt="New arrivals"
                  className="absolute inset-0 w-full h-full object-cover object-top opacity-40 group-hover:opacity-50 transition-opacity duration-300"
                  loading="lazy"
                />

                {/* Dark gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%)" }}
                  aria-hidden="true"
                />

                {/* Text */}
                <div className="relative z-10">
                  <p
                    className="text-white font-bold text-[13px] leading-tight mb-0.5"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}
                  >
                    New Arrivals
                  </p>
                  <p
                    className="leading-tight mb-3"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "18px",
                      fontWeight: 800,
                      fontStyle: "italic",
                      color: "#F5C518",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Just In!
                  </p>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-[#0D0D0D] transition-all duration-200 group-hover:brightness-110"
                    style={{
                      background: "#F5C518",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Explore Now
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ── Chip sub-component ─────────────────────────────────────────── */

function CategoryChip({ chip }: { chip: typeof CHIPS[number] }) {
  return (
    <Link
      href={chip.href}
      className="group flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl bg-white border border-[#E8E8E8] hover:border-[#0D0D0D] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-150 relative"
      style={{ minWidth: "72px", minHeight: "72px" }}
    >
      {/* Sale badge — red circle on icon */}
      {chip.saleBadge && (
        <span
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black text-white"
          style={{ background: "#E53E3E" }}
          aria-label="Sale"
        >
          %
        </span>
      )}

      {/* Icon */}
      <span className="text-[#555] group-hover:text-[#0D0D0D] transition-colors duration-150">
        <chip.Icon />
      </span>

      {/* Label */}
      <span
        className="text-[11px] font-semibold text-[#444] group-hover:text-[#0D0D0D] whitespace-nowrap transition-colors duration-150 leading-none"
        style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.03em" }}
      >
        {chip.label}
      </span>
    </Link>
  );
}
