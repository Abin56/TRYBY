"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Package, Truck, CheckCircle2, Circle, AlertCircle, Loader2 } from "lucide-react";

interface TrackResult {
  orderNumber: string;
  status: string;
  createdAt: string;
  items: { productName: string; quantity: number }[];
  shipment?: {
    trackingNumber?: string;
    carrier?: string;
    status?: string;
    estimatedAt?: string;
    trackingUrl?: string;
  } | null;
  statusHistory: { status: string; createdAt: string; note?: string | null }[];
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Order Placed", CONFIRMED: "Confirmed", PROCESSING: "Processing",
  SHIPPED: "Shipped", OUT_FOR_DELIVERY: "Out for Delivery", DELIVERED: "Delivered",
  CANCELLED: "Cancelled", RETURN_REQUESTED: "Return Requested",
  RETURNED: "Returned", REFUNDED: "Refunded",
};

const TRACK_STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
const STEP_RANK: Record<string, number> = Object.fromEntries(TRACK_STEPS.map((s, i) => [s, i]));

function TrackForm() {
  const params = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get("order") ?? "");
  const [email, setEmail]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [result, setResult]           = useState<TrackResult | null>(null);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) { setError("Enter both order number and email"); return; }
    setError(""); setLoading(true); setResult(null);

    try {
      const res = await fetch(
        `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber.trim().toUpperCase())}&email=${encodeURIComponent(email.trim().toLowerCase())}`
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Order not found. Check your order number and email.");
        return;
      }
      setResult(await res.json());
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  }

  const rank = result ? (STEP_RANK[result.status] ?? -1) : -1;

  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <div className="max-w-[600px] mx-auto px-4 py-12">

        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <span className="font-black text-[28px] text-[#0D0D0D]" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.02em" }}>
              TRY<span style={{ color: "#F5C518" }}>BY</span>
            </span>
          </Link>
          <h1 className="text-[24px] font-black text-[#0D0D0D]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Track Your Order
          </h1>
          <p className="text-[13px] text-[#888] mt-1">Enter your order number and email to see live status</p>
        </div>

        <div className="bg-white rounded-[24px] p-6 mb-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <form onSubmit={handleTrack} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-[13px] font-semibold text-[#DC2626]"
                style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}
            <div>
              <label className="block text-[13px] font-semibold text-[#444] mb-1.5">Order Number</label>
              <input
                type="text" value={orderNumber} onChange={e => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="e.g. TRY-2024-001234" autoComplete="off"
                className="w-full h-11 rounded-xl border border-[#E0E0E0] px-4 text-[14px] text-[#0D0D0D] outline-none bg-white focus:border-[#F5C518] focus:shadow-[0_0_0_3px_rgba(245,197,24,0.15)] transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#444] mb-1.5">Email Address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Email used when ordering" autoComplete="email"
                className="w-full h-11 rounded-xl border border-[#E0E0E0] px-4 text-[14px] text-[#0D0D0D] outline-none bg-white focus:border-[#F5C518] focus:shadow-[0_0_0_3px_rgba(245,197,24,0.15)] transition-all"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="flex w-full h-12 items-center justify-center gap-2 rounded-2xl font-black text-[15px] text-[#0D0D0D] transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.03em", boxShadow: "0 4px 16px rgba(245,197,24,0.35)" }}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Search className="h-4 w-4" /> Track Order</>}
            </button>
          </form>
        </div>

        {result && (
          <div className="bg-white rounded-[24px] p-6" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Order</p>
                <p className="text-[18px] font-black text-[#0D0D0D]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {result.orderNumber}
                </p>
              </div>
              <span className="rounded-full px-3 py-1.5 text-[11px] font-black"
                style={{ background: "rgba(245,197,24,0.12)", color: "#D4A800" }}>
                {STATUS_LABEL[result.status] ?? result.status}
              </span>
            </div>

            {/* Items */}
            <div className="mb-5 space-y-1">
              {result.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[13px] text-[#555]">
                  <Package className="h-3.5 w-3.5 text-[#AAAAAA] shrink-0" />
                  {item.productName} × {item.quantity}
                </div>
              ))}
            </div>

            {/* Tracking steps */}
            {!["CANCELLED", "RETURNED", "REFUNDED"].includes(result.status) && (
              <div className="relative mb-5">
                <div className="absolute left-[13px] top-3 bottom-3 w-0.5" style={{ background: "#F0F0F0" }} />
                <div className="absolute left-[13px] top-3 w-0.5"
                  style={{ background: "linear-gradient(to bottom, #F5C518, #F5C51855)", height: `${Math.min((rank / (TRACK_STEPS.length - 1)) * 100, 100)}%` }} />
                <div className="space-y-4">
                  {TRACK_STEPS.map((step, i) => {
                    const done = i <= rank;
                    return (
                      <div key={step} className="flex items-center gap-4 pl-8 relative">
                        <div className={`absolute left-0 flex h-7 w-7 items-center justify-center rounded-full border-2 ${done ? "border-[#F5C518] bg-[#F5C518]" : "border-[#E8E8E8] bg-white"}`}>
                          {done ? <CheckCircle2 className="h-3.5 w-3.5 text-[#0D0D0D]" /> : <Circle className="h-3 w-3 text-[#DDDDDD]" />}
                        </div>
                        <p className={`text-[13px] font-semibold ${done ? "text-[#0D0D0D]" : "text-[#BBBBBB]"}`}>
                          {STATUS_LABEL[step] ?? step}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Courier tracking */}
            {result.shipment?.trackingNumber && (
              <div className="rounded-2xl p-4 mb-4" style={{ background: "#F8F8F8" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="h-4 w-4 text-[#F5C518]" />
                  <p className="text-[13px] font-bold text-[#0D0D0D]">
                    {result.shipment.carrier ?? "Courier"} — {result.shipment.status ?? "In Transit"}
                  </p>
                </div>
                <p className="text-[12px] text-[#888] font-mono pl-6">{result.shipment.trackingNumber}</p>
                {result.shipment.trackingUrl && (
                  <a href={result.shipment.trackingUrl} target="_blank" rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center h-10 rounded-xl text-[13px] font-bold text-white"
                    style={{ background: "#0D0D0D" }}>
                    Track on Courier Site →
                  </a>
                )}
              </div>
            )}

            <p className="text-center text-[12px] text-[#888]">
              Ordered {new Date(result.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>

            <div className="mt-4 pt-4 border-t border-[#F0F0F0] text-center">
              <Link href="/auth/login?callbackUrl=/account/orders" className="text-[13px] font-semibold text-[#F5C518] hover:underline">
                Sign in to view full order details →
              </Link>
            </div>
          </div>
        )}

        <p className="text-center text-[13px] text-[#888] mt-6">
          Need help?{" "}
          <Link href="/contact" className="font-semibold text-[#0D0D0D] hover:underline">Contact support</Link>
        </p>
      </div>
    </div>
  );
}

export default function OrderTrackPage() {
  return <Suspense><TrackForm /></Suspense>;
}
