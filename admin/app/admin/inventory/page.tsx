"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, ArrowUpCircle, ArrowDownCircle, AlertTriangle,
  Plus, Search, Download, RefreshCw, TrendingDown, Boxes,
  ChevronRight, X, History,
} from "lucide-react";
import { stockMovements, type MovementType, type StockMovement } from "@/data/phase3-mock";
import { products } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";

const MOVEMENT_META: Record<MovementType, { label: string; color: string; bg: string; icon: typeof ArrowUpCircle; dir: 1 | -1 }> = {
  restock:    { label:"Restock",    color:"#16A34A", bg:"#F0FDF4", icon:ArrowUpCircle,   dir:  1 },
  sale:       { label:"Sale",       color:"#2563EB", bg:"#EFF6FF", icon:ArrowDownCircle, dir: -1 },
  return:     { label:"Return",     color:"#7C3AED", bg:"#F5F3FF", icon:ArrowUpCircle,   dir:  1 },
  adjustment: { label:"Adjustment", color:"#D97706", bg:"#FFFBEB", icon:RefreshCw,       dir:  1 },
  damage:     { label:"Damage",     color:"#DC2626", bg:"#FFF1F2", icon:TrendingDown,     dir: -1 },
};

function MovementBadge({ type }: { type: MovementType }) {
  const m = MOVEMENT_META[type];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold"
      style={{ color: m.color, background: m.bg, borderColor: `${m.color}30` }}>
      {m.label}
    </span>
  );
}

function AdjustDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [productId, setProductId] = useState("");
  const [type, setType] = useState<MovementType>("restock");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");

  return (
    <Drawer open={open} onClose={onClose} title="Record Stock Movement" subtitle="Log incoming stock, adjustments, or damage"
      footer={
        <div className="flex justify-between">
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-[#E5E7EB] text-sm font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors">Cancel</button>
          <button onClick={onClose} className="h-9 px-5 rounded-lg bg-[#111827] text-sm font-semibold text-white hover:bg-[#1F2937] transition-colors">Save Movement</button>
        </div>
      }>
      <div className="px-6 py-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1.5">Product <span className="text-[#EF4444]">*</span></label>
          <select value={productId} onChange={e => setProductId(e.target.value)}
            className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm text-[#111827] outline-none focus:border-[#2563EB] appearance-none transition-all">
            <option value="">Select product…</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.inventory})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1.5">Movement Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(["restock","adjustment","damage","return"] as MovementType[]).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={cn("rounded-lg border py-2 text-xs font-semibold capitalize transition-all",
                  type === t ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]" : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]")}>
                {MOVEMENT_META[t].label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Quantity</label>
            <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="50" min="1"
              className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm outline-none focus:border-[#2563EB] transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Date</label>
            <input type="date" defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm outline-none focus:border-[#2563EB] transition-all" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1.5">Note / Reference</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="e.g. PO#12345 received from Supplier A"
            className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#2563EB] resize-none transition-all" />
        </div>
      </div>
    </Drawer>
  );
}

export default function InventoryPage() {
  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter] = useState<MovementType | "all">("all");
  const [adjustOpen, setAdjustOpen] = useState(false);

  const lowStock    = products.filter(p => p.inventory > 0 && p.inventory <= p.lowStockThreshold);
  const outOfStock  = products.filter(p => p.inventory === 0);
  const totalValue  = products.reduce((s, p) => s + p.inventory * (p.salePrice ?? p.price), 0);
  const totalUnits  = products.reduce((s, p) => s + p.inventory, 0);

  const filtered = useMemo(() => stockMovements.filter(m => {
    const matchSearch = !search || m.productName.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === "all" || m.type === typeFilter;
    return matchSearch && matchType;
  }), [search, typeFilter]);

  const TYPES: { value: MovementType | "all"; label: string }[] = [
    { value:"all",label:"All" },
    { value:"restock",label:"Restocks" },
    { value:"sale",label:"Sales" },
    { value:"return",label:"Returns" },
    { value:"adjustment",label:"Adjustments" },
    { value:"damage",label:"Damage" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Inventory</h1>
          <p className="text-sm text-[#9CA3AF]">Track stock levels, movements, and reorder alerts</p>
        </div>
        <button onClick={() => setAdjustOpen(true)}
          className="flex items-center gap-1.5 h-9 rounded-lg bg-[#111827] px-4 text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors">
          <Plus className="h-3.5 w-3.5" /> Record Movement
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total SKUs",        value:products.length,                                 icon:Boxes,         color:"#2563EB", bg:"#EFF6FF" },
          { label:"Total Units",       value:totalUnits.toLocaleString("en-IN"),              icon:Package,       color:"#7C3AED", bg:"#F5F3FF" },
          { label:"Out of Stock",      value:outOfStock.length,                               icon:AlertTriangle, color:"#DC2626", bg:"#FFF1F2" },
          { label:"Low Stock",         value:lowStock.length,                                 icon:TrendingDown,  color:"#D97706", bg:"#FFFBEB" },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={i} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
              className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background:c.bg }}>
                <Icon className="h-5 w-5" style={{ color:c.color }} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-[#111827]">{c.value}</p>
                <p className="text-xs text-[#9CA3AF]">{c.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Alert banners */}
      {(outOfStock.length > 0 || lowStock.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {outOfStock.length > 0 && (
            <div className="rounded-xl border border-[#FECDD3] bg-[#FFF1F2] p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-[#DC2626]" />
                <p className="text-sm font-bold text-[#DC2626]">{outOfStock.length} Products Out of Stock</p>
              </div>
              <div className="space-y-2">
                {outOfStock.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-md overflow-hidden shrink-0"><img src={p.images[0]} alt="" className="w-full h-full object-cover" /></div>
                    <p className="text-xs font-semibold text-[#374151] truncate flex-1">{p.name}</p>
                    <span className="text-xs font-bold text-[#DC2626]">0 units</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-[#D97706]" />
                <p className="text-sm font-bold text-[#D97706]">{lowStock.length} Products Running Low</p>
              </div>
              <div className="space-y-2">
                {lowStock.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-md overflow-hidden shrink-0"><img src={p.images[0]} alt="" className="w-full h-full object-cover" /></div>
                    <p className="text-xs font-semibold text-[#374151] truncate flex-1">{p.name}</p>
                    <span className="text-xs font-bold text-[#D97706]">{p.inventory} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stock levels table */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F3F4F6]">
          <h2 className="text-sm font-bold text-[#111827]">Current Stock Levels</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-left">SKU</th>
                <th className="px-5 py-3 text-left">In Stock</th>
                <th className="px-5 py-3 text-left">Threshold</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Stock Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9FAFB]">
              {products.map((p, i) => {
                const pct = Math.min(100, (p.inventory / Math.max(p.inventory, 300)) * 100);
                const status = p.inventory === 0 ? "danger" : p.inventory <= p.lowStockThreshold ? "warning" : "success";
                const barColor = status === "danger" ? "#DC2626" : status === "warning" ? "#D97706" : "#22C55E";
                return (
                  <motion.tr key={p.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                    className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg overflow-hidden bg-[#F3F4F6] shrink-0">
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-sm font-semibold text-[#111827] truncate max-w-[180px]">{p.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-[#6B7280]">{p.sku}</td>
                    <td className="px-5 py-3 text-sm font-bold text-[#111827]">{p.inventory.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3 text-sm text-[#6B7280]">{p.lowStockThreshold}</td>
                    <td className="px-5 py-3">
                      <Badge variant={status === "danger" ? "danger" : status === "warning" ? "warning" : "success"} dot>
                        {status === "danger" ? "Out of stock" : status === "warning" ? "Low stock" : "In stock"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 w-36">
                      <div className="h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background:barColor }} />
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement history */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#F3F4F6]">
          <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <History className="h-4 w-4 text-[#9CA3AF]" /> Movement History
          </h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product…"
                className="h-8 pl-9 pr-3 w-48 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-sm placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] transition-all" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
              className="h-8 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-xs font-semibold text-[#374151] outline-none appearance-none">
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button className="flex items-center gap-1 h-8 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB]">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Qty Change</th>
                <th className="px-5 py-3 text-left">Before</th>
                <th className="px-5 py-3 text-left">After</th>
                <th className="px-5 py-3 text-left">Note</th>
                <th className="px-5 py-3 text-left">By</th>
                <th className="px-5 py-3 text-left">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9FAFB]">
              {filtered.map((m, i) => {
                const meta = MOVEMENT_META[m.type];
                const Icon = meta.icon;
                const isIn = m.quantity > 0;
                return (
                  <motion.tr key={m.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}
                    className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg overflow-hidden bg-[#F3F4F6] shrink-0">
                          <img src={m.productImage} alt="" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-sm font-semibold text-[#111827] truncate max-w-[160px]">{m.productName}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3"><MovementBadge type={m.type} /></td>
                    <td className="px-5 py-3">
                      <span className={cn("flex items-center gap-1 text-sm font-bold", isIn ? "text-[#16A34A]" : "text-[#DC2626]")}>
                        <Icon className="h-3.5 w-3.5" />
                        {isIn ? "+" : ""}{m.quantity}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-[#6B7280]">{m.balanceBefore}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-[#374151]">{m.balanceAfter}</td>
                    <td className="px-5 py-3 text-xs text-[#9CA3AF] max-w-[160px] truncate">{m.note}</td>
                    <td className="px-5 py-3 text-xs text-[#6B7280]">{m.createdBy}</td>
                    <td className="px-5 py-3 text-xs text-[#9CA3AF] whitespace-nowrap">{formatRelative(m.createdAt)}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AdjustDrawer open={adjustOpen} onClose={() => setAdjustOpen(false)} />
    </div>
  );
}
