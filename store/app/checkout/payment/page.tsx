"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ChevronLeft, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open(): void;
      on(event: string, handler: (response: RazorpayFailureResponse) => void): void;
    };
  }
}

interface RazorpayFailureResponse {
  error: {
    code: string;
    description: string;
    reason: string;
    source: string;
    step: string;
    metadata: { order_id: string; payment_id: string };
  };
}

interface OrderData {
  id: string;
  orderNumber: string;
  total: number;
  items: { productName: string; quantity: number; unitPrice: number }[];
  payment?: { method: string };
}

function PaymentPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId");

  const [order, setOrder]     = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying]   = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!orderId) { setError("No order found"); setLoading(false); return; }

    // Load Razorpay checkout.js
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.head.appendChild(script);

    fetch(`/api/orders/${orderId}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((o: OrderData) => setOrder(o))
      .catch(() => setError("Order not found"))
      .finally(() => setLoading(false));

    return () => {
      try { document.head.removeChild(script); } catch { /* already removed */ }
    };
  }, [orderId]);

  async function handlePay(method: "online" | "cod") {
    if (!order) return;
    setError(""); setPaying(true);

    try {
      if (method === "cod") {
        // Mark payment method as COD and confirm order
        await fetch("/api/payments/cod-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
        });
        router.push(`/order-success?order=${order.orderNumber}`);
        return;
      }

      // Create Razorpay order
      const rzpRes = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });

      if (!rzpRes.ok) {
        const err = await rzpRes.json();
        setError(err.error ?? "Could not initiate payment");
        setPaying(false);
        return;
      }

      const { razorpayOrderId, amount, keyId } = await rzpRes.json();

      const options = {
        key: keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency: "INR",
        name: "TRYBY Sports",
        description: `Order ${order.orderNumber}`,
        order_id: razorpayOrderId,
        prefill: {},
        theme: { color: "#F5C518" },
        modal: {
          ondismiss: () => setPaying(false),
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });

          if (verifyRes.ok) {
            router.push(`/order-success?order=${order.orderNumber}`);
          } else {
            router.push(`/order-failed?orderId=${order.id}&order=${order.orderNumber}`);
          }
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", async (response: RazorpayFailureResponse) => {
        // Record failure in DB (best-effort — don't await to block UI)
        fetch("/api/payments/razorpay/failure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpayOrderId: response.error.metadata.order_id,
            errorCode: response.error.code,
            errorDescription: response.error.description,
          }),
        }).catch(() => {});

        setPaying(false);
        router.push(`/order-failed?orderId=${order.id}&order=${order.orderNumber}`);
      });

      rzp.open();
    } catch {
      setError("Something went wrong — try again");
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8F8F8" }}>
        <div className="h-8 w-8 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center" style={{ background: "#F8F8F8" }}>
        <AlertCircle className="h-10 w-10 text-[#F87171]" />
        <p className="text-[16px] font-bold text-[#0D0D0D]">{error}</p>
        <Link href="/cart" className="text-[13px] font-semibold text-[#F5C518] hover:underline">Back to Cart</Link>
      </div>
    );
  }

  const total = order ? Number(order.total) : 0;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: "#F8F8F8" }}>
      <div className="w-full max-w-[460px]">

        <div className="flex items-center gap-3 mb-6">
          <Link href="/checkout" prefetch={false} className="flex h-9 w-9 items-center justify-center rounded-xl text-[#888] hover:text-[#0D0D0D] hover:bg-white transition-all">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-[22px] font-black text-[#0D0D0D]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Complete Payment
          </h1>
          <div className="ml-auto flex items-center gap-1.5 text-[12px] text-[#888]">
            <Lock className="h-3.5 w-3.5" /> Secure
          </div>
        </div>

        {/* Order summary */}
        {order && (
          <div className="bg-white rounded-[20px] p-5 mb-4" style={{ boxShadow: "0 1px 12px rgba(0,0,0,0.06)" }}>
            <div className="flex justify-between items-center mb-3">
              <p className="text-[13px] font-bold text-[#0D0D0D]">{order.orderNumber}</p>
              <p className="text-[22px] font-black text-[#0D0D0D]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                ₹{total.toLocaleString("en-IN")}
              </p>
            </div>
            {order.items.map((item, i) => (
              <p key={i} className="text-[12px] text-[#888]">
                {item.productName} × {item.quantity} — ₹{(Number(item.unitPrice) * item.quantity).toLocaleString("en-IN")}
              </p>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl px-4 py-3 text-[13px] font-semibold text-[#DC2626]"
            style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => handlePay("online")}
            disabled={paying}
            className="flex w-full h-14 items-center justify-center gap-2.5 rounded-[16px] font-black text-[15px] text-[#0D0D0D] transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.03em", boxShadow: "0 4px 16px rgba(245,197,24,0.35)" }}
          >
            {paying
              ? <span className="h-5 w-5 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" />
              : <><Lock className="h-4 w-4" /> Pay ₹{total.toLocaleString("en-IN")} via UPI / Card / Bank</>
            }
          </button>

          <button
            onClick={() => handlePay("cod")}
            disabled={paying}
            className="flex w-full h-12 items-center justify-center gap-2.5 rounded-[16px] font-semibold text-[14px] text-[#0D0D0D] hover:bg-[#F5F5F5] active:scale-[0.98] transition-all disabled:opacity-60"
            style={{ background: "white", border: "1.5px solid #E0E0E0" }}
          >
            💵 Cash on Delivery
          </button>
        </div>

        <p className="text-center text-[11px] text-[#AAAAAA] mt-5 leading-relaxed">
          Secured by Razorpay · 256-bit SSL · We never store card details
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return <Suspense><PaymentPageInner /></Suspense>;
}
