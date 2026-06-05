"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, User, CreditCard, FileText, Package,
  Wallet, BarChart2, CheckCircle2, XCircle, Clock, AlertTriangle,
  ShieldCheck, TrendingUp, Star, Zap, RefreshCw,
} from "lucide-react";
import Link from "next/link";

type Document = {
  id: string; type: string; label: string | null; url: string;
  isVerified: boolean; verifiedAt: string | null; rejectReason: string | null; uploadedAt: string;
};

type Product = {
  id: string; name: string; slug: string; isActive: boolean;
  totalSoldCount: number; avgRating: number; createdAt: string;
  images: { url: string }[];
};

type Payout = {
  id: string; amount: number; status: string;
  utrNumber: string | null; processedAt: string | null;
  createdAt: string; rejectReason: string | null;
};

type Supplier = {
  id: string; companyName: string; gstin: string | null; panNumber: string | null;
  bankAccountNo: string | null; bankIfsc: string | null; bankAccountName: string | null;
  websiteUrl: string | null; businessAddress: string | null;
  status: "PENDING" | "APPROVED" | "SUSPENDED";
  commissionRate: number; totalSales: number; pendingPayout: number;
  docsVerified: boolean; agreementUrl: string | null; suspendReason: string | null;
  performanceScore: number; fulfillmentRate: number; returnRate: number; avgRating: number;
  onboardedAt: string | null; createdAt: string;
  user: { name: string | null; email: string | null; phone: string | null };
  documents: Document[];
  activityLogs: { id: string; action: string; detail: string; createdAt: string }[];
};

type Stats = { totalRevenue: number; totalUnitsSold: number; totalProducts: number; activeProducts: number };

type SlaRecord = {
  id: string; orderNumber: string; orderCreatedAt: string;
  acceptedAt: string | null; shippedAt: string | null; deliveredAt: string | null; cancelledAt: string | null;
  acceptanceMinutes: number | null; shippingMinutes: number | null; deliveryMinutes: number | null;
  acceptanceStatus: string; shippingStatus: string; deliveryStatus: string; overallStatus: string;
  acceptanceSlaHrs: number; shippingSlaHrs: number; deliverySlaHrs: number;
};

type SlaStats = {
  slaScore: number; avgAcceptanceHrs: number; avgShippingHrs: number; avgDeliveryDays: number;
  acceptanceBreaches: number; shippingBreaches: number; deliveryBreaches: number; totalCompleted: number;
};

type SlaTabData = {
  records: SlaRecord[]; total: number; pages: number;
  counts: Record<string, number>; stats: SlaStats;
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#F5C518", APPROVED: "#4ADE80", SUSPENDED: "#F87171",
};

export default function AdminSupplierDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [data, setData]         = useState<{ supplier: Supplier; products: Product[]; payouts: Payout[]; stats: Stats } | null>(null);
  const [loading, setLoading]   = useState(true);
  const [actionLoading, setAL]  = useState(false);
  const [tab, setTab]           = useState<"overview" | "products" | "payouts" | "docs" | "sla" | "activity">("overview");
  const [slaData, setSlaData]   = useState<SlaTabData | null>(null);
  const [slaLoading, setSlaL]   = useState(false);
  const [slaFilter, setSlaFilter] = useState("all");
  const [suspendReason, setSR]  = useState("");
  const [showSuspendModal, setSSM] = useState(false);
  const [commissionEdit, setCE] = useState(false);
  const [commissionVal, setCV]  = useState("");
  const [rejectPayoutModal, setRPM] = useState<Payout | null>(null);
  const [rejectReason, setRR]   = useState("");
  const [utrModal, setUtrModal] = useState<Payout | null>(null);
  const [utrVal, setUtrVal]     = useState("");

  const load = useCallback(async () => {
    const res  = await fetch(`/api/admin/suppliers/${id}`);
    const json = await res.json();
    setData(json);
    setCV(String((Number(json.supplier?.commissionRate ?? 0.15) * 100).toFixed(1)));
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function updateSupplier(body: Record<string, unknown>) {
    setAL(true);
    await fetch(`/api/admin/suppliers/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    setAL(false);
    load();
  }

  async function updatePayout(payoutId: string, body: Record<string, unknown>) {
    setAL(true);
    await fetch(`/api/admin/payouts/${payoutId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    setAL(false);
    load();
  }

  async function verifyDoc(docId: string, action: "verify" | "reject", rejectReason?: string) {
    setAL(true);
    await fetch(`/api/admin/suppliers/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId, action, rejectReason }),
    });
    setAL(false);
    load();
  }

  async function loadSla(filter = slaFilter) {
    setSlaL(true);
    const res  = await fetch(`/api/admin/suppliers/${id}/sla?filter=${filter}`);
    const data = await res.json();
    setSlaData(data);
    setSlaL(false);
  }

  async function refreshSla() {
    setSlaL(true);
    await fetch(`/api/admin/suppliers/${id}/sla`, { method: "POST" });
    await loadSla();
  }

  async function approveProduct(productId: string, action: "approve" | "reject") {
    setAL(true);
    await fetch("/api/admin/supplier-products", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId, action }),
    });
    setAL(false);
    load();
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
      </div>
    );
  }

  const { supplier, products, payouts, stats } = data;
  const statusColor = STATUS_COLOR[supplier.status] ?? "#9CA3AF";
  const commissionRate = Number(supplier.commissionRate);

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const slaAtRisk   = slaData?.counts?.AT_RISK  ?? 0;
  const slaBreached = slaData?.counts?.BREACHED ?? 0;

  const TABS = [
    { key: "overview",  label: "Overview"  },
    { key: "products",  label: `Products (${products.length})`  },
    { key: "payouts",   label: `Payouts (${payouts.length})`   },
    { key: "docs",      label: `Documents (${supplier.documents.length})` },
    { key: "sla",       label: "SLA", alert: slaBreached > 0 ? slaBreached : slaAtRisk > 0 ? slaAtRisk : 0, alertColor: slaBreached > 0 ? "#F87171" : "#F5C518" },
    { key: "activity",  label: "Activity"  },
  ] as const;

  const pendingProducts = products.filter(p => !p.isActive).length;
  const pendingPayouts  = payouts.filter(p => p.status === "PENDING").length;

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">

      {/* Back */}
      <button
        onClick={() => router.push("/admin/suppliers")}
        className="flex items-center gap-2 text-white/40 hover:text-white mb-6 transition-colors text-[13px]"
      >
        <ArrowLeft className="h-4 w-4" /> All Suppliers
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center text-[22px] font-black shrink-0"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.40)", fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {supplier.companyName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1
                className="text-white font-black"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "26px" }}
              >
                {supplier.companyName}
              </h1>
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                style={{ background: `${statusColor}18`, color: statusColor }}
              >
                {supplier.status}
              </span>
              {supplier.docsVerified && (
                <span
                  className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  style={{ background: "rgba(74,222,128,0.10)", color: "#4ADE80" }}
                >
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
            <p className="text-white/40 text-[13px]">{supplier.user.email} · Joined {fmtDate(supplier.createdAt)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {supplier.status === "PENDING" && (
            <button onClick={() => updateSupplier({ status: "APPROVED" })} disabled={actionLoading}
              className="rounded-xl px-4 py-2 text-[12px] font-bold disabled:opacity-40 transition-all hover:brightness-110"
              style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>
              Approve
            </button>
          )}
          {supplier.status === "APPROVED" && (
            <button onClick={() => setSSM(true)} disabled={actionLoading}
              className="rounded-xl px-4 py-2 text-[12px] font-bold disabled:opacity-40 transition-all hover:brightness-110"
              style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}>
              Suspend
            </button>
          )}
          {supplier.status === "SUSPENDED" && (
            <button onClick={() => updateSupplier({ status: "APPROVED" })} disabled={actionLoading}
              className="rounded-xl px-4 py-2 text-[12px] font-bold disabled:opacity-40 transition-all hover:brightness-110"
              style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>
              Reinstate
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Revenue", value: fmt(stats.totalRevenue), color: "#4ADE80" },
          { label: "Units Sold",    value: stats.totalUnitsSold,    color: "#60A5FA" },
          { label: "Pending Payout", value: fmt(Number(supplier.pendingPayout)), color: "#A78BFA" },
          { label: "Performance Score", value: `${Number(supplier.performanceScore).toFixed(0)}/100`, color: "#F5C518" },
        ].map(card => (
          <div key={card.label} className="rounded-2xl p-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-white/40 text-[11px] mb-1">{card.label}</p>
            <p className="font-black text-[20px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: card.color }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key as typeof tab);
              if (t.key === "sla") loadSla("all");
            }}
            className="relative flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-bold transition-colors"
            style={{ color: tab === t.key ? "#F5C518" : "rgba(255,255,255,0.35)" }}
          >
            {t.label}
            {t.key === "products" && pendingProducts > 0 && (
              <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black" style={{ background: "#F5C518", color: "#0D0D0D" }}>{pendingProducts}</span>
            )}
            {t.key === "payouts" && pendingPayouts > 0 && (
              <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black" style={{ background: "#A78BFA", color: "#fff" }}>{pendingPayouts}</span>
            )}
            {"alert" in t && t.alert > 0 && (
              <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black" style={{ background: t.alertColor, color: "#0D0D0D" }}>{t.alert}</span>
            )}
            {tab === t.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ background: "#F5C518" }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Business info */}
          <div className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-4 w-4 text-[#F5C518]" />
              <h3 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px" }}>Business</h3>
            </div>
            <InfoRow label="GSTIN"           value={supplier.gstin}           />
            <InfoRow label="PAN"             value={supplier.panNumber}       />
            <InfoRow label="Website"         value={supplier.websiteUrl}      link />
            <InfoRow label="Address"         value={supplier.businessAddress} />
            <InfoRow label="Onboarded"       value={supplier.onboardedAt ? fmtDate(supplier.onboardedAt) : "—"} />
          </div>

          {/* Bank + commission */}
          <div className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-4 w-4 text-[#60A5FA]" />
              <h3 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px" }}>Payout Details</h3>
            </div>
            <InfoRow label="Account Name" value={supplier.bankAccountName} />
            <InfoRow label="Account No"   value={supplier.bankAccountNo}   mono />
            <InfoRow label="IFSC"         value={supplier.bankIfsc}         mono />
            <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-[12px] text-white/40">Commission Rate</span>
              {commissionEdit ? (
                <div className="flex items-center gap-1">
                  <input value={commissionVal} onChange={e => setCV(e.target.value)}
                    className="w-14 rounded-lg px-2 py-1 text-[13px] text-white outline-none font-mono"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                  />
                  <span className="text-white/40 text-[12px]">%</span>
                  <button onClick={() => {
                    const rate = parseFloat(commissionVal) / 100;
                    if (!isNaN(rate) && rate >= 0 && rate <= 1) { updateSupplier({ commissionRate: rate }); setCE(false); }
                  }} disabled={actionLoading} className="rounded-lg px-2 py-1 text-[11px] font-bold text-[#4ADE80] hover:bg-white/08 disabled:opacity-40">Save</button>
                  <button onClick={() => setCE(false)} className="text-white/30 text-[11px] hover:text-white">✕</button>
                </div>
              ) : (
                <button onClick={() => setCE(true)} className="font-bold text-[13px] text-white hover:text-[#F5C518] transition-colors">
                  {(commissionRate * 100).toFixed(1)}%
                </button>
              )}
            </div>
          </div>

          {/* Performance */}
          <div className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-[#4ADE80]" />
              <h3 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px" }}>Performance</h3>
            </div>
            <ScoreBar label="Performance Score" value={Number(supplier.performanceScore)} max={100} color="#F5C518" unit="/100" />
            <ScoreBar label="Fulfilment Rate" value={Math.round(Number(supplier.fulfillmentRate) * 100)} max={100} color="#4ADE80" unit="%" />
            <ScoreBar label="Return Rate" value={Math.round(Number(supplier.returnRate) * 100)} max={100} color="#F87171" unit="%" invert />
            <div className="flex items-center justify-between mt-3">
              <span className="text-[12px] text-white/40">Avg Customer Rating</span>
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-[#F5C518] fill-[#F5C518]" />
                <span className="font-black text-[14px] text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {Number(supplier.avgRating).toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-4 w-4 text-[#A78BFA]" />
              <h3 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px" }}>Verification</h3>
            </div>
            <div className="space-y-3">
              <VerificationRow label="Documents" verified={supplier.docsVerified}
                onVerify={() => updateSupplier({ docsVerified: true })}
                onRevoke={() => updateSupplier({ docsVerified: false })}
                loading={actionLoading}
              />
              <VerificationRow label="Agreement"
                verified={!!supplier.agreementUrl}
                note={supplier.agreementUrl ? "Agreement on file" : "Not uploaded yet"}
                readonly
              />
            </div>
            {supplier.suspendReason && (
              <div className="mt-4 rounded-xl px-3 py-2.5" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)" }}>
                <p className="text-[11px] text-white/40 mb-0.5">Suspension reason</p>
                <p className="text-[12px] text-[#F87171]">{supplier.suspendReason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Products ── */}
      {tab === "products" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Package className="h-10 w-10 text-white/15 mb-3" />
              <p className="text-white/40 text-[14px]">No products yet</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {products.map(p => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3">
                  {p.images[0] ? (
                    <img src={p.images[0].url} alt="" className="h-9 w-9 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-9 w-9 rounded-lg shrink-0" style={{ background: "rgba(255,255,255,0.05)" }} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-white/85 truncate">{p.name}</p>
                    <p className="text-[11px] text-white/35">{p.totalSoldCount} sold · ★ {Number(p.avgRating).toFixed(1)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        background: p.isActive ? "rgba(74,222,128,0.10)" : "rgba(245,197,24,0.10)",
                        color:      p.isActive ? "#4ADE80"                : "#F5C518",
                      }}
                    >
                      {p.isActive ? "Active" : "Pending"}
                    </span>
                    {!p.isActive && (
                      <>
                        <button onClick={() => approveProduct(p.id, "approve")} disabled={actionLoading}
                          className="rounded-xl px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 transition-all hover:brightness-110"
                          style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>
                          Approve
                        </button>
                        <button onClick={() => approveProduct(p.id, "reject")} disabled={actionLoading}
                          className="rounded-xl px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 transition-all hover:brightness-110"
                          style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}>
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Payouts ── */}
      {tab === "payouts" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          {payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Wallet className="h-10 w-10 text-white/15 mb-3" />
              <p className="text-white/40 text-[14px]">No payouts yet</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {payouts.map(p => {
                const pColor = { PENDING: "#F5C518", APPROVED: "#60A5FA", PROCESSED: "#4ADE80", REJECTED: "#F87171", FAILED: "#F87171", PROCESSING: "#A78BFA" }[p.status] ?? "#9CA3AF";
                return (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                          style={{ background: `${pColor}18`, color: pColor }}
                        >
                          {p.status}
                        </span>
                        {p.utrNumber && (
                          <span className="text-[11px] text-white/30 font-mono">UTR: {p.utrNumber}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/35">{fmtDate(p.createdAt)}</p>
                      {p.rejectReason && (
                        <p className="text-[11px] text-[#F87171] mt-0.5">{p.rejectReason}</p>
                      )}
                    </div>
                    <p className="font-black text-white text-[17px] shrink-0" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {fmt(Number(p.amount))}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.status === "PENDING" && (
                        <>
                          <button onClick={() => updatePayout(p.id, { action: "approve" })} disabled={actionLoading}
                            className="rounded-xl px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 hover:brightness-110"
                            style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>
                            Approve
                          </button>
                          <button onClick={() => { setRPM(p); setRR(""); }} disabled={actionLoading}
                            className="rounded-xl px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 hover:brightness-110"
                            style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}>
                            Reject
                          </button>
                        </>
                      )}
                      {p.status === "APPROVED" && (
                        <button onClick={() => { setUtrModal(p); setUtrVal(""); }} disabled={actionLoading}
                          className="rounded-xl px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 hover:brightness-110"
                          style={{ background: "rgba(167,139,250,0.12)", color: "#A78BFA" }}>
                          Mark Processed
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Documents ── */}
      {tab === "docs" && (
        <div className="space-y-3">
          {supplier.documents.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-2xl"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <FileText className="h-10 w-10 text-white/15 mb-3" />
              <p className="text-white/40 text-[14px]">No documents uploaded yet</p>
            </div>
          ) : supplier.documents.map(doc => (
            <div key={doc.id} className="flex items-center gap-4 rounded-2xl px-5 py-4"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                style={{ background: doc.isVerified ? "rgba(74,222,128,0.10)" : "rgba(245,197,24,0.10)" }}
              >
                <FileText className="h-4 w-4" style={{ color: doc.isVerified ? "#4ADE80" : "#F5C518" }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white/80">
                  {doc.label ?? doc.type.replace(/_/g, " ")}
                </p>
                <p className="text-[11px] text-white/35">{doc.type.replace(/_/g, " ")} · {fmtDate(doc.uploadedAt)}</p>
                {doc.rejectReason && (
                  <p className="text-[11px] text-[#F87171] mt-0.5">{doc.rejectReason}</p>
                )}
              </div>
              <a
                href={doc.url} target="_blank" rel="noopener noreferrer"
                className="rounded-xl px-3 py-1.5 text-[11px] font-bold text-white/40 hover:text-white hover:bg-white/06 transition-all"
              >
                View ↗
              </a>
              <div className="flex items-center gap-1.5">
                {!doc.isVerified ? (
                  <button onClick={() => verifyDoc(doc.id, "verify")} disabled={actionLoading}
                    className="rounded-xl px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 hover:brightness-110"
                    style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>
                    Verify
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-[#4ADE80] font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SLA ── */}
      {tab === "sla" && (
        <div>
          {/* Header + refresh */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/40 text-[13px]">SLA performance tracking</p>
            <button onClick={refreshSla} disabled={slaLoading}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold text-white/40 hover:text-white hover:bg-white/06 transition-all disabled:opacity-40">
              <RefreshCw className={`h-3.5 w-3.5 ${slaLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {slaLoading && !slaData ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
            </div>
          ) : !slaData ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
              style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Zap className="h-10 w-10 text-white/15 mb-3" />
              <p className="text-white/40 text-[14px]">No SLA data yet</p>
              <p className="text-[12px] text-white/25 mt-1">SLA records are created automatically when orders are placed</p>
            </div>
          ) : (
            <>
              {/* Score + stats strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {[
                  { label: "SLA Score",        value: `${slaData.stats.slaScore.toFixed(0)}/100`,          color: slaData.stats.slaScore >= 80 ? "#4ADE80" : slaData.stats.slaScore >= 50 ? "#F5C518" : "#F87171" },
                  { label: "On-Time",          value: `${slaData.counts.ON_TIME ?? 0}`,                    color: "#4ADE80" },
                  { label: "At Risk",          value: `${slaData.counts.AT_RISK ?? 0}`,                    color: "#F5C518" },
                  { label: "Breached",         value: `${slaData.counts.BREACHED ?? 0}`,                   color: "#F87171" },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl p-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-white/40 text-[11px] mb-1">{s.label}</p>
                    <p className="font-black text-[22px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Avg timings */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Avg Acceptance", value: slaData.stats.avgAcceptanceHrs > 0 ? `${slaData.stats.avgAcceptanceHrs.toFixed(1)}h` : "—", threshold: "SLA: 4h", ok: slaData.stats.avgAcceptanceHrs <= 4 },
                  { label: "Avg Ship Time",  value: slaData.stats.avgShippingHrs   > 0 ? `${slaData.stats.avgShippingHrs.toFixed(1)}h` : "—",   threshold: "SLA: 48h", ok: slaData.stats.avgShippingHrs <= 48 },
                  { label: "Avg Delivery",   value: slaData.stats.avgDeliveryDays  > 0 ? `${slaData.stats.avgDeliveryDays.toFixed(1)}d` : "—",   threshold: "SLA: 7d", ok: slaData.stats.avgDeliveryDays <= 7 },
                ].map(m => (
                  <div key={m.label} className="rounded-2xl p-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-white/40 text-[11px] mb-1">{m.label}</p>
                    <p className="font-black text-[20px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: m.ok ? "#4ADE80" : "#F87171" }}>{m.value}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">{m.threshold}</p>
                  </div>
                ))}
              </div>

              {/* Filter strip */}
              <div className="flex items-center gap-1.5 mb-4">
                {[
                  { key: "all",      label: "All"      },
                  { key: "active",   label: "Active"   },
                  { key: "at_risk",  label: "At Risk"  },
                  { key: "breached", label: "Breached" },
                  { key: "on_time",  label: "On Time"  },
                ].map(f => (
                  <button key={f.key} onClick={() => { setSlaFilter(f.key); loadSla(f.key); }}
                    className="rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all"
                    style={{
                      background: slaFilter === f.key ? "#F5C518" : "rgba(255,255,255,0.06)",
                      color:      slaFilter === f.key ? "#0D0D0D" : "rgba(255,255,255,0.50)",
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Records table */}
              {slaData.records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 rounded-2xl"
                  style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-white/40 text-[13px]">No records for this filter</p>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          {["Order", "Created", "Acceptance", "Shipping", "Delivery", "Overall"].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-bold tracking-wider text-white/30"
                              style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.12em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        {slaData.records.map(r => (
                          <tr key={r.id} className="hover:bg-white/02 transition-colors">
                            <td className="px-4 py-3">
                              <span className="text-[12px] font-mono text-white/70">{r.orderNumber}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[11px] text-white/40">{fmtDate(r.orderCreatedAt)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <SlaCell status={r.acceptanceStatus} minutes={r.acceptanceMinutes} unit="h" divisor={60} slaHrs={r.acceptanceSlaHrs} />
                            </td>
                            <td className="px-4 py-3">
                              <SlaCell status={r.shippingStatus} minutes={r.shippingMinutes} unit="h" divisor={60} slaHrs={r.shippingSlaHrs} />
                            </td>
                            <td className="px-4 py-3">
                              <SlaCell status={r.deliveryStatus} minutes={r.deliveryMinutes} unit="d" divisor={1440} slaHrs={r.deliverySlaHrs} />
                            </td>
                            <td className="px-4 py-3">
                              <SlaStatusBadge status={r.overallStatus} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Activity ── */}
      {tab === "activity" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          {supplier.activityLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <BarChart2 className="h-10 w-10 text-white/15 mb-3" />
              <p className="text-white/40 text-[14px]">No activity yet</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {supplier.activityLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ background: "rgba(245,197,24,0.60)" }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-white/70">{log.detail}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{log.action.replace(/_/g, " ")}</p>
                  </div>
                  <p className="text-[11px] text-white/25 shrink-0">{fmtDate(log.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Suspend modal ── */}
      {showSuspendModal && (
        <Modal onClose={() => setSSM(false)}>
          <h3 className="text-white font-black mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
            Suspend Supplier
          </h3>
          <p className="text-white/50 text-[13px] mb-4">Provide a reason (optional, visible to supplier):</p>
          <textarea value={suspendReason} onChange={e => setSR(e.target.value)} rows={3}
            placeholder="e.g. Policy violation — repeated late dispatches"
            className="w-full rounded-xl px-4 py-3 text-[13px] text-white outline-none resize-none mb-4"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
          />
          <div className="flex gap-3">
            <button onClick={() => setSSM(false)} className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white/40 hover:text-white hover:bg-white/06 transition-all">
              Cancel
            </button>
            <button
              onClick={() => { updateSupplier({ status: "SUSPENDED", suspendReason: suspendReason || undefined }); setSSM(false); }}
              disabled={actionLoading}
              className="flex-1 rounded-xl py-2.5 text-[13px] font-black disabled:opacity-40 transition-all hover:brightness-110"
              style={{ background: "rgba(248,113,113,0.15)", color: "#F87171" }}
            >
              Suspend Account
            </button>
          </div>
        </Modal>
      )}

      {/* ── Reject payout modal ── */}
      {rejectPayoutModal && (
        <Modal onClose={() => setRPM(null)}>
          <h3 className="text-white font-black mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
            Reject Payout — {fmt(Number(rejectPayoutModal.amount))}
          </h3>
          <textarea value={rejectReason} onChange={e => setRR(e.target.value)} rows={3}
            placeholder="Reason for rejection (optional)"
            className="w-full rounded-xl px-4 py-3 text-[13px] text-white outline-none resize-none mb-4"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
          />
          <div className="flex gap-3">
            <button onClick={() => setRPM(null)} className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white/40 hover:text-white hover:bg-white/06">Cancel</button>
            <button
              onClick={() => { updatePayout(rejectPayoutModal.id, { action: "reject", rejectReason }); setRPM(null); }}
              disabled={actionLoading}
              className="flex-1 rounded-xl py-2.5 text-[13px] font-black disabled:opacity-40 hover:brightness-110"
              style={{ background: "rgba(248,113,113,0.15)", color: "#F87171" }}
            >
              Reject Payout
            </button>
          </div>
        </Modal>
      )}

      {/* ── UTR/Process modal ── */}
      {utrModal && (
        <Modal onClose={() => setUtrModal(null)}>
          <h3 className="text-white font-black mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px" }}>
            Mark as Processed — {fmt(Number(utrModal.amount))}
          </h3>
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">UTR / Reference Number *</label>
            <input value={utrVal} onChange={e => setUtrVal(e.target.value)} placeholder="NEFT/IMPS UTR number"
              className="w-full rounded-xl px-4 py-2.5 text-[13px] text-white outline-none font-mono"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setUtrModal(null)} className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white/40 hover:text-white hover:bg-white/06">Cancel</button>
            <button
              onClick={() => { if (utrVal.trim()) { updatePayout(utrModal.id, { action: "process", utrNumber: utrVal.trim() }); setUtrModal(null); } }}
              disabled={actionLoading || !utrVal.trim()}
              className="flex-1 rounded-xl py-2.5 text-[13px] font-black disabled:opacity-40 hover:brightness-110"
              style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Confirm Transfer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────── */
function InfoRow({ label, value, link = false, mono = false }: { label: string; value: string | null | undefined; link?: boolean; mono?: boolean }) {
  if (!value) return (
    <div className="flex justify-between py-1.5">
      <span className="text-[12px] text-white/30">{label}</span>
      <span className="text-[12px] text-white/20">—</span>
    </div>
  );
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-[12px] text-white/40">{label}</span>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#60A5FA] hover:underline max-w-[200px] truncate">{value}</a>
      ) : (
        <span className={`text-[12px] text-white/75 max-w-[200px] truncate ${mono ? "font-mono" : ""}`}>{value}</span>
      )}
    </div>
  );
}

function ScoreBar({ label, value, max, color, unit, invert = false }: {
  label: string; value: number; max: number; color: string; unit: string; invert?: boolean;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const displayColor = invert && value > 10 ? "#F87171" : color;
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-[12px] text-white/40">{label}</span>
        <span className="text-[12px] font-bold" style={{ color: displayColor }}>{value}{unit}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: displayColor }} />
      </div>
    </div>
  );
}

function VerificationRow({ label, verified, onVerify, onRevoke, loading, note, readonly = false }: {
  label: string; verified: boolean; onVerify?: () => void; onRevoke?: () => void; loading?: boolean; note?: string; readonly?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-[13px] font-semibold text-white/70">{label}</p>
        {note && <p className="text-[11px] text-white/30">{note}</p>}
      </div>
      {readonly ? (
        <span className={`text-[11px] font-bold ${verified ? "text-[#4ADE80]" : "text-white/25"}`}>
          {verified ? "✓ On file" : "Not uploaded"}
        </span>
      ) : (
        <div className="flex items-center gap-2">
          {verified ? (
            <>
              <span className="flex items-center gap-1 text-[11px] text-[#4ADE80] font-bold"><CheckCircle2 className="h-3.5 w-3.5" /> Verified</span>
              <button onClick={onRevoke} disabled={loading} className="text-[11px] text-white/25 hover:text-[#F87171] transition-colors disabled:opacity-40">Revoke</button>
            </>
          ) : (
            <button onClick={onVerify} disabled={loading}
              className="rounded-xl px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 hover:brightness-110"
              style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>
              Mark Verified
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#1C1C1C", border: "1px solid rgba(255,255,255,0.10)" }}>
        {children}
      </div>
    </div>
  );
}

const SLA_STATUS_COLOR: Record<string, string> = {
  ON_TIME:        "#4ADE80",
  AT_RISK:        "#F5C518",
  BREACHED:       "#F87171",
  NOT_APPLICABLE: "rgba(255,255,255,0.20)",
};

function SlaStatusBadge({ status }: { status: string }) {
  const color = SLA_STATUS_COLOR[status] ?? "#9CA3AF";
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ background: `${color}18`, color }}>
      {status.replace("_", " ")}
    </span>
  );
}

function SlaCell({
  status, minutes, unit, divisor, slaHrs,
}: {
  status: string; minutes: number | null; unit: string; divisor: number; slaHrs: number;
}) {
  const color = SLA_STATUS_COLOR[status] ?? "#9CA3AF";
  if (minutes === null || status === "NOT_APPLICABLE") {
    return <span className="text-[11px] text-white/20">—</span>;
  }
  const value = (minutes / divisor).toFixed(1);
  const slaLabel = unit === "d" ? `${(slaHrs / 24).toFixed(0)}d` : `${slaHrs}h`;
  return (
    <div>
      <span className="text-[12px] font-bold" style={{ color }}>{value}{unit}</span>
      <span className="text-[10px] text-white/25 ml-1">/{slaLabel}</span>
    </div>
  );
}
