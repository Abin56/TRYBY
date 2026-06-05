"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { problemSolvers } from "@/data/mock";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);
}

export function ProblemSolversSection() {
  return (
    <section className="py-24 bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-3">
            Actually Useful
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight mb-4">
            Products That Fix Real Problems
          </h2>
          <p className="text-[#6B7280] text-lg max-w-xl mx-auto">
            Not just pretty things — things that actually work and make your daily life noticeably better.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {problemSolvers.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
            >
              <Link href={`/products/${item.product.slug}`}>
                <div className="group relative rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden hover:border-[#D1D5DB] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] cursor-pointer">
                  {/* Top accent bar */}
                  <div
                    className="h-1 w-full"
                    style={{ background: item.accentColor, opacity: 0.7 }}
                  />

                  <div className="p-6">
                    {/* Problem */}
                    <div className="flex items-start gap-3 mb-5">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                        style={{ background: `${item.accentColor}14` }}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: item.accentColor }}>
                          The Problem
                        </p>
                        <p className="text-sm font-semibold text-[#111827] leading-snug">
                          {item.problem}
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex-1 h-px bg-[#F3F4F6]" />
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                        style={{ background: `${item.accentColor}15`, color: item.accentColor }}
                      >
                        ↓
                      </div>
                      <div className="flex-1 h-px bg-[#F3F4F6]" />
                    </div>

                    {/* Solution */}
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 bg-[#F9FAFB] border border-[#E5E7EB]">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#059669] mb-1">
                          The Fix →
                        </p>
                        <p className="text-sm font-bold text-[#111827] leading-snug truncate">
                          {item.product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold" style={{ color: item.accentColor }}>
                            {formatPrice(item.product.price)}
                          </span>
                          {item.product.compareAtPrice && (
                            <span className="text-xs text-[#9CA3AF] line-through">
                              {formatPrice(item.product.compareAtPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#D1D5DB] group-hover:text-[#111827] group-hover:translate-x-1 transition-all duration-200 shrink-0" />
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
