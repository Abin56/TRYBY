"use client";

import { Minus, Plus } from "lucide-react";

type Props = { value: number; onChange: (n: number) => void; max?: number };

export function QuantitySelector({ value, onChange, max = 10 }: Props) {
  return (
    <div className="flex items-center gap-0 rounded-xl border border-[#E0E0E0] bg-white overflow-hidden w-fit">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="flex h-12 w-12 items-center justify-center text-[#555] hover:text-[#0D0D0D] hover:bg-[#F5F5F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 active:bg-[#EBEBEB]"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>

      <span
        className="flex h-12 w-14 items-center justify-center border-x border-[#E0E0E0] text-[16px] font-bold text-[#0D0D0D] select-none"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        aria-live="polite"
        aria-label={`Quantity: ${value}`}
      >
        {value}
      </span>

      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-12 w-12 items-center justify-center text-[#555] hover:text-[#0D0D0D] hover:bg-[#F5F5F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 active:bg-[#EBEBEB]"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
