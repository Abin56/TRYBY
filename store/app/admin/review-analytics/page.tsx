"use client";

import { useEffect, useState } from "react";
import { Star, TrendingUp, TrendingDown, Package, AlertTriangle, BadgeCheck, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

type Overview = {
  total: number; pending: number; approved: number; rejected: number;
  avgRating: string; verifiedPct: string; withImagesPct: string;
  conversionRate: string; last30Days: number; noReviewProducts: number;
};

type Product = {
  id: string; name: string; slug: string; avgRating: number; reviewCount: number;
  images: { url: string }[];
};

type DailyData = { date: string; count: number };

type Data = {
  overview:           Overview;
  ratingBreakdown:    Record<string, number>;
  statusBreakdown:    Record<string, number>;
  poorRatingProducts: Product[];
  topReviewedProducts: Product[];
  dailyData:          DailyData[];
};

export default function ReviewAnalyticsPage() {
  const [data, setData]       = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/review-analytics")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5C518] border-t-transparent" />
      </div>
    );
  }

  const { overview, ratingBreakdown, poorRatingProducts, topReviewedProducts, dailyData } = data;
  const maxDaily = Math.max(...dailyData.map(d => d.count), 1);

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            Review Analytics
          </h1>
          <p className="text-white/40 text-[13px] mt-0.5">Trust signal overview</p>
        </div>
        <Link href="/admin/reviews"
          className="flex items-center gap-2 rounded-xl px-4 py-2 font-black text-[12px] hover:brightness-110 transition-all"
          style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}>
          Moderate Reviews
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Avg Rating",       value: `★ ${overview.avgRating}`, color: "#F5C518",  icon: Star },
          { label: "Total Reviews",    value: overview.approved,          color: "#4ADE80",  icon: TrendingUp },
          { label: "Pending Review",   value: overview.pending,           color: "#F5C518",  icon: AlertTriangle },
          { label: "Review Conversion",value: `${overview.conversionRate}%`, color: "#60A5FA", icon: TrendingUp },
        ].map(card => (
          <div key={card.label} className="rounded-2xl p-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl mb-3" style={{ background: `${card.color}18` }}>
              <card.icon className="h-4 w-4" style={{ color: card.color }} />
            </div>
            <p className="font-black text-[24px] text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: card.color }}>
              {card.value}
            </p>
            <p className="text-[11px] text-white/40">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Verified %",     value: `${overview.verifiedPct}%`,    color: "#4ADE80", icon: BadgeCheck },
          { label: "With Photos %",  value: `${overview.withImagesPct}%`,  color: "#A78BFA", icon: ImageIcon },
          { label: "Last 30 Days",   value: overview.last30Days,           color: "#60A5FA", icon: TrendingUp },
          { label: "No Reviews",     value: overview.noReviewProducts,     color: "#F87171", icon: Package },
        ].map(card => (
          <div key={card.label} className="rounded-2xl p-4" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg mb-2" style={{ background: `${card.color}15` }}>
              <card.icon className="h-3.5 w-3.5" style={{ color: card.color }} />
            </div>
            <p className="font-black text-[20px] text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{card.value}</p>
            <p className="text-[11px] text-white/40">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Daily volume chart */}
      {dailyData.length > 0 && (
        <div className="rounded-2xl p-5 mb-6" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-white font-black mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px" }}>
            Review Volume — Last 30 Days
          </h2>
          <div className="flex items-end gap-1 h-24">
            {dailyData.map(d => (
              <div key={d.date} className="flex-1 flex flex-col items-center group relative">
                <div
                  className="w-full rounded-t transition-all"
                  style={{ height: `${Math.max(4, (d.count / maxDaily) * 100)}%`, background: "rgba(245,197,24,0.60)", minHeight: "4px" }}
                />
                <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 bg-black/90 rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap pointer-events-none">
                  {d.date}<br />{d.count} review{d.count !== 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating distribution + poor products */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">

        {/* Rating distribution */}
        <div className="rounded-2xl p-5" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-white font-black mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px" }}>
            Rating Distribution
          </h2>
          <div className="space-y-2">
            {[5,4,3,2,1].map(s => {
              const count  = ratingBreakdown[String(s)] ?? 0;
              const total  = Object.values(ratingBreakdown).reduce((a, b) => a + b, 0);
              const pct    = total > 0 ? (count / total) * 100 : 0;
              const color  = s >= 4 ? "#4ADE80" : s === 3 ? "#F5C518" : "#F87171";
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5 w-16 shrink-0">
                    <span className="text-[12px] text-white/50">{s}</span>
                    <Star className="h-3 w-3 text-[#F5C518] fill-[#F5C518]" />
                  </div>
                  <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="text-[11px] text-white/50 w-8 text-right shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Poor rating products */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <TrendingDown className="h-4 w-4 text-[#F87171]" />
            <h2 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px" }}>
              Poor Rating Products
            </h2>
          </div>
          {poorRatingProducts.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <p className="text-white/30 text-[13px]">No products below 3.0 ★</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {poorRatingProducts.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  {p.images[0] ? (
                    <img src={p.images[0].url} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-8 w-8 rounded-lg shrink-0" style={{ background: "rgba(255,255,255,0.05)" }} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-white/80 truncate">{p.name}</p>
                    <p className="text-[10px] text-white/35">{p.reviewCount} reviews</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="h-3 w-3 text-[#F87171] fill-[#F87171]" />
                    <span className="text-[12px] font-bold text-[#F87171]">{Number(p.avgRating).toFixed(1)}</span>
                  </div>
                  <Link href={`/products/${p.slug}`} target="_blank"
                    className="text-[11px] text-white/25 hover:text-white transition-colors">↗</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top reviewed products */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h2 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px" }}>
            Most Reviewed Products
          </h2>
        </div>
        {topReviewedProducts.length === 0 ? (
          <p className="px-5 py-6 text-white/30 text-[13px]">No reviews yet</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {topReviewedProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-[14px] font-black text-white/20 w-5 shrink-0"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{i + 1}</span>
                {p.images[0] ? (
                  <img src={p.images[0].url} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="h-8 w-8 rounded-lg shrink-0" style={{ background: "rgba(255,255,255,0.05)" }} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-white/80 truncate">{p.name}</p>
                  <p className="text-[10px] text-white/35">{p.reviewCount} reviews</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="h-3 w-3 text-[#F5C518] fill-[#F5C518]" />
                  <span className="text-[12px] font-bold text-white">{Number(p.avgRating).toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
