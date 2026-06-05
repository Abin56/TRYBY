"use client";

import { useState, useEffect, useCallback } from "react";
import { Truck, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface SupplierRisk {
  id: string; name: string; email: string | undefined; status: string;
  tier: string | null; riskScore: number; riskLevel: string;
  cancellationRate: number | null; returnRate: number | null;
  slaScore: number | null; performanceScore: number | null;
  fulfillmentRate: number | null; totalOrders: number | null;
  suspendReason: string | null;
}

const RISK_COLOR: Record<string, string> = { LOW: "#4ADE80", MEDIUM: "#F5C518", HIGH: "#FB923C", CRITICAL: "#F87171" };

export default function SupplierRiskPage() {
  const [suppliers, setSuppliers] = useState<SupplierRisk[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/fraud/suppliers?page=${page}&limit=${limit}`);
    const json = await r.json();
    setSuppliers(json.suppliers ?? []);
    setTotal(json.total ?? 0);
    setHighRiskCount(json.highRiskCount ?? 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Truck className="w-6 h-6" style={{ color: "#E8FF47" }} /> Supplier Risk Monitoring
        </h1>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#E8FF47", color: "#0A0A0A" }}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4" style={{ background: "#111111" }}>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>Total Suppliers</p>
          <p className="text-2xl font-bold text-white mt-1">{total}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#111111" }}>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>High Risk</p>
          <p className="text-2xl font-bold mt-1" style={{ color: "#F87171" }}>{highRiskCount}</p>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "#111111" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #1A1A1A" }}>
              {["Supplier", "Tier", "Risk Score", "Cancel Rate", "Return Rate", "SLA Score", "Perf Score", "Orders", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={9} className="text-center py-12"><RefreshCw className="w-5 h-5 animate-spin mx-auto" style={{ color: "#E8FF47" }} /></td></tr>
            : suppliers.map(s => (
              <tr key={s.id} style={{ borderBottom: "1px solid #1A1A1A" }}>
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{s.name}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{s.email}</p>
                </td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "#E8FF4722", color: "#E8FF47" }}>{s.tier ?? "—"}</span></td>
                <td className="px-4 py-3">
                  <span className="text-lg font-bold" style={{ color: RISK_COLOR[s.riskLevel] }}>{s.riskScore}</span>
                  <span className="block text-xs" style={{ color: RISK_COLOR[s.riskLevel] }}>{s.riskLevel}</span>
                </td>
                <td className="px-4 py-3"><span style={{ color: Number(s.cancellationRate ?? 0) > 15 ? "#F87171" : "#4ADE80" }}>{Number(s.cancellationRate ?? 0).toFixed(1)}%</span></td>
                <td className="px-4 py-3"><span style={{ color: Number(s.returnRate ?? 0) > 20 ? "#F87171" : "#4ADE80" }}>{Number(s.returnRate ?? 0).toFixed(1)}%</span></td>
                <td className="px-4 py-3"><span style={{ color: Number(s.slaScore ?? 100) < 70 ? "#F87171" : "#4ADE80" }}>{Number(s.slaScore ?? 0).toFixed(0)}</span></td>
                <td className="px-4 py-3"><span style={{ color: Number(s.performanceScore ?? 100) < 50 ? "#F87171" : "#4ADE80" }}>{Number(s.performanceScore ?? 0).toFixed(0)}</span></td>
                <td className="px-4 py-3 text-white">{s.totalOrders ?? "—"}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/suppliers/${s.id}`} className="text-xs px-3 py-1 rounded-lg" style={{ background: "#E8FF4722", color: "#E8FF47" }}>View</Link>
                </td>
              </tr>
            ))}
            {!loading && suppliers.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-sm" style={{ color: "#9CA3AF" }}>No suppliers found</td></tr>}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "#9CA3AF" }}>Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg disabled:opacity-30" style={{ background: "#111111" }}><ChevronLeft className="w-4 h-4 text-white" /></button>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg disabled:opacity-30" style={{ background: "#111111" }}><ChevronRight className="w-4 h-4 text-white" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
