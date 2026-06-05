"use client";

import { useEffect, useState, useCallback } from "react";
import { Wallet, ChevronLeft, ChevronRight, CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";

type Payout = {
  id: string;
  amount: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  utrNumber: string | null;
  processedAt: string | null;
  createdAt: string;
};

type PayoutsData = {
  payouts: Payout[];
  total: number;
  pages: number;
  pendingPayout: number;
  lastPayoutAt: string | null;
};

const STATUS_ICON: Record<string, React.ElementType> = {
  PENDING:   Clock,
  PROCESSED: CheckCircle2,
  FAILED:    XCircle,
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "#F5C518",
  PROCESSED: "#4ADE80",
  FAILED:    "#F87171",
};

export default function SupplierPayoutsPage() {
  const [data, setData]         = useState<PayoutsData | null>(null);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [requesting, setReq]    = useState(false);
  const [reqError, setReqError] = useState("");
  const [reqSuccess, setReqSuc] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/supplier/payouts?page=${page}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function requestPayout() {
    setReqError("");
    setReq(true);
    const res = await fetch("/api/supplier/payouts", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({}),
    });
    setReq(false);
    if (!res.ok) {
      const d = await res.json();
      setReqError(d.error ?? "Failed to request payout");
      return;
    }
    setReqSuc(true);
    load();
    setTimeout(() => setReqSuc(false), 4000);
  }

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="p-6 lg:p-8 max-w-[800px]">

      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-white font-black"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}
        >
          Payouts
        </h1>
        <p className="text-white/40 text-[13px] mt-0.5">Request and track your earnings payouts</p>
      </div>

      {/* Pending balance card */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/50 text-[13px] mb-1">Available Balance</p>
            <p
              className="text-white font-black"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "34px" }}
            >
              {fmt(data?.pendingPayout ?? 0)}
            </p>
            {data?.lastPayoutAt && (
              <p className="text-white/35 text-[12px] mt-1">Last payout: {fmtDate(data.lastPayoutAt)}</p>
            )}
          </div>
          <button
            onClick={requestPayout}
            disabled={requesting || (data?.pendingPayout ?? 0) <= 0}
            className="flex items-center gap-2 rounded-xl px-5 py-3 font-black text-[14px] transition-all disabled:opacity-40 hover:brightness-110"
            style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}
          >
            <Wallet className="h-4 w-4" />
            {requesting ? "Requesting…" : "Request Payout"}
          </button>
        </div>

        {reqError && (
          <div
            className="flex items-center gap-2 mt-4 rounded-xl px-4 py-3 text-[12px]"
            style={{ background: "rgba(248,113,113,0.10)", color: "#F87171" }}
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {reqError}
          </div>
        )}

        {reqSuccess && (
          <div
            className="flex items-center gap-2 mt-4 rounded-xl px-4 py-3 text-[12px]"
            style={{ background: "rgba(74,222,128,0.10)", color: "#4ADE80" }}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Payout request submitted! Admin will review and process it shortly.
          </div>
        )}
      </div>

      {/* Info box */}
      <div
        className="rounded-xl px-4 py-3 mb-6 text-[12px] text-white/40"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        Payouts are processed by TRYBY admin within 3–5 business days. Ensure your bank details in Profile are up to date. Only one payout request can be pending at a time.
      </div>

      {/* Payout history */}
      <h2
        className="text-white font-black mb-4"
        style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}
      >
        Payout History
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
        </div>
      ) : (data?.payouts ?? []).length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-12 rounded-2xl"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Wallet className="h-9 w-9 text-white/15 mb-3" />
          <p className="text-white/40 text-[14px]">No payouts yet</p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {(data?.payouts ?? []).map(p => {
              const Icon = STATUS_ICON[p.status] ?? Clock;
              const color = STATUS_COLOR[p.status] ?? "#999";
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                    style={{ background: `${color}18` }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                        style={{ background: `${color}18`, color }}
                      >
                        {p.status}
                      </span>
                      {p.utrNumber && (
                        <span className="text-[11px] text-white/30 font-mono">UTR: {p.utrNumber}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/35">
                      Period: {fmtDate(p.periodStart)} – {fmtDate(p.periodEnd)}
                    </p>
                    {p.processedAt && (
                      <p className="text-[11px] text-white/25">Processed: {fmtDate(p.processedAt)}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="font-black text-white text-[17px]"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                      {fmt(Number(p.amount))}
                    </p>
                    <p className="text-[11px] text-white/30">{fmtDate(p.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {(data?.pages ?? 1) > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-[12px] text-white/35">Page {page} of {data?.pages}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/08 disabled:opacity-30 transition-all">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(data?.pages ?? 1, p + 1))} disabled={page === (data?.pages ?? 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/08 disabled:opacity-30 transition-all">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
