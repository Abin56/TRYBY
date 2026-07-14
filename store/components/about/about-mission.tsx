"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const pillars = [
  "Official licensed products — no fakes, ever",
  "Pan-India delivery in 2–5 business days",
  "7-day no-questions returns",
  "Real-time order tracking from dispatch to door",
  "Cash on Delivery available pan-India",
  "Dedicated B2B supplier onboarding in under 48 hours",
];

export function AboutMission() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FF3B30] mb-3">
              Our Mission
            </p>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-[#111827] tracking-tight leading-tight mb-6">
              Every Indian Athlete
              <br />
              Deserves{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #FF3B30 0%, #FFB800 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Premium Gear.
              </span>
            </h2>
            <p className="text-base text-[#6B7280] leading-relaxed mb-6">
              We started TRYBY Sports because finding genuine, high-quality sports equipment
              in India was needlessly hard. International brands were overpriced, local
              alternatives were unreliable, and nobody was holding the supply chain
              accountable.
            </p>
            <p className="text-base text-[#6B7280] leading-relaxed mb-10">
              Our answer: a curated, brand-first sports commerce platform. Every supplier
              on TRYBY goes through a rigorous onboarding process. Every product is
              verified. Every customer gets the same premium experience whether they&apos;re
              ordering in Mumbai or Manipur.
            </p>

            {/* Pillars checklist */}
            <ul className="space-y-3">
              {pillars.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-[#059669]" />
                  <span className="text-sm text-[#374151] font-medium">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Right — visual block */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="relative"
          >
            {/* Primary card */}
            <div className="rounded-3xl bg-[#111827] p-10 text-white relative overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
              {/* Background glow */}
              <div
                className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse, rgba(255,59,48,0.25) 0%, transparent 70%)",
                }}
                aria-hidden="true"
              />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#FF3B30] mb-4">
                  Our Promise to Suppliers
                </p>
                <h3 className="font-display font-bold text-3xl uppercase mb-4 leading-tight">
                  List Once. Sell Everywhere.
                </h3>
                <p className="text-[#9CA3AF] text-sm leading-relaxed mb-8">
                  When you partner with TRYBY, your products reach a high-intent sports
                  audience that is ready to buy. We handle logistics, payments, customer
                  support, and returns. You focus on what you do best — making great gear.
                </p>
                <div className="flex flex-col gap-4">
                  {[
                    { stat: "Zero", label: "upfront listing fee" },
                    { stat: "48h", label: "to go live after onboarding" },
                    { stat: "Weekly", label: "direct bank payouts" },
                  ].map(({ stat, label }) => (
                    <div key={stat} className="flex items-center gap-4">
                      <span
                        className="font-mono font-bold text-2xl"
                        style={{
                          background: "linear-gradient(135deg, #FF3B30 0%, #FFB800 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        {stat}
                      </span>
                      <span className="text-sm text-[#6B7280]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-5 -left-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_8px_32px_rgba(0,0,0,0.10)] px-5 py-4 flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <div className="text-xs font-bold text-[#111827]">Official TRYBY Platform</div>
                <div className="text-xs text-[#9CA3AF]">Premium Sports Gear · Est. 2026</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
