"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Star, ArrowRight } from "lucide-react";
import { JerseyImage } from "@/components/ui/jersey-image";

interface TrendingProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number;
  rating: number;
  reviewCount: number;
  image: string;
  href: string;
  isNew?: boolean;
  isSale?: boolean;
}

function discountPct(price: number, comparePrice: number) {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

function ProductCard({ product }: { product: TrendingProduct }) {
  const [wishlisted, setWishlisted] = useState(false);
  const pct = discountPct(product.price, product.comparePrice);

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden bg-[#F5F5F5]" style={{ width: "168px" }}>
      <Link href={product.href} className="relative block bg-[#F5F5F5]" style={{ aspectRatio: "1/1" }}>
        <JerseyImage
          src={product.image}
          alt={product.name}
          slug={product.slug}
          className="w-full h-full object-contain p-2"
        />

        {pct > 0 && (
          <span
            className="absolute top-2 left-2 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white leading-none"
            style={{ background: "rgba(0,0,0,0.75)" }}
          >
            -{pct}%
          </span>
        )}

        {product.isNew && !pct && (
          <span
            className="absolute top-2 left-2 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white leading-none"
            style={{ background: "#F5C518", color: "#0D0D0D" }}
          >
            NEW
          </span>
        )}

        <button
          onClick={(e) => { e.preventDefault(); setWishlisted((w) => !w); }}
          className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className="h-3 w-3"
            fill={wishlisted ? "#E53E3E" : "none"}
            stroke={wishlisted ? "#E53E3E" : "#6B7280"}
            strokeWidth={2}
          />
        </button>
      </Link>

      <div className="flex flex-col gap-1.5 p-2.5">
        <Link href={product.href}>
          <p
            className="text-[12px] font-semibold text-[#111827] leading-snug line-clamp-2 hover:text-[#0D0D0D]"
            style={{ minHeight: "32px" }}
          >
            {product.name}
          </p>
        </Link>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className="h-2.5 w-2.5"
              fill={s <= Math.round(product.rating) ? "#F5C518" : "none"}
              stroke="#F5C518"
              strokeWidth={1.5}
            />
          ))}
          <span className="text-[10px] text-[#6B7280] ml-0.5">
            {product.rating.toFixed(1)} ({product.reviewCount})
          </span>
        </div>

        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[13px] font-black text-[#111827]">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          {product.comparePrice > product.price && (
            <span className="text-[11px] text-[#9CA3AF] line-through">
              ₹{product.comparePrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function NewArrivalsCard() {
  return (
    <Link
      href="/products?filter=new"
      className="group relative flex flex-col justify-end shrink-0 overflow-hidden rounded-2xl"
      style={{ width: "200px", minHeight: "100%" }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-15">
        <svg viewBox="0 0 200 220" fill="none" className="w-3/4">
          <path
            d="M60 50 L20 80 L35 95 L55 80 L55 170 L145 170 L145 80 L165 95 L180 80 L140 50 Q130 40 115 38 Q108 55 100 55 Q92 55 85 38 Q70 40 60 50Z"
            fill="#F5C518"
          />
        </svg>
      </div>
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%)" }}
        aria-hidden="true"
      />
      <div className="relative z-10 p-4">
        <p
          className="text-white font-bold text-[13px] leading-tight tracking-wide"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}
        >
          NEW ARRIVALS
        </p>
        <p
          className="leading-tight mb-4"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", fontWeight: 800, fontStyle: "italic", color: "#F5C518", letterSpacing: "0.02em" }}
        >
          Just In!
        </p>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold text-[#0D0D0D] transition-all duration-200 group-hover:brightness-110"
          style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}
        >
          Explore Now <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

export function TrendingGearClient({ products }: { products: TrendingProduct[] }) {
  // Fall back to empty state gracefully when DB has no trending products yet
  if (!products.length) return null;

  return (
    <section className="bg-white py-6 sm:py-8" aria-labelledby="trending-heading">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2
            id="trending-heading"
            className="text-[#111827] font-bold"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", letterSpacing: "0.02em" }}
          >
            🔥 Trending Now
          </h2>
          <Link
            href="/products?filter=trending"
            className="flex items-center gap-1 text-[13px] font-semibold text-[#111827] hover:text-[#F5C518] transition-colors duration-150"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.03em" }}
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex gap-3 items-stretch">
          <div className="relative flex-1 min-w-0">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
              {products.map((product) => (
                <div key={product.id} className="snap-start shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
              <div className="flex-none w-2 shrink-0 lg:hidden" aria-hidden="true" />
            </div>
            <div
              className="lg:hidden pointer-events-none absolute inset-y-0 right-0 w-10"
              style={{ background: "linear-gradient(to right, transparent, #ffffff)" }}
              aria-hidden="true"
            />
          </div>
          <div className="hidden lg:flex shrink-0" style={{ minHeight: "280px" }}>
            <NewArrivalsCard />
          </div>
        </div>
      </div>
    </section>
  );
}
