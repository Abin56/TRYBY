"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2, Loader2, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { motion, AnimatePresence } from "framer-motion";

interface WishlistProduct {
  id:       string;
  name:     string;
  slug:     string;
  images:   { url: string; isPrimary: boolean }[];
  variants: { id: string; price: string; mrp: string; size?: string; color?: string; stock: number; isActive: boolean }[];
  badges:   { type: string }[];
  category: { name: string };
}

interface WishlistItem {
  id:        string;
  productId: string;
  createdAt: string;
  product:   WishlistProduct;
}

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function WishlistCard({ item, onRemove }: { item: WishlistItem; onRemove: (id: string) => void }) {
  const { addItem, openCart } = useCartStore();
  const [removing, setRemoving] = useState(false);

  const product = item.product;
  const image   = product.images.find(i => i.isPrimary)?.url ?? product.images[0]?.url ?? "/images/product-placeholder.jpg";
  const variant = product.variants.find(v => v.isActive && v.stock > 0) ?? product.variants[0];
  const price   = variant ? Number(variant.price) : 0;
  const mrp     = variant ? Number(variant.mrp) : 0;
  const inStock = product.variants.some(v => v.isActive && v.stock > 0);
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId }),
      });
      onRemove(item.id);
    } finally {
      setRemoving(false);
    }
  };

  const handleMoveToCart = () => {
    if (!variant || !inStock) return;
    addItem({
      id:             variant.id,
      name:           product.name,
      slug:           product.slug,
      price,
      compareAtPrice: mrp,
      image,
      category:       product.category.name,
    });
    openCart();
    handleRemove();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.22 }}
      className="group bg-white rounded-2xl border border-[#F0F0F0] overflow-hidden hover:border-[#E0E0E0] hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] transition-all duration-300"
    >
      <Link href={`/products/${product.slug}`} className="block relative aspect-square bg-[#F8F8F8] overflow-hidden">
        <img
          src={image}
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
        {!inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-[13px] font-bold text-[#9CA3AF] uppercase tracking-wider">Out of Stock</span>
          </div>
        )}
        <button
          onClick={e => { e.preventDefault(); handleRemove(); }}
          disabled={removing}
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#9CA3AF] hover:text-[#DC2626] shadow-sm transition-all opacity-0 group-hover:opacity-100"
          aria-label="Remove"
        >
          {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </Link>

      <div className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-0.5">
          {product.category.name}
        </p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-[13px] font-bold text-[#0D0D0D] leading-snug line-clamp-2 hover:text-[#555] transition-colors mb-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-[18px] font-black text-[#0D0D0D]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            {fmt(price)}
          </span>
          {discount > 0 && (
            <span className="text-[12px] text-[#9CA3AF] line-through">{fmt(mrp)}</span>
          )}
        </div>
        <button
          onClick={handleMoveToCart}
          disabled={!inStock}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-black transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: inStock ? "#0D0D0D" : "#E5E7EB",
            color: inStock ? "#FFFFFF" : "#9CA3AF",
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: "0.06em",
          }}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {inStock ? "MOVE TO CART" : "OUT OF STOCK"}
        </button>
      </div>
    </motion.div>
  );
}

export default function WishlistPage() {
  const [items,   setItems]   = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wishlist");
      if (res.status === 401) { setItems([]); return; }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-[32px] font-black text-[#0D0D0D] mb-1"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.01em" }}
            >
              My Wishlist
            </h1>
            {!loading && (
              <p className="text-[14px] text-[#9CA3AF]">
                {items.length} {items.length === 1 ? "item" : "items"} saved
              </p>
            )}
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1.5 text-[13px] font-semibold text-[#555] hover:text-[#0D0D0D] transition-colors"
          >
            Continue Shopping <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-[#9CA3AF]" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24">
            <div
              className="inline-flex h-20 w-20 items-center justify-center rounded-full mb-5"
              style={{ background: "rgba(245,197,24,0.1)", border: "2px solid rgba(245,197,24,0.2)" }}
            >
              <Heart className="h-9 w-9 text-[#F5C518]" />
            </div>
            <h2
              className="text-[24px] font-black text-[#0D0D0D] mb-2"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Your Wishlist is Empty
            </h2>
            <p className="text-[14px] text-[#9CA3AF] mb-8 max-w-xs mx-auto">
              Tap the ♡ on any product to save it here.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-black text-[13px] text-[#0D0D0D] transition-all hover:opacity-90"
              style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}
            >
              EXPLORE PRODUCTS <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {items.map(item => (
                <WishlistCard key={item.id} item={item} onRemove={removeItem} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
