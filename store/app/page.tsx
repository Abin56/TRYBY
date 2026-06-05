import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroSection } from "@/components/home/hero";
import { CategoryNavSection } from "@/components/home/category-nav";
import { TrendingGearSection } from "@/components/home/trending-gear";
import { TrustSection } from "@/components/home/trust-section";
import { SocialProofSection } from "@/components/home/social-proof-section";
import { NewsletterSignup } from "@/components/conversion/newsletter-signup";
import { HeroSkeleton } from "@/components/system/skeletons/hero-skeleton";
import { getHomepageSEO, getHomepageSections } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getHomepageSEO();

  const title       = seo?.metaTitle       ?? "TRYBY — Buy Sports Jerseys & Gear Online India";
  const description = seo?.metaDescription ?? "Shop India's best sports gear at TRYBY. Official cricket jerseys, football kits, gym wear & sports accessories. Fast delivery, easy returns. Shop now at tryby.in.";
  const ogTitle     = seo?.ogTitle         ?? title;
  const ogDesc      = seo?.ogDescription   ?? description;
  const ogImage     = seo?.ogImageUrl       ?? "/og-image.png";
  const canonical   = seo?.canonicalUrl     ?? "https://www.tryby.in";
  const robots      = seo?.robotsContent    ?? "index,follow";

  return {
    title,
    description,
    robots,
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      url: "https://www.tryby.in",
      images: [{ url: ogImage, width: 1200, height: 630, alt: "TRYBY Sports" }],
    },
  };
}

// Render the correct section component by key — called inside JSX so async
// server components execute in the right request context.
function SectionComponent({ sectionKey }: { sectionKey: string }) {
  switch (sectionKey) {
    case "hero":         return <Suspense fallback={<HeroSkeleton />}><HeroSection /></Suspense>;
    case "categories":   return <CategoryNavSection />;
    case "trending":     return <TrendingGearSection />;
    case "trust":        return <TrustSection />;
    case "social_proof": return <SocialProofSection />;
    default:             return null;
  }
}

export default async function HomePage() {
  const sections = await getHomepageSections();

  const ordered = sections
    .filter((s) => s.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Only add SocialProofSection if CMS sections don't already include it
  const hasSocialProof = ordered.some((s) => s.key === "social_proof");

  return (
    <>
      {ordered.map((s) => (
        <div key={s.key}>
          <SectionComponent sectionKey={s.key} />
        </div>
      ))}
      {/* Social proof — only if not already rendered by CMS section order */}
      {!hasSocialProof && <SocialProofSection />}
      {/* Newsletter banner — above footer */}
      <NewsletterSignup
        variant="banner"
        source="homepage-banner"
        title="Get exclusive deals & new arrivals"
        subtitle="Join 18,000+ sports fans. New jerseys, flash sales & offers — straight to your inbox."
      />
    </>
  );
}
