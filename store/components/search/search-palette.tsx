"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Clock, TrendingUp, X, Command } from "lucide-react";
import Link from "next/link";
import { trendingProducts } from "@/data/mock";
import { cn } from "@/lib/cn";

const TRENDING_SEARCHES = [
  "Desk organizer",
  "Posture corrector",
  "Travel bags",
  "LED lamp",
  "Milk frother",
  "Cable organizer",
];

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

interface SearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchPalette({ isOpen, onClose }: SearchPaletteProps) {
  const [query, setQuery]       = useState("");
  const [selected, setSelected] = useState(-1);
  const [recent, setRecent]     = useState<string[]>([]);
  const inputRef                = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("trenddrop-searches") ?? "[]");
      setRecent(stored.slice(0, 4));
    } catch { /* ignore */ }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
      setQuery("");
      setSelected(-1);
    }
  }, [isOpen]);

  const results = query.trim().length > 0
    ? trendingProducts.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        p.tagline.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  const saveSearch = useCallback((term: string) => {
    try {
      const prev = JSON.parse(localStorage.getItem("trenddrop-searches") ?? "[]") as string[];
      const updated = [term, ...prev.filter((s) => s !== term)].slice(0, 6);
      localStorage.setItem("trenddrop-searches", JSON.stringify(updated));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const totalItems = results.length || TRENDING_SEARCHES.length;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, totalItems - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, -1)); }
      if (e.key === "Enter" && selected >= 0 && results[selected]) {
        saveSearch(query);
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, selected, results, query, onClose, saveSearch]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[350] bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed top-[8vh] left-1/2 z-[400] w-full max-w-2xl -translate-x-1/2 rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_24px_80px_rgba(0,0,0,0.15)] overflow-hidden"
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F3F4F6]">
              <Search className="h-5 w-5 text-[#9CA3AF] shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(-1); }}
                placeholder="Search useful products..."
                className="flex-1 bg-transparent text-base text-[#111827] placeholder:text-[#9CA3AF] outline-none"
              />
              {query ? (
                <button
                  onClick={() => { setQuery(""); setSelected(-1); }}
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-1 text-[10px] text-[#9CA3AF]">
                  Esc
                </kbd>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {/* Product results */}
              {results.length > 0 && (
                <div className="p-2">
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
                    Products
                  </p>
                  {results.map((product, i) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={() => { saveSearch(query); onClose(); }}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-4 rounded-xl px-3 py-2.5 cursor-pointer transition-colors duration-100",
                          selected === i ? "bg-[#F5F5F7]" : "hover:bg-[#F9FAFB]"
                        )}
                        onMouseEnter={() => setSelected(i)}
                      >
                        <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden bg-[#F3F4F6] border border-[#E5E7EB]">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#111827] truncate">{product.name}</p>
                          <p className="text-xs text-[#9CA3AF] truncate">{product.category}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-[#111827]">{formatPrice(product.price)}</p>
                          <div className="flex items-center justify-end gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <span key={s} className={cn("text-[10px]", s <= Math.round(product.rating) ? "text-[#F59E0B]" : "text-[#D1D5DB]")}>★</span>
                            ))}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#D1D5DB] shrink-0" />
                      </div>
                    </Link>
                  ))}

                  <Link
                    href={`/products?q=${encodeURIComponent(query)}`}
                    onClick={() => { saveSearch(query); onClose(); }}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#2563EB] hover:bg-[#EFF6FF] transition-colors duration-100"
                  >
                    <Search className="h-4 w-4" />
                    See all results for &ldquo;{query}&rdquo;
                    <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                  </Link>
                </div>
              )}

              {/* No results */}
              {query.trim().length > 0 && results.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Search className="h-8 w-8 text-[#D1D5DB]" />
                  <p className="text-sm font-semibold text-[#111827]">No results for &ldquo;{query}&rdquo;</p>
                  <p className="text-xs text-[#9CA3AF]">Try different keywords or browse categories</p>
                </div>
              )}

              {/* Default — no query */}
              {query.trim().length === 0 && (
                <div className="p-2 space-y-1">
                  {recent.length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
                        Recent
                      </p>
                      {recent.map((term, i) => (
                        <button
                          key={i}
                          onClick={() => setQuery(term)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#374151] hover:text-[#111827] hover:bg-[#F9FAFB] transition-colors duration-100"
                        >
                          <Clock className="h-4 w-4 text-[#9CA3AF] shrink-0" />
                          {term}
                        </button>
                      ))}
                    </div>
                  )}

                  <div>
                    <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
                      Trending Searches
                    </p>
                    <div className="px-3 py-2 flex flex-wrap gap-2">
                      {TRENDING_SEARCHES.map((term) => (
                        <button
                          key={term}
                          onClick={() => setQuery(term)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1.5 text-xs font-medium text-[#374151] hover:text-[#111827] hover:border-[#D1D5DB] hover:bg-[#F3F4F6] transition-all duration-150"
                        >
                          <TrendingUp className="h-3 w-3 text-[#2563EB]" />
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
                      Popular Right Now
                    </p>
                    {trendingProducts.slice(0, 3).map((p, i) => (
                      <Link
                        key={p.id}
                        href={`/products/${p.slug}`}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-4 rounded-xl px-3 py-2.5 transition-colors duration-100",
                          selected === i ? "bg-[#F5F5F7]" : "hover:bg-[#F9FAFB]"
                        )}
                      >
                        <div className="h-8 w-8 shrink-0 rounded-lg overflow-hidden border border-[#E5E7EB]">
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <p className="flex-1 text-sm text-[#374151] hover:text-[#111827] truncate transition-colors">
                          {p.name}
                        </p>
                        <span className="text-xs font-semibold text-[#111827]">{formatPrice(p.price)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#F3F4F6] bg-[#FAFAFA]">
              <div className="flex items-center gap-3 text-[11px] text-[#9CA3AF]">
                <span className="flex items-center gap-1">
                  <kbd className="rounded-md border border-[#E5E7EB] bg-white px-1.5 py-0.5 text-[10px]">↑↓</kbd> navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded-md border border-[#E5E7EB] bg-white px-1.5 py-0.5 text-[10px]">↵</kbd> select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded-md border border-[#E5E7EB] bg-white px-1.5 py-0.5 text-[10px]">Esc</kbd> close
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                <Command className="h-3 w-3" />
                <span>K to open</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
