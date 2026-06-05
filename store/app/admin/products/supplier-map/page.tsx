"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Store, Package, RefreshCw, Link2, Unlink } from "lucide-react";

interface SupplierProduct {
  id: string; name: string; sport: string; category: string;
  isActive: boolean; totalStock: number; variantCount: number;
  minPrice: number; image: string | null;
}
interface SupplierStat {
  id: string; companyName: string; slug?: string; logoUrl?: string;
  tier: string; totalProducts: number; totalStock: number; totalValue: number;
  outOfStock: number; products: SupplierProduct[];
}

const TIER_COLORS: Record<string, string> = {
  BRONZE: "#CD7F32", SILVER: "#C0C0C0", GOLD: "#F5C518", PLATINUM: "#E5E4E2",
};

export default function SupplierMapPage() {
  const [suppliers, setSuppliers]   = useState<SupplierStat[]>([]);
  const [unmapped, setUnmapped]     = useState(0);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products/supplier-map");
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers);
        setUnmapped(data.unmappedCount);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="p-8 flex justify-center"><RefreshCw className="h-6 w-6 animate-spin text-white/20" /></div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-[1000px]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px", letterSpacing: "-0.01em" }}>
            Supplier Product Map
          </h1>
          <p className="text-white/40 text-[12px]">
            {suppliers.length} active suppliers · {unmapped} unmapped products
            {unmapped > 0 && <Link href="/admin/products/bulk" className="text-[#F5C518] ml-2 hover:underline">assign via bulk editor →</Link>}
          </p>
        </div>
        <button onClick={load} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Unmapped warning */}
      {unmapped > 0 && (
        <div className="rounded-2xl px-5 py-4 mb-5 flex items-center gap-3"
          style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)" }}>
          <Unlink className="h-5 w-5 text-[#F87171] shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-[#F87171]">{unmapped} products have no supplier</p>
            <p className="text-[11px] text-white/40">These will not appear in supplier dashboards or payouts.</p>
          </div>
          <Link href="/admin/products/bulk" className="ml-auto h-8 px-4 rounded-xl text-[11px] font-bold text-[#0D0D0D] flex items-center" style={{ background: "#F87171" }}>
            Fix Now
          </Link>
        </div>
      )}

      {/* Supplier cards */}
      <div className="space-y-4">
        {suppliers.map(supplier => (
          <div key={supplier.id} className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Supplier header */}
            <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-all"
              onClick={() => setExpanded(e => e === supplier.id ? null : supplier.id)}>
              <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden" style={{ background: "#2A2A2A" }}>
                {supplier.logoUrl
                  ? <img src={supplier.logoUrl} alt="" className="w-full h-full object-cover" />
                  : <Store className="h-5 w-5 m-2.5 text-white/20" />
                }
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold text-white">{supplier.companyName}</p>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: `${TIER_COLORS[supplier.tier] ?? "#6B7280"}15`, color: TIER_COLORS[supplier.tier] ?? "#6B7280" }}>
                    {supplier.tier}
                  </span>
                </div>
                <p className="text-[11px] text-white/30">{supplier.totalProducts} products · {supplier.totalStock} units · ₹{Math.round(supplier.totalValue / 1000)}K stock value</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {supplier.outOfStock > 0 && (
                  <span className="text-[11px] font-bold text-[#F87171]">{supplier.outOfStock} OOS</span>
                )}
                <Link href={`/admin/suppliers`} onClick={e => e.stopPropagation()}
                  className="text-[11px] font-semibold text-white/35 hover:text-white transition-colors">
                  View Supplier →
                </Link>
                <span className="text-white/25 text-[12px]">{expanded === supplier.id ? "▲" : "▼"}</span>
              </div>
            </button>

            {/* Products list */}
            {expanded === supplier.id && supplier.products.length > 0 && (
              <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {supplier.products.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.015] transition-colors">
                      <div className="h-8 w-8 shrink-0 rounded-lg overflow-hidden" style={{ background: "#2A2A2A" }}>
                        {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <Package className="h-3.5 w-3.5 m-2 text-white/20" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-white/30">{p.category} · {p.sport} · {p.variantCount} variants</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[12px] font-bold text-white">₹{p.minPrice.toLocaleString("en-IN")}</p>
                        <p className={`text-[10px] ${p.totalStock === 0 ? "text-[#F87171]" : "text-white/30"}`}>{p.totalStock} units</p>
                      </div>
                      <Link href={`/admin/products/${p.id}/edit`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 hover:text-[#F5C518] transition-all">
                        <Link2 className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {expanded === supplier.id && supplier.products.length === 0 && (
              <div className="py-8 text-center text-white/25 text-[12px] border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                No active products
              </div>
            )}
          </div>
        ))}

        {suppliers.length === 0 && (
          <div className="flex flex-col items-center py-16 text-white/25 rounded-2xl" style={{ border: "1.5px dashed rgba(255,255,255,0.08)" }}>
            <Store className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-[13px] font-semibold">No approved suppliers</p>
            <Link href="/admin/suppliers" className="mt-2 text-[12px] text-[#F5C518] hover:underline">Manage Suppliers →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
