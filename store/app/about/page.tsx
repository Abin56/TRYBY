import type { Metadata } from "next";
import { AboutHero } from "@/components/about/about-hero";
import { AboutMission } from "@/components/about/about-mission";
import { AboutStats } from "@/components/about/about-stats";
import { AboutValues } from "@/components/about/about-values";
import { AboutTeam } from "@/components/about/about-team";
import { AboutSupplierCTA } from "@/components/about/about-supplier-cta";

export const metadata: Metadata = {
  title: "About TRYBY Sports — India's Premium Sports Commerce Platform",
  description:
    "TRYBY Sports is a premium sports commerce platform connecting athletes across India with official licensed gear from top brands. Partner with us to reach a passionate, high-intent sports audience.",
  keywords: [
    "TRYBY Sports about",
    "sports commerce India",
    "sports supplier partner",
    "official sports gear distributor India",
    "cricket football gym gear brand",
  ],
  openGraph: {
    title: "About TRYBY Sports — India's Premium Sports Commerce Platform",
    description:
      "Official licensed gear. Pan-India delivery. A serious B2B sports partner. Learn who we are and how we work.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutStats />
      <AboutMission />
      <AboutValues />
      <AboutTeam />
      <AboutSupplierCTA />
    </>
  );
}
