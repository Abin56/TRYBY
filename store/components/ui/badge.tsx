import { cn } from "@/lib/cn";

type BadgeVariant = "trending" | "viral" | "new" | "sale" | "verified" | "default";

const variantMap: Record<BadgeVariant, string> = {
  trending:
    "bg-[rgba(37,99,235,0.15)] border border-[rgba(37,99,235,0.3)] text-[#60A5FA]",
  viral:
    "bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] text-[#F87171]",
  new: "bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.3)] text-[#34D399]",
  sale: "bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.3)] text-[#FBBF24]",
  verified:
    "bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.3)] text-[#34D399]",
  default: "bg-[#161616] border border-[#2D2D2D] text-[#9CA3AF]",
};

const labelMap: Record<BadgeVariant, string> = {
  trending: "🔥 Trending",
  viral:    "📈 Going Viral",
  new:      "✨ New",
  sale:     "🏷️ Sale",
  verified: "✓ Verified",
  default:  "",
};

interface BadgeProps {
  variant?: BadgeVariant;
  label?: string;
  className?: string;
}

export function Badge({ variant = "default", label, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        variantMap[variant],
        className
      )}
    >
      {label ?? labelMap[variant]}
    </span>
  );
}
