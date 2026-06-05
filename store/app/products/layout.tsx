import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Sports Gear — Jerseys, Cricket, Football & Gym",
  description:
    "Browse TRYBY's full collection of sports gear. Official licensed jerseys, cricket equipment, football kits, gym wear — all in one place. Fast pan-India delivery.",
  alternates: { canonical: "https://www.tryby.in/products" },
  openGraph: {
    title: "Shop Sports Gear — TRYBY India",
    description: "Browse cricket jerseys, football kits, gym wear & more. Fast India delivery.",
    url: "https://www.tryby.in/products",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "TRYBY Sports Shop" }],
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
