import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public endpoint — no auth required.
// Used by storefront server components to fetch CMS content blocks.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  const block = await prisma.contentBlock.findFirst({
    where: {
      key,
      isActive: true,
      status: "PUBLISHED",
      // Respect scheduled publish time
      OR: [
        { scheduledFor: null },
        { scheduledFor: { lte: new Date() } },
      ],
    },
  });

  if (!block) {
    return NextResponse.json(null, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
    });
  }

  return NextResponse.json(block, {
    headers: {
      // 60s fresh on CDN, serve stale for 10min while revalidating
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
    },
  });
}
