"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2, Package, Truck, Home, Share2,
  ArrowRight, Copy, Check, Clock, CreditCard,
} from "lucide-react";
import { cn } from "@/lib/cn";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

const METHOD_LABEL: Record<string, string> = {
  RAZORPAY_UPI:        "UPI",
  RAZORPAY_CARD:       "Card",
  RAZORPAY_NETBANKING: "Net Banking",
  RAZORPAY_WALLET:     "Wallet",
  COD:                 "Cash on Delivery",
};

interface OrderDetail {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  subtotal: number;
  shippingCharge: number;
  discount: number;
  items: { productName: string; quantity: number; unitPrice: number; size?: string }[];
  shippingAddress?: {
    fullName: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
  payment?: {
    method: string;
    status: string;
    razorpayPaymentId?: string | null;
    capturedAt?: string | null;
  };
  status: string;
}

const ORDER_STEPS = [
  { key: "PENDING",    icon: CheckCircle2, label: "Order Confirmed",   desc: "We've received your order"     },
  { key: "PROCESSING", icon: Package,      label: "Preparing",          desc: "Being packed with care"        },
  { key: "SHIPPED",    icon: Truck,        label: "Out for Delivery",   desc: "On the way to you"             },
  { key: "DELIVERED",  icon: Home,         label: "Delivered",          desc: "Enjoy your new purchase!"      },
];

const ORDER_STATUS_RANK: Record<string, number> = {
  PENDING: 0, CONFIRMED: 0, PROCESSING: 1, SHIPPED: 2, DELIVERED: 3,
};

function OrderSuccessInner() {
  const params = useSearchParams();
  const orderNumber = params.get("order");

  const [order, setOrder]   = useState<OrderDetail | null>(null);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!orderNumber) return;
    fetch("/api/orders")
      .then(r => r.json())
      .then((orders: OrderDetail[]) => {
        const found = Array.isArray(orders)
          ? orders.find(o => o.orderNumber === orderNumber)
          : null;
        if (found) setOrder(found);
      })
      .catch(() => {});
  }, [orderNumber]);

  function copyOrder() {
    const num = order?.orderNumber ?? orderNumber ?? "";
    navigator.clipboard.writeText(num).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const currentRank = ORDER_STATUS_RANK[order?.status ?? "PENDING"] ?? 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-8 pb-20">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: `${(i * 2.5) % 100}vw`, y: -20, rotate: 0, opacity: 1 }}
              animate={{ y: "110vh", rotate: (i % 2 === 0 ? 1 : -1) * 360, opacity: [1, 1, 0] }}
              transition={{ duration: 2 + (i % 3) * 0.5, delay: (i % 8) * 0.2, ease: "easeIn" }}
              className="absolute h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: ["#2563EB","#10B981","#F59E0B","#8B5CF6","#EF4444"][i % 5] }}
            />
          ))}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">

        {/* Hero */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-center pt-8"
        >
          <div className="relative inline-flex items-center justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              className="flex h-24 w-24 items-center justify-center rounded-full bg-[rgba(16,185,129,0.12)] border-2 border-[rgba(16,185,129,0.3)]"
            >
              <CheckCircle2 className="h-12 w-12 text-[#10B981]" />
            </motion.div>
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 1.5, delay: i * 0.4, repeat: Infinity, repeatDelay: 1 }}
                className="absolute inset-0 rounded-full border border-[#10B981]"
              />
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h1 className="text-3xl font-extrabold text-white mb-2">Order Confirmed!</h1>
            <p className="text-[#9CA3AF] text-lg">Thank you for shopping with TRYBY Sports.</p>
          </motion.div>
        </motion.div>

        {/* Order info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, ease: "easeOut" }}
          className="rounded-[20px] bg-[#111111] border border-[#1F1F1F] overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#1F1F1F] flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6B7280] mb-0.5">Order Number</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold font-mono text-white">
                  {order?.orderNumber ?? orderNumber ?? "—"}
                </p>
                <button onClick={copyOrder} className="flex h-5 w-5 items-center justify-center rounded text-[#6B7280] hover:text-white transition-colors">
                  {copied ? <Check className="h-3.5 w-3.5 text-[#10B981]" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#6B7280] mb-0.5">Placed on</p>
              <p className="text-xs font-semibold text-[#9CA3AF]">
                {order ? fmtDate(order.createdAt) : "—"}
              </p>
            </div>
          </div>

          {/* Items */}
          {order && (
            <div className="px-6 py-4 border-b border-[#1F1F1F] space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                    <Package className="h-4 w-4 text-white/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.productName}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      Qty: {item.quantity}{item.size ? ` · Size: ${item.size}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-white">{fmt(Number(item.unitPrice) * item.quantity)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          {order && (
            <div className="px-6 py-4 grid sm:grid-cols-2 gap-4 border-b border-[#1F1F1F]">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-[#9CA3AF]">
                  <span>Subtotal</span><span className="text-white">{fmt(Number(order.subtotal))}</span>
                </div>
                <div className="flex justify-between text-sm text-[#9CA3AF]">
                  <span>Shipping</span>
                  <span className={Number(order.shippingCharge) === 0 ? "text-[#10B981] font-semibold" : "text-white"}>
                    {Number(order.shippingCharge) === 0 ? "FREE" : fmt(Number(order.shippingCharge))}
                  </span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-sm text-[#9CA3AF]">
                    <span>Discount</span><span className="text-[#10B981] font-semibold">- {fmt(Number(order.discount))}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-[#1F1F1F]">
                  <span>Total Paid</span><span>{fmt(Number(order.total))}</span>
                </div>
              </div>
              {order.shippingAddress && (
                <div className="rounded-[12px] bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.15)] px-4 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Truck className="h-4 w-4 text-[#10B981]" />
                    <p className="text-xs font-bold text-[#10B981]">Delivering to</p>
                  </div>
                  <p className="text-sm font-bold text-white">{order.shippingAddress.fullName}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">
                    {order.shippingAddress.line1}, {order.shippingAddress.city},<br />
                    {order.shippingAddress.state} – {order.shippingAddress.pincode}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Email note */}
          <div className="px-6 py-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(37,99,235,0.1)] shrink-0">
              <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
            </div>
            <p className="text-xs text-[#9CA3AF]">
              A confirmation email has been sent to your registered email address.
            </p>
          </div>
        </motion.div>

        {/* Payment timeline */}
        {order?.payment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, ease: "easeOut" }}
            className="rounded-[20px] bg-[#111111] border border-[#1F1F1F] p-6"
          >
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-white/40" /> Payment Timeline
            </h2>
            <div className="space-y-3">
              {[
                {
                  label: "Order Created",
                  time: fmtDate(order.createdAt),
                  done: true,
                  desc: `Method: ${METHOD_LABEL[order.payment.method] ?? order.payment.method}`,
                },
                {
                  label: order.payment.method === "COD" ? "COD Confirmed" : "Payment Captured",
                  time: order.payment.capturedAt ? fmtDate(order.payment.capturedAt) : null,
                  done: order.payment.status === "CAPTURED" || order.payment.method === "COD",
                  desc: order.payment.razorpayPaymentId
                    ? `ID: ${order.payment.razorpayPaymentId}`
                    : order.payment.method === "COD"
                    ? "Pay on delivery"
                    : "Awaiting payment",
                },
                {
                  label: "Order Confirmed",
                  time: order.payment.capturedAt ? fmtDate(order.payment.capturedAt) : null,
                  done: ["CONFIRMED","PROCESSING","SHIPPED","DELIVERED"].includes(order.status),
                  desc: "TRYBY is preparing your order",
                },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                    step.done
                      ? "border-[#10B981] bg-[rgba(16,185,129,0.12)]"
                      : "border-[#2D2D2D] bg-[#161616]"
                  )}>
                    {step.done
                      ? <Check className="h-3 w-3 text-[#10B981]" />
                      : <Clock className="h-3 w-3 text-white/20" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold", step.done ? "text-white" : "text-white/30")}>
                      {step.label}
                    </p>
                    <p className="text-xs text-white/30">{step.desc}</p>
                  </div>
                  {step.time && <p className="text-[11px] text-white/25 shrink-0">{step.time}</p>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Order tracking steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, ease: "easeOut" }}
          className="rounded-[20px] bg-[#111111] border border-[#1F1F1F] p-6"
        >
          <h2 className="text-sm font-bold text-white mb-5">Order Status</h2>
          <div className="relative">
            <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-[#1F1F1F]" />
            <motion.div
              className="absolute left-4 top-5 w-0.5 bg-[#10B981]"
              initial={{ height: 0 }}
              animate={{ height: `${Math.min(currentRank / (ORDER_STEPS.length - 1), 1) * 100}%` }}
              transition={{ duration: 0.8, delay: 0.8 }}
            />
            <div className="space-y-5">
              {ORDER_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isDone = i <= currentRank;
                const isCurrent = i === currentRank;
                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="relative flex items-start gap-4 pl-10"
                  >
                    <div className={cn(
                      "absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                      isDone
                        ? "border-[#10B981] bg-[rgba(16,185,129,0.12)]"
                        : isCurrent
                          ? "border-[#2563EB] bg-[rgba(37,99,235,0.12)]"
                          : "border-[#2D2D2D] bg-[#161616]"
                    )}>
                      <Icon className={cn("h-4 w-4", isDone ? "text-[#10B981]" : isCurrent ? "text-[#2563EB]" : "text-[#374151]")} />
                    </div>
                    <div className="pb-1">
                      <p className={cn("text-sm font-bold", isDone ? "text-white" : isCurrent ? "text-[#2563EB]" : "text-[#6B7280]")}>
                        {step.label}
                        {isCurrent && i === 0 && (
                          <span className="ml-2 text-[10px] font-bold text-[#10B981] rounded-full bg-[rgba(16,185,129,0.12)] px-2 py-0.5">
                            Done
                          </span>
                        )}
                        {isCurrent && i > 0 && (
                          <span className="ml-2 text-[10px] font-bold text-[#2563EB] rounded-full bg-[rgba(37,99,235,0.12)] px-2 py-0.5">
                            In progress
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link
            href="/products"
            className="flex flex-1 items-center justify-center gap-2 h-11 rounded-[10px] bg-[#2563EB] text-sm font-bold text-white hover:bg-[#1D4ED8] transition-colors"
          >
            Continue Shopping <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/orders"
            className="flex flex-1 items-center justify-center gap-2 h-11 rounded-[10px] border border-[#2D2D2D] bg-[#111111] text-sm font-semibold text-[#9CA3AF] hover:text-white hover:border-[#3D3D3D] transition-all"
          >
            <Package className="h-4 w-4" /> View My Orders
          </Link>
          <button
            onClick={() => navigator.share?.({ title: "TRYBY Sports", text: `Just ordered from TRYBY! Order ${order?.orderNumber ?? ""}` }).catch(() => {})}
            className="flex flex-1 items-center justify-center gap-2 h-11 rounded-[10px] border border-[#2D2D2D] bg-[#111111] text-sm font-semibold text-[#9CA3AF] hover:text-white hover:border-[#3D3D3D] transition-all"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
        </motion.div>

      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return <Suspense><OrderSuccessInner /></Suspense>;
}
