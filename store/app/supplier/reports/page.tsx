"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText, Download, Calendar, TrendingUp, TrendingDown,
  IndianRupee, BarChart2, AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react";

type MonthSummary = { month: string; credit: number; debit: number; net: number };

type GSTSummary = {
  totalGrossRevenue: number;
  totalCommission:   number;
  totalGSTCollected: number;
  taxableValue:      number;
  igst:              number;
};

type LedgerEntry = {
  id: string; type: string; amount: number; grossAmount: number;
  commissionAmt: number; gstOnCommission: number; netAmount: number;
  description: string; orderNumber: string | null; balanceAfter: number;
  createdAt: string;
};

type ReportData = {
  supplier: { companyName: string; gstin: string | null; gstRate: number };
  period:   { from?: string; to?: string };
  summary:  { totalEntries: number; totalCredits: number; totalDebits: number; netEarnings: number };
  gst:      GSTSummary;
  monthlyBreakdown: MonthSummary[];
  entries:  LedgerEntry[];
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function getMonthOptions() {
  const now   = new Date();
  const opts  = [];
  for (let i = 0; i < 12; i++) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const lbl = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    opts.push({ val, lbl });
  }
  return opts;
}

export default function SupplierReportsPage() {
  const monthOptions = getMonthOptions();
  const [month,    setMonth]    = useState(monthOptions[0].val);
  const [data,     setData]     = useState<ReportData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [exporting,setExporting]= useState(false);
  const [error,    setError]    = useState("");
  const [entryPage, setEntryPage] = useState(1);
  const ENTRY_PER_PAGE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`/api/supplier/reports?month=${month}`);
      if (!res.ok) throw new Error("Failed to load report");
      setData(await res.json());
      setEntryPage(1);
    } catch {
      setError("Could not load report. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  async function downloadCSV() {
    setExporting(true);
    try {
      const res  = await fetch(`/api/supplier/reports?month=${month}&format=csv`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `tryby-settlement-${month}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const fmt = (n: number) =>
    `₹${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const paginatedEntries = data
    ? data.entries.slice((entryPage - 1) * ENTRY_PER_PAGE, entryPage * ENTRY_PER_PAGE)
    : [];
  const entryPages = data ? Math.ceil(data.entries.length / ENTRY_PER_PAGE) : 1;

  const ENTRY_TYPE_COLOR: Record<string, string> = {
    ORDER_EARNING: "#4ADE80", HOLDING_CREDIT: "#4ADE80",
    MANUAL_CREDIT: "#60A5FA", DISPUTE_CREDIT: "#4ADE80",
    COMMISSION_DEDUCTION: "#F87171", GST_DEDUCTION: "#F87171",
    SHIPPING_DEDUCTION: "#F87171", REFUND_DEDUCTION: "#F87171",
    RETURN_DEDUCTION: "#F87171", PAYOUT_DEBIT: "#A78BFA",
    MANUAL_DEBIT: "#F87171", DISPUTE_DEBIT: "#F87171",
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1080px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Reports & Settlement Export
          </h1>
          <p className="text-white/40 text-[13px] mt-0.5">
            View monthly earnings, GST summary, and download CSV for your records
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Month selector */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="appearance-none bg-[#1A1A1A] border text-[12px] text-white/80 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#F5C518]/50"
              style={{ borderColor: "rgba(255,255,255,0.10)" }}
            >
              {monthOptions.map(o => (
                <option key={o.val} value={o.val}>{o.lbl}</option>
              ))}
            </select>
          </div>

          {/* CSV Export */}
          <button
            onClick={downloadCSV}
            disabled={exporting || loading || !data}
            className="flex items-center gap-2 rounded-xl px-4 py-2 font-black text-[12px] disabled:opacity-40 hover:brightness-110 transition-all"
            style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl px-5 py-4 mb-6"
          style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
          <AlertCircle className="h-4 w-4 text-[#F87171] shrink-0" />
          <p className="text-[13px] text-[#F87171]">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
        </div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Credits",   value: data.summary.totalCredits,  color: "#4ADE80", icon: TrendingUp   },
              { label: "Total Debits",    value: data.summary.totalDebits,   color: "#F87171", icon: TrendingDown },
              { label: "Net Earnings",    value: data.summary.netEarnings,   color: "#F5C518", icon: IndianRupee  },
              { label: "Transactions",    value: data.summary.totalEntries,  color: "#60A5FA", icon: BarChart2, isCount: true },
            ].map(card => (
              <div key={card.label} className="rounded-2xl p-4"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl mb-3"
                  style={{ background: `${card.color}18` }}>
                  <card.icon className="h-3.5 w-3.5" style={{ color: card.color }} />
                </div>
                <p className="font-black mb-0.5"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", color: card.color }}>
                  {(card as { isCount?: boolean }).isCount ? card.value : fmt(card.value)}
                </p>
                <p className="text-[11px] text-white/40">{card.label}</p>
              </div>
            ))}
          </div>

          {/* GST Summary */}
          <div className="rounded-2xl p-5 mb-6"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-white font-black mb-4"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px" }}>
              GST Summary
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: "Gross Revenue",     value: data.gst.totalGrossRevenue },
                { label: "Platform Commission",value: data.gst.totalCommission   },
                { label: "Taxable Value",      value: data.gst.taxableValue      },
                { label: "IGST (18%)",         value: data.gst.igst              },
                { label: "GST Collected",      value: data.gst.totalGSTCollected },
              ].map(g => (
                <div key={g.label}>
                  <p className="text-[10px] text-white/35 mb-1">{g.label}</p>
                  <p className="font-black text-white/80"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px" }}>
                    {fmt(g.value)}
                  </p>
                </div>
              ))}
            </div>
            {data.supplier.gstin && (
              <p className="mt-4 text-[11px] text-white/30">
                GSTIN: <span className="text-white/50 font-mono">{data.supplier.gstin}</span>
                {" · "}GST Rate: <span className="text-white/50">{(data.supplier.gstRate * 100).toFixed(0)}%</span>
              </p>
            )}
          </div>

          {/* Monthly breakdown */}
          {data.monthlyBreakdown.length > 0 && (
            <div className="rounded-2xl p-5 mb-6"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="text-white font-black mb-4"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px" }}>
                Monthly Breakdown
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-white/30" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {["Month","Credits","Debits","Net"].map(h => (
                        <th key={h} className="pb-3 pr-6 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    {data.monthlyBreakdown.map(row => (
                      <tr key={row.month}>
                        <td className="py-2.5 pr-6 text-white/60 font-mono">{row.month}</td>
                        <td className="py-2.5 pr-6 text-[#4ADE80]">{fmt(row.credit)}</td>
                        <td className="py-2.5 pr-6 text-[#F87171]">{fmt(row.debit)}</td>
                        <td className="py-2.5 pr-6 font-bold" style={{ color: row.net >= 0 ? "#4ADE80" : "#F87171" }}>
                          {row.net >= 0 ? "+" : "−"}{fmt(row.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transaction detail table */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-black"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
              Transaction Detail
            </h2>
            <p className="text-[12px] text-white/35">{data.entries.length} entries</p>
          </div>

          {data.entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 rounded-2xl"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <FileText className="h-8 w-8 text-white/15 mb-3" />
              <p className="text-white/40 text-[14px]">No transactions for this period</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl overflow-hidden mb-4"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="text-white/30 text-[10px]"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        {["Date","Order","Type","Description","Gross","Commission","GST","Net","Credit/Debit","Balance"].map(h => (
                          <th key={h} className="py-3 px-4 text-left font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                      {paginatedEntries.map(e => {
                        const color    = ENTRY_TYPE_COLOR[e.type] ?? "#9CA3AF";
                        const isCredit = Number(e.amount) >= 0;
                        return (
                          <tr key={e.id} className="hover:bg-white/02 transition-colors">
                            <td className="py-3 px-4 text-white/40 whitespace-nowrap">{fmtDate(e.createdAt)}</td>
                            <td className="py-3 px-4 text-white/50 font-mono whitespace-nowrap">{e.orderNumber ?? "—"}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                                style={{ background: `${color}18`, color }}>
                                {e.type.replace(/_/g," ")}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-white/60 max-w-[180px] truncate">{e.description}</td>
                            <td className="py-3 px-4 text-white/50 whitespace-nowrap">{fmt(Number(e.grossAmount))}</td>
                            <td className="py-3 px-4 text-[#F87171] whitespace-nowrap">{fmt(Number(e.commissionAmt))}</td>
                            <td className="py-3 px-4 text-[#F87171] whitespace-nowrap">{fmt(Number(e.gstOnCommission))}</td>
                            <td className="py-3 px-4 text-white/60 whitespace-nowrap">{fmt(Number(e.netAmount))}</td>
                            <td className="py-3 px-4 font-bold whitespace-nowrap"
                              style={{ color: isCredit ? "#4ADE80" : "#F87171" }}>
                              {isCredit ? "+" : "−"}{fmt(Number(e.amount))}
                            </td>
                            <td className="py-3 px-4 text-white/35 whitespace-nowrap">{fmt(Number(e.balanceAfter))}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {entryPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-white/35">Page {entryPage} of {entryPages}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEntryPage(p => Math.max(1, p - 1))} disabled={entryPage === 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/08 disabled:opacity-30 transition-all">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEntryPage(p => Math.min(entryPages, p + 1))} disabled={entryPage === entryPages}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/08 disabled:opacity-30 transition-all">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
