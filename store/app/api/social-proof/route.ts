import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad", "Kolkata",
  "Pune", "Ahmedabad", "Jaipur", "Kochi", "Lucknow", "Surat",
];

// GET /api/social-proof — recent purchase events for social proof ticker
export async function GET() {
  // Try DB first
  try {
    const dbEvents = await prisma.socialProofEvent.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    if (dbEvents.length > 0) return NextResponse.json(dbEvents);
  } catch { /* DB may not have table yet — fall through to seeded data */ }

  // Seeded data fallback
  const seeded = [
    { productName: "Barcelona Home Jersey 2024/25", productSlug: "barcelona-home-2024", city: "Mumbai",    timeAgo: "2 min ago" },
    { productName: "India Cricket ODI Jersey",      productSlug: "india-cricket-odi",    city: "Delhi",     timeAgo: "5 min ago" },
    { productName: "Real Madrid Away Kit",          productSlug: "real-madrid-away",     city: "Bengaluru", timeAgo: "8 min ago" },
    { productName: "Pro Gym Performance Tee",       productSlug: "gym-performance-tee",  city: "Pune",      timeAgo: "12 min ago"},
    { productName: "PSG Home Jersey Fan Edition",   productSlug: "psg-home-fan",         city: "Chennai",   timeAgo: "15 min ago"},
    { productName: "IPL Premium Training Kit",      productSlug: "ipl-training-kit",     city: "Kolkata",   timeAgo: "18 min ago"},
    { productName: "Manchester City Home Jersey",   productSlug: "man-city-home",        city: "Hyderabad", timeAgo: "22 min ago"},
    { productName: "Cricket Batting Gloves Pro",    productSlug: "batting-gloves-pro",   city: "Jaipur",    timeAgo: "27 min ago"},
  ].map((e, i) => ({
    id: String(i),
    ...e,
    productImage: null,
    isActive: true,
    isReal: false,
    createdAt: new Date().toISOString(),
  }));

  return NextResponse.json(seeded);
}
