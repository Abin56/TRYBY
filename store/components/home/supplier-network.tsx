"use client";

import { motion, useInView, type Variants } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, CheckCircle, Package, TrendingUp, Zap } from "lucide-react";

const SUPPLIER_BENEFITS = [
  {
    icon: TrendingUp,
    color: "#FF3B30",
    title: "Reach High-Intent Sport Buyers",
    desc: "List your products to our verified base of athletes and sports enthusiasts.",
  },
  {
    icon: Package,
    color: "#2196F3",
    title: "Zero Upfront Cost",
    desc: "No listing fees. Pay only when you sell. We handle marketing and logistics.",
  },
  {
    icon: CheckCircle,
    color: "#4CAF50",
    title: "Official Certification Support",
    desc: "We help you display licensing and authentication to build buyer trust.",
  },
  {
    icon: Zap,
    color: "#FFB800",
    title: "Real-Time Inventory Sync",
    desc: "Connect your warehouse for live stock updates and automated order routing.",
  },
];

const LOGOS = [
  { name: "Adidas", abbr: "ADI" },
  { name: "Nike India", abbr: "NIK" },
  { name: "Cosco Sports", abbr: "COS" },
  { name: "SS Cricket", abbr: "SS" },
  { name: "SG Cricket", abbr: "SG" },
  { name: "Puma Sports", abbr: "PUM" },
  { name: "DSC Cricket", abbr: "DSC" },
  { name: "Nivia Sports", abbr: "NIV" },
];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function SupplierNetworkSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-white" aria-labelledby="supplier-network-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="text-center mb-14"
        >
          <p className="sport-label text-xs text-[#FF3B30] mb-2">Supplier Program</p>
          <h2
            id="supplier-network-heading"
            className="section-headline text-[clamp(28px,5vw,44px)] text-[#111827] mb-4"
          >
            Trusted Supplier Network
          </h2>
          <p className="text-base text-[#6B7280] max-w-xl mx-auto leading-relaxed">
            Partner with TRYBY to reach sports buyers across India. We provide the platform, you provide the gear.
          </p>
        </motion.div>

        {/* Benefits grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-14"
        >
          {SUPPLIER_BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.title}
                variants={fadeUp}
                className="flex items-start gap-4 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-5"
              >
                <div
                  className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${b.color}14` }}
                >
                  <Icon className="h-5 w-5" style={{ color: b.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-[#111827] mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1rem" }}>
                    {b.title}
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{b.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Partner logos */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-10"
        >
          <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#9CA3AF] mb-6">
            Brands already on TRYBY
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {LOGOS.map((logo) => (
              <div
                key={logo.name}
                className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-2.5"
                title={logo.name}
              >
                <span className="h-6 w-6 flex items-center justify-center rounded-md bg-[#FF3B30] text-[9px] font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {logo.abbr.slice(0, 2)}
                </span>
                <span className="text-sm font-semibold text-[#374151]">{logo.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center"
        >
          <Link
            href="/supplier/apply"
            className="shimmer-btn inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-[#FF3B30] text-white text-sm font-bold hover:bg-[#E5352B] transition-colors duration-150 shadow-[0_4px_16px_rgba(255,59,48,0.3)]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.95rem", letterSpacing: "0.06em" }}
          >
            BECOME A SUPPLIER <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
