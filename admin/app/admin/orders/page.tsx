"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Download, ChevronLeft, ChevronRight, X, Package,
  Clock, Truck, Home, MapPin,
  Phone, Mail, CreditCard, ChevronRight as ChevronR,
} from "lucide-react";
import { orders, type Order, type OrderStatus } from "@/data/mock";
import { useUIStore } from "@/store/ui";
import { OrderStatusBadge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { formatPrice, formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";

const STATUS_OPTS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const PIPELINE_STEPS: { status: OrderStatus; label: string; icon: typeof Package }[] = [
  { status: "pending",    label: "Pending",    icon: Clock },
  { status: "processing", label: "Processing", icon: Package },
  { status: "packed",     label: "Packed",     icon: Package },
  { status: "shipped",    label: "Shipped",    icon: Truck },
  { status: "delivered",  label: "Delivered",  icon: Home },
];

const PAGE_SIZE = 8;

function StatusPipeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled" || status === "refunded") return null;
  const active = PIPELINE_STEPS.findIndex(s => s.status === status);
  return (
    <div className="flex items-center gap-2 py-4 px-6 overflow-x-auto">
      {PIPELINE_STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i <= active;
        const curr = i === active;
        return (
          <div key={step.status} className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
                done ? "border-[#22C55E] bg-[#F0FDF4]" : "border-[#E5E7EB] bg-white")}>
                <Icon className={cn("h-3.5 w-3.5", done ? "text-[#22C55E]" : "text-[#D1D5DB]")} />
              </div>
              <span className={cn("text-[10px] font-semibold whitespace-nowrap", curr ? "text-[#111827]" : done ? "text-[#22C55E]" : "text-[#9CA3AF]")}>
                {step.label}
              </span>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className={cn("w-10 h-0.5 mt-[-18px]", i < active ? "bg-[#22C55E]" : "bg-[#E5E7EB]")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  const [newStatus, setNewStatus] = useState(order.status);
  const [tracking, setTracking]   = useState(order.trackingNumber ?? "");

  return (
    <div className="divide-y divide-[#F3F4F6]">
      {/* Status pipeline */}
      <StatusPipeline status={order.status} />

      {/* Status update */}
      <div className="px-6 py-4">
        <p className="text-xs font-semibold text-[#9CA3AF] mb-3">Update Status</p>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTS.filter(s => s.value !== "all").map(s => (
            <button key={s.value} onClick={() => setNewStatus(s.value as OrderStatus)}
              className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                newStatus === s.value ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]" : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#374151]")}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input value={tracking} onChange={e => setTracking(e.target.value)}
            placeholder="Tracking number (optional)"
            className="flex-1 h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] transition-all" />
          <button className="h-9 px-4 rounded-lg bg-[#111827] text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors">
            Update
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="px-6 py-4">
        <p className="text-xs font-semibold text-[#9CA3AF] mb-3">Order Items</p>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-[#F3F4F6]">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#111827] truncate">{item.name}</p>
                <p className="text-xs text-[#9CA3AF]">Qty: {item.quantity} × {formatPrice(item.price)}</p>
              </div>
              <p className="text-sm font-bold text-[#111827]">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
        {/* Totals */}
        <div className="mt-4 pt-4 border-t border-[#F3F4F6] space-y-1.5">
          <div className="flex justify-between text-sm text-[#6B7280]"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-sm text-[#22C55E]"><span>Discount ({order.couponCode})</span><span>-{formatPrice(order.discount)}</span></div>}
          <div className="flex justify-between text-sm text-[#6B7280]"><span>Shipping</span><span>{order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</span></div>
          <div className="flex justify-between text-base font-extrabold text-[#111827] pt-1 border-t border-[#E5E7EB]"><span>Total</span><span>{formatPrice(order.total)}</span></div>
        </div>
      </div>

      {/* Customer */}
      <div className="px-6 py-4">
        <p className="text-xs font-semibold text-[#9CA3AF] mb-3">Customer</p>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white">{order.customer.avatar}</div>
          <div>
            <p className="text-sm font-semibold text-[#111827]">{order.customer.name}</p>
            <p className="text-xs text-[#9CA3AF]">{order.customer.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 text-xs text-[#6B7280]"><Phone className="h-3.5 w-3.5 shrink-0" />{order.customer.phone}</div>
          <div className="flex items-center gap-2 text-xs text-[#6B7280]"><CreditCard className="h-3.5 w-3.5 shrink-0" />{order.paymentMethod.toUpperCase()}</div>
        </div>
      </div>

      {/* Shipping address */}
      <div className="px-6 py-4">
        <p className="text-xs font-semibold text-[#9CA3AF] mb-3">Shipping Address</p>
        <div className="flex items-start gap-2 text-sm text-[#374151]">
          <MapPin className="h-4 w-4 text-[#9CA3AF] mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">{order.address.name}</p>
            <p>{order.address.line1}{order.address.line2 && `, ${order.address.line2}`}</p>
            <p>{order.address.city}, {order.address.state} — {order.address.postcode}</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6 py-4">
        <p className="text-xs font-semibold text-[#9CA3AF] mb-3">Order Timeline</p>
        <div className="relative pl-5 space-y-3">
          <div className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-[#E5E7EB]" />
          {order.timeline.map((t, i) => (
            <div key={i} className="relative flex gap-3">
              <div className="absolute -left-[14px] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#2563EB]" />
              <div>
                <p className="text-xs font-semibold text-[#374151]">{t.status}</p>
                {t.note && <p className="text-xs text-[#9CA3AF]">{t.note}</p>}
                <p className="text-[11px] text-[#9CA3AF]">{formatRelative(t.time)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { } = useUIStore();
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState<OrderStatus | "all">("all");
  const [page, setPage]           = useState(1);
  const [selectedOrder, setSelected] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = !search || o.orderNumber.includes(search) || o.customer.name.toLowerCase().includes(search.toLowerCase()) || o.customer.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const openOrder = (order: Order) => { setSelected(order); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Orders</h1>
          <p className="text-sm text-[#9CA3AF]">{orders.length} total orders</p>
        </div>
        <button className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-[#E5E7EB]">
        {STATUS_OPTS.map(s => (
          <button key={s.value} onClick={() => { setStatus(s.value as any); setPage(1); }}
            className={cn("px-3 py-2 text-xs font-semibold border-b-2 transition-all -mb-px whitespace-nowrap",
              statusFilter === s.value ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-[#6B7280] hover:text-[#111827]")}>
            {s.label}
            <span className={cn("ml-1 rounded-full px-1.5 py-0.5 text-[10px]",
              statusFilter === s.value ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-[#F3F4F6] text-[#9CA3AF]")}>
              {s.value === "all" ? orders.length : orders.filter(o => o.status === s.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search orders, customers..."
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E5E7EB] bg-white text-sm placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] transition-all" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="px-5 py-3 text-left">Order</th>
                <th className="px-5 py-3 text-left">Customer</th>
                <th className="px-5 py-3 text-left">Items</th>
                <th className="px-5 py-3 text-left">Total</th>
                <th className="px-5 py-3 text-left">Payment</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9FAFB]">
              {paged.map((order, i) => (
                <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  onClick={() => openOrder(order)}
                  className="hover:bg-[#F9FAFB] transition-colors cursor-pointer">
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-mono font-semibold text-[#374151]">{order.orderNumber}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-xs font-bold text-[#374151]">{order.customer.avatar}</div>
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">{order.customer.name}</p>
                        <p className="text-xs text-[#9CA3AF]">{order.customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-[#374151]">{order.items.length} item{order.items.length > 1 ? "s" : ""}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold text-[#111827]">{formatPrice(order.total)}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-semibold uppercase text-[#374151]">{order.paymentMethod}</span>
                  </td>
                  <td className="px-5 py-3.5"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-5 py-3.5 text-xs text-[#9CA3AF]">{formatRelative(order.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <ChevronR className="h-4 w-4 text-[#D1D5DB]" />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Package className="h-10 w-10 text-[#D1D5DB]" />
            <p className="text-sm font-semibold text-[#374151]">No orders found</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#F3F4F6]">
            <p className="text-xs text-[#6B7280]">Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] disabled:opacity-40">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] disabled:opacity-40">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      <Drawer
        open={!!selectedOrder}
        onClose={() => setSelected(null)}
        title={selectedOrder ? selectedOrder.orderNumber : ""}
        subtitle={selectedOrder ? `${selectedOrder.items.length} items · ${formatPrice(selectedOrder.total)}` : ""}
        width="600px"
        footer={
          <div className="flex gap-2">
            <button className="h-9 px-4 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors">Print Invoice</button>
            {selectedOrder?.status !== "cancelled" && (
              <button className="h-9 px-4 rounded-lg border border-[#FECDD3] bg-[#FFF1F2] text-xs font-semibold text-[#DC2626] hover:bg-[#FFE4E6] transition-colors">Cancel Order</button>
            )}
          </div>
        }
      >
        {selectedOrder && <OrderDetail order={selectedOrder} onClose={() => setSelected(null)} />}
      </Drawer>
    </div>
  );
}
