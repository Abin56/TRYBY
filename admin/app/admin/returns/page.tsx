"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw, Check, X, Clock, AlertCircle, IndianRupee,
  Loader2, RefreshCw, ChevronRight, Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { formatPrice, formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";
import { describeFetchError } from "@/lib/api";
import { FetchError } from "@/components/ui/fetch-error";

const STORE_API = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReturnStatus = "REQUESTED" | "APPROVED" | "PICKUP_SCHEDULED" | "RECEIVED" | "REFUNDED" | "REJECTED";
type ReturnReason = "DAMAGED" | "WRONG_ITEM" | "NOT_AS_DESCRIBED" | "CHANGED_MIND" | "DEFECTIVE" | "SIZE_ISSUE" | "OTHER";

interface ReturnItem {
  productName: string; variantSku?: string; size?: string; color?: string;
  quantity: number; unitPrice: number; imageUrl?: string;
}

interface ReturnRequest {
  id: string;
  returnNumber: string;
  status: ReturnStatus;
  reason: ReturnReason;
  reasonNote?: string;
  adminNote?: string;
  refundAmount: number;
  refundMethod: string;
  refundedAt?: string;
  imageUrls: string[];
  requestedAt: string;
  createdAt: string;
  user: { id: string; name?: string; email?: string; image?: string };
  order: { orderNumber: string };
  items: ReturnItem[];
}

interface ReturnData {
  returns: ReturnRequest[];
  total: number;
  pages: number;
  kpis: { totalRefunded: number; pendingCount: number; resolvedCount: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<ReturnStatus, { label: string; variant: "warning" | "info" | "success" | "danger" | "neutral" }> = {
  REQUESTED:        { label: "Requested",        variant: "warning" },
  APPROVED:         { label: "Approved",         variant: "info" },
  PICKUP_SCHEDULED: { label: "Pickup Scheduled", variant: "info" },
  RECEIVED:         { label: "Received",         variant: "info" },
  REFUNDED:         { label: "Refunded",         variant: "success" },
  REJECTED:         { label: "Rejected",         variant: "danger" },
};

const REASON_LABELS: Record<ReturnReason, string> = {
  DAMAGED:          "Item Damaged",
  WRONG_ITEM:       "Wrong Item Sent",
  NOT_AS_DESCRIBED: "Not as Described",
  CHANGED_MIND:     "Changed Mind",
  DEFECTIVE:        "Defective Product",
  SIZE_ISSUE:       "Size Issue",
  OTHER:            "Other",
};

const STATUS_WORKFLOW: Record<ReturnStatus, ReturnStatus | null> = {
  REQUESTED:        "APPROVED",
  APPROVED:         "PICKUP_SCHEDULED",
  PICKUP_SCHEDULED: "RECEIVED",
  RECEIVED:         "REFUNDED",
  REFUNDED:         null,
  REJECTED:         null,
};

const STATUS_TABS: { value: ReturnStatus | "all"; label: string }[] = [
  { value: "all",              label: "All" },
  { value: "REQUESTED",        label: "Requested" },
  { value: "APPROVED",         label: "Approved" },
  { value: "PICKUP_SCHEDULED", label: "Pickup" },
  { value: "RECEIVED",         label: "Received" },
  { value: "REFUNDED",         label: "Refunded" },
  { value: "REJECTED",         label: "Rejected" },
];

// ─── Return detail drawer ─────────────────────────────────────────────────────

function ReturnDetail({
  ret, onClose, onUpdate,
}: {
  ret: ReturnRequest;
  onClose: () => void;
  onUpdate: (updated: Partial<ReturnRequest> & { id: string }) => void;
}) {
  const [adminNote, setAdminNote] = useState(ret.adminNote ?? "");
  const [saving,    setSaving]    = useState(false);
  const nextStatus = STATUS_WORKFLOW[ret.status];

  const transition = async (status: ReturnStatus) => {
    setSaving(true);
    try {
      const res = await fetch(`${STORE_API}/api/admin/returns/${ret.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, adminNote }),
      });
      const updated = await res.json();
      onUpdate({ id: ret.id, status: updated.status, adminNote });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const reject = () => transition("REJECTED");
  const advance = () => nextStatus && transition(nextStatus);

  return (
    <div className="divide-y divide-[#F3F4F6]">
      {/* Customer */}
      <div className="px-6 py-4 space-y-2">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Customer</p>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white shrink-0">
            {ret.user.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-sm font-bold text-[#111827]">{ret.user.name ?? "Unknown"}</p>
            <p className="text-xs text-[#9CA3AF]">{ret.user.email}</p>
          </div>
        </div>
      </div>

      {/* Return items */}
      <div className="px-6 py-4 space-y-3">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Return Items</p>
        {ret.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            {item.imageUrl && (
              <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-[#F3F4F6]">
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#111827] truncate">{item.productName}</p>
              <p className="text-xs text-[#9CA3AF]">
                {[item.size, item.color, item.variantSku].filter(Boolean).join(" · ")} · Qty: {item.quantity}
              </p>
            </div>
            <p className="text-sm font-bold text-[#111827] shrink-0">{formatPrice(Number(item.unitPrice) * item.quantity)}</p>
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="px-6 py-4 space-y-2">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Return Details</p>
        <div className="rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] p-3 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-[#6B7280]">Order</span><span className="font-semibold text-[#374151]">{ret.order.orderNumber}</span></div>
          <div className="flex justify-between"><span className="text-[#6B7280]">Reason</span><span className="font-semibold text-[#374151]">{REASON_LABELS[ret.reason]}</span></div>
          <div className="flex justify-between"><span className="text-[#6B7280]">Refund Amount</span><span className="font-bold text-[#111827]">{formatPrice(Number(ret.refundAmount))}</span></div>
          <div className="flex justify-between"><span className="text-[#6B7280]">Refund Method</span><span className="font-semibold text-[#374151]">{ret.refundMethod.replace(/_/g, " ")}</span></div>
        </div>
        {ret.reasonNote && <p className="text-xs text-[#6B7280] italic">"{ret.reasonNote}"</p>}
      </div>

      {/* Customer photos */}
      {ret.imageUrls.length > 0 && (
        <div className="px-6 py-4 space-y-2">
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Customer Photos</p>
          <div className="flex gap-2 flex-wrap">
            {ret.imageUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="h-16 w-16 rounded-lg overflow-hidden border border-[#E5E7EB] block">
                <img src={url} alt={`Return photo ${i + 1}`} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Workflow status */}
      <div className="px-6 py-4 space-y-2">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Workflow</p>
        <div className="flex gap-1.5 flex-wrap">
          {(["REQUESTED", "APPROVED", "PICKUP_SCHEDULED", "RECEIVED", "REFUNDED"] as ReturnStatus[]).map((s) => {
            const steps = ["REQUESTED", "APPROVED", "PICKUP_SCHEDULED", "RECEIVED", "REFUNDED"];
            const currentIdx = steps.indexOf(ret.status);
            const stepIdx    = steps.indexOf(s);
            const done       = stepIdx < currentIdx;
            const current    = s === ret.status;
            return (
              <div key={s} className="flex items-center gap-1">
                <span className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                  done    ? "bg-[#DCFCE7] text-[#16A34A]" :
                  current ? "bg-[#111827] text-white" :
                  "bg-[#F3F4F6] text-[#9CA3AF]"
                )}>
                  {STATUS_META[s].label}
                </span>
                {stepIdx < 4 && <ChevronRight className="h-3 w-3 text-[#D1D5DB]" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin note */}
      <div className="px-6 py-4">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">Admin Note</p>
        <textarea
          rows={3}
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder="Add a note about this return decision…"
          className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#2563EB] resize-none transition-all"
        />
      </div>

      {/* Actions */}
      {ret.status !== "REFUNDED" && ret.status !== "REJECTED" && (
        <div className="px-6 py-4 flex gap-2">
          <button onClick={reject} disabled={saving}
            className="flex-1 h-9 rounded-lg border border-[#FECDD3] bg-[#FFF1F2] text-xs font-semibold text-[#DC2626] hover:bg-[#FFE4E6] transition-colors disabled:opacity-60">
            <X className="h-3.5 w-3.5 inline mr-1" /> Reject
          </button>
          {nextStatus && (
            <button onClick={advance} disabled={saving}
              className="flex-1 h-9 rounded-lg bg-[#111827] text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors disabled:opacity-60 flex items-center justify-center gap-1">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              → {STATUS_META[nextStatus].label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReturnsPage() {
  const [data,        setData]        = useState<ReturnData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [statusFilter, setStatus]     = useState<ReturnStatus | "all">("all");
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [selected,    setSelected]    = useState<ReturnRequest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("q", search);
      const res  = await fetch(`${STORE_API}/api/admin/returns?${params}`, { credentials: "include" });
      const json = await res.json();
      setData(json);
    } catch (err) {
      setData(null);
      setError(describeFetchError(err));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = (patch: Partial<ReturnRequest> & { id: string }) => {
    setData((prev) => prev
      ? { ...prev, returns: prev.returns.map((r) => r.id === patch.id ? { ...r, ...patch } : r) }
      : prev
    );
  };

  const returns = data?.returns ?? [];
  const kpis    = data?.kpis;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Returns & Refunds</h1>
          <p className="text-sm text-[#9CA3AF]">Manage return requests and refund workflow</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E7EB] px-3 text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {error && <FetchError message={error} onRetry={load} loading={loading} />}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Returns",    value: data?.total ?? 0,              icon: RotateCcw,    color: "#6B7280", bg: "#F9FAFB",  fmt: String },
          { label: "Pending Action",   value: kpis?.pendingCount ?? 0,       icon: Clock,        color: "#D97706", bg: "#FFFBEB",  fmt: String },
          { label: "Total Refunded",   value: kpis?.totalRefunded ?? 0,      icon: IndianRupee,  color: "#16A34A", bg: "#F0FDF4",  fmt: formatPrice },
          { label: "Resolved",         value: kpis?.resolvedCount ?? 0,      icon: AlertCircle,  color: "#2563EB", bg: "#EFF6FF",  fmt: String },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background: c.bg }}>
                <Icon className="h-5 w-5" style={{ color: c.color }} />
              </div>
              <div>
                {loading ? <div className="h-6 w-12 rounded bg-[#F3F4F6] animate-pulse mb-1" /> : <p className="text-xl font-extrabold text-[#111827]">{c.fmt(c.value as never)}</p>}
                <p className="text-xs text-[#9CA3AF]">{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status tabs + search */}
      <div className="space-y-3">
        <div className="flex gap-1 border-b border-[#E5E7EB]">
          {STATUS_TABS.map((s) => (
            <button key={s.value} onClick={() => { setStatus(s.value as ReturnStatus | "all"); setPage(1); }}
              className={cn("px-3 py-2 text-xs font-semibold border-b-2 transition-all -mb-px whitespace-nowrap",
                statusFilter === s.value ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-[#6B7280] hover:text-[#111827]")}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by return #, customer, order…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E5E7EB] bg-white text-sm placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] transition-all" />
        </div>
      </div>

      {/* Return cards */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#E5E7EB] bg-white p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : returns.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 rounded-xl border border-[#E5E7EB] bg-white text-center">
          <RotateCcw className="h-10 w-10 text-[#D1D5DB]" />
          <p className="text-sm font-semibold text-[#374151]">No return requests found</p>
          <p className="text-xs text-[#9CA3AF]">Return requests submitted by customers will appear here</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {returns.map((ret, i) => (
            <motion.div key={ret.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => setSelected(ret)}
              className="rounded-xl border border-[#E5E7EB] bg-white p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-[#D1D5DB] transition-all cursor-pointer">

              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-mono font-bold text-[#374151]">{ret.returnNumber}</p>
                    <Badge variant={STATUS_META[ret.status].variant} dot>{STATUS_META[ret.status].label}</Badge>
                  </div>
                  <p className="text-xs text-[#9CA3AF]">Order: <span className="font-semibold text-[#374151]">{ret.order.orderNumber}</span> · {formatRelative(ret.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-extrabold text-[#111827]">{formatPrice(Number(ret.refundAmount))}</p>
                  <p className="text-xs text-[#9CA3AF]">{ret.refundMethod.replace(/_/g, " ")}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white shrink-0">
                    {ret.user.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#111827] truncate">{ret.user.name ?? "Unknown"}</p>
                    <p className="text-xs text-[#9CA3AF] truncate">{ret.user.email}</p>
                  </div>
                </div>

                <span className="rounded-full bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 text-[11px] font-semibold text-[#6B7280] shrink-0">
                  {REASON_LABELS[ret.reason]}
                </span>

                {ret.status === "REQUESTED" && (
                  <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={async () => {
                        await fetch(`${STORE_API}/api/admin/returns/${ret.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ status: "APPROVED" }) });
                        handleUpdate({ id: ret.id, status: "APPROVED" });
                      }}
                      className="flex items-center gap-1 h-7 px-3 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs font-semibold text-[#16A34A] hover:bg-[#DCFCE7] transition-colors">
                      <Check className="h-3 w-3" /> Approve
                    </button>
                    <button
                      onClick={async () => {
                        await fetch(`${STORE_API}/api/admin/returns/${ret.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ status: "REJECTED" }) });
                        handleUpdate({ id: ret.id, status: "REJECTED" });
                      }}
                      className="flex items-center gap-1 h-7 px-3 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] text-xs font-semibold text-[#DC2626] hover:bg-[#FFE4E6] transition-colors">
                      <X className="h-3 w-3" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Pagination */}
      {(data?.pages ?? 1) > 1 && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: data!.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={cn("h-8 w-8 rounded-lg text-xs font-semibold transition-colors",
                p === page ? "bg-[#111827] text-white" : "text-[#6B7280] hover:bg-[#F3F4F6]")}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.returnNumber ?? ""}
        subtitle={selected ? `${REASON_LABELS[selected.reason]} · ${formatPrice(Number(selected.refundAmount))}` : ""}
        footer={null}
      >
        {selected && (
          <ReturnDetail
            ret={selected}
            onClose={() => setSelected(null)}
            onUpdate={handleUpdate}
          />
        )}
      </Drawer>
    </div>
  );
}
