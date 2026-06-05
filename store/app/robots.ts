import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/auth/",
          "/account/",
          "/cart",
          "/checkout",
          "/checkout/payment",
          "/order-success",
          "/order-failed",
          "/wishlist",
          "/orders",
          "/splash",
          "/maintenance",
          "/_next/",
        ],
      },
      // Block AI training scrapers
      { userAgent: "GPTBot",        disallow: ["/"] },
      { userAgent: "ChatGPT-User",  disallow: ["/"] },
      { userAgent: "CCBot",         disallow: ["/"] },
      { userAgent: "anthropic-ai",  disallow: ["/"] },
      { userAgent: "Claude-Web",    disallow: ["/"] },
    ],
    sitemap: "https://www.tryby.in/sitemap.xml",
    host: "https://www.tryby.in",
  };
}
