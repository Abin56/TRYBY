"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag, X, Minus, Plus, ChevronRight,
  Tag, Truck, RotateCcw, ShieldCheck, ArrowRight, Check,
} from "lucide-react";
import { PincodeChecker } from "@/components/shipping/pincode-checker";
import { useCartStore } from "@/store/cart";
import { PLP_PRODUCTS } from "@/data/plp-mock";
import { PLPProductCard } from "@/components/plp/plp-product-card";
import { cn } from "@/lib/cn";

/* ─── Helpers ───────────────────────────────────────────────── */

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

const COUPONS: Record<string, { type: "percent" | "flat"; value: number; label: string }> = {
  TRYBY10: { type: "percent", value: 10, label: "10% off"          },
  FLAT100: { type: "flat",    value: 100, label: "₹100 off"        },
  NEW15:   { type: "percent", value: 15, label: "15% off new user" },
};

const RECENTLY_VIEWED = PLP_PRODUCTS.slice(0, 4);

const TRUST = [
  { icon: ShieldCheck, label: "Secure Payment",  sub: "256-bit SSL encryption"  },
  { icon: RotateCcw,   label: "Easy Returns",    sub: "7-day hassle-free"       },
  { icon: Truck,       label: "Fast Delivery",   sub: "Ships within 24 hours"   },
];

/* ─── Cart item card ────────────────────────────────────────── */

type CartItem = ReturnType<typeof useCartStore.getState>["items"][0];

function CartItemCard({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <div className="flex gap-4 p-4 bg-white rounded-2xl border border-[#F0F0F0] hover:border-[#E0E0E0] transition-colors">

      {/* Image */}
      <Link href={`/products/${item.slug}`} className="shrink-0">
        <div className="h-24 w-24 rounded-xl overflow-hidden bg-[#F5F5F5]">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-1 min-w-0 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-0.5">
              {item.category}
            </p>
            <Link href={`/products/${item.slug}`}>
              <h3 className="text-[14px] font-bold text-[#0D0D0D] leading-snug hover:text-[#555] transition-colors line-clamp-2">
                {item.name}
              </h3>
            </Link>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Season 2024/25</p>
          </div>

          <button
            onClick={() => removeItem(item.id)}
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-[#C0C0C0] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-all duration-150"
            aria-label="Remove item"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          {/* Quantity */}
          <div className="flex items-center rounded-xl border border-[#E0E0E0] overflow-hidden">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="flex h-8 w-8 items-center justify-center text-[#555] hover:bg-[#F5F5F5] transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span
              className="flex h-8 w-10 items-center justify-center border-x border-[#E0E0E0] text-[13px] font-bold text-[#0D0D0D]"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="flex h-8 w-8 items-center justify-center text-[#555] hover:bg-[#F5F5F5] transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p
              className="text-[15px] font-black text-[#0D0D0D]"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {fmt(item.price * item.quantity)}
            </p>
            {item.compareAtPrice && (
              <p className="text-[11px] text-[#9CA3AF] line-through">
                {fmt(item.compareAtPrice * item.quantity)}
              </p>
            )}
            {item.quantity > 1 && (
              <p className="text-[11px] text-[#9CA3AF]">{fmt(item.price)} each</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Order summary panel ───────────────────────────────────── */

function OrderSummary() {
  const { itemCount, subtotal } = useCartStore();
  const [couponInput, setCouponInput] = useState("");
  const [applied, setApplied]         = useState<(typeof COUPONS[string] & { code: string }) | null>(null);
  const [couponError, setCouponError] = useState("");
  const [loading, setLoading]         = useState(false);

  const count    = itemCount();
  const sub      = subtotal();
  const shipping = sub >= 499 || sub === 0 ? 0 : 49;
  const discount = applied
    ? applied.type === "percent"
      ? Math.round(sub * applied.value / 100)
      : Math.min(applied.value, sub)
    : 0;
  const total = sub + shipping - discount;

  const handleApply = async () => {
    if (!couponInput.trim()) return;
    setLoading(true);
    setCouponError("");
    await new Promise((r) => setTimeout(r, 600));
    const found = COUPONS[couponInput.toUpperCase()];
    if (found) {
      setApplied({ ...found, code: couponInput.toUpperCase() });
      setCouponInput("");
    } else {
      setCouponError("Invalid code. Try TRYBY10 or FLAT100.");
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-[#F0F0F0] bg-white overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-[#F0F0F0]">
        <h2
          className="text-[16px] font-black text-[#0D0D0D]"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.02em" }}
        >
          Order Summary
        </h2>
      </div>

      <div className="px-5 py-4 space-y-4">

        {/* Free shipping bar */}
        {sub > 0 && sub < 499 && (
          <div className="rounded-xl bg-[#FFFBEB] border border-[#FDE68A] px-3 py-2.5">
            <p className="text-[12px] font-semibold text-[#92400E] mb-1.5">
              Add <span className="font-black text-[#0D0D0D]">{fmt(499 - sub)}</span> more for{" "}
              <span className="text-[#059669] font-black">FREE shipping</span>
            </p>
            <div className="h-1.5 rounded-full bg-[#FDE68A] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#F5C518] transition-all duration-500"
                style={{ width: `${Math.min(100, (sub / 499) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Price rows */}
        <div className="space-y-2.5">
          <div className="flex justify-between text-[13px]">
            <span className="text-[#555]">Subtotal ({count} {count === 1 ? "item" : "items"})</span>
            <span className="font-semibold text-[#0D0D0D]">{fmt(sub)}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-[#555]">Shipping</span>
            <span className={cn("font-semibold", shipping === 0 && sub > 0 ? "text-[#059669]" : "text-[#0D0D0D]")}>
              {sub === 0 ? "—" : shipping === 0 ? "FREE" : fmt(shipping)}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[13px]">
              <span className="text-[#059669] font-semibold">Coupon ({applied!.code})</span>
              <span className="font-semibold text-[#059669]">−{fmt(discount)}</span>
            </div>
          )}
          <div className="h-px bg-[#F0F0F0]" />
          <div className="flex justify-between">
            <span
              className="text-[16px] font-black text-[#0D0D0D]"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Total
            </span>
            <span
              className="text-[20px] font-black text-[#0D0D0D]"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {fmt(total)}
            </span>
          </div>
          <p className="text-[11px] text-[#9CA3AF] -mt-1">Incl. all taxes · Prices in INR</p>
        </div>

        {/* Coupon */}
        <div>
          <p
            className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#0D0D0D] mb-2 flex items-center gap-1.5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            <Tag className="h-3.5 w-3.5 text-[#F5C518]" />
            Have a coupon?
          </p>

          {applied ? (
            <div className="flex items-center justify-between rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#059669]" />
                <span className="text-[12px] font-bold text-[#059669]">
                  {applied.code} — {applied.label}
                </span>
              </div>
              <button
                onClick={() => setApplied(null)}
                className="text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
                aria-label="Remove coupon"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleApply()}
                  placeholder="Enter code"
                  className="flex-1 h-9 rounded-xl border border-[#E0E0E0] bg-white px-3 text-[13px] text-[#0D0D0D] placeholder:text-[#C0C0C0] outline-none focus:border-[#F5C518] focus:shadow-[0_0_0_3px_rgba(245,197,24,0.15)] transition-all"
                />
                <button
                  onClick={handleApply}
                  disabled={loading || !couponInput.trim()}
                  className="h-9 px-4 rounded-xl bg-[#0D0D0D] text-[12px] font-bold text-white hover:opacity-85 disabled:opacity-40 transition-opacity flex items-center justify-center"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}
                >
                  {loading
                    ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    : "Apply"
                  }
                </button>
              </div>
              {couponError && (
                <p className="mt-1.5 text-[11px] font-semibold text-[#DC2626]">{couponError}</p>
              )}
            </>
          )}
        </div>

        {/* Delivery pincode check */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF] mb-1.5 flex items-center gap-1">
            <Truck className="h-3 w-3" /> Check Delivery
          </p>
          <PincodeChecker
            compact
            orderValue={sub}
            storageKey="tryby_delivery_pincode"
          />
        </div>

        {/* Checkout CTA */}
        <Link
          href="/checkout"
          prefetch={false}
          className="flex w-full items-center justify-center gap-2 h-12 rounded-full font-bold text-[14px] text-white bg-[#0D0D0D] hover:opacity-85 active:scale-[0.98] transition-all duration-200"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}
        >
          Proceed to Checkout
          <ArrowRight className="h-4 w-4" />
        </Link>

        {/* Payment logos */}
        <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
          {["UPI", "Visa", "MC", "RuPay", "COD"].map((m) => (
            <span
              key={m}
              className="rounded-md border border-[#E0E0E0] bg-[#F9F9F9] px-2 py-0.5 text-[10px] font-bold text-[#9CA3AF]"
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────── */

export default function CartPage() {
  const { items, itemCount, hasHydrated } = useCartStore();
  const count = itemCount();

  /* ── Pre-hydration skeleton: don't flash empty state before localStorage loads ── */
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-[3px] border-[#F5C518] border-t-transparent animate-spin" />
          <p className="text-[13px] text-[#888] font-medium">Loading your cart…</p>
        </div>
      </div>
    );
  }

  /* ── Empty state ── */
  if (count === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center gap-0 px-4 py-16 text-center">
        {/* Jersey illustration */}
        <div className="mb-6 mt-4">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <circle cx="50" cy="50" r="46" fill="rgba(245,197,24,0.10)" stroke="rgba(245,197,24,0.20)" strokeWidth="1.5" />
            <path d="M35 40 L22 48 L27 54 L35 49 L35 72 L65 72 L65 49 L73 54 L78 48 L65 40 Q58 34 50 34 Q42 34 35 40Z"
              fill="none" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M50 34 Q50 42 50 42" stroke="#F5C518" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h1
          className="font-black text-[#0D0D0D] mb-2"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(24px, 5vw, 32px)", letterSpacing: "-0.01em" }}
        >
          Your Cart Is Waiting
        </h1>
        <p className="text-[14px] text-[#888] max-w-xs mx-auto mb-7 leading-relaxed">
          Find your next favorite jersey and come back.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 h-12 px-8 rounded-full font-bold text-[14px] text-white bg-[#0D0D0D] hover:opacity-85 transition-opacity"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}
        >
          Continue Shopping
          <ArrowRight className="h-4 w-4" />
        </Link>

        {/* Trending carousel */}
        <div className="w-full max-w-[1440px] mt-12 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-[#0D0D0D]" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
              🔥 Trending Now
            </h2>
            <Link href="/products?filter=trending" className="text-[13px] font-semibold text-[#F5C518] hover:underline">
              View all →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {RECENTLY_VIEWED.map((p) => (
              <div key={p.id} className="snap-start shrink-0" style={{ width: "160px" }}>
                <PLPProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Filled cart ── */
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── SECTION 1 — Breadcrumb ── */}
        <nav className="flex items-center gap-1 text-[12px] text-[#9CA3AF] mb-5" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#0D0D0D] transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#0D0D0D] font-medium">Cart</span>
        </nav>

        {/* Title */}
        <div className="flex items-baseline gap-3 mb-6">
          <h1
            className="font-black text-[#0D0D0D]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(24px, 3vw, 32px)", letterSpacing: "-0.01em" }}
          >
            My Cart
          </h1>
          <span className="text-[14px] font-semibold text-[#9CA3AF]">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </div>

        {/* ── SECTION 2 — Layout ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* LEFT — 70% items */}
          <div className="flex-1 min-w-0 space-y-3">
            {items.map((item) => (
              <CartItemCard key={item.id} item={item} />
            ))}
            <div className="pt-1">
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#555] hover:text-[#0D0D0D] transition-colors"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* RIGHT — 30% summary + trust */}
          <div className="w-full lg:w-[340px] shrink-0 lg:sticky lg:top-[72px] space-y-4">

            {/* ── SECTION 3 — Order Summary ── */}
            <OrderSummary />

            {/* ── SECTION 4 — Trust row ── */}
            <div className="rounded-2xl border border-[#F0F0F0] bg-white px-5 py-4 space-y-3">
              {TRUST.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(5,150,105,0.10)" }}
                  >
                    <Icon className="h-3.5 w-3.5 text-[#059669]" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-[#0D0D0D] leading-none">{label}</p>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── SECTION 5 — Recently Viewed ── */}
        <div className="mt-14 border-t border-[#F0F0F0] pt-10">
          <div className="flex items-center justify-between mb-5">
            <h2
              className="font-black text-[#0D0D0D]"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", letterSpacing: "-0.01em" }}
            >
              Recently Viewed
            </h2>
            <Link
              href="/products"
              className="flex items-center gap-1 text-[13px] font-semibold text-[#555] hover:text-[#0D0D0D] transition-colors"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {RECENTLY_VIEWED.map((p) => (
              <PLPProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
