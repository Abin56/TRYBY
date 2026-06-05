"use client";

import { useEffect, useState } from "react";
import {
  Package, ShoppingBag, Wallet, TrendingUp, ArrowUpRight, Clock,
  CheckCircle2, AlertTriangle, Zap, RotateCcw, AlertCircle,
  Truck, FileText, IndianRupee,
} from "lucide-react";
import Link from "next/link";

type Stats = {
  activeProducts: number;
  pendingProducts: number;
  pendingPayouts: number;
  totalOrders: number;
  totalRevenue: number;
  todayOrders?: number;
  pendingOrders?: number;
  lowStockCount?: number;
  totalReturns?: number;
  unreadNotifications?: number;
};

type SupplierData = {
  supplier: {
    id: string;
    companyName: string;
    status: "PENDING" | "APPROVED" | "SUSPENDED";
    commissionRate: number;
    totalSales: number;
    pendingPayout: number;
    onboardedAt: string | null;
    tier: string;
    performanceScore: number;
    user: { name: string | null; email: string | null; image: string | null };
  };
  stats: Stats;
};

type SlaWidget = {
  slaScore: number; onTimePct: number;
  active: number; atRisk: number; breached: number; onTime: number; total: number;
  avgShippingHrs: number; avgDeliveryDays: number;
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "#F5C518",
  APPROVED:  "#4ADE80",
  SUSPENDED: "#F87171",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Pending Approval",
  APPROVED:  "Approved",
  SUSPENDED: "Suspended",
};

const TIER_COLOR: Record<string, string> = {
  PLATINUM: "#E8D5B7", GOLD: "#F5C518", SILVER: "#9CA3AF", BRONZE: "#CD7C3A",
};

export default function SupplierDashboardPage() {
  const [data, setData]       = useState<SupplierData | null>(null);
  const [sla, setSla]         = useState<SlaWidget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/supplier/me").then(r => r.json()),
      fetch("/api/supplier/sla").then(r => r.json()).catch(() => null),
    ]).then(([me, slaData]) => {
      setData(me);
      setSla(slaData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
      </div>
    );
  }

  if (!data?.supplier) {
    return (
      <div className="p-8 text-white/50 text-center">
        <p>Supplier profile not found. Please contact support.</p>
      </div>
    );
  }

  const { supplier, stats } = data;
  const commissionRate = Number(supplier.commissionRate);
  const supplierEarnings = Number(supplier.totalSales) * (1 - commissionRate);

  const CARDS = [
    {
      label: "Today's Orders",
      value: stats.todayOrders ?? 0,
      icon:  ShoppingBag,
      color: "#F5C518",
      href:  "/supplier/orders?status=PENDING",
      sub:   stats.pendingOrders ? `${stats.pendingOrders} need action` : "All caught up",
      alert: (stats.pendingOrders ?? 0) > 0,
    },
    {
      label: "Active Products",
      value: stats.activeProducts,
      icon:  Package,
      color: "#60A5FA",
      href:  "/supplier/products",
      sub:   stats.pendingProducts > 0 ? `${stats.pendingProducts} pending approval` : "All approved",
      alert: false,
    },
    {
      label: "Your Earnings",
      value: `₹${supplierEarnings.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      icon:  TrendingUp,
      color: "#4ADE80",
      href:  "/supplier/analytics",
      sub:   `${((1 - commissionRate) * 100).toFixed(0)}% of gross sales`,
      alert: false,
    },
    {
      label: "Pending Payout",
      value: `₹${Number(supplier.pendingPayout).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      icon:  Wallet,
      color: "#A78BFA",
      href:  "/supplier/payouts",
      sub:   stats.pendingPayouts > 0 ? `${stats.pendingPayouts} request(s) submitted` : "Request a payout",
      alert: false,
    },
    {
      label: "Returns",
      value: stats.totalReturns ?? 0,
      icon:  RotateCcw,
      color: "#FB923C",
      href:  "/supplier/returns",
      sub:   "Customer return requests",
      alert: (stats.totalReturns ?? 0) > 0,
    },
    {
      label: "Low Stock",
      value: stats.lowStockCount ?? 0,
      icon:  AlertCircle,
      color: stats.lowStockCount ? "#F87171" : "#9CA3AF",
      href:  "/supplier/products",
      sub:   stats.lowStockCount ? `${stats.lowStockCount} variant(s) need restocking` : "Stock levels OK",
      alert: (stats.lowStockCount ?? 0) > 0,
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1
            className="text-white font-black"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}
          >
            Dashboard
          </h1>
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
            style={{ background: `${STATUS_COLOR[supplier.status]}18`, color: STATUS_COLOR[supplier.status] }}
          >
            {STATUS_LABEL[supplier.status]}
          </span>
          {supplier.tier && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              style={{ background: `${TIER_COLOR[supplier.tier] ?? "#CD7C3A"}15`, color: TIER_COLOR[supplier.tier] ?? "#CD7C3A" }}
            >
              {supplier.tier}
            </span>
          )}
        </div>
        <p className="text-white/40 text-[13px]">
          Welcome back, {supplier.user.name ?? "Supplier"}. Here&apos;s your store overview.
        </p>
      </div>

      {/* Approval notice */}
      {supplier.status === "PENDING" && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4 mb-6"
          style={{ background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.20)" }}
        >
          <Clock className="h-5 w-5 text-[#F5C518] mt-0.5 shrink-0" />
          <div>
            <p className="text-[14px] font-bold text-[#F5C518]">Awaiting admin approval</p>
            <p className="text-[13px] text-white/50 mt-0.5">
              Your supplier account is under review. You&apos;ll be notified once approved. Some features are limited until then.
            </p>
          </div>
        </div>
      )}

      {supplier.status === "SUSPENDED" && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4 mb-6"
          style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.20)" }}
        >
          <AlertTriangle className="h-5 w-5 text-[#F87171] mt-0.5 shrink-0" />
          <div>
            <p className="text-[14px] font-bold text-[#F87171]">Account suspended</p>
            <p className="text-[13px] text-white/50 mt-0.5">
              Your account has been suspended. Please contact TRYBY support for more information.
            </p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {CARDS.map(card => (
          <Link
            key={card.label}
            href={card.href}
            className="flex flex-col gap-3 rounded-2xl p-4 transition-all duration-150 hover:brightness-110 group"
            style={{
              background: "#1A1A1A",
              border: card.alert ? `1px solid ${card.color}30` : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: `${card.color}18` }}
              >
                <card.icon className="h-4 w-4" style={{ color: card.color }} />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
            </div>
            <div>
              <p
                className="text-white font-black leading-none mb-1"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px" }}
              >
                {card.value}
              </p>
              <p className="text-white/40 text-[11px] font-medium">{card.label}</p>
            </div>
            <p className="text-[11px]" style={{ color: card.color }}>{card.sub}</p>
          </Link>
        ))}
      </div>

      {/* SLA widget — only shown for approved suppliers with SLA data */}
      {supplier.status === "APPROVED" && sla && sla.total > 0 && (
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#60A5FA]" />
              <h2 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px" }}>
                SLA Performance
              </h2>
            </div>
            <Link href="/supplier/orders"
              className="flex items-center gap-1 text-[11px] text-white/35 hover:text-white transition-colors">
              View orders <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Score bar */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative flex-1">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-white/40">SLA Score</span>
                <span className="font-bold" style={{ color: sla.slaScore >= 80 ? "#4ADE80" : sla.slaScore >= 50 ? "#F5C518" : "#F87171" }}>
                  {sla.slaScore.toFixed(0)}/100
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${sla.slaScore}%`,
                    background: sla.slaScore >= 80 ? "#4ADE80" : sla.slaScore >= 50 ? "#F5C518" : "#F87171",
                  }}
                />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-black text-[24px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: sla.onTimePct >= 80 ? "#4ADE80" : "#F5C518" }}>
                {sla.onTimePct}%
              </p>
              <p className="text-[10px] text-white/30">On-time</p>
            </div>
          </div>

          {/* Status chips */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Active",   value: sla.active,   color: "#60A5FA" },
              { label: "On Time",  value: sla.onTime,   color: "#4ADE80" },
              { label: "At Risk",  value: sla.atRisk,   color: "#F5C518" },
              { label: "Breached", value: sla.breached, color: "#F87171" },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-2.5 text-center"
                style={{ background: `${s.color}0D`, border: `1px solid ${s.color}20` }}>
                <p className="font-black text-[18px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: s.color }}>{s.value}</p>
                <p className="text-[10px] text-white/40">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Avg timings */}
          {(sla.avgShippingHrs > 0 || sla.avgDeliveryDays > 0) && (
            <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              {sla.avgShippingHrs > 0 && (
                <div>
                  <p className="text-[10px] text-white/30">Avg ship time</p>
                  <p className="text-[13px] font-bold" style={{ color: sla.avgShippingHrs <= 48 ? "#4ADE80" : "#F87171" }}>
                    {sla.avgShippingHrs.toFixed(1)}h
                    <span className="text-[10px] text-white/25 font-normal ml-1">(SLA: 48h)</span>
                  </p>
                </div>
              )}
              {sla.avgDeliveryDays > 0 && (
                <div>
                  <p className="text-[10px] text-white/30">Avg delivery</p>
                  <p className="text-[13px] font-bold" style={{ color: sla.avgDeliveryDays <= 7 ? "#4ADE80" : "#F87171" }}>
                    {sla.avgDeliveryDays.toFixed(1)}d
                    <span className="text-[10px] text-white/25 font-normal ml-1">(SLA: 7d)</span>
                  </p>
                </div>
              )}
              {sla.breached > 0 && (
                <div className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                  style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.20)" }}>
                  <AlertTriangle className="h-3.5 w-3.5 text-[#F87171]" />
                  <span className="text-[11px] text-[#F87171] font-bold">{sla.breached} breached</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Commission info + Quick links */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Commission details */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h2
            className="text-white font-black mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", letterSpacing: "0.03em" }}
          >
            Commission Structure
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-[13px]">Platform commission</span>
              <span className="text-[#F87171] font-bold text-[14px]">{(commissionRate * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-[13px]">Your share</span>
              <span className="text-[#4ADE80] font-bold text-[14px]">{((1 - commissionRate) * 100).toFixed(1)}%</span>
            </div>
            <div
              className="rounded-xl p-3 mt-2"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <p className="text-[12px] text-white/35">
                For every ₹100 sale, you earn ₹{((1 - commissionRate) * 100).toFixed(0)} and TRYBY earns ₹{(commissionRate * 100).toFixed(0)}.
                Commission rates are set by TRYBY admin and may change.
              </p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h2
            className="text-white font-black mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", letterSpacing: "0.03em" }}
          >
            Quick Actions
          </h2>
          <div className="space-y-2">
            {[
              { href: "/supplier/products",    label: "Add a new product",    icon: Package,     color: "#F5C518" },
              { href: "/supplier/orders",      label: "Manage orders",        icon: ShoppingBag, color: "#60A5FA" },
              { href: "/supplier/shipping",    label: "Update shipments",     icon: Truck,       color: "#4ADE80" },
              { href: "/supplier/returns",     label: "View returns",         icon: RotateCcw,   color: "#FB923C" },
              { href: "/supplier/settlements", label: "Settlement center",    icon: IndianRupee, color: "#A78BFA" },
              { href: "/supplier/documents",   label: "Upload documents",     icon: FileText,    color: "#38BDF8" },
              { href: "/supplier/payouts",     label: "Request a payout",     icon: Wallet,      color: "#A78BFA" },
            ].map(action => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-white/60 hover:text-white hover:bg-white/05 transition-all"
              >
                <action.icon className="h-4 w-4 shrink-0" style={{ color: action.color }} />
                <span className="text-[13px] font-medium">{action.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5 ml-auto text-white/20" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
