"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Wallet, Search, CheckCircle2, XCircle, Clock,
  ChevronLeft, ChevronRight, ArrowRight, AlertTriangle,
} from "lucide-react";
import Link from "next/link";

type Payout = {
  id: string;
  amount: number;
  status: string;
  utrNumber: string | null;
  processedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
  supplier: {
    id: string;
    companyName: string;
    bankAccountNo: string | null;
    bankIfsc: string | null;
    bankAccountName: string | null;
    user: { name: string | null; email: string | null; image: string | null };
  };
};

type StatusSummary = Record<string, { count: number; amount: number }>;

const STATUS_COLOR: Record<string, string> = {
  PENDING:    "#F5C518",
  APPROVED:   "#60A5FA",
  PROCESSING: "#A78BFA",
  PROCESSED:  "#4ADE80",
  REJECTED:   "#F87171",
  FAILED:     "#F87171",
};

const STATUS_ICON: Record<string, React.ElementType> = {
  PENDING:   Clock,
  APPROVED:  CheckCircle2,
  PROCESSING: Clock,
  PROCESSED:  CheckCircle2,
  REJECTED:   XCircle,
  FAILED:     XCircle,
};

export default function AdminPayoutsPage() {
  const [payouts, setPayouts]       = useState<Payout[]>([]);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [page, setPage]             = useState(1);
  const [q, setQ]                   = useState("");
  const [statusFilter, setSF]       = useState("PENDING");
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setAL]      = useState<string | null>(null);
  const [summary, setSummary]       = useState<StatusSummary>({});
  const [utrModal, setUtrModal]     = useState<Payout | null>(null);
  const [utrVal, setUtrVal]         = useState("");
  const [rejectModal, setRM]        = useState<Payout | null>(null);
  const [rejectReason, setRR]       = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), q });
    if (statusFilter) params.set("status", statusFilter);
    const res  = await fetch(`/api/admin/payouts?${params}`);
    const data = await res.json();
    setPayouts(data.payouts ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setSummary(data.statusSummary ?? {});
    setLoading(false);
  }, [page, q, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function doAction(payoutId: string, body: Record<string, unknown>) {
    setAL(payoutId);
    await fetch(`/api/admin/payouts/${payoutId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    setAL(null);
    load();
  }

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const pendingTotal = summary["PENDING"]?.amount ?? 0;

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
          Payout Queue
        </h1>
        <p className="text-white/40 text-[13px] mt-0.5">
          {summary["PENDING"]?.count ?? 0} pending · {fmt(pendingTotal)} to approve
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Pending",   key: "PENDING",   color: "#F5C518" },
          { label: "Approved",  key: "APPROVED",  color: "#60A5FA" },
          { label: "Processed", key: "PROCESSED", color: "#4ADE80" },
          { label: "Rejected",  key: "REJECTED",  color: "#F87171" },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => { setSF(s.key); setPage(1); }}
            className="flex flex-col gap-1 rounded-2xl p-4 text-left transition-all hover:brightness-110"
            style={{ background: "#1A1A1A", border: `1px solid ${statusFilter === s.key ? s.color + "40" : "rgba(255,255,255,0.06)"}` }}
          >
            <span className="text-[11px] font-medium text-white/40">{s.label}</span>
            <span className="font-black text-[22px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: s.color }}>
              {summary[s.key]?.count ?? 0}
            </span>
            <span className="text-[11px] text-white/30">
              {fmt(summary[s.key]?.amount ?? 0)}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div
          className="flex items-center gap-2 rounded-xl px-4 flex-1 min-w-[200px]"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", height: "44px" }}
        >
          <Search className="h-4 w-4 text-white/30 shrink-0" />
          <input
            value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Search by supplier name…"
            className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/25"
          />
        </div>
        {["PENDING", "APPROVED", "PROCESSED", "REJECTED"].map(s => (
          <button key={s} onClick={() => { setSF(s); setPage(1); }}
            className="rounded-xl px-3 py-2 text-[12px] font-semibold transition-all"
            style={{
              background: statusFilter === s ? "#F5C518" : "rgba(255,255,255,0.06)",
              color:      statusFilter === s ? "#0D0D0D" : "rgba(255,255,255,0.50)",
            }}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
        </div>
      ) : payouts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Wallet className="h-10 w-10 text-white/15 mb-3" />
          <p className="text-white/40 text-[14px]">No payouts in this category</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Supplier", "Amount", "Bank", "Status", "Requested", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold tracking-wider text-white/30"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.12em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {payouts.map(p => {
                  const Icon  = STATUS_ICON[p.status] ?? Clock;
                  const color = STATUS_COLOR[p.status] ?? "#9CA3AF";
                  return (
                    <tr key={p.id} className="hover:bg-white/02 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {p.supplier.user.image ? (
                            <img src={p.supplier.user.image} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-[12px] font-black"
                              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.40)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                              {p.supplier.companyName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <Link href={`/admin/suppliers/${p.supplier.id}`} className="text-[13px] font-semibold text-white/85 hover:text-white transition-colors">
                              {p.supplier.companyName}
                            </Link>
                            <p className="text-[11px] text-white/35">{p.supplier.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-black text-white text-[16px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {fmt(Number(p.amount))}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {p.supplier.bankAccountNo ? (
                          <div>
                            <p className="text-[12px] text-white/60">{p.supplier.bankAccountName}</p>
                            <p className="text-[11px] text-white/30 font-mono">{p.supplier.bankAccountNo} · {p.supplier.bankIfsc}</p>
                          </div>
                        ) : (
                          <span className="text-[12px] text-[#F87171]">No bank details</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold w-fit"
                          style={{ background: `${color}15`, color }}>
                          <Icon className="h-3 w-3" /> {p.status}
                        </span>
                        {p.utrNumber && (
                          <p className="text-[10px] text-white/30 font-mono mt-0.5">UTR: {p.utrNumber}</p>
                        )}
                        {p.rejectReason && (
                          <p className="text-[10px] text-[#F87171] mt-0.5 max-w-[120px] truncate">{p.rejectReason}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[12px] text-white/40">{fmtDate(p.createdAt)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {p.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => doAction(p.id, { action: "approve" })}
                                disabled={actionLoading === p.id}
                                className="rounded-xl px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 hover:brightness-110"
                                style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>
                                Approve
                              </button>
                              <button
                                onClick={() => { setRM(p); setRR(""); }}
                                disabled={actionLoading === p.id}
                                className="rounded-xl px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 hover:brightness-110"
                                style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}>
                                Reject
                              </button>
                            </>
                          )}
                          {p.status === "APPROVED" && (
                            <button
                              onClick={() => { setUtrModal(p); setUtrVal(""); }}
                              disabled={actionLoading === p.id}
                              className="rounded-xl px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 hover:brightness-110"
                              style={{ background: "rgba(167,139,250,0.12)", color: "#A78BFA" }}>
                              Process
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

      {/* UTR modal */}
      {utrModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={e => { if (e.target === e.currentTarget) setUtrModal(null); }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#1C1C1C", border: "1px solid rgba(255,255,255,0.10)" }}>
            <h3 className="text-white font-black mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
              Mark as Processed
            </h3>
            <p className="text-white/40 text-[12px] mb-4">
              {utrModal.supplier.companyName} · {fmt(Number(utrModal.amount))}
            </p>
            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">UTR / Reference Number *</label>
              <input value={utrVal} onChange={e => setUtrVal(e.target.value)} placeholder="NEFT/IMPS/UPI transaction reference"
                className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none font-mono"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setUtrModal(null)} className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white/40 hover:text-white hover:bg-white/06">Cancel</button>
              <button
                onClick={() => { if (utrVal.trim()) { doAction(utrModal.id, { action: "process", utrNumber: utrVal.trim() }); setUtrModal(null); } }}
                disabled={!utrVal.trim() || actionLoading === utrModal.id}
                className="flex-1 rounded-xl py-2.5 text-[14px] font-black disabled:opacity-40 hover:brightness-110"
                style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={e => { if (e.target === e.currentTarget) setRM(null); }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#1C1C1C", border: "1px solid rgba(255,255,255,0.10)" }}>
            <h3 className="text-white font-black mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
              Reject Payout
            </h3>
            <p className="text-white/40 text-[12px] mb-4">
              {rejectModal.supplier.companyName} · {fmt(Number(rejectModal.amount))}
            </p>
            <textarea value={rejectReason} onChange={e => setRR(e.target.value)} rows={3}
              placeholder="Reason for rejection (shown to supplier)"
              className="w-full rounded-xl px-4 py-3 text-[13px] text-white outline-none resize-none mb-5"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
            />
            <div className="flex gap-3">
              <button onClick={() => setRM(null)} className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white/40 hover:text-white hover:bg-white/06">Cancel</button>
              <button
                onClick={() => { doAction(rejectModal.id, { action: "reject", rejectReason }); setRM(null); }}
                disabled={actionLoading === rejectModal.id}
                className="flex-1 rounded-xl py-2.5 text-[13px] font-black disabled:opacity-40 hover:brightness-110"
                style={{ background: "rgba(248,113,113,0.15)", color: "#F87171" }}>
                Reject Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
