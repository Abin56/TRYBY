"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RefreshCw, Ban, RotateCcw, Shield, ArrowLeft } from "lucide-react";

interface CustomerDetail {
  profile: {
    userId: string;
    riskScore: number;
    riskLevel: string;
    codOrderCount: number;
    codDeliveredCount: number;
    codCancelledCount: number;
    codSuccessRate: number;
    isCodBlocked: boolean;
    codBlockReason: string | null;
    returnCount: number;
    refundCount: number;
    totalRefundAmount: number;
    refundRate: number;
    totalOrders: number;
    ordersLast7d: number;
    ordersLast30d: number;
    distinctIpCount: number;
    multiAccountFlag: boolean;
    isManuallyReviewed: boolean;
    reviewNote: string | null;
    lastScoredAt: string | null;
  } | null;
  user: { id: string; name: string | null; email: string | null; phone: string | null; createdAt: string } | null;
  orders: {
    id: string;
    orderNumber: string;
    total: string;
    status: string;
    createdAt: string;
    payment: { method: string } | null;
    riskFlag: { riskScore: number; riskLevel: string; flags: string[] } | null;
  }[];
  returns: { id: string; status: string; refundAmount: string | null; createdAt: string }[];
  fraudLogs: { id: string; action: string; performedBy: string; note: string | null; createdAt: string }[];
}

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "#EF4444",
  HIGH: "#F97316",
  MEDIUM: "#EAB308",
  LOW: "#22C55E",
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescoring, setRescoring] = useState(false);
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/admin/fraud/customers/${id}`);
    const json = await r.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function rescore() {
    setRescoring(true);
    await fetch(`/api/admin/fraud/customers/${id}`, { method: "POST" });
    setRescoring(false);
    load();
  }

  async function patch(action: string) {
    await fetch("/api/admin/fraud/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, action, note, performedBy: "admin" }),
    });
    load();
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-6 w-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );

  const { profile, user, orders, returns, fraudLogs } = data ?? {};

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/fraud/customers" className="text-white/40 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-white font-black text-2xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            {user?.name ?? "Unknown Customer"}
          </h1>
          <p className="text-white/40 text-[13px]">{user?.email} · {user?.phone}</p>
        </div>
        {profile && (
          <span
            className="ml-auto px-3 py-1 rounded-lg text-[13px] font-bold uppercase"
            style={{ color: RISK_COLORS[profile.riskLevel], background: `${RISK_COLORS[profile.riskLevel]}18` }}
          >
            {profile.riskLevel} · {profile.riskScore}/100
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Profile Card */}
        <div className="md:col-span-2 space-y-4">
          {profile ? (
            <>
              {/* Risk score bar */}
              <div className="rounded-xl p-5 space-y-4" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-bold text-[14px]">Risk Score</h2>
                  <button onClick={rescore} disabled={rescoring}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-white/60 hover:text-white transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                    <RefreshCw className={`h-3.5 w-3.5 ${rescoring ? "animate-spin" : ""}`} />
                    Re-score
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-white/50">Score</span>
                    <span className="font-bold" style={{ color: RISK_COLORS[profile.riskLevel] }}>{profile.riskScore}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/08 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${profile.riskScore}%`, background: RISK_COLORS[profile.riskLevel] }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: "Total Orders", value: profile.totalOrders },
                    { label: "Last 7d", value: profile.ordersLast7d },
                    { label: "Distinct IPs", value: profile.distinctIpCount },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <p className="text-white font-bold text-[18px]">{value}</p>
                      <p className="text-white/40 text-[11px]">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* COD Stats */}
              <div className="rounded-xl p-5" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-bold text-[14px]">COD Profile</h2>
                  {profile.isCodBlocked ? (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500/15 text-orange-400">COD BLOCKED</span>
                      <button onClick={() => patch("unblock_cod")}
                        className="text-[12px] text-green-400 hover:text-green-300 flex items-center gap-1">
                        <RotateCcw className="h-3 w-3" /> Unblock
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => patch("block_cod")}
                      className="flex items-center gap-1 text-[12px] text-orange-400 hover:text-orange-300">
                      <Ban className="h-3.5 w-3.5" /> Block COD
                    </button>
                  )}
                </div>
                {profile.isCodBlocked && profile.codBlockReason && (
                  <p className="text-orange-300/80 text-[12px] mb-3 px-3 py-2 rounded-lg bg-orange-500/08">
                    {profile.codBlockReason}
                  </p>
                )}
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { label: "COD Orders", value: profile.codOrderCount },
                    { label: "Delivered", value: profile.codDeliveredCount },
                    { label: "Cancelled", value: profile.codCancelledCount },
                    { label: "Success %", value: `${(profile.codSuccessRate * 100).toFixed(1)}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <p className="text-white font-bold text-[18px]">{value}</p>
                      <p className="text-white/40 text-[11px]">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refund Stats */}
              <div className="rounded-xl p-5" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-white font-bold text-[14px] mb-4">Refund Profile</h2>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "Total Refunds", value: profile.refundCount },
                    { label: "Refund Rate", value: `${(profile.refundRate * 100).toFixed(1)}%` },
                    { label: "Amount", value: `₹${Number(profile.totalRefundAmount).toLocaleString("en-IN")}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <p className="text-white font-bold text-[18px]">{value}</p>
                      <p className="text-white/40 text-[11px]">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl p-8 text-center text-white/40" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
              No risk profile yet.
              <button onClick={rescore} className="block mx-auto mt-3 text-blue-400 hover:text-blue-300 text-[13px]">
                Generate score
              </button>
            </div>
          )}

          {/* Order history */}
          <div className="rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <h2 className="text-white font-bold text-[14px]">Recent Orders</h2>
            </div>
            <div className="divide-y" style={{ divideColor: "rgba(255,255,255,0.04)" }}>
              {(orders ?? []).slice(0, 10).map((o) => (
                <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1">
                    <p className="text-white text-[13px] font-medium">{o.orderNumber}</p>
                    <p className="text-white/40 text-[11px]">{o.payment?.method} · {new Date(o.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-[13px]">₹{Number(o.total).toLocaleString("en-IN")}</p>
                    <span className="text-white/40 text-[11px]">{o.status}</span>
                    {o.riskFlag && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-bold"
                        style={{ color: RISK_COLORS[o.riskFlag.riskLevel], background: `${RISK_COLORS[o.riskFlag.riskLevel]}18` }}>
                        {o.riskFlag.riskScore}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: actions + audit log */}
        <div className="space-y-4">
          {/* Manual review note */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="text-white font-bold text-[13px]">Admin Review Note</h3>
            {profile?.reviewNote && (
              <p className="text-white/60 text-[12px] px-3 py-2 rounded-lg bg-white/04">{profile.reviewNote}</p>
            )}
            <textarea
              className="w-full bg-white/04 text-white text-[12px] rounded-lg px-3 py-2 outline-none resize-none border border-white/08 focus:border-white/20"
              rows={3}
              placeholder="Add review note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              onClick={() => patch("review")}
              className="w-full py-2 rounded-lg text-[12px] font-semibold"
              style={{ background: "#E8FF47", color: "#0D0D0D" }}
            >
              Save Note
            </button>
          </div>

          {/* Fraud Audit Log */}
          <div className="rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <h3 className="text-white font-bold text-[13px]">Risk Action History</h3>
            </div>
            <div className="divide-y max-h-80 overflow-y-auto" style={{ divideColor: "rgba(255,255,255,0.04)" }}>
              {(fraudLogs ?? []).map((log) => (
                <div key={log.id} className="px-4 py-3">
                  <p className="text-white text-[12px] font-medium">{log.action.replace(/_/g, " ")}</p>
                  <p className="text-white/40 text-[11px]">{log.note ?? "—"}</p>
                  <p className="text-white/25 text-[10px]">by {log.performedBy} · {new Date(log.createdAt).toLocaleString("en-IN")}</p>
                </div>
              ))}
              {(fraudLogs ?? []).length === 0 && (
                <p className="text-center text-white/30 text-[12px] py-6">No history</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
