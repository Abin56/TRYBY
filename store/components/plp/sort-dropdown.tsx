"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/cn";
const SORT_OPTIONS = [
  { label: "Trending",           value: "totalSoldCount_desc" },
  { label: "Price: Low to High", value: "price_asc"           },
  { label: "Price: High to Low", value: "price_desc"          },
  { label: "Best Rated",         value: "avgRating_desc"      },
  { label: "Newest",             value: "createdAt_desc"      },
];

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function SortDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-9 px-3.5 rounded-xl border border-[#E0E0E0] bg-white text-[13px] font-semibold text-[#0D0D0D] hover:border-[#0D0D0D] transition-colors duration-150 whitespace-nowrap"
        style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.03em" }}
      >
        Sort: {current.label}
        <ChevronDown className={cn("h-3.5 w-3.5 text-[#9CA3AF] transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                "flex w-full items-center justify-between px-4 py-2.5 text-[13px] transition-colors duration-100",
                opt.value === value
                  ? "bg-[#F5C518]/10 text-[#0D0D0D] font-semibold"
                  : "text-[#555] hover:bg-[#F9F9F9] hover:text-[#0D0D0D]"
              )}
            >
              {opt.label}
              {opt.value === value && <Check className="h-3.5 w-3.5 text-[#0D0D0D]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
