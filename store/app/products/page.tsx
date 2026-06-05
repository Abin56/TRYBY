import { Suspense } from "react";
import type { Metadata } from "next";
import { PLPClient } from "@/components/plp/plp-client";

export const metadata: Metadata = {
  title: "All Jerseys & Sports Gear",
  description:
    "Shop official sports jerseys, cricket kits, football gear and gym accessories at TRYBY. Filter by sport, price and rating. Fast pan-India delivery.",
  alternates: { canonical: "https://www.tryby.in/products" },
  openGraph: {
    title: "All Jerseys & Sports Gear — TRYBY Sports",
    description:
      "Browse India's best sports jerseys. Cricket, football, IPL, international — all in one place.",
    url: "https://www.tryby.in/products",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "TRYBY Sports" }],
  },
};

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string; category?: string; sort?: string; page?: string; minPrice?: string; maxPrice?: string; rating?: string }>;
}) {
  return (
    <Suspense fallback={<PLPSkeleton />}>
      <PLPClient searchParams={searchParams} />
    </Suspense>
  );
}

function PLPSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-[#EFEFEF] bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-4">
          <div className="h-3 w-24 rounded bg-[#F0F0F0] mb-3" />
          <div className="h-9 w-48 rounded bg-[#F0F0F0]" />
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-8">
          <div className="hidden lg:block w-[220px] shrink-0 space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-8 rounded bg-[#F0F0F0]" />)}
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
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
        </div>
      </div>
    </div>
  );
}
