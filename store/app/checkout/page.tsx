"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, ChevronDown, Truck, Zap,
  ShieldCheck, RotateCcw, BadgeCheck, Lock, ShoppingBag, Check, MapPin,
  AlertCircle, CheckCircle2, Loader2,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import { cn } from "@/lib/cn";
import { ServiceableAreasTest } from "@/components/shipping/serviceable-areas";

type DeliveryMethod = "standard" | "express";

interface Address {
  id: string; fullName: string; phone: string; line1: string; line2?: string;
  city: string; state: string; pincode: string; isDefault: boolean;
}

const INDIAN_STATES = [
  "Andhra Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal",
];

const DELIVERY_OPTIONS = [
  { id: "standard" as const, label: "Standard Delivery", desc: "3–5 business days", price: 49, free_above: 499, icon: Truck },
  { id: "express"  as const, label: "Express Delivery",  desc: "1–2 business days", price: 149, free_above: Infinity, icon: Zap },
];

const TRUST_ROW = [
  { icon: ShieldCheck, label: "Secure Payments",  sub: "256-bit SSL encrypted" },
  { icon: Truck,       label: "Fast Delivery",    sub: "Ships within 24 hrs" },
  { icon: RotateCcw,   label: "Easy Returns",     sub: "7-day return policy" },
  { icon: BadgeCheck,  label: "Official Quality", sub: "100% authentic" },
];

function fmt(n: number) { return "₹" + n.toLocaleString("en-IN"); }

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, hasHydrated } = useCartStore();
  const sub = subtotal();

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [state, setState]         = useState("");
  const [city, setCity]           = useState("");
  const [address1, setAddress1]   = useState("");
  const [address2, setAddress2]   = useState("");
  const [pincode, setPincode]     = useState("");

  const [delivery, setDelivery]   = useState<DeliveryMethod>("standard");
  const [coupon, setCoupon]       = useState("");
  const [couponApplied, setCouponApplied] = useState("");
  const [discount, setDiscount]   = useState(0);

  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [placing, setPlacing]     = useState(false);

  // Pincode serviceability
  const [svcLoading, setSvcLoading]   = useState(false);
  const [svcResult,  setSvcResult]    = useState<{ serviceable: boolean; reason?: string; estimatedDays: number | null } | null>(null);
  const [svcPincode, setSvcPincode]   = useState("");

  // Load saved addresses
  useEffect(() => {
    fetch("/api/addresses")
      .then(r => r.ok ? r.json() : [])
      .then((addrs: Address[]) => {
        setSavedAddresses(addrs);
        const def = addrs.find(a => a.isDefault);
        if (def) { setSelectedAddressId(def.id); checkServiceability(def.pincode); }
        else if (addrs.length) { setSelectedAddressId(addrs[0].id); checkServiceability(addrs[0].pincode); }
        else setNewAddress(true);
      })
      .catch(() => setNewAddress(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function checkServiceability(pin: string) {
    if (!/^\d{6}$/.test(pin)) { setSvcResult(null); setSvcPincode(""); return; }
    if (pin === svcPincode && svcResult !== null) return;
    setSvcLoading(true);
    try {
      const res = await fetch(`/api/shipping/serviceability?pincode=${pin}&value=${sub}`);
      if (res.ok) {
        const data = await res.json();
        setSvcResult({ serviceable: data.serviceable, reason: data.reason, estimatedDays: data.estimatedDays });
        setSvcPincode(pin);
      } else {
        setSvcResult(null);
      }
    } catch {
      setSvcResult(null);
    } finally {
      setSvcLoading(false);
    }
  }

  // Check serviceability when new-address pincode reaches 6 digits
  useEffect(() => {
    if (newAddress && !selectedAddressId && /^\d{6}$/.test(pincode)) {
      checkServiceability(pincode);
    } else if (newAddress && !selectedAddressId && pincode.length < 6) {
      setSvcResult(null);
      setSvcPincode("");
    }
  }, [pincode, newAddress, selectedAddressId]); // eslint-disable-line react-hooks/exhaustive-deps

  const delivOpt = DELIVERY_OPTIONS.find(d => d.id === delivery)!;
  const shipping = sub >= delivOpt.free_above ? 0 : delivOpt.price;
  const total = sub + shipping - discount;

  async function applyCoupon() {
    const c = coupon.trim().toUpperCase();
    if (!c) return;
    setErrors(e => ({ ...e, coupon: "" }));
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c, subtotal: sub }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscount(data.discount);
        setCouponApplied(data.code);
      } else {
        setErrors(e => ({ ...e, coupon: data.error ?? "Invalid coupon" }));
      }
    } catch {
      setErrors(e => ({ ...e, coupon: "Could not validate coupon — try again" }));
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!selectedAddressId && newAddress) {
      if (!firstName.trim()) e.firstName = "Required";
      if (!lastName.trim())  e.lastName  = "Required";
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Valid email required";
      if (!phone.trim() || !/^\d{10}$/.test(phone.replace(/\s/g, ""))) e.phone = "10-digit number";
      if (!state)            e.state     = "Required";
      if (!city.trim())      e.city      = "Required";
      if (!address1.trim())  e.address1  = "Required";
      if (!pincode.trim() || !/^\d{6}$/.test(pincode)) e.pincode = "6-digit pincode";
    } else if (!selectedAddressId) {
      e.address = "Select a delivery address";
    }
    // Pincode serviceability check
    if (svcResult?.serviceable === false) {
      e.pincode = svcResult.reason ?? "Delivery not available to this pincode";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handlePlaceOrder() {
    if (!validate()) return;
    setPlacing(true);

    try {
      let addressId = selectedAddressId;

      // Save new address first
      if (newAddress && !selectedAddressId) {
        const addrRes = await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: `${firstName} ${lastName}`.trim(),
            phone, line1: address1, line2: address2 || undefined,
            city, state, pincode, isDefault: !savedAddresses.length,
          }),
        });
        if (!addrRes.ok) { setErrors({ form: "Could not save address" }); setPlacing(false); return; }
        const addr = await addrRes.json();
        addressId = addr.id;
      }

      // Sync the client cart (Zustand/localStorage) into the server cart so that
      // /api/orders — which builds the order from the DB cart — sees the items.
      // Without this the server cart is empty and order creation fails with
      // "Cart is empty" even though the UI shows items.
      const syncRes = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map(i => ({ variantId: i.variantId, quantity: i.quantity })) }),
      });
      if (!syncRes.ok) {
        setErrors({ form: "Could not prepare your cart — please try again." });
        setPlacing(false);
        return;
      }

      // Create order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddressId: addressId,
          couponCode: couponApplied || undefined,
          paymentMethod: "RAZORPAY_UPI", // default; Razorpay modal handles actual method
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        setErrors({ form: err.error ?? "Failed to create order" });
        setPlacing(false);
        return;
      }

      const order = await orderRes.json();

      // Order placed — the server cart was consumed inside the order transaction.
      // Clear the client cart too so back-navigation can't create a duplicate
      // order from the same items; the user continues from the pending order.
      clearCart();

      // COD — no Razorpay
      // For now route to payment page with orderId
      router.push(`/checkout/payment?orderId=${order.id}`);
    } catch {
      setErrors({ form: "Something went wrong — try again" });
      setPlacing(false);
    }
  }

  // Wait for Zustand persist to rehydrate from localStorage before evaluating cart.
  // Without this guard, a page refresh or direct navigation renders "empty cart"
  // for ~16 ms before hydration completes — causing a false empty-cart redirect.
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8F8F8" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-[3px] border-[#F5C518] border-t-transparent animate-spin" />
          <p className="text-[13px] text-[#888] font-medium">Loading your cart…</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center" style={{ background: "#F8F8F8" }}>
        <ShoppingBag className="h-12 w-12 text-[#F5C518]" />
        <p className="text-[16px] font-bold text-[#0D0D0D]">Your cart is empty.</p>
        <Link href="/products" className="text-[13px] font-semibold text-[#F5C518] hover:underline">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>

      {/* Sticky header */}
      <div className="sticky top-[56px] z-40 bg-white border-b border-[#ECECEC]" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <Link href="/cart" className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-[#555] hover:text-[#0D0D0D] transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Cart
          </Link>
          <div className="flex items-center gap-2 mx-auto">
            {["Cart", "Checkout", "Payment", "Done"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black", i < 2 ? "bg-[#F5C518] text-[#0D0D0D]" : "bg-white border-2 border-[#E0E0E0] text-[#AAAAAA]")}>
                  {i < 1 ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                </div>
                {i < 3 && <div className={cn("w-8 sm:w-12 h-px mx-1", i < 1 ? "bg-[#F5C518]" : "bg-[#E0E0E0]")} />}
              </div>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-[#888]" />
            <span className="text-[12px] text-[#888]">Secure</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-36 lg:pb-16">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── LEFT — form ── */}
          <div className="flex-1 min-w-0 space-y-4">

            {errors.form && (
              <div className="rounded-xl px-4 py-3 text-[13px] font-semibold text-[#DC2626]" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
                {errors.form}
              </div>
            )}

            {/* Test-only: visible list of mock serviceable areas (renders only in mock mode) */}
            <ServiceableAreasTest />

            {/* Delivery address */}
            <div className="bg-white rounded-[20px] border border-[#ECECEC] overflow-hidden" style={{ boxShadow: "0 1px 12px rgba(0,0,0,0.04)" }}>
              <div className="px-6 pt-6 pb-2">
                <h2 className="text-[18px] font-bold text-[#0D0D0D]">Delivery Address</h2>
              </div>
              <div className="px-6 pb-6 space-y-3">

                {/* Saved addresses */}
                {savedAddresses.map(addr => (
                  <button
                    key={addr.id}
                    onClick={() => { setSelectedAddressId(addr.id); setNewAddress(false); checkServiceability(addr.pincode); }}
                    className={cn("flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all", selectedAddressId === addr.id && !newAddress ? "border-[#F5C518]" : "border-[#E8E8E8] hover:border-[#D0D0D0]")}
                    style={selectedAddressId === addr.id ? { boxShadow: "0 0 0 3px rgba(245,197,24,0.15)" } : {}}
                  >
                    <div className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all", selectedAddressId === addr.id && !newAddress ? "border-[#F5C518] bg-[#F5C518]" : "border-[#CCCCCC]")}>
                      {selectedAddressId === addr.id && !newAddress && <span className="h-2 w-2 rounded-full bg-[#0D0D0D]" />}
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[#0D0D0D]">{addr.fullName}</p>
                      <p className="text-[12px] text-[#888] mt-0.5">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} {addr.pincode}</p>
                      <p className="text-[12px] text-[#888]">📞 {addr.phone}</p>
                    </div>
                    {addr.isDefault && <span className="ml-auto shrink-0 rounded-full bg-[#F5C518]/15 px-2 py-0.5 text-[10px] font-bold text-[#D4A800]">Default</span>}
                  </button>
                ))}

                {/* New address toggle */}
                <button
                  onClick={() => { setNewAddress(v => !v); setSelectedAddressId(null); }}
                  className={cn("flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all", newAddress && !selectedAddressId ? "border-[#F5C518]" : "border-[#E8E8E8] hover:border-[#D0D0D0]")}
                >
                  <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", newAddress && !selectedAddressId ? "border-[#F5C518] bg-[#F5C518]" : "border-[#CCCCCC]")}>
                    {newAddress && !selectedAddressId && <span className="h-2 w-2 rounded-full bg-[#0D0D0D]" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#888]" />
                    <span className="text-[14px] font-semibold text-[#0D0D0D]">Add new address</span>
                  </div>
                </button>

                {/* New address form */}
                {newAddress && !selectedAddressId && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {([
                      { label: "First Name *", id: "firstName", value: firstName, set: setFirstName, span2: false, type: "text" },
                      { label: "Last Name *",  id: "lastName",  value: lastName,  set: setLastName,  span2: false, type: "text" },
                      { label: "Email *",      id: "email",     value: email,     set: setEmail,     span2: true,  type: "email" },
                      { label: "Phone *",      id: "phone",     value: phone,     set: setPhone,     span2: false, type: "tel" },
                      { label: "Pincode *",    id: "pincode",   value: pincode,   set: setPincode,   span2: false, type: "text" },
                    ] as Array<{ label: string; id: string; value: string; set: (v: string) => void; span2: boolean; type: string }>).map(({ label, id, value, set, span2, type }) => (
                      <div key={id} className={span2 ? "col-span-2" : ""}>
                        <label className="block text-[12px] font-medium text-[#555] mb-1">{label}</label>
                        <input
                          id={id} type={type ?? "text"} value={value}
                          onChange={e => (set as (v: string) => void)(e.target.value)}
                          className={cn("w-full h-10 rounded-xl border px-3.5 text-[13px] text-[#0D0D0D] outline-none bg-white transition-all", errors[id] ? "border-[#DC2626]" : "border-[#E0E0E0] focus:border-[#F5C518]")}
                        />
                        {errors[id] && <p className="mt-0.5 text-[11px] text-[#DC2626] font-semibold">{errors[id]}</p>}
                      </div>
                    ))}
                    <div className="col-span-2">
                      <label className="block text-[12px] font-medium text-[#555] mb-1">Address Line 1 *</label>
                      <input value={address1} onChange={e => setAddress1(e.target.value)} className={cn("w-full h-10 rounded-xl border px-3.5 text-[13px] outline-none bg-white transition-all", errors.address1 ? "border-[#DC2626]" : "border-[#E0E0E0] focus:border-[#F5C518]")} />
                      {errors.address1 && <p className="mt-0.5 text-[11px] text-[#DC2626] font-semibold">{errors.address1}</p>}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[12px] font-medium text-[#555] mb-1">Address Line 2</label>
                      <input value={address2} onChange={e => setAddress2(e.target.value)} className="w-full h-10 rounded-xl border border-[#E0E0E0] px-3.5 text-[13px] outline-none bg-white focus:border-[#F5C518] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#555] mb-1">City *</label>
                      <input value={city} onChange={e => setCity(e.target.value)} className={cn("w-full h-10 rounded-xl border px-3.5 text-[13px] outline-none bg-white transition-all", errors.city ? "border-[#DC2626]" : "border-[#E0E0E0] focus:border-[#F5C518]")} />
                      {errors.city && <p className="mt-0.5 text-[11px] text-[#DC2626] font-semibold">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#555] mb-1">State *</label>
                      <div className="relative">
                        <select value={state} onChange={e => setState(e.target.value)} className={cn("w-full h-10 rounded-xl border px-3.5 text-[13px] bg-white outline-none appearance-none transition-all", errors.state ? "border-[#DC2626]" : "border-[#E0E0E0] focus:border-[#F5C518]")}>
                          <option value="">Select state</option>
                          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AAAAAA] pointer-events-none" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Serviceability banner */}
            {(svcLoading || svcResult !== null) && (
              <div className={cn(
                "flex items-start gap-3 rounded-2xl px-4 py-3",
                svcLoading            ? "bg-[#F9F9F9] border border-[#E8E8E8]" :
                svcResult?.serviceable ? "bg-[#F0FDF4] border border-[#BBF7D0]" :
                "bg-[#FFF5F5] border border-[#FECACA]"
              )}>
                {svcLoading ? (
                  <><Loader2 className="h-4 w-4 text-[#9CA3AF] animate-spin mt-0.5 shrink-0" /><p className="text-[13px] text-[#9CA3AF]">Checking delivery availability…</p></>
                ) : svcResult?.serviceable ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-[#059669] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-[#059669]">Delivery available to {svcPincode}</p>
                      {svcResult.estimatedDays !== null && (
                        <p className="text-[11px] text-[#9CA3AF] mt-0.5">Estimated delivery in {svcResult.estimatedDays}–{svcResult.estimatedDays + 2} business days</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-[#DC2626] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[13px] font-bold text-[#DC2626]">Delivery unavailable</p>
                      <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                        {svcResult?.reason ?? "Sorry, delivery is currently unavailable to this location."}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Delivery method */}
            <div className="bg-white rounded-[20px] border border-[#ECECEC] px-6 py-5" style={{ boxShadow: "0 1px 12px rgba(0,0,0,0.04)" }}>
              <h2 className="text-[18px] font-bold text-[#0D0D0D] mb-4">Delivery Method</h2>
              <div className="space-y-3">
                {DELIVERY_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const active = delivery === opt.id;
                  const free = sub >= opt.free_above;
                  return (
                    <button
                      key={opt.id} onClick={() => setDelivery(opt.id)}
                      className={cn("flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all", active ? "border-[#F5C518]" : "border-[#E8E8E8] hover:border-[#D0D0D0]")}
                    >
                      <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all", active ? "border-[#F5C518] bg-[#F5C518]" : "border-[#CCCCCC]")}>
                        {active && <span className="h-2 w-2 rounded-full bg-[#0D0D0D]" />}
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F5F5]">
                        <Icon className="h-5 w-5 text-[#555]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-semibold text-[#0D0D0D]">{opt.label}</p>
                        <p className="text-[12px] text-[#888]">{opt.desc}</p>
                      </div>
                      <span className="font-bold text-[14px] text-[#0D0D0D] shrink-0">
                        {free ? <span className="text-[#16A34A]">FREE</span> : fmt(opt.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-[20px] border border-[#ECECEC] px-6 py-5" style={{ boxShadow: "0 1px 12px rgba(0,0,0,0.04)" }}>
              <h2 className="text-[18px] font-bold text-[#0D0D0D] mb-4">Coupon Code</h2>
              {couponApplied ? (
                <div className="flex items-center gap-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] px-4 py-3">
                  <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                  <p className="text-[13px] font-semibold text-[#16A34A]">Coupon <strong>{couponApplied}</strong> applied! You saved {fmt(discount)}</p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} placeholder="Enter coupon code"
                    className={cn("flex-1 h-11 rounded-xl border px-4 text-[14px] text-[#0D0D0D] outline-none bg-white transition-all", errors.coupon ? "border-[#DC2626]" : "border-[#E0E0E0] focus:border-[#F5C518]")}
                  />
                  <button onClick={applyCoupon} className="h-11 px-5 rounded-xl font-bold text-[13px] text-[#0D0D0D] hover:opacity-85 transition-opacity" style={{ background: "#F5C518" }}>
                    Apply
                  </button>
                </div>
              )}
              {errors.coupon && !couponApplied && <p className="mt-1 text-[11px] text-[#DC2626] font-semibold">{errors.coupon}</p>}
            </div>

            {/* Trust row */}
            <div className="bg-white rounded-[20px] border border-[#ECECEC] px-6 py-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {TRUST_ROW.map(({ icon: Icon, label, sub: subLabel }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#F5C518]">
                      <Icon className="h-4 w-4 text-[#F5C518]" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-[#0D0D0D]">{label}</p>
                      <p className="text-[10px] text-[#888] mt-0.5">{subLabel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT — order summary ── */}
          <div className="hidden lg:block w-[360px] shrink-0">
            <div className="bg-white rounded-[20px] border border-[#ECECEC] overflow-hidden sticky top-[80px]" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F0F0]">
                <h3 className="text-[16px] font-bold text-[#0D0D0D]">Order Summary</h3>
                <span className="text-[12px] text-[#888]">{items.length} items</span>
              </div>
              <div className="px-6 py-5 space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative h-[64px] w-[64px] shrink-0 rounded-xl overflow-hidden bg-[#F5F5F5] border border-[#EFEFEF]">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-black text-[#0D0D0D] px-1" style={{ background: "#F5C518" }}>{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#0D0D0D] line-clamp-2 leading-snug">{item.name}</p>
                    </div>
                    <span className="text-[13px] font-bold text-[#0D0D0D] shrink-0">{fmt(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="h-px bg-[#F0F0F0]" />
                <div className="space-y-2 text-[13px]">
                  <div className="flex justify-between"><span className="text-[#555]">Subtotal</span><span className="font-semibold">{fmt(sub)}</span></div>
                  <div className="flex justify-between"><span className="text-[#555]">Shipping</span><span className={cn("font-semibold", shipping === 0 ? "text-[#16A34A]" : "")}>{shipping === 0 ? "FREE" : fmt(shipping)}</span></div>
                  {discount > 0 && <div className="flex justify-between"><span className="text-[#555]">Coupon</span><span className="font-semibold text-[#16A34A]">- {fmt(discount)}</span></div>}
                </div>
                <div className="h-px bg-[#F0F0F0]" />
                <div className="flex justify-between items-baseline">
                  <span className="text-[14px] font-bold text-[#0D0D0D]">Total</span>
                  <span className="text-[22px] font-black text-[#0D0D0D]">{fmt(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50" style={{ background: "#0D0D0D", boxShadow: "0 -4px 32px rgba(0,0,0,0.25)" }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="shrink-0">
              <p className="text-[11px] text-white/40">Total</p>
              <p className="text-[22px] font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{fmt(total)}</p>
            </div>
            <div className="hidden sm:flex flex-col items-center gap-1 flex-1">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-white/60" />
                <span className="text-[13px] font-semibold text-white">Secure Checkout</span>
              </div>
              <p className="text-[10px] text-white/30 text-center">
                By placing this order you agree to our{" "}
                <a href="/terms" className="underline hover:text-white/60">Terms &amp; Conditions</a>
                {" "}and{" "}
                <a href="/privacy-policy" className="underline hover:text-white/60">Privacy Policy</a>
              </p>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={placing || svcResult?.serviceable === false}
              className="flex items-center justify-center gap-2.5 rounded-full font-bold text-[15px] text-[#0D0D0D] disabled:opacity-60 active:scale-[0.97] transition-all shrink-0"
              style={{ background: svcResult?.serviceable === false ? "#E0E0E0" : "#F5C518", height: "52px", paddingLeft: "32px", paddingRight: "32px", fontFamily: "'Barlow Condensed', sans-serif", boxShadow: svcResult?.serviceable === false ? "none" : "0 4px 16px rgba(245,197,24,0.4)" }}
            >
              {placing ? (
                <span className="h-5 w-5 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" />
              ) : svcResult?.serviceable === false ? (
                <><AlertCircle className="h-4 w-4" /> Delivery Unavailable</>
              ) : (
                <><Lock className="h-4 w-4" /> Continue to Payment <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
