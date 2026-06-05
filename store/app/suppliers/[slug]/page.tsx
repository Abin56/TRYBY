import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

type Product = {
  id: string; name: string; slug: string; sport: string;
  avgRating: number; reviewCount: number; totalSoldCount: number;
  images: { url: string; altText: string | null }[];
  variants: { price: number; mrp: number }[];
  badges: { type: string; label: string | null }[];
};

type Review = {
  id: string; rating: number; title: string | null; body: string | null;
  isVerified: boolean; createdAt: string;
  user: { name: string | null; image: string | null };
  product: { name: string; slug: string };
};

type Supplier = {
  id: string; companyName: string; slug: string; logoUrl: string | null;
  bannerUrl: string | null; bio: string | null; tier: string;
  onboardedAt: string | null; avgRating: number; totalOrders: number;
  performanceScore: number; fulfillmentScore: number; qualityScore: number;
  trustScore: number; fulfillmentRate: number; returnRate: number;
  avgShippingHrs: number; avgDeliveryDays: number;
};

type Data = { supplier: Supplier; products: Product[]; reviews: Review[] };

const TIER_LABELS: Record<string, { color: string; label: string }> = {
  PLATINUM: { color: "#E8D5B7", label: "Platinum Partner"  },
  GOLD:     { color: "#F5C518", label: "Gold Partner"      },
  SILVER:   { color: "#9CA3AF", label: "Silver Partner"    },
  BRONZE:   { color: "#CD7C3A", label: "Bronze Partner"    },
};

async function getSupplier(slug: string): Promise<Data | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/storefront/suppliers/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSupplier(slug);
  if (!data) return { title: "Supplier Not Found" };
  const { supplier } = data;
  return {
    title: `${supplier.companyName} | TRYBY Sports`,
    description: supplier.bio ?? `Shop products from ${supplier.companyName} on TRYBY Sports.`,
    openGraph: {
      images: supplier.bannerUrl ? [supplier.bannerUrl] : [],
    },
  };
}

export default async function SupplierStorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getSupplier(slug);
  if (!data) notFound();

  const { supplier, products, reviews } = data;
  const tier = TIER_LABELS[supplier.tier] ?? TIER_LABELS.BRONZE;
  const memberYears = supplier.onboardedAt
    ? Math.floor((Date.now() - new Date(supplier.onboardedAt).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : 0;

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh" }}>

      {/* Banner */}
      <div
        className="relative h-48 lg:h-64"
        style={{
          background: supplier.bannerUrl
            ? `url(${supplier.bannerUrl}) center/cover`
            : "linear-gradient(135deg, #111 0%, #1a1a1a 100%)",
        }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.6))" }} />
      </div>

      {/* Supplier header */}
      <div className="max-w-[1100px] mx-auto px-4 lg:px-8">
        <div className="flex items-end gap-5 -mt-8 mb-8 relative z-10">
          {supplier.logoUrl ? (
            <img
              src={supplier.logoUrl}
              alt={supplier.companyName}
              className="h-20 w-20 rounded-2xl object-cover shrink-0 border-4"
              style={{ borderColor: "#0A0A0A" }}
            />
          ) : (
            <div
              className="h-20 w-20 rounded-2xl shrink-0 flex items-center justify-center text-[28px] font-black border-4"
              style={{ background: "#1A1A1A", color: "rgba(255,255,255,0.30)", fontFamily: "'Barlow Condensed', sans-serif", borderColor: "#0A0A0A" }}
            >
              {supplier.companyName.charAt(0)}
            </div>
          )}
          <div className="min-w-0 pb-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-white font-black text-[26px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {supplier.companyName}
              </h1>
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: `${tier.color}18`, color: tier.color }}
              >
                {tier.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[12px] text-white/40">
              {supplier.avgRating > 0 && (
                <span>★ {Number(supplier.avgRating).toFixed(1)}</span>
              )}
              {supplier.totalOrders > 0 && (
                <span>{supplier.totalOrders.toLocaleString()} orders</span>
              )}
              {memberYears > 0 && (
                <span>{memberYears}+ year partner</span>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {supplier.bio && (
          <p className="text-white/50 text-[14px] leading-relaxed mb-8 max-w-[600px]">{supplier.bio}</p>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {[
            { label: "Performance",  value: `${Number(supplier.performanceScore).toFixed(0)}/100`, color: "#F5C518" },
            { label: "Fulfillment",  value: `${(Number(supplier.fulfillmentRate) * 100).toFixed(0)}%`, color: "#4ADE80" },
            { label: "Return Rate",  value: `${(Number(supplier.returnRate) * 100).toFixed(1)}%`, color: "#F87171" },
            { label: "Avg Ship",     value: Number(supplier.avgShippingHrs) > 0 ? `${Number(supplier.avgShippingHrs).toFixed(0)}h` : "—", color: "#60A5FA" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-white/40 text-[11px] mb-1">{s.label}</p>
              <p className="font-black text-[20px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: s.color }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Products */}
        <h2 className="text-white font-black mb-5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px" }}>
          Products ({products.length})
        </h2>
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl mb-10"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-white/40 text-[14px]">No products listed yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {products.map(p => {
              const price  = p.variants[0]?.price ?? 0;
              const mrp    = p.variants[0]?.mrp   ?? 0;
              const image  = p.images[0];
              const discountPct = mrp > price ? Math.round((1 - price / mrp) * 100) : 0;
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="group rounded-2xl overflow-hidden transition-all hover:scale-[1.01]"
                  style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="relative aspect-square overflow-hidden">
                    {image ? (
                      <img src={image.url} alt={image.altText ?? p.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.04)" }}>
                        <span className="text-white/20 text-[11px]">No image</span>
                      </div>
                    )}
                    {discountPct > 0 && (
                      <div className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-black"
                        style={{ background: "#F5C518", color: "#0D0D0D", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        -{discountPct}%
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[13px] font-semibold text-white/85 truncate mb-1">{p.name}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-black text-white text-[15px]"
                          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                          ₹{Number(price).toLocaleString("en-IN")}
                        </span>
                        {discountPct > 0 && (
                          <span className="text-[11px] text-white/25 line-through">
                            ₹{Number(mrp).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      {p.avgRating > 0 && (
                        <span className="text-[11px] text-white/40">★ {Number(p.avgRating).toFixed(1)}</span>
                      )}
                    </div>
                    {p.totalSoldCount > 0 && (
                      <p className="text-[10px] text-white/25 mt-0.5">{p.totalSoldCount} sold</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <>
            <h2 className="text-white font-black mb-5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px" }}>
              Customer Reviews
            </h2>
            <div className="grid lg:grid-cols-3 gap-4 mb-10">
              {reviews.map(r => (
                <div key={r.id} className="rounded-2xl p-4"
                  style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} style={{ color: i < r.rating ? "#F5C518" : "rgba(255,255,255,0.15)", fontSize: "13px" }}>★</span>
                    ))}
                    {r.isVerified && (
                      <span className="ml-2 text-[10px] text-[#4ADE80] font-bold">✓ Verified</span>
                    )}
                  </div>
                  {r.title && <p className="text-[13px] font-semibold text-white/85 mb-1">{r.title}</p>}
                  {r.body && <p className="text-[12px] text-white/50 leading-relaxed line-clamp-3">{r.body}</p>}
                  <div className="flex items-center justify-between mt-3 pt-3"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <Link href={`/products/${r.product.slug}`}
                      className="text-[11px] text-white/30 hover:text-white transition-colors truncate">
                      {r.product.name}
                    </Link>
                    <span className="text-[10px] text-white/25 shrink-0">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
