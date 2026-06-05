"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Truck, Zap, Users, BarChart3, Heart } from "lucide-react";

const values = [
  {
    icon: ShieldCheck,
    title: "Authenticity First",
    body: "We only list products we can verify. Every brand on TRYBY is vetted, every license is confirmed. No grey-market goods. No compromises.",
    color: "#059669",
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
  {
    icon: Zap,
    title: "Athlete-Obsessed",
    body: "We obsess over the buyer experience. From product discovery to post-purchase support, every touchpoint is designed for the athlete, not the algorithm.",
    color: "#FF3B30",
    bg: "#FFF5F4",
    border: "#FECACA",
  },
  {
    icon: Truck,
    title: "Delivery Promise",
    body: "Standard 2–5 days. Express 1–2 days. We don't ship promises — we ship products. Our logistics SLA is the best in the category.",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  {
    icon: Users,
    title: "Supplier Partnership",
    body: "We treat suppliers as co-founders of the TRYBY ecosystem. Your success is our success. We invest in your onboarding, growth, and visibility.",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  {
    icon: BarChart3,
    title: "Data Transparency",
    body: "Real-time dashboards for suppliers. Live inventory, sales velocity, return rates, and customer feedback — all in one place.",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
  },
  {
    icon: Heart,
    title: "Community-Driven",
    body: "TRYBY is built for sports communities across India — cricket clubs, football academies, CrossFit boxes, running groups. We grow when they grow.",
    color: "#EC4899",
    bg: "#FDF2F8",
    border: "#FBCFE8",
  },
];

export function AboutValues() {
  return (
    <section className="py-20 sm:py-28 bg-[#FAFAFA] border-y border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#FF3B30] mb-3">
            What We Stand For
          </p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-[#111827] tracking-tight">
            Our Values
          </h2>
          <p className="mt-4 text-base text-[#6B7280] max-w-xl mx-auto">
            These aren&apos;t poster words. They are the operating principles behind every
            product decision, every supplier deal, and every customer interaction.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
              >
                <div
                  className="group h-full rounded-2xl bg-white border p-7 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 card-lift"
                  style={{ borderColor: v.border }}
                >
                  <div
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: v.bg }}
                  >
                    <Icon className="h-6 w-6" style={{ color: v.color }} />
                  </div>
                  <h3 className="text-base font-bold text-[#111827] mb-2">{v.title}</h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{v.body}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
