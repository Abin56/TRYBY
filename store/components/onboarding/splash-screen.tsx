"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

/* ── Floating particles ──────────────────────────────────────────── */
const PARTICLES = [
  { emoji: "⚽", size: 20, x: "7%",  y: "16%", delay: 0.15, dur: 3.2 },
  { emoji: "🏏", size: 18, x: "83%", y: "13%", delay: 0.45, dur: 2.8 },
  { emoji: "🏆", size: 16, x: "87%", y: "70%", delay: 0.1,  dur: 3.5 },
  { emoji: "👕", size: 18, x: "5%",  y: "74%", delay: 0.65, dur: 2.6 },
  { emoji: "⚡", size: 14, x: "50%", y: "7%",  delay: 0.3,  dur: 3.0 },
  { emoji: "🎽", size: 14, x: "74%", y: "43%", delay: 0.55, dur: 2.9 },
  { emoji: "🥅", size: 14, x: "13%", y: "47%", delay: 0.4,  dur: 3.3 },
];

/* ── Phase timeline (ms) ─────────────────────────────────────────── */
const T = {
  particles: 80,
  shield:    250,   // 1. Shield fades in
  glow:      480,   // 2. Yellow glow pulse starts
  tMark:     720,   // 3. T appears inside shield (handled by ShieldT SVG, instant)
  wordmark:  900,   // 4. TRYBY slides upward
  subtitle:  1100,  // 5. SPORTS STORE fades in
  tagline:   1280,  // 6. Tagline
  streak:    1480,  // Lightning sweep
  streakEnd: 1880,
  loadText:  900,   // "Preparing Matchday Gear..." (with wordmark)
  exit:      2500,
  done:      2900,
};

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [particles,  setParticles]  = useState(false);
  const [shield,     setShield]     = useState(false);
  const [glow,       setGlow]       = useState(false);
  const [wordmark,   setWordmark]   = useState(false);
  const [subtitle,   setSubtitle]   = useState(false);
  const [tagline,    setTagline]    = useState(false);
  const [streak,     setStreak]     = useState(false);
  const [loadText,   setLoadText]   = useState(false);
  const [exiting,    setExiting]    = useState(false);
  const [progress,   setProgress]   = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setParticles(true),  T.particles));
    timers.push(setTimeout(() => setShield(true),     T.shield));
    timers.push(setTimeout(() => setGlow(true),       T.glow));
    timers.push(setTimeout(() => setWordmark(true),   T.wordmark));
    timers.push(setTimeout(() => setSubtitle(true),   T.subtitle));
    timers.push(setTimeout(() => setTagline(true),    T.tagline));
    timers.push(setTimeout(() => setStreak(true),     T.streak));
    timers.push(setTimeout(() => setStreak(false),    T.streakEnd));
    timers.push(setTimeout(() => setLoadText(true),   T.loadText));
    timers.push(setTimeout(() => setExiting(true),    T.exit));
    timers.push(setTimeout(() => onComplete(),        T.done));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  /* Smooth progress bar */
  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => {
      const p = Math.min((performance.now() - start) / T.exit, 1);
      setProgress(p);
      if (p >= 1) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#0D0D0D" }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.4, ease: "easeIn" }}
      aria-label="TRYBY Sports loading"
      role="status"
    >
      {/* ── Subtle radial vignette ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 50% at 50% 50%, rgba(245,197,24,0.05) 0%, transparent 70%)",
        }}
      />

      {/* ── Floating particles ── */}
      <AnimatePresence>
        {particles && PARTICLES.map((p) => (
          <motion.span
            key={p.emoji}
            aria-hidden="true"
            className="pointer-events-none absolute select-none"
            style={{ left: p.x, top: p.y, fontSize: p.size, lineHeight: 1 }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{
              opacity: [0, 0.15, 0.10, 0.15],
              scale:   [0.3, 1, 0.95, 1],
              y:       [0, -9, 0, -9, 0],
            }}
            transition={{
              opacity: { duration: 0.5, delay: p.delay },
              scale:   { duration: 0.5, delay: p.delay },
              y:       { duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.delay },
            }}
          >
            {p.emoji}
          </motion.span>
        ))}
      </AnimatePresence>

      {/* ── Central logo stack ── */}
      <div className="relative z-10 flex flex-col items-center w-full px-8">

        {/* Glow + shield wrapper */}
        <div className="relative flex items-center justify-center mb-5">

          {/* Yellow glow blob behind shield */}
          <AnimatePresence>
            {glow && (
              <motion.div
                key="glow"
                aria-hidden="true"
                className="absolute rounded-full pointer-events-none"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: [0, 1, 0.75, 1], scale: [0.3, 1.5, 1.25, 1.5] }}
                exit={{ opacity: 0 }}
                transition={{
                  opacity: { duration: 0.5 },
                  scale:   { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
                }}
                style={{
                  width:    "clamp(100px, 26vw, 150px)",
                  height:   "clamp(100px, 26vw, 150px)",
                  background:
                    "radial-gradient(circle, rgba(245,197,24,0.30) 0%, rgba(245,197,24,0.08) 55%, transparent 75%)",
                  filter: "blur(10px)",
                }}
              />
            )}
          </AnimatePresence>

          {/* Shield — step 1: fades in. Step 2: glow ring pulses. T is part of ShieldT SVG. */}
          <AnimatePresence>
            {shield && (
              <motion.div
                key="shield"
                className="relative flex items-center justify-center"
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ width: "clamp(68px, 18vw, 96px)", aspectRatio: "1/1" }}
              >
                {/* Pulse ring 1 */}
                {glow && (
                  <motion.div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none"
                    style={{ borderRadius: "50%", border: "1.5px solid rgba(245,197,24,0.5)" }}
                    animate={{ scale: [1, 1.75], opacity: [0.4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0 }}
                  />
                )}
                {/* Pulse ring 2 */}
                {glow && (
                  <motion.div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none"
                    style={{ borderRadius: "50%", border: "1px solid rgba(245,197,24,0.25)" }}
                    animate={{ scale: [1, 2.0], opacity: [0.25, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.55 }}
                  />
                )}
                <img
                  src="/brand/tryby-icon.png"
                  alt="TRYBY"
                  className="w-full h-full object-contain"
                  fetchPriority="high"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step 4: TRYBY slides upward */}
        <AnimatePresence>
          {wordmark && (
            <motion.div
              key="wordmark"
              className="relative overflow-hidden"
              initial={{ opacity: 0, y: 18, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            >
              <span
                className="block text-white font-black text-center select-none"
                style={{
                  fontFamily:    "'Barlow Condensed', sans-serif",
                  fontSize:      "clamp(58px, 18vw, 96px)",
                  letterSpacing: "0.16em",
                  lineHeight:    1,
                }}
              >
                TRYBY
              </span>

              {/* Lightning streak across wordmark */}
              <AnimatePresence>
                {streak && (
                  <motion.div
                    key="streak"
                    aria-hidden="true"
                    initial={{ x: "-115%", skewX: -12 }}
                    animate={{ x: "115%" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(245,197,24,0.1) 28%, rgba(245,197,24,0.72) 50%, rgba(245,197,24,0.1) 72%, transparent 100%)",
                    }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 5: SPORTS STORE fades in */}
        <AnimatePresence>
          {subtitle && (
            <motion.span
              key="subtitle"
              className="block text-center uppercase select-none"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              style={{
                fontFamily:    "'Barlow Condensed', sans-serif",
                fontSize:      "clamp(11px, 3.8vw, 15px)",
                color:         "#F5C518",
                letterSpacing: "0.30em",
                marginTop:     "6px",
              }}
            >
              SPORTS STORE
            </motion.span>
          )}
        </AnimatePresence>

        {/* Step 6: Tagline */}
        <AnimatePresence>
          {tagline && (
            <motion.p
              key="tagline"
              className="text-center select-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                fontFamily:    "'Barlow Condensed', sans-serif",
                fontSize:      "clamp(13px, 4vw, 17px)",
                color:         "rgba(255,255,255,0.35)",
                letterSpacing: "0.07em",
                marginTop:     "18px",
              }}
            >
              Gear Up. Play Your Best.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom: loading text + progress bar ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center"
        style={{ paddingBottom: "max(28px, env(safe-area-inset-bottom, 28px))" }}
      >
        {/* Step 7: "Preparing Matchday Gear..." */}
        <AnimatePresence>
          {loadText && (
            <motion.p
              key="load-text"
              className="text-center select-none mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                fontFamily:    "'Barlow Condensed', sans-serif",
                fontSize:      "clamp(10px, 3.2vw, 12px)",
                color:         "rgba(255,255,255,0.28)",
                letterSpacing: "0.12em",
              }}
            >
              Preparing Matchday Gear...
            </motion.p>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        <div
          className="overflow-hidden rounded-full"
          style={{
            width:      "clamp(100px, 32vw, 160px)",
            height:     "2px",
            background: "rgba(255,255,255,0.07)",
          }}
        >
          <div
            className="h-full rounded-full transition-none"
            style={{
              width:      `${progress * 100}%`,
              background: "linear-gradient(90deg, #F5C518 0%, rgba(245,197,24,0.55) 100%)",
              boxShadow:  progress > 0.1 ? "0 0 6px rgba(245,197,24,0.5)" : "none",
              transition: "width 28ms linear",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
