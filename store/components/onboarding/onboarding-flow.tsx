"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";

/* ── Screen data ─────────────────────────────────────────────────── */

const SCREENS = [
  {
    id: 1,
    headline: ["GEAR UP.", "PLAY YOUR BEST."],
    sub: "Premium Jerseys & Sports Essentials\nfor Athletes and Fans Across India.",
    visual: "athletes",
    cta: "Continue →",
    ctaHref: null,
  },
  {
    id: 2,
    headline: ["OFFICIAL JERSEYS.", "REAL PASSION."],
    sub: null,
    bullets: [
      { emoji: "⚽", label: "Football Clubs" },
      { emoji: "🏏", label: "Cricket Teams" },
      { emoji: "🇮🇳", label: "National Jerseys" },
      { emoji: "🕹️", label: "Retro Collections" },
    ],
    visual: "jerseys",
    cta: "Next →",
    ctaHref: null,
  },
  {
    id: 3,
    headline: ["FAST DELIVERY.", "TRUSTED QUALITY."],
    sub: null,
    bullets: [
      { emoji: "🚚", label: "Fast Shipping" },
      { emoji: "↩️", label: "Easy Returns" },
      { emoji: "🔒", label: "Secure Payments" },
      { emoji: "✅", label: "Quality Checked" },
    ],
    visual: "trust",
    cta: "Next →",
    ctaHref: null,
  },
  {
    id: 4,
    headline: ["READY TO PLAY?"],
    sub: "Join thousands of sports fans\nshopping premium jerseys.",
    visual: "logo",
    cta: "Start Shopping",
    ctaHref: "/products",
  },
] as const;

type ScreenId = (typeof SCREENS)[number]["id"];

/* ── Framer Motion variants ──────────────────────────────────────── */

const screenVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

const contentVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

/* ── Sub-components ──────────────────────────────────────────────── */

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i + 1 === current ? 24 : 8,
            backgroundColor: i + 1 === current ? "#F5C518" : "rgba(13,13,13,0.18)",
          }}
          transition={{ duration: 0.3 }}
          className="h-2 rounded-full"
        />
      ))}
      <span
        className="ml-2 text-xs font-semibold tabular-nums"
        style={{ color: "rgba(13,13,13,0.38)", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px" }}
        aria-hidden="true"
      >
        {current} / {total}
      </span>
    </div>
  );
}

/* ── Visual panels ───────────────────────────────────────────────── */

function AthletesVisual() {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-[#0D0D0D]">
      {/* Atmospheric gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(245,197,24,0.12) 0%, #0D0D0D 50%, rgba(26,26,46,0.9) 100%)",
        }}
        aria-hidden="true"
      />
      {/* Football outline watermark */}
      <svg
        className="absolute -right-8 -bottom-8 opacity-[0.07]"
        width="200"
        height="200"
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="88" stroke="white" strokeWidth="4" />
        <path d="M100 12c0 0-20 28-20 88s20 88 20 88" stroke="white" strokeWidth="4" />
        <path d="M12 100h176" stroke="white" strokeWidth="4" />
        <path d="M36 44L100 72l64-28" stroke="white" strokeWidth="4" />
        <path d="M36 156L100 128l64 28" stroke="white" strokeWidth="4" />
      </svg>
      {/* Jersey outline watermark */}
      <svg
        className="absolute -left-6 -top-6 opacity-[0.07]"
        width="160"
        height="160"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="1.2"
        aria-hidden="true"
      >
        <path d="M3 7l4-3h10l4 3-3 3v10H6V10L3 7z" />
        <path d="M9 4c0 1.657 1.343 3 3 3s3-1.343 3-3" />
      </svg>

      {/* Hero athlete image */}
      <img
        src="/hero-athletes.png"
        alt="Football and cricket athletes"
        className="absolute inset-0 w-full h-full object-cover object-top"
        style={{ mixBlendMode: "luminosity", opacity: 0.6 }}
      />

      {/* Gold tint */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(245,197,24,0.15) 0%, transparent 50%)",
        }}
        aria-hidden="true"
      />

      {/* TRYBY badge */}
      <div className="absolute top-4 left-4">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black text-[#0D0D0D] tracking-wide"
          style={{
            background: "#F5C518",
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: "0.06em",
            fontSize: "12px",
          }}
        >
          🏆 TRYBY SPORTS
        </span>
      </div>
    </div>
  );
}

function JerseysVisual() {
  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-2xl"
      style={{ background: "linear-gradient(135deg, #0D0D0D 0%, #1A1A2E 100%)" }}
    >
      {/* Grid of jersey emoji/icons */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-3 p-6 opacity-15" aria-hidden="true">
        {["⚽", "🏏", "🇮🇳", "🥅", "👕", "🏆", "🎽", "⚡", "🌟"].map((em, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-3xl"
            style={{ transform: `rotate(${(i % 3 - 1) * 8}deg)` }}
          >
            {em}
          </div>
        ))}
      </div>

      {/* Jersey illustration — central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 7l4-3h10l4 3-3 3v10H6V10L3 7z"
              fill="rgba(245,197,24,0.15)"
              stroke="#F5C518"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path
              d="M9 4c0 1.657 1.343 3 3 3s3-1.343 3-3"
              stroke="#F5C518"
              strokeWidth="1.2"
            />
            {/* Number 10 */}
            <text x="9.5" y="17" fontSize="4" fill="#F5C518" fontFamily="'Barlow Condensed', sans-serif" fontWeight="700">10</text>
          </svg>
        </motion.div>
      </div>

      {/* Stadium lighting top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-24 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(245,197,24,0.22) 0%, transparent 80%)",
        }}
        aria-hidden="true"
      />
    </div>
  );
}

function TrustVisual() {
  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-2xl"
      style={{ background: "linear-gradient(135deg, #0D0D0D 0%, #1A1A2E 100%)" }}
    >
      {/* Floating trust icons */}
      {[
        { emoji: "🚚", x: "15%", y: "20%", delay: 0 },
        { emoji: "🔒", x: "65%", y: "12%", delay: 0.4 },
        { emoji: "✅", x: "72%", y: "60%", delay: 0.8 },
        { emoji: "↩️", x: "10%", y: "65%", delay: 1.2 },
      ].map(({ emoji, x, y, delay }) => (
        <motion.div
          key={emoji}
          className="absolute text-2xl"
          style={{ left: x, top: y }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay }}
          aria-hidden="true"
        >
          {emoji}
        </motion.div>
      ))}

      {/* Central shield */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="100" height="114" viewBox="0 0 56 64" fill="none" aria-hidden="true">
            <path
              d="M28 2L4 12V32C4 46.464 14.4 58.4 28 62C41.6 58.4 52 46.464 52 32V12L28 2Z"
              fill="rgba(245,197,24,0.12)"
              stroke="#F5C518"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M18 32l6 6 14-14" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </div>

      {/* Glow */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="w-40 h-40 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(245,197,24,0.12) 0%, transparent 70%)",
            filter: "blur(24px)",
          }}
        />
      </div>
    </div>
  );
}

function LogoVisual() {
  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-2xl"
      style={{ background: "#0D0D0D" }}
    >
      {/* Stadium rays */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(245,197,24,0.1) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Decorative sport outlines */}
      <svg
        className="absolute left-2 top-2 opacity-[0.06]"
        width="90"
        height="90"
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="88" stroke="white" strokeWidth="6" />
        <path d="M100 12c0 0-20 28-20 88s20 88 20 88" stroke="white" strokeWidth="6" />
        <path d="M12 100h176" stroke="white" strokeWidth="6" />
      </svg>
      <svg
        className="absolute right-2 bottom-2 opacity-[0.06]"
        width="90"
        height="90"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M3 7l4-3h10l4 3-3 3v10H6V10L3 7z" />
      </svg>

      {/* TRYBY logo centered */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="56" height="64" viewBox="0 0 56 64" fill="none" aria-hidden="true">
            <path
              d="M28 2L4 12V32C4 46.464 14.4 58.4 28 62C41.6 58.4 52 46.464 52 32V12L28 2Z"
              fill="rgba(245,197,24,0.15)"
              stroke="#F5C518"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <rect x="18" y="20" width="20" height="4" rx="1" fill="#F5C518" />
            <rect x="25.5" y="20" width="5" height="18" rx="1" fill="#F5C518" />
          </svg>
        </motion.div>

        <span
          className="font-black text-white tracking-widest"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "32px",
            letterSpacing: "0.16em",
          }}
        >
          TRYBY
        </span>
        <span
          className="tracking-[0.28em] uppercase"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "11px",
            color: "#F5C518",
          }}
        >
          SPORTS STORE
        </span>
      </div>
    </div>
  );
}

const VISUALS = {
  athletes: AthletesVisual,
  jerseys:  JerseysVisual,
  trust:    TrustVisual,
  logo:     LogoVisual,
};

/* ── Main component ──────────────────────────────────────────────── */

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [current, setCurrent] = useState<ScreenId>(1);
  const [direction, setDirection] = useState(1);

  const screen = SCREENS.find((s) => s.id === current)!;
  const Visual = VISUALS[screen.visual];
  const isLast = current === SCREENS.length;

  function advance() {
    if (isLast) {
      onComplete();
      return;
    }
    setDirection(1);
    setCurrent((c) => (c + 1) as ScreenId);
  }

  function skip() {
    onComplete();
  }

  return (
    <div
      className="fixed inset-0 z-[9990] flex flex-col overflow-hidden"
      style={{ background: "#FFFFFF" }}
    >
      {/* ── Background sport shapes — very low opacity ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(245,197,24,0.07) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(245,197,24,0.05) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Header bar: skip + progress ── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-safe-top pt-4 pb-2">
        <ProgressDots total={SCREENS.length} current={current} />
        {!isLast && (
          <button
            onClick={skip}
            className="text-sm font-semibold text-[#9CA3AF] hover:text-[#0D0D0D] transition-colors duration-150 active:scale-95"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", letterSpacing: "0.04em" }}
          >
            Skip
          </button>
        )}
      </div>

      {/* ── Animated screen content ── */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={screenVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.32, 0, 0.67, 0] }}
            className="absolute inset-0 flex flex-col"
          >
            {/* Visual panel — top half */}
            <div className="flex-shrink-0 px-5 pt-2" style={{ height: "42%" }}>
              <Visual />
            </div>

            {/* Text content — bottom half */}
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col flex-1 px-5 pt-6 pb-4 overflow-y-auto"
            >
              {/* Headline */}
              <motion.h1
                variants={item}
                className="font-black text-[#0D0D0D] leading-[0.92] mb-3"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "clamp(36px, 9vw, 52px)",
                  letterSpacing: "-0.01em",
                }}
              >
                {screen.headline.map((line, i) => (
                  <span key={i} className="block">
                    {i === screen.headline.length - 1 ? (
                      <span style={{ color: "#F5C518" }}>{line}</span>
                    ) : (
                      line
                    )}
                  </span>
                ))}
              </motion.h1>

              {/* Sub text */}
              {screen.sub && (
                <motion.p
                  variants={item}
                  className="text-[#555] leading-snug mb-5"
                  style={{ fontSize: "15px", whiteSpace: "pre-line" }}
                >
                  {screen.sub}
                </motion.p>
              )}

              {/* Bullet list */}
              {"bullets" in screen && screen.bullets && (
                <div className="flex flex-col gap-3 mb-5">
                  {screen.bullets.map((b, i) => (
                    <motion.div
                      key={b.label}
                      variants={item}
                      custom={i}
                      className="flex items-center gap-3"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
                        style={{ background: "#F5C518" }}
                        aria-hidden="true"
                      >
                        {b.emoji}
                      </span>
                      <span
                        className="font-bold text-[#0D0D0D]"
                        style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: "18px",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {b.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── CTA button — always at bottom ── */}
      <div
        className="relative z-10 px-5 pb-safe-bottom"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))", paddingTop: "12px" }}
      >
        {screen.ctaHref ? (
          <Link href={screen.ctaHref} onClick={onComplete} className="block">
            <CtaButton label={screen.cta} primary />
          </Link>
        ) : (
          <CtaButton label={screen.cta} primary onClick={advance} />
        )}

        {isLast && (
          <button
            onClick={skip}
            className="mt-3 w-full text-center text-sm font-semibold text-[#9CA3AF] hover:text-[#0D0D0D] transition-colors duration-150 py-2"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", letterSpacing: "0.04em" }}
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}

/* ── CTA Button sub-component ────────────────────────────────────── */

function CtaButton({
  label,
  primary,
  onClick,
}: {
  label: string;
  primary?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="w-full font-black text-[#0D0D0D] uppercase tracking-wider transition-opacity duration-150"
      style={{
        background: primary ? "#F5C518" : "transparent",
        border: primary ? "none" : "2px solid #0D0D0D",
        height: "54px",
        borderRadius: "100px",
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "16px",
        letterSpacing: "0.07em",
        boxShadow: primary ? "0 4px 20px rgba(245,197,24,0.35)" : "none",
      }}
    >
      {label}
    </motion.button>
  );
}
