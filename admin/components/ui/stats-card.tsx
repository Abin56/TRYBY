"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import { pctChange } from "@/lib/format";

interface StatsCardProps {
  label: string;
  value: string;
  prev?: number;
  current?: number;
  icon: React.ReactNode;
  iconBg?: string;
  loading?: boolean;
  suffix?: string;
  index?: number;
}

export function StatsCard({ label, value, prev, current, icon, iconBg = "#EFF6FF", loading, suffix, index = 0 }: StatsCardProps) {
  const pct = prev !== undefined && current !== undefined ? pctChange(current, prev) : null;
  const up   = pct !== null && pct > 0;
  const down = pct !== null && pct < 0;

  if (loading) {
    return (
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-9 w-9 rounded-lg" />
        </div>
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-3 w-20" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: "easeOut" }}
      className="rounded-xl border border-[#E5E7EB] bg-white p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <p className="text-sm font-medium text-[#6B7280]">{label}</p>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: iconBg }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-extrabold text-[#111827] tabular-nums mb-1">
        {value}{suffix && <span className="text-base font-semibold text-[#6B7280] ml-1">{suffix}</span>}
      </p>
      {pct !== null && (
        <div className={cn("flex items-center gap-1 text-xs font-semibold", up ? "text-[#16A34A]" : down ? "text-[#DC2626]" : "text-[#6B7280]")}>
          {up ? <TrendingUp className="h-3 w-3" /> : down ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          {up && "+"}{pct.toFixed(1)}% vs last period
        </div>
      )}
    </motion.div>
  );
}
