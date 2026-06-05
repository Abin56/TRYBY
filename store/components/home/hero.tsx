import { getHeroContent } from "@/lib/content";
import { HeroClient } from "./hero-client";

// Server component — fetches from DB, passes to client for animations.
export async function HeroSection() {
  const content = await getHeroContent();
  return <HeroClient content={content} />;
}
