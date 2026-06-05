"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Store, Search, CheckCircle2, XCircle, Clock,
  ChevronLeft, ChevronRight, ChevronDown, Package, ExternalLink,
} from "lucide-react";
import Link from "next/link";

type Supplier = {
  id: string;
  companyName: string;
  status: "PENDING" | "APPROVED" | "SUSPENDED";
  commissionRate: number;
  totalSales: number;
  pendingPayout: number;
  createdAt: string;
  onboardedAt: string | null;
  user: { id: string; name: string | null; email: string | null; image: string | null };
  _count: { products: number; payouts: number };
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "#F5C518",
  APPROVED:  "#4ADE80",
  SUSPENDED: "#F87171",
};

const STATUS_ICON: Record<string, React.ElementType> = {
  PENDING:   Clock,
  APPROVED:  CheckCircle2,
  SUSPENDED: XCircle,
};

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [q, setQ]                 = useState("");
  const [statusFilter, setStatusF] = useState("");
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionL] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), q });
    if (statusFilter) params.set("status", statusFilter);
    const res  = await fetch(`/api/admin/suppliers?${params}`);
    const data = await res.json();
    setSuppliers(data.suppliers ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, q, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function updateSupplier(id: string, update: { status?: string; commissionRate?: number }) {
    setActionL(id);
    await fetch("/api/admin/suppliers", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id, ...update }),
    });
    setActionL(null);
    load();
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">

      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-white font-black"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}
        >
          Suppliers
        </h1>
        <p className="text-white/40 text-[13px] mt-0.5">{total} supplier{total !== 1 ? "s" : ""} registered</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div
          className="flex items-center gap-2 rounded-xl px-4 flex-1 min-w-[200px]"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", height: "44px" }}
        >
          <Search className="h-4 w-4 text-white/30 shrink-0" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Search by name, email, GSTIN…"
            className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/25"
          />
        </div>
        {["", "PENDING", "APPROVED", "SUSPENDED"].map(s => (
          <button
            key={s}
            onClick={() => { setStatusF(s); setPage(1); }}
            className="rounded-xl px-3 py-2 text-[12px] font-semibold transition-all"
            style={{
              background: statusFilter === s ? "#F5C518" : "rgba(255,255,255,0.06)",
              color:      statusFilter === s ? "#0D0D0D" : "rgba(255,255,255,0.50)",
            }}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Pending Approval", filter: "PENDING",   color: "#F5C518" },
          { label: "Active Suppliers", filter: "APPROVED",  color: "#4ADE80" },
          { label: "Suspended",        filter: "SUSPENDED", color: "#F87171" },
        ].map(item => (
          <button
            key={item.filter}
            onClick={() => { setStatusF(item.filter); setPage(1); }}
            className="flex flex-col gap-1 rounded-2xl p-4 text-left transition-all hover:brightness-110"
            style={{ background: "#1A1A1A", border: `1px solid ${statusFilter === item.filter ? item.color + "40" : "rgba(255,255,255,0.06)"}` }}
          >
            <span className="text-[11px] font-medium text-white/40">{item.label}</span>
            <span
              className="font-black text-[22px]"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: item.color }}
            >
              {suppliers.filter(s => s.status === item.filter).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
        </div>
      ) : suppliers.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Store className="h-10 w-10 text-white/15 mb-3" />
          <p className="text-white/40 text-[14px]">No suppliers found</p>
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
                  {["Supplier", "Status", "Products", "Total Sales", "Commission", "Joined", "Actions"].map(h => (
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
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {suppliers.map(s => {
                  const Icon  = STATUS_ICON[s.status];
                  const color = STATUS_COLOR[s.status];
                  return (
                    <tr key={s.id} className="hover:bg-white/02 transition-colors">

                      {/* Supplier */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {s.user.image ? (
                            <img src={s.user.image} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
                          ) : (
                            <div
                              className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-[14px] font-black"
                              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.40)", fontFamily: "'Barlow Condensed', sans-serif" }}
                            >
                              {s.companyName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <Link
                              href={`/admin/suppliers/${s.id}`}
                              className="text-[13px] font-semibold text-white/85 hover:text-white transition-colors flex items-center gap-1 group"
                            >
                              {s.companyName}
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                            </Link>
                            <p className="text-[11px] text-white/35">{s.user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold w-fit"
                          style={{ background: `${color}15`, color }}
                        >
                          <Icon className="h-3 w-3" /> {s.status}
                        </span>
                      </td>

                      {/* Products */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-white/60">
                          <Package className="h-3.5 w-3.5" />
                          <span className="text-[13px]">{s._count.products}</span>
                        </div>
                      </td>

                      {/* Total Sales */}
                      <td className="px-5 py-4">
                        <span
                          className="font-black text-white text-[14px]"
                          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                        >
                          ₹{Number(s.totalSales).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </span>
                      </td>

                      {/* Commission */}
                      <td className="px-5 py-4">
                        <CommissionEditor
                          supplierId={s.id}
                          current={Number(s.commissionRate)}
                          loading={actionLoading === s.id}
                          onSave={rate => updateSupplier(s.id, { commissionRate: rate })}
                        />
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-4">
                        <span className="text-[12px] text-white/40">{fmtDate(s.createdAt)}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {s.status === "PENDING" && (
                            <button
                              onClick={() => updateSupplier(s.id, { status: "APPROVED" })}
                              disabled={actionLoading === s.id}
                              className="rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-40"
                              style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}
                            >
                              Approve
                            </button>
                          )}
                          {s.status === "APPROVED" && (
                            <button
                              onClick={() => updateSupplier(s.id, { status: "SUSPENDED" })}
                              disabled={actionLoading === s.id}
                              className="rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-40"
                              style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}
                            >
                              Suspend
                            </button>
                          )}
                          {s.status === "SUSPENDED" && (
                            <button
                              onClick={() => updateSupplier(s.id, { status: "APPROVED" })}
                              disabled={actionLoading === s.id}
                              className="rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-40"
                              style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}
                            >
                              Reinstate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

/* ── Inline commission editor ──────────────────────────────────────── */
function CommissionEditor({
  supplierId, current, loading, onSave,
}: {
  supplierId: string;
  current: number;
  loading: boolean;
  onSave: (rate: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(String((current * 100).toFixed(1)));

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-[13px] text-white/60 hover:text-white transition-colors group"
      >
        {(current * 100).toFixed(1)}%
        <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        className="w-16 rounded-lg px-2 py-1 text-[13px] text-white outline-none"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
        autoFocus
      />
      <span className="text-white/40 text-[12px]">%</span>
      <button
        onClick={() => {
          const rate = parseFloat(val) / 100;
          if (!isNaN(rate) && rate >= 0 && rate <= 1) {
            onSave(rate);
            setEditing(false);
          }
        }}
        disabled={loading}
        className="rounded-lg px-2 py-1 text-[11px] font-bold text-[#4ADE80] hover:bg-white/08 transition-all disabled:opacity-40"
      >
        Save
      </button>
      <button
        onClick={() => { setVal(String((current * 100).toFixed(1))); setEditing(false); }}
        className="rounded-lg px-1.5 py-1 text-[11px] font-bold text-white/30 hover:text-white hover:bg-white/06 transition-all"
      >
        ✕
      </button>
    </div>
  );
}
