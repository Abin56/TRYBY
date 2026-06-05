"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const COLLECTIONS = [
  {
    slug: "club-jerseys",
    title: "Club Jerseys",
    description: "Authentic kits from the world's biggest clubs. Match-ready quality, delivered fast.",
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80",
    accent: "#1D4ED8",
    tag: "Most Popular",
    count: "120+ Styles",
    urgency: null,
  },
  {
    slug: "national-team-jerseys",
    title: "National Team Jerseys",
    description: "Rep your nation. Official national team kits for every major tournament.",
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80",
    accent: "#DC2626",
    tag: "New Arrivals",
    count: "60+ Kits",
    urgency: null,
  },
  {
    slug: "retro-collection",
    title: "Retro Collection",
    description: "Classic cuts. Legendary designs. Vintage jerseys that never go out of style.",
    image: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80",
    accent: "#D97706",
    tag: "Fan Favourite",
    count: "80+ Designs",
    urgency: null,
  },
  {
    slug: "new-season-collection",
    title: "New Season Collection",
    description: "This season's freshest drops. Be the first to wear the latest kits.",
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80",
    accent: "#059669",
    tag: "Just Dropped",
    count: "40+ New Kits",
    urgency: "Selling fast — limited stock",
  },
];

export function FeaturedCollectionsSection() {
  return (
    <section className="py-20 bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-2">
              Shop by Collection
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
              Featured Collections
            </h2>
            <p className="mt-2 text-[#6B7280] text-base max-w-md">
              Curated drops for every type of fan — from the terraces to the training ground.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors duration-150 shrink-0"
          >
            Browse All
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>

        {/*
          Mobile: first card full-width hero, rest in 2-col grid.
          Desktop: symmetric 2×2 grid.
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {COLLECTIONS.map((col, i) => (
            <motion.div
              key={col.slug}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: "easeOut" }}
              /* First card spans full width on mobile only */
              className={i === 0 ? "col-span-1 sm:col-span-1" : ""}
            >
              <Link href={`/products?collection=${col.slug}`} className="group block h-full">
                <div
                  className={`relative rounded-2xl overflow-hidden bg-[#111827] ${
                    i === 0
                      ? "aspect-[4/3] sm:aspect-[16/10]"
                      : "aspect-[4/3] sm:aspect-[16/10]"
                  }`}
                >
                  {/* Background image */}
                  <img
                    src={col.image}
                    alt={col.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-55 group-hover:scale-105 transition-all duration-700 ease-out"
                  />

                  {/* Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.85)] via-[rgba(0,0,0,0.25)] to-transparent" />

                  {/* Top row: tag + count */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white"
                      style={{ backgroundColor: col.accent }}
                    >
                      {col.tag}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-black/40 backdrop-blur-sm border border-white/20 px-2.5 py-1 text-xs font-semibold text-white/90">
                      {col.count}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6">
                    <h3 className="text-xl font-extrabold text-white tracking-tight mb-1 leading-tight">
                      {col.title}
                    </h3>
                    <p className="text-sm text-white/65 mb-4 max-w-xs leading-relaxed">
                      {col.description}
                    </p>

                    <div className="flex items-center gap-3">
                      {/* Explore CTA — solid on hover for mobile tap affordance */}
                      <span className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white border border-white/40 bg-white/15 backdrop-blur-sm group-hover:bg-white group-hover:text-[#111827] group-hover:border-white transition-all duration-200">
                        Explore
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                      </span>

                      {/* Urgency nudge */}
                      {col.urgency && (
                        <span className="text-xs font-semibold text-[#FCD34D]">
                          ⚡ {col.urgency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
