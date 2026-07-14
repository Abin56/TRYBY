"use client";

import { motion } from "framer-motion";
import { Zap, ArrowRight, ShieldCheck, TrendingUp } from "lucide-react";
import Link from "next/link";

export function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-white pt-16 pb-24 sm:pt-20 sm:pb-32">
      {/* Background dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #E5E7EB 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.6,
        }}
        aria-hidden="true"
      />

      {/* Red glow accent */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 70% 20%, rgba(255,59,48,0.08) 0%, transparent 65%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-2 mb-6"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FF3B30]">
              <Zap className="h-3.5 w-3.5 text-white" fill="white" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#FF3B30]">
              About TRYBY Sports
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="font-display font-extrabold uppercase tracking-tight text-[#111827] leading-[0.92] text-5xl sm:text-6xl lg:text-7xl mb-6"
          >
            Building India&apos;s{" "}
            <span
              className="block"
              style={{
                background: "linear-gradient(135deg, #FF3B30 0%, #FFB800 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              #1 Sports
            </span>
            Commerce Platform.
          </motion.h1>

          {/* Body */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-lg sm:text-xl text-[#6B7280] leading-relaxed max-w-2xl mb-10"
          >
            TRYBY Sports is a premium sports commerce platform connecting passionate
            athletes across India with official licensed gear, performance equipment,
            and branded sportswear. We are not a marketplace — we are a curated sports
            destination built for the serious buyer.
          </motion.p>

          {/* Trust chips */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="flex flex-wrap items-center gap-3 mb-10"
          >
            {[
              { icon: ShieldCheck, label: "Official Licensed Products", color: "#059669", bg: "#F0FDF4", border: "#BBF7D0" },
              { icon: TrendingUp, label: "Pan-India Delivery", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
              { icon: Zap, label: "Founded 2026", color: "#FF3B30", bg: "#FFF5F4", border: "#FECACA" },
            ].map(({ icon: Icon, label, color, bg, border }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{ background: bg, borderColor: border, color }}
              >
                <Icon className="h-3 w-3" />
                {label}
              </span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link
              href="/supplier/apply"
              className="shimmer-btn inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF3B30] px-6 py-3 text-sm font-bold text-white uppercase tracking-wide shadow-[0_2px_8px_rgba(255,59,48,0.35)] hover:bg-[#E5352B] hover:shadow-[0_4px_16px_rgba(255,59,48,0.45)] hover:-translate-y-0.5 transition-all duration-150"
            >
              Become a Supplier
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-6 py-3 text-sm font-semibold text-[#374151] hover:border-[#D1D5DB] hover:bg-[#F9FAFB] transition-all duration-150"
            >
              Contact Us
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
