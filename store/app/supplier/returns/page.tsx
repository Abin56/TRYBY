"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RotateCcw, RefreshCw, ChevronLeft, ChevronRight,
  TrendingDown, Package, AlertCircle,
} from "lucide-react";

type ReturnItem = {
  id: string;
  quantity: number;
  reason: string | null;
  returnItem: { productName: string; variantSku: string; imageUrl: string | null } | null;
};

type ReturnRequest = {
  id: string;
  returnNumber: string;
  status: string;
  reason: string;
  reasonNote: string | null;
  refundAmount: number;
  refundMethod: string;
  imageUrls: string[];
  requestedAt: string;
  createdAt: string;
  order: {
    orderNumber: string;
    createdAt: string;
    items: { productName: string; quantity: number; variantSku: string; imageUrl: string | null }[];
  };
  user: { name: string | null; email: string | null };
  items: ReturnItem[];
};

type Analytics = {
  totalReturns: number;
  returnRate: number;
};

const STATUS_COLOR: Record<string, string> = {
  REQUESTED:        "#F5C518",
  APPROVED:         "#4ADE80",
  PICKUP_SCHEDULED: "#60A5FA",
  RECEIVED:         "#A78BFA",
  REFUNDED:         "#4ADE80",
  REJECTED:         "#F87171",
};

const STATUS_LABEL: Record<string, string> = {
  REQUESTED:        "Requested",
  APPROVED:         "Approved",
  PICKUP_SCHEDULED: "Pickup Scheduled",
  RECEIVED:         "Received",
  REFUNDED:         "Refunded",
  REJECTED:         "Rejected",
};

const REASON_LABEL: Record<string, string> = {
  DAMAGED:          "Item Damaged",
  WRONG_ITEM:       "Wrong Item",
  NOT_AS_DESCRIBED: "Not as Described",
  CHANGED_MIND:     "Changed Mind",
  DEFECTIVE:        "Defective",
  SIZE_ISSUE:       "Size Issue",
  OTHER:            "Other",
};

export default function SupplierReturnsPage() {
  const [returns, setReturns]   = useState<ReturnRequest[]>([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [status, setStatus]     = useState("");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    const res  = await fetch(`/api/supplier/returns?${params}`);
    const data = await res.json();
    setReturns(data.returns ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setAnalytics(data.analytics ?? null);
    setLoading(false);
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-white font-black"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}
          >
            Returns Portal
          </h1>
          <p className="text-white/40 text-[13px] mt-0.5">{total} return request{total !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-opacity hover:opacity-70"
          style={{ background: "rgba(255,255,255,0.07)", color: "#fff" }}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-white/35 text-[11px] font-semibold uppercase tracking-wide mb-1">Total Returns</p>
            <p className="text-[28px] font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {analytics.totalReturns}
            </p>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-white/35 text-[11px] font-semibold uppercase tracking-wide mb-1">Return Rate</p>
            <p
              className="text-[28px] font-black"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: analytics.returnRate > 20 ? "#F87171" : analytics.returnRate > 10 ? "#F5C518" : "#4ADE80" }}
            >
              {analytics.returnRate.toFixed(1)}%
            </p>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-white/35 text-[11px] font-semibold uppercase tracking-wide mb-1">Status Breakdown</p>
            <div className="space-y-0.5 mt-1">
              {["REQUESTED", "APPROVED", "REJECTED"].map(s => {
                const count = returns.filter(r => r.status === s).length;
                return (
                  <div key={s} className="flex items-center justify-between text-[12px]">
                    <span style={{ color: STATUS_COLOR[s] }}>{STATUS_LABEL[s]}</span>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4">
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl text-[13px] text-white/70 outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="h-5 w-5 animate-spin text-[#F5C518]" />
        </div>
      ) : returns.length === 0 ? (
        <div className="text-center py-24 text-white/25 text-[14px]">No return requests</div>
      ) : (
        <div className="space-y-3">
          {returns.map(ret => (
            <div
              key={ret.id}
              className="rounded-2xl overflow-hidden cursor-pointer"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              onClick={() => setExpanded(expanded === ret.id ? null : ret.id)}
            >
              {/* Row */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <RotateCcw className="h-4 w-4 text-white/25 shrink-0" />
                  <div>
                    <span className="text-white font-bold text-[14px]">#{ret.order.orderNumber}</span>
                    <span className="text-white/30 text-[12px] ml-2">
                      {new Date(ret.requestedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${STATUS_COLOR[ret.status] ?? "#9CA3AF"}18`, color: STATUS_COLOR[ret.status] ?? "#9CA3AF" }}
                  >
                    {STATUS_LABEL[ret.status] ?? ret.status}
                  </span>
                  <span className="text-white/40 text-[13px]">{REASON_LABEL[ret.reason] ?? ret.reason}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white font-bold text-[14px]">
                    ₹{Number(ret.refundAmount).toLocaleString("en-IN")}
                  </span>
                  <span className="text-white/30 text-[11px]">{expanded === ret.id ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === ret.id && (
                <div
                  className="px-5 py-4 space-y-4"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer & reason */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-white/30 text-[11px] font-semibold uppercase tracking-wide mb-1">Customer</p>
                        <p className="text-white text-[13px]">{ret.user.name ?? "—"}</p>
                        <p className="text-white/40 text-[12px]">{ret.user.email}</p>
                      </div>
                      <div>
                        <p className="text-white/30 text-[11px] font-semibold uppercase tracking-wide mb-1">Reason</p>
                        <p className="text-white/70 text-[13px]">{REASON_LABEL[ret.reason] ?? ret.reason}</p>
                        {ret.reasonNote && <p className="text-white/40 text-[12px] mt-1 italic">{ret.reasonNote}</p>}
                      </div>
                      {ret.imageUrls.length > 0 && (
                        <div>
                          <p className="text-white/30 text-[11px] font-semibold uppercase tracking-wide mb-2">Customer Photos</p>
                          <div className="flex flex-wrap gap-2">
                            {ret.imageUrls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noreferrer">
                                <img src={url} alt="" className="h-16 w-16 object-cover rounded-xl" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div>
                      <p className="text-white/30 text-[11px] font-semibold uppercase tracking-wide mb-2">Returned Items</p>
                      <div className="space-y-2">
                        {ret.order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt="" className="h-10 w-10 object-cover rounded-lg shrink-0" />
                            )}
                            <div>
                              <p className="text-white/80 text-[13px]">{item.productName}</p>
                              <p className="text-white/30 text-[11px]">{item.variantSku} · Qty {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Info note */}
                  <div
                    className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-[12px]"
                    style={{ background: "rgba(245,197,24,0.06)", color: "rgba(245,197,24,0.7)" }}
                  >
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Return approvals and refunds are processed by TRYBY admin. Any accepted return affects your settlement balance.
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-white/30 text-[13px]">{total} total</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={e => { e.stopPropagation(); setPage(p => p - 1); }}
              className="p-2 rounded-xl disabled:opacity-25"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            <span className="text-white/40 text-[13px]">{page} / {pages}</span>
            <button disabled={page >= pages} onClick={e => { e.stopPropagation(); setPage(p => p + 1); }}
              className="p-2 rounded-xl disabled:opacity-25"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
