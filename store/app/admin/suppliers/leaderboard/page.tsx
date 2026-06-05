"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy, Zap, TrendingDown, Star, Crown, Medal,
  Award, RefreshCw, Package, ShoppingBag, IndianRupee,
} from "lucide-react";

const TIER_COLOR: Record<string, string> = {
  PLATINUM: "#E8D5B7",
  GOLD:     "#F5C518",
  SILVER:   "#9CA3AF",
  BRONZE:   "#CD7C3A",
};
const TIER_ICON: Record<string, React.ElementType> = {
  PLATINUM: Crown,
  GOLD:     Trophy,
  SILVER:   Medal,
  BRONZE:   Award,
};

type SupplierRow = {
  id: string; companyName: string; slug: string | null; tier: string; logoUrl: string | null;
  totalSales?: number; totalOrders?: number; performanceScore?: number; avgRating?: number;
  avgShippingHrs?: number; avgDeliveryDays?: number; slaScore?: number;
  returnRate?: number; cancellationRate?: number; fulfillmentRate?: number; qualityScore?: number;
  user: { name: string | null; email: string | null };
};

type TierCount = { tier: string; _count: { id: number }; _sum: { totalSales: number | null } };

type Marketplace = {
  totalApprovedSuppliers: number; avgPerformanceScore: string; avgRating: string;
  totalGMV: number; totalOrders: number; avgFulfillmentRate: number; avgReturnRate: number;
  slaBreakdown: Record<string, number>;
};

type Data = {
  leaderboards: {
    topRevenue: SupplierRow[]; fastestShipping: SupplierRow[];
    lowestReturn: SupplierRow[]; highestRating: SupplierRow[]; slaChampions: SupplierRow[];
  };
  tierBreakdown: TierCount[];
  recentlyOnboarded: (SupplierRow & { onboardedAt: string })[];
  marketplace: Marketplace;
};

const TABS = [
  { key: "topRevenue",     label: "Top Revenue",    icon: IndianRupee  },
  { key: "fastestShipping",label: "Fastest",         icon: Zap          },
  { key: "lowestReturn",   label: "Best Quality",    icon: TrendingDown },
  { key: "highestRating",  label: "Top Rated",       icon: Star         },
  { key: "slaChampions",   label: "SLA Champions",   icon: Trophy       },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function SupplierLeaderboardPage() {
  const [data, setData]       = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<TabKey>("topRevenue");
  const [recomputing, setRC]  = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/suppliers/leaderboard");
    setData(await res.json());
    setLoading(false);
  }

  async function recompute() {
    setRC(true);
    await fetch("/api/admin/suppliers/score-engine", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({}),
    });
    setRC(false);
    load();
  }

  useEffect(() => { load(); }, []);

  const fmt = (n: number) =>
    n >= 1_00_00_000 ? `₹${(n / 1_00_00_000).toFixed(1)}Cr`
    : n >= 1_00_000  ? `₹${(n / 1_00_000).toFixed(1)}L`
    : `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
      </div>
    );
  }

  const { leaderboards, tierBreakdown, marketplace, recentlyOnboarded } = data;
  const rows = leaderboards[tab] as SupplierRow[];

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Supplier Leaderboard
          </h1>
          <p className="text-white/40 text-[13px] mt-0.5">
            {marketplace.totalApprovedSuppliers} active suppliers · GMV {fmt(marketplace.totalGMV)}
          </p>
        </div>
        <button
          onClick={recompute}
          disabled={recomputing}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold text-white/50 hover:text-white hover:bg-white/06 transition-all disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${recomputing ? "animate-spin" : ""}`} />
          Recompute Scores
        </button>
      </div>

      {/* Marketplace health row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Avg Performance", value: `${marketplace.avgPerformanceScore}/100`, color: "#F5C518" },
          { label: "Avg Rating",      value: `★ ${marketplace.avgRating}`,             color: "#4ADE80" },
          { label: "Avg Fulfillment", value: `${(marketplace.avgFulfillmentRate * 100).toFixed(1)}%`, color: "#60A5FA" },
          { label: "Avg Return Rate", value: `${(marketplace.avgReturnRate * 100).toFixed(1)}%`,      color: "#F87171" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-white/40 text-[11px] mb-1">{s.label}</p>
            <p className="font-black text-[22px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tier breakdown */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {["PLATINUM", "GOLD", "SILVER", "BRONZE"].map(tier => {
          const found = tierBreakdown.find(t => t.tier === tier);
          const Icon  = TIER_ICON[tier];
          const color = TIER_COLOR[tier];
          return (
            <div key={tier} className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: "#1A1A1A", border: `1px solid ${color}25` }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                style={{ background: `${color}18` }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color, fontFamily: "'Barlow Condensed', sans-serif" }}>{tier}</p>
                <p className="font-black text-[24px] text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {found?._count?.id ?? 0}
                </p>
                <p className="text-[10px] text-white/30">
                  {found?._sum?.totalSales ? fmt(Number(found._sum.totalSales)) : "—"} GMV
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="relative flex items-center gap-2 px-4 py-2.5 text-[12px] font-bold transition-colors"
              style={{ color: tab === t.key ? "#F5C518" : "rgba(255,255,255,0.35)" }}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {tab === t.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ background: "#F5C518" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Leaderboard table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Trophy className="h-10 w-10 text-white/15 mb-3" />
            <p className="text-white/40 text-[14px]">No data yet — run Recompute Scores first</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {rows.map((s, i) => {
              const TierIcon = TIER_ICON[s.tier];
              const tierColor = TIER_COLOR[s.tier];
              const rank = i + 1;
              const rankColor = rank === 1 ? "#F5C518" : rank === 2 ? "#9CA3AF" : rank === 3 ? "#CD7C3A" : "rgba(255,255,255,0.25)";

              return (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/02 transition-colors">
                  {/* Rank */}
                  <span
                    className="w-7 text-center font-black text-[18px] shrink-0"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", color: rankColor }}
                  >
                    {rank <= 3 ? ["🥇","🥈","🥉"][rank - 1] : rank}
                  </span>

                  {/* Supplier */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {s.logoUrl ? (
                      <img src={s.logoUrl} alt="" className="h-9 w-9 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="h-9 w-9 rounded-xl shrink-0 flex items-center justify-center text-[14px] font-black"
                        style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.40)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {s.companyName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link href={`/admin/suppliers/${s.id}`}
                        className="text-[13px] font-semibold text-white/85 hover:text-white transition-colors truncate block">
                        {s.companyName}
                      </Link>
                      <p className="text-[11px] text-white/30">{s.user.email}</p>
                    </div>
                  </div>

                  {/* Tier badge */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <TierIcon className="h-3.5 w-3.5" style={{ color: tierColor }} />
                    <span className="text-[11px] font-bold" style={{ color: tierColor, fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {s.tier}
                    </span>
                  </div>

                  {/* Metric columns — vary by tab */}
                  {tab === "topRevenue" && (
                    <div className="flex items-center gap-8 shrink-0">
                      <div className="text-right">
                        <p className="font-black text-white text-[17px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {fmt(Number(s.totalSales ?? 0))}
                        </p>
                        <p className="text-[10px] text-white/30">GMV</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-white text-[15px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {s.totalOrders ?? 0}
                        </p>
                        <p className="text-[10px] text-white/30">orders</p>
                      </div>
                    </div>
                  )}
                  {tab === "fastestShipping" && (
                    <div className="flex items-center gap-8 shrink-0">
                      <div className="text-right">
                        <p className="font-black text-[#4ADE80] text-[17px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {Number(s.avgShippingHrs ?? 0).toFixed(1)}h
                        </p>
                        <p className="text-[10px] text-white/30">avg ship time</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-white text-[15px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {Number(s.avgDeliveryDays ?? 0).toFixed(1)}d
                        </p>
                        <p className="text-[10px] text-white/30">avg delivery</p>
                      </div>
                    </div>
                  )}
                  {tab === "lowestReturn" && (
                    <div className="flex items-center gap-8 shrink-0">
                      <div className="text-right">
                        <p className="font-black text-[#4ADE80] text-[17px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {(Number(s.returnRate ?? 0) * 100).toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-white/30">return rate</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-white text-[15px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {(Number(s.fulfillmentRate ?? 0) * 100).toFixed(0)}%
                        </p>
                        <p className="text-[10px] text-white/30">fulfillment</p>
                      </div>
                    </div>
                  )}
                  {tab === "highestRating" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Star className="h-4 w-4 text-[#F5C518] fill-[#F5C518]" />
                      <span className="font-black text-white text-[19px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {Number(s.avgRating ?? 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {tab === "slaChampions" && (
                    <div className="flex items-center gap-8 shrink-0">
                      <div className="text-right">
                        <p className="font-black text-[#4ADE80] text-[17px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {Number(s.slaScore ?? 0).toFixed(1)}/100
                        </p>
                        <p className="text-[10px] text-white/30">SLA score</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recently onboarded */}
      {recentlyOnboarded.length > 0 && (
        <div className="mt-8">
          <h2 className="text-white font-black mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px" }}>
            Recently Onboarded
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            {recentlyOnboarded.map(s => (
              <Link key={s.id} href={`/admin/suppliers/${s.id}`}
                className="flex flex-col gap-2 rounded-2xl p-4 hover:brightness-110 transition-all"
                style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                  {s.logoUrl ? (
                    <img src={s.logoUrl} alt="" className="h-7 w-7 rounded-lg object-cover" />
                  ) : (
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center text-[12px] font-black"
                      style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.40)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {s.companyName.charAt(0)}
                    </div>
                  )}
                  <p className="text-[12px] font-semibold text-white/80 truncate">{s.companyName}</p>
                </div>
                <p className="text-[10px] text-white/30">
                  {s.onboardedAt ? new Date(s.onboardedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
