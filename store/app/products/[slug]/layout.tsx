import type { Metadata } from "next";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

type Props = { params: Promise<{ slug: string }> };

const BASE = "https://www.tryby.in";

async function fetchProduct(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? BASE}/api/products/${slug}`, {
      next: { revalidate: 300 }, // 5-min ISR
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "This product is not available.",
      robots: "noindex",
    };
  }

  const primaryImage = product.images?.find((i: { isPrimary: boolean }) => i.isPrimary)?.url
    ?? product.images?.[0]?.url
    ?? "/og-image.png";

  const lowestPrice = product.variants?.reduce(
    (min: number, v: { price: number }) => Math.min(min, v.price),
    Infinity
  ) ?? 0;

  const title = product.metaTitle ?? `${product.name} — Buy Online India`;
  const description =
    product.metaDescription ??
    `Buy ${product.name} at TRYBY Sports. ₹${lowestPrice} — Official sports gear with fast pan-India delivery and easy returns.`;
  const url = `${BASE}/products/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: [{ url: primaryImage, width: 800, height: 800, alt: product.name }],
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) return <>{children}</>;

  const primaryImage = product.images?.find((i: { isPrimary: boolean }) => i.isPrimary)?.url
    ?? product.images?.[0]?.url
    ?? "/og-image.png";

  const lowestVariant = product.variants?.reduce(
    (best: { price: number } | null, v: { price: number }) => (!best || v.price < best.price ? v : best),
    null
  );

  return (
    <>
      <ProductJsonLd
        name={product.name}
        description={product.metaDescription ?? `${product.name} — Official sports gear by TRYBY Sports.`}
        image={primaryImage}
        price={lowestVariant?.price ?? 0}
        slug={product.slug}
        rating={product.avgRating ?? 0}
        reviewCount={product.reviewCount ?? 0}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home",  url: BASE },
          { name: "Shop",  url: `${BASE}/products` },
          { name: product.name, url: `${BASE}/products/${slug}` },
        ]}
      />
      {children}
    </>
  );
}
