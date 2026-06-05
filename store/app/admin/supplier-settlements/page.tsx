"use client";

import { useEffect, useState, useCallback } from "react";
import {
  IndianRupee, Clock, CheckCircle, XCircle, AlertTriangle,
  Search, ChevronLeft, ChevronRight, Zap, Filter,
  ArrowUpRight, RefreshCw, ShieldAlert,
} from "lucide-react";
import Link from "next/link";

type Supplier = { id: string; companyName: string; tier: string; user: { name: string; email: string } };
type Dispute  = { id: string; status: string };
type Settlement = {
  id: string; orderId: string; orderNumber: string; status: string;
  grossAmount: number; commissionAmt: number; gstOnCommission: number;
  netAmount: number; holdDays: number; holdUntil: string; deliveredAt: string;
  releasedAt: string | null; createdAt: string;
  supplier: Supplier; disputes: Dispute[];
};

type StatusCount = { count: number; amount: number };
type PendingLiability = { gross: number; commission: number; gst: number; net: number; count: number };

type ListResponse = {
  settlements: Settlement[];
  total:       number;
  pages:       number;
  counts:      Record<string, StatusCount>;
  pendingLiability: PendingLiability;
};

const STATUS_COLOR: Record<string, string> = {
  HOLDING:   "#F5C518",
  AVAILABLE: "#4ADE80",
  PAID:      "#A78BFA",
  CANCELLED: "#9CA3AF",
  DISPUTED:  "#F87171",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  HOLDING:   <Clock className="h-3.5 w-3.5" />,
  AVAILABLE: <CheckCircle className="h-3.5 w-3.5" />,
  PAID:      <IndianRupee className="h-3.5 w-3.5" />,
  CANCELLED: <XCircle className="h-3.5 w-3.5" />,
  DISPUTED:  <ShieldAlert className="h-3.5 w-3.5" />,
};

const STATUS_OPTIONS = ["", "HOLDING", "AVAILABLE", "PAID", "CANCELLED", "DISPUTED"];

export default function AdminSettlementsPage() {
  const [data,         setData]         = useState<ListResponse | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(1);
  const [status,       setStatus]       = useState("");
  const [q,            setQ]            = useState("");
  const [disputed,     setDisputed]     = useState(false);
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [releasing,    setReleasing]    = useState(false);
  const [releaseMsg,   setReleaseMsg]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status)   params.set("status",   status);
    if (q)        params.set("q",        q);
    if (disputed) params.set("disputed", "true");
    const res  = await fetch(`/api/admin/supplier-settlements?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [page, status, q, disputed]);

  useEffect(() => { load(); }, [load]);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function selectAll() {
    if (!data) return;
    setSelected(new Set(data.settlements.map(s => s.id)));
  }
  function clearSelect() { setSelected(new Set()); }

  async function releaseSelected() {
    if (!selected.size) return;
    setReleasing(true);
    setReleaseMsg("");
    const res  = await fetch("/api/admin/supplier-settlements", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "release", ids: [...selected] }),
    });
    const json = await res.json();
    setReleaseMsg(`Released ${json.released} settlement${json.released !== 1 ? "s" : ""}`);
    setSelected(new Set());
    setReleasing(false);
    load();
  }

  async function releaseMatured() {
    setReleasing(true);
    setReleaseMsg("");
    const res  = await fetch("/api/admin/supplier-settlements", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "release-matured" }),
    });
    const json = await res.json();
    setReleaseMsg(`Released ${json.released} matured settlement${json.released !== 1 ? "s" : ""}`);
    setReleasing(false);
    load();
  }

  const fmt = (n: number) =>
    `₹${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const daysLeft = (iso: string) => {
    const diff = new Date(iso).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  const holdingCount  = data?.counts?.HOLDING?.count   ?? 0;
  const holdingAmount = data?.counts?.HOLDING?.amount   ?? 0;
  const availCount    = data?.counts?.AVAILABLE?.count  ?? 0;
  const availAmount   = data?.counts?.AVAILABLE?.amount ?? 0;
  const disputedCount = data?.counts?.DISPUTED?.count   ?? 0;

  return (
    <div className="p-6 lg:p-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Supplier Settlements
          </h1>
          <p className="text-white/40 text-[13px] mt-0.5">
            Manage holding periods, release earnings, and resolve disputes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={releaseMatured}
            disabled={releasing}
            className="flex items-center gap-2 rounded-xl px-4 py-2 font-black text-[12px] disabled:opacity-40 hover:brightness-110 transition-all"
            style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            <Zap className="h-3.5 w-3.5" />
            {releasing ? "Releasing…" : "Release Matured"}
          </button>
        </div>
      </div>

      {/* Liability snapshot */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: "In Holding",      value: holdingAmount,               color: "#F5C518", sub: `${holdingCount} orders`       },
            { label: "Available",       value: availAmount,                  color: "#4ADE80", sub: `${availCount} ready to pay`   },
            { label: "Open Disputes",   value: disputedCount,                color: "#F87171", sub: "pending resolution", isCount: true },
            { label: "Platform GMV",    value: data.pendingLiability.gross,  color: "#60A5FA", sub: "holding + available"           },
            { label: "Net Liability",   value: data.pendingLiability.net,    color: "#A78BFA", sub: "owed to suppliers"             },
          ].map(card => (
            <div key={card.label} className="rounded-2xl p-4"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] text-white/35 mb-1.5">{card.label}</p>
              <p className="font-black mb-0.5"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", color: card.color }}>
                {(card as { isCount?: boolean }).isCount ? card.value : fmt(Number(card.value))}
              </p>
              <p className="text-[10px]" style={{ color: `${card.color}80` }}>{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {releaseMsg && (
        <div className="flex items-center gap-3 rounded-2xl px-5 py-3 mb-5"
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.20)" }}>
          <CheckCircle className="h-4 w-4 text-[#4ADE80] shrink-0" />
          <p className="text-[13px] text-[#4ADE80]">{releaseMsg}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Order # or supplier…"
            className="w-full bg-[#1A1A1A] border text-[12px] text-white rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#F5C518]/50 placeholder-white/20"
            style={{ borderColor: "rgba(255,255,255,0.10)" }}
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="appearance-none bg-[#1A1A1A] border text-[12px] text-white/80 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#F5C518]/50"
            style={{ borderColor: "rgba(255,255,255,0.10)" }}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s || "All Statuses"}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => { setDisputed(d => !d); setPage(1); }}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold transition-all"
          style={{
            background: disputed ? "rgba(248,113,113,0.12)" : "#1A1A1A",
            color:      disputed ? "#F87171" : "rgba(255,255,255,0.40)",
            border:     `1px solid ${disputed ? "rgba(248,113,113,0.30)" : "rgba(255,255,255,0.08)"}`,
          }}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          Disputed only
        </button>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[12px] text-white/50">{selected.size} selected</span>
            <button onClick={releaseSelected} disabled={releasing}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold bg-[#4ADE80]/10 text-[#4ADE80] hover:bg-[#4ADE80]/20 disabled:opacity-40 transition-all">
              <Zap className="h-3 w-3" /> Release Selected
            </button>
            <button onClick={clearSelect} className="text-[11px] text-white/30 hover:text-white/60 transition-colors">
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
        </div>
      ) : !data || data.settlements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <IndianRupee className="h-8 w-8 text-white/15 mb-3" />
          <p className="text-white/40 text-[14px]">No settlements found</p>
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
                    <th className="py-3 px-4">
                      <input type="checkbox"
                        checked={selected.size === data.settlements.length && data.settlements.length > 0}
                        onChange={e => e.target.checked ? selectAll() : clearSelect()}
                        className="accent-[#F5C518]"
                      />
                    </th>
                    {["Order","Supplier","Status","Gross","Commission","Net","Hold / Release","Disputes",""].map(h => (
                      <th key={h} className="py-3 px-4 text-left font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {data.settlements.map(s => {
                    const color     = STATUS_COLOR[s.status] ?? "#9CA3AF";
                    const isHolding = s.status === "HOLDING";
                    const days      = isHolding ? daysLeft(s.holdUntil) : null;
                    const hasOpenDispute = s.disputes.length > 0;
                    return (
                      <tr key={s.id}
                        className="hover:bg-white/02 transition-colors"
                        style={hasOpenDispute ? { background: "rgba(248,113,113,0.03)" } : undefined}>
                        <td className="py-3 px-4">
                          <input type="checkbox"
                            checked={selected.has(s.id)}
                            onChange={() => toggleSelect(s.id)}
                            disabled={s.status !== "HOLDING"}
                            className="accent-[#F5C518] disabled:opacity-30"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-white/70">{s.orderNumber}</span>
                          <p className="text-[10px] text-white/30 mt-0.5">{fmtDate(s.createdAt)}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-white/80 font-semibold">{s.supplier.companyName}</p>
                          <p className="text-[10px] text-white/30">{s.supplier.tier}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold w-fit"
                            style={{ background: `${color}18`, color }}>
                            <span style={{ color }}>{STATUS_ICON[s.status]}</span>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white/60 whitespace-nowrap">{fmt(Number(s.grossAmount))}</td>
                        <td className="py-3 px-4 text-[#F87171] whitespace-nowrap">
                          −{fmt(Number(s.commissionAmt) + Number(s.gstOnCommission))}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#4ADE80] whitespace-nowrap">{fmt(Number(s.netAmount))}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isHolding ? (
                            <span className="text-[#F5C518]">
                              {days === 0 ? "Releasing soon" : `${days}d left`}
                            </span>
                          ) : s.releasedAt ? (
                            <span className="text-white/30">{fmtDate(s.releasedAt)}</span>
                          ) : (
                            <span className="text-white/20">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {hasOpenDispute ? (
                            <span className="flex items-center gap-1 text-[#F87171] text-[11px] font-bold">
                              <AlertTriangle className="h-3 w-3" /> {s.disputes.length}
                            </span>
                          ) : (
                            <span className="text-white/20">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/admin/supplier-settlements/${s.id}`}
                            className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white transition-colors">
                            Detail <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-white/35">{data.total} total · Page {page} of {data.pages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/08 disabled:opacity-30 transition-all">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/08 disabled:opacity-30 transition-all">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
