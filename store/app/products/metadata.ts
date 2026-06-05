import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Sports Gear — Jerseys, Cricket, Football & Gym",
  description:
    "Browse TRYBY's full collection of sports gear. Filter by sport, price, and brand. Official licensed jerseys, cricket equipment, football kits, gym wear — all in one place.",
  alternates: { canonical: "https://www.tryby.in/products" },
  openGraph: {
    title: "Shop Sports Gear — TRYBY India",
    description: "Browse cricket jerseys, football kits, gym wear & more. Filter by sport and price. Fast India delivery.",
    url: "https://www.tryby.in/products",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "TRYBY Sports Shop" }],
  },
};
