"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  Star, Heart, ShoppingCart, Zap,
  ChevronRight, Check, Truck, RotateCcw, ShieldCheck,
} from "lucide-react";
import { PincodeChecker } from "@/components/shipping/pincode-checker";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { useCartStore } from "@/store/cart";
import { PDPGallery } from "@/components/pdp/pdp-gallery";
import { SizeSelector, type VariantOption } from "@/components/pdp/size-selector";
import { QuantitySelector } from "@/components/pdp/quantity-selector";
import { PDPAccordion } from "@/components/pdp/pdp-accordion";
import { PLPProductCard } from "@/components/plp/plp-product-card";
import { SizeToast } from "@/components/pdp/size-toast";
import { ReviewList } from "@/components/reviews/review-list";
import type { ToastKind } from "@/components/pdp/size-toast";
import type { Easing } from "framer-motion";

const SHAKE = {
  x: [0, -7, 7, -5, 5, -3, 3, 0],
  transition: { duration: 0.42, ease: "easeInOut" as Easing },
};

export type DBProductFull = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sport: string;
  teamName?: string | null;
  leagueName?: string | null;
  teamBadgeUrl?: string | null;
  avgRating: number;
  reviewCount: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  images: { url: string; isPrimary: boolean; altText?: string | null; sortOrder: number }[];
  variants: { id: string; size?: string | null; color?: string | null; price: number; mrp: number; stock: number; sku?: string | null; isActive: boolean }[];
  badges: { label: string; color?: string | null }[];
  category?: { name: string; slug: string } | null;
};

export type RelatedProduct = {
  id: string;
  name: string;
  slug: string;
  avgRating: number;
  reviewCount: number;
  images: { url: string; isPrimary: boolean }[];
  variants: { price: number; mrp: number }[];
  sport: string;
  teamName?: string | null;
  leagueName?: string | null;
  badges: { label: string }[];
};

type Props = {
  product: DBProductFull;
  related: RelatedProduct[];
};

export function PDPClient({ product, related }: Props) {
  const sortedImages = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const imageUrls = sortedImages.map((i) => i.url);
  const fallbackImage = imageUrls[0] ?? "/og-image.png";

  const activeVariants: VariantOption[] = product.variants
    .filter((v) => v.isActive)
    .map((v) => ({
      id: v.id,
      size: v.size ?? "One Size",
      stock: v.stock,
      price: v.price,
      mrp: v.mrp,
      sku: v.sku ?? "",
    }));

  const lowestVariant = product.variants.reduce(
    (best, v) => (!best || v.price < best.price ? v : best),
    null as null | (typeof product.variants)[0]
  );

  const [selectedSize,    setSelectedSize]    = useState("");
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | undefined>();
  const [qty,             setQty]             = useState(1);
  const [wishlisted,      setWishlisted]      = useState(false);
  const [sizeError,       setSizeError]       = useState(false);
  const [sizeHighlight,   setSizeHighlight]   = useState(false);
  const [shakeAtc,        setShakeAtc]        = useState(false);
  const [shakeBuy,        setShakeBuy]        = useState(false);
  const [shakeMobile,     setShakeMobile]     = useState(false);
  const [addedToCart,     setAddedToCart]     = useState(false);
  const [toast, setToast] = useState<{ show: boolean; kind: ToastKind; message: string }>({ show: false, kind: "error", message: "" });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sizeRef    = useRef<HTMLDivElement | null>(null);
  const { addItem, openCart } = useCartStore();

  const activePrice   = selectedVariant?.price ?? lowestVariant?.price ?? 0;
  const activeCompare = selectedVariant?.mrp   ?? lowestVariant?.mrp   ?? activePrice;
  const activePct     = activeCompare > activePrice ? Math.round(((activeCompare - activePrice) / activeCompare) * 100) : 0;
  const activeStock   = selectedVariant?.stock;
  const isInStock     = activeStock === undefined || activeStock > 0;
  const isLowStock    = activeStock !== undefined && activeStock > 0 && activeStock <= 5;

  const showToast = useCallback((kind: ToastKind, message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ show: true, kind, message });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), kind === "success" ? 2200 : 3000);
  }, []);

  const triggerSizeValidation = useCallback((target: "atc" | "buy" | "mobile") => {
    setSizeError(true);
    if (target === "atc")    { setShakeAtc(true);    setTimeout(() => setShakeAtc(false),    450); }
    if (target === "buy")    { setShakeBuy(true);    setTimeout(() => setShakeBuy(false),    450); }
    if (target === "mobile") { setShakeMobile(true); setTimeout(() => setShakeMobile(false), 450); }
    showToast("error", "Please select a size before continuing");
    setSizeHighlight(true);
    setTimeout(() => setSizeHighlight(false), 750);
    requestAnimationFrame(() => sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }, [showToast]);

  const handleSizeChange = useCallback((size: string, variant?: VariantOption) => {
    setSelectedSize(size);
    setSelectedVariant(variant);
    setSizeError(false);
  }, []);

  const handleAddToCart = useCallback((target: "atc" | "mobile" = "atc") => {
    if (!selectedSize) { triggerSizeValidation(target); return; }
    setSizeError(false);
    for (let i = 0; i < qty; i++) {
      addItem({
        id:             selectedVariant?.id ?? `${product.id}-${selectedSize}`,
        variantId:      selectedVariant?.id ?? `${product.id}-${selectedSize}`,
        name:           `${product.name} (${selectedSize})`,
        slug:           product.slug,
        price:          activePrice,
        compareAtPrice: activeCompare,
        image:          fallbackImage,
        category:       product.category?.name ?? product.sport,
      });
    }
    setAddedToCart(true);
    showToast("success", "Added to Cart ✓");
    setTimeout(() => setAddedToCart(false), 1800);
  }, [selectedSize, selectedVariant, qty, product, activePrice, activeCompare, fallbackImage, addItem, triggerSizeValidation, showToast]);

  const handleBuyNow = useCallback(() => {
    if (!selectedSize) { triggerSizeValidation("buy"); return; }
    handleAddToCart("atc");
    openCart();
  }, [selectedSize, handleAddToCart, triggerSizeValidation, openCart]);

  const reviewSchemaJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": fallbackImage,
    "aggregateRating": product.reviewCount > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": (product.avgRating ?? 0).toFixed(1),
      "reviewCount": product.reviewCount,
      "bestRating": "5",
      "worstRating": "1",
    } : undefined,
  };

  const sportLabel  = product.sport ?? "";
  const teamLabel   = product.teamName ?? product.leagueName ?? product.category?.name ?? "";

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-0">
      <Script
        id="review-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchemaJsonLd) }}
      />
      <SizeToast show={toast.show} kind={toast.kind} message={toast.message} />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 py-4 text-[12px] text-[#9CA3AF] overflow-x-auto scrollbar-hide flex-nowrap" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#0D0D0D] whitespace-nowrap transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link href={`/products?sport=${sportLabel}`} className="hover:text-[#0D0D0D] whitespace-nowrap transition-colors capitalize">{sportLabel.toLowerCase()}</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-[#0D0D0D] font-medium truncate">{product.name}</span>
        </nav>

        {/* Gallery + Info */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 pb-14">
          {/* Gallery */}
          <div className="w-full lg:w-[55%] shrink-0">
            <PDPGallery
              images={imageUrls.length ? imageUrls : [fallbackImage]}
              productName={product.name}
              slug={product.slug}
              selectedVariantId={selectedVariant?.id}
            />
          </div>

          {/* Info panel */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full px-3 py-1 text-[11px] font-bold text-[#0D0D0D] uppercase tracking-widest" style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif" }}>
                {sportLabel}
              </span>
              {teamLabel && (
                <span className="text-[12px] text-[#9CA3AF] font-medium">{teamLabel}</span>
              )}
            </div>

            <h1 className="text-[#0D0D0D] font-black leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(24px, 3vw, 36px)", letterSpacing: "-0.01em" }}>
              {product.name}
            </h1>
            {product.leagueName && (
              <p className="text-[13px] text-[#9CA3AF] -mt-3">{product.leagueName}</p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-3.5 w-3.5" fill={s <= Math.round(product.avgRating ?? 0) ? "#F5C518" : "none"} stroke="#F5C518" strokeWidth={1.5} />
                ))}
              </div>
              <span className="text-[13px] font-semibold text-[#0D0D0D]">{(product.avgRating ?? 0).toFixed(1)}</span>
              <span className="text-[13px] text-[#9CA3AF]">({product.reviewCount} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-black text-[#0D0D0D]" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "32px" }}>
                ₹{activePrice.toLocaleString("en-IN")}
              </span>
              {activeCompare > activePrice && (
                <span className="text-[16px] text-[#9CA3AF] line-through">₹{activeCompare.toLocaleString("en-IN")}</span>
              )}
              {activePct > 0 && (
                <span className="rounded-md px-2.5 py-0.5 text-[12px] font-black text-white" style={{ background: "#DC2626", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>
                  {activePct}% OFF
                </span>
              )}
            </div>

            {/* Availability */}
            <div className="flex items-center gap-2 -mt-2">
              {isInStock ? (
                <>
                  <span className="flex h-2 w-2 rounded-full bg-[#059669]" />
                  <span className="text-[13px] font-semibold text-[#059669]">{isLowStock ? `Only ${activeStock} left!` : "In Stock"}</span>
                  {!isLowStock && <span className="text-[13px] text-[#9CA3AF]">· Ships within 24h</span>}
                </>
              ) : (
                <>
                  <span className="flex h-2 w-2 rounded-full bg-[#DC2626]" />
                  <span className="text-[13px] font-semibold text-[#DC2626]">Out of Stock</span>
                </>
              )}
            </div>

            <div className="h-px bg-[#F0F0F0]" />

            {/* Size selector with real variant data */}
            <SizeSelector
              ref={sizeRef}
              variants={activeVariants.length ? activeVariants : undefined}
              selected={selectedSize}
              onChange={handleSizeChange}
              hasError={sizeError}
              highlight={sizeHighlight}
            />

            {selectedVariant?.sku && (
              <p className="text-[11px] text-[#9CA3AF] -mt-3 font-mono">SKU: {selectedVariant.sku}</p>
            )}

            {/* Quantity + CTAs */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#0D0D0D]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Quantity</p>
                <QuantitySelector value={qty} onChange={setQty} max={activeStock} />
              </div>

              <div className="h-px bg-[#F0F0F0]" />

              <div className="flex items-center gap-3">
                <motion.button
                  animate={shakeAtc ? SHAKE : {}}
                  onClick={() => handleAddToCart("atc")}
                  disabled={!isInStock}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2.5 rounded-xl font-black transition-all duration-200",
                    addedToCart ? "bg-[#059669] text-white" : !isInStock ? "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed" : "bg-[#0D0D0D] text-white hover:opacity-88 active:scale-[0.98]"
                  )}
                  style={{ height: "56px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", letterSpacing: "0.06em" }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {addedToCart ? (
                      <motion.span key="added" className="flex items-center gap-2" initial={{ opacity: 0, scale: 0.82 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.82 }} transition={{ duration: 0.17 }}>
                        <Check className="h-[18px] w-[18px]" /> ADDED TO CART
                      </motion.span>
                    ) : (
                      <motion.span key="add" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.17 }}>
                        <ShoppingCart className="h-[18px] w-[18px]" /> {isInStock ? "ADD TO CART" : "OUT OF STOCK"}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                <button
                  onClick={() => setWishlisted((w) => !w)}
                  className={cn("flex shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-200 active:scale-[0.94]",
                    wishlisted ? "border-[#DC2626] bg-[#DC2626] text-white" : "border-[#E0E0E0] text-[#9CA3AF] hover:border-[#DC2626] hover:text-[#DC2626] hover:bg-[#FFF5F5]")}
                  style={{ width: "56px", height: "56px" }}
                  aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className="h-[18px] w-[18px]" fill={wishlisted ? "currentColor" : "none"} />
                </button>
              </div>

              <motion.button
                animate={shakeBuy ? SHAKE : {}}
                onClick={handleBuyNow}
                disabled={!isInStock}
                className={cn(
                  "flex w-full items-center justify-center gap-2.5 rounded-xl border-2 font-black active:scale-[0.98] transition-all duration-200",
                  !isInStock ? "border-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed" : "border-[#0D0D0D] text-[#0D0D0D] hover:bg-[#0D0D0D] hover:text-white"
                )}
                style={{ height: "56px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", letterSpacing: "0.06em" }}
              >
                <Zap className="h-[18px] w-[18px]" /> BUY NOW
              </motion.button>

              <PincodeChecker orderValue={activePrice} weightGrams={500} storageKey="tryby_delivery_pincode" />

              <div className="flex items-center justify-between pt-1 border-t border-[#F5F5F5]">
                {[{ icon: Truck, label: "Ships in 24 Hours" }, { icon: ShieldCheck, label: "Secure Checkout" }, { icon: RotateCcw, label: "Easy Returns" }].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 flex-1 text-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "#F5F5F5" }}>
                      <Icon className="h-[15px] w-[15px] text-[#059669]" strokeWidth={2.2} />
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#555] leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.02em" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Details accordion */}
        <div className="border-t border-[#F0F0F0] pt-10 pb-14">
          <h2 className="font-black text-[#0D0D0D] mb-6" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", letterSpacing: "-0.01em" }}>Product Details</h2>
          <PDPAccordion description={product.description ?? undefined} />
        </div>

        {/* Reviews */}
        <div className="border-t border-[#F0F0F0] pt-10 pb-14">
          <ReviewList
            productId={product.id}
            productName={product.name}
            canReview={true}
            summary={product.reviewCount > 0 ? {
              avgRating:   product.avgRating ?? 0,
              reviewCount: product.reviewCount,
              breakdown:   {},
            } : undefined}
          />
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="border-t border-[#F0F0F0] pt-10 pb-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-[#0D0D0D]" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", letterSpacing: "-0.01em" }}>You May Also Like</h2>
              <Link href={`/products?sport=${sportLabel}`} className="flex items-center gap-1 text-[13px] font-semibold text-[#555] hover:text-[#0D0D0D] transition-colors" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((p) => {
                const primaryImg = p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? "";
                const lowestV = p.variants.reduce((b, v) => (!b || v.price < b.price ? v : b), null as null | (typeof p.variants)[0]);
                const badgeLabel = p.badges[0]?.label?.toLowerCase();
                const badge: "new" | "sale" | "hot" | undefined = badgeLabel === "new" ? "new" : badgeLabel === "sale" ? "sale" : badgeLabel === "hot" ? "hot" : undefined;
                return (
                  <PLPProductCard
                    key={p.id}
                    product={{
                      id: p.id, name: p.name, slug: p.slug,
                      price: lowestV?.price ?? 0, comparePrice: lowestV?.mrp ?? 0,
                      rating: p.avgRating ?? 0, reviewCount: p.reviewCount ?? 0,
                      image: primaryImg, badge,
                      category: p.leagueName ?? p.teamName ?? p.sport ?? "",
                      sport: p.sport ?? "", club: p.teamName ?? undefined,
                    }}
                  />
                );
              })}
            </div>
            <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
              {related.map((p) => {
                const primaryImg = p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? "";
                const lowestV = p.variants.reduce((b, v) => (!b || v.price < b.price ? v : b), null as null | (typeof p.variants)[0]);
                const badgeLabel = p.badges[0]?.label?.toLowerCase();
                const badge: "new" | "sale" | "hot" | undefined = badgeLabel === "new" ? "new" : badgeLabel === "sale" ? "sale" : badgeLabel === "hot" ? "hot" : undefined;
                return (
                  <div key={p.id} className="snap-start shrink-0" style={{ width: "160px" }}>
                    <PLPProductCard
                      product={{
                        id: p.id, name: p.name, slug: p.slug,
                        price: lowestV?.price ?? 0, comparePrice: lowestV?.mrp ?? 0,
                        rating: p.avgRating ?? 0, reviewCount: p.reviewCount ?? 0,
                        image: primaryImg, badge,
                        category: p.leagueName ?? p.teamName ?? p.sport ?? "",
                        sport: p.sport ?? "", club: p.teamName ?? undefined,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#EBEBEB] px-4" style={{ paddingTop: "10px", paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))", boxShadow: "0 -4px 24px rgba(0,0,0,0.10)" }}>
        <div className="flex items-center justify-between mb-2.5 max-w-lg mx-auto">
          <div>
            <p className="text-[10px] text-[#9CA3AF] leading-none uppercase tracking-wide font-semibold">Price</p>
            <p className="text-[22px] font-black text-[#0D0D0D] leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>₹{activePrice.toLocaleString("en-IN")}</p>
          </div>
          {selectedSize ? (
            <span className="rounded-lg px-3 py-1 text-[12px] font-bold text-white" style={{ background: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>SIZE: {selectedSize}</span>
          ) : (
            <span className="rounded-lg px-3 py-1 text-[12px] font-bold" style={{ background: sizeError ? "rgba(220,38,38,0.08)" : "rgba(0,0,0,0.06)", color: sizeError ? "#DC2626" : "#9CA3AF", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>SELECT SIZE</span>
          )}
        </div>

        <div className="flex items-center gap-2.5 max-w-lg mx-auto">
          <motion.button
            animate={shakeMobile ? SHAKE : {}}
            onClick={() => handleAddToCart("mobile")}
            disabled={!isInStock}
            className={cn("flex items-center justify-center gap-2 rounded-xl font-black transition-all duration-200 active:scale-[0.97]", addedToCart ? "bg-[#059669] text-white" : !isInStock ? "bg-[#E5E7EB] text-[#9CA3AF]" : "bg-[#0D0D0D] text-white")}
            style={{ flex: "0 0 65%", height: "56px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px", letterSpacing: "0.06em" }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {addedToCart ? (
                <motion.span key="added" className="flex items-center gap-2" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
                  <Check className="h-[18px] w-[18px]" /> ADDED ✓
                </motion.span>
              ) : sizeError && !selectedSize ? (
                <motion.span key="warn" className="flex items-center gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
                  ⚠ SELECT SIZE FIRST
                </motion.span>
              ) : (
                <motion.span key="add" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
                  <ShoppingCart className="h-[18px] w-[18px]" /> ADD TO CART
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button
            animate={shakeBuy ? SHAKE : {}}
            onClick={handleBuyNow}
            className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#0D0D0D] font-black text-[#0D0D0D] active:scale-[0.97] transition-all duration-200"
            style={{ flex: "1", height: "56px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px", letterSpacing: "0.06em" }}
          >
            <Zap className="h-[16px] w-[16px]" /> BUY NOW
          </motion.button>

          <button
            onClick={() => setWishlisted((w) => !w)}
            className={cn("flex shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-200 active:scale-[0.94]", wishlisted ? "border-[#DC2626] bg-[#DC2626] text-white" : "border-[#E0E0E0] text-[#9CA3AF] hover:border-[#DC2626] hover:text-[#DC2626]")}
            style={{ width: "56px", height: "56px" }}
          >
            <Heart className="h-[18px] w-[18px]" fill={wishlisted ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </div>
  );
}
