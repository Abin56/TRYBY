"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
const SPORTS = ["All", "FOOTBALL", "CRICKET", "BASKETBALL", "RUNNING", "GYM"];
const CATEGORIES = ["All", "Club Jersey", "National Jersey", "Retro Jersey", "Training Kit", "Gym Wear"];
const PRICE_RANGES = [
  { label: "Under ₹500",  min: 0,    max: 500  },
  { label: "₹500 – ₹799", min: 500,  max: 799  },
  { label: "₹800 – ₹999", min: 800,  max: 999  },
  { label: "₹1000+",      min: 1000, max: 99999 },
];

type Filters = {
  sport: string;
  category: string;
  priceRange: string;
  rating: number;
};

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

function AccordionSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#F0F0F0] last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-3.5 text-left"
      >
        <span
          className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#0D0D0D]"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {title}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-[#9CA3AF] transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

export function FilterSidebar({ filters, onChange }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  const pillBase = "rounded-full px-3 py-1.5 text-[12px] font-semibold border transition-all duration-150 cursor-pointer";
  const pillActive = "bg-[#0D0D0D] text-white border-[#0D0D0D]";
  const pillInactive = "bg-white text-[#555] border-[#E0E0E0] hover:border-[#0D0D0D] hover:text-[#0D0D0D]";

  return (
    <aside className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-[14px] font-black text-[#0D0D0D] uppercase tracking-wide"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Filters
        </h2>
        <button
          onClick={() => onChange({ sport: "All", category: "All", priceRange: "", rating: 0 })}
          className="text-[11px] font-semibold text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Sport */}
      <AccordionSection title="Sport">
        <div className="flex flex-wrap gap-1.5">
          {SPORTS.map((s) => (
            <button
              key={s}
              onClick={() => set({ sport: s })}
              className={cn(pillBase, filters.sport === s ? pillActive : pillInactive)}
            >
              {s}
            </button>
          ))}
        </div>
      </AccordionSection>

      {/* Category */}
      <AccordionSection title="Category">
        <div className="flex flex-col gap-1.5">
          {CATEGORIES.map((c) => (
            <label key={c} className="flex items-center gap-2.5 cursor-pointer group">
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-150",
                  filters.category === c
                    ? "border-[#0D0D0D] bg-[#0D0D0D]"
                    : "border-[#D0D0D0] bg-white group-hover:border-[#0D0D0D]"
                )}
                onClick={() => set({ category: c })}
              >
                {filters.category === c && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span
                className={cn(
                  "text-[13px] transition-colors duration-150",
                  filters.category === c ? "font-semibold text-[#0D0D0D]" : "text-[#555] group-hover:text-[#0D0D0D]"
                )}
                onClick={() => set({ category: c })}
              >
                {c}
              </span>
            </label>
          ))}
        </div>
      </AccordionSection>

      {/* Price Range */}
      <AccordionSection title="Price Range">
        <div className="flex flex-col gap-1.5">
          {PRICE_RANGES.map((r) => (
            <label key={r.label} className="flex items-center gap-2.5 cursor-pointer group">
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-150",
                  filters.priceRange === r.label
                    ? "border-[#F5C518] bg-[#F5C518]"
                    : "border-[#D0D0D0] bg-white group-hover:border-[#F5C518]"
                )}
                onClick={() => set({ priceRange: filters.priceRange === r.label ? "" : r.label })}
              >
                {filters.priceRange === r.label && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0D0D0D]" />
                )}
              </span>
              <span
                className={cn(
                  "text-[13px] transition-colors duration-150",
                  filters.priceRange === r.label ? "font-semibold text-[#0D0D0D]" : "text-[#555] group-hover:text-[#0D0D0D]"
                )}
                onClick={() => set({ priceRange: filters.priceRange === r.label ? "" : r.label })}
              >
                {r.label}
              </span>
            </label>
          ))}
        </div>
      </AccordionSection>

      {/* Rating */}
      <AccordionSection title="Minimum Rating">
        <div className="flex flex-col gap-1.5">
          {[0, 3, 4, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => set({ rating: r })}
              className={cn(
                "flex items-center gap-2 text-left text-[13px] transition-colors duration-150",
                filters.rating === r ? "font-semibold text-[#0D0D0D]" : "text-[#555] hover:text-[#0D0D0D]"
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-150",
                  filters.rating === r ? "border-[#F5C518] bg-[#F5C518]" : "border-[#D0D0D0]"
                )}
              >
                {filters.rating === r && <span className="h-1.5 w-1.5 rounded-full bg-[#0D0D0D]" />}
              </span>
              {r === 0 ? "All ratings" : `${r}★ & above`}
            </button>
          ))}
        </div>
      </AccordionSection>
    </aside>
  );
}
