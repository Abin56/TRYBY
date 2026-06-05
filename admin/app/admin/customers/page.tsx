"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Users, Mail, Phone, ShoppingBag, TrendingUp, ChevronRight } from "lucide-react";
import { customers, orders } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { formatPrice, formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function CustomersPage() {
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState<typeof customers[0] | null>(null);

  const filtered = useMemo(() =>
    customers.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())),
    [search]);

  const customerOrders = (id: string) => orders.filter(o => o.customer.id === id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Customers</h1>
          <p className="text-sm text-[#9CA3AF]">{customers.length} registered customers</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Customers", value: customers.length, icon: Users, color: "#2563EB", bg: "#EFF6FF" },
          { label: "Active",    value: customers.filter(c => c.status === "active").length,   icon: TrendingUp, color: "#22C55E", bg: "#F0FDF4" },
          { label: "VIP",       value: customers.filter(c => c.tags.includes("vip")).length,  icon: ShoppingBag, color: "#7C3AED", bg: "#F5F3FF" },
          { label: "New (30d)", value: 4, icon: Users, color: "#D97706", bg: "#FFFBEB" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: s.bg }}>
                <Icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-[#111827]">{s.value}</p>
                <p className="text-xs text-[#9CA3AF]">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..."
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E5E7EB] bg-white text-sm placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] transition-all" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
        <table className="w-full admin-table">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <tr>
              <th className="px-5 py-3 text-left">Customer</th>
              <th className="px-5 py-3 text-left">Location</th>
              <th className="px-5 py-3 text-left">Orders</th>
              <th className="px-5 py-3 text-left">Spent</th>
              <th className="px-5 py-3 text-left">Last Order</th>
              <th className="px-5 py-3 text-left">Tags</th>
              <th className="px-5 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F9FAFB]">
            {filtered.map((c, i) => (
              <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(c)} className="hover:bg-[#F9FAFB] cursor-pointer transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white">{c.avatar}</div>
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">{c.name}</p>
                      <p className="text-xs text-[#9CA3AF]">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-[#374151]">{c.city}, {c.state}</td>
                <td className="px-5 py-3.5 text-sm font-semibold text-[#374151]">{c.totalOrders}</td>
                <td className="px-5 py-3.5 text-sm font-bold text-[#111827]">{formatPrice(c.totalSpent)}</td>
                <td className="px-5 py-3.5 text-xs text-[#9CA3AF]">{formatRelative(c.lastOrderDate)}</td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-1 flex-wrap">
                    {c.tags.map(t => (
                      <Badge key={t} variant={t === "vip" ? "primary" : "neutral"} className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3.5"><ChevronRight className="h-4 w-4 text-[#D1D5DB]" /></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer profile drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ""} subtitle={selected?.email} width="520px">
        {selected && (
          <div className="divide-y divide-[#F3F4F6]">
            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-[#F3F4F6] px-6 py-4">
              {[
                { label: "Total Orders", value: selected.totalOrders },
                { label: "Total Spent", value: formatPrice(selected.totalSpent) },
                { label: "Avg Order", value: formatPrice(selected.avgOrderValue) },
              ].map(s => (
                <div key={s.label} className="px-4 first:pl-0 last:pr-0 text-center">
                  <p className="text-lg font-extrabold text-[#111827]">{s.value}</p>
                  <p className="text-xs text-[#9CA3AF]">{s.label}</p>
                </div>
              ))}
            </div>
            {/* Contact */}
            <div className="px-6 py-4 space-y-2">
              <p className="text-xs font-semibold text-[#9CA3AF] mb-3">Contact Information</p>
              <div className="flex items-center gap-2 text-sm text-[#374151]"><Mail className="h-4 w-4 text-[#9CA3AF]" />{selected.email}</div>
              <div className="flex items-center gap-2 text-sm text-[#374151]"><Phone className="h-4 w-4 text-[#9CA3AF]" />{selected.phone}</div>
              <div className="flex items-center gap-2 text-sm text-[#374151]"><ShoppingBag className="h-4 w-4 text-[#9CA3AF]" />{selected.city}, {selected.state}</div>
            </div>
            {/* Order history */}
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-[#9CA3AF] mb-3">Order History</p>
              <div className="space-y-2">
                {customerOrders(selected.id).map(o => (
                  <div key={o.id} className="flex items-center justify-between rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] px-3 py-2.5">
                    <div>
                      <p className="text-xs font-mono font-semibold text-[#374151]">{o.orderNumber}</p>
                      <p className="text-xs text-[#9CA3AF]">{formatRelative(o.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#111827]">{formatPrice(o.total)}</p>
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </div>
                ))}
                {customerOrders(selected.id).length === 0 && <p className="text-xs text-[#9CA3AF]">No orders found.</p>}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
