"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Tag, Copy, Check, ToggleLeft, ToggleRight } from "lucide-react";
import { coupons, type Coupon, type CouponType } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { formatPrice, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

function CouponForm({ coupon }: { coupon?: Coupon }) {
  const [type, setType] = useState<CouponType>(coupon?.type ?? "percentage");
  return (
    <div className="px-6 py-5 space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#374151] mb-1.5">Coupon Code <span className="text-[#EF4444]">*</span></label>
        <input defaultValue={coupon?.code} placeholder="e.g. SUMMER25"
          className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 font-mono text-sm text-[#111827] uppercase outline-none focus:border-[#2563EB] focus:bg-white transition-all" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#374151] mb-1.5">Discount Type</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "percentage" as CouponType, label: "Percentage %" },
            { value: "fixed" as CouponType, label: "Fixed ₹" },
            { value: "free_shipping" as CouponType, label: "Free Shipping" },
          ].map(t => (
            <button key={t.value} onClick={() => setType(t.value)}
              className={cn("rounded-lg border py-2 text-xs font-semibold transition-all",
                type === t.value ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]" : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]")}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {type !== "free_shipping" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              {type === "percentage" ? "Discount (%)" : "Discount (₹)"}
            </label>
            <input type="number" defaultValue={coupon?.value} placeholder={type === "percentage" ? "10" : "200"}
              className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm outline-none focus:border-[#2563EB] transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Min Order (₹)</label>
            <input type="number" defaultValue={coupon?.minOrderAmount} placeholder="500"
              className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm outline-none focus:border-[#2563EB] transition-all" />
          </div>
          {type === "percentage" && (
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Max Discount (₹)</label>
              <input type="number" defaultValue={coupon?.maxDiscount} placeholder="500"
                className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm outline-none focus:border-[#2563EB] transition-all" />
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1.5">Usage Limit</label>
          <input type="number" defaultValue={coupon?.usageLimit} placeholder="Unlimited"
            className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm outline-none focus:border-[#2563EB] transition-all" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1.5">Per User Limit</label>
          <input type="number" defaultValue={coupon?.perUserLimit ?? 1}
            className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm outline-none focus:border-[#2563EB] transition-all" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#374151] mb-1.5">Expiry Date (optional)</label>
        <input type="date" defaultValue={coupon?.expiresAt?.split("T")[0]}
          className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm outline-none focus:border-[#2563EB] transition-all" />
      </div>
    </div>
  );
}

export default function CouponsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editCoupon, setEdit]       = useState<Coupon | undefined>();
  const [copied, setCopied]         = useState<string | null>(null);
  const [localCoupons, setLocal]    = useState(coupons);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleActive = (id: string) => setLocal(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">Coupons</h1>
          <p className="text-sm text-[#9CA3AF]">{localCoupons.filter(c => c.isActive).length} active coupons</p>
        </div>
        <button onClick={() => { setEdit(undefined); setDrawerOpen(true); }}
          className="flex items-center gap-1.5 h-9 rounded-lg bg-[#111827] px-4 text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors">
          <Plus className="h-3.5 w-3.5" /> Create Coupon
        </button>
      </div>

      {/* Coupon cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {localCoupons.map((coupon, i) => (
          <motion.div key={coupon.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={cn("rounded-xl border bg-white p-5 space-y-4 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all",
              coupon.isActive ? "border-[#E5E7EB]" : "border-[#E5E7EB] opacity-60")}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF]">
                  <Tag className="h-4 w-4 text-[#2563EB]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold font-mono text-[#111827]">{coupon.code}</p>
                    <button onClick={() => copyCode(coupon.code)} className="text-[#9CA3AF] hover:text-[#374151] transition-colors">
                      {copied === coupon.code ? <Check className="h-3.5 w-3.5 text-[#22C55E]" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-[#9CA3AF] capitalize">{coupon.type.replace("_", " ")}</p>
                </div>
              </div>
              <button onClick={() => toggleActive(coupon.id)} className="shrink-0 text-[#9CA3AF] hover:text-[#374151] transition-colors">
                {coupon.isActive ? <ToggleRight className="h-5 w-5 text-[#22C55E]" /> : <ToggleLeft className="h-5 w-5" />}
              </button>
            </div>

            {/* Value */}
            <div className="rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] px-4 py-3 text-center">
              <p className="text-2xl font-extrabold text-[#2563EB]">
                {coupon.type === "percentage" ? `${coupon.value}% OFF` :
                 coupon.type === "fixed"      ? `₹${coupon.value} OFF` : "FREE SHIPPING"}
              </p>
              {coupon.minOrderAmount && <p className="text-xs text-[#9CA3AF] mt-0.5">Min. order ₹{coupon.minOrderAmount}</p>}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[#9CA3AF]">Used</p>
                <p className="text-sm font-bold text-[#111827]">
                  {coupon.usageCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ""}
                </p>
                {coupon.usageLimit && (
                  <div className="mt-1 h-1 rounded-full bg-[#E5E7EB] overflow-hidden">
                    <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${Math.min(100, (coupon.usageCount / coupon.usageLimit) * 100)}%` }} />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF]">Revenue Generated</p>
                <p className="text-sm font-bold text-[#111827]">{formatPrice(coupon.revenue)}</p>
              </div>
            </div>

            {/* Expiry + actions */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#9CA3AF]">
                {coupon.expiresAt ? `Expires ${formatDate(coupon.expiresAt)}` : "No expiry"}
              </p>
              <button onClick={() => { setEdit(coupon); setDrawerOpen(true); }}
                className="text-xs font-semibold text-[#2563EB] hover:underline">Edit</button>
            </div>
          </motion.div>
        ))}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
        title={editCoupon ? "Edit Coupon" : "Create Coupon"}
        subtitle={editCoupon ? `Code: ${editCoupon.code}` : undefined}
        footer={
          <div className="flex justify-between">
            <button onClick={() => setDrawerOpen(false)} className="h-9 px-4 rounded-lg border border-[#E5E7EB] text-sm font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors">Cancel</button>
            <button onClick={() => setDrawerOpen(false)} className="h-9 px-5 rounded-lg bg-[#111827] text-sm font-semibold text-white hover:bg-[#1F2937] transition-colors">
              {editCoupon ? "Save Changes" : "Create Coupon"}
            </button>
          </div>
        }
      >
        <CouponForm coupon={editCoupon} />
      </Drawer>
    </div>
  );
}
