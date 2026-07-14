"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Package, BarChart3, CreditCard, CheckCircle2 } from "lucide-react";

const supplierCards = [
  {
    icon: Package,
    label: "Easy Onboarding",
    detail: "Live in 48 hours. Our team handles catalogue setup, imagery guidelines, and pricing strategy.",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  {
    icon: BarChart3,
    label: "Real-Time Dashboard",
    detail: "Track sales, orders, inventory levels, return rates, and customer sentiment — all in one place.",
    color: "#059669",
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
  {
    icon: CreditCard,
    label: "Weekly Payouts",
    detail: "Direct bank transfer every Monday. No holding periods, no payment delays, no surprises.",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
];

const benefits = [
  "Zero upfront cost — pay only on sales",
  "Access to a fast-growing base of high-intent sports buyers",
  "Full logistics and payment infrastructure handled",
  "Dedicated account manager for your first 90 days",
  "Co-marketing opportunities on TRYBY channels",
  "Priority placement for high-performing SKUs",
];

export function AboutSupplierCTA() {
  return (
    <section className="py-20 sm:py-28 bg-[#111827] relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,59,48,0.12) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top — heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#FFB800] mb-3">
            🤝 Partner With TRYBY
          </p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white tracking-tight mb-4">
            Are You a Sports Brand or Supplier?
          </h2>
          <p className="text-base text-[#9CA3AF] max-w-xl mx-auto">
            We work with official distributors, brands, and manufacturers across India.
            List your products on TRYBY and reach high-intent sports buyers who are
            ready to buy.
          </p>
        </motion.div>

        {/* Middle — two columns */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-14">
          {/* Left — benefits */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h3 className="font-display font-bold text-2xl text-white uppercase mb-6">
              What You Get
            </h3>
            <ul className="space-y-3 mb-8">
              {benefits.map((b, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.07 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-[#FFB800]" />
                  <span className="text-sm text-[#D1D5DB] font-medium">{b}</span>
                </motion.li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/supplier/apply"
                className="shimmer-btn inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF3B30] px-6 py-3.5 text-sm font-bold text-white uppercase tracking-wide shadow-[0_2px_12px_rgba(255,59,48,0.40)] hover:bg-[#E5352B] hover:shadow-[0_4px_20px_rgba(255,59,48,0.50)] hover:-translate-y-0.5 transition-all duration-150"
              >
                Become a Supplier
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,0.15)] bg-transparent px-6 py-3.5 text-sm font-semibold text-white hover:border-[rgba(255,255,255,0.30)] hover:bg-[rgba(255,255,255,0.05)] transition-all duration-150"
              >
                Talk to Our Team
              </Link>
            </div>
          </motion.div>

          {/* Right — supplier cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="space-y-4"
          >
            {supplierCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="group flex gap-4 rounded-2xl border border-[rgba(255,184,0,0.15)] bg-[rgba(255,255,255,0.04)] p-5 hover:border-[rgba(255,184,0,0.30)] hover:bg-[rgba(255,255,255,0.06)] transition-all duration-200"
                >
                  <div
                    className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: card.bg }}
                  >
                    <Icon className="h-5 w-5" style={{ color: card.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">{card.label}</p>
                    <p className="text-xs text-[#9CA3AF] leading-relaxed">{card.detail}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Bottom — social proof strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-8 py-6"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <p className="text-sm font-bold text-white mb-0.5">
                Now onboarding our founding brands &amp; distributors
              </p>
              <p className="text-xs text-[#6B7280]">
                From official cricket gear distributors to independent gym equipment brands
              </p>
            </div>
            <div className="flex items-center gap-8">
              {[
                { val: "0%", lbl: "Upfront Cost" },
                { val: "Weekly", lbl: "Payouts" },
                { val: "48 hrs", lbl: "Onboarding" },
              ].map(({ val, lbl }) => (
                <div key={lbl} className="text-center">
                  <div
                    className="font-mono font-bold text-xl"
                    style={{
                      background: "linear-gradient(135deg, #FF3B30 0%, #FFB800 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {val}
                  </div>
                  <div className="text-xs text-[#6B7280]">{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
