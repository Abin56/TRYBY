"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import type { PLPProduct } from "@/data/plp-mock";
import { JerseyImage } from "@/components/ui/jersey-image";

const BADGE_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  hot:  { label: "HOT",  bg: "#F5C518",  color: "#0D0D0D" },
  new:  { label: "NEW",  bg: "#059669",  color: "#ffffff" },
  sale: { label: "SALE", bg: "#DC2626",  color: "#ffffff" },
};

export function PLPProductCard({ product }: { product: PLPProduct }) {
  const [wishlisted, setWishlisted] = useState(false);
  const discountPct = Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100);
  const badge = product.badge ? BADGE_STYLES[product.badge] : null;

  return (
    <div className="group flex flex-col rounded-2xl overflow-hidden bg-[#F5F5F5] hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] transition-shadow duration-300">

      {/* ── Image ── */}
      <Link href={`/products/${product.slug}`} className="relative block overflow-hidden" style={{ aspectRatio: "1 / 1" }}>
        <JerseyImage
          src={product.image}
          alt={product.name}
          slug={product.slug}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 p-2"
        />

        {/* Discount badge — dark, top left */}
        <span
          className="absolute top-2.5 left-2.5 rounded-md px-2 py-0.5 text-[11px] font-bold text-white leading-none"
          style={{ background: "rgba(0,0,0,0.72)" }}
        >
          -{discountPct}%
        </span>

        {/* Category badge — top left below discount */}
        {badge && (
          <span
            className="absolute top-8 left-2.5 rounded-md px-2 py-0.5 text-[10px] font-black leading-none"
            style={{ background: badge.bg, color: badge.color, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}
          >
            {badge.label}
          </span>
        )}

        {/* Wishlist — top right */}
        <button
          onClick={(e) => { e.preventDefault(); setWishlisted((w) => !w); }}
          className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform duration-150"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className="h-3.5 w-3.5"
            fill={wishlisted ? "#DC2626" : "none"}
            stroke={wishlisted ? "#DC2626" : "#9CA3AF"}
            strokeWidth={2}
          />
        </button>
      </Link>

      {/* ── Info ── */}
      <div className="flex flex-col gap-1.5 p-3">
        {/* Club / country tag */}
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider leading-none">
          {product.club ?? product.country ?? product.category}
        </p>

        {/* Name */}
        <Link href={`/products/${product.slug}`}>
          <p className="text-[13px] font-semibold text-[#111827] leading-snug line-clamp-2 hover:text-[#0D0D0D] transition-colors" style={{ minHeight: "30px" }}>
            {product.name}
          </p>
        </Link>

        {/* Stars */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className="h-2.5 w-2.5"
                fill={s <= Math.round(product.rating) ? "#F5C518" : "none"}
                stroke="#F5C518"
                strokeWidth={1.5}
              />
            ))}
          </div>
          <span className="text-[10px] text-[#9CA3AF]">{product.rating} ({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-[14px] font-black text-[#111827]">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-[#9CA3AF] line-through">
            ₹{product.comparePrice.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </div>
  );
}
