"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, Package, Truck, ChevronDown, Check,
  CheckCircle2, Clock, AlertTriangle, Send,
} from "lucide-react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

type PickingStatus = "PENDING" | "IN_PROGRESS" | "PICKED" | "PACKED" | "DISPATCHED" | "CANCELLED";

interface Allocation {
  id: string; orderId: string; variantId: string; warehouseId: string;
  reservedQty: number; status: PickingStatus;
  pickedAt: string | null; packedAt: string | null;
  variant: { sku: string; size: string | null; color: string | null };
  warehouse: { id: string; name: string; code: string };
  order: {
    id: string; orderNumber: string; status: string; total: number; createdAt: string;
    user: { name: string | null; email: string | null };
    items: { productName: string; quantity: number; variantSku: string; size: string | null; color: string | null }[];
    shippingAddress: { fullName: string; city: string; state: string; pincode: string };
  };
}

interface DispatchGroup {
  orderId: string;
  order: Allocation["order"];
  warehouse: Allocation["warehouse"];
  pickingStatus: PickingStatus;
  allocations: Allocation[];
  totalItems: number;
  allPicked: boolean;
  allPacked: boolean;
}

interface DispatchData {
  dispatchQueue: DispatchGroup[];
  summary: { pendingCount: number; pickedCount: number; packedCount: number };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) { return "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0 }); }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const PICKING_CONFIG: Record<PickingStatus, { label: string; color: string; bg: string }> = {
  PENDING:     { label: "Pending",     color: "#F5C518", bg: "rgba(245,197,24,0.12)"  },
  IN_PROGRESS: { label: "In Progress", color: "#60A5FA", bg: "rgba(96,165,250,0.12)"  },
  PICKED:      { label: "Picked",      color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
  PACKED:      { label: "Packed",      color: "#FB923C", bg: "rgba(251,146,60,0.12)"  },
  DISPATCHED:  { label: "Dispatched",  color: "#4ADE80", bg: "rgba(74,222,128,0.12)"  },
  CANCELLED:   { label: "Cancelled",   color: "#F87171", bg: "rgba(248,113,113,0.12)" },
};

interface Warehouse { id: string; name: string; code: string; }

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DispatchPage() {
  const [data, setData]             = useState<DispatchData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [warehouses, setWH]         = useState<Warehouse[]>([]);
  const [warehouseId, setWHId]      = useState("");
  const [pickingFilter, setPicking] = useState<PickingStatus | "">("");
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [updating, setUpdating]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (warehouseId)   params.set("warehouseId",   warehouseId);
    if (pickingFilter) params.set("pickingStatus", pickingFilter);
    try {
      const res = await fetch(`/api/admin/warehouses/dispatch?${params}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [warehouseId, pickingFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/admin/warehouses").then(r => r.ok ? r.json() : []).then(setWH).catch(() => {});
  }, []);

  async function updateStatus(status: PickingStatus, ids?: string[]) {
    const allocationIds = ids ?? [...selected];
    if (!allocationIds.length) return;
    setUpdating(true);
    try {
      await fetch("/api/admin/warehouses/dispatch", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocationIds, status }),
      });
      setSelected(new Set());
      load();
    } finally { setUpdating(false); }
  }

  function toggleSelect(allocationId: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(allocationId)) next.delete(allocationId);
      else next.add(allocationId);
      return next;
    });
  }

  function toggleSelectOrder(group: DispatchGroup) {
    const ids = group.allocations.map(a => a.id);
    setSelected(prev => {
      const next = new Set(prev);
      const allSelected = ids.every(id => next.has(id));
      if (allSelected) ids.forEach(id => next.delete(id));
      else             ids.forEach(id => next.add(id));
      return next;
    });
  }

  const summary = data?.summary;
  const selectedArr = [...selected];

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>Dispatch Queue</h1>
          <p className="text-white/40 text-[13px]">Pick · Pack · Dispatch orders from warehouse</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select value={warehouseId} onChange={e => setWHId(e.target.value)}
              className="rounded-xl pl-3.5 pr-9 text-[12px] font-bold text-white outline-none appearance-none"
              style={{ height: "40px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <option value="">All Warehouses</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
          </div>
          <button onClick={load} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Pending Pick", value: summary?.pendingCount  ?? 0, color: "#F5C518", bg: "rgba(245,197,24,0.08)", border: "rgba(245,197,24,0.2)"   },
          { label: "Picked",       value: summary?.pickedCount   ?? 0, color: "#A78BFA", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" },
          { label: "Packed",       value: summary?.packedCount   ?? 0, color: "#FB923C", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)"   },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
            <p className="text-[11px] font-semibold text-white/50 mb-1.5">{label}</p>
            <p className="font-black text-[26px] leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters + bulk actions */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex gap-1.5 flex-1 overflow-x-auto">
          {(["", "PENDING", "IN_PROGRESS", "PICKED", "PACKED"] as const).map(s => (
            <button key={s} onClick={() => setPicking(s)}
              className="shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold whitespace-nowrap transition-all"
              style={{
                background: pickingFilter === s ? "#F5C518" : "rgba(255,255,255,0.05)",
                color:      pickingFilter === s ? "#0D0D0D"  : "rgba(255,255,255,0.4)",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}>
              {s === "" ? "All" : PICKING_CONFIG[s as PickingStatus]?.label ?? s}
            </button>
          ))}
        </div>

        {selectedArr.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] text-white/40 font-semibold">{selectedArr.length} selected</span>
            {(["IN_PROGRESS","PICKED","PACKED","DISPATCHED"] as PickingStatus[]).map(s => (
              <button key={s} onClick={() => updateStatus(s)} disabled={updating}
                className="h-8 px-3 rounded-xl text-[11px] font-bold text-[#0D0D0D] disabled:opacity-50"
                style={{ background: PICKING_CONFIG[s].color }}>
                → {PICKING_CONFIG[s].label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Order cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin" />
        </div>
      ) : !data?.dispatchQueue.length ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <CheckCircle2 className="h-12 w-12 text-[#4ADE80]/40" />
          <p className="text-[13px] text-white/30">No orders awaiting dispatch</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.dispatchQueue.map(group => {
            const allSelected = group.allocations.every(a => selected.has(a.id));
            const cfg = PICKING_CONFIG[group.pickingStatus];
            return (
              <div key={group.orderId} className="rounded-2xl overflow-hidden"
                style={{ background: "#1A1A1A", border: `1px solid ${allSelected ? "rgba(245,197,24,0.3)" : "rgba(255,255,255,0.06)"}` }}>

                {/* Order header */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <button
                    onClick={() => toggleSelectOrder(group)}
                    className="flex h-5 w-5 items-center justify-center rounded border-2 shrink-0 transition-all"
                    style={{ background: allSelected ? "#F5C518" : "transparent", borderColor: allSelected ? "#F5C518" : "rgba(255,255,255,0.2)" }}>
                    {allSelected && <Check className="h-3 w-3 text-[#0D0D0D]" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-black text-white font-mono">{group.order.orderNumber}</p>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/35 truncate">
                      {group.order.user.name ?? group.order.user.email} · {group.order.shippingAddress.city}, {group.order.shippingAddress.state} · {group.warehouse.name} ({group.warehouse.code})
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[12px] font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{fmt(group.order.total)}</p>
                      <p className="text-[10px] text-white/30">{fmtDate(group.order.createdAt)}</p>
                    </div>
                    {/* Quick action buttons */}
                    {group.pickingStatus === "PENDING" && (
                      <button onClick={() => updateStatus("IN_PROGRESS", group.allocations.map(a => a.id))} disabled={updating}
                        className="h-8 px-3 rounded-xl text-[11px] font-bold text-[#0D0D0D] disabled:opacity-50"
                        style={{ background: "#60A5FA" }}>
                        Start Pick
                      </button>
                    )}
                    {group.pickingStatus === "IN_PROGRESS" && (
                      <button onClick={() => updateStatus("PICKED", group.allocations.map(a => a.id))} disabled={updating}
                        className="h-8 px-3 rounded-xl text-[11px] font-bold text-[#0D0D0D] disabled:opacity-50"
                        style={{ background: "#A78BFA" }}>
                        Mark Picked
                      </button>
                    )}
                    {group.allPicked && group.pickingStatus === "PICKED" && (
                      <button onClick={() => updateStatus("PACKED", group.allocations.map(a => a.id))} disabled={updating}
                        className="h-8 px-3 rounded-xl text-[11px] font-bold text-[#0D0D0D] disabled:opacity-50"
                        style={{ background: "#FB923C" }}>
                        Mark Packed
                      </button>
                    )}
                    {group.allPacked && (
                      <button onClick={() => updateStatus("DISPATCHED", group.allocations.map(a => a.id))} disabled={updating}
                        className="h-8 px-3 rounded-xl text-[11px] font-bold text-[#0D0D0D] disabled:opacity-50 flex items-center gap-1.5"
                        style={{ background: "#4ADE80" }}>
                        <Send className="h-3 w-3" /> Dispatch
                      </button>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="px-5 py-3 space-y-1.5">
                  {group.order.items.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="text-white/50 truncate">{item.productName}{item.size ? ` · ${item.size}` : ""}</span>
                      <span className="text-white/30 shrink-0 ml-2">×{item.quantity}</span>
                    </div>
                  ))}
                  {group.order.items.length > 4 && (
                    <p className="text-[10px] text-white/20">+{group.order.items.length - 4} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
