"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  RefreshCw, CheckCircle, XCircle, AlertCircle,
  Package, Boxes, Store, Home, Search, Globe,
  TrendingUp, ShoppingBag, Rocket,
} from "lucide-react";

interface CatalogHealth {
  overallScore: number;
  checkedAt: string;
  productHealth:     { score: number; totalActive: number; missingImage: number; missingMetaTitle: number; missingMetaDesc: number; shortDescription: number; missingCostPrice: number; missingVariants: number; missingSupplier: number };
  inventoryHealth:   { score: number; totalVariants: number; outOfStock: number; lowStock: number; noWarehouseStock: number; oosRate: number };
  supplierHealth:    { score: number; total: number; approved: number; pending: number };
  homepageReadiness: { score: number; heroPublished: boolean; publishedBlocks: number; featuredProducts: number; homepageProducts: number };
  seoReadiness:      { score: number; productsWithSeo: number; totalProducts: number; categoriesWithSeo: number; totalCategories: number; siteSettingsConfigured: boolean; seoCompletionPct: number };
  content:           { categories: number; media: number; announcements: number };
  commerce:          { totalOrders: number; pendingOrders: number; totalRevenue: number };
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const color = score >= 80 ? "#4ADE80" : score >= 60 ? "#F5C518" : "#F87171";
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={8} stroke="rgba(255,255,255,0.08)" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={8} stroke={color}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }} />
    </svg>
  );
}

function ScoreCard({ title, score, icon: Icon, items, href }: {
  title: string; score: number; icon: React.ElementType;
  items: { label: string; ok: boolean; warn?: boolean }[];
  href?: string;
}) {
  const color = score >= 80 ? "#4ADE80" : score >= 60 ? "#F5C518" : "#F87171";
  const card = (
    <div className="rounded-2xl p-5 hover:bg-white/[0.02] transition-all group"
      style={{ background: "#1A1A1A", border: `1px solid ${score >= 80 ? "rgba(74,222,128,0.15)" : score >= 60 ? "rgba(245,197,24,0.15)" : "rgba(248,113,113,0.15)"}` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
            <Icon className="h-4.5 w-4.5" style={{ color }} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white">{title}</p>
            <p className="text-[10px] text-white/35">
              {score >= 80 ? "Healthy" : score >= 60 ? "Needs attention" : "Critical issues"}
            </p>
          </div>
        </div>
        <div className="relative">
          <ScoreRing score={score} size={56} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[13px] font-black" style={{ color, fontFamily: "'Barlow Condensed', sans-serif" }}>{score}</span>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            {item.ok
              ? <CheckCircle className="h-3 w-3 text-[#4ADE80] shrink-0" />
              : item.warn
                ? <AlertCircle className="h-3 w-3 text-[#F5C518] shrink-0" />
                : <XCircle className="h-3 w-3 text-[#F87171] shrink-0" />
            }
            <span className="text-[11px] text-white/55">{item.label}</span>
          </div>
        ))}
      </div>
      {href && <p className="text-[10px] text-white/25 mt-3 group-hover:text-[#F5C518] transition-colors">View details →</p>}
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export default function CatalogCenterPage() {
  const [data, setData]     = useState<CatalogHealth | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/catalog/health");
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
      <RefreshCw className="h-8 w-8 animate-spin text-white/20 mb-3" />
      <p className="text-white/30 text-[13px]">Scanning catalog…</p>
    </div>
  );

  if (!data) return <div className="p-8 text-white/40 text-[14px]">Failed to load catalog health.</div>;

  const { productHealth: ph, inventoryHealth: ih, supplierHealth: sh, homepageReadiness: hp, seoReadiness: seo } = data;

  const overallColor = data.overallScore >= 80 ? "#4ADE80" : data.overallScore >= 60 ? "#F5C518" : "#F87171";

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-white font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", letterSpacing: "-0.01em" }}>
            Catalog Intelligence Center
          </h1>
          <p className="text-white/40 text-[13px]">
            Last scanned: {new Date(data.checkedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-semibold text-white/60 hover:text-white transition-all"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          <RefreshCw className="h-3.5 w-3.5" /> Rescan
        </button>
      </div>

      {/* Overall score hero */}
      <div className="rounded-2xl p-6 mb-6 flex items-center gap-8"
        style={{ background: "#1A1A1A", border: `2px solid ${overallColor}25` }}>
        <div className="relative shrink-0">
          <ScoreRing score={data.overallScore} size={110} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[32px] font-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: overallColor }}>
              {data.overallScore}
            </span>
            <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Overall</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-[20px] mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            {data.overallScore >= 80 ? "Store is catalog-ready" : data.overallScore >= 60 ? "Catalog needs improvements" : "Critical catalog issues"}
          </p>
          <p className="text-white/40 text-[13px] mb-4">
            {data.commerce.totalOrders} orders · ₹{data.commerce.totalRevenue.toLocaleString("en-IN")} revenue · {ph.totalActive} active products
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/admin/products/health",      label: "Fix Product Issues" },
              { href: "/admin/inventory",             label: "Check Inventory" },
              { href: "/admin/catalog-center/merchandising", label: "Manage Homepage" },
              { href: "/admin/system/launch-checklist", label: "Launch Checklist" },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                className="h-8 px-3 rounded-xl text-[11px] font-semibold text-white/60 hover:text-white transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Score grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <ScoreCard
          title="Product Health"
          score={ph.score}
          icon={Package}
          href="/admin/products/health"
          items={[
            { label: `${ph.totalActive} active products`,         ok: ph.totalActive >= 5 },
            { label: `${ph.missingImage} missing images`,         ok: ph.missingImage === 0, warn: ph.missingImage <= 3 },
            { label: `${ph.missingMetaTitle} missing SEO title`,  ok: ph.missingMetaTitle === 0, warn: ph.missingMetaTitle <= 5 },
            { label: `${ph.missingCostPrice} no cost price`,      ok: ph.missingCostPrice === 0, warn: ph.missingCostPrice <= 5 },
            { label: `${ph.missingVariants} no variants`,         ok: ph.missingVariants === 0 },
          ]}
        />

        <ScoreCard
          title="Inventory Health"
          score={ih.score}
          icon={Boxes}
          href="/admin/inventory"
          items={[
            { label: `${ih.totalVariants} total variants`,        ok: ih.totalVariants >= 1 },
            { label: `${ih.outOfStock} out of stock`,             ok: ih.outOfStock === 0, warn: ih.oosRate < 20 },
            { label: `${ih.lowStock} low stock (≤5)`,             ok: ih.lowStock === 0, warn: ih.lowStock <= 10 },
            { label: `${ih.noWarehouseStock} no warehouse record`,ok: ih.noWarehouseStock === 0, warn: ih.noWarehouseStock <= 5 },
          ]}
        />

        <ScoreCard
          title="Supplier Health"
          score={sh.score}
          icon={Store}
          href="/admin/suppliers"
          items={[
            { label: `${sh.approved} approved suppliers`,         ok: sh.approved >= 1 },
            { label: `${sh.pending} pending approval`,            ok: sh.pending === 0, warn: sh.pending <= 2 },
            { label: `${sh.total} total suppliers`,               ok: sh.total >= 1 },
          ]}
        />

        <ScoreCard
          title="Homepage Readiness"
          score={hp.score}
          icon={Home}
          href="/admin/catalog-center/merchandising"
          items={[
            { label: "Hero banner published",                      ok: hp.heroPublished },
            { label: `${hp.publishedBlocks} content blocks live`, ok: hp.publishedBlocks >= 3, warn: hp.publishedBlocks >= 1 },
            { label: `${hp.featuredProducts} featured products`,  ok: hp.featuredProducts >= 5, warn: hp.featuredProducts >= 1 },
            { label: `${hp.homepageProducts} homepage products`,  ok: hp.homepageProducts >= 3, warn: hp.homepageProducts >= 1 },
          ]}
        />

        <ScoreCard
          title="SEO Readiness"
          score={seo.score}
          icon={Search}
          href="/admin/seo"
          items={[
            { label: `${seo.seoCompletionPct}% products have SEO`,ok: seo.seoCompletionPct >= 80, warn: seo.seoCompletionPct >= 50 },
            { label: `${seo.categoriesWithSeo}/${seo.totalCategories} categories with SEO`, ok: seo.categoriesWithSeo >= seo.totalCategories * 0.8, warn: seo.categoriesWithSeo >= 1 },
            { label: "Site settings configured",                   ok: seo.siteSettingsConfigured },
          ]}
        />

        <ScoreCard
          title="Content & Media"
          score={Math.min(100, Math.round((data.content.categories >= 3 ? 40 : data.content.categories * 13) + (data.content.media >= 10 ? 40 : data.content.media * 4) + (data.content.announcements >= 1 ? 20 : 0)))}
          icon={Globe}
          href="/admin/content/homepage"
          items={[
            { label: `${data.content.categories} active categories`, ok: data.content.categories >= 3, warn: data.content.categories >= 1 },
            { label: `${data.content.media} media assets`,           ok: data.content.media >= 10, warn: data.content.media >= 1 },
            { label: `${data.content.announcements} announcements`,  ok: data.content.announcements >= 1, warn: true },
          ]}
        />
      </div>

      {/* Quick action links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: "/admin/products/performance",    icon: TrendingUp,   label: "Product Performance",   desc: "Revenue & margins per product" },
          { href: "/admin/suppliers",               icon: Store,        label: "Supplier Performance",  desc: "Orders, returns & SLA by supplier" },
          { href: "/admin/catalog-center/merchandising", icon: Home,    label: "Merchandising",          desc: "Featured, trending, best sellers" },
          { href: "/admin/system/launch-checklist", icon: Rocket,       label: "Launch Checklist",       desc: "Full operational readiness report" },
        ].map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href}
            className="rounded-2xl p-4 hover:bg-white/[0.03] transition-all"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Icon className="h-5 w-5 text-[#F5C518] mb-3" />
            <p className="text-[13px] font-semibold text-white mb-0.5">{label}</p>
            <p className="text-[10px] text-white/35">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
