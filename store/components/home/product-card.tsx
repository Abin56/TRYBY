"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { type Product } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { useCartStore } from "@/store/cart";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);
}

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCartStore();

  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      variantId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      image: product.image,
      category: product.category,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: "easeOut" }}
    >
      <Link href={`/products/${product.slug}`}>
        <div
          className="group relative flex flex-col rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] hover:border-[#D1D5DB] transition-all duration-300"
          style={{ transform: hovered ? "translateY(-4px)" : "translateY(0)", transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s cubic-bezier(0.16,1,0.3,1), border-color 0.25s" }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-[#F9FAFB]">
            <img
              src={product.image}
              alt={product.name}
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-all duration-500",
                hovered && product.hoverImage ? "opacity-0 scale-105" : "opacity-100 scale-100"
              )}
            />
            {product.hoverImage && (
              <img
                src={product.hoverImage}
                alt={product.name}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-all duration-500",
                  hovered ? "opacity-100 scale-100" : "opacity-0 scale-105"
                )}
              />
            )}

            {/* Badge */}
            {product.badge && (
              <div className="absolute top-3 left-3 z-10">
                <Badge variant={product.badge} />
              </div>
            )}

            {/* Discount */}
            {discount && (
              <div className="absolute top-3 right-3 z-10 rounded-full bg-[#DC2626] px-2 py-0.5 text-[10px] font-bold text-white">
                -{discount}%
              </div>
            )}

            {/* Wishlist button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={hovered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => {
                e.preventDefault();
                setWishlisted((w) => !w);
              }}
              className="absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-[#E5E7EB] shadow-sm text-[#9CA3AF] hover:text-[#111827] transition-colors duration-150"
            >
              <Heart
                className="h-3.5 w-3.5"
                fill={wishlisted ? "#DC2626" : "none"}
                stroke={wishlisted ? "#DC2626" : "currentColor"}
              />
            </motion.button>

            {/* Quick add */}
            <motion.button
              initial={{ y: "100%", opacity: 0 }}
              animate={hovered ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={handleAddToCart}
              className={cn(
                "absolute bottom-0 inset-x-0 z-10 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors duration-150",
                addedToCart
                  ? "bg-[#059669] text-white"
                  : "bg-[#111827] text-white hover:bg-[#1F2937]"
              )}
            >
              {addedToCart ? (
                <>✓ Added!</>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Quick Add
                </>
              )}
            </motion.button>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-1.5 p-4">
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">{product.category}</p>
            <h3 className="text-sm font-semibold text-[#111827] leading-snug line-clamp-2 group-hover:text-[#2563EB] transition-colors duration-150">
              {product.name}
            </h3>
            <p className="text-xs text-[#9CA3AF] line-clamp-1">{product.tagline}</p>

            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="h-3 w-3"
                    fill={s <= Math.round(product.rating) ? "#F59E0B" : "none"}
                    stroke={s <= Math.round(product.rating) ? "#F59E0B" : "#D1D5DB"}
                  />
                ))}
              </div>
              <span className="text-xs text-[#6B7280]">
                {product.rating} ({product.reviewCount.toLocaleString("en-IN")})
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-[#111827]">{formatPrice(product.price)}</span>
              {product.compareAtPrice && (
                <span className="text-sm text-[#9CA3AF] line-through">{formatPrice(product.compareAtPrice)}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
