"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingDown, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

interface RefundRecord {
  userId: string; totalRefunds: number; totalRefundAmount: number;
  refundRate: number; lastRefundAt: string | null; isFlagged: boolean;
  user: { id: string; name: string | null; email: string; phone: string | null } | null;
}

export default function RefundAbusePage() {
  const [records, setRecords] = useState<RefundRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isFlagged, setIsFlagged] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [kpis, setKpis] = useState<{ _count: { id: number }; _avg: { refundRate: number | null }; _sum: { totalRefunds: number | null; totalRefundAmount: number | null } } | null>(null);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (isFlagged) params.set("isFlagged", isFlagged);
    const r = await fetch(`/api/admin/fraud/refunds?${params}`);
    const json = await r.json();
    setRecords(json.records ?? []);
    setTotal(json.total ?? 0);
    setKpis(json.kpis);
    setLoading(false);
  }, [page, isFlagged]);

  useEffect(() => { load(); }, [load]);

  const runScan = async () => {
    setScanning(true);
    const r = await fetch("/api/admin/fraud/refunds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const json = await r.json();
    setScanning(false);
    alert(`Scan complete. ${json.flagged} refund abusers flagged out of ${json.total} users.`);
    load();
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingDown className="w-6 h-6" style={{ color: "#E8FF47" }} /> Refund Abuse Detection
        </h1>
        <div className="flex gap-2">
          <select value={isFlagged} onChange={e => { setIsFlagged(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg text-sm text-white outline-none" style={{ background: "#111111" }}>
            <option value="">All Users</option>
            <option value="true">Flagged Only</option>
          </select>
          <button disabled={scanning} onClick={runScan} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#E8FF47", color: "#0A0A0A" }}>
            <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} /> Run Scan
          </button>
        </div>
      </div>

      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Flagged", value: records.filter(r => r.isFlagged).length },
            { label: "Total Refunds", value: kpis._sum.totalRefunds ?? 0 },
            { label: "Total Refund ₹", value: `₹${Number(kpis._sum.totalRefundAmount ?? 0).toLocaleString("en-IN")}` },
            { label: "Avg Refund Rate", value: `${Number(kpis._avg.refundRate ?? 0).toFixed(1)}%` },
          ].map(k => (
            <div key={k.label} className="rounded-xl p-4" style={{ background: "#111111" }}>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>{k.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ background: "#111111" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #1A1A1A" }}>
              {["Customer", "Total Refunds", "Refund Amount", "Refund Rate", "Last Refund", "Status"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="text-center py-12"><RefreshCw className="w-5 h-5 animate-spin mx-auto" style={{ color: "#E8FF47" }} /></td></tr>
            : records.map(r => (
              <tr key={r.userId} style={{ borderBottom: "1px solid #1A1A1A" }}>
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{r.user?.name ?? "Unknown"}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{r.user?.email}</p>
                </td>
                <td className="px-4 py-3 text-white">{r.totalRefunds}</td>
                <td className="px-4 py-3 text-white">₹{Number(r.totalRefundAmount).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  <span className="font-bold" style={{ color: Number(r.refundRate) >= 40 ? "#F87171" : Number(r.refundRate) >= 20 ? "#FB923C" : "#4ADE80" }}>
                    {Number(r.refundRate).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>
                  {r.lastRefundAt ? new Date(r.lastRefundAt).toLocaleDateString("en-IN") : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: r.isFlagged ? "#F5C51822" : "#4ADE8022", color: r.isFlagged ? "#F5C518" : "#4ADE80" }}>
                    {r.isFlagged ? "Flagged" : "Clear"}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && records.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: "#9CA3AF" }}>No refund abuse records</td></tr>}
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
