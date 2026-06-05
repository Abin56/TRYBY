"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const stats = [
  { value: 50000, suffix: "+", label: "Athletes Served", description: "Active buyers across India" },
  { value: 98, suffix: "%", label: "Satisfaction Rate", description: "Verified purchase reviews" },
  { value: 500, suffix: "+", label: "Products Listed", description: "Across 6 sport categories" },
  { value: 27000, suffix: "+", label: "Pincodes Covered", description: "Pan-India delivery network" },
];

function useCountUp(target: number, duration = 1500, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatCard({
  value,
  suffix,
  label,
  description,
  index,
  triggered,
}: {
  value: number;
  suffix: string;
  label: string;
  description: string;
  index: number;
  triggered: boolean;
}) {
  const count = useCountUp(value, 1500, triggered);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="text-center px-6 py-8 rounded-2xl bg-white border border-[#F3F4F6] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,_0_4px_16px_rgba(0,0,0,0.06)] card-lift"
    >
      <div
        className="font-mono font-bold text-5xl sm:text-6xl mb-1 tabular-nums"
        style={{
          background: "linear-gradient(135deg, #FF3B30 0%, #FFB800 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {triggered ? count.toLocaleString("en-IN") : "0"}
        {suffix}
      </div>
      <div className="text-base font-bold text-[#111827] mb-1">{label}</div>
      <div className="text-sm text-[#9CA3AF]">{description}</div>
    </motion.div>
  );
}

export function AboutStats() {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTriggered(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-16 sm:py-20 bg-[#FAFAFA] border-y border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#FF3B30] mb-2">
            By The Numbers
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#111827] tracking-tight">
            The Scale We Operate At
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} {...stat} index={i} triggered={triggered} />
          ))}
        </div>
      </div>
    </section>
  );
}
