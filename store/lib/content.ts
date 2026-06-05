import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";

// ─── Generic block types ──────────────────────────────────────────────────────

export type BlockType =
  | "HERO_BANNER"
  | "TRUST_BAR"
  | "CATEGORY_GRID"
  | "TRENDING_PRODUCTS"
  | "PROMO_BANNER"
  | "FOOTER_COLUMN"
  | "STATIC_PAGE";

export interface ContentBlock {
  id:        string;
  type:      BlockType;
  key:       string;
  data:      Record<string, unknown>;
  sortOrder: number;
}

export async function getPublishedBlocks(type?: BlockType): Promise<ContentBlock[]> {
  try {
    return prisma.contentBlock.findMany({
      where: {
        isActive: true,
        status:   "PUBLISHED",
        ...(type ? { type } : {}),
      },
      orderBy: { sortOrder: "asc" },
      select:  { id: true, type: true, key: true, data: true, sortOrder: true },
    }) as Promise<ContentBlock[]>;
  } catch {
    return [];
  }
}

export async function getBlock(key: string): Promise<ContentBlock | null> {
  try {
    const block = await prisma.contentBlock.findUnique({
      where:  { key },
      select: { id: true, type: true, key: true, data: true, sortOrder: true },
    });
    return block as ContentBlock | null;
  } catch {
    return null;
  }
}

export async function getSiteConfig(): Promise<Record<string, unknown>> {
  try {
    const s = await prisma.siteSettings.findUnique({ where: { key: "store_config" } });
    return (s?.extraData as Record<string, unknown>) ?? {};
  } catch {
    return {};
  }
}

// ─── Typed content types ──────────────────────────────────────────────────────

export interface HeroContent {
  headline:          string;
  subheadline:       string;
  tagline:           string;
  ctaText:           string;
  ctaUrl:            string;
  secondaryCtaText:  string;
  secondaryCtaUrl:   string;
  desktopImageUrl:   string;
  mobileImageUrl:    string;
  badgeText:         string;
  showBadge:         boolean;
}

export interface TrustItem {
  emoji:    string;
  title:    string;
  subtitle: string;
}

export interface FooterLink {
  label: string;
  url:   string;
}

export interface FooterColumn {
  heading: string;
  links:   FooterLink[];
}

export interface AnnouncementItem {
  id:            string;
  message:       string;
  ctaText:       string | null;
  ctaUrl:        string | null;
}

export interface HomepageSection {
  key:       string;
  isActive:  boolean;
  sortOrder: number;
}

// ─── Defaults (shown when DB has no content yet) ──────────────────────────────

export const DEFAULT_HERO: HeroContent = {
  headline:         "Gear Up. Play Your Best.",
  subheadline:      "Premium Jerseys & Sports Essentials at Best Prices",
  tagline:          "PLAY. TRAIN. WIN.",
  ctaText:          "Shop Now",
  ctaUrl:           "/products",
  secondaryCtaText: "Best Deals 🔥",
  secondaryCtaUrl:  "/products?filter=sale",
  desktopImageUrl:  "/hero-desktop.png",
  mobileImageUrl:   "/hero-mobile.png",
  badgeText:        "New Season 2025",
  showBadge:        true,
};

export const DEFAULT_TRUST: TrustItem[] = [
  { emoji: "🛡️", title: "Official Quality",  subtitle: "Licensed & Verified Products" },
  { emoji: "🚚", title: "Fast Delivery",      subtitle: "Ships Across India" },
  { emoji: "↩️", title: "Easy Returns",       subtitle: "7-Day Hassle-Free Returns" },
  { emoji: "🔒", title: "Secure Checkout",    subtitle: "UPI, Cards & COD" },
];

export const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: "Shop",
    links: [
      { label: "Cricket",       url: "/products?sport=cricket" },
      { label: "Football",      url: "/products?sport=football" },
      { label: "Gym & Fitness", url: "/products?sport=gym" },
      { label: "Running",       url: "/products?sport=running" },
      { label: "New Arrivals",  url: "/products?sort=newest" },
      { label: "Sale",          url: "/products?sale=1" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "FAQ",             url: "/faq" },
      { label: "Shipping Policy", url: "/shipping" },
      { label: "Returns & Refunds", url: "/returns" },
      { label: "Track My Order",  url: "/orders" },
      { label: "Contact Us",      url: "/contact" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About TRYBY",     url: "/about" },
      { label: "Partner Program", url: "/supplier/apply" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy",   url: "/privacy-policy" },
      { label: "Terms & Conditions", url: "/terms" },
      { label: "Cookie Policy",    url: "/cookies" },
      { label: "Disclaimer",       url: "/disclaimer" },
    ],
  },
];

// ─── Cached fetchers (ISR — 60 s, tag-invalidated on admin save) ──────────────

export const getHeroContent = unstable_cache(
  async (): Promise<HeroContent> => {
    try {
      const block = await prisma.contentBlock.findFirst({
        where: { key: "homepage_hero", isActive: true, status: "PUBLISHED" },
      });
      if (!block) return DEFAULT_HERO;
      return { ...DEFAULT_HERO, ...(block.data as Partial<HeroContent>) };
    } catch {
      return DEFAULT_HERO;
    }
  },
  ["homepage_hero"],
  { revalidate: 60, tags: ["content", "homepage_hero"] }
);

export const getTrustBarContent = unstable_cache(
  async (): Promise<TrustItem[]> => {
    try {
      const block = await prisma.contentBlock.findFirst({
        where: { key: "homepage_trust_bar", isActive: true, status: "PUBLISHED" },
      });
      if (!block) return DEFAULT_TRUST;
      const data = block.data as { items?: TrustItem[] };
      return data.items?.length ? data.items : DEFAULT_TRUST;
    } catch {
      return DEFAULT_TRUST;
    }
  },
  ["homepage_trust_bar"],
  { revalidate: 60, tags: ["content", "homepage_trust_bar"] }
);

export const getFooterColumns = unstable_cache(
  async (): Promise<FooterColumn[]> => {
    try {
      const block = await prisma.contentBlock.findFirst({
        where: { key: "footer_columns", isActive: true, status: "PUBLISHED" },
      });
      if (!block) return DEFAULT_FOOTER_COLUMNS;
      const data = block.data as { columns?: FooterColumn[] };
      return data.columns?.length ? data.columns : DEFAULT_FOOTER_COLUMNS;
    } catch {
      return DEFAULT_FOOTER_COLUMNS;
    }
  },
  ["footer_columns"],
  { revalidate: 60, tags: ["content", "footer_columns"] }
);

export const getAnnouncements = unstable_cache(
  async (): Promise<AnnouncementItem[]> => {
    try {
      const now = new Date();
      return prisma.announcementMessage.findMany({
        where: {
          isActive:  true,
          validFrom: { lte: now },
          OR: [{ validUntil: null }, { validUntil: { gte: now } }],
        },
        orderBy: { sortOrder: "asc" },
        select:  { id: true, message: true, ctaText: true, ctaUrl: true },
      });
    } catch {
      return [];
    }
  },
  ["announcements"],
  { revalidate: 60, tags: ["announcements"] }
);

export const getHomepageSections = unstable_cache(
  async (): Promise<HomepageSection[]> => {
    try {
      const block = await prisma.contentBlock.findFirst({
        where: { key: "homepage_sections", status: "PUBLISHED" },
      });
      if (!block) return defaultSections();
      const data = block.data as { sections?: HomepageSection[] };
      return data.sections?.length ? data.sections : defaultSections();
    } catch {
      return defaultSections();
    }
  },
  ["homepage_sections"],
  { revalidate: 60, tags: ["content", "homepage_sections"] }
);

function defaultSections(): HomepageSection[] {
  return [
    { key: "hero",       isActive: true, sortOrder: 0 },
    { key: "categories", isActive: true, sortOrder: 1 },
    { key: "trending",   isActive: true, sortOrder: 2 },
    { key: "trust",      isActive: true, sortOrder: 3 },
  ];
}

export const getHomepageSEO = unstable_cache(
  async () => {
    try {
      return prisma.siteSettings.findUnique({ where: { key: "seo_home" } });
    } catch {
      return null;
    }
  },
  ["seo_home"],
  { revalidate: 300, tags: ["seo", "seo_home"] }
);

export const getTrendingProducts = unstable_cache(
  async (limit = 8) => {
    try {
      return prisma.product.findMany({
        where: {
          isActive: true,
          badges:   { some: { type: "TRENDING" } },
        },
        include: {
          images:   { where: { isPrimary: true }, take: 1 },
          variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
          badges:   true,
        },
        orderBy: { weeklySoldCount: "desc" },
        take:    limit,
      });
    } catch {
      return [];
    }
  },
  ["trending_products"],
  { revalidate: 120, tags: ["products", "trending"] }
);
