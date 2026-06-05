"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Star } from "lucide-react";
import { viralProducts } from "@/data/mock";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);
}

const SOURCE_BADGES = [
  { label: "Instagram Trending", bg: "#E1306C", text: "#FFFFFF", icon: "📸" },
  { label: "Most Purchased", bg: "#059669", text: "#FFFFFF", icon: "🛒" },
  { label: "Staff Picks", bg: "#2563EB", text: "#FFFFFF", icon: "⭐" },
  { label: "Fan Favourite", bg: "#FF3B30", text: "#FFFFFF", icon: "🔥" },
];

export function ViralSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#DC2626] mb-3">
              Seen Everywhere
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
              Going Viral Right Now 🔥
            </h2>
            <p className="mt-2 text-[#6B7280] text-lg max-w-lg">
              Loved by real people, proven by millions — these products are taking over social media.
            </p>
          </div>
          <Link
            href="/products?filter=viral"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#DC2626] hover:text-[#B91C1C] transition-colors duration-150 shrink-0"
          >
            See all viral products
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>

        {/* Source badges */}
        <div className="flex flex-wrap gap-2 mb-8">
          {SOURCE_BADGES.map((b) => (
            <span
              key={b.label}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border border-[#E5E7EB]"
              style={{ background: `${b.bg}10`, color: b.bg === "#000000" ? "#111827" : b.bg }}
            >
              {b.icon} {b.label}
            </span>
          ))}
        </div>

        {/* Featured large + grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Large featured card */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:row-span-2"
          >
            <Link href={`/products/${viralProducts[0].slug}`}>
              <div className="group relative rounded-2xl overflow-hidden bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#D1D5DB] transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] cursor-pointer h-full min-h-[440px]">
                <img
                  src={viralProducts[0].image}
                  alt={viralProducts[0].name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.75)] via-[rgba(0,0,0,0.2)] to-transparent" />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DC2626] px-3 py-1 text-xs font-bold text-white">
                    <TrendingUp className="h-3 w-3" />
                    Going Viral
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-[#111827]">
                    {(viralProducts[0].salesCount! / 1000).toFixed(0)}K+ sold
                  </span>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 inset-x-0 p-6">
                  <div className="flex items-center gap-1 mb-2">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className="h-3.5 w-3.5 text-[#F59E0B]" fill="#F59E0B" />
                    ))}
                    <span className="text-xs text-white/70 ml-1">
                      {viralProducts[0].reviewCount.toLocaleString("en-IN")} reviews
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {viralProducts[0].name}
                  </h3>
                  <p className="text-sm text-white/70 mb-3">{viralProducts[0].tagline}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-extrabold text-white">{formatPrice(viralProducts[0].price)}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/30">
                      View Product <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Smaller cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {viralProducts.slice(1, 5).map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
              >
                <Link href={`/products/${product.slug}`}>
                  <div className="group relative rounded-2xl overflow-hidden bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#D1D5DB] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] cursor-pointer h-48">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.7)] to-transparent" />

                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#DC2626] px-2 py-0.5 text-[10px] font-bold text-white">
                        🔥 Viral
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-xs font-bold text-white line-clamp-1">
                        {product.name}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-extrabold text-white">{formatPrice(product.price)}</span>
                        <span className="text-[10px] text-white/70">
                          {(product.salesCount! / 1000).toFixed(0)}K+ sold
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
