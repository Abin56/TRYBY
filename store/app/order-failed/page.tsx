"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  XCircle, RefreshCw, ArrowRight, MessageCircle, ShieldCheck,
  CreditCard, Smartphone, Phone,
} from "lucide-react";

function OrderFailedInner() {
  const params = useSearchParams();
  const router = useRouter();

  const orderId    = params.get("orderId");
  const orderNum   = params.get("order");

  const retryUrl = orderId
    ? `/checkout/payment?orderId=${orderId}`
    : "/cart";

  const RETRY_OPTIONS = [
    { icon: Smartphone, label: "Try UPI instead",       desc: "GPay, PhonePe, Paytm — instant & reliable" },
    { icon: CreditCard, label: "Use a different card",  desc: "Try a different bank or card network"       },
    { icon: Phone,      label: "Cash on Delivery",      desc: "Pay cash when your order arrives"           },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-16 pb-20">
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-12 space-y-6 text-center">

        {/* Error icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <div className="relative inline-flex items-center justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 250, delay: 0.1 }}
              className="flex h-24 w-24 items-center justify-center rounded-full bg-[rgba(239,68,68,0.1)] border-2 border-[rgba(239,68,68,0.3)]"
            >
              <XCircle className="h-12 w-12 text-[#EF4444]" />
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="text-3xl font-extrabold text-white mb-3">Payment Failed</h1>
            {orderNum && (
              <p className="text-[#6B7280] text-sm mb-2 font-mono">{orderNum}</p>
            )}
            <p className="text-[#9CA3AF] text-base leading-relaxed max-w-sm mx-auto">
              Don&apos;t worry — you were not charged. Your order is saved and you can retry payment below.
            </p>
          </motion.div>
        </motion.div>

        {/* What happened */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-[14px] bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] px-5 py-4 text-left space-y-2"
        >
          <p className="text-xs font-bold text-[#EF4444] uppercase tracking-wide">Possible reasons</p>
          <ul className="space-y-1.5 text-sm text-[#9CA3AF]">
            {[
              "Payment timed out or was declined by your bank",
              "Insufficient funds or card limit reached",
              "Network issue during payment processing",
              "OTP verification was not completed in time",
            ].map(r => (
              <li key={r} className="flex items-start gap-2">
                <span className="text-[#EF4444] mt-0.5 shrink-0">·</span>{r}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Retry options */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-3 text-left">
          <p className="text-sm font-bold text-white text-center">Try a different payment method</p>
          {RETRY_OPTIONS.map((opt, i) => {
            const Icon = opt.icon;
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.07 }}
                onClick={() => router.push(retryUrl)}
                className="group flex w-full items-center gap-4 rounded-[14px] bg-[#111111] border border-[#1F1F1F] p-4 hover:border-[#2563EB] hover:bg-[rgba(37,99,235,0.04)] transition-all duration-200 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#161616] border border-[#2D2D2D] group-hover:border-[rgba(37,99,235,0.3)] group-hover:bg-[rgba(37,99,235,0.08)] transition-all">
                  <Icon className="h-5 w-5 text-[#9CA3AF] group-hover:text-[#2563EB] transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{opt.label}</p>
                  <p className="text-xs text-[#9CA3AF]">{opt.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#6B7280] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
              </motion.button>
            );
          })}
        </motion.div>

        {/* Primary retry CTA */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="space-y-3">
          <button
            onClick={() => router.push(retryUrl)}
            className="flex w-full items-center justify-center gap-2 h-12 rounded-[10px] bg-[#2563EB] text-sm font-bold text-white hover:bg-[#1D4ED8] transition-colors shadow-[0_0_24px_rgba(37,99,235,0.3)]"
          >
            <RefreshCw className="h-4 w-4" />
            Try Payment Again
          </button>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/cart"
              className="flex items-center justify-center gap-2 h-10 rounded-[10px] border border-[#2D2D2D] bg-[#111111] text-sm font-semibold text-[#9CA3AF] hover:text-white hover:border-[#3D3D3D] transition-all"
            >
              Return to Cart
            </Link>
            <Link
              href="/contact"
              className="flex items-center justify-center gap-2 h-10 rounded-[10px] border border-[#2D2D2D] bg-[#111111] text-sm font-semibold text-[#9CA3AF] hover:text-white hover:border-[#3D3D3D] transition-all"
            >
              <MessageCircle className="h-4 w-4" /> Get Help
            </Link>
          </div>
        </motion.div>

        {/* Assurance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="flex items-center justify-center gap-2 text-xs text-[#6B7280] pt-2"
        >
          <ShieldCheck className="h-4 w-4 text-[#10B981]" />
          Your order is saved — retry without re-entering your address.
        </motion.div>

      </div>
    </div>
  );
}

export default function OrderFailedPage() {
  return <Suspense><OrderFailedInner /></Suspense>;
}
