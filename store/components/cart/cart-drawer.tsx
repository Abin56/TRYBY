"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight, Truck, Tag } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { cn } from "@/lib/cn";

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, itemCount, subtotal } =
    useCartStore();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeCart]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const count   = itemCount();
  const total   = subtotal();
  const FREE_THRESHOLD = 499;
  const remaining = Math.max(0, FREE_THRESHOLD - total);
  const progressPct = Math.min(100, (total / FREE_THRESHOLD) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[300] bg-black/20 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 bottom-0 z-[400] flex w-full max-w-[440px] flex-col bg-white border-l border-[#E5E7EB] shadow-[0_0_60px_rgba(0,0,0,0.12)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-[#2563EB]" />
                <h2 className="text-base font-bold text-[#111827]">
                  Your Cart
                  {count > 0 && (
                    <span className="ml-2 text-sm font-semibold text-[#9CA3AF]">({count})</span>
                  )}
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-[#F5F5F7] transition-all duration-150"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Free shipping progress */}
            {count > 0 && (
              <div className="px-5 py-3 bg-[#F9FAFB] border-b border-[#F3F4F6]">
                {remaining > 0 ? (
                  <p className="text-xs text-[#6B7280] mb-2">
                    Add <span className="font-semibold text-[#111827]">{formatPrice(remaining)}</span> more for{" "}
                    <span className="text-[#059669] font-semibold">free shipping</span> 🚚
                  </p>
                ) : (
                  <p className="text-xs text-[#059669] font-semibold mb-2">
                    🎉 You've unlocked free shipping!
                  </p>
                )}
                <div className="h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[#059669]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4 px-5">
              <AnimatePresence initial={false}>
                {items.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center h-full gap-5 py-20 text-center"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F5F5F7] border border-[#E5E7EB]">
                      <ShoppingBag className="h-9 w-9 text-[#D1D5DB]" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-[#111827] mb-1">Your cart is empty</p>
                      <p className="text-sm text-[#9CA3AF]">
                        Discover trending products that everyone&apos;s buying
                      </p>
                    </div>
                    <button
                      onClick={closeCart}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1F2937] transition-colors"
                    >
                      Browse Products
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <motion.div
                        key={item.variantId}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="flex gap-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] p-3"
                      >
                        {/* Image */}
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeCart}
                          className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-white border border-[#E5E7EB]"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </Link>

                        {/* Info */}
                        <div className="flex flex-1 min-w-0 flex-col gap-1">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/products/${item.slug}`}
                              onClick={closeCart}
                              className="text-sm font-semibold text-[#111827] leading-snug line-clamp-2 hover:text-[#2563EB] transition-colors"
                            >
                              {item.name}
                            </Link>
                            <button
                              onClick={() => removeItem(item.variantId)}
                              className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-all duration-150"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <p className="text-xs text-[#9CA3AF]">{item.category}{item.size ? ` · ${item.size}` : ""}{item.color ? ` · ${item.color}` : ""}</p>

                          <div className="flex items-center justify-between mt-auto">
                            {/* Qty stepper */}
                            <div className="flex items-center gap-1 rounded-xl border border-[#E5E7EB] bg-white p-0.5">
                              <button
                                onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F5F5F7] transition-all duration-100"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-sm font-semibold text-[#111827]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F5F5F7] transition-all duration-100"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="text-sm font-bold text-[#111827]">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-xs text-[#9CA3AF]">
                                  {formatPrice(item.price)} each
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-[#F3F4F6] p-5 space-y-4 bg-[#FAFAFA]">
                {/* Coupon */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
                    <input
                      type="text"
                      placeholder="Coupon code"
                      className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] transition-all"
                    />
                  </div>
                  <button className="h-9 px-4 rounded-xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#374151] hover:text-[#111827] hover:border-[#D1D5DB] transition-all duration-150">
                    Apply
                  </button>
                </div>

                {/* Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-[#6B7280]">
                    <span>Subtotal ({count} items)</span>
                    <span className="text-[#111827] font-medium">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#6B7280]">
                    <span>Shipping</span>
                    <span className={cn("font-medium", remaining === 0 ? "text-[#059669]" : "text-[#111827]")}>
                      {remaining === 0 ? "FREE" : formatPrice(49)}
                    </span>
                  </div>
                  <div className="border-t border-[#E5E7EB] pt-2 flex justify-between text-base font-bold text-[#111827]">
                    <span>Total</span>
                    <span>{formatPrice(total + (remaining === 0 ? 0 : 49))}</span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="shimmer-btn flex w-full h-12 items-center justify-center gap-2 rounded-xl bg-[#111827] text-sm font-bold text-white hover:bg-[#1F2937] transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                >
                  Checkout Now
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="flex items-center justify-center gap-4 text-xs text-[#9CA3AF]">
                  <span className="flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    Free over ₹499
                  </span>
                  <span>·</span>
                  <span>30-day returns</span>
                  <span>·</span>
                  <span>Secure checkout</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
