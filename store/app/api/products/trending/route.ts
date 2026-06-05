import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Sport } from "@prisma/client";

export async function GET(req: NextRequest) {
  const sport = req.nextUrl.searchParams.get("sport") as Sport | null;
  const limit = Math.min(20, Number(req.nextUrl.searchParams.get("limit") ?? "8"));

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      badges: { some: { type: "TRENDING" } },
      ...(sport ? { sport } : {}),
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
      badges: true,
    },
    orderBy: { weeklySoldCount: "desc" },
    take: limit,
  });

  return NextResponse.json(products);
}
