"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ShoppingBag, ChevronLeft, ChevronRight, ExternalLink,
  CheckCircle2, XCircle, Package, Truck, MapPin,
} from "lucide-react";

type OrderItem = {
  id: string;
  orderId: string;
  productName: string;
  variantSku: string;
  size: string | null;
  color: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  imageUrl: string | null;
  supplierEarning: number;
  platformFee: number;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    total: number;
    user: { name: string | null; email: string | null };
    shippingAddress: {
      fullName: string; line1: string; city: string; state: string; pincode: string; phone: string;
    } | null;
    shipment: {
      id: string | null; status: string | null;
      carrierName: string | null; trackingNumber: string | null;
      trackingUrl: string | null; estimatedAt: string | null;
      awbCode: string | null;
    } | null;
  };
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:          "#F5C518",
  CONFIRMED:        "#60A5FA",
  PROCESSING:       "#A78BFA",
  SHIPPED:          "#60A5FA",
  OUT_FOR_DELIVERY: "#4ADE80",
  DELIVERED:        "#4ADE80",
  CANCELLED:        "#F87171",
  RETURN_REQUESTED: "#F87171",
  RETURNED:         "#F87171",
  REFUNDED:         "#F87171",
};

const STATUSES = ["", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

// Actions available per order status
const ORDER_ACTIONS: Record<string, { action: string; label: string; color: string; icon: React.ElementType }[]> = {
  PENDING:    [
    { action: "accept",        label: "Accept",        color: "#4ADE80", icon: CheckCircle2 },
    { action: "reject",        label: "Reject",        color: "#F87171", icon: XCircle },
  ],
  CONFIRMED:  [
    { action: "pack",          label: "Pack",          color: "#A78BFA", icon: Package },
    { action: "reject",        label: "Reject",        color: "#F87171", icon: XCircle },
  ],
  PROCESSING: [
    { action: "ready_to_ship", label: "Ready to Ship", color: "#60A5FA", icon: Truck },
  ],
};

export default function SupplierOrdersPage() {
  const [items, setItems]           = useState<OrderItem[]>([]);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [page, setPage]             = useState(1);
  const [status, setStatus]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [commissionRate, setRate]   = useState(0.15);
  const [actionLoading, setActLoad] = useState<string | null>(null);
  const [expanded, setExpanded]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    const res  = await fetch(`/api/supplier/orders?${params}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setRate(data.commissionRate ?? 0.15);
    setLoading(false);
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (orderId: string, action: string) => {
    setActLoad(orderId + action);
    await fetch("/api/supplier/orders", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ orderId, action }),
    });
    setActLoad(null);
    load();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">

      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-white font-black"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}
        >
          Orders
        </h1>
        <p className="text-white/40 text-[13px] mt-0.5">
          {total} order item{total !== 1 ? "s" : ""} from your products
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className="rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-all"
            style={{
              background: status === s ? "#F5C518" : "rgba(255,255,255,0.06)",
              color:      status === s ? "#0D0D0D" : "rgba(255,255,255,0.50)",
            }}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <ShoppingBag className="h-10 w-10 text-white/15 mb-3" />
          <p className="text-white/40 text-[14px] font-medium">No orders yet</p>
          <p className="text-white/25 text-[12px] mt-1">Orders from your products will appear here</p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Order", "Product", "Qty", "Sale", "Your Earning", "Status", "Date", "Actions"].map(h => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[11px] font-bold tracking-wider text-white/30"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.12em" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <React.Fragment key={item.id}>
                    <tr
                      className="hover:bg-white/02 transition-colors cursor-pointer"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onClick={() => setExpanded(expanded === item.orderId ? null : item.orderId)}
                    >
                      <td className="px-5 py-3">
                        <p className="text-[12px] font-bold text-white/60">{item.order.orderNumber}</p>
                        <p className="text-[11px] text-white/30 truncate max-w-[120px]">{item.order.user.name ?? item.order.user.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                          )}
                          <div>
                            <p className="text-[13px] font-semibold text-white/80 truncate max-w-[160px]">{item.productName}</p>
                            <p className="text-[11px] text-white/35">
                              {[item.size, item.color].filter(Boolean).join(" · ") || item.variantSku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[13px] text-white/60">×{item.quantity}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[14px] font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                          ₹{Number(item.total).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[14px] font-black text-[#4ADE80]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                          ₹{item.supplierEarning.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </span>
                        <p className="text-[10px] text-white/25">–₹{item.platformFee.toLocaleString("en-IN", { maximumFractionDigits: 0 })} fee</p>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                          style={{
                            background: `${STATUS_COLOR[item.order.status] ?? "#999"}18`,
                            color:       STATUS_COLOR[item.order.status] ?? "#999",
                          }}
                        >
                          {item.order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[12px] text-white/40">{formatDate(item.order.createdAt)}</span>
                      </td>
                      <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(ORDER_ACTIONS[item.order.status] ?? []).map(({ action, label, color, icon: Icon }) => (
                            <button
                              key={action}
                              disabled={actionLoading === item.orderId + action}
                              onClick={() => doAction(item.orderId, action)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold disabled:opacity-40 transition-opacity hover:opacity-70"
                              style={{ background: `${color}18`, color }}
                            >
                              <Icon className="h-3 w-3" />
                              {label}
                            </button>
                          ))}
                          {item.order.shipment?.trackingUrl && (
                            <a
                              href={item.order.shipment.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/70 transition-colors"
                            >
                              Track <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded: shipping address */}
                    {expanded === item.orderId && (
                      <tr key={`${item.id}-expanded`} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <td colSpan={8} className="px-5 py-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-[12px]">
                            {item.order.shippingAddress && (
                              <div>
                                <p className="text-white/30 font-semibold uppercase tracking-wide text-[10px] mb-1.5 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> Ship to
                                </p>
                                <p className="text-white/80 font-medium">{item.order.shippingAddress.fullName}</p>
                                <p className="text-white/50">{item.order.shippingAddress.line1}</p>
                                <p className="text-white/50">{item.order.shippingAddress.city}, {item.order.shippingAddress.state} – {item.order.shippingAddress.pincode}</p>
                                <p className="text-white/35">{item.order.shippingAddress.phone}</p>
                              </div>
                            )}
                            {item.order.shipment && (
                              <div>
                                <p className="text-white/30 font-semibold uppercase tracking-wide text-[10px] mb-1.5">Shipment</p>
                                <p className="text-white/50">Status: <span className="text-white">{item.order.shipment.status ?? "—"}</span></p>
                                {item.order.shipment.carrierName && <p className="text-white/50">Carrier: {item.order.shipment.carrierName}</p>}
                                {item.order.shipment.trackingNumber && <p className="text-white/50 font-mono">AWB: {item.order.shipment.trackingNumber}</p>}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
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
    </div>
  );
}
