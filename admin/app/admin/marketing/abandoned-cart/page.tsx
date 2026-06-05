"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart, Mail, MessageCircle, RefreshCw, Loader2,
  TrendingUp, Clock, CheckCircle2, XCircle, AlertTriangle, Send,
} from "lucide-react";
import { cn } from "@/lib/cn";

const STORE_API = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

type AbandonedCartStatus = "DETECTED" | "RECOVERY_SENT" | "RECOVERED" | "EXPIRED";

interface AbandonedCart {
  id:              string;
  userId:          string;
  userEmail:       string;
  userName?:       string;
  cartItems:       { productId: string; name: string; price: number; qty: number; image?: string }[];
  cartValue:       number;
  itemCount:       number;
  status:          AbandonedCartStatus;
  recoveryMethod?: string;
  detectedAt:      string;
  recoverySentAt?: string;
  recoveredAt?:    string;
}

interface Summary {
  detected:       number;
  recoverySent:   number;
  recovered:      number;
  totalCartValue: number;
  recoveredValue: number;
  recoveryRate:   string;
}

const STATUS_CFG: Record<AbandonedCartStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  DETECTED:      { label: "Detected",      color: "#D97706", bg: "#FFFBEB",  icon: AlertTriangle },
  RECOVERY_SENT: { label: "Recovery Sent", color: "#2563EB", bg: "#EFF6FF",  icon: Send         },
  RECOVERED:     { label: "Recovered",     color: "#16A34A", bg: "#F0FDF4",  icon: CheckCircle2 },
  EXPIRED:       { label: "Expired",       color: "#9CA3AF", bg: "#F9FAFB",  icon: XCircle      },
};

function fmt(n: number) { return "₹" + Number(n).toLocaleString("en-IN"); }

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600)  return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

// ─── Recovery modal ───────────────────────────────────────────────────────────

function RecoveryModal({ cart, onClose, onSent }: {
  cart: AbandonedCart;
  onClose: () => void;
  onSent: () => void;
}) {
  const [method,  setMethod]  = useState<"email" | "whatsapp">("email");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSend = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${STORE_API}/api/admin/abandoned-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cartId: cart.id, method }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed");
      }
      onSent();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-[#F3F4F6]">
            <h3 className="text-sm font-extrabold text-[#111827]">Send Recovery Message</h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5">{cart.userEmail} · {fmt(cart.cartValue)} cart</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            <p className="text-xs text-[#374151]">
              Cart contains <strong>{cart.itemCount} item{cart.itemCount > 1 ? "s" : ""}</strong> abandoned {timeAgo(cart.detectedAt)}.
            </p>
            <div>
              <p className="text-xs font-semibold text-[#374151] mb-2">Recovery Method</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { v: "email",    icon: Mail,           label: "Email",    color: "#2563EB", bg: "#EFF6FF" },
                  { v: "whatsapp", icon: MessageCircle,  label: "WhatsApp", color: "#16A34A", bg: "#F0FDF4" },
                ] as const).map(({ v, icon: I, label, color, bg }) => (
                  <button key={v} onClick={() => setMethod(v)}
                    className={cn("flex items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold transition-all",
                      method === v ? "border-[#2563EB]" : "border-[#E5E7EB] text-[#6B7280]")}
                    style={{ background: method === v ? bg : "white", color: method === v ? color : undefined }}>
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                      <I className="h-3.5 w-3.5" style={{ color }} />
                    </div>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-[#FFFBEB] border border-[#FDE68A] px-3 py-2.5 text-[11px] text-[#92400E]">
              <strong>Note:</strong> Email/WhatsApp providers are not yet connected. This marks the cart as &ldquo;Recovery Sent&rdquo; and queues the message for when the provider is integrated.
            </div>
            {error && <p className="text-xs text-[#DC2626]">{error}</p>}
          </div>
          <div className="flex gap-2 px-5 py-4 border-t border-[#F3F4F6] bg-[#FAFAFA]">
            <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#374151]">Cancel</button>
            <button onClick={handleSend} disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#111827] text-xs font-semibold text-white disabled:opacity-50">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send Recovery
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AbandonedCartPage() {
  const [carts,   setCarts]   = useState<AbandonedCart[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setFilter] = useState<AbandonedCartStatus | "ALL">("ALL");
  const [recovering, setRecovering] = useState<AbandonedCart | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res  = await fetch(`${STORE_API}/api/admin/abandoned-cart?${params}`, { credentials: "include" });
      const data = await res.json();
      setCarts(data.carts ?? []);
      setSummary(data.summary ?? null);
    } catch { /* empty state */ }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const recoveryRate = summary?.recoveryRate ? parseFloat(summary.recoveryRate) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Abandoned Cart Recovery</h1>
          <p className="text-sm text-[#9CA3AF]">Track abandoned carts and trigger recovery campaigns</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] transition-all">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Abandoned",     value: summary.detected,                    color: "#D97706", bg: "#FFFBEB" },
            { label: "Recovery Sent", value: summary.recoverySent,                color: "#2563EB", bg: "#EFF6FF" },
            { label: "Recovered",     value: summary.recovered,                   color: "#16A34A", bg: "#F0FDF4" },
            { label: "Recovery Rate", value: `${summary.recoveryRate}%`,           color: recoveryRate >= 10 ? "#16A34A" : "#D97706", bg: "#F9FAFB" },
            { label: "Recovered Value", value: fmt(summary.recoveredValue),       color: "#16A34A", bg: "#F0FDF4" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">{label}</p>
              <p className="text-[22px] font-black" style={{ color, fontFamily: "'Barlow Condensed', sans-serif" }}>{String(value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Total cart value at risk */}
      {summary && summary.totalCartValue > 0 && (
        <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-[#D97706] shrink-0" />
          <div>
            <p className="text-sm font-bold text-[#92400E]">
              {fmt(summary.totalCartValue)} in total cart value at risk
            </p>
            <p className="text-xs text-[#B45309]">
              {summary.detected + summary.recoverySent} carts are pending recovery
            </p>
          </div>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-1 rounded-lg border border-[#E5E7EB] bg-white p-1 w-fit">
        {(["ALL", "DETECTED", "RECOVERY_SENT", "RECOVERED", "EXPIRED"] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn("rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
              statusFilter === s ? "bg-[#111827] text-white" : "text-[#6B7280] hover:text-[#374151]")}>
            {s === "ALL" ? "All" : STATUS_CFG[s].label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-14"><Loader2 className="h-6 w-6 animate-spin text-[#9CA3AF]" /></div>
      ) : carts.length === 0 ? (
        <div className="flex flex-col items-center py-14 rounded-2xl border-2 border-dashed border-[#E5E7EB]">
          <ShoppingCart className="h-7 w-7 text-[#D1D5DB] mb-3" />
          <p className="text-sm font-semibold text-[#9CA3AF]">No abandoned carts</p>
          <p className="text-xs text-[#D1D5DB]">When customers abandon carts, they appear here</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Cart Value</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Items</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Abandoned</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Recovery</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {carts.map(cart => {
                  const scfg = STATUS_CFG[cart.status];
                  const SIcon = scfg.icon;
                  return (
                    <tr key={cart.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#111827]">{cart.userName ?? "Customer"}</p>
                        <p className="text-[11px] text-[#9CA3AF]">{cart.userEmail}</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-[#111827]">{fmt(cart.cartValue)}</td>
                      <td className="px-4 py-3 text-[#374151]">{cart.itemCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-[#9CA3AF]">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">{timeAgo(cart.detectedAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 w-fit rounded-full px-2.5 py-1 text-[10px] font-bold"
                          style={{ background: scfg.bg, color: scfg.color }}>
                          <SIcon className="h-2.5 w-2.5" />
                          {scfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#9CA3AF]">
                        {cart.recoveryMethod && (
                          <span className="flex items-center gap-1">
                            {cart.recoveryMethod === "email"
                              ? <Mail className="h-3 w-3" />
                              : <MessageCircle className="h-3 w-3" />}
                            {cart.recoveryMethod}
                            {cart.recoverySentAt && ` · ${timeAgo(cart.recoverySentAt)}`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {(cart.status === "DETECTED") && (
                          <button
                            onClick={() => setRecovering(cart)}
                            className="flex items-center gap-1 h-7 rounded-lg bg-[#111827] px-3 text-[11px] font-semibold text-white hover:bg-[#1F2937] transition-colors whitespace-nowrap"
                          >
                            <Send className="h-3 w-3" /> Recover
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recovery modal */}
      {recovering && (
        <RecoveryModal
          cart={recovering}
          onClose={() => setRecovering(null)}
          onSent={() => { setRecovering(null); load(); }}
        />
      )}
    </div>
  );
}
