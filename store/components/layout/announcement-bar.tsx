import { getAnnouncements } from "@/lib/content";
import { AnnouncementCarousel } from "./announcement-carousel";

// Server component — fetches from DB, passes to client carousel.
export async function AnnouncementBar() {
  const items = await getAnnouncements();
  if (!items.length) return null;
  return <AnnouncementCarousel items={items} />;
}
