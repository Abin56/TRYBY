"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, X, ChevronLeft, ChevronRight,
  TrendingUp, CheckCircle2, XCircle, Clock, RefreshCcw,
  ExternalLink, Copy, Check, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/cn";

type PaymentStatus = "PENDING" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";

interface PaymentRow {
  id: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  method: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  capturedAt: string | null;
  failureReason: string | null;
  refundId: string | null;
  refundedAmount: number | null;
  refundedAt: string | null;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    user: { id: string; name: string | null; email: string | null };
    items: { productName: string; quantity: number; unitPrice: number }[];
  };
}

interface ApiResponse {
  payments: PaymentRow[];
  total: number;
  pages: number;
  revenue: number;
  counts: Partial<Record<PaymentStatus, { count: number; amount: number }>>;
}

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  CAPTURED:            { label: "Success",      color: "#4ADE80", bg: "rgba(74,222,128,0.12)",   icon: CheckCircle2 },
  PENDING:             { label: "Pending",      color: "#F5C518", bg: "rgba(245,197,24,0.12)",   icon: Clock },
  AUTHORIZED:          { label: "Authorized",   color: "#60A5FA", bg: "rgba(96,165,250,0.12)",   icon: Clock },
  FAILED:              { label: "Failed",        color: "#F87171", bg: "rgba(248,113,113,0.12)",  icon: XCircle },
  REFUNDED:            { label: "Refunded",      color: "#A78BFA", bg: "rgba(167,139,250,0.12)", icon: RefreshCcw },
  PARTIALLY_REFUNDED:  { label: "Part. Refunded",color: "#FB923C", bg: "rgba(251,146,60,0.12)",  icon: RefreshCcw },
};

const METHOD_LABEL: Record<string, string> = {
  RAZORPAY_UPI:        "UPI",
  RAZORPAY_CARD:       "Card",
  RAZORPAY_NETBANKING: "Net Banking",
  RAZORPAY_WALLET:     "Wallet",
  COD:                 "COD",
};

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button onClick={copy} className="ml-1 text-white/25 hover:text-white/60 transition-colors shrink-0">
      {copied ? <Check className="h-3 w-3 text-[#4ADE80]" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function RefundModal({
  payment,
  onClose,
  onSuccess,
}: {
  payment: PaymentRow;
  onClose: () => void;
  onSuccess: (updated: Partial<PaymentRow>) => void;
}) {
  const orderTotal   = Number(payment.amount);
  const alreadyRefunded = Number(payment.refundedAmount ?? 0);
  const remaining    = orderTotal - alreadyRefunded;

  const [mode, setMode]     = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState("");
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState("");

  async function submit() {
    setErr(""); setBusy(true);
    const body: Record<string, unknown> = {};
    if (mode === "partial") {
      const n = parseFloat(amount);
      if (isNaN(n) || n <= 0 || n > remaining) {
        setErr(`Enter a valid amount between ₹1 and ₹${remaining.toLocaleString("en-IN")}`);
        setBusy(false); return;
      }
      body.amount = n;
    }
    try {
      const res = await fetch(`/api/admin/payments/${payment.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Refund failed"); setBusy(false); return; }
      onSuccess({
        status: data.status,
        refundId: data.refundId,
        refundedAmount: data.totalRefunded,
        refundedAt: new Date().toISOString(),
      });
    } catch {
      setErr("Network error — try again");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative w-full max-w-[400px] rounded-2xl p-6 space-y-5"
        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)" }}>
            <RefreshCcw className="h-5 w-5 text-[#A78BFA]" />
          </div>
          <div>
            <p className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
              Issue Refund
            </p>
            <p className="text-white/40 text-[12px]">
              {payment.order.orderNumber} · ₹{remaining.toLocaleString("en-IN")} available
            </p>
          </div>
          <button onClick={onClose} className="ml-auto text-white/30 hover:text-white/70 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2">
          {(["full", "partial"] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 rounded-xl py-2 text-[12px] font-bold transition-all"
              style={{
                background: mode === m ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.04)",
                color: mode === m ? "#A78BFA" : "rgba(255,255,255,0.4)",
                border: `1px solid ${mode === m ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.07)"}`,
              }}
            >
              {m === "full" ? `Full Refund (₹${remaining.toLocaleString("en-IN")})` : "Partial Refund"}
            </button>
          ))}
        </div>

        {mode === "partial" && (
          <div>
            <label className="block text-[11px] font-bold text-white/40 mb-1.5 uppercase tracking-widest">
              Refund Amount (₹)
            </label>
            <input
              type="number"
              min="1"
              max={remaining}
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={`Max ₹${remaining.toLocaleString("en-IN")}`}
              className="w-full rounded-xl px-4 text-[14px] font-semibold text-white placeholder:text-white/20 outline-none"
              style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
        )}

        {err && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-[#F87171]"
            style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
            <AlertTriangle className="h-4 w-4 shrink-0" /> {err}
          </div>
        )}

        <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(245,197,24,0.06)", border: "1px solid rgba(245,197,24,0.15)" }}>
          <p className="text-[11px] text-[#F5C518]/80">
            Refunds are processed via Razorpay and typically reflect in 5–7 business days.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 h-10 rounded-xl text-[13px] font-black text-white disabled:opacity-50 transition-opacity"
            style={{ background: "#A78BFA" }}
          >
            {busy
              ? <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : "Confirm Refund"
            }
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black"
      style={{ background: cfg.bg, color: cfg.color }}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ── Drawer ───────────────────────────────────────────────────────────────────

function PaymentDrawer({
  payment,
  onClose,
  onRefundSuccess,
}: {
  payment: PaymentRow;
  onClose: () => void;
  onRefundSuccess: (updated: Partial<PaymentRow>) => void;
}) {
  const [showRefund, setShowRefund] = useState(false);

  const canRefund = payment.status === "CAPTURED" || payment.status === "PARTIALLY_REFUNDED";
  const remaining = Number(payment.amount) - Number(payment.refundedAmount ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative flex flex-col w-full max-w-[480px] h-full overflow-y-auto"
        style={{ background: "#111111", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
          style={{ background: "#111111", borderColor: "rgba(255,255,255,0.08)" }}>
          <div>
            <p className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
              Payment Details
            </p>
            <p className="text-white/40 text-[11px] font-mono mt-0.5">{payment.order.orderNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={payment.status} />
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/08 transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount */}
          <div className="rounded-2xl p-5 text-center" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-white/40 text-[11px] mb-1">Amount</p>
            <p className="font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "36px" }}>
              {fmt(Number(payment.amount))}
            </p>
            {payment.refundedAmount && Number(payment.refundedAmount) > 0 && (
              <p className="text-[#A78BFA] text-[12px] mt-1">
                Refunded: {fmt(Number(payment.refundedAmount))}
              </p>
            )}
          </div>

          {/* IDs */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Identifiers</p>
            {[
              { label: "Order ID",            value: payment.order.orderNumber },
              { label: "Razorpay Order ID",   value: payment.razorpayOrderId },
              { label: "Razorpay Payment ID", value: payment.razorpayPaymentId },
              { label: "Refund ID",           value: payment.refundId },
            ].map(({ label, value }) => value ? (
              <div key={label} className="flex items-start justify-between gap-3">
                <span className="text-[12px] text-white/40 shrink-0">{label}</span>
                <div className="flex items-center min-w-0">
                  <span className="text-[11px] font-mono text-white/70 truncate">{value}</span>
                  <CopyButton text={value} />
                </div>
              </div>
            ) : null)}
          </div>

          {/* Payment info */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Payment Info</p>
            {[
              { label: "Method",    value: METHOD_LABEL[payment.method] ?? payment.method },
              { label: "Status",    value: STATUS_CONFIG[payment.status].label },
              { label: "Currency",  value: payment.currency },
              { label: "Created",   value: fmtDate(payment.createdAt) },
              { label: "Captured",  value: payment.capturedAt ? fmtDate(payment.capturedAt) : null },
              { label: "Refunded At", value: payment.refundedAt ? fmtDate(payment.refundedAt) : null },
            ].map(({ label, value }) => value ? (
              <div key={label} className="flex justify-between">
                <span className="text-[12px] text-white/40">{label}</span>
                <span className="text-[12px] font-semibold text-white">{value}</span>
              </div>
            ) : null)}
            {payment.failureReason && (
              <div className="mt-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
                <p className="text-[10px] font-bold text-[#F87171] mb-0.5">Failure Reason</p>
                <p className="text-[12px] text-white/60">{payment.failureReason}</p>
              </div>
            )}
          </div>

          {/* Customer */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Customer</p>
            <div className="flex justify-between">
              <span className="text-[12px] text-white/40">Name</span>
              <span className="text-[12px] font-semibold text-white">{payment.order.user.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[12px] text-white/40">Email</span>
              <span className="text-[12px] font-semibold text-white">{payment.order.user.email ?? "—"}</span>
            </div>
          </div>

          {/* Order items */}
          <div className="rounded-2xl p-5 space-y-2.5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Items</p>
            {payment.order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-[12px]">
                <span className="text-white/60">{item.productName} × {item.quantity}</span>
                <span className="font-semibold text-white">{fmt(Number(item.unitPrice) * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* View order link */}
          <a
            href={`/admin/orders/${payment.order.id}`}
            className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Full Order
          </a>

          {/* Refund button */}
          {canRefund && remaining > 0 && (
            <button
              onClick={() => setShowRefund(true)}
              className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-[13px] font-black transition-colors"
              style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", color: "#A78BFA" }}
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Refund ₹{remaining.toLocaleString("en-IN")}
            </button>
          )}
        </div>
      </div>

      {showRefund && (
        <RefundModal
          payment={payment}
          onClose={() => setShowRefund(false)}
          onSuccess={(updated) => {
            setShowRefund(false);
            onRefundSuccess(updated);
          }}
        />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const FILTER_TABS: { value: PaymentStatus | "ALL"; label: string }[] = [
  { value: "ALL",                label: "All"          },
  { value: "CAPTURED",          label: "Success"      },
  { value: "PENDING",           label: "Pending"      },
  { value: "FAILED",            label: "Failed"       },
  { value: "REFUNDED",          label: "Refunded"     },
  { value: "PARTIALLY_REFUNDED",label: "Part. Refund" },
];

export default function AdminPaymentsPage() {
  const [data, setData]         = useState<ApiResponse | null>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [status, setStatus]     = useState<PaymentStatus | "ALL">("ALL");
  const [page, setPage]         = useState(1);
  const [drawer, setDrawer]     = useState<PaymentRow | null>(null);
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (debouncedQ) params.set("q", debouncedQ);
    if (status !== "ALL") params.set("status", status);
    try {
      const res = await fetch(`/api/admin/payments?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ, status]);

  useEffect(() => { load(); }, [load]);

  const totalCaptured = data?.counts?.CAPTURED?.amount ?? 0;
  const totalFailed   = data?.counts?.FAILED?.count ?? 0;
  const totalPending  = data?.counts?.PENDING?.count ?? 0;

  return (
    <div className="p-6 lg:p-8 max-w-[1300px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white font-black mb-0.5"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
          Payments
        </h1>
        <p className="text-white/40 text-[13px]">Razorpay payment records and status</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Total Revenue",
            value: fmt(totalCaptured),
            sub: `${data?.counts?.CAPTURED?.count ?? 0} successful payments`,
            icon: TrendingUp, color: "#4ADE80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)",
          },
          {
            label: "Pending",
            value: String(totalPending),
            sub: `${fmt(data?.counts?.PENDING?.amount ?? 0)} held`,
            icon: Clock, color: "#F5C518", bg: "rgba(245,197,24,0.08)", border: "rgba(245,197,24,0.2)",
          },
          {
            label: "Failed",
            value: String(totalFailed),
            sub: `${fmt(data?.counts?.FAILED?.amount ?? 0)} dropped`,
            icon: XCircle, color: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)",
          },
          {
            label: "Refunded",
            value: fmt((data?.counts?.REFUNDED?.amount ?? 0) + (data?.counts?.PARTIALLY_REFUNDED?.amount ?? 0)),
            sub: `${(data?.counts?.REFUNDED?.count ?? 0) + (data?.counts?.PARTIALLY_REFUNDED?.count ?? 0)} transactions`,
            icon: RefreshCcw, color: "#A78BFA", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)",
          },
        ].map(({ label, value, sub, icon: Icon, color, bg, border }) => (
          <div key={label} className="rounded-2xl p-4"
            style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-white/50">{label}</p>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <p className="font-black text-white text-[22px] leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
            <p className="text-[11px] text-white/35 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setStatus(value); setPage(1); }}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold whitespace-nowrap transition-all duration-150 shrink-0"
            style={{
              background: status === value ? "#F5C518" : "rgba(255,255,255,0.05)",
              color:      status === value ? "#0D0D0D"  : "rgba(255,255,255,0.45)",
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: "0.04em",
            }}
          >
            {label}
            {value !== "ALL" && data?.counts?.[value as PaymentStatus] && (
              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none"
                style={{
                  background: status === value ? "rgba(13,13,13,0.2)" : "rgba(255,255,255,0.08)",
                  color:      status === value ? "#0D0D0D" : "rgba(255,255,255,0.5)",
                }}>
                {data.counts[value as PaymentStatus]!.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by Order ID, Payment ID, customer name or email..."
          className="w-full rounded-xl pl-10 pr-4 text-[13px] text-white placeholder:text-white/25 outline-none"
          style={{ height: "44px", background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="hidden lg:grid px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white/30 border-b"
          style={{ gridTemplateColumns: "1fr 160px 120px 100px 110px 120px", borderColor: "rgba(255,255,255,0.05)" }}>
          <span>Order / Customer</span>
          <span>Razorpay ID</span>
          <span>Method</span>
          <span className="text-right">Amount</span>
          <span>Status</span>
          <span>Date</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-7 w-7 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin" />
          </div>
        ) : !data?.payments.length ? (
          <p className="text-center py-12 text-white/30 text-[13px]">No payments found</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {data.payments.map(p => (
              <button
                key={p.id}
                onClick={() => setDrawer(p)}
                className="grid w-full items-center px-5 py-3.5 text-left transition-colors gap-3 hover:bg-white/[0.02]"
                style={{ gridTemplateColumns: "1fr 160px 120px 100px 110px 120px" }}
              >
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-white/80 truncate">{p.order.orderNumber}</p>
                  <p className="text-[11px] text-white/35 truncate">{p.order.user.name ?? p.order.user.email}</p>
                </div>
                <div className="min-w-0">
                  {p.razorpayPaymentId ? (
                    <p className="text-[11px] font-mono text-white/50 truncate">{p.razorpayPaymentId}</p>
                  ) : (
                    <p className="text-[11px] text-white/20 italic">—</p>
                  )}
                </div>
                <p className="text-[12px] font-semibold text-white/60">
                  {METHOD_LABEL[p.method] ?? p.method}
                </p>
                <p className="text-[13px] font-black text-white text-right"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {fmt(Number(p.amount))}
                </p>
                <div><StatusBadge status={p.status} /></div>
                <p className="text-[11px] text-white/35">
                  {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-[12px] text-white/35">
            Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total} payments
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                page === 1 ? "text-white/20 cursor-default" : "text-white/50 hover:text-white hover:bg-white/08")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[12px] font-semibold text-white/50">{page} / {data.pages}</span>
            <button
              onClick={() => setPage(p => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                page === data.pages ? "text-white/20 cursor-default" : "text-white/50 hover:text-white hover:bg-white/08")}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {drawer && (
        <PaymentDrawer
          payment={drawer}
          onClose={() => setDrawer(null)}
          onRefundSuccess={(updated) => {
            setDrawer(prev => prev ? { ...prev, ...updated } : null);
            load();
          }}
        />
      )}
    </div>
  );
}
