"use client";

import { ShieldCheck, Truck, RotateCcw, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/cn";

export type TrustVariant = "dark" | "light" | "minimal";

const BADGES = [
  {
    id: "secure",
    icon: ShieldCheck,
    label: "Secure Payments",
    sub: "256-bit SSL · Razorpay",
    color: "#22C55E",
  },
  {
    id: "delivery",
    icon: Truck,
    label: "Fast Delivery",
    sub: "Ships within 24h",
    color: "#3B82F6",
  },
  {
    id: "returns",
    icon: RotateCcw,
    label: "Easy Returns",
    sub: "7-day hassle-free",
    color: "#F59E0B",
  },
  {
    id: "verified",
    icon: BadgeCheck,
    label: "Verified Suppliers",
    sub: "Quality guaranteed",
    color: "#8B5CF6",
  },
];

interface TrustBadgeStripProps {
  variant?: TrustVariant;
  /** show only a subset: "secure" | "delivery" | "returns" | "verified" */
  show?: string[];
  className?: string;
  compact?: boolean;
}

export function TrustBadgeStrip({
  variant = "light",
  show,
  className,
  compact = false,
}: TrustBadgeStripProps) {
  const badges = show ? BADGES.filter((b) => show.includes(b.id)) : BADGES;

  const isDark    = variant === "dark";
  const isMinimal = variant === "minimal";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2 sm:gap-4",
        className
      )}
    >
      {badges.map(({ id, icon: Icon, label, sub, color }) => (
        <div
          key={id}
          className={cn(
            "flex items-center gap-2 rounded-xl transition-all duration-200",
            compact ? "px-3 py-2" : "px-4 py-3",
            isMinimal
              ? "gap-1.5"
              : isDark
              ? "bg-white/[0.05] border border-white/[0.08] hover:border-white/20"
              : "bg-white border border-[#F0F0F0] shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
          )}
        >
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-lg",
              compact ? "h-7 w-7" : "h-9 w-9"
            )}
            style={{ background: `${color}18` }}
          >
            <Icon
              className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
              style={{ color }}
              strokeWidth={2.2}
            />
          </div>
          <div className={isMinimal ? "hidden sm:block" : "block"}>
            <p
              className={cn(
                "font-bold leading-none",
                compact ? "text-[11px]" : "text-[12px]",
                isDark ? "text-white" : "text-[#0D0D0D]"
              )}
              style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.03em" }}
            >
              {label}
            </p>
            {!compact && (
              <p
                className={cn(
                  "text-[10px] mt-0.5 leading-none",
                  isDark ? "text-white/45" : "text-[#9CA3AF]"
                )}
              >
                {sub}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
