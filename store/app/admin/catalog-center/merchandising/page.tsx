"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Package, Star, Home, TrendingUp, Tag, ChevronUp, ChevronDown, Plus, X } from "lucide-react";

interface MerchandiseProduct {
  id: string; name: string; slug: string; sport: string; category: string;
  image: string | null; price: number; stock: number;
  isFeatured: boolean; showOnHomepage: boolean; homepageSortOrder: number;
  badges: string[]; supplier?: { companyName: string; logoUrl: string | null; tier: string } | null;
}

interface Section {
  title: string;
  count: number;
  products: MerchandiseProduct[];
}

interface Sections {
  featured:         Section;
  trending:         Section;
  bestSellers:      Section;
  newArrivals:      Section;
  staffPicks:       Section;
  supplierFeatured: Section;
}

const SECTION_CONFIG: { key: keyof Sections; icon: React.ElementType; color: string; editable: boolean }[] = [
  { key: "featured",         icon: Star,       color: "#F5C518", editable: true  },
  { key: "staffPicks",       icon: Home,       color: "#4ADE80", editable: true  },
  { key: "trending",         icon: TrendingUp, color: "#FB923C", editable: false },
  { key: "bestSellers",      icon: Tag,        color: "#A78BFA", editable: false },
  { key: "newArrivals",      icon: Package,    color: "#38BDF8", editable: false },
  { key: "supplierFeatured", icon: Star,       color: "#F5C518", editable: false },
];

const BADGE_LABELS: Record<string, string> = {
  TRENDING: "Trending", NEW: "New", SALE: "Sale", OFFICIAL: "Official",
  BEST_SELLER: "Best Seller", LIMITED: "Limited",
};
const BADGE_COLORS: Record<string, string> = {
  TRENDING: "#FB923C", NEW: "#38BDF8", SALE: "#F87171",
  OFFICIAL: "#4ADE80", BEST_SELLER: "#A78BFA", LIMITED: "#F5C518",
};

export default function MerchandisingPage() {
  const [sections, setSections] = useState<Sections | null>(null);
  const [loading, setLoading]   = useState(true);
  const [activeSection, setActiveSection] = useState<keyof Sections>("featured");
  const [saving, setSaving]     = useState(false);
  const [result, setResult]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/catalog/merchandising");
      if (res.ok) { const d = await res.json(); setSections(d.sections); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function patch(body: Record<string, unknown>) {
    setSaving(true); setResult("");
    try {
      const res = await fetch("/api/admin/catalog/merchandising", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (res.ok) { setResult("Saved"); load(); }
      else { const d = await res.json(); setResult(d.error ?? "Failed"); }
    } finally { setSaving(false); }
  }

  async function move(sectionKey: keyof Sections, idx: number, dir: -1 | 1) {
    if (!sections) return;
    const products = [...sections[sectionKey].products];
    const other = idx + dir;
    if (other < 0 || other >= products.length) return;
    [products[idx], products[other]] = [products[other], products[idx]];
    const action = sectionKey === "featured" ? "reorder_featured" : "reorder_homepage";
    await patch({ action, orderedProductIds: products.map(p => p.id) });
  }

  async function toggleField(productId: string, field: "isFeatured" | "showOnHomepage") {
    await patch({ action: field === "isFeatured" ? "toggle_featured" : "toggle_homepage", productId });
  }

  async function toggleBadge(productId: string, badge: string, has: boolean) {
    await patch({ action: has ? "remove_badge" : "add_badge", productId, badge });
  }

  if (loading) return (
    <div className="p-8 flex justify-center min-h-[300px] items-center">
      <RefreshCw className="h-7 w-7 animate-spin text-white/20" />
    </div>
  );

  if (!sections) return <div className="p-8 text-white/40">Failed to load.</div>;

  const cfg = SECTION_CONFIG.find(c => c.key === activeSection)!;
  const currentSection = sections[activeSection];

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/catalog-center" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px", letterSpacing: "-0.01em" }}>
            Homepage Merchandising
          </h1>
          <p className="text-white/40 text-[12px]">Control which products appear in each homepage section</p>
        </div>
        <button onClick={load} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/08 transition-all">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {result && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-[12px] font-semibold ${result === "Saved" ? "text-[#4ADE80]" : "text-[#F87171]"}`}
          style={{ background: result === "Saved" ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)" }}>
          {result}
        </div>
      )}

      <div className="grid lg:grid-cols-[240px_1fr] gap-5">
        {/* Section tabs */}
        <div className="space-y-1.5">
          {SECTION_CONFIG.map(({ key, icon: Icon, color }) => {
            const sec = sections[key];
            const isActive = activeSection === key;
            return (
              <button key={key} onClick={() => setActiveSection(key)}
                className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left transition-all"
                style={{
                  background: isActive ? `${color}12` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isActive ? `${color}30` : "rgba(255,255,255,0.06)"}`,
                }}>
                <Icon className="h-4 w-4 shrink-0" style={{ color: isActive ? color : "rgba(255,255,255,0.35)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold" style={{ color: isActive ? "white" : "rgba(255,255,255,0.5)" }}>
                    {sec.title}
                  </p>
                  <p className="text-[10px]" style={{ color: isActive ? color : "rgba(255,255,255,0.25)" }}>
                    {sec.count} products
                  </p>
                </div>
              </button>
            );
          })}
          <div className="pt-2 space-y-1.5">
            <Link href="/admin/products/featured"
              className="flex items-center gap-2 w-full rounded-xl px-4 py-2.5 text-[11px] font-semibold text-white/40 hover:text-white transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <Plus className="h-3.5 w-3.5" /> Manage Featured
            </Link>
            <Link href="/admin/products"
              className="flex items-center gap-2 w-full rounded-xl px-4 py-2.5 text-[11px] font-semibold text-white/40 hover:text-white transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <Package className="h-3.5 w-3.5" /> All Products
            </Link>
          </div>
        </div>

        {/* Section content */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <cfg.icon className="h-4 w-4" style={{ color: cfg.color }} />
            <h2 className="text-white font-black text-[15px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {currentSection.title}
            </h2>
            {!cfg.editable && <span className="text-[10px] text-white/25 bg-white/05 px-2 py-0.5 rounded-full">Auto-generated</span>}
          </div>

          {currentSection.products.length === 0 ? (
            <div className="flex flex-col items-center py-16 rounded-2xl" style={{ border: "1.5px dashed rgba(255,255,255,0.08)" }}>
              <Package className="h-10 w-10 text-white/15 mb-3" />
              <p className="text-[13px] text-white/30">No products in this section</p>
              <Link href="/admin/products"
                className="mt-3 text-[12px] font-semibold text-[#F5C518] hover:underline">
                Add products →
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {currentSection.products.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-all">
                    {/* Reorder (only editable sections) */}
                    {cfg.editable && (
                      <div className="flex flex-col shrink-0">
                        <button onClick={() => move(activeSection, idx, -1)} disabled={idx === 0 || saving}
                          className="h-5 w-5 flex items-center justify-center text-white/20 hover:text-white/60 disabled:opacity-20 transition-colors">
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button onClick={() => move(activeSection, idx, 1)} disabled={idx === currentSection.products.length - 1 || saving}
                          className="h-5 w-5 flex items-center justify-center text-white/20 hover:text-white/60 disabled:opacity-20 transition-colors">
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    {!cfg.editable && (
                      <span className="w-6 text-[10px] font-mono text-white/20 text-center">{idx + 1}</span>
                    )}

                    {/* Image */}
                    <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden" style={{ background: "#2A2A2A" }}>
                      {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <Package className="h-4 w-4 m-3 text-white/20" />}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-white truncate">{p.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/30">{p.category} · {p.sport}</span>
                        {p.badges.map(b => (
                          <span key={b} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: `${BADGE_COLORS[b] ?? "#888"}15`, color: BADGE_COLORS[b] ?? "#888" }}>
                            {BADGE_LABELS[b] ?? b}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Price & stock */}
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-[12px] font-bold text-white">₹{p.price.toLocaleString("en-IN")}</p>
                      <p className={`text-[10px] ${p.stock === 0 ? "text-[#F87171]" : "text-white/30"}`}>{p.stock} units</p>
                    </div>

                    {/* Toggles */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => toggleField(p.id, "isFeatured")} disabled={saving}
                        title={p.isFeatured ? "Remove from Featured" : "Add to Featured"}
                        className={`h-7 w-7 flex items-center justify-center rounded-lg transition-all ${p.isFeatured ? "text-[#F5C518]" : "text-white/20 hover:text-white/50"}`}
                        style={{ background: p.isFeatured ? "rgba(245,197,24,0.12)" : undefined }}>
                        <Star className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => toggleField(p.id, "showOnHomepage")} disabled={saving}
                        title={p.showOnHomepage ? "Remove from Homepage" : "Add to Homepage"}
                        className={`h-7 w-7 flex items-center justify-center rounded-lg transition-all ${p.showOnHomepage ? "text-[#4ADE80]" : "text-white/20 hover:text-white/50"}`}
                        style={{ background: p.showOnHomepage ? "rgba(74,222,128,0.12)" : undefined }}>
                        <Home className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Badge quick-add */}
                    <div className="flex items-center gap-1 shrink-0">
                      {["TRENDING", "NEW", "BEST_SELLER"].map(badge => {
                        const has = p.badges.includes(badge);
                        return (
                          <button key={badge} onClick={() => toggleBadge(p.id, badge, has)} disabled={saving}
                            title={has ? `Remove ${badge}` : `Add ${badge}`}
                            className="h-6 px-2 rounded-full text-[9px] font-black transition-all"
                            style={{
                              background: has ? `${BADGE_COLORS[badge]}20` : "rgba(255,255,255,0.04)",
                              color: has ? BADGE_COLORS[badge] : "rgba(255,255,255,0.2)",
                              border: `1px solid ${has ? `${BADGE_COLORS[badge]}30` : "rgba(255,255,255,0.06)"}`,
                            }}>
                            {badge.slice(0, 4)}
                          </button>
                        );
                      })}
                    </div>

                    <Link href={`/admin/products/${p.id}/edit`}
                      className="shrink-0 h-7 px-2 rounded-lg text-[10px] font-semibold text-white/30 hover:text-[#F5C518] transition-all"
                      onClick={e => e.stopPropagation()}>
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
