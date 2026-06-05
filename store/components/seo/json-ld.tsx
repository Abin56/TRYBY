const BASE_URL = "https://www.tryby.in";

export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "TRYBY Sports",
    alternateName: "TRYBY",
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/brand/tryby-logo.png`,
      width: 400,
      height: 100,
    },
    image: `${BASE_URL}/brand/tryby-icon-512.png`,
    description: "India's premium sports jerseys & gear — cricket, football, gym. Official licensed merchandise and fan editions. Fast pan-India delivery.",
    foundingDate: "2025",
    founders: [{ "@type": "Person", name: "Abin John" }],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kerala",
      addressCountry: "IN",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: "official@tryby.in",
        availableLanguage: ["English", "Hindi", "Malayalam"],
        hoursAvailable: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
          opens: "10:00",
          closes: "18:00",
        },
      },
    ],
    sameAs: [
      "https://www.instagram.com/tryby.in",
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: "TRYBY Sports",
    alternateName: "TRYBY",
    url: BASE_URL,
    publisher: { "@id": `${BASE_URL}/#organization` },
    inLanguage: "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/products?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── FAQ JSON-LD ────────────────────────────────────────────────────────────
export function FaqJsonLd({ items }: { items: { question: string; answer: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── Breadcrumb JSON-LD ──────────────────────────────────────────────────────
export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── Product JSON-LD ────────────────────────────────────────────────────────
export function ProductJsonLd({
  name,
  description,
  image,
  price,
  comparePrice,
  slug,
  sku,
  brand,
  category,
  inStock = true,
  rating,
  reviewCount,
}: {
  name: string;
  description: string;
  image: string | string[];
  price: number;
  comparePrice?: number;
  slug: string;
  sku?: string;
  brand?: string;
  category?: string;
  inStock?: boolean;
  rating?: number;
  reviewCount?: number;
}) {
  const productUrl = `${BASE_URL}/products/${slug}`;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}/#product`,
    name,
    description,
    image: Array.isArray(image) ? image : [image],
    url: productUrl,
    ...(sku && { sku }),
    brand: {
      "@type": "Brand",
      name: brand ?? "TRYBY Sports",
    },
    ...(category && {
      category,
    }),
    offers: {
      "@type": "Offer",
      "@id": `${productUrl}/#offer`,
      url: productUrl,
      priceCurrency: "INR",
      price: price.toFixed(2),
      ...(comparePrice && comparePrice > price && {
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: price.toFixed(2),
          priceCurrency: "INR",
          referenceQuantity: { "@type": "QuantitativeValue", value: 1 },
        },
      }),
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "TRYBY Sports",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "49",
          currency: "INR",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          businessDays: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
          },
          cutoffTime: "14:00:00+05:30",
          handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "d" },
          transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 5, unitCode: "d" },
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
  };

  if (rating && reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── ItemList JSON-LD (PLP / category pages) ────────────────────────────────
export function ItemListJsonLd({
  name,
  items,
}: {
  name: string;
  items: { name: string; url: string; image: string; position: number }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      url: item.url,
      image: item.image,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
