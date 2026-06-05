import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";
import { BadgeCheck, Star, Image as ImageIcon, Video } from "lucide-react";

export const metadata: Metadata = {
  title: "Community | TRYBY Sports",
  description: "Real photos and reviews from the TRYBY community of athletes. See how your fellow athletes wear and use their gear.",
  openGraph: {
    title: "TRYBY Community — Real Athletes, Real Reviews",
    description: "Browse customer photos, videos and verified reviews from the TRYBY sports community.",
  },
};

export const revalidate = 60;

async function getUGCData() {
  const [featuredReviews, photoReviews, videoReviews, stats] = await Promise.all([
    // Featured reviews with photos
    prisma.review.findMany({
      where:   { status: "APPROVED", isFeatured: true },
      include: { user: { select: { name: true, image: true } }, product: { select: { name: true, slug: true } } },
      orderBy: { helpfulCount: "desc" },
      take:    8,
    }),
    // Reviews with photos
    prisma.review.findMany({
      where:   { status: "APPROVED", imageUrls: { isEmpty: false } },
      include: { user: { select: { name: true, image: true } }, product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take:    24,
    }),
    // Reviews with videos
    prisma.review.findMany({
      where:   { status: "APPROVED", videoUrls: { isEmpty: false } },
      include: { user: { select: { name: true, image: true } }, product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take:    8,
    }),
    // Platform stats
    prisma.review.aggregate({
      where:  { status: "APPROVED" },
      _count: { id: true },
      _avg:   { rating: true },
    }),
  ]);

  return { featuredReviews, photoReviews, videoReviews, stats };
}

export default async function CommunityPage() {
  const { featuredReviews, photoReviews, videoReviews, stats } = await getUGCData();

  const totalReviews = stats._count.id;
  const avgRating    = Number(stats._avg.rating ?? 0).toFixed(1);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 pt-12 pb-20">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F5C518] px-4 py-1.5 mb-4">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className="h-3.5 w-3.5 fill-[#F5C518] stroke-[#F5C518]" strokeWidth={1.5} />
              ))}
            </div>
            <span className="text-[13px] font-bold text-[#0D0D0D]">{avgRating}/5 from {totalReviews.toLocaleString("en-IN")} athletes</span>
          </div>
          <h1 className="font-black text-[#0D0D0D] mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(36px,5vw,64px)", letterSpacing: "-0.02em" }}>
            THE TRYBY COMMUNITY
          </h1>
          <p className="text-[#9CA3AF] text-[15px] max-w-lg mx-auto">
            Real athletes. Real gear. Real results. Browse photos and reviews from thousands of verified TRYBY customers.
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mb-12 rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] p-6">
          {[
            { label: "Verified Reviews",  value: totalReviews.toLocaleString("en-IN") },
            { label: "Avg Rating",        value: `${avgRating} ★` },
            { label: "Customer Photos",   value: photoReviews.length > 0 ? `${photoReviews.reduce((s, r) => s + r.imageUrls.length, 0).toLocaleString("en-IN")}+` : "—" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-black text-[#0D0D0D] text-[28px] leading-none mb-1"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {s.value}
              </p>
              <p className="text-[12px] text-[#9CA3AF]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Featured reviews */}
        {featuredReviews.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-[#0D0D0D]"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px" }}>
                ⭐ FEATURED REVIEWS
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredReviews.map(r => (
                <Link key={r.id} href={`/products/${r.product.slug}#reviews`}
                  className="group rounded-2xl border border-[#F0F0F0] bg-white p-4 hover:border-[#0D0D0D] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all">
                  {r.imageUrls[0] && (
                    <div className="aspect-square rounded-xl overflow-hidden mb-3">
                      <img src={r.imageUrls[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="flex gap-0.5 mb-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className="h-3 w-3" fill={s <= r.rating ? "#F5C518" : "none"} stroke={s <= r.rating ? "#F5C518" : "#D1D5DB"} strokeWidth={1.5} />
                    ))}
                  </div>
                  {r.title && <p className="text-[13px] font-bold text-[#0D0D0D] mb-0.5 truncate">{r.title}</p>}
                  {r.body && <p className="text-[12px] text-[#9CA3AF] line-clamp-2">{r.body}</p>}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[11px] font-semibold text-[#0D0D0D] truncate">{r.user.name ?? "Customer"}</span>
                    {r.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />}
                  </div>
                  <p className="text-[11px] text-[#C0C0C0] mt-0.5 truncate">{r.product.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Photo gallery */}
        {photoReviews.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-[#0D0D0D] flex items-center gap-2"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px" }}>
                <ImageIcon className="h-5 w-5" /> CUSTOMER PHOTOS
              </h2>
            </div>
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
              {photoReviews.flatMap(r =>
                r.imageUrls.map((url, i) => ({
                  url, key: `${r.id}-${i}`,
                  productName: r.product.name, productSlug: r.product.slug,
                  userName: r.user.name, rating: r.rating, isVerified: r.isVerified,
                }))
              ).slice(0, 32).map(img => (
                <Link key={img.key} href={`/products/${img.productSlug}#reviews`}
                  className="group relative break-inside-avoid block mb-3 rounded-2xl overflow-hidden">
                  <img src={img.url} alt=""
                    className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-[12px] font-semibold text-white truncate">{img.userName ?? "Customer"}</p>
                      <p className="text-[10px] text-white/70 truncate">{img.productName}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Video reviews */}
        {videoReviews.length > 0 && (
          <section className="mb-14">
            <h2 className="font-black text-[#0D0D0D] mb-6 flex items-center gap-2"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px" }}>
              <Video className="h-5 w-5" /> VIDEO REVIEWS
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {videoReviews.flatMap(r =>
                r.videoUrls.map((url, i) => ({
                  url, key: `${r.id}-vid-${i}`,
                  productName: r.product.name, productSlug: r.product.slug,
                  userName: r.user.name, rating: r.rating,
                }))
              ).slice(0, 8).map(v => (
                <Link key={v.key} href={`/products/${v.productSlug}#reviews`}
                  className="group relative rounded-2xl overflow-hidden bg-[#0D0D0D] aspect-[4/5]">
                  <video src={v.url} muted loop className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <svg viewBox="0 0 24 24" className="h-6 w-6 text-white fill-current ml-0.5">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60">
                    <p className="text-[11px] font-semibold text-white truncate">{v.userName ?? "Customer"}</p>
                    <p className="text-[10px] text-white/60 truncate">{v.productName}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {totalReviews === 0 && (
          <div className="text-center py-20">
            <p className="text-[#9CA3AF] text-[15px] mb-4">No community content yet.</p>
            <Link href="/products" className="text-[14px] font-bold text-[#0D0D0D] hover:underline">
              Shop now and be the first to review →
            </Link>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-2xl bg-[#0D0D0D] p-8 text-center">
          <h2 className="text-white font-black mb-2"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px" }}>
            SHARE YOUR STORY
          </h2>
          <p className="text-white/60 text-[14px] mb-6">
            Bought from TRYBY? Your review helps thousands of athletes make better decisions.
          </p>
          <Link href="/account/orders"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F5C518] text-[#0D0D0D] font-black px-6 py-3 text-[14px] hover:brightness-110 transition-all"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
            REVIEW YOUR PURCHASE
          </Link>
        </div>
      </div>
    </div>
  );
}
