"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { JerseyImage } from "@/components/ui/jersey-image";

// images: product-level (shown when no variant selected or no variant images)
// variantImages: map of variantId → image URLs (shown when that variant is selected)
type Props = {
  images: string[];
  productName: string;
  slug?: string;
  selectedVariantId?: string;
  variantImages?: Record<string, string[]>; // variantId → urls
};

export function PDPGallery({ images, productName, slug = "", selectedVariantId, variantImages }: Props) {
  // Resolve the active image list: variant-specific images first, then product images
  const activeImages = selectedVariantId && variantImages?.[selectedVariantId]?.length
    ? variantImages[selectedVariantId]
    : images;

  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const touchStart = useRef<number | null>(null);

  // Reset to first image when the resolved image list changes
  useEffect(() => { setActive(0); }, [activeImages]);

  const count = activeImages.length;
  const prev  = () => setActive((i) => (i - 1 + count) % count);
  const next  = () => setActive((i) => (i + 1) % count);

  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const delta = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) delta > 0 ? next() : prev();
    touchStart.current = null;
  };

  return (
    <div className="flex gap-3 w-full">

      {/* ── Vertical thumbnails — desktop only ── */}
      <div className="hidden md:flex flex-col gap-2 shrink-0">
        {activeImages.map((src, i) => (
          <button
            key={`${src}-${i}`}
            onClick={() => setActive(i)}
            className={cn(
              "relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-150 shrink-0",
              i === active
                ? "border-[#F5C518] shadow-[0_0_0_1px_#F5C518]"
                : "border-transparent hover:border-[#E0E0E0]"
            )}
            aria-label={`View image ${i + 1}`}
          >
            <JerseyImage src={src} alt={`${productName} thumbnail ${i + 1}`} slug={slug} className="w-full h-full object-contain" />
          </button>
        ))}
      </div>

      {/* ── Main image ── */}
      <div className="flex-1 min-w-0">
        <div
          className="relative overflow-hidden rounded-2xl bg-[#F5F5F5] aspect-square min-h-[280px] md:min-h-0 p-3"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <JerseyImage
            src={activeImages[active] ?? ""}
            alt={`${productName} — image ${active + 1}`}
            slug={slug}
            className="w-full h-full object-contain transition-opacity duration-200"
          />

          <button
            onClick={() => setZoomed(true)}
            className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm text-[#555] hover:text-[#0D0D0D] transition-colors"
            aria-label="Zoom image"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <button onClick={prev} className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md" aria-label="Previous image">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={next} className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md" aria-label="Next image">
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {activeImages.map((_, i) => (
              <button key={i} onClick={() => setActive(i)}
                className={cn("rounded-full transition-all duration-200", i === active ? "w-5 h-1.5 bg-[#F5C518]" : "w-1.5 h-1.5 bg-white/60")}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>

          <div className="md:hidden absolute top-3 right-3 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white leading-none">
            {active + 1} / {count}
          </div>
        </div>

        {/* Mobile thumbnail strip */}
        <div className="md:hidden flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
          {activeImages.map((src, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={cn("shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all", i === active ? "border-[#F5C518]" : "border-transparent")}>
              <JerseyImage src={src} alt="" slug={slug} className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Zoom lightbox ── */}
      {zoomed && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4" onClick={() => setZoomed(false)}>
          <img src={activeImages[active]} alt={productName} className="max-w-full max-h-full object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
          <button onClick={() => setZoomed(false)} className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors" aria-label="Close zoom">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
