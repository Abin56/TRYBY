import { getTrendingProducts } from "@/lib/content";
import { TrendingGearClient } from "./trending-gear-client";

// Server component — fetches real trending products from DB.
export async function TrendingGearSection() {
  const products = await getTrendingProducts(8);

  const mapped = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.variants[0]?.price ?? 0),
    comparePrice: Number(p.variants[0]?.mrp ?? 0),
    rating: Number(p.avgRating),
    reviewCount: p.reviewCount,
    image: p.images[0]?.url ?? "/images/product-placeholder.jpg",
    href: `/products/${p.slug}`,
    isNew: p.badges.some((b) => b.type === "NEW"),
    isSale: p.badges.some((b) => b.type === "SALE"),
  }));

  return <TrendingGearClient products={mapped} />;
}
