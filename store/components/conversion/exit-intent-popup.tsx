"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, ArrowRight, Copy, Check, Zap } from "lucide-react";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "tryby_exit_dismissed";
const COOLDOWN_MS  = 3 * 24 * 60 * 60 * 1000; // 3 days

type Mode = "coupon" | "newsletter";

interface ExitIntentPopupProps {
  couponCode?:    string;
  couponLabel?:   string;
  discountText?:  string;
}

export function ExitIntentPopup({
  couponCode   = "TRYBY10",
  couponLabel  = "10% OFF",
  discountText = "your first order",
}: ExitIntentPopupProps) {
  const [show,     setShow]     = useState(false);
  const [mode,     setMode]     = useState<Mode>("coupon");
  const [email,    setEmail]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [error,    setError]    = useState("");
  const triggered = useRef(false);

  const dismiss = useCallback((permanent = false) => {
    setShow(false);
    if (permanent) {
      try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
    }
  }, []);

  const trigger = useCallback(() => {
    if (triggered.current) return;
    try {
      const ts = localStorage.getItem(STORAGE_KEY);
      if (ts && Date.now() - Number(ts) < COOLDOWN_MS) return;
    } catch {}
    triggered.current = true;
    setShow(true);
  }, []);

  useEffect(() => {
    // Mobile: trigger after 45s scroll engagement
    const timer = setTimeout(() => { if (window.scrollY > 300) trigger(); }, 45_000);

    // Desktop: exit intent on mouse leaving viewport top
    function onMouseLeave(e: MouseEvent) {
      if (e.clientY <= 10) trigger();
    }
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [trigger]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(couponCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [couponCode]);

  const handleSubscribe = useCallback(async () => {
    if (!email || !email.includes("@")) { setError("Enter a valid email"); return; }
    setLoading(true); setError("");
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "exit-intent" }),
      });
      setSuccess(true);
      setTimeout(() => dismiss(true), 2500);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }, [email, dismiss]);

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm"
            onClick={() => dismiss(false)}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed inset-0 z-[501] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-[420px] rounded-3xl overflow-hidden pointer-events-auto"
              style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.32)" }}
            >
              {/* Top accent bar */}
              <div
                className="h-1 w-full"
                style={{ background: "linear-gradient(90deg, #E8FF47, #F5C518)" }}
              />

              <div className="bg-[#0D0D0D] px-7 py-8">
                {/* Close */}
                <button
                  onClick={() => dismiss(true)}
                  className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Tabs */}
                <div className="flex gap-1 bg-white/[0.06] rounded-xl p-1 mb-6">
                  {(["coupon", "newsletter"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={cn(
                        "flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200",
                        mode === m
                          ? "bg-[#E8FF47] text-[#0D0D0D]"
                          : "text-white/40 hover:text-white/70"
                      )}
                    >
                      {m === "coupon" ? "🎁 Get Coupon" : "📧 Stay Updated"}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {mode === "coupon" ? (
                    <motion.div
                      key="coupon"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Coupon mode */}
                      <div className="text-center mb-6">
                        <div
                          className="inline-flex items-center justify-center h-16 w-16 rounded-2xl mb-4"
                          style={{ background: "rgba(232,255,71,0.12)", border: "1px solid rgba(232,255,71,0.25)" }}
                        >
                          <Zap className="h-7 w-7 text-[#E8FF47]" />
                        </div>
                        <p className="text-white/50 text-sm mb-1">Wait! Before you go...</p>
                        <h2
                          className="text-white font-black text-[28px] leading-tight"
                          style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.01em" }}
                        >
                          Get {couponLabel}
                        </h2>
                        <p className="text-white/50 text-sm mt-1">on {discountText}</p>
                      </div>

                      <button
                        onClick={handleCopy}
                        className="w-full flex items-center justify-between rounded-2xl px-5 py-4 mb-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                        style={{
                          background: "rgba(232,255,71,0.1)",
                          border: "2px dashed rgba(232,255,71,0.45)",
                        }}
                      >
                        <span
                          className="text-[#E8FF47] font-black tracking-[0.16em] text-lg"
                          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                        >
                          {couponCode}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#E8FF47]/70">
                          {copied ? (
                            <><Check className="h-3.5 w-3.5" /> Copied!</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5" /> Tap to copy</>
                          )}
                        </span>
                      </button>

                      <p className="text-center text-[11px] text-white/25 mb-5">
                        Valid for 24 hours · Min. order ₹499
                      </p>

                      <a
                        href="/products"
                        onClick={() => dismiss(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-black text-[#0D0D0D] text-sm tracking-wide transition-all hover:opacity-90 active:scale-[0.98]"
                        style={{ background: "#E8FF47", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}
                      >
                        SHOP NOW <ArrowRight className="h-4 w-4" />
                      </a>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="newsletter"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Newsletter mode */}
                      {success ? (
                        <div className="text-center py-8">
                          <div className="text-5xl mb-4">🎉</div>
                          <h3 className="text-white font-black text-xl mb-2"
                            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                            You&apos;re in!
                          </h3>
                          <p className="text-white/50 text-sm">
                            We&apos;ll notify you of drops, deals & new arrivals.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="text-center mb-6">
                            <div
                              className="inline-flex items-center justify-center h-16 w-16 rounded-2xl mb-4"
                              style={{ background: "rgba(232,255,71,0.12)", border: "1px solid rgba(232,255,71,0.25)" }}
                            >
                              <Mail className="h-7 w-7 text-[#E8FF47]" />
                            </div>
                            <h2
                              className="text-white font-black text-[26px] leading-tight mb-1"
                              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                            >
                              New Drops & Deals
                            </h2>
                            <p className="text-white/50 text-sm">
                              Be first for flash sales, new jerseys & exclusive offers
                            </p>
                          </div>

                          <div className="flex gap-2 mb-3">
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => { setEmail(e.target.value); setError(""); }}
                              onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                              placeholder="your@email.com"
                              className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 transition-all"
                              style={{
                                background: "rgba(255,255,255,0.07)",
                                border: "1px solid rgba(255,255,255,0.12)",
                              }}
                            />
                            <button
                              onClick={handleSubscribe}
                              disabled={loading}
                              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl text-[#0D0D0D] font-black transition-all hover:opacity-90 disabled:opacity-50"
                              style={{ background: "#E8FF47" }}
                            >
                              {loading ? (
                                <span className="h-4 w-4 rounded-full border-2 border-[#0D0D0D]/30 border-t-[#0D0D0D] animate-spin" />
                              ) : (
                                <ArrowRight className="h-4 w-4" />
                              )}
                            </button>
                          </div>

                          {error && <p className="text-[#F87171] text-xs mb-2">{error}</p>}

                          <p className="text-[11px] text-white/25 text-center">
                            No spam · Unsubscribe anytime
                          </p>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
