import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

/**
 * Deep link resolver for TRYBY mobile app.
 *
 * The app opens any tryby:// or https://tryby.in link and calls this endpoint
 * to resolve the canonical screen + params. This decouples the URL scheme from
 * the mobile app — the server can change routing without an app update.
 *
 * Supported paths:
 *   /products/:slug          → screen: product, params: { slug }
 *   /products                → screen: catalog
 *   /categories/:slug        → screen: category, params: { slug }
 *   /orders/:id              → screen: order_detail, params: { orderId }
 *   /account/orders          → screen: orders
 *   /account                 → screen: profile
 *   /cart                    → screen: cart
 *   /checkout                → screen: checkout
 *   /suppliers/:slug         → screen: supplier, params: { slug }
 *   /community               → screen: reviews
 *   /search?q=               → screen: search, params: { query }
 *   /coupons/:code           → screen: apply_coupon, params: { code }
 *   /referral/:code          → screen: referral, params: { code }
 *   /returns/:id             → screen: return_detail, params: { returnId }
 *   / (home)                 → screen: home
 */

const schema = z.object({
  url:  z.string().min(1),
  path: z.string().optional(), // Alternative: pass just the path
});

interface DeepLinkResult {
  screen:    string;
  params:    Record<string, string>;
  webFallback: string;
  meta?: {
    title?:    string;
    imageUrl?: string;
    description?: string;
  };
}

export async function POST(req: NextRequest) {
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const rawUrl = body.data.path ?? body.data.url;

  // Normalise — strip scheme and host
  let path: string;
  try {
    const parsed = new URL(rawUrl.startsWith("http") ? rawUrl : `https://tryby.in${rawUrl}`);
    path = parsed.pathname + (parsed.search ? parsed.search : "");
  } catch {
    path = rawUrl;
  }

  const result = await resolveDeepLink(path);
  return NextResponse.json(result);
}

// GET — quick resolve via query param: /api/v1/deeplink?url=/products/cricket-bat
export async function GET(req: NextRequest) {
  const url  = req.nextUrl.searchParams.get("url") ?? req.nextUrl.searchParams.get("path") ?? "/";
  const result = await resolveDeepLink(url);
  return NextResponse.json(result);
}

async function resolveDeepLink(path: string): Promise<DeepLinkResult> {
  const fallback = (screen: string, params: Record<string, string> = {}): DeepLinkResult => ({
    screen,
    params,
    webFallback: `https://tryby.in${path}`,
  });

  // /products/:slug
  const productMatch = path.match(/^\/products\/([^/?#]+)/);
  if (productMatch) {
    const slug = productMatch[1];
    const product = await prisma.product.findUnique({
      where:  { slug },
      select: { name: true, images: { take: 1 } },
    }).catch(() => null);

    return {
      screen:      "product",
      params:      { slug },
      webFallback: `https://tryby.in/products/${slug}`,
      meta: product ? {
        title:    product.name,
        imageUrl: (product.images as string[])[0] ?? undefined,
      } : undefined,
    };
  }

  // /categories/:slug
  const catMatch = path.match(/^\/categories\/([^/?#]+)/);
  if (catMatch) {
    const slug = catMatch[1];
    const cat  = await prisma.category.findUnique({
      where:  { slug },
      select: { name: true, imageUrl: true },
    }).catch(() => null);

    return {
      screen:      "category",
      params:      { slug },
      webFallback: `https://tryby.in/categories/${slug}`,
      meta: cat ? { title: cat.name, imageUrl: cat.imageUrl ?? undefined } : undefined,
    };
  }

  // /suppliers/:slug
  const supplierMatch = path.match(/^\/suppliers\/([^/?#]+)/);
  if (supplierMatch) {
    return { screen: "supplier", params: { slug: supplierMatch[1] }, webFallback: `https://tryby.in${path}` };
  }

  // /orders/:id
  const orderMatch = path.match(/^\/account\/orders\/([^/?#]+)/);
  if (orderMatch) {
    return { screen: "order_detail", params: { orderId: orderMatch[1] }, webFallback: `https://tryby.in${path}` };
  }

  // /returns/:id
  const returnMatch = path.match(/^\/returns\/([^/?#]+)/);
  if (returnMatch) {
    return { screen: "return_detail", params: { returnId: returnMatch[1] }, webFallback: `https://tryby.in${path}` };
  }

  // /coupons/:code or ?coupon=
  const couponMatch = path.match(/^\/coupons\/([^/?#]+)/);
  const couponParam = new URL(`https://x.com${path}`).searchParams.get("coupon");
  if (couponMatch || couponParam) {
    const code = couponMatch?.[1] ?? couponParam ?? "";
    return { screen: "apply_coupon", params: { code }, webFallback: `https://tryby.in${path}` };
  }

  // /referral/:code
  const referralMatch = path.match(/^\/referral\/([^/?#]+)/);
  if (referralMatch) {
    return { screen: "referral", params: { code: referralMatch[1] }, webFallback: `https://tryby.in${path}` };
  }

  // /search
  if (path.startsWith("/search")) {
    const q = new URL(`https://x.com${path}`).searchParams.get("q") ?? "";
    return { screen: "search", params: { query: q }, webFallback: `https://tryby.in${path}` };
  }

  // Static routes
  const staticMap: Record<string, string> = {
    "/":                  "home",
    "/cart":              "cart",
    "/checkout":          "checkout",
    "/account":           "profile",
    "/account/orders":    "orders",
    "/account/wishlist":  "wishlist",
    "/account/loyalty":   "loyalty",
    "/account/referral":  "referral_home",
    "/account/returns":   "returns",
    "/community":         "reviews",
    "/products":          "catalog",
    "/new-arrivals":      "new_arrivals",
    "/trending":          "trending",
  };

  const cleanPath = path.split("?")[0];
  const screen    = staticMap[cleanPath] ?? "home";
  return fallback(screen);
}
