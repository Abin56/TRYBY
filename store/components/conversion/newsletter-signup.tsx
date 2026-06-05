"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";

type NewsletterVariant = "hero" | "footer" | "banner" | "inline";

interface NewsletterSignupProps {
  variant?:    NewsletterVariant;
  source?:     string;
  title?:      string;
  subtitle?:   string;
  className?:  string;
}

export function NewsletterSignup({
  variant  = "inline",
  source   = "homepage",
  title    = "Get exclusive deals & new arrivals",
  subtitle = "Join 18,000+ sports fans. No spam, ever.",
  className,
}: NewsletterSignupProps) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const submit = useCallback(async () => {
    if (!email || !email.includes("@")) { setError("Enter a valid email address"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) throw new Error();
      setSuccess(true);
      setEmail("");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }, [email, source]);

  // ── Hero variant ─────────────────────────────────────────────────────────
  if (variant === "hero") {
    return (
      <div className={cn("w-full max-w-md", className)}>
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-2xl px-5 py-4 bg-[#F0FDF4] border border-[#BBF7D0]"
            >
              <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0" />
              <div>
                <p className="text-sm font-bold text-[#15803D]">You&apos;re subscribed!</p>
                <p className="text-xs text-[#16A34A]">We&apos;ll send you the best deals first.</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex gap-2">
                <input
                  type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  placeholder="Enter your email"
                  className="flex-1 h-12 rounded-xl border border-[#E0E0E0] bg-white px-4 text-sm text-[#0D0D0D] placeholder:text-[#9CA3AF] outline-none focus:border-[#0D0D0D] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] transition-all"
                />
                <button
                  onClick={submit} disabled={loading}
                  className="flex h-12 items-center gap-2 rounded-xl px-5 font-black text-sm text-[#0D0D0D] transition-all hover:opacity-90 disabled:opacity-60 active:scale-[0.97]"
                  style={{ background: "#E8FF47", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}
                >
                  {loading ? <span className="h-4 w-4 rounded-full border-2 border-[#0D0D0D]/30 border-t-[#0D0D0D] animate-spin" /> : <>NOTIFY ME <ArrowRight className="h-4 w-4" /></>}
                </button>
              </div>
              {error && <p className="mt-1.5 text-xs text-[#DC2626]">{error}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Banner variant ────────────────────────────────────────────────────────
  if (variant === "banner") {
    return (
      <section
        className={cn("py-14", className)}
        style={{ background: "#0D0D0D" }}
      >
        <div className="max-w-[760px] mx-auto px-4 text-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black mb-4"
            style={{ background: "rgba(232,255,71,0.12)", color: "#E8FF47", letterSpacing: "0.08em", fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            <Mail className="h-3 w-3" /> NEWSLETTER
          </span>
          <h2
            className="font-black text-white leading-tight mb-2"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(28px, 5vw, 40px)", letterSpacing: "-0.01em" }}
          >
            {title}
          </h2>
          <p className="text-white/45 text-sm mb-6">{subtitle}</p>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div key="s" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 bg-white/5 border border-[#E8FF47]/30">
                <CheckCircle2 className="h-5 w-5 text-[#E8FF47]" />
                <span className="text-[#E8FF47] font-bold text-sm">Subscribed! Watch your inbox.</span>
              </motion.div>
            ) : (
              <motion.div key="f" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex gap-2 max-w-md mx-auto">
                <input
                  type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  placeholder="your@email.com"
                  className="flex-1 h-12 rounded-xl px-4 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#E8FF47]/30 transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                />
                <button
                  onClick={submit} disabled={loading}
                  className="flex h-12 items-center gap-2 rounded-xl px-5 font-black text-sm text-[#0D0D0D] transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: "#E8FF47", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}
                >
                  {loading ? <span className="h-4 w-4 rounded-full border-2 border-[#0D0D0D]/30 border-t-[#0D0D0D] animate-spin" /> : <>SUBSCRIBE <ArrowRight className="h-4 w-4" /></>}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {error && <p className="mt-2 text-xs text-[#F87171]">{error}</p>}
          <p className="mt-3 text-[11px] text-white/25">No spam · Unsubscribe anytime · DPDP Act compliant</p>
        </div>
      </section>
    );
  }

  // ── Footer / Inline variant ───────────────────────────────────────────────
  return (
    <div className={cn("", className)}>
      {(variant === "footer" || title) && (
        <div className="mb-3">
          <p className="text-sm font-bold text-white mb-0.5">{title}</p>
          <p className="text-xs text-white/40">{subtitle}</p>
        </div>
      )}
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div key="s" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-xl px-4 py-3 bg-white/5 border border-[#E8FF47]/25">
            <CheckCircle2 className="h-4 w-4 text-[#E8FF47]" />
            <span className="text-[#E8FF47] text-sm font-semibold">You&apos;re subscribed!</span>
          </motion.div>
        ) : (
          <motion.div key="f" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex gap-2">
            <input
              type="email" value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="your@email.com"
              className="flex-1 h-10 rounded-xl px-3 text-[13px] text-white placeholder:text-white/25 outline-none focus:ring-1 focus:ring-white/20 transition-all"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <button
              onClick={submit} disabled={loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#0D0D0D] transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "#E8FF47" }}
              aria-label="Subscribe"
            >
              {loading
                ? <span className="h-3.5 w-3.5 rounded-full border-2 border-[#0D0D0D]/30 border-t-[#0D0D0D] animate-spin" />
                : <ArrowRight className="h-4 w-4" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="mt-1 text-[11px] text-[#F87171]">{error}</p>}
    </div>
  );
}
