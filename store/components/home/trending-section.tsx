"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { trendingProducts } from "@/data/mock";
import { ProductCard } from "./product-card";

export function TrendingSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (dir: "left" | "right") => {
    if (!trackRef.current) return;
    const amount = 320;
    trackRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    setTimeout(() => {
      if (!trackRef.current) return;
      setCanScrollLeft(trackRef.current.scrollLeft > 0);
      setCanScrollRight(
        trackRef.current.scrollLeft < trackRef.current.scrollWidth - trackRef.current.clientWidth - 10
      );
    }, 350);
  };

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-2">
              What Everyone's Buying
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
              Trending Right Now
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#111827] hover:border-[#D1D5DB] hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#111827] hover:border-[#D1D5DB] hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Link
              href="/products?filter=trending"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors duration-150"
            >
              View All
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* Carousel */}
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {trendingProducts.map((product, i) => (
            <div key={product.id} className="snap-start shrink-0 w-[260px] sm:w-[280px]">
              <ProductCard product={product} index={i} />
            </div>
          ))}
        </div>

        {/* Mobile view all */}
        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/products?filter=trending"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB] border border-[#DBEAFE] bg-[#EFF6FF] rounded-xl px-5 py-2.5"
          >
            View All Trending Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
