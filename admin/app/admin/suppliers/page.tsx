"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe2, Star, Package, TrendingUp, AlertTriangle, Plus,
  Mail, Phone, ExternalLink, ChevronRight, Clock, ShieldCheck,
  Truck, BarChart3,
} from "lucide-react";
import { suppliers, type Supplier, type SupplierStatus } from "@/data/phase3-mock";
import { products } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { formatPrice, formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";

function ReliabilityRing({ score }: { score: number }) {
  const color = score >= 90 ? "#16A34A" : score >= 75 ? "#D97706" : "#DC2626";
  const r  = 20, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <svg className="-rotate-90" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#E5E7EB" strokeWidth="4" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition:"stroke-dasharray 0.6s ease" }} />
      </svg>
      <span className="absolute text-xs font-extrabold" style={{ color }}>{score}</span>
    </div>
  );
}

const STATUS_LABELS: Record<SupplierStatus, { label: string; variant: "success"|"neutral"|"warning" }> = {
  active:   { label:"Active",  variant:"success" },
  inactive: { label:"Inactive",variant:"neutral" },
  on_hold:  { label:"On Hold", variant:"warning" },
};

export default function SuppliersPage() {
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [createOpen, setCreate] = useState(false);
  const [filter, setFilter]     = useState<SupplierStatus | "all">("all");

  const filtered = suppliers.filter(s => filter === "all" || s.status === filter);

  const supplierProducts = (ids: string[]) => products.filter(p => ids.includes(p.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Suppliers</h1>
          <p className="text-sm text-[#9CA3AF]">Manage your dropshipping suppliers, costs, and reliability</p>
        </div>
        <button onClick={() => setCreate(true)}
          className="flex items-center gap-1.5 h-9 rounded-lg bg-[#111827] px-4 text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Supplier
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Suppliers",       value:suppliers.length,                                                            icon:Globe2,    color:"#2563EB", bg:"#EFF6FF" },
          { label:"Active Suppliers",      value:suppliers.filter(s=>s.status==="active").length,                            icon:ShieldCheck,color:"#16A34A",bg:"#F0FDF4" },
          { label:"On Hold",               value:suppliers.filter(s=>s.status==="on_hold").length,                           icon:AlertTriangle,color:"#D97706",bg:"#FFFBEB" },
          { label:"Total Purchases",       value:formatPrice(suppliers.reduce((s,sup)=>s+sup.totalPurchaseValue,0)),         icon:TrendingUp, color:"#7C3AED", bg:"#F5F3FF" },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={i} initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.06 }}
              className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background:c.bg }}>
                <Icon className="h-5 w-5" style={{ color:c.color }} />
              </div>
              <div><p className="text-lg font-extrabold text-[#111827]">{c.value}</p><p className="text-xs text-[#9CA3AF]">{c.label}</p></div>
            </motion.div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all","active","on_hold","inactive"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-all",
              filter === f ? "bg-[#111827] text-white" : "border border-[#E5E7EB] text-[#6B7280] hover:text-[#374151] hover:border-[#D1D5DB]")}>
            {f === "all" ? "All Suppliers" : f.replace("_"," ")}
          </button>
        ))}
      </div>

      {/* Supplier cards */}
      <div className="grid lg:grid-cols-2 gap-4">
        <AnimatePresence>
          {filtered.map((sup, i) => (
            <motion.div key={sup.id} layout initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }} transition={{ delay:i*0.06 }}
              onClick={() => setSelected(sup)}
              className="rounded-xl border border-[#E5E7EB] bg-white p-5 cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-[#D1D5DB] transition-all">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3F4F6] border border-[#E5E7EB]">
                    <Globe2 className="h-5 w-5 text-[#6B7280]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#111827] truncate">{sup.name}</p>
                    <p className="text-xs text-[#9CA3AF]">{sup.contactName} · {sup.country}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={STATUS_LABELS[sup.status].variant} dot>{STATUS_LABELS[sup.status].label}</Badge>
                  <p className="text-[10px] text-[#9CA3AF]">Last order {formatRelative(sup.lastOrderDate)}</p>
                </div>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="flex flex-col items-center justify-center">
                  <ReliabilityRing score={sup.reliabilityScore} />
                  <p className="text-[10px] text-[#9CA3AF] mt-1 text-center">Reliability</p>
                </div>
                <div className="flex flex-col items-center justify-center border-x border-[#F3F4F6]">
                  <div className="flex items-center gap-1 mb-1">
                    <Truck className="h-3.5 w-3.5 text-[#9CA3AF]" />
                  </div>
                  <p className="text-sm font-extrabold text-[#111827]">{sup.avgShippingDays}d</p>
                  <p className="text-[10px] text-[#9CA3AF]">Avg ship</p>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <p className="text-sm font-extrabold text-[#16A34A]">{sup.onTimeDeliveryRate}%</p>
                  <p className="text-[10px] text-[#9CA3AF]">On-time</p>
                </div>
                <div className="flex flex-col items-center justify-center border-l border-[#F3F4F6]">
                  <p className={cn("text-sm font-extrabold", sup.defectRate > 5 ? "text-[#DC2626]" : sup.defectRate > 2 ? "text-[#D97706]" : "text-[#374151]")}>
                    {sup.defectRate}%
                  </p>
                  <p className="text-[10px] text-[#9CA3AF]">Defects</p>
                </div>
              </div>

              {/* Products */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 items-center">
                  {supplierProducts(sup.productIds).slice(0, 4).map(p => (
                    <div key={p.id} className="h-7 w-7 rounded-md overflow-hidden bg-[#F3F4F6]">
                      <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {sup.productIds.length > 4 && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F3F4F6] text-[10px] font-bold text-[#6B7280]">
                      +{sup.productIds.length - 4}
                    </span>
                  )}
                  <span className="text-xs text-[#9CA3AF] ml-1">{sup.totalProducts} products</span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#D1D5DB]" />
              </div>

              {/* Tags */}
              {sup.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-3 pt-3 border-t border-[#F9FAFB]">
                  {sup.tags.map(t => <Badge key={t} variant="neutral" className="text-[10px]">{t}</Badge>)}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Supplier detail drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)}
        title={selected?.name ?? ""} subtitle={`${selected?.country} · ${selected?.contactName}`} width="560px"
        footer={
          <div className="flex gap-2">
            <button onClick={() => setSelected(null)} className="h-9 px-4 rounded-lg border border-[#E5E7EB] text-sm font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors">Close</button>
            <button className="h-9 px-4 rounded-lg bg-[#111827] text-sm font-semibold text-white hover:bg-[#1F2937] transition-colors">Edit Supplier</button>
          </div>
        }>
        {selected && (
          <div className="divide-y divide-[#F3F4F6]">
            {/* Contact */}
            <div className="px-6 py-4 space-y-3">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Contact Information</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#374151]"><Mail className="h-4 w-4 text-[#9CA3AF]" />{selected.email}</div>
                <div className="flex items-center gap-2 text-sm text-[#374151]"><Phone className="h-4 w-4 text-[#9CA3AF]" />{selected.phone}</div>
                <div className="flex items-center gap-2 text-sm text-[#374151]"><Globe2 className="h-4 w-4 text-[#9CA3AF]" />{selected.country}</div>
              </div>
            </div>

            {/* Performance */}
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">Performance Metrics</p>
              <div className="flex items-center justify-around mb-5">
                <div className="text-center">
                  <ReliabilityRing score={selected.reliabilityScore} />
                  <p className="text-xs text-[#9CA3AF] mt-1">Reliability Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-[#111827]">{selected.onTimeDeliveryRate}%</p>
                  <p className="text-xs text-[#9CA3AF]">On-time Delivery</p>
                </div>
                <div className="text-center">
                  <p className={cn("text-2xl font-extrabold", selected.defectRate > 5 ? "text-[#DC2626]" : "text-[#111827]")}>{selected.defectRate}%</p>
                  <p className="text-xs text-[#9CA3AF]">Defect Rate</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:"Avg. Shipping",     value:`${selected.avgShippingDays} days` },
                  { label:"Payment Terms",     value:selected.paymentTerms },
                  { label:"Currency",          value:selected.currency },
                  { label:"Total Orders",      value:selected.totalOrders },
                  { label:"Total Purchased",   value:formatPrice(selected.totalPurchaseValue) },
                  { label:"Products Supplied", value:selected.totalProducts },
                ].map(m => (
                  <div key={m.label} className="rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] px-3 py-2.5">
                    <p className="text-[10px] text-[#9CA3AF] mb-0.5">{m.label}</p>
                    <p className="text-sm font-bold text-[#111827]">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Products */}
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Products Supplied</p>
              <div className="space-y-2">
                {supplierProducts(selected.productIds).map(p => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] px-3 py-2.5">
                    <div className="h-8 w-8 rounded-lg overflow-hidden shrink-0"><img src={p.images[0]} alt="" className="w-full h-full object-cover" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#374151] truncate">{p.name}</p>
                      <p className="text-[11px] text-[#9CA3AF]">Sell: {formatPrice(p.price)} · Cost: {formatPrice(Math.round(p.price * 0.38))}</p>
                    </div>
                    <p className="text-xs font-bold text-[#16A34A] shrink-0">
                      {Math.round(((p.price - p.price * 0.38) / p.price) * 100)}% margin
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {selected.notes && (
              <div className="px-6 py-4">
                <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">Notes</p>
                <p className="text-sm text-[#374151] leading-relaxed">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Create supplier drawer */}
      <Drawer open={createOpen} onClose={() => setCreate(false)} title="Add New Supplier" subtitle="Add a dropshipping supplier"
        footer={
          <div className="flex justify-between">
            <button onClick={() => setCreate(false)} className="h-9 px-4 rounded-lg border border-[#E5E7EB] text-sm font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors">Cancel</button>
            <button onClick={() => setCreate(false)} className="h-9 px-5 rounded-lg bg-[#111827] text-sm font-semibold text-white hover:bg-[#1F2937] transition-colors">Save Supplier</button>
          </div>
        }>
        <div className="px-6 py-5 space-y-4">
          {[
            { label:"Company Name",   placeholder:"ShenzhenTech Exports" },
            { label:"Contact Person", placeholder:"David Chen" },
            { label:"Email",          placeholder:"supplier@example.com" },
            { label:"Phone",          placeholder:"+86 135 0000 0000" },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">{f.label}</label>
              <input placeholder={f.placeholder} className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm outline-none focus:border-[#2563EB] transition-all" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Country</label>
              <input placeholder="China" className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm outline-none focus:border-[#2563EB] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Currency</label>
              <select className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm outline-none appearance-none focus:border-[#2563EB] transition-all">
                <option>USD</option><option>INR</option><option>EUR</option><option>CNY</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Avg Shipping Days</label>
              <input type="number" placeholder="14" className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm outline-none focus:border-[#2563EB] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Payment Terms</label>
              <input placeholder="Net 30" className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm outline-none focus:border-[#2563EB] transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Notes</label>
            <textarea rows={3} placeholder="Any notes about this supplier…" className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] resize-none transition-all" />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
