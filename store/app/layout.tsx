import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/seo/json-ld";
import { SplashGate } from "@/components/onboarding/splash-gate";
import { PrelaunchNotice } from "@/components/system/prelaunch-notice";
import { SessionProvider } from "@/components/providers/session-provider";
import { ClientOnlyWidgets } from "@/components/conversion/client-only-widgets";
import { CartClearer } from "@/components/cart/cart-clearer";
import { SessionSync } from "@/components/providers/session-sync";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-barlow",
  display: "swap",
});

const BASE_URL = "https://www.tryby.in";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "TRYBY — Premium Sports Gear India | Jerseys, Cricket, Football & Gym",
    template: "%s | TRYBY Sports",
  },
  description:
    "Shop premium sports gear at TRYBY. Official licensed jerseys, cricket equipment, football kits, gym accessories — delivered across India. Best prices, fast shipping.",
  keywords: [
    "TRYBY",
    "TRYBY Sports",
    "tryby.in",
    "sports gear India",
    "cricket jersey India",
    "football kit India",
    "gym equipment India",
    "IPL jersey",
    "official sports gear",
    "buy sports online India",
    "sports accessories",
    "sports clothing India",
  ],
  authors: [{ name: "TRYBY Sports", url: BASE_URL }],
  creator: "TRYBY Sports",
  publisher: "TRYBY Sports",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "TRYBY Sports",
    title: "TRYBY — Premium Sports Gear India | Jerseys, Cricket, Football & Gym",
    description:
      "Shop premium sports gear at TRYBY. Official licensed jerseys, cricket equipment, football kits, gym accessories — delivered across India.",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "TRYBY Sports — Gear Up. Play Hard.",
      },
    ],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "TRYBY — Premium Sports Gear India",
    description: "Official licensed jerseys, cricket, football & gym gear. Fast pan-India delivery.",
    images: ["/api/og"],
    site: "@trybysports",
    creator: "@trybysports",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico",        sizes: "any" },
      { url: "/favicon-16x16.png",  sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png",  sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple:    "/apple-touch-icon.png",
    other: [
      { rel: "manifest", url: "/site.webmanifest" },
    ],
  },
  verification: {
    google: "YGxV78NzTUkYTkuh-fOuunwZm-xwXPEDfDYyoUdM554",
  },
  category: "sports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${barlow.variable} h-full antialiased`} data-scroll-behavior="smooth">
      <head>
        {/* theme-color — browser chrome on mobile */}
        <meta name="theme-color" content="#0D0D0D" />
      </head>
      <body className="bg-white text-[#111827] min-h-full flex flex-col overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:rounded-lg focus:bg-[#FF3B30] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <SessionProvider>
          <CartClearer />
          <SessionSync />
          <PrelaunchNotice />
          <ClientOnlyWidgets />
          <SplashGate>
            <Navbar />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
          </SplashGate>
        </SessionProvider>
      </body>
    </html>
  );
}
