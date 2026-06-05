"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, Package, ArrowDownToLine, Truck, AlertTriangle,
  CheckCircle2, Clock, ChevronDown, ExternalLink,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface POItem { productName: string; variantSku: string; size: string | null; orderedQty: number; receivedQty: number; }
interface TransferItem { productName: string; variantSku: string; size: string | null; requestedQty: number; transferredQty: number; }

interface PendingPO {
  id: string; poNumber: string; status: string; expectedAt: string | null;
  supplier: { companyName: string } | null;
  warehouse: { name: string; code: string } | null;
  items: POItem[];
}

interface PendingTransfer {
  id: string; transferNumber: string; status: string;
  fromWarehouse: { name: string; code: string };
  toWarehouse:   { name: string; code: string };
  items: TransferItem[];
}

interface ReceivingData {
  pending: {
    purchaseOrders: PendingPO[];
    transfers: PendingTransfer[];
    overduePOCount: number;
  };
  history: {
    purchaseOrders: { id: string; poNumber: string; receivedAt: string; supplier: { companyName: string } | null; warehouse: { name: string; code: string } | null; _count: { items: number } }[];
    transfers: { id: string; transferNumber: string; receivedAt: string; fromWarehouse: { name: string; code: string }; toWarehouse: { name: string; code: string }; _count: { items: number } }[];
  };
  summary: { pendingPOCount: number; pendingTransferCount: number; overduePOCount: number };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

interface Warehouse { id: string; name: string; code: string; }

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReceivingPage() {
  const [data, setData]             = useState<ReceivingData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [warehouses, setWH]         = useState<Warehouse[]>([]);
  const [warehouseId, setWHId]      = useState("");
  const [activeTab, setActiveTab]   = useState<"pos" | "transfers" | "history">("pos");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (warehouseId) params.set("warehouseId", warehouseId);
    try {
      const res = await fetch(`/api/admin/warehouses/receiving?${params}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [warehouseId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/admin/warehouses").then(r => r.ok ? r.json() : []).then(setWH).catch(() => {});
  }, []);

  const summary = data?.summary;

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>Receiving Queue</h1>
          <p className="text-white/40 text-[13px]">Pending purchase orders and incoming stock transfers</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Warehouse filter */}
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
            <RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Pending POs",      value: summary?.pendingPOCount ?? 0,       icon: Package,       color: "#F5C518", bg: "rgba(245,197,24,0.08)",   border: "rgba(245,197,24,0.2)"   },
          { label: "Pending Transfers",value: summary?.pendingTransferCount ?? 0, icon: Truck,         color: "#A78BFA", bg: "rgba(167,139,250,0.08)",  border: "rgba(167,139,250,0.2)"  },
          { label: "Overdue POs",      value: summary?.overduePOCount ?? 0,       icon: AlertTriangle, color: "#F87171", bg: "rgba(248,113,113,0.08)",  border: "rgba(248,113,113,0.2)"  },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-white/50">{label}</p>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <p className="font-black text-white text-[26px] leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5">
        {[
          { value: "pos",       label: `Purchase Orders (${data?.pending.purchaseOrders.length ?? 0})` },
          { value: "transfers", label: `Transfers (${data?.pending.transfers.length ?? 0})` },
          { value: "history",   label: "Recent History" },
        ].map(({ value, label }) => (
          <button key={value} onClick={() => setActiveTab(value as typeof activeTab)}
            className="rounded-xl px-3.5 py-2 text-[12px] font-bold transition-all"
            style={{
              background: activeTab === value ? "#F5C518" : "rgba(255,255,255,0.05)",
              color:      activeTab === value ? "#0D0D0D"  : "rgba(255,255,255,0.45)",
              fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* PO tab */}
      {activeTab === "pos" && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin" />
            </div>
          ) : !data?.pending.purchaseOrders.length ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <CheckCircle2 className="h-10 w-10 text-[#4ADE80]/50" />
              <p className="text-[13px] text-white/30">No pending purchase orders</p>
            </div>
          ) : data.pending.purchaseOrders.map(po => {
            const overdue = po.expectedAt && new Date(po.expectedAt) < new Date();
            const totalOrdered  = po.items.reduce((s, i) => s + i.orderedQty, 0);
            const totalReceived = po.items.reduce((s, i) => s + i.receivedQty, 0);
            return (
              <div key={po.id} className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: `1px solid ${overdue ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.06)"}` }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-black text-white font-mono">{po.poNumber}</p>
                      {overdue && <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}>Overdue</span>}
                    </div>
                    <p className="text-[11px] text-white/35 mt-0.5">
                      {po.supplier?.companyName ?? "No supplier"} · {po.warehouse ? `${po.warehouse.name} (${po.warehouse.code})` : "No warehouse"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {po.expectedAt && (
                      <div className="text-right">
                        <p className="text-[10px] text-white/30">Expected</p>
                        <p className="text-[11px] font-semibold" style={{ color: overdue ? "#F87171" : "white" }}>{fmtDate(po.expectedAt)}</p>
                      </div>
                    )}
                    <a href={`/admin/purchase-orders`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/08 transition-all">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0}%`, background: "#4ADE80" }} />
                  </div>
                  <p className="text-[11px] text-white/40 shrink-0">{totalReceived}/{totalOrdered} units</p>
                </div>

                {/* Items preview */}
                <div className="mt-3 space-y-1.5">
                  {po.items.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="text-white/50 truncate">{item.productName}{item.size ? ` · ${item.size}` : ""}</span>
                      <span className="text-white/30 shrink-0 ml-2">{item.receivedQty}/{item.orderedQty}</span>
                    </div>
                  ))}
                  {po.items.length > 3 && <p className="text-[10px] text-white/20">+{po.items.length - 3} more items</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transfers tab */}
      {activeTab === "transfers" && (
        <div className="space-y-3">
          {!data?.pending.transfers.length ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <CheckCircle2 className="h-10 w-10 text-[#4ADE80]/50" />
              <p className="text-[13px] text-white/30">No incoming transfers pending</p>
            </div>
          ) : data.pending.transfers.map(t => {
            const total = t.items.reduce((s, i) => s + i.requestedQty, 0);
            return (
              <div key={t.id} className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[13px] font-black text-white font-mono">{t.transferNumber}</p>
                    <p className="text-[11px] text-white/35 mt-0.5">From {t.fromWarehouse.name} → {t.toWarehouse.name}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black"
                    style={{ background: t.status === "IN_TRANSIT" ? "rgba(96,165,250,0.12)" : "rgba(245,197,24,0.12)", color: t.status === "IN_TRANSIT" ? "#60A5FA" : "#F5C518" }}>
                    {t.status === "IN_TRANSIT" ? "In Transit" : "Pending"}
                  </span>
                </div>
                <p className="text-[11px] text-white/40">{t.items.length} lines · {total} total units</p>
              </div>
            );
          })}
        </div>
      )}

      {/* History tab */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {[
            ...(data?.history.purchaseOrders ?? []).map(po => ({ type: "po" as const, ...po })),
            ...(data?.history.transfers ?? []).map(t => ({ type: "transfer" as const, ...t })),
          ]
          .sort((a, b) => {
            const dateA = "receivedAt" in a ? a.receivedAt : "";
            const dateB = "receivedAt" in b ? b.receivedAt : "";
            return dateB.localeCompare(dateA);
          })
          .map((item, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl px-5 py-3.5"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
                style={{ background: item.type === "po" ? "rgba(74,222,128,0.1)" : "rgba(167,139,250,0.1)" }}>
                {item.type === "po" ? <ArrowDownToLine className="h-4 w-4 text-[#4ADE80]" /> : <Truck className="h-4 w-4 text-[#A78BFA]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white/80 font-mono">
                  {item.type === "po" ? (item as typeof item & { poNumber: string }).poNumber : (item as typeof item & { transferNumber: string }).transferNumber}
                </p>
                <p className="text-[11px] text-white/35">
                  {item.type === "po"
                    ? `From ${(item as typeof item & { supplier: { companyName: string } | null }).supplier?.companyName ?? "supplier"}`
                    : `${(item as typeof item & { fromWarehouse: { name: string } }).fromWarehouse?.name} → ${(item as typeof item & { toWarehouse: { name: string } }).toWarehouse?.name}`
                  }
                  {" · "}{(item as typeof item & { _count: { items: number } })._count?.items ?? 0} lines
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-[#4ADE80]">
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="text-[10px] font-bold">Received</span>
                </div>
                <p className="text-[10px] text-white/25 mt-0.5">{"receivedAt" in item ? fmtDate(item.receivedAt) : ""}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
