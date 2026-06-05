import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const revalidate = 60; // ISR — storefront cache refreshes every 60s

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const key  = searchParams.get("key");

  const where: Record<string, unknown> = {
    isActive: true,
    status: "PUBLISHED",
  };
  if (type) where.type = type;
  if (key)  where.key  = key;

  const blocks = await prisma.contentBlock.findMany({
    where,
    orderBy: { sortOrder: "asc" },
    select: { id: true, type: true, key: true, data: true, sortOrder: true },
  });

  return NextResponse.json(blocks, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
