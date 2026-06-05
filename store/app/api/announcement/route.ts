import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const messages = await prisma.announcementMessage.findMany({
    where: {
      isActive: true,
      validFrom: { lte: new Date() },
      OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
    },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(messages, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
