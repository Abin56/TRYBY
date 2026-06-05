"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Truck, RotateCcw, ShieldCheck } from "lucide-react";
import type { HeroContent } from "@/lib/content";

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp  = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.46, ease: [0.16, 1, 0.3, 1] as const } },
};

// Static icons for trust strip — not CMS-driven (structural, not editorial)
const TRUST_ICONS = [
  { icon: Truck,       label: "Free Shipping",   sub: "Above ₹499"   },
  { icon: RotateCcw,   label: "Easy Returns",    sub: "7-day policy" },
  { icon: ShieldCheck, label: "Secure Payments", sub: "100% safe"    },
];

export function HeroClient({ content }: { content: HeroContent }) {
  const {
    headline, subheadline, tagline,
    ctaText, ctaUrl, secondaryCtaText, secondaryCtaUrl,
    desktopImageUrl, mobileImageUrl,
    badgeText, showBadge,
  } = content;

  return (
    <section className="w-full overflow-hidden bg-white" aria-label="Hero">

      {/* ══════════ MOBILE <md ══════════ */}
      <div className="md:hidden">
        <div className="relative w-full overflow-hidden" style={{ background: "#f8f8f8" }}>
          <div className="relative w-full overflow-hidden" style={{ height: "clamp(240px, 56vw, 310px)" }}>
            <Image
              src={mobileImageUrl}
              alt={`${headline} — TRYBY Sports`}
              fill priority
              sizes="(max-width: 767px) 100vw, 0px"
              className="object-cover"
              style={{ objectPosition: "50% 4%" }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{
                height: "55%",
                background: "linear-gradient(to bottom, transparent 0%, rgba(248,248,248,0.55) 45%, rgba(248,248,248,0.88) 72%, #f8f8f8 100%)",
              }}
            />
          </div>

          <motion.div
            variants={stagger} initial="hidden" animate="visible"
            className="relative z-10 px-5 pb-6"
            style={{ marginTop: "-28px" }}
          >
            {showBadge && (
              <motion.div variants={fadeUp} className="mb-3">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-black text-[#0D0D0D]"
                  style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", letterSpacing: "0.07em", boxShadow: "0 2px 10px rgba(245,197,24,0.35)" }}
                >
                  🏆 {tagline}
                </span>
              </motion.div>
            )}

            <motion.h1
              variants={fadeUp}
              className="font-black text-[#0D0D0D] leading-[0.88] mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(44px, 12vw, 54px)", letterSpacing: "-0.015em" }}
            >
              {headline.split(".").filter(Boolean).map((part, i, arr) => (
                <span key={i} className="block" style={i === arr.length - 1 ? { color: "#F5C518" } : {}}>
                  {part.trim()}.
                </span>
              ))}
            </motion.h1>

            <motion.p variants={fadeUp} className="mb-5 text-[#555]" style={{ fontSize: "14px", lineHeight: "1.5" }}>
              {subheadline}
            </motion.p>

            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <Link
                href={ctaUrl}
                className="flex-1 inline-flex items-center justify-center font-black rounded-full active:scale-[0.96] transition-transform duration-100"
                style={{ background: "#0D0D0D", color: "#ffffff", height: "50px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px", letterSpacing: "0.05em", boxShadow: "0 4px 16px rgba(13,13,13,0.18)" }}
              >
                {ctaText} →
              </Link>
              <Link
                href={secondaryCtaUrl}
                className="flex-1 inline-flex items-center justify-center font-black rounded-full active:scale-[0.96] transition-transform duration-100"
                style={{ background: "#ffffff", color: "#0D0D0D", border: "1.5px solid #D8D8D8", height: "50px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px", letterSpacing: "0.04em" }}
              >
                {secondaryCtaText}
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Trust row */}
        <div className="flex items-center justify-around px-4 py-3.5 border-t" style={{ borderColor: "#E8E8E8", background: "#ffffff" }}>
          {TRUST_ICONS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0" style={{ color: "#F5C518" }} strokeWidth={2.2} />
              <span className="font-semibold text-[#333] whitespace-nowrap" style={{ fontSize: "12px" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ DESKTOP ≥md ══════════ */}
      <div
        className="hidden md:flex relative w-full overflow-hidden bg-white"
        style={{ minHeight: "440px", maxHeight: "520px", height: "calc(100vh - 64px)" }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(108deg, #ffffff 0%, #ffffff 38%, #f4f6fb 65%, #eaeff8 100%)" }}
        />

        {/* Left content — 42% */}
        <motion.div
          variants={stagger} initial="hidden" animate="visible"
          className="relative z-10 flex flex-col justify-center shrink-0 pl-8 md:pl-10 lg:pl-14 xl:pl-20 pr-6 py-10"
          style={{ width: "42%" }}
        >
          {showBadge && (
            <motion.div variants={fadeUp} className="mb-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-black text-[#0D0D0D]"
                style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", letterSpacing: "0.05em" }}
              >
                🏆 {badgeText || tagline}
              </span>
            </motion.div>
          )}

          <motion.h1
            variants={fadeUp}
            className="font-black leading-[0.91] mb-5 text-[#0D0D0D]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(40px, 5.2vw, 78px)", letterSpacing: "-0.015em" }}
          >
            {headline.split(".").filter(Boolean).map((part, i, arr) => (
              <span key={i} className="block" style={i === arr.length - 1 ? { color: "#F5C518" } : {}}>
                {part.trim()}.
              </span>
            ))}
          </motion.h1>

          <motion.div variants={fadeUp} className="mb-8">
            <p className="text-[#555] leading-relaxed" style={{ fontSize: "clamp(13px, 1.2vw, 16px)" }}>
              {subheadline}
            </p>
            <div className="mt-2 rounded-full" style={{ width: "48px", height: "3px", background: "#F5C518" }} />
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
            <Link href={ctaUrl}>
              <button
                className="inline-flex items-center justify-center font-black rounded-full hover:opacity-88 active:scale-[0.97] transition-all duration-150"
                style={{ background: "#0D0D0D", color: "#ffffff", height: "50px", paddingInline: "32px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", letterSpacing: "0.05em" }}
              >
                {ctaText} →
              </button>
            </Link>
            <Link href={secondaryCtaUrl}>
              <button
                className="inline-flex items-center justify-center font-black rounded-full border hover:bg-[#f5f5f5] active:scale-[0.97] transition-all duration-150"
                style={{ background: "#ffffff", color: "#0D0D0D", borderColor: "#D4D4D4", height: "50px", paddingInline: "28px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", letterSpacing: "0.05em" }}
              >
                {secondaryCtaText}
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Right image — 58% */}
        <div className="flex-1 relative overflow-hidden">
          <Image
            src={desktopImageUrl}
            alt={`${headline} — TRYBY Sports`}
            fill priority
            sizes="(min-width: 1280px) 58vw, (min-width: 768px) 60vw"
            className="object-cover"
            style={{ objectPosition: "50% 5%" }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.7) 8%, rgba(255,255,255,0.15) 22%, transparent 40%)" }}
          />

          {/* Trust cards — lg+ only */}
          <div className="hidden lg:flex absolute right-5 bottom-5 flex-col gap-2.5" style={{ width: "188px" }}>
            {TRUST_ICONS.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.45, ease: "easeOut" }}
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 bg-white"
                style={{ boxShadow: "0 4px 18px rgba(0,0,0,0.11), 0 1px 3px rgba(0,0,0,0.06)" }}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: "#F5C518" }}>
                  <card.icon className="h-[16px] w-[16px] text-[#0D0D0D]" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#0D0D0D] leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12.5px", letterSpacing: "0.01em" }}>
                    {card.label}
                  </p>
                  <p className="text-[#888] leading-tight mt-0.5" style={{ fontSize: "10.5px" }}>{card.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
