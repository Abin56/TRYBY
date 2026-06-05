"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Wallet, TrendingUp, Clock, ArrowDownCircle, ChevronLeft, ChevronRight,
  ArrowUpRight, IndianRupee, ShieldCheck, AlertCircle, RefreshCw,
} from "lucide-react";
import Link from "next/link";

const ENTRY_TYPE_COLOR: Record<string, string> = {
  ORDER_EARNING:        "#4ADE80",
  COMMISSION_DEDUCTION: "#F87171",
  GST_DEDUCTION:        "#F87171",
  SHIPPING_DEDUCTION:   "#F87171",
  REFUND_DEDUCTION:     "#F87171",
  RETURN_DEDUCTION:     "#F87171",
  PAYOUT_DEBIT:         "#A78BFA",
  MANUAL_CREDIT:        "#60A5FA",
  MANUAL_DEBIT:         "#F87171",
  HOLDING_CREDIT:       "#4ADE80",
  DISPUTE_CREDIT:       "#4ADE80",
  DISPUTE_DEBIT:        "#F87171",
};

const ENTRY_TYPE_LABEL: Record<string, string> = {
  ORDER_EARNING:        "Order Earning",
  COMMISSION_DEDUCTION: "Commission",
  GST_DEDUCTION:        "GST on Commission",
  SHIPPING_DEDUCTION:   "Shipping Deduction",
  REFUND_DEDUCTION:     "Refund Deduction",
  RETURN_DEDUCTION:     "Return Deduction",
  PAYOUT_DEBIT:         "Payout Transferred",
  MANUAL_CREDIT:        "Manual Credit",
  MANUAL_DEBIT:         "Manual Debit",
  HOLDING_CREDIT:       "Released from Hold",
  DISPUTE_CREDIT:       "Dispute Credit",
  DISPUTE_DEBIT:        "Dispute Debit",
};

type LedgerEntry = {
  id: string; type: string; amount: number; grossAmount: number;
  commissionAmt: number; gstOnCommission: number; netAmount: number;
  description: string; orderNumber: string | null; balanceAfter: number;
  createdAt: string;
};

type NextRelease = { holdUntil: string; amount: number } | null;

type WalletData = {
  balances: { available: number; pending: number; processing: number; lifetime: number; deductions: number; totalPaidOut: number };
  holdings: { count: number; amount: number };
  available: { count: number; amount: number };
  nextRelease: NextRelease;
  commissionRate: number;
  gstRate: number;
  recentEntries: LedgerEntry[];
};

export default function SupplierWalletPage() {
  const [data, setData]       = useState<WalletData | null>(null);
  const [ledger, setLedger]   = useState<LedgerEntry[]>([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);

  const loadWallet = useCallback(async () => {
    const res  = await fetch("/api/supplier/wallet");
    const json = await res.json();
    setData(json);
  }, []);

  const loadLedger = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/supplier/ledger?page=${page}`);
    const json = await res.json();
    setLedger(json.entries ?? []);
    setTotal(json.total   ?? 0);
    setPages(json.pages   ?? 1);
    setLoading(false);
  }, [page]);

  useEffect(() => { loadWallet(); }, [loadWallet]);
  useEffect(() => { loadLedger(); }, [loadLedger]);

  const fmt = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const daysUntil = (iso: string) => {
    const diff = new Date(iso).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1000px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Wallet
          </h1>
          <p className="text-white/40 text-[13px] mt-0.5">Your earnings, settlements, and transaction history</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/supplier/reports"
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold text-white/50 hover:text-white hover:bg-white/06 transition-all">
            Reports & Export →
          </Link>
        </div>
      </div>

      {!data ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Balance cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {[
              { label: "Available Balance", value: data.balances.available, color: "#4ADE80", icon: Wallet, desc: "Ready to withdraw" },
              { label: "Pending (Hold)",    value: data.balances.pending,   color: "#F5C518", icon: Clock,  desc: `${data.holdings.count} order${data.holdings.count !== 1 ? "s" : ""} in hold` },
              { label: "Processing",        value: data.balances.processing, color: "#A78BFA", icon: RefreshCw, desc: "Payout in progress" },
            ].map(card => (
              <div key={card.label} className="rounded-2xl p-5"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl mb-3"
                  style={{ background: `${card.color}18` }}>
                  <card.icon className="h-4 w-4" style={{ color: card.color }} />
                </div>
                <p className="font-black text-white mb-0.5"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "26px", color: card.color }}>
                  {fmt(card.value)}
                </p>
                <p className="text-[11px] text-white/40">{card.label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: card.color }}>{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Lifetime stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Lifetime Earnings",  value: data.balances.lifetime,    color: "#60A5FA" },
              { label: "Total Deductions",   value: data.balances.deductions,  color: "#F87171" },
              { label: "Total Paid Out",     value: data.balances.totalPaidOut, color: "#A78BFA" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[11px] text-white/40 mb-1">{s.label}</p>
                <p className="font-black text-[18px]"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", color: s.color }}>
                  {fmt(s.value)}
                </p>
              </div>
            ))}
          </div>

          {/* Next release countdown */}
          {data.nextRelease && (
            <div className="rounded-2xl p-4 mb-6 flex items-center gap-4"
              style={{ background: "rgba(245,197,24,0.06)", border: "1px solid rgba(245,197,24,0.20)" }}>
              <Clock className="h-5 w-5 text-[#F5C518] shrink-0" />
              <div className="flex-1">
                <p className="text-[13px] font-bold text-[#F5C518]">
                  Next release: {fmt(data.nextRelease.amount)} in {daysUntil(data.nextRelease.holdUntil)} day{daysUntil(data.nextRelease.holdUntil) !== 1 ? "s" : ""}
                </p>
                <p className="text-[11px] text-white/40 mt-0.5">
                  Releases on {fmtDate(data.nextRelease.holdUntil)} · 7-day hold after delivery
                </p>
              </div>
              <Link href="/supplier/payouts"
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 font-black text-[12px] hover:brightness-110 transition-all shrink-0"
                style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}>
                Request Payout <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* Commission info */}
          <div className="rounded-2xl p-4 mb-8 flex items-center gap-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <ShieldCheck className="h-4 w-4 text-white/30 shrink-0" />
            <p className="text-[12px] text-white/40">
              Commission: <span className="text-white/70 font-semibold">{(data.commissionRate * 100).toFixed(1)}%</span>
              {" · "}GST on commission: <span className="text-white/70 font-semibold">{(data.gstRate * 100).toFixed(0)}%</span>
              {" · "}Net earnings = Gross − Commission − GST on Commission
            </p>
          </div>

          {/* Transaction history */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
              Transaction History
            </h2>
            <p className="text-[12px] text-white/35">{total} transactions</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
            </div>
          ) : ledger.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <IndianRupee className="h-8 w-8 text-white/15 mb-3" />
              <p className="text-white/40 text-[14px]">No transactions yet</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {ledger.map(e => {
                  const color   = ENTRY_TYPE_COLOR[e.type]  ?? "#9CA3AF";
                  const label   = ENTRY_TYPE_LABEL[e.type]  ?? e.type.replace(/_/g, " ");
                  const isCredit = Number(e.amount) >= 0;
                  return (
                    <div key={e.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                        style={{ background: `${color}18` }}>
                        <IndianRupee className="h-4 w-4" style={{ color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-white/85 truncate">{e.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: `${color}18`, color }}>
                            {label}
                          </span>
                          {e.orderNumber && (
                            <span className="text-[10px] text-white/25 font-mono">{e.orderNumber}</span>
                          )}
                          <span className="text-[10px] text-white/25">{fmtDate(e.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-[16px]"
                          style={{ fontFamily: "'Barlow Condensed', sans-serif", color: isCredit ? "#4ADE80" : "#F87171" }}>
                          {isCredit ? "+" : "−"}{fmt(Number(e.amount))}
                        </p>
                        <p className="text-[10px] text-white/25 mt-0.5">Bal: {fmt(Number(e.balanceAfter))}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-[12px] text-white/35">Page {page} of {pages}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/08 disabled:opacity-30 transition-all">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/08 disabled:opacity-30 transition-all">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
