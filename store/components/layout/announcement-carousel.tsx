"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import type { AnnouncementItem } from "@/lib/content";

export function AnnouncementCarousel({ items }: { items: AnnouncementItem[] }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused || dismissed || items.length <= 1) return;
    intervalRef.current = setInterval(
      () => setIdx((i) => (i + 1) % items.length),
      3800
    );
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, dismissed, items.length]);

  if (dismissed) return null;

  const prev = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIdx((i) => (i - 1 + items.length) % items.length);
  };
  const next = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIdx((i) => (i + 1) % items.length);
  };

  const msg = items[idx];

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: "clamp(34px, 4vw, 38px)", background: "#111827" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: "linear-gradient(90deg, #FF3B30 0%, #FFB800 50%, #FF3B30 100%)",
          backgroundSize: "200% 100%",
        }}
      />

      {items.length > 1 && (
        <button
          onClick={prev}
          aria-label="Previous announcement"
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 flex h-5 w-5 items-center justify-center rounded text-white/40 hover:text-white/90 transition-colors duration-150"
        >
          <ChevronLeft className="h-3 w-3" />
        </button>
      )}

      <div className="flex items-center justify-center h-full px-10 sm:px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex items-center gap-2"
          >
            <span className="text-[11px] sm:text-[12px] font-medium tracking-wide text-white/90 whitespace-nowrap">
              {msg.message}
            </span>
            {msg.ctaText && msg.ctaUrl && (
              <Link
                href={msg.ctaUrl}
                className="hidden sm:inline-flex items-center text-[11px] font-bold text-[#FF3B30] hover:text-[#FF6B30] underline-offset-2 hover:underline transition-colors duration-150 whitespace-nowrap"
              >
                {msg.ctaText} →
              </Link>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {items.length > 1 && (
        <button
          onClick={next}
          aria-label="Next announcement"
          className="absolute right-8 sm:right-10 top-1/2 -translate-y-1/2 z-10 flex h-5 w-5 items-center justify-center rounded text-white/40 hover:text-white/90 transition-colors duration-150"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      )}

      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 flex h-5 w-5 items-center justify-center rounded text-white/30 hover:text-white/70 transition-colors duration-150"
      >
        <X className="h-2.5 w-2.5" />
      </button>

      {items.length > 1 && (
        <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 flex gap-1">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Announcement ${i + 1}`}
              className={`h-[2px] rounded-full transition-all duration-300 ${
                i === idx ? "w-4 bg-white/80" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
