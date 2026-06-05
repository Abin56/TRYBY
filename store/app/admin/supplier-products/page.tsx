"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package, Search, CheckCircle2, Clock,
  ChevronLeft, ChevronRight, Boxes, X, Check, Info,
} from "lucide-react";
import Link from "next/link";

type Variant = { id: string; price: number; stock: number; sku: string };
type Product = {
  id: string; name: string; slug: string; isActive: boolean; createdAt: string;
  category: { name: string };
  supplier: { id: string; companyName: string; user: { name: string | null; email: string | null } };
  images: { url: string }[];
  variants: Variant[];
};

type Warehouse = { id: string; name: string; code: string; isDefault: boolean };

function ApproveModal({ product, onClose, onSuccess }: { product: Product; onClose: () => void; onSuccess: () => void }) {
  const [warehouses, setWarehouses]     = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId]   = useState("");
  const [initialStock, setInitialStock] = useState("0");
  const [busy, setBusy]                 = useState(false);
  const [err, setErr]                   = useState("");

  useEffect(() => {
    fetch("/api/admin/warehouses")
      .then(r => r.json())
      .then(d => {
        const whs: Warehouse[] = d.warehouses ?? d ?? [];
        setWarehouses(whs);
        const def = whs.find(w => w.isDefault);
        if (def) setWarehouseId(def.id);
      })
      .catch(() => {});
  }, []);

  async function submit() {
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/admin/supplier-products/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id:           product.id,
          action:       "approve",
          warehouseId:  warehouseId || undefined,
          initialStock: parseInt(initialStock) || 0,
          useDefaultWarehouse: !warehouseId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Failed"); setBusy(false); return; }
      onSuccess();
    } catch { setErr("Network error"); setBusy(false); }
  }

  const minPrice = product.variants.length ? Math.min(...product.variants.map(v => Number(v.price))) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div>
            <p className="text-white font-black text-[16px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Approve Product</p>
            <p className="text-white/40 text-[11px] truncate max-w-[280px]">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Product summary */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden" style={{ background: "#2A2A2A" }}>
              {product.images[0] ? <img src={product.images[0].url} alt="" className="w-full h-full object-cover" /> : <Package className="h-4 w-4 m-3 text-white/20" />}
            </div>
            <div>
              <p className="text-[12px] font-semibold text-white">{product.name}</p>
              <p className="text-[10px] text-white/40">{product.supplier.companyName} · {product.variants.length} variants · ₹{minPrice.toLocaleString("en-IN")}</p>
            </div>
          </div>

          {/* Inventory wizard */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(245,197,24,0.05)", border: "1px solid rgba(245,197,24,0.15)" }}>
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-[#F5C518]" />
              <p className="text-[12px] font-bold text-[#F5C518]">Inventory Setup</p>
            </div>
            <p className="text-[11px] text-white/40">Automatically creates warehouse stock records and inventory log entries for all {product.variants.length} variants.</p>

            <div>
              <label className="block text-[10px] font-bold text-white/35 mb-1.5 uppercase tracking-widest">
                Assign to Warehouse
              </label>
              <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)}
                className="w-full h-9 rounded-xl px-3 text-[12px] text-white outline-none bg-[#111] border border-white/08">
                <option value="">Default warehouse (auto)</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code}){w.isDefault ? " — Default" : ""}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/35 mb-1.5 uppercase tracking-widest">
                Initial Stock per Variant
              </label>
              <input type="number" min="0" value={initialStock} onChange={e => setInitialStock(e.target.value)}
                placeholder="0"
                className="w-full h-9 rounded-xl px-3 text-[12px] text-white outline-none bg-[#111] border border-white/08" />
              <p className="text-[10px] text-white/25 mt-1">
                Applied to all {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}. Can be adjusted per-variant afterwards.
              </p>
            </div>
          </div>

          {err && <div className="rounded-xl px-4 py-3 text-[12px] text-[#F87171]" style={{ background: "rgba(248,113,113,0.08)" }}>{err}</div>}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              Cancel
            </button>
            <button onClick={submit} disabled={busy}
              className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-[13px] font-black text-[#0D0D0D] disabled:opacity-40"
              style={{ background: "#4ADE80" }}>
              <Check className="h-4 w-4" />
              {busy ? "Approving…" : "Approve & Add to Catalog"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSupplierProductsPage() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [q, setQ]                 = useState("");
  const [filter, setFilter]       = useState("false");
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setAL]    = useState<string | null>(null);
  const [approveModal, setApproveModal] = useState<Product | null>(null);
  const [rejectModal, setRM]      = useState<Product | null>(null);
  const [rejectReason, setRR]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), q });
    if (filter !== "") params.set("approved", filter);
    const res  = await fetch(`/api/admin/supplier-products?${params}`);
    const data = await res.json();
    setProducts(data.products ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, q, filter]);

  useEffect(() => { load(); }, [load]);

  async function doReject(id: string, reason?: string) {
    setAL(id);
    await fetch("/api/admin/supplier-products", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "reject", reason }),
    });
    setAL(null);
    load();
  }

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const minPrice = (variants: Variant[]) => variants.length ? Math.min(...variants.map(v => Number(v.price))) : 0;
  const totalStock = (variants: Variant[]) => variants.reduce((s, v) => s + v.stock, 0);

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Product Approval Queue
          </h1>
          <p className="text-white/40 text-[13px] mt-0.5">{total} product{total !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/catalog-center" className="h-9 px-4 rounded-xl text-[12px] font-semibold text-white/50 hover:text-white flex items-center"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            Catalog Center
          </Link>
        </div>
      </div>

      {/* Pending count alert */}
      {filter === "false" && total > 0 && (
        <div className="flex items-center gap-3 rounded-2xl px-5 py-4 mb-5"
          style={{ background: "rgba(245,197,24,0.06)", border: "1px solid rgba(245,197,24,0.2)" }}>
          <Info className="h-5 w-5 text-[#F5C518] shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-white">{total} product{total !== 1 ? "s" : ""} awaiting review</p>
            <p className="text-[11px] text-white/40">Approving a product creates warehouse stock records and notifies the supplier.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 rounded-xl px-4 flex-1 min-w-[200px]"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", height: "44px" }}>
          <Search className="h-4 w-4 text-white/30 shrink-0" />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search products or supplier…"
            className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/25" />
        </div>
        {[{ label: "Pending", value: "false" }, { label: "Approved", value: "true" }, { label: "All", value: "" }].map(f => (
          <button key={f.value} onClick={() => { setFilter(f.value); setPage(1); }}
            className="rounded-xl px-3 py-2 text-[12px] font-semibold transition-all"
            style={{ background: filter === f.value ? "#F5C518" : "rgba(255,255,255,0.06)", color: filter === f.value ? "#0D0D0D" : "rgba(255,255,255,0.50)" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Package className="h-10 w-10 text-white/15 mb-3" />
          <p className="text-white/40 text-[14px]">No products in this view</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Product", "Supplier", "Category", "Price", "Stock", "Submitted", "Status", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold tracking-wider text-white/30"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.12em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-white/02 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {p.images[0] ? (
                          <img src={p.images[0].url} alt="" className="h-9 w-9 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="h-9 w-9 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <Package className="h-4 w-4 text-white/20" />
                          </div>
                        )}
                        <div>
                          <p className="text-[13px] font-semibold text-white/85 max-w-[160px] truncate">{p.name}</p>
                          <p className="text-[10px] text-white/30">{p.variants.length} variant{p.variants.length !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/suppliers/${p.supplier.id}`} className="text-[12px] text-white/60 hover:text-white transition-colors">
                        {p.supplier.companyName}
                      </Link>
                      <p className="text-[10px] text-white/30">{p.supplier.user.email}</p>
                    </td>
                    <td className="px-5 py-3"><span className="text-[12px] text-white/50">{p.category.name}</span></td>
                    <td className="px-5 py-3">
                      <span className="font-black text-white text-[14px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                        ₹{minPrice(p.variants).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[13px] font-semibold"
                        style={{ color: totalStock(p.variants) < 5 ? "#F87171" : totalStock(p.variants) < 20 ? "#F5C518" : "#4ADE80" }}>
                        {totalStock(p.variants)}
                      </span>
                    </td>
                    <td className="px-5 py-3"><span className="text-[12px] text-white/40">{fmtDate(p.createdAt)}</span></td>
                    <td className="px-5 py-3">
                      {p.isActive ? (
                        <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold w-fit" style={{ background: "rgba(74,222,128,0.10)", color: "#4ADE80" }}>
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold w-fit" style={{ background: "rgba(245,197,24,0.10)", color: "#F5C518" }}>
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {!p.isActive && (
                          <>
                            <button onClick={() => setApproveModal(p)} disabled={actionLoading === p.id}
                              className="rounded-xl px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 hover:brightness-110"
                              style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>
                              Approve
                            </button>
                            <button onClick={() => { setRM(p); setRR(""); }} disabled={actionLoading === p.id}
                              className="rounded-xl px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 hover:brightness-110"
                              style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}>
                              Reject
                            </button>
                          </>
                        )}
                        {p.isActive && (
                          <button onClick={() => doReject(p.id)} disabled={actionLoading === p.id}
                            className="rounded-xl px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 hover:brightness-110"
                            style={{ background: "rgba(248,113,113,0.08)", color: "#F87171" }}>
                            De-list
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {/* Approve modal */}
      {approveModal && (
        <ApproveModal
          product={approveModal}
          onClose={() => setApproveModal(null)}
          onSuccess={() => { setApproveModal(null); load(); }}
        />
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={e => { if (e.target === e.currentTarget) setRM(null); }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#1C1C1C", border: "1px solid rgba(255,255,255,0.10)" }}>
            <h3 className="text-white font-black mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>Reject Product</h3>
            <p className="text-white/40 text-[12px] mb-4">{rejectModal.name}</p>
            <textarea value={rejectReason} onChange={e => setRR(e.target.value)} rows={3}
              placeholder="Reason for rejection (shown to supplier)"
              className="w-full rounded-xl px-4 py-3 text-[13px] text-white outline-none resize-none mb-5"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }} />
            <div className="flex gap-3">
              <button onClick={() => setRM(null)} className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white/40 hover:text-white hover:bg-white/06">Cancel</button>
              <button onClick={() => { doReject(rejectModal.id, rejectReason); setRM(null); }} disabled={actionLoading === rejectModal.id}
                className="flex-1 rounded-xl py-2.5 text-[13px] font-black disabled:opacity-40 hover:brightness-110"
                style={{ background: "rgba(248,113,113,0.15)", color: "#F87171" }}>
                Reject Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
