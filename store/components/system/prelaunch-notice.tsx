"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, ArrowRight } from "lucide-react";

/* ── Config ───────────────────────────────────────────────────────── */
const STORAGE_KEY = "tryby_prelaunch_notice";
const TTL_DAYS    = 7;

function shouldShow() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const { ts } = JSON.parse(raw) as { ts: number };
    return Date.now() - ts > TTL_DAYS * 86_400_000;
  } catch { return true; }
}

function dismiss() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now() }));
}

/* ── Feature cards ────────────────────────────────────────────────── */
const CARDS = [
  {
    emoji: "🏆",
    title: "Premium Jerseys",
    desc:  "Football, cricket and training collections from top clubs and teams.",
  },
  {
    emoji: "⚡",
    title: "Fast Experience",
    desc:  "A modern shopping experience built for sports fans across India.",
  },
  {
    emoji: "🚀",
    title: "Launching Soon",
    desc:  "More products, brands and features arriving with the full launch.",
  },
];

/* ── Floating particle data (stable — no Math.random at render) ─── */
const PARTICLES = [
  { emoji: "⚽", size: 42, x: "8%",  y: "12%", dur: 5.8, delay: 0    },
  { emoji: "🏏", size: 36, x: "82%", y: "8%",  dur: 6.4, delay: 0.7  },
  { emoji: "🏆", size: 32, x: "88%", y: "72%", dur: 5.2, delay: 1.4  },
  { emoji: "⚽", size: 28, x: "5%",  y: "78%", dur: 7.0, delay: 0.3  },
  { emoji: "🏏", size: 24, x: "46%", y: "5%",  dur: 6.0, delay: 1.1  },
];

/* ── Component ────────────────────────────────────────────────────── */
export function PrelaunchNotice() {
  const [visible,    setVisible]    = useState(false);
  const [email,      setEmail]      = useState("");
  const [notified,   setNotified]   = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);

  useEffect(() => { if (shouldShow()) setVisible(true); }, []);

  function close() { setVisible(false); dismiss(); }

  function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      const prev = JSON.parse(localStorage.getItem("tryby_launch_emails") ?? "[]") as string[];
      localStorage.setItem("tryby_launch_emails", JSON.stringify([...prev, email.trim()]));
    } catch { /* noop */ }
    setNotified(true);
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="fixed inset-0 z-[9000]"
            style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)" }}
            onClick={close}
            aria-hidden="true"
          />

          {/* ── Modal ── */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 32 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[9001] flex items-center justify-center px-4"
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to TRYBY"
          >
            <div
              className="relative w-full overflow-hidden"
              style={{
                maxWidth: "520px",
                maxHeight: "90svh",
                background: "#0D0D0D",
                border: "1px solid rgba(245,197,24,0.18)",
                borderRadius: "24px",
                boxShadow:
                  "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,197,24,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >

              {/* ── Floating sport particles (aria-hidden, purely decorative) ── */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                {PARTICLES.map((p, i) => (
                  <motion.span
                    key={i}
                    className="absolute select-none"
                    style={{ left: p.x, top: p.y, fontSize: p.size, opacity: 0.07, lineHeight: 1 }}
                    animate={{ y: [0, -14, 0] }}
                    transition={{ duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
                  >
                    {p.emoji}
                  </motion.span>
                ))}
                {/* Subtle yellow ambient glow */}
                <div
                  className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-48 rounded-full"
                  style={{
                    background: "radial-gradient(ellipse, rgba(245,197,24,0.12) 0%, transparent 70%)",
                    filter: "blur(24px)",
                  }}
                />
              </div>

              {/* ── Close button ── */}
              <button
                onClick={close}
                className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-white/35 hover:text-white hover:bg-white/10 transition-colors duration-150"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {/* ── Content ── */}
              <div className="relative z-10 px-6 pt-8 pb-7 sm:px-8">

                {/* Logo + Early Access badge */}
                <div className="flex flex-col items-center text-center mb-6">
                  {/* Logo with pulse glow */}
                  <motion.div
                    className="relative mb-4"
                    animate={{ filter: ["drop-shadow(0 0 0px rgba(245,197,24,0))", "drop-shadow(0 0 18px rgba(245,197,24,0.45))", "drop-shadow(0 0 6px rgba(245,197,24,0.2))"] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <img
                      src="/brand/tryby-icon.png"
                      alt="TRYBY"
                      width={64}
                      height={64}
                      style={{ width: "64px", height: "64px", objectFit: "contain" }}
                    />
                  </motion.div>

                  {/* Brand name */}
                  <span
                    className="block text-white font-black mb-2"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "28px",
                      letterSpacing: "0.14em",
                      lineHeight: 1,
                    }}
                  >
                    TRYBY
                  </span>

                  {/* Early Access badge */}
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-black text-[#0D0D0D] mb-5"
                    style={{
                      background: "#F5C518",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "11px",
                      letterSpacing: "0.10em",
                    }}
                  >
                    🚀 EARLY ACCESS
                  </span>

                  {/* Heading */}
                  <h2
                    className="text-white font-black leading-tight mb-3"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "clamp(26px, 6vw, 32px)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Welcome to TRYBY
                  </h2>

                  {/* Subheading */}
                  <p
                    className="font-bold mb-3"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "16px",
                      letterSpacing: "0.04em",
                      color: "#F5C518",
                    }}
                  >
                    India&apos;s Next Generation Sports Store
                  </p>

                  {/* Description */}
                  <p className="text-white/55 text-[14px] leading-relaxed max-w-[380px]">
                    We&apos;re preparing for our official launch. You&apos;re among the first visitors
                    exploring TRYBY before release. Feel free to browse and experience what we&apos;re building.
                  </p>
                </div>

                {/* ── 3 feature cards ── */}
                <div className="grid grid-cols-3 gap-2.5 mb-5">
                  {CARDS.map((card, i) => (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.22 + i * 0.07, duration: 0.38, ease: "easeOut" }}
                      className="flex flex-col items-center text-center rounded-2xl p-3"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <span className="text-2xl mb-2 leading-none" aria-hidden="true">{card.emoji}</span>
                      <p
                        className="text-white font-black mb-1 leading-tight"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", letterSpacing: "0.03em" }}
                      >
                        {card.title}
                      </p>
                      <p className="text-white/40 leading-tight" style={{ fontSize: "10.5px" }}>
                        {card.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* ── Preview notice (small, not prominent) ── */}
                <p
                  className="text-center mb-5"
                  style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.30)", lineHeight: 1.5 }}
                >
                  Some products, pricing and checkout features are currently in preview mode.
                </p>

                {/* ── Notify me form (collapsible) ── */}
                <AnimatePresence>
                  {notifyOpen && !notified && (
                    <motion.form
                      key="notify-form"
                      onSubmit={handleNotify}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden mb-3"
                    >
                      <div className="flex gap-2 pt-1 pb-3">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email for launch updates"
                          required
                          className="flex-1 rounded-xl px-4 text-[13px] text-white placeholder:text-white/25 outline-none transition-colors duration-150"
                          style={{
                            height: "44px",
                            background: "rgba(255,255,255,0.07)",
                            border: "1px solid rgba(255,255,255,0.12)",
                          }}
                          // eslint-disable-next-line jsx-a11y/no-autofocus
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="shrink-0 flex items-center justify-center rounded-xl font-black text-[#0D0D0D] transition-all hover:opacity-88 active:scale-[0.97]"
                          style={{
                            height: "44px",
                            paddingInline: "18px",
                            background: "#F5C518",
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontSize: "13px",
                            letterSpacing: "0.06em",
                          }}
                        >
                          SEND
                        </button>
                      </div>
                    </motion.form>
                  )}
                  {notified && (
                    <motion.div
                      key="notified"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 mb-3"
                      style={{ background: "rgba(74,222,128,0.10)", border: "1px solid rgba(74,222,128,0.22)" }}
                    >
                      <span className="text-[#4ADE80] text-[15px]">✓</span>
                      <span className="text-[13px] font-semibold text-[#4ADE80]">
                        You&apos;re on the list. We&apos;ll notify you at launch!
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── CTA buttons ── */}
                <div className="flex gap-3">
                  {/* Primary — Enter TRYBY */}
                  <motion.button
                    onClick={close}
                    whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(245,197,24,0.45)" }}
                    whileTap={{ scale: 0.97 }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl font-black text-[#0D0D0D] transition-shadow duration-200"
                    style={{
                      height: "52px",
                      background: "#F5C518",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "16px",
                      letterSpacing: "0.07em",
                      boxShadow: "0 4px 20px rgba(245,197,24,0.30)",
                    }}
                  >
                    ENTER TRYBY
                    <ArrowRight className="h-[17px] w-[17px]" />
                  </motion.button>

                  {/* Secondary — Notify Me */}
                  {!notified && (
                    <motion.button
                      onClick={() => setNotifyOpen((o) => !o)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center justify-center gap-2 rounded-xl font-black text-white transition-all duration-150"
                      style={{
                        height: "52px",
                        paddingInline: "22px",
                        background: "transparent",
                        border: "1.5px solid rgba(255,255,255,0.22)",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: "15px",
                        letterSpacing: "0.06em",
                      }}
                    >
                      <Bell className="h-4 w-4" />
                      NOTIFY ME
                    </motion.button>
                  )}
                </div>

                {/* ── Footer tagline ── */}
                <p className="text-center mt-5 text-[11.5px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                  🇮🇳 Built in India &nbsp;·&nbsp; Created for athletes, fans and sports enthusiasts.
                </p>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
