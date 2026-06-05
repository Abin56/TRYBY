import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

// Always use canonical www domain for sitemap
const BASE = "https://www.tryby.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    // Core
    { url: BASE,                         lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/products`,           lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    // Info
    { url: `${BASE}/about`,              lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`,            lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/faq`,                lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    // Legal / support
    { url: `${BASE}/shipping`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/returns`,            lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/cancellation`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/privacy-policy`,     lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/terms`,              lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/cookies`,            lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/disclaimer`,         lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
  ];

  let productPages: MetadataRoute.Sitemap = [];
  let categoryPages: MetadataRoute.Sitemap = [];

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    productPages = products.map(p => ({
      url: `${BASE}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    categoryPages = categories.map(c => ({
      url: `${BASE}/products?category=${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB may not be reachable at build time — return static pages only
  }

  return [...staticPages, ...categoryPages, ...productPages];
}
