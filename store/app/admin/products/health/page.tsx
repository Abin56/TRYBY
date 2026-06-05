"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Package, AlertTriangle, CheckCircle, XCircle, Search, Download } from "lucide-react";

interface HealthProduct {
  id: string; name: string; slug: string; sport: string; category: string;
  image: string | null; flags: string[]; score: number; totalStock: number;
}

interface Summary {
  total: number; missingImage: number; missingMetaTitle: number; missingMetaDesc: number;
  shortDescription: number; missingCostPrice: number; outOfStock: number;
  noVariants: number; noSupplier: number; avgScore: number; perfect: number;
}

const FLAG_LABELS: Record<string, { label: string; color: string }> = {
  missing_image:        { label: "No image",         color: "#F87171" },
  missing_meta_title:   { label: "No meta title",    color: "#FB923C" },
  missing_meta_description: { label: "No meta desc", color: "#FB923C" },
  short_description:    { label: "Short desc",       color: "#F5C518" },
  missing_cost_price:   { label: "No cost price",    color: "#A78BFA" },
  missing_category:     { label: "No category",      color: "#F87171" },
  out_of_stock:         { label: "Out of stock",      color: "#F87171" },
  no_variants:          { label: "No variants",      color: "#F87171" },
  no_supplier:          { label: "No supplier",      color: "#6B7280" },
};

const FILTER_OPTIONS = [
  { key: "all",     label: "All Issues" },
  { key: "missing_image",        label: "Missing Image" },
  { key: "missing_meta_title",   label: "Missing SEO" },
  { key: "short_description",    label: "Short Desc" },
  { key: "missing_cost_price",   label: "No Cost Price" },
  { key: "out_of_stock",         label: "Out of Stock" },
  { key: "no_variants",          label: "No Variants" },
  { key: "perfect",              label: "Perfect" },
];

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "#4ADE80" : score >= 60 ? "#F5C518" : "#F87171";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[11px] font-bold shrink-0" style={{ color, width: "30px", textAlign: "right" }}>{score}%</span>
    </div>
  );
}

export default function ProductHealthPage() {
  const [products, setProducts]   = useState<HealthProduct[]>([]);
  const [summary, setSummary]     = useState<Summary | null>(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("all");

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/products/health")
      .then(r => r.json())
      .then(data => { setProducts(data.products); setSummary(data.summary); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "all")     return p.flags.length > 0;
    if (filter === "perfect") return p.flags.length === 0;
    return p.flags.includes(filter);
  });

  if (loading) return (
    <div className="p-8 flex justify-center"><RefreshCw className="h-6 w-6 animate-spin text-white/20" /></div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px", letterSpacing: "-0.01em" }}>
            Product Health
          </h1>
          {summary && (
            <p className="text-white/40 text-[12px]">
              Avg quality score: <span className={summary.avgScore >= 80 ? "text-[#4ADE80]" : summary.avgScore >= 60 ? "text-[#F5C518]" : "text-[#F87171]"}>{summary.avgScore}%</span>
              · {summary.perfect} perfect · {summary.total - summary.perfect} with issues
            </p>
          )}
        </div>
        <button onClick={() => window.open("/api/admin/products/export?type=products", "_blank")}
          className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-semibold text-white/60 hover:text-white transition-all"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Missing Image",     value: summary.missingImage,     color: "#F87171" },
            { label: "Missing SEO Title", value: summary.missingMetaTitle, color: "#FB923C" },
            { label: "No Cost Price",     value: summary.missingCostPrice, color: "#A78BFA" },
            { label: "Perfect Score",     value: summary.perfect,          color: "#4ADE80" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-4 text-center" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[28px] font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>{value}</p>
              <p className="text-[10px] text-white/35 font-semibold uppercase tracking-widest mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
            className="w-full pl-9 h-9 rounded-xl text-[13px] text-white outline-none bg-[#1A1A1A] border border-white/08" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map(o => (
            <button key={o.key} onClick={() => setFilter(o.key)}
              className="h-9 px-3 rounded-xl text-[11px] font-bold transition-all"
              style={{
                background: filter === o.key ? "rgba(245,197,24,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${filter === o.key ? "rgba(245,197,24,0.3)" : "rgba(255,255,255,0.08)"}`,
                color: filter === o.key ? "#F5C518" : "rgba(255,255,255,0.4)",
              }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-white/30 mb-3">{filtered.length} products shown</p>

      {/* Product list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-white/25">
            <CheckCircle className="h-10 w-10 mb-3 text-[#4ADE80]" />
            <p className="text-[14px] font-semibold">All products are healthy!</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {filtered.map(p => (
              <div key={p.id} className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                {/* Image */}
                <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden" style={{ background: "#2A2A2A" }}>
                  {p.image
                    ? <img src={p.image} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-white/20" />
                      </div>
                  }
                </div>

                {/* Name + score */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {p.flags.length === 0
                      ? <CheckCircle className="h-3.5 w-3.5 text-[#4ADE80] shrink-0" />
                      : <XCircle className="h-3.5 w-3.5 text-[#F87171] shrink-0" />
                    }
                    <p className="text-[13px] font-semibold text-white truncate">{p.name}</p>
                  </div>
                  <p className="text-[10px] text-white/30 mb-2">{p.category} · {p.sport} · {p.totalStock} units</p>
                  <ScoreBar score={p.score} />
                  {p.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.flags.map(f => {
                        const meta = FLAG_LABELS[f];
                        return (
                          <span key={f} className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${meta?.color ?? "#6B7280"}15`, color: meta?.color ?? "#6B7280" }}>
                            {meta?.label ?? f}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Link href={`/admin/products/${p.id}/edit`}
                  className="shrink-0 flex items-center h-8 px-3 rounded-lg text-[11px] font-semibold text-[#F5C518] hover:bg-[#F5C518]/10 transition-all"
                  onClick={e => e.stopPropagation()}>
                  Fix →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
