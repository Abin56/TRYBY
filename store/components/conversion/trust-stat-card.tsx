"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface StatData {
  value:    number;
  suffix:   string;
  prefix?:  string;
  label:    string;
  sublabel: string;
  emoji:    string;
}

function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    }

    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration, start]);

  return count;
}

interface TrustStatCardProps {
  stat:      StatData;
  accent?:   string;
  className?: string;
}

export function TrustStatCard({ stat, accent = "#E8FF47", className }: TrustStatCardProps) {
  const ref     = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const count = useCountUp(stat.value, 1800, started);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl p-6 text-center",
        "bg-white border border-[#F0F0F0] hover:border-[#E0E0E0] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
        "transition-all duration-300",
        className
      )}
    >
      <span className="text-3xl mb-3">{stat.emoji}</span>
      <div
        className="text-[40px] font-black leading-none mb-1"
        style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.02em", color: "#0D0D0D" }}
      >
        {stat.prefix}
        <span style={{ color: accent }}>{count.toLocaleString("en-IN")}</span>
        {stat.suffix}
      </div>
      <p className="text-[14px] font-bold text-[#0D0D0D] mb-0.5">{stat.label}</p>
      <p className="text-[12px] text-[#9CA3AF]">{stat.sublabel}</p>
    </div>
  );
}

// ─── Default stats ────────────────────────────────────────────────────────────

export const HOMEPAGE_STATS: StatData[] = [
  {
    value:    2,
    suffix:   "–5 Days",
    label:    "Pan-India Delivery",
    sublabel: "Fast nationwide shipping",
    emoji:    "🚚",
  },
  {
    value:    7,
    suffix:   "-Day",
    label:    "Easy Returns",
    sublabel: "Free pickup",
    emoji:    "↩️",
  },
  {
    value:    4,
    suffix:   "",
    label:    "Sport Categories",
    sublabel: "Cricket, Football, Gym, Running",
    emoji:    "🏆",
  },
  {
    value:    100,
    suffix:   "%",
    label:    "Secure Payments",
    sublabel: "UPI, Cards & COD",
    emoji:    "🔒",
  },
];
