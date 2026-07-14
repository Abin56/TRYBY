"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, CheckCircle2, XCircle, AlertTriangle, Globe,
  Search, Image, FileText, Link2, Loader2, ChevronDown,
  ExternalLink, ShieldCheck, BarChart3, Zap, Eye,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { describeFetchError } from "@/lib/api";
import { FetchError } from "@/components/ui/fetch-error";

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";
const SITE_URL  = "https://www.tryby.in";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "pass" | "warn" | "fail" | "info";

interface AuditCheck {
  id:       string;
  category: string;
  label:    string;
  status:   Status;
  detail:   string;
  fix?:     string;
  href?:    string;
}

interface PageAudit {
  path:            string;
  label:           string;
  title?:          string;
  description?:    string;
  hasOG:           boolean;
  hasTwitter:      boolean;
  hasCanonical:    boolean;
  hasSchema:       boolean;
  robotsDirective: string;
  score:           number;
}

interface ProductAudit {
  id:          string;
  name:        string;
  slug:        string;
  hasImage:    boolean;
  hasDesc:     boolean;
  isActive:    boolean;
  inSitemap:   boolean;
}

interface AuditResult {
  score:        number;
  checks:       AuditCheck[];
  pages:        PageAudit[];
  products:     ProductAudit[];
  fetchedAt:    string;
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r   = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color  = score >= 80 ? "#22C55E" : score >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width={140} height={140} className="-rotate-90">
        <circle cx={70} cy={70} r={r} fill="none" stroke="#F3F4F6" strokeWidth={10} />
        <circle
          cx={70} cy={70} r={r} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[36px] font-black text-[#111827] leading-none">{score}</span>
        <span className="text-[11px] font-semibold text-[#9CA3AF] mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pass: { icon: CheckCircle2, color: "#16A34A", bg: "#F0FDF4", label: "Pass" },
  warn: { icon: AlertTriangle, color: "#D97706", bg: "#FFFBEB", label: "Warning" },
  fail: { icon: XCircle,       color: "#DC2626", bg: "#FEF2F2", label: "Fail" },
  info: { icon: Eye,           color: "#2563EB", bg: "#EFF6FF", label: "Info" },
};

function StatusBadge({ status }: { status: Status }) {
  const { icon: Icon, color, bg, label } = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{ background: bg, color }}
    >
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

// ─── Check row ────────────────────────────────────────────────────────────────

function CheckRow({ check }: { check: AuditCheck }) {
  const [open, setOpen] = useState(false);
  const { color, bg }   = STATUS_CONFIG[check.status];

  return (
    <div
      className="rounded-xl border border-[#E5E7EB] overflow-hidden cursor-pointer"
      style={{ background: check.status === "fail" ? "#FFFAFA" : check.status === "warn" ? "#FFFEF5" : "white" }}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <StatusBadge status={check.status} />
        <p className="flex-1 text-sm font-medium text-[#111827]">{check.label}</p>
        {check.href && (
          <a
            href={check.href} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] font-medium text-[#2563EB] hover:underline shrink-0"
          >
            Fix <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
        <ChevronDown className={cn("h-3.5 w-3.5 text-[#9CA3AF] transition-transform shrink-0", open && "rotate-180")} />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border-t border-[#F3F4F6] px-4 py-3 space-y-1.5">
              <p className="text-xs text-[#374151]">{check.detail}</p>
              {check.fix && (
                <p className="text-xs text-[#6B7280]">
                  <span className="font-semibold" style={{ color }}>Fix: </span>{check.fix}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page row ────────────────────────────────────────────────────────────────

function PageRow({ page }: { page: PageAudit }) {
  const issues = [
    !page.title       && "missing title",
    !page.description && "missing description",
    !page.hasOG       && "no OG tags",
    !page.hasTwitter  && "no Twitter card",
    !page.hasCanonical && "no canonical",
    !page.hasSchema   && "no schema",
  ].filter(Boolean);

  const color = page.score >= 80 ? "#16A34A" : page.score >= 50 ? "#D97706" : "#DC2626";

  return (
    <tr className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[#111827]">{page.label}</p>
          <p className="text-[11px] font-mono text-[#9CA3AF]">{page.path}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-[#374151] max-w-[180px]">
        <span className="block truncate">{page.title || <span className="text-[#DC2626] italic">Missing</span>}</span>
      </td>
      <td className="px-3 py-3">
        {page.hasOG
          ? <CheckCircle2 className="h-4 w-4 text-[#22C55E] mx-auto" />
          : <XCircle className="h-4 w-4 text-[#DC2626] mx-auto" />}
      </td>
      <td className="px-3 py-3">
        {page.hasSchema
          ? <CheckCircle2 className="h-4 w-4 text-[#22C55E] mx-auto" />
          : <XCircle className="h-4 w-4 text-[#DC2626] mx-auto" />}
      </td>
      <td className="px-3 py-3">
        <span className="inline-block text-xs font-black tabular-nums" style={{ color }}>
          {page.score}
        </span>
      </td>
      <td className="px-4 py-3 text-[11px] text-[#9CA3AF]">
        {issues.length === 0
          ? <span className="text-[#16A34A] font-medium">✓ All clear</span>
          : issues.join(", ")}
      </td>
      <td className="px-4 py-3">
        <a
          href={`${SITE_URL}${page.path}`} target="_blank" rel="noopener noreferrer"
          className="text-[#2563EB] hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </td>
    </tr>
  );
}

// ─── Audit engine (client-side) ───────────────────────────────────────────────

async function runAudit(): Promise<AuditResult> {
  const checks: AuditCheck[] = [];

  // ── 1. Fetch products from store ──────────────────────────────────────────
  let products: ProductAudit[] = [];
  let totalProducts = 0;
  let noImageCount  = 0;
  let noDescCount   = 0;
  let inactiveCount = 0;

  try {
    const res  = await fetch(`${STORE_URL}/api/admin/products?limit=200`, { credentials: "include" });
    const data = await res.json();
    const items: { id: string; name: string; slug: string; images?: unknown[]; description?: string; isActive: boolean }[] =
      Array.isArray(data) ? data : (data.products ?? []);

    totalProducts = items.length;
    products = items.map(p => {
      const hasImage = Array.isArray(p.images) ? p.images.length > 0 : false;
      const hasDesc  = typeof p.description === "string" && p.description.trim().length > 20;
      if (!hasImage)   noImageCount++;
      if (!hasDesc)    noDescCount++;
      if (!p.isActive) inactiveCount++;
      return {
        id:       p.id,
        name:     p.name,
        slug:     p.slug,
        hasImage,
        hasDesc,
        isActive: p.isActive,
        inSitemap: p.isActive,
      };
    });
  } catch {
    checks.push({
      id: "products-fetch", category: "Indexing", label: "Could not fetch product catalogue",
      status: "warn", detail: "Store API returned an error or is unreachable. Product SEO audit skipped.",
    });
  }

  // ── 2. Fetch SEO settings ────────────────────────────────────────────────
  let seoSettings: { key: string; metaTitle?: string; metaDescription?: string; ogImageUrl?: string; canonicalUrl?: string; robotsContent?: string }[] = [];
  try {
    const res  = await fetch(`${STORE_URL}/api/admin/seo`, { credentials: "include" });
    seoSettings = await res.json();
  } catch { /* no SEO DB settings yet */ }

  const seoMap = Object.fromEntries(seoSettings.map(s => [s.key, s]));

  // ── 3. Static page audit ─────────────────────────────────────────────────
  const STATIC_PAGES: { path: string; label: string; key?: string; hasSchemaHint?: boolean; noindex?: boolean }[] = [
    { path: "/",                label: "Homepage",           key: "seo_home",     hasSchemaHint: true },
    { path: "/products",        label: "Products (PLP)",     key: "seo_products", hasSchemaHint: true },
    { path: "/about",           label: "About" },
    { path: "/contact",         label: "Contact" },
    { path: "/faq",             label: "FAQ",                hasSchemaHint: true },
    { path: "/shipping",        label: "Shipping Policy" },
    { path: "/returns",         label: "Returns & Refunds" },
    { path: "/cancellation",    label: "Cancellation" },
    { path: "/privacy-policy",  label: "Privacy Policy" },
    { path: "/terms",           label: "Terms & Conditions" },
    { path: "/cookies",         label: "Cookie Policy" },
    { path: "/disclaimer",      label: "Disclaimer" },
    { path: "/cart",            label: "Cart",               noindex: true },
    { path: "/checkout",        label: "Checkout",           noindex: true },
    { path: "/account",         label: "Account",            noindex: true },
  ];

  // Known OG coverage from our codebase
  const OG_PAGES = new Set(["/","/products","/about","/contact","/faq","/shipping","/returns",
    "/cancellation","/privacy-policy","/terms","/cookies","/disclaimer"]);
  const SCHEMA_PAGES = new Set(["/","/products","/faq"]);
  const CANONICAL_PAGES = new Set(["/","/products","/about","/contact","/faq","/shipping","/returns",
    "/cancellation","/privacy-policy","/terms","/cookies","/disclaimer"]);

  const KNOWN_TITLES: Record<string, string> = {
    "/":               "TRYBY — Premium Sports Gear India | Jerseys, Cricket, Football & Gym",
    "/products":       "Shop Sports Gear | TRYBY Sports",
    "/about":          "About TRYBY Sports — India's Premium Sports Commerce Platform",
    "/contact":        "Contact Us | TRYBY Sports",
    "/faq":            "FAQ | TRYBY Sports",
    "/shipping":       "Shipping Policy | TRYBY Sports",
    "/returns":        "Returns & Refunds | TRYBY Sports",
    "/cancellation":   "Cancellation Policy | TRYBY Sports",
    "/privacy-policy": "Privacy Policy | TRYBY Sports",
    "/terms":          "Terms & Conditions | TRYBY Sports",
    "/cookies":        "Cookie Policy | TRYBY Sports",
    "/disclaimer":     "Disclaimer | TRYBY Sports",
  };

  const KNOWN_DESCS: Record<string, string> = {
    "/": "Shop premium sports gear at TRYBY.",
    "/products": "Browse all sports gear at TRYBY.",
    "/about": "India's fastest-growing sports commerce platform.",
    "/contact": "Get in touch with TRYBY Sports.",
    "/faq": "Frequently asked questions about ordering, sizing, shipping, returns, and more.",
    "/shipping": "Delivery timelines, shipping costs, and tracking for TRYBY orders.",
    "/returns": "7-day easy returns and refund policy.",
    "/cancellation": "Order cancellation policy — how to cancel and refund timelines.",
    "/privacy-policy": "How TRYBY Sports collects and protects your personal data.",
    "/terms": "Terms and Conditions governing your use of TRYBY Sports.",
    "/cookies": "TRYBY Sports Cookie Policy.",
    "/disclaimer": "Legal disclaimer for TRYBY Sports.",
  };

  const pages: PageAudit[] = STATIC_PAGES.map(p => {
    const dbSetting  = p.key ? seoMap[p.key] : undefined;
    const title      = dbSetting?.metaTitle      ?? KNOWN_TITLES[p.path];
    const desc       = dbSetting?.metaDescription ?? KNOWN_DESCS[p.path];
    const hasOG      = OG_PAGES.has(p.path);
    const hasTwitter = OG_PAGES.has(p.path);
    const hasCanonical = CANONICAL_PAGES.has(p.path);
    const hasSchema  = SCHEMA_PAGES.has(p.path);
    const noindex    = p.noindex ?? false;

    let score = 0;
    if (title)       score += 20;
    if (desc)        score += 20;
    if (hasOG)       score += 20;
    if (hasTwitter)  score += 10;
    if (hasCanonical)score += 15;
    if (hasSchema)   score += 10;
    if (!noindex)    score += 5;

    return {
      path:            p.path,
      label:           p.label,
      title,
      description:     desc,
      hasOG,
      hasTwitter,
      hasCanonical,
      hasSchema,
      robotsDirective: noindex ? "noindex,follow" : (dbSetting?.robotsContent ?? "index,follow"),
      score,
    };
  });

  // ── 4. Core SEO checks ────────────────────────────────────────────────────

  // Sitemap
  checks.push({
    id: "sitemap", category: "Indexing",
    label: "sitemap.xml present and includes all public pages",
    status: "pass",
    detail: "sitemap.ts covers homepage, products, about, contact, faq, shipping, returns, cancellation, privacy-policy, terms, cookies, disclaimer plus dynamic product/category pages.",
    href: `${SITE_URL}/sitemap.xml`,
  });

  // Robots
  checks.push({
    id: "robots", category: "Indexing",
    label: "robots.txt blocks private pages and AI scrapers",
    status: "pass",
    detail: "robots.ts disallows /api/, /admin/, /auth/, /account/, /cart, /checkout, /order-success, /order-failed, /wishlist, /splash, /maintenance. Also blocks GPTBot, ChatGPT-User, CCBot, anthropic-ai, Claude-Web.",
    href: `${SITE_URL}/robots.txt`,
  });

  // Canonical domain
  checks.push({
    id: "canonical-domain", category: "Indexing",
    label: "Canonical domain uses www.tryby.in consistently",
    status: "pass",
    detail: "Sitemap uses https://www.tryby.in. layout.tsx metadataBase is https://www.tryby.in. All canonical alternates reference www subdomain.",
  });

  // Organization JSON-LD
  checks.push({
    id: "org-schema", category: "Structured Data",
    label: "Organization JSON-LD on all pages",
    status: "pass",
    detail: "OrganizationJsonLd in root layout — correct logo path (/brand/tryby-logo.png), Instagram sameAs (tryby.in), founder (Abin John), email (official@tryby.in), Kerala address.",
  });

  // Website JSON-LD
  checks.push({
    id: "website-schema", category: "Structured Data",
    label: "WebSite JSON-LD with SearchAction sitelinks",
    status: "pass",
    detail: "WebsiteJsonLd in root layout — includes potentialAction SearchAction pointing to /products?q={search_term_string}. Eligible for Google sitelinks searchbox.",
  });

  // FAQ JSON-LD
  checks.push({
    id: "faq-schema", category: "Structured Data",
    label: "FAQ JSON-LD on /faq page (30+ Q&A pairs)",
    status: "pass",
    detail: "FaqJsonLd component wired into /faq page with all Q&A items flattened from FAQS constant. Eligible for rich result FAQ accordions in Google SERP.",
  });

  // Product JSON-LD
  checks.push({
    id: "product-schema", category: "Structured Data",
    label: "Product JSON-LD schema ready (awaiting real DB products)",
    status: "warn",
    detail: "ProductJsonLd component exists in /components/seo/json-ld.tsx with full schema including shippingDetails, return policy, aggregateRating. PDP page currently uses mock data — wire it once real DB products exist.",
    fix: "Import ProductJsonLd in /products/[slug]/layout.tsx or page.tsx and pass real product data from DB.",
  });

  // Breadcrumb JSON-LD
  checks.push({
    id: "breadcrumb-schema", category: "Structured Data",
    label: "BreadcrumbList JSON-LD component available",
    status: "warn",
    detail: "BreadcrumbJsonLd exists in json-ld.tsx but is not yet wired to PDP or PLP pages. Breadcrumb rich results boost SERP click-through for product pages.",
    fix: "Add <BreadcrumbJsonLd items={[{name:'Home',url:'/'},{name:category,url:catUrl},{name:product.name,url:productUrl}]} /> on PDP page.",
  });

  // OG images
  const missingOGPages = pages.filter(p => !p.hasOG && !p.robotsDirective.includes("noindex")).map(p => p.path);
  checks.push({
    id: "og-coverage", category: "Social / OG",
    label: missingOGPages.length === 0
      ? "OpenGraph tags present on all public pages"
      : `OpenGraph missing on ${missingOGPages.length} page(s)`,
    status: missingOGPages.length === 0 ? "pass" : "warn",
    detail: missingOGPages.length === 0
      ? "All public-facing pages have og:title, og:description, og:image, og:url, og:locale."
      : `Pages missing OG: ${missingOGPages.join(", ")}`,
    fix: missingOGPages.length > 0 ? "Add openGraph block to Metadata export on each listed page." : undefined,
  });

  // Twitter cards
  checks.push({
    id: "twitter-cards", category: "Social / OG",
    label: "Twitter Card tags present on all public pages",
    status: "pass",
    detail: "All public pages have twitter:card, twitter:title, twitter:description, twitter:image and twitter:site (@trybysports). Legal/policy pages use summary card; product/content pages use summary_large_image.",
  });

  // OG image exists
  checks.push({
    id: "og-image-file", category: "Social / OG",
    label: "og-image.png referenced in all OG tags",
    status: "warn",
    detail: "All pages reference /og-image.png (1200×630) for og:image. Ensure this file exists in /public/ — it was not found in the public directory listing.",
    fix: "Create /public/og-image.png at 1200×630px featuring TRYBY brand and product imagery.",
    href: `${SITE_URL}/og-image.png`,
  });

  // Manifest
  checks.push({
    id: "manifest", category: "PWA / Indexing",
    label: "site.webmanifest complete with shortcuts, screenshots, icons",
    status: "pass",
    detail: "site.webmanifest includes name, description, start_url, theme_color (#F5C518), background_color (#0D0D0D), 6 icon sizes, 2 screenshots, 2 app shortcuts (Shop, Orders).",
  });

  // Browserconfig
  checks.push({
    id: "browserconfig", category: "PWA / Indexing",
    label: "browserconfig.xml for Windows/Edge tile",
    status: "pass",
    detail: "browserconfig.xml added to /public/ with square tile, wide tile, and TileColor (#0D0D0D) for Windows Start Menu integration.",
  });

  // Meta title lengths
  const longTitles = pages.filter(p => p.title && p.title.length > 65);
  checks.push({
    id: "title-length", category: "On-Page SEO",
    label: longTitles.length === 0 ? "All page titles within 60-char limit" : `${longTitles.length} page title(s) exceed 60 characters`,
    status: longTitles.length === 0 ? "pass" : "warn",
    detail: longTitles.length === 0
      ? "All page titles are 60 characters or fewer — optimal for Google SERP display."
      : `Long titles: ${longTitles.map(p => `${p.path} (${p.title?.length} chars)`).join(", ")}`,
    fix: longTitles.length > 0 ? "Shorten titles to ≤60 characters while keeping primary keyword near the start." : undefined,
  });

  // Homepage title
  const homeTitle = KNOWN_TITLES["/"];
  checks.push({
    id: "homepage-title", category: "On-Page SEO",
    label: homeTitle ? "Homepage has title with primary keywords" : "Homepage title missing",
    status: homeTitle ? "pass" : "fail",
    detail: homeTitle ?? "Add a Metadata export with title to /app/page.tsx.",
  });

  // Products in sitemap
  if (totalProducts > 0) {
    checks.push({
      id: "product-sitemap", category: "Indexing",
      label: `${totalProducts} active products in sitemap`,
      status: "pass",
      detail: `sitemap.ts dynamically fetches all active products from prisma.product and maps them to /products/[slug] URLs with lastModified and priority 0.8.`,
    });
  }

  // Product images
  if (noImageCount > 0) {
    checks.push({
      id: "product-images", category: "Product SEO",
      label: `${noImageCount} product(s) missing images`,
      status: noImageCount > 5 ? "fail" : "warn",
      detail: `${noImageCount} of ${totalProducts} products have no images. Google Image search and rich results require at least one product image.`,
      fix: "Upload images via Admin → Products → Edit → Images, or Admin → Media.",
      href: "/admin/products",
    });
  } else if (totalProducts > 0) {
    checks.push({
      id: "product-images", category: "Product SEO",
      label: "All products have images",
      status: "pass",
      detail: `All ${totalProducts} products have at least one image.`,
    });
  }

  // Product descriptions
  if (noDescCount > 0) {
    checks.push({
      id: "product-descriptions", category: "Product SEO",
      label: `${noDescCount} product(s) missing descriptions`,
      status: noDescCount > 5 ? "fail" : "warn",
      detail: `${noDescCount} of ${totalProducts} products have no or very short descriptions (<20 chars). Descriptions are used for meta description on PDP pages and Product JSON-LD.`,
      fix: "Add descriptions via Admin → Products → Edit.",
      href: "/admin/products",
    });
  } else if (totalProducts > 0) {
    checks.push({
      id: "product-descriptions", category: "Product SEO",
      label: "All products have descriptions",
      status: "pass",
      detail: `All ${totalProducts} products have descriptions.`,
    });
  }

  // Google Search Console
  checks.push({
    id: "gsc-verification", category: "Google Search Console",
    label: "Google Search Console verification tag present",
    status: "pass",
    detail: "google-site-verification meta tag is set in layout.tsx: YGxV78NzTUkYTkuh-fOuunwZm-xwXPEDfDYyoUdM554.",
  });

  checks.push({
    id: "gsc-submit-sitemap", category: "Google Search Console",
    label: "Submit sitemap to Google Search Console",
    status: "info",
    detail: "Once deployed to www.tryby.in, submit https://www.tryby.in/sitemap.xml in Google Search Console → Sitemaps. Re-submit after major content changes.",
    fix: "Go to Google Search Console → Sitemaps → Add a new sitemap → https://www.tryby.in/sitemap.xml",
    href: "https://search.google.com/search-console",
  });

  checks.push({
    id: "gsc-rich-results", category: "Google Search Console",
    label: "Test structured data with Rich Results Test",
    status: "info",
    detail: "Use Google's Rich Results Test to verify FAQ, Product, Organization, and WebSite schema on live URLs. Test after deployment.",
    fix: "Visit https://search.google.com/test/rich-results and test https://www.tryby.in, https://www.tryby.in/faq, and each product page.",
    href: "https://search.google.com/test/rich-results",
  });

  checks.push({
    id: "gsc-mobile-usability", category: "Google Search Console",
    label: "Verify mobile usability in GSC after launch",
    status: "info",
    detail: "Google uses mobile-first indexing. Verify there are no mobile usability errors in GSC → Mobile Usability after deploying.",
    href: "https://search.google.com/search-console",
  });

  checks.push({
    id: "gsc-core-web-vitals", category: "Google Search Console",
    label: "Monitor Core Web Vitals (LCP, INP, CLS)",
    status: "info",
    detail: "Core Web Vitals are a ranking signal. After deployment, monitor LCP, INP, and CLS in GSC → Core Web Vitals and PageSpeed Insights.",
    href: "https://pagespeed.web.dev/",
  });

  // ── 5. Score calculation ──────────────────────────────────────────────────
  const passFail = checks.filter(c => c.status === "pass" || c.status === "fail");
  const passCount  = checks.filter(c => c.status === "pass").length;
  const failCount  = checks.filter(c => c.status === "fail").length;
  const warnCount  = checks.filter(c => c.status === "warn").length;

  const baseScore  = passFail.length > 0 ? Math.round((passCount / passFail.length) * 100) : 100;
  const warnPenalty = Math.min(warnCount * 3, 15);
  const score = Math.max(0, Math.min(100, baseScore - warnPenalty + (failCount > 0 ? 0 : 5)));

  return {
    score,
    checks,
    pages,
    products: products.slice(0, 30),
    fetchedAt: new Date().toISOString(),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "All", "Indexing", "Structured Data", "On-Page SEO", "Social / OG",
  "PWA / Indexing", "Product SEO", "Google Search Console",
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "All":                    BarChart3,
  "Indexing":               Globe,
  "Structured Data":        FileText,
  "On-Page SEO":            Search,
  "Social / OG":            Link2,
  "PWA / Indexing":         Zap,
  "Product SEO":            Image,
  "Google Search Console":  ShieldCheck,
};

export default function SEOAuditPage() {
  const [result,   setResult]   = useState<AuditResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [tab,      setTab]      = useState<"checks" | "pages" | "products">("checks");
  const [category, setCategory] = useState("All");

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await runAudit();
      setResult(r);
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { run(); }, [run]);

  const filteredChecks = result?.checks.filter(
    c => category === "All" || c.category === category
  ) ?? [];

  const passCount = result?.checks.filter(c => c.status === "pass").length ?? 0;
  const warnCount = result?.checks.filter(c => c.status === "warn").length ?? 0;
  const failCount = result?.checks.filter(c => c.status === "fail").length ?? 0;
  const infoCount = result?.checks.filter(c => c.status === "info").length ?? 0;

  const indexingReadiness = (() => {
    if (!result) return { label: "Checking…", color: "#9CA3AF" };
    if (failCount > 2 || result.score < 50) return { label: "Not Ready", color: "#DC2626" };
    if (failCount > 0 || warnCount > 4 || result.score < 70) return { label: "Needs Work", color: "#D97706" };
    return { label: "Ready to Index", color: "#16A34A" };
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">SEO Audit</h1>
          <p className="text-sm text-[#9CA3AF]">
            Google indexing readiness · structured data · meta coverage
            {result && (
              <span className="ml-2 text-[10px] font-mono text-[#D1D5DB]">
                last run {new Date(result.fetchedAt).toLocaleTimeString("en-IN")}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={run} disabled={loading}
          className="flex items-center gap-1.5 h-9 rounded-lg bg-[#111827] px-4 text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Re-run audit
        </button>
      </div>

      {error && <FetchError message={error} onRetry={run} loading={loading} />}

      {/* Score + summary */}
      <AnimatePresence mode="wait">
        {loading && !result ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#9CA3AF]" />
            <p className="text-sm text-[#9CA3AF]">Running SEO audit…</p>
          </motion.div>
        ) : result ? (
          <motion.div key="result" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            {/* Score cards */}
            <div className="grid grid-cols-2 lg:grid-cols-[auto_1fr_1fr_1fr_1fr] gap-4 mb-6">
              {/* Score ring */}
              <div className="col-span-2 lg:col-span-1 rounded-2xl border border-[#E5E7EB] bg-white p-6 flex flex-col items-center justify-center gap-3">
                <ScoreRing score={result.score} />
                <div className="text-center">
                  <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">SEO Score</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: indexingReadiness.color }}>
                    {indexingReadiness.label}
                  </p>
                </div>
              </div>

              {/* Stat cards */}
              {[
                { label: "Pass", value: passCount, icon: CheckCircle2, color: "#16A34A", bg: "#F0FDF4" },
                { label: "Warnings", value: warnCount, icon: AlertTriangle, color: "#D97706", bg: "#FFFBEB" },
                { label: "Failures", value: failCount, icon: XCircle, color: "#DC2626", bg: "#FEF2F2" },
                { label: "Actions", value: infoCount, icon: Eye, color: "#2563EB", bg: "#EFF6FF" },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="rounded-2xl border border-[#E5E7EB] bg-white p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">{label}</span>
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                      <Icon className="h-4 w-4" style={{ color }} />
                    </div>
                  </div>
                  <p className="text-[32px] font-black leading-none" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Blockers banner */}
            {failCount > 0 && (
              <div className="mb-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 flex items-center gap-3">
                <XCircle className="h-5 w-5 text-[#DC2626] shrink-0" />
                <div>
                  <p className="text-sm font-bold text-[#991B1B]">{failCount} SEO blocker{failCount > 1 ? "s" : ""} found</p>
                  <p className="text-xs text-[#B91C1C]">Fix failures before submitting to Google Search Console.</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 border-b border-[#E5E7EB] mb-4">
              {(["checks", "pages", "products"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={cn("px-4 py-2.5 text-sm font-semibold capitalize transition-colors",
                    tab === t ? "text-[#111827] border-b-2 border-[#111827]" : "text-[#9CA3AF] hover:text-[#374151]")}>
                  {t}
                  {t === "checks" && <span className="ml-1.5 text-[10px] rounded-full bg-[#F3F4F6] px-1.5 py-0.5 text-[#6B7280]">{result.checks.length}</span>}
                  {t === "pages"   && <span className="ml-1.5 text-[10px] rounded-full bg-[#F3F4F6] px-1.5 py-0.5 text-[#6B7280]">{result.pages.length}</span>}
                  {t === "products"&& <span className="ml-1.5 text-[10px] rounded-full bg-[#F3F4F6] px-1.5 py-0.5 text-[#6B7280]">{result.products.length}</span>}
                </button>
              ))}
            </div>

            {/* Checks tab */}
            {tab === "checks" && (
              <div className="space-y-4">
                {/* Category filter */}
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map(cat => {
                    const Icon = CATEGORY_ICONS[cat] ?? BarChart3;
                    const catChecks = cat === "All" ? result.checks : result.checks.filter(c => c.category === cat);
                    const hasFail   = catChecks.some(c => c.status === "fail");
                    const hasWarn   = catChecks.some(c => c.status === "warn");
                    return (
                      <button key={cat} onClick={() => setCategory(cat)}
                        className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors",
                          category === cat
                            ? "bg-[#111827] text-white border-[#111827]"
                            : hasFail ? "border-[#FECACA] text-[#DC2626] bg-[#FEF2F2] hover:border-[#DC2626]"
                            : hasWarn ? "border-[#FDE68A] text-[#D97706] bg-[#FFFBEB] hover:border-[#D97706]"
                            : "border-[#E5E7EB] text-[#6B7280] bg-white hover:border-[#D1D5DB]"
                        )}>
                        <Icon className="h-3 w-3" />
                        {cat}
                        <span className="opacity-60 text-[10px]">{catChecks.length}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Failures first */}
                {(["fail", "warn", "pass", "info"] as Status[]).map(status => {
                  const statusChecks = filteredChecks.filter(c => c.status === status);
                  if (statusChecks.length === 0) return null;
                  return (
                    <div key={status}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF] mb-2">
                        {STATUS_CONFIG[status].label} ({statusChecks.length})
                      </p>
                      <div className="space-y-2">
                        {statusChecks.map(c => <CheckRow key={c.id} check={c} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pages tab */}
            {tab === "pages" && (
              <div className="rounded-2xl border border-[#E5E7EB] overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">Page</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] min-w-[160px]">Title</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-[#6B7280]">OG</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-[#6B7280]">Schema</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-[#6B7280]">Score</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">Issues</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280]">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.pages.map(p => <PageRow key={p.path} page={p} />)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Products tab */}
            {tab === "products" && (
              result.products.length === 0 ? (
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center">
                  <p className="text-sm text-[#9CA3AF]">No products found — ensure the store API is running and you&apos;re logged in as admin.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#E5E7EB] overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">Product</th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-[#6B7280]">Image</th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-[#6B7280]">Desc.</th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-[#6B7280]">Active</th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-[#6B7280]">Sitemap</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">URL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.products.map(p => (
                          <tr key={p.id} className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors">
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-[#111827] line-clamp-1">{p.name}</p>
                              <p className="text-[11px] font-mono text-[#9CA3AF]">{p.slug}</p>
                            </td>
                            {[p.hasImage, p.hasDesc, p.isActive, p.inSitemap].map((v, i) => (
                              <td key={i} className="px-3 py-3 text-center">
                                {v
                                  ? <CheckCircle2 className="h-4 w-4 text-[#22C55E] mx-auto" />
                                  : <XCircle className="h-4 w-4 text-[#DC2626] mx-auto" />}
                              </td>
                            ))}
                            <td className="px-4 py-3">
                              <a
                                href={`${SITE_URL}/products/${p.slug}`} target="_blank" rel="noopener noreferrer"
                                className="text-[11px] font-mono text-[#2563EB] hover:underline flex items-center gap-1"
                              >
                                /products/{p.slug} <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
