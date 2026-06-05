"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Megaphone, ShoppingCart, BarChart3, Send,
  TrendingUp, Users, Zap, Tag, ArrowRight,
} from "lucide-react";

const QUICK_STATS = [
  { label: "Active Campaigns", value: "—",   color: "#2563EB", bg: "#EFF6FF", icon: Megaphone  },
  { label: "Campaign Revenue", value: "—",   color: "#16A34A", bg: "#F0FDF4", icon: TrendingUp  },
  { label: "Abandoned Carts",  value: "—",   color: "#D97706", bg: "#FFFBEB", icon: ShoppingCart},
  { label: "Recovery Rate",    value: "—",   color: "#7C3AED", bg: "#F5F3FF", icon: Zap         },
];

const HUB_CARDS = [
  {
    href:    "/admin/marketing/campaigns",
    icon:    Megaphone,
    title:   "Campaigns",
    desc:    "Create and manage Email, WhatsApp, Coupon & Loyalty campaigns. Target customer segments and track performance.",
    color:   "#2563EB",
    bg:      "#EFF6FF",
    badges:  ["Email", "WhatsApp", "Coupon", "Loyalty"],
  },
  {
    href:    "/admin/marketing/abandoned-cart",
    icon:    ShoppingCart,
    title:   "Abandoned Cart Recovery",
    desc:    "Detect abandoned carts, track cart value at risk, and trigger recovery via Email or WhatsApp.",
    color:   "#D97706",
    bg:      "#FFFBEB",
    badges:  ["Auto-detect", "Email recovery", "WhatsApp recovery"],
  },
  {
    href:    "/admin/marketing/analytics",
    icon:    BarChart3,
    title:   "Marketing Analytics",
    desc:    "Full-funnel revenue attribution: campaigns, coupons, loyalty redemptions, referrals, and repeat purchase rate.",
    color:   "#16A34A",
    bg:      "#F0FDF4",
    badges:  ["Revenue", "Coupons", "Loyalty", "Retention"],
  },
];

export default function MarketingHubPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-[#111827]">Marketing Automation</h1>
        <p className="text-sm text-[#9CA3AF]">
          Campaigns · Abandoned cart recovery · Analytics · Customer targeting
        </p>
      </div>

      {/* Quick stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {QUICK_STATS.map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: bg }}>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <div>
              <p className="text-lg font-extrabold text-[#111827]">{value}</p>
              <p className="text-[11px] text-[#9CA3AF]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Hub cards */}
      <div className="grid md:grid-cols-3 gap-5">
        {HUB_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Link href={card.href}
                className="flex flex-col h-full rounded-2xl border border-[#E5E7EB] bg-white p-6 hover:border-[#D1D5DB] hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] transition-all group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: card.bg }}>
                    <Icon className="h-6 w-6" style={{ color: card.color }} />
                  </div>
                  <h2 className="text-base font-extrabold text-[#111827]">{card.title}</h2>
                </div>
                <p className="text-sm text-[#6B7280] leading-relaxed mb-4 flex-1">{card.desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {card.badges.map(b => (
                    <span key={b} className="rounded-full px-2.5 py-1 text-[10px] font-semibold border border-[#E5E7EB] text-[#6B7280]">{b}</span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-[#374151] group-hover:text-[#111827] transition-colors">
                  Open {card.title} <ArrowRight className="h-3.5 w-3.5 ml-0.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Feature overview */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
        <p className="text-sm font-bold text-[#111827] mb-4">Platform Capabilities</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Send,     label: "Email Campaigns",        desc: "Segment-targeted emails",      color: "#2563EB" },
            { icon: Users,    label: "Customer Targeting",      desc: "6 segment types with live estimates", color: "#7C3AED" },
            { icon: Tag,      label: "Coupon Campaigns",        desc: "Track sent, used & revenue",   color: "#D97706" },
            { icon: Zap,      label: "Loyalty Campaigns",       desc: "Bonus points to segments",     color: "#7C3AED" },
            { icon: ShoppingCart, label: "Cart Recovery",       desc: "Email & WhatsApp recovery",    color: "#D97706" },
            { icon: BarChart3, label: "Revenue Attribution",    desc: "Full-funnel analytics",        color: "#16A34A" },
            { icon: TrendingUp, label: "Repeat Purchase Rate",  desc: "Retention tracking",           color: "#16A34A" },
            { icon: Megaphone, label: "Audit Trail",            desc: "Every action logged",          color: "#6B7280" },
          ].map(({ icon: I, label, desc, color }) => (
            <div key={label} className="flex items-start gap-2.5">
              <div className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                <I className="h-3.5 w-3.5" style={{ color }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#374151]">{label}</p>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Provider notice */}
      <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 flex items-start gap-3">
        <Send className="h-4 w-4 text-[#2563EB] shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-[#1E40AF]">Email & WhatsApp providers not yet connected</p>
          <p className="text-xs text-[#3B82F6] mt-0.5">
            Campaign workflow, scheduling, targeting, and analytics are fully built.
            Connect Resend (email) and a WhatsApp Business API provider when ready — no code changes needed, just add the send call in the campaign&apos;s <code className="bg-white/60 px-1 rounded text-[10px]">STARTED</code> event handler.
          </p>
        </div>
      </div>
    </div>
  );
}
