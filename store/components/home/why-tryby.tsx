"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ShieldCheck, Truck, IndianRupee, RefreshCcw } from "lucide-react";

const STATS = [
  { value: 2, suffix: "–5 Days", label: "Pan-India Delivery" },
  { value: 7, suffix: "-Day", label: "Easy Returns" },
  { value: 4, suffix: "", label: "Sport Categories" },
  { value: 100, suffix: "%", label: "Secure Payments" },
];

const WHY_ITEMS = [
  {
    icon: ShieldCheck,
    color: "#4CAF50",
    bg: "rgba(76,175,80,0.08)",
    title: "Official Licensed Products",
    desc: "Every jersey and kit is genuine and officially verified. No fakes. No replicas.",
  },
  {
    icon: Truck,
    color: "#2196F3",
    bg: "rgba(33,150,243,0.08)",
    title: "Fast Pan-India Delivery",
    desc: "Fast nationwide shipping in 2–5 days. Express delivery available.",
  },
  {
    icon: IndianRupee,
    color: "#FFB800",
    bg: "rgba(255,184,0,0.08)",
    title: "Best Price Guarantee",
    desc: "Found it cheaper? We'll match the price — no questions asked.",
  },
  {
    icon: RefreshCcw,
    color: "#FF3B30",
    bg: "rgba(255,59,48,0.08)",
    title: "7-Day Easy Returns",
    desc: "Not happy? Return within 7 days for a full refund, hassle-free.",
  },
];

function CountUp({ target, suffix, inView }: { target: number; suffix: string; inView: boolean }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const step = 16;
    const steps = duration / step;
    const increment = target / steps;
    let current = 0;
    const id = setInterval(() => {
      current += increment;
      if (current >= target) {
        setVal(target);
        clearInterval(id);
      } else {
        setVal(Math.floor(current));
      }
    }, step);
    return () => clearInterval(id);
  }, [inView, target]);

  return (
    <span className="tabular-nums" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
      {val.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export function WhyTRYBYSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-[#FAFAFA]" aria-labelledby="why-tryby-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="text-center mb-14"
        >
          <p className="sport-label text-xs text-[#FF3B30] mb-2">Why Choose TRYBY</p>
          <h2
            id="why-tryby-heading"
            className="section-headline text-[clamp(28px,5vw,44px)] text-[#111827]"
          >
            Why Athletes Choose TRYBY.
          </h2>
        </motion.div>

        {/* 4-col feature grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {WHY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="card-lift flex flex-col gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-6"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: item.bg }}
                >
                  <Icon className="h-6 w-6" style={{ color: item.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-[#111827] mb-1.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.05rem" }}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.35 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-[clamp(32px,5vw,48px)] font-black text-[#FF3B30] leading-none mb-1"
                aria-label={`${stat.value}${stat.suffix} ${stat.label}`}
              >
                <CountUp target={stat.value} suffix={stat.suffix} inView={inView} />
              </div>
              <p className="text-sm text-[#6B7280]">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
