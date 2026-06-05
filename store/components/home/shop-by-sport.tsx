"use client";

import { motion, useInView, type Variants } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

const SPORTS = [
  {
    emoji: "🏏",
    label: "Cricket",
    count: "124 products",
    href: "/products?sport=cricket",
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&h=400&fit=crop",
    color: "#4CAF50",
    tag: "cricket",
  },
  {
    emoji: "⚽",
    label: "Football",
    count: "98 products",
    href: "/products?sport=football",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop",
    color: "#2196F3",
    tag: "football",
  },
  {
    emoji: "💪",
    label: "Gym & Fitness",
    count: "87 products",
    href: "/products?sport=gym",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop",
    color: "#FF3B30",
    tag: "gym",
  },
  {
    emoji: "🏃",
    label: "Running",
    count: "56 products",
    href: "/products?sport=running",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=400&fit=crop",
    color: "#FF9800",
    tag: "running",
  },
  {
    emoji: "🏸",
    label: "Racket Sports",
    count: "41 products",
    href: "/products?sport=badminton",
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&h=400&fit=crop",
    color: "#9C27B0",
    tag: "badminton",
  },
  {
    emoji: "🥊",
    label: "Combat Sports",
    count: "33 products",
    href: "/products?sport=combat",
    image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&h=400&fit=crop",
    color: "#FF5722",
    tag: "combat",
  },
];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export function ShopBySportSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-white" aria-labelledby="shop-by-sport-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="mb-10 sm:mb-14"
        >
          <p className="sport-label text-xs text-[#FF3B30] mb-2">Find Your Sport</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2
              id="shop-by-sport-heading"
              className="section-headline text-[clamp(28px,5vw,44px)] text-[#111827]"
            >
              Shop by Sport
            </h2>
            <Link
              href="/products"
              className="flex items-center gap-1.5 text-sm font-semibold text-[#FF3B30] hover:gap-2.5 transition-all duration-200"
            >
              View all sports <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        {/* Grid: 3×2 desktop, 2×3 mobile */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        >
          {SPORTS.map((sport) => (
            <motion.div key={sport.label} variants={card}>
              <Link
                href={sport.href}
                className="sport-card group relative block rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer"
                aria-label={`${sport.label} — ${sport.count}`}
              >
                {/* Background image */}
                <div className="absolute inset-0">
                  <img
                    src={sport.image}
                    alt={sport.label}
                    className="sport-card-img w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000]/75 via-[#000]/25 to-transparent group-hover:from-[#000]/65 transition-all duration-500" />
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  {/* Sport tag */}
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white mb-2"
                    style={{ backgroundColor: `${sport.color}CC` }}
                  >
                    {sport.emoji} {sport.tag}
                  </span>

                  {/* Name + count */}
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <h3
                        className="text-[clamp(16px,2.5vw,22px)] font-bold text-white leading-tight"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        {sport.label}
                      </h3>
                      <p className="text-xs text-white/70 mt-0.5">{sport.count}</p>
                    </div>

                    {/* Explore CTA — slides up on hover */}
                    <motion.span
                      className="flex items-center gap-1 text-xs font-semibold text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shrink-0"
                    >
                      Explore <ArrowRight className="h-3 w-3" />
                    </motion.span>
                  </div>
                </div>

                {/* Hover border glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 0 2px ${sport.color}80` }}
                />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
