"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

const STORAGE_KEY  = "tryby_recently_viewed";
const MAX_ITEMS    = 8;

export interface ViewedProduct {
  id:           string;
  name:         string;
  slug:         string;
  price:        number;
  comparePrice: number;
  image:        string;
  category:     string;
  viewedAt:     number;
}

// ─── Hook: track a product view ───────────────────────────────────────────────

export function useTrackProductView(product: Omit<ViewedProduct, "viewedAt"> | null) {
  useEffect(() => {
    if (!product) return;
    try {
      const stored: ViewedProduct[] = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? "[]"
      );
      const filtered = stored.filter((p) => p.id !== product.id);
      const updated  = [
        { ...product, viewedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }, [product]);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RecentlyViewedProps {
  currentProductId?: string;
  title?:            string;
  maxItems?:         number;
  className?:        string;
}

export function RecentlyViewed({
  currentProductId,
  title    = "Recently Viewed",
  maxItems = 4,
  className,
}: RecentlyViewedProps) {
  const [products, setProducts] = useState<ViewedProduct[]>([]);

  useEffect(() => {
    try {
      const stored: ViewedProduct[] = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? "[]"
      );
      const filtered = stored
        .filter((p) => p.id !== currentProductId)
        .slice(0, maxItems);
      setProducts(filtered);
    } catch {}
  }, [currentProductId, maxItems]);

  if (products.length === 0) return null;

  return (
    <section className={cn("py-10", className)}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-[20px] font-black text-[#0D0D0D]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.01em" }}
          >
            {title}
          </h2>
          <Link
            href="/products"
            className="flex items-center gap-1 text-[12px] font-semibold text-[#555] hover:text-[#0D0D0D] transition-colors"
          >
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Desktop grid */}
        <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <RecentlyViewedCard key={p.id} product={p} />
          ))}
        </div>

        {/* Mobile horizontal scroll */}
        <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
          {products.map((p) => (
            <div key={p.id} className="snap-start shrink-0" style={{ width: "160px" }}>
              <RecentlyViewedCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RecentlyViewedCard({ product }: { product: ViewedProduct }) {
  const discount =
    product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block rounded-2xl overflow-hidden bg-white border border-[#F0F0F0] hover:border-[#E0E0E0] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-300"
    >
      <div className="relative aspect-square bg-[#F8F8F8] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {discount > 0 && (
          <span
            className="absolute top-2 left-2 rounded-md px-2 py-0.5 text-[11px] font-black text-white"
            style={{ background: "#DC2626", fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {discount}% OFF
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-0.5">
          {product.category}
        </p>
        <h3 className="text-[13px] font-bold text-[#0D0D0D] leading-snug line-clamp-2 mb-2">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2">
          <span
            className="text-[16px] font-black text-[#0D0D0D]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          {discount > 0 && (
            <span className="text-[11px] text-[#9CA3AF] line-through">
              ₹{product.comparePrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
