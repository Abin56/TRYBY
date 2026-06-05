"use client";

import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

export function PromoBannerSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden bg-[#0a0a0a] py-0"
      style={{ minHeight: "520px" }}
    >
      {/* Background: deep red radial glow left + top-right accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 15% 60%, rgba(200,0,0,0.28) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 85% 10%, rgba(220,30,0,0.18) 0%, transparent 65%), #0a0a0a",
        }}
      />

      {/* Subtle grid texture overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Red accent bar — top edge */}
      <div
        aria-hidden
        className="absolute left-0 right-0 top-0 h-[3px]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #dc2626 25%, #ef4444 50%, #dc2626 75%, transparent 100%)",
        }}
      />

      {/* Inner layout */}
      <div className="relative mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-6 py-20 md:flex-row md:gap-16 md:py-24 lg:px-8">
        {/* ── Left: copy ── */}
        <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
          {/* Season pill */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-700/40 bg-red-950/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-red-400"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_6px_2px_rgba(239,68,68,0.7)]" />
            New Season Drop
          </motion.div>

          {/* Main headline */}
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
            className="text-5xl font-black uppercase leading-[0.92] tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            2026{" "}
            <span
              className="block"
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 40%, #ff6b6b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Season
            </span>
            Collection
          </motion.h2>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.18, ease: "easeOut" }}
            className="mt-5 max-w-md text-base font-medium text-zinc-400 sm:text-lg"
          >
            Latest Club &amp; National Team Jerseys — Football, Cricket &amp; Beyond.
            <br />
            <span className="text-zinc-300">Official kits. Unbeatable prices.</span>
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.48, delay: 0.28, ease: "easeOut" }}
            className="mt-8"
          >
            <Link
              href="/products"
              className="group inline-flex items-center gap-2.5 rounded-full bg-red-600 px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-[0_0_24px_4px_rgba(220,38,38,0.45)] transition-all duration-300 hover:bg-red-500 hover:shadow-[0_0_36px_8px_rgba(220,38,38,0.55)]"
            >
              Explore Collection
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Sport tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.38 }}
            className="mt-8 flex flex-wrap gap-2"
          >
            {["Football", "Cricket", "Basketball", "Athletics"].map((sport) => (
              <span
                key={sport}
                className="rounded-full border border-zinc-700/60 bg-zinc-800/50 px-3 py-1 text-xs font-medium text-zinc-400"
              >
                {sport}
              </span>
            ))}
          </motion.div>
        </div>

        {/* ── Right: jersey visual cards ── */}
        <motion.div
          initial={{ opacity: 0, x: 48 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.14, ease: "easeOut" }}
          className="relative mt-14 flex shrink-0 items-end justify-center gap-4 md:mt-0"
          style={{ width: "min(100%, 400px)", height: "360px" }}
        >
          {/* Back card — cricket jersey */}
          <div
            className="absolute bottom-0 right-0 h-[300px] w-[180px] overflow-hidden rounded-2xl border border-zinc-700/50"
            style={{
              background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 100%)",
              transform: "rotate(6deg) translateX(20px)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            }}
          >
            {/* Jersey image */}
            <img
              src="https://images.unsplash.com/photo-1614632537423-1e6c2317a90e?w=360&h=440&fit=crop"
              alt="Cricket jersey"
              className="h-full w-full object-cover opacity-80"
            />
            {/* Overlay label */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Cricket</p>
              <p className="text-xs font-bold text-white">National Kit</p>
            </div>
          </div>

          {/* Front card — football jersey */}
          <div
            className="relative h-[340px] w-[200px] overflow-hidden rounded-2xl border border-zinc-700/40"
            style={{
              background: "linear-gradient(160deg, #1c0a0a 0%, #2d0000 100%)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 40px rgba(220,38,38,0.15)",
              zIndex: 10,
            }}
          >
            {/* Premium glow spot */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 80% 50% at 50% 10%, rgba(220,38,38,0.25) 0%, transparent 70%)",
              }}
            />
            <img
              src="https://images.unsplash.com/photo-1580087256394-dc596e1c8f4f?w=400&h=480&fit=crop"
              alt="Football jersey"
              className="h-full w-full object-cover opacity-85"
            />
            {/* Badge */}
            <div className="absolute right-3 top-3 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white shadow-[0_0_12px_rgba(220,38,38,0.6)]">
              New
            </div>
            {/* Overlay label */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-red-400">Football</p>
              <p className="text-sm font-bold text-white">Club Collection</p>
              <p className="mt-0.5 text-xs text-zinc-400">From ₹1,299</p>
            </div>
          </div>

          {/* Floating premium tag */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="absolute -left-4 top-8 flex items-center gap-2 rounded-xl border border-red-700/40 bg-black/80 px-3 py-2 shadow-lg backdrop-blur-sm"
            style={{ zIndex: 20 }}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600/20">
              <span className="text-sm">⚡</span>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-red-400">Premium Quality</p>
              <p className="text-[9px] text-zinc-500">Official Licensed Kits</p>
            </div>
          </motion.div>

          {/* Bottom stat chip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.58 }}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-zinc-700/50 bg-zinc-900/90 px-4 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-sm"
            style={{ zIndex: 20 }}
          >
            500+ Club &amp; National Teams
          </motion.div>
        </motion.div>
      </div>

      {/* Red accent bar — bottom edge */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #dc2626 30%, #ef4444 50%, #dc2626 70%, transparent 100%)",
          opacity: 0.5,
        }}
      />
    </section>
  );
}
