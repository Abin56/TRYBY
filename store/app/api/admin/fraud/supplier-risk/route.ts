import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "risk:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 25;
  const skip = (page - 1) * limit;
  const risk = searchParams.get("risk") ?? ""; // "high" | "medium"

  const where: Record<string, unknown> = { status: "APPROVED" };
  if (risk === "high") {
    where.OR = [{ cancellationRate: { gte: 0.2 } }, { returnRate: { gte: 0.15 } }, { performanceScore: { lte: 40 } }];
  } else if (risk === "medium") {
    where.OR = [{ cancellationRate: { gte: 0.1 } }, { returnRate: { gte: 0.08 } }];
  }

  const [data, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      select: {
        id: true,
        companyName: true,
        slug: true,
        tier: true,
        status: true,
        cancellationRate: true,
        returnRate: true,
        fulfillmentRate: true,
        performanceScore: true,
        fulfillmentScore: true,
        qualityScore: true,
        slaScore: true,
        avgRating: true,
        totalOrders: true,
        avgShippingHrs: true,
        avgDeliveryDays: true,
        createdAt: true,
      },
      orderBy: { performanceScore: "asc" },
      skip,
      take: limit,
    }),
    prisma.supplier.count({ where }),
  ]);

  const agg = await prisma.supplier.aggregate({
    where: { status: "APPROVED" },
    _avg: { cancellationRate: true, returnRate: true, performanceScore: true },
    _count: { _all: true },
  });

  return NextResponse.json({ data, total, page, pages: Math.ceil(total / limit), agg });
}
