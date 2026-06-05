"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, Heart, ShoppingCart, Star, Flame, TrendingUp } from "lucide-react";
import { useCartStore } from "@/store/cart";

type JerseyFilter = "all" | "football" | "cricket" | "ipl";

const FILTERS: { key: JerseyFilter; label: string }[] = [
  { key: "all",      label: "All Jerseys" },
  { key: "football", label: "⚽ Football" },
  { key: "cricket",  label: "🏏 Cricket" },
  { key: "ipl",      label: "🏟️ IPL" },
];

const JERSEYS = [
  {
    id: "tj-1",
    name: "Real Madrid Home Jersey 2025/26",
    team: "Real Madrid",
    badge: "🏆 La Liga",
    badgeColor: "#FFD700",
    badgeTextColor: "#111827",
    sport: "football" as JerseyFilter,
    price: 2499,
    comparePrice: 3199,
    rating: 4.9,
    reviewCount: 1247,
    soldToday: 38,
    image: "https://images.unsplash.com/photo-1614632537423-1e6c2317a90e?w=500&h=560&fit=crop&crop=center",
    hoverImage: "https://images.unsplash.com/photo-1580087256394-dc596e1c8f4f?w=500&h=560&fit=crop",
    href: "/products/real-madrid-home-jersey",
    tag: "BESTSELLER",
    tagColor: "#FF3B30",
  },
  {
    id: "tj-2",
    name: "FC Barcelona Home Jersey 2025/26",
    team: "Barcelona",
    badge: "🏆 La Liga",
    badgeColor: "#A50044",
    badgeTextColor: "#ffffff",
    sport: "football" as JerseyFilter,
    price: 2499,
    comparePrice: 3199,
    rating: 4.8,
    reviewCount: 934,
    soldToday: 27,
    image: "https://images.unsplash.com/photo-1624526267942-ab0ff8a3b972?w=500&h=560&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1556906781-9a412961a28c?w=500&h=560&fit=crop",
    href: "/products/barcelona-home-jersey",
    tag: "NEW",
    tagColor: "#059669",
  },
  {
    id: "tj-3",
    name: "Manchester United Home Jersey",
    team: "Man United",
    badge: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League",
    badgeColor: "#DA291C",
    badgeTextColor: "#ffffff",
    sport: "football" as JerseyFilter,
    price: 2699,
    comparePrice: 3499,
    rating: 4.7,
    reviewCount: 812,
    soldToday: 19,
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&h=560&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=560&fit=crop",
    href: "/products/manchester-united-jersey",
    tag: "HOT",
    tagColor: "#FF3B30",
  },
  {
    id: "tj-4",
    name: "Arsenal Home Jersey 2025/26",
    team: "Arsenal",
    badge: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League",
    badgeColor: "#EF0107",
    badgeTextColor: "#ffffff",
    sport: "football" as JerseyFilter,
    price: 2599,
    comparePrice: 3299,
    rating: 4.7,
    reviewCount: 631,
    soldToday: 22,
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500&h=560&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=560&fit=crop",
    href: "/products/arsenal-home-jersey",
    tag: "TRENDING",
    tagColor: "#7C3AED",
  },
  {
    id: "tj-5",
    name: "India Cricket Jersey — Test Edition",
    team: "India Cricket",
    badge: "🏏 BCCI Official",
    badgeColor: "#002868",
    badgeTextColor: "#FFD700",
    sport: "cricket" as JerseyFilter,
    price: 1499,
    comparePrice: 1999,
    rating: 4.9,
    reviewCount: 2104,
    soldToday: 61,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=560&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1599586120429-48281b6f0ece?w=500&h=560&fit=crop",
    href: "/products/india-cricket-jersey",
    tag: "BESTSELLER",
    tagColor: "#FF3B30",
  },
  {
    id: "tj-6",
    name: "Chennai Super Kings IPL 2026",
    team: "CSK",
    badge: "🏟️ IPL 2026",
    badgeColor: "#F9CD05",
    badgeTextColor: "#111827",
    sport: "ipl" as JerseyFilter,
    price: 1299,
    comparePrice: 1799,
    rating: 4.8,
    reviewCount: 1876,
    soldToday: 74,
    image: "https://images.unsplash.com/photo-1614632537423-1e6c2317a90e?w=500&h=560&fit=crop&crop=top",
    hoverImage: "https://images.unsplash.com/photo-1580087256394-dc596e1c8f4f?w=500&h=560&fit=crop",
    href: "/products/csk-jersey-2026",
    tag: "HOT",
    tagColor: "#FF3B30",
  },
  {
    id: "tj-7",
    name: "Royal Challengers Bengaluru IPL 2026",
    team: "RCB",
    badge: "🏟️ IPL 2026",
    badgeColor: "#D31B23",
    badgeTextColor: "#ffffff",
    sport: "ipl" as JerseyFilter,
    price: 1199,
    comparePrice: 1599,
    rating: 4.7,
    reviewCount: 1543,
    soldToday: 56,
    image: "https://images.unsplash.com/photo-1556906781-9a412961a28c?w=500&h=560&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1624526267942-ab0ff8a3b972?w=500&h=560&fit=crop",
    href: "/products/rcb-jersey-2026",
    tag: "TRENDING",
    tagColor: "#7C3AED",
  },
  {
    id: "tj-8",
    name: "Mumbai Indians IPL 2026",
    team: "MI",
    badge: "🏟️ IPL 2026",
    badgeColor: "#004BA0",
    badgeTextColor: "#FFD700",
    sport: "ipl" as JerseyFilter,
    price: 1299,
    comparePrice: 1799,
    rating: 4.8,
    reviewCount: 2031,
    soldToday: 83,
    image: "https://images.unsplash.com/photo-1580087256394-dc596e1c8f4f?w=500&h=560&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&h=560&fit=crop",
    href: "/products/mi-jersey-2026",
    tag: "BESTSELLER",
    tagColor: "#FF3B30",
  },
];

function JerseyCard({ jersey, index }: { jersey: typeof JERSEYS[0]; index: number }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCartStore();

  const discountPct = Math.round(((jersey.comparePrice - jersey.price) / jersey.comparePrice) * 100);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: jersey.id,
      name: jersey.name,
      price: jersey.price,
      image: jersey.image,
      slug: jersey.href.replace("/products/", ""),
      category: jersey.sport,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      layout
    >
      <Link href={jersey.href}>
        <div
          className="group relative flex flex-col rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden cursor-pointer"
          style={{
            boxShadow: hovered
              ? "0 16px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)"
              : "0 1px 4px rgba(0,0,0,0.06)",
            transform: hovered ? "translateY(-5px)" : "translateY(0)",
            transition: "transform 0.28s cubic-bezier(0.16,1,0.3,1), box-shadow 0.28s cubic-bezier(0.16,1,0.3,1)",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Image area */}
          <div className="relative overflow-hidden bg-[#F5F5F7]" style={{ aspectRatio: "4/5" }}>
            {/* Main image */}
            <img
              src={jersey.image}
              alt={jersey.name}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
              style={{
                opacity: hovered ? 0 : 1,
                transform: hovered ? "scale(1.07)" : "scale(1)",
              }}
              loading="lazy"
            />
            {/* Hover image */}
            <img
              src={jersey.hoverImage}
              alt={jersey.name}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
              style={{
                opacity: hovered ? 1 : 0,
                transform: hovered ? "scale(1)" : "scale(1.07)",
              }}
              loading="lazy"
            />

            {/* Top-left: discount badge */}
            <div className="absolute top-3 left-3 z-10 rounded-full bg-[#FF3B30] px-2.5 py-1 shadow-sm">
              <span className="text-[10px] font-black text-white tracking-wide">-{discountPct}%</span>
            </div>

            {/* Top-right: product tag (BESTSELLER / NEW / HOT / TRENDING) */}
            <div
              className="absolute top-3 right-3 z-10 rounded-full px-2.5 py-1 shadow-sm"
              style={{ backgroundColor: jersey.tagColor }}
            >
              <span className="text-[9px] font-black text-white tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {jersey.tag}
              </span>
            </div>

            {/* Bottom-left: team badge */}
            <div
              className="absolute bottom-3 left-3 z-10 rounded-full px-2.5 py-1 shadow-sm"
              style={{ backgroundColor: jersey.badgeColor }}
            >
              <span className="text-[9px] font-bold tracking-wide"
                style={{ color: jersey.badgeTextColor, fontFamily: "'Barlow Condensed', sans-serif" }}>
                {jersey.badge}
              </span>
            </div>

            {/* Sold today badge */}
            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] px-2 py-1">
              <Flame className="h-2.5 w-2.5 text-[#FF3B30]" />
              <span className="text-[9px] font-bold text-[#92400E]">{jersey.soldToday} today</span>
            </div>

            {/* Wishlist button — always visible on mobile, hover on desktop */}
            <button
              onClick={(e) => {
                e.preventDefault();
                setWishlisted((w) => !w);
              }}
              className="absolute top-10 right-3 z-20 mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm
                         opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 transition-all duration-150"
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className="h-3.5 w-3.5 transition-colors duration-150"
                fill={wishlisted ? "#FF3B30" : "none"}
                stroke={wishlisted ? "#FF3B30" : "#6B7280"}
              />
            </button>

            {/* Add to Cart — slides up on hover */}
            <div
              className="absolute bottom-0 inset-x-0 z-10 transition-all duration-250"
              style={{
                transform: hovered ? "translateY(0)" : "translateY(100%)",
                opacity: hovered ? 1 : 0,
                transition: "transform 0.22s cubic-bezier(0.16,1,0.3,1), opacity 0.18s ease",
              }}
            >
              <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors duration-150"
                style={{
                  backgroundColor: addedToCart ? "#059669" : "#111827",
                  color: "#ffffff",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: "0.06em",
                }}
              >
                {addedToCart ? (
                  <>✓ ADDED TO CART</>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    ADD TO CART
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-2 p-3.5">
            {/* Team name chip */}
            <p className="text-[10px] font-black text-[#FF3B30] uppercase tracking-widest"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {jersey.team}
            </p>

            {/* Jersey name */}
            <h3 className="text-sm font-semibold text-[#111827] leading-snug line-clamp-2
                           group-hover:text-[#FF3B30] transition-colors duration-150">
              {jersey.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="h-3 w-3"
                    fill={s <= Math.round(jersey.rating) ? "#FFB800" : "none"}
                    stroke={s <= Math.round(jersey.rating) ? "#FFB800" : "#D1D5DB"}
                  />
                ))}
              </div>
              <span className="text-xs text-[#6B7280]">
                {jersey.rating} ({jersey.reviewCount.toLocaleString("en-IN")})
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between mt-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black text-[#111827] tabular-nums"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ₹{jersey.price.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-[#9CA3AF] line-through tabular-nums">
                  ₹{jersey.comparePrice.toLocaleString("en-IN")}
                </span>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-[#FF3B30]
                               group-hover:gap-2 transition-all duration-150">
                Shop <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function TrendingJerseysSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [activeFilter, setActiveFilter] = useState<JerseyFilter>("all");

  const filtered = activeFilter === "all"
    ? JERSEYS
    : JERSEYS.filter((j) => j.sport === activeFilter);

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-[#FAFAFA]" aria-labelledby="trending-jerseys-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="flex flex-wrap items-end justify-between gap-4 mb-8 sm:mb-10"
        >
          <div>
            <p className="sport-label text-xs text-[#FF3B30] mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Trending This Week
            </p>
            <h2
              id="trending-jerseys-heading"
              className="section-headline text-[clamp(28px,5vw,44px)] text-[#111827]"
            >
              Trending Jerseys.
            </h2>
          </div>
          <Link
            href="/products?category=jerseys&filter=trending"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[#FF3B30] hover:gap-2.5 transition-all duration-200"
          >
            All Jerseys <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="flex gap-2 flex-wrap mb-8"
          role="tablist"
          aria-label="Filter jerseys by sport"
        >
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              role="tab"
              aria-selected={activeFilter === f.key}
              className="relative h-9 px-4 rounded-full text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: activeFilter === f.key ? "#FF3B30" : "#F3F4F6",
                color: activeFilter === f.key ? "#ffffff" : "#374151",
                boxShadow: activeFilter === f.key ? "0 2px 8px rgba(255,59,48,0.3)" : "none",
              }}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        {/* Product grid */}
        <motion.div
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((jersey, i) => (
              <JerseyCard key={jersey.id} jersey={jersey} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* View all — mobile + desktop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          className="mt-10 flex justify-center"
        >
          <Link
            href="/products?category=jerseys&filter=trending"
            className="inline-flex items-center gap-2 h-11 px-7 rounded-xl border-2 border-[#FF3B30] text-sm font-bold text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white transition-all duration-200"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}
          >
            VIEW ALL JERSEYS <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
