"use client";

import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";
import { forwardRef } from "react";

export interface VariantOption {
  id: string;
  size: string;
  stock: number;
  price: number;
  mrp: number;
  sku: string;
}

type Props = {
  /** Pass real variant data from DB; falls back to legacy size-only mode if not provided */
  variants?: VariantOption[];
  /** Legacy: plain size strings — used only when `variants` is not provided */
  sizes?: string[];
  selected:    string;            // selected size string
  onChange:    (size: string, variant?: VariantOption) => void;
  outOfStock?: string[];          // ignored when `variants` is provided (stock is on each variant)
  hasError?:   boolean;
  highlight?:  boolean;
};

// Fallback sizes used only when no variants prop provided
const FALLBACK_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export const SizeSelector = forwardRef<HTMLDivElement, Props>(
  function SizeSelector(
    { variants, sizes, selected, onChange, outOfStock = [], hasError = false, highlight = false },
    ref
  ) {
    // Build the option list from variants or fallback
    const options: Array<{ label: string; oos: boolean; variant?: VariantOption }> =
      variants?.length
        ? variants.map((v) => ({
            label:   v.size,
            oos:     v.stock === 0,
            variant: v,
          }))
        : (sizes ?? FALLBACK_SIZES).map((s) => ({
            label: s,
            oos:   outOfStock.includes(s),
          }));

    return (
      <div ref={ref}>
        <div className="flex items-center justify-between mb-2.5">
          <span
            className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#0D0D0D]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Size
            {selected && (
              <span className="ml-2 font-semibold text-[#555]">— {selected}</span>
            )}
          </span>
          <button className="text-[11px] font-semibold text-[#F5C518] hover:underline underline-offset-2">
            Size guide
          </button>
        </div>

        <motion.div
          animate={
            highlight
              ? { scale: [1, 1.025, 1], boxShadow: ["0 0 0px rgba(245,197,24,0)", "0 0 0 3px rgba(245,197,24,0.45)", "0 0 0 2px rgba(245,197,24,0.22)", "0 0 0px rgba(245,197,24,0)"] }
              : {}
          }
          transition={{ duration: 0.65, ease: "easeInOut" }}
          className="flex flex-wrap gap-2 rounded-xl p-1 -m-1"
        >
          {options.map(({ label, oos, variant }) => {
            const active    = selected === label;
            const showErr   = hasError && !oos && !active;

            return (
              <motion.button
                key={label}
                onClick={() => !oos && onChange(label, variant)}
                disabled={oos}
                whileTap={!oos ? { scale: 0.93 } : {}}
                className={cn(
                  "relative flex h-10 w-12 items-center justify-center rounded-xl border text-[13px] font-bold transition-colors duration-150",
                  oos
                    ? "border-[#E0E0E0] text-[#C0C0C0] cursor-not-allowed bg-white"
                    : active
                    ? "border-[#0D0D0D] bg-[#0D0D0D] text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                    : showErr
                    ? "border-[#DC2626] bg-white text-[#0D0D0D] hover:border-[#DC2626]"
                    : "border-[#E0E0E0] bg-white text-[#0D0D0D] hover:border-[#0D0D0D]"
                )}
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}
                aria-label={`Size ${label}${oos ? " — out of stock" : variant ? ` — ₹${variant.price}` : ""}`}
                aria-pressed={active}
                aria-invalid={showErr ? "true" : undefined}
              >
                {label}
                {oos && (
                  <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none" aria-hidden="true">
                    <svg width="100%" height="100%" viewBox="0 0 48 40">
                      <line x1="4" y1="36" x2="44" y2="4" stroke="#D0D0D0" strokeWidth="1.2" />
                    </svg>
                  </span>
                )}
                {/* Stock warning dot for low-stock variants */}
                {!oos && variant && variant.stock > 0 && variant.stock <= 5 && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#F59E0B]" aria-hidden="true" />
                )}
              </motion.button>
            );
          })}
        </motion.div>

        <AnimatePresence>
          {hasError && !selected && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="mt-2.5 flex items-center gap-1.5 text-[12px] font-medium text-[#DC2626]"
            >
              <span aria-hidden="true">⚠</span>
              Select your preferred size to add this jersey
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
