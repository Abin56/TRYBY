"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal, X, ChevronRight, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/cn";
import { PLPProductCard } from "@/components/plp/plp-product-card";
import { FilterSidebar } from "@/components/plp/filter-sidebar";
import { SortDropdown } from "@/components/plp/sort-dropdown";
import { PLPPagination } from "@/components/plp/plp-pagination";

const PAGE_SIZE = 20;

type Filters = {
  sport: string;
  category: string;
  priceRange: string;
  rating: number;
};

const DEFAULT_FILTERS: Filters = {
  sport: "All",
  category: "All",
  priceRange: "",
  rating: 0,
};

const PRICE_RANGES = [
  { label: "Under ₹500",  min: 0,    max: 500   },
  { label: "₹500 – ₹799", min: 500,  max: 799   },
  { label: "₹800 – ₹999", min: 800,  max: 999   },
  { label: "₹1000+",      min: 1000, max: 99999  },
];

export type DBProduct = {
  id: string;
  name: string;
  slug: string;
  sport: string;
  teamName?: string | null;
  leagueName?: string | null;
  avgRating: number;
  reviewCount: number;
  badges: { label: string; color?: string | null }[];
  images: { url: string; isPrimary: boolean }[];
  variants: { price: number; mrp: number; stock: number; size?: string | null }[];
};

function derivedProductFields(p: DBProduct) {
  const primaryImg = p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? "";
  const lowestVariant = p.variants.reduce(
    (best, v) => (!best || v.price < best.price ? v : best),
    null as null | (typeof p.variants)[0]
  );
  const price = lowestVariant?.price ?? 0;
  const comparePrice = lowestVariant?.mrp ?? price;
  const badgeLabel = p.badges[0]?.label?.toLowerCase();
  const badge: "new" | "sale" | "hot" | undefined =
    badgeLabel === "new" ? "new" : badgeLabel === "sale" ? "sale" : badgeLabel === "hot" ? "hot" : undefined;

  return { primaryImg, price, comparePrice, badge };
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E0E0E0] bg-white px-3 py-1 text-[12px] font-semibold text-[#0D0D0D]">
      {label}
      <button onClick={onRemove} className="text-[#9CA3AF] hover:text-[#DC2626] transition-colors">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-[#F5F5F5] overflow-hidden animate-pulse">
          <div className="aspect-square bg-[#E8E8E8]" />
          <div className="p-3 space-y-2">
            <div className="h-2.5 w-16 rounded bg-[#E0E0E0]" />
            <div className="h-3.5 w-full rounded bg-[#E0E0E0]" />
            <div className="h-3.5 w-3/4 rounded bg-[#E0E0E0]" />
            <div className="h-4 w-20 rounded bg-[#E0E0E0]" />
          </div>
        </div>
      ))}
    </div>
  );
}

type Props = {
  searchParams: Promise<{
    sport?: string;
    category?: string;
    sort?: string;
    page?: string;
    rating?: string;
    priceRange?: string;
  }>;
};

export function PLPClient({ searchParams: searchParamsPromise }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState("totalSoldCount_desc");
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [products, setProducts] = useState<DBProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Sync state from URL search params on mount
  useEffect(() => {
    searchParamsPromise.then((sp) => {
      const priceRange = sp.priceRange ?? "";
      setFilters({
        sport: sp.sport ?? "All",
        category: sp.category ?? "All",
        priceRange,
        rating: sp.rating ? parseFloat(sp.rating) : 0,
      });
      setSort(sp.sort ?? "totalSoldCount_desc");
      setPage(sp.page ? parseInt(sp.page) : 1);
    });
  }, [searchParamsPromise]);

  const fetchProducts = useCallback(async (f: Filters, s: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("sort", s);
      params.set("page", String(p));
      params.set("limit", String(PAGE_SIZE));
      if (f.sport !== "All") params.set("sport", f.sport);
      if (f.category !== "All") params.set("category", f.category);
      if (f.priceRange) {
        const range = PRICE_RANGES.find((r) => r.label === f.priceRange);
        if (range) { params.set("minPrice", String(range.min)); params.set("maxPrice", String(range.max)); }
      }
      if (f.rating > 0) params.set("minRating", String(f.rating));

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(filters, sort, page);
  }, [filters, sort, page, fetchProducts]);

  // Push filters into URL for shareable links + browser back/forward
  const updateUrl = useCallback((f: Filters, s: string, p: number) => {
    const params = new URLSearchParams();
    if (f.sport !== "All") params.set("sport", f.sport);
    if (f.category !== "All") params.set("category", f.category);
    if (f.priceRange) params.set("priceRange", f.priceRange);
    if (f.rating > 0) params.set("rating", String(f.rating));
    if (s !== "totalSoldCount_desc") params.set("sort", s);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    startTransition(() => {
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    });
  }, [router, pathname]);

  const handleFilterChange = (f: Filters) => { setFilters(f); setPage(1); updateUrl(f, sort, 1); };
  const handleSortChange   = (s: string)  => { setSort(s);    setPage(1); updateUrl(filters, s, 1); };
  const handlePageChange   = (p: number)  => { setPage(p);              updateUrl(filters, sort, p); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasActiveFilters =
    filters.sport !== "All" ||
    filters.category !== "All" ||
    filters.priceRange !== "" ||
    filters.rating > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="border-b border-[#EFEFEF] bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-4">
          <nav className="flex items-center gap-1.5 text-[12px] text-[#9CA3AF] mb-3" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#0D0D0D] transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#0D0D0D] font-medium">All Jerseys</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h1
                className="text-[#0D0D0D] font-black leading-none mb-1"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.01em" }}
              >
                All Jerseys
              </h1>
              <p className="text-[13px] text-[#9CA3AF]">
                {loading ? "Loading…" : `${total} ${total === 1 ? "product" : "products"} found`}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <SortDropdown value={sort} onChange={handleSortChange} />
              <div className="flex items-center gap-1 rounded-xl border border-[#E0E0E0] p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn("flex h-7 w-7 items-center justify-center rounded-lg transition-colors", viewMode === "grid" ? "bg-[#0D0D0D] text-white" : "text-[#9CA3AF] hover:text-[#0D0D0D]")}
                  aria-label="Grid view"
                ><LayoutGrid className="h-3.5 w-3.5" /></button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn("flex h-7 w-7 items-center justify-center rounded-lg transition-colors", viewMode === "list" ? "bg-[#0D0D0D] text-white" : "text-[#9CA3AF] hover:text-[#0D0D0D]")}
                  aria-label="List view"
                ><List className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-8 items-start">
          {/* Sidebar — desktop */}
          <div className="hidden lg:block w-[220px] shrink-0 sticky top-[72px]">
            <FilterSidebar filters={filters} onChange={handleFilterChange} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Mobile toolbar */}
            <div className="flex items-center gap-2 mb-4 sm:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[#E0E0E0] text-[13px] font-semibold text-[#0D0D0D]"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {hasActiveFilters && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#F5C518] text-[9px] font-black text-[#0D0D0D]">!</span>
                )}
              </button>
              <SortDropdown value={sort} onChange={handleSortChange} />
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.sport !== "All" && (
                  <ActiveChip label={filters.sport} onRemove={() => handleFilterChange({ ...filters, sport: "All" })} />
                )}
                {filters.category !== "All" && (
                  <ActiveChip label={filters.category} onRemove={() => handleFilterChange({ ...filters, category: "All" })} />
                )}
                {filters.priceRange && (
                  <ActiveChip label={filters.priceRange} onRemove={() => handleFilterChange({ ...filters, priceRange: "" })} />
                )}
                {filters.rating > 0 && (
                  <ActiveChip label={`${filters.rating}★+`} onRemove={() => handleFilterChange({ ...filters, rating: 0 })} />
                )}
                <button
                  onClick={() => handleFilterChange(DEFAULT_FILTERS)}
                  className="text-[12px] font-semibold text-[#DC2626] hover:text-[#B91C1C] transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <SkeletonGrid />
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center gap-5 py-20 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl" style={{ background: "rgba(245,197,24,0.10)" }}>🔍</div>
                <div>
                  <p className="font-black text-[#0D0D0D] mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px" }}>
                    No Jerseys Found
                  </p>
                  <p className="text-[13px] text-[#888] max-w-xs mx-auto">Try different keywords or explore our collections.</p>
                </div>
                <button
                  onClick={() => handleFilterChange(DEFAULT_FILTERS)}
                  className="h-11 px-7 rounded-full font-bold text-[13px] text-white bg-[#0D0D0D] hover:opacity-85 transition-opacity"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className={cn("grid gap-4", viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : "grid-cols-1")}>
                  {products.map((product) => {
                    const { primaryImg, price, comparePrice, badge } = derivedProductFields(product);
                    return (
                      <PLPProductCard
                        key={product.id}
                        product={{
                          id: product.id,
                          name: product.name,
                          slug: product.slug,
                          price,
                          comparePrice,
                          rating: product.avgRating ?? 0,
                          reviewCount: product.reviewCount ?? 0,
                          image: primaryImg,
                          badge,
                          category: product.leagueName ?? product.teamName ?? product.sport ?? "",
                          sport: product.sport ?? "",
                          club: product.teamName ?? undefined,
                        }}
                      />
                    );
                  })}
                </div>
                <PLPPagination page={page} totalPages={totalPages} onChange={handlePageChange} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-[190] bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <div className="fixed bottom-0 left-0 right-0 z-[195] bg-white rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto lg:hidden shadow-[0_-8px_40px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-black text-[#0D0D0D] uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Filters</h2>
              <button onClick={() => setSidebarOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F5] text-[#555] hover:text-[#0D0D0D]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <FilterSidebar filters={filters} onChange={(f) => { handleFilterChange(f); setSidebarOpen(false); }} />
          </div>
        </>
      )}
    </div>
  );
}
