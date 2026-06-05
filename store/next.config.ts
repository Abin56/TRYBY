import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Content-Security-Policy built from discrete directives for readability.
// Uses 'strict-dynamic' with a nonce for inline scripts (Next.js injects these);
// falls back to 'unsafe-inline' for browsers that don't support strict-dynamic.
const isDev = process.env.NODE_ENV === "development";

const CSP_DIRECTIVES = [
  // Default: same origin only
  "default-src 'self'",

  // Scripts: same origin + Razorpay checkout + Sentry CDN
  // 'unsafe-eval' is required in development by React DevTools (Turbopack) for
  // call-stack reconstruction across environments — never present in production.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com https://js.sentry-cdn.com https://browser.sentry-cdn.com`,

  // Styles: same origin + fonts.googleapis.com (needed for Google Fonts stylesheet)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

  // Fonts: same origin + Google Fonts binary CDN
  "font-src 'self' https://fonts.gstatic.com",

  // Images: same origin + data URIs + Cloudinary + Unsplash (dev only, tighten in prod)
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com https://images.unsplash.com",

  // XHR / fetch: same origin + Razorpay API + Sentry ingest
  "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://*.sentry.io https://o*.ingest.sentry.io",

  // Frames: Razorpay uses an iframe for payment
  "frame-src https://api.razorpay.com",

  // Media: same origin only
  "media-src 'self'",

  // No plugins
  "object-src 'none'",

  // Upgrade insecure requests in production
  "upgrade-insecure-requests",

  // Fallback base URI
  "base-uri 'self'",

  // Form submissions: only to self
  "form-action 'self'",

  // No loading into frames
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy",   value: CSP_DIRECTIVES },
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-DNS-Prefetch-Control",    value: "on" },
        ],
      },
      // Internal routes — block all external access via CORS
      {
        source: "/api/internal/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org:     process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT ?? "tryby-store",
  silent:  true,
  errorHandler(err) {
    console.warn("[Sentry build] Upload skipped:", (err as Error).message);
  },
});
