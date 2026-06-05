"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, CheckCircle2, AlertTriangle, XCircle,
  Copy, Check, ExternalLink, ChevronDown,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Mismatch {
  orderId: string;
  orderNumber: string;
  customerEmail: string | null;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  dbStatus: string;
  rzpStatus: string | null;
  dbAmount: number;
  rzpAmount: number | null;
  issue: string;
}

interface ReconcileData {
  mismatches: Mismatch[];
  total: number;
  checkedCount: number;
  days: number;
}

interface AuditData {
  period: { days: number; since: string };
  payments: {
    totalRevenue: number;
    totalCaptures: number;
    totalFailed: number;
    totalPending: number;
    totalRefunded: number;
    byStatus: Record<string, { count: number; amount: number }>;
  };
  methods: { method: string; count: number; amount: number }[];
  webhooks: {
    total: number;
    failed: number;
    byEvent: Record<string, { total: number; succeeded: number; failed: number }>;
  };
  mismatches: number;
  reliabilityScore: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="ml-1 text-white/25 hover:text-white/60 transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-[#4ADE80]" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

const METHOD_LABEL: Record<string, string> = {
  RAZORPAY_UPI:        "UPI",
  RAZORPAY_CARD:       "Card",
  RAZORPAY_NETBANKING: "Net Banking",
  RAZORPAY_WALLET:     "Wallet",
  COD:                 "COD",
};

const DB_STATUS_COLOR: Record<string, string> = {
  CAPTURED:           "#4ADE80",
  PENDING:            "#F5C518",
  FAILED:             "#F87171",
  REFUNDED:           "#A78BFA",
  PARTIALLY_REFUNDED: "#FB923C",
  AUTHORIZED:         "#60A5FA",
};

// ── Audit Summary Card ────────────────────────────────────────────────────────

function AuditSummary({ data, days }: { data: AuditData; days: number }) {
  const scoreColor = data.reliabilityScore >= 90 ? "#4ADE80"
    : data.reliabilityScore >= 70 ? "#F5C518" : "#F87171";

  return (
    <div className="rounded-2xl p-6 mb-6" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between mb-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/30"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {days}-Day Audit Summary
        </p>
        <p className="text-[11px] text-white/25">Since {fmtDate(data.period.since)}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        {[
          { label: "Revenue",     value: fmt(data.payments.totalRevenue),    color: "#4ADE80" },
          { label: "Captures",    value: String(data.payments.totalCaptures), color: "#4ADE80" },
          { label: "Failed",      value: String(data.payments.totalFailed),   color: "#F87171" },
          { label: "Refunded",    value: fmt(data.payments.totalRefunded),    color: "#A78BFA" },
          { label: "Reliability", value: `${data.reliabilityScore}%`,         color: scoreColor },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <p className="text-[10px] text-white/35 mb-0.5">{label}</p>
            <p className="font-black text-[20px] leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Method breakdown */}
      {data.methods.length > 0 && (
        <div>
          <p className="text-[10px] text-white/30 mb-2 uppercase tracking-widest font-bold">By Payment Method</p>
          <div className="flex flex-wrap gap-2">
            {data.methods.map(m => (
              <div key={m.method} className="rounded-xl px-3 py-1.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-[11px] font-semibold text-white/60">{METHOD_LABEL[m.method] ?? m.method}</span>
                <span className="text-[11px] text-white/30 ml-2">{m.count}× · {fmt(m.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const DAY_OPTIONS = [1, 3, 7, 14, 30];

export default function ReconcilePage() {
  const [days, setDays]               = useState(7);
  const [reconcile, setReconcile]     = useState<ReconcileData | null>(null);
  const [audit, setAudit]             = useState<AuditData | null>(null);
  const [loading, setLoading]         = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, aRes] = await Promise.all([
        fetch(`/api/admin/payments/reconcile?days=${days}`),
        fetch(`/api/admin/payments/audit?days=${days}`),
      ]);
      if (rRes.ok) setReconcile(await rRes.json());
      if (aRes.ok) setAudit(await aRes.json());
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 lg:p-8 max-w-[1300px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
            Payment Reconciliation
          </h1>
          <p className="text-white/40 text-[13px]">Compare database records against Razorpay · flag mismatches</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Day picker */}
          <div className="relative">
            <button
              onClick={() => setShowDayPicker(v => !v)}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold text-white/50 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Last {days} days
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showDayPicker && (
              <div className="absolute right-0 top-10 z-50 rounded-xl overflow-hidden py-1 w-36"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                {DAY_OPTIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => { setDays(d); setShowDayPicker(false); }}
                    className="flex w-full px-4 py-2 text-[12px] font-semibold text-left hover:bg-white/05 transition-colors"
                    style={{ color: days === d ? "#F5C518" : "rgba(255,255,255,0.6)" }}
                  >
                    Last {d} day{d !== 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold text-white/50 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            Run
          </button>
        </div>
      </div>

      {/* Audit summary */}
      {audit && <AuditSummary data={audit} days={days} />}

      {/* Reconcile header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white font-bold text-[16px]">Mismatch Report</p>
          {reconcile && (
            <p className="text-white/35 text-[12px]">
              Checked {reconcile.checkedCount} payments · {reconcile.total} mismatch{reconcile.total !== 1 ? "es" : ""} found
            </p>
          )}
        </div>
        {reconcile && reconcile.total === 0 && !loading && (
          <div className="flex items-center gap-2 rounded-xl px-3.5 py-2"
            style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
            <CheckCircle2 className="h-4 w-4 text-[#4ADE80]" />
            <span className="text-[12px] font-bold text-[#4ADE80]">All payments reconciled</span>
          </div>
        )}
      </div>

      {/* Mismatches table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Column headers */}
        <div className="hidden lg:grid px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white/30 border-b"
          style={{ gridTemplateColumns: "1fr 130px 120px 120px 1fr", borderColor: "rgba(255,255,255,0.05)" }}>
          <span>Order / Customer</span>
          <span>Razorpay Order ID</span>
          <span>DB Status</span>
          <span>Razorpay Status</span>
          <span>Issue</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-7 w-7 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin" />
          </div>
        ) : !reconcile?.mismatches.length ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <CheckCircle2 className="h-10 w-10 text-[#4ADE80]/60" />
            <p className="text-[13px] text-white/30">
              {reconcile ? "No mismatches found — database is in sync with Razorpay" : "Run reconciliation to see results"}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {reconcile.mismatches.map((m, i) => (
              <div key={i}
                className="hidden lg:grid px-5 py-4 items-start gap-3"
                style={{ gridTemplateColumns: "1fr 130px 120px 120px 1fr" }}
              >
                {/* Order */}
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-white/80">{m.orderNumber}</p>
                  <p className="text-[11px] text-white/40 truncate">{m.customerEmail ?? "—"}</p>
                  {m.razorpayPaymentId && (
                    <div className="flex items-center mt-0.5">
                      <p className="text-[10px] font-mono text-white/25 truncate">{m.razorpayPaymentId}</p>
                      <CopyBtn text={m.razorpayPaymentId} />
                    </div>
                  )}
                  <a
                    href={`/admin/orders/${m.orderId}`}
                    className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-white/30 hover:text-white/60 transition-colors"
                  >
                    <ExternalLink className="h-2.5 w-2.5" /> View Order
                  </a>
                </div>

                {/* Razorpay Order ID */}
                <div className="flex items-center min-w-0">
                  <p className="text-[10px] font-mono text-white/40 truncate">{m.razorpayOrderId}</p>
                  <CopyBtn text={m.razorpayOrderId} />
                </div>

                {/* DB Status */}
                <div>
                  <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-black"
                    style={{
                      background: `${DB_STATUS_COLOR[m.dbStatus] ?? "#888"}18`,
                      color: DB_STATUS_COLOR[m.dbStatus] ?? "#888",
                    }}>
                    {m.dbStatus}
                  </span>
                  <p className="text-[10px] text-white/30 mt-1">{fmt(m.dbAmount)}</p>
                </div>

                {/* Razorpay Status */}
                <div>
                  <span className="text-[11px] font-semibold text-white/50">{m.rzpStatus ?? "unknown"}</span>
                  {m.rzpAmount !== null && (
                    <p className="text-[10px] text-white/30 mt-1">{fmt(m.rzpAmount)}</p>
                  )}
                </div>

                {/* Issue */}
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#F5C518] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#F5C518] leading-relaxed">{m.issue}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="mt-4 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-[11px] text-white/30 leading-relaxed">
          Reconciliation fetches each order from the Razorpay API and compares status and amount.
          "Could not fetch" rows mean the Razorpay API returned an error — check your API keys or Razorpay Dashboard directly.
          All times are in IST.
        </p>
      </div>
    </div>
  );
}
