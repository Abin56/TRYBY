"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  ChevronLeft, ChevronRight, Zap, Shield, Clock, Copy, Check,
} from "lucide-react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WebhookEvent {
  id: string;
  provider: string;
  eventId: string | null;
  eventType: string;
  processed: boolean;
  processedAt: string | null;
  error: string | null;
  createdAt: string;
}

interface MismatchRow {
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

interface HealthData {
  healthScore: number;
  totalEvents: number;
  totalSucceeded: number;
  totalFailed: number;
  eventStats: Record<string, { total: number; succeeded: number; failed: number }>;
  mismatches: MismatchRow[];
  mismatchCount: number;
  events: WebhookEvent[];
  total: number;
  pages: number;
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

const EVENT_COLOR: Record<string, string> = {
  "payment.captured":  "#4ADE80",
  "payment.failed":    "#F87171",
  "order.paid":        "#60A5FA",
  "refund.created":    "#A78BFA",
  "refund.processed":  "#A78BFA",
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 90 ? "#4ADE80" : score >= 70 ? "#F5C518" : "#F87171";
  const r = 36; const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${filled} ${c - filled}`} strokeLinecap="round"
          transform="rotate(-90 50 50)" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-black text-white text-[22px] leading-none"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{score}</span>
        <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Score</span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const EVENT_FILTER_TABS = [
  { value: "",                  label: "All Events"       },
  { value: "payment.captured",  label: "Captured"         },
  { value: "payment.failed",    label: "Failed"           },
  { value: "order.paid",        label: "Order Paid"       },
  { value: "refund.processed",  label: "Refunded"         },
];

export default function PaymentHealthPage() {
  const [data, setData]       = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [eventType, setEventType] = useState("");
  const [failedOnly, setFailedOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"events" | "mismatches">("events");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (eventType) params.set("eventType", eventType);
    if (failedOnly) params.set("failed", "1");
    try {
      const res = await fetch(`/api/admin/payment-health?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [page, eventType, failedOnly]);

  useEffect(() => { load(); }, [load]);

  const scoreColor = !data ? "#888"
    : data.healthScore >= 90 ? "#4ADE80"
    : data.healthScore >= 70 ? "#F5C518"
    : "#F87171";

  return (
    <div className="p-6 lg:p-8 max-w-[1300px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
            Payment Health
          </h1>
          <p className="text-white/40 text-[13px]">Webhook events, status mismatches, and processing reliability</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold text-white/50 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Health cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Reliability Score", icon: Shield, color: scoreColor,
            value: data ? `${data.healthScore}%` : "—",
            sub: data ? `${data.totalEvents} total events` : "Loading...",
            bg: "rgba(74,222,128,0.06)", border: "rgba(74,222,128,0.15)",
            extra: data ? <ScoreRing score={data.healthScore} /> : null,
          },
          {
            label: "Events Succeeded", icon: CheckCircle2, color: "#4ADE80",
            value: data ? String(data.totalSucceeded) : "—",
            sub: data ? `${data.totalFailed} failed` : "Loading...",
            bg: "rgba(74,222,128,0.06)", border: "rgba(74,222,128,0.15)",
          },
          {
            label: "Failed Events", icon: XCircle, color: "#F87171",
            value: data ? String(data.totalFailed) : "—",
            sub: data?.totalFailed ? "Click Failed Only to view" : "All clear",
            bg: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.15)",
          },
          {
            label: "Status Mismatches", icon: AlertTriangle, color: "#F5C518",
            value: data ? String(data.mismatchCount) : "—",
            sub: data?.mismatchCount ? "Payments need attention" : "No mismatches",
            bg: "rgba(245,197,24,0.06)", border: "rgba(245,197,24,0.15)",
          },
        ].map(({ label, icon: Icon, color, value, sub, bg, border, extra }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-white/50">{label}</p>
              {extra ?? <Icon className="h-4 w-4" style={{ color }} />}
            </div>
            {!extra && (
              <p className="font-black text-white text-[22px] leading-none"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
            )}
            <p className="text-[11px] text-white/35 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Event type breakdown */}
      {data && Object.keys(data.eventStats).length > 0 && (
        <div className="rounded-2xl p-5 mb-6" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Event Breakdown</p>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {Object.entries(data.eventStats).map(([type, stats]) => (
              <div key={type} className="rounded-xl p-3" style={{ background: "#111" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: EVENT_COLOR[type] ?? "#888" }} />
                  <p className="text-[10px] font-bold text-white/50 truncate">{type}</p>
                </div>
                <p className="font-black text-white text-[18px] leading-none"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{stats.total}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-[#4ADE80]">{stats.succeeded} ok</span>
                  {stats.failed > 0 && <span className="text-[10px] text-[#F87171]">{stats.failed} fail</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex items-center gap-2 mb-4">
        {(["events", "mismatches"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="rounded-xl px-4 py-2 text-[12px] font-bold capitalize transition-all"
            style={{
              background: activeTab === tab ? "#F5C518" : "rgba(255,255,255,0.05)",
              color:      activeTab === tab ? "#0D0D0D"  : "rgba(255,255,255,0.45)",
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: "0.04em",
            }}
          >
            {tab === "events" ? "Webhook Events" : `Mismatches${data?.mismatchCount ? ` (${data.mismatchCount})` : ""}`}
          </button>
        ))}

        {activeTab === "events" && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => { setFailedOnly(v => !v); setPage(1); }}
              className="rounded-xl px-3.5 py-2 text-[12px] font-bold transition-all"
              style={{
                background: failedOnly ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.05)",
                color:      failedOnly ? "#F87171" : "rgba(255,255,255,0.45)",
                border: `1px solid ${failedOnly ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.07)"}`,
              }}
            >
              Failed Only
            </button>
          </div>
        )}
      </div>

      {/* Event type filter tabs */}
      {activeTab === "events" && (
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
          {EVENT_FILTER_TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setEventType(value); setPage(1); }}
              className="shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all"
              style={{
                background: eventType === value ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                color:      eventType === value ? "white" : "rgba(255,255,255,0.35)",
                border: `1px solid ${eventType === value ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Events table */}
      {activeTab === "events" && (
        <>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="hidden lg:grid px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white/30 border-b"
              style={{ gridTemplateColumns: "180px 1fr 80px 80px 1fr", borderColor: "rgba(255,255,255,0.05)" }}>
              <span>Event Type</span>
              <span>Event ID</span>
              <span>Status</span>
              <span>Provider</span>
              <span>Time</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-7 w-7 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin" />
              </div>
            ) : !data?.events.length ? (
              <p className="text-center py-12 text-white/30 text-[13px]">No webhook events</p>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {data.events.map(ev => (
                  <div key={ev.id}
                    className="hidden lg:grid px-5 py-3.5 items-center gap-3"
                    style={{ gridTemplateColumns: "180px 1fr 80px 80px 1fr" }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ background: EVENT_COLOR[ev.eventType] ?? "#888" }} />
                      <span className="text-[12px] font-bold text-white/80 truncate">{ev.eventType}</span>
                    </div>
                    <div className="min-w-0 flex items-center">
                      <span className="text-[11px] font-mono text-white/40 truncate">{ev.eventId ?? "—"}</span>
                      {ev.eventId && <CopyBtn text={ev.eventId} />}
                    </div>
                    <div>
                      {ev.processed ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black"
                          style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>
                          <CheckCircle2 className="h-2.5 w-2.5" /> OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black"
                          style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}>
                          <XCircle className="h-2.5 w-2.5" /> Failed
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-white/50 capitalize">{ev.provider}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] text-white/40">{fmtDate(ev.createdAt)}</p>
                      {ev.error && (
                        <p className="text-[10px] text-[#F87171] truncate mt-0.5">{ev.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-[12px] text-white/35">
                Showing {((page - 1) * 30) + 1}–{Math.min(page * 30, data.total)} of {data.total}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                    page === 1 ? "text-white/20 cursor-default" : "text-white/50 hover:text-white hover:bg-white/08")}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-[12px] font-semibold text-white/50">{page} / {data.pages}</span>
                <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                  className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                    page === data.pages ? "text-white/20 cursor-default" : "text-white/50 hover:text-white hover:bg-white/08")}>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Mismatches table */}
      {activeTab === "mismatches" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="hidden lg:grid px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white/30 border-b"
            style={{ gridTemplateColumns: "1fr 120px 120px 1fr", borderColor: "rgba(255,255,255,0.05)" }}>
            <span>Order / Customer</span>
            <span>DB Status</span>
            <span>Razorpay Status</span>
            <span>Issue</span>
          </div>

          {!data?.mismatches.length ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CheckCircle2 className="h-10 w-10 text-[#4ADE80]/60" />
              <p className="text-[13px] text-white/30">No mismatches — DB and Razorpay are in sync</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {data.mismatches.map((m, i) => (
                <div key={i} className="hidden lg:grid px-5 py-3.5 items-start gap-3"
                  style={{ gridTemplateColumns: "1fr 120px 120px 1fr" }}>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-white/80">{m.orderNumber}</p>
                    <p className="text-[11px] text-white/35 truncate">{m.customerEmail ?? "—"}</p>
                    <div className="flex items-center mt-0.5">
                      <p className="text-[10px] font-mono text-white/25 truncate">{m.razorpayOrderId}</p>
                      <CopyBtn text={m.razorpayOrderId} />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: m.dbStatus === "CAPTURED" ? "#4ADE80" : "#F87171" }}>
                    {m.dbStatus}
                  </span>
                  <span className="text-[11px] font-bold text-white/50">{m.rzpStatus ?? "—"}</span>
                  <div>
                    <p className="text-[11px] text-[#F5C518] leading-relaxed">{m.issue}</p>
                    <div className="flex gap-3 mt-1 text-[10px] text-white/30">
                      <span>DB: ₹{m.dbAmount.toLocaleString("en-IN")}</span>
                      {m.rzpAmount !== null && <span>Rzp: ₹{m.rzpAmount.toLocaleString("en-IN")}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
