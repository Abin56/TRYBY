"use client";

import { useEffect, useState, useCallback } from "react";
import {
  IndianRupee, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, Clock, XCircle, TrendingUp, ArrowDownCircle,
} from "lucide-react";

type Settlement = {
  id: string;
  period: string;
  grossRevenue: number;
  commissionAmount: number;
  gstOnCommission: number;
  shippingDeduction: number;
  returnDeductions: number;
  otherDeductions: number;
  netSettlement: number;
  status: string;
  notes: string | null;
  settledAt: string | null;
  createdAt: string;
};

type WalletBalances = {
  available: number;
  pending: number;
  processing: number;
  lifetime: number;
  deductions: number;
  totalPaidOut: number;
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "#F5C518",
  APPROVED:  "#60A5FA",
  PROCESSED: "#4ADE80",
  ON_HOLD:   "#FB923C",
  DISPUTED:  "#F87171",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Pending",
  APPROVED:  "Approved",
  PROCESSED: "Settled",
  ON_HOLD:   "On Hold",
  DISPUTED:  "Disputed",
};

const STATUS_ICON: Record<string, React.ElementType> = {
  PENDING:   Clock,
  APPROVED:  TrendingUp,
  PROCESSED: CheckCircle2,
  ON_HOLD:   Clock,
  DISPUTED:  XCircle,
};

export default function SupplierSettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [total, setTotal]             = useState(0);
  const [pages, setPages]             = useState(1);
  const [page, setPage]               = useState(1);
  const [balances, setBalances]       = useState<WalletBalances | null>(null);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    const [settleRes, walletRes] = await Promise.all([
      fetch(`/api/supplier/settlements?page=${page}${statusFilter ? `&status=${statusFilter}` : ""}`),
      fetch("/api/supplier/wallet"),
    ]);

    const settleData = await settleRes.json();
    const walletData = await walletRes.json();

    setSettlements(settleData.settlements ?? []);
    setTotal(settleData.total ?? 0);
    setPages(settleData.pages ?? 1);
    setBalances(walletData.balances ?? null);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 lg:p-8 max-w-[1000px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-white font-black"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}
          >
            Settlement Center
          </h1>
          <p className="text-white/40 text-[13px] mt-0.5">{total} settlement record{total !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-opacity hover:opacity-70"
          style={{ background: "rgba(255,255,255,0.07)", color: "#fff" }}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Balance cards */}
      {balances && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Available Balance",  value: balances.available,   color: "#4ADE80",  icon: CheckCircle2 },
            { label: "Pending (Hold)",      value: balances.pending,     color: "#F5C518",  icon: Clock },
            { label: "Processing",          value: balances.processing,  color: "#60A5FA",  icon: TrendingUp },
            { label: "Total Earnings",      value: balances.lifetime,    color: "#fff",     icon: IndianRupee },
            { label: "Total Deductions",    value: balances.deductions,  color: "#F87171",  icon: ArrowDownCircle },
            { label: "Total Paid Out",      value: balances.totalPaidOut, color: "#A78BFA", icon: CheckCircle2 },
          ].map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                <p className="text-white/35 text-[11px] font-semibold uppercase tracking-wide">{label}</p>
              </div>
              <p
                className="font-black"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", color }}
              >
                ₹{Number(value).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl text-[13px] text-white/70 outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <option value="">All Settlements</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-5 w-5 animate-spin text-[#F5C518]" />
        </div>
      ) : settlements.length === 0 ? (
        <div className="text-center py-16 text-white/25 text-[14px]">No settlements yet</div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                {["Period", "Gross Revenue", "Commission", "Returns", "Net Settlement", "Status", "Settled On"].map(h => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: "rgba(255,255,255,0.30)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {settlements.map((s, i) => {
                const Icon = STATUS_ICON[s.status] ?? Clock;
                return (
                  <tr
                    key={s.id}
                    style={{ borderBottom: i < settlements.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                  >
                    <td className="px-4 py-3.5 text-white font-semibold">{s.period}</td>
                    <td className="px-4 py-3.5 text-white">₹{Number(s.grossRevenue).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3.5 text-[#F87171]">
                      −₹{(Number(s.commissionAmount) + Number(s.gstOnCommission)).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5" style={{ color: Number(s.returnDeductions) > 0 ? "#F87171" : "rgba(255,255,255,0.30)" }}>
                      {Number(s.returnDeductions) > 0 ? `−₹${Number(s.returnDeductions).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#4ADE80]">
                      ₹{Number(s.netSettlement).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="flex items-center gap-1 w-fit text-[11px] font-bold px-2.5 py-1 rounded-full"
                        style={{
                          background: `${STATUS_COLOR[s.status] ?? "#9CA3AF"}18`,
                          color:      STATUS_COLOR[s.status] ?? "#9CA3AF",
                        }}
                      >
                        <Icon className="h-3 w-3" />
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-white/35">
                      {s.settledAt
                        ? new Date(s.settledAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-white/30 text-[13px]">{total} total</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-xl disabled:opacity-25" style={{ background: "rgba(255,255,255,0.05)" }}>
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            <span className="text-white/40 text-[13px]">{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-xl disabled:opacity-25" style={{ background: "rgba(255,255,255,0.05)" }}>
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
