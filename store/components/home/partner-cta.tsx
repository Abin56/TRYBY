"use client";

import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";

const PERKS = [
  "Zero upfront listing fees",
  "Access to 50,000+ verified buyers",
  "Real-time inventory management",
  "Official certification badge on listings",
  "Dedicated supplier support team",
  "Fast payment settlements",
];

export function PartnerWithTRYBYSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-[#111827]" aria-labelledby="partner-cta-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <p className="sport-label text-xs text-[#FF3B30] mb-4">For Sports Brands & Suppliers</p>
            <h2
              id="partner-cta-heading"
              className="section-headline text-[clamp(28px,5vw,48px)] text-white mb-5"
            >
              Partner With TRYBY.{" "}
              <span
                className="inline-block"
                style={{
                  background: "linear-gradient(135deg, #FF3B30 0%, #FFB800 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Sell More.
              </span>
            </h2>
            <p className="text-[#A0A0A0] text-base leading-relaxed max-w-xl mb-8">
              Join India&apos;s fastest-growing sports marketplace. List your gear, reach sport buyers,
              and grow your brand with zero risk.
            </p>

            {/* Perks list */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-9">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-2.5">
                  <CheckCircle className="h-4 w-4 text-[#4CAF50] shrink-0" />
                  <span className="text-sm text-[#D1D5DB]">{perk}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/supplier/apply"
                className="shimmer-btn inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-[#FF3B30] text-white text-sm font-bold hover:bg-[#E5352B] transition-colors duration-150 shadow-[0_4px_16px_rgba(255,59,48,0.4)]"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.95rem", letterSpacing: "0.06em" }}
              >
                APPLY AS SUPPLIER <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/supplier/learn-more"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl border border-[#374151] text-sm font-bold text-[#D1D5DB] hover:border-[#6B7280] hover:text-white transition-all duration-200"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.95rem", letterSpacing: "0.06em" }}
              >
                LEARN MORE
              </Link>
            </div>
          </motion.div>

          {/* Right: stats cards */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.1, ease: "easeOut" }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { value: "50K+", label: "Active Buyers", sub: "Verified sports enthusiasts", emoji: "🏅" },
              { value: "2-5",  label: "Days Delivery", sub: "Pan-India coverage", emoji: "🚚" },
              { value: "₹0",   label: "Listing Fee",   sub: "Pay only when you sell", emoji: "💰" },
              { value: "98%",  label: "Payout Rate",   sub: "On-time every cycle", emoji: "✅" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.07 }}
                className="rounded-2xl border border-[#1F2937] bg-[#0F0F0F] p-5"
              >
                <div className="text-2xl mb-2">{stat.emoji}</div>
                <div
                  className="text-3xl font-black text-white mb-1"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {stat.value}
                </div>
                <p className="text-sm font-bold text-[#D1D5DB]">{stat.label}</p>
                <p className="text-xs text-[#606060] mt-0.5">{stat.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
