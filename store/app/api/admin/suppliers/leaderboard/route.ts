import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET() {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const TAKE = 10;

  const [
    topRevenue,
    fastestShipping,
    lowestReturn,
    highestRating,
    topTier,
    recentlyOnboarded,
    slaChampions,
  ] = await Promise.all([

    // Top revenue suppliers
    prisma.supplier.findMany({
      where:   { status: "APPROVED" },
      orderBy: { totalSales: "desc" },
      take:    TAKE,
      select:  {
        id: true, companyName: true, slug: true, tier: true, logoUrl: true,
        totalSales: true, totalOrders: true, commissionRate: true,
        performanceScore: true, avgRating: true,
        user: { select: { name: true, email: true } },
      },
    }),

    // Fastest suppliers (lowest avg shipping hours)
    prisma.supplier.findMany({
      where:   { status: "APPROVED", avgShippingHrs: { gt: 0 } },
      orderBy: { avgShippingHrs: "asc" },
      take:    TAKE,
      select:  {
        id: true, companyName: true, slug: true, tier: true, logoUrl: true,
        avgShippingHrs: true, avgAcceptanceHrs: true, avgDeliveryDays: true,
        slaScore: true,
        user: { select: { name: true, email: true } },
      },
    }),

    // Lowest return rate
    prisma.supplier.findMany({
      where:   { status: "APPROVED", totalOrders: { gt: 10 } },
      orderBy: { returnRate: "asc" },
      take:    TAKE,
      select:  {
        id: true, companyName: true, slug: true, tier: true, logoUrl: true,
        returnRate: true, cancellationRate: true, fulfillmentRate: true,
        qualityScore: true,
        user: { select: { name: true, email: true } },
      },
    }),

    // Highest rated
    prisma.supplier.findMany({
      where:   { status: "APPROVED", avgRating: { gt: 0 } },
      orderBy: { avgRating: "desc" },
      take:    TAKE,
      select:  {
        id: true, companyName: true, slug: true, tier: true, logoUrl: true,
        avgRating: true, qualityScore: true, totalOrders: true,
        user: { select: { name: true, email: true } },
      },
    }),

    // Top tier breakdown counts
    prisma.supplier.groupBy({
      by:    ["tier"],
      where: { status: "APPROVED" },
      _count: { id: true },
      _sum:   { totalSales: true },
    }),

    // Recently onboarded (last 30 days)
    prisma.supplier.findMany({
      where:   {
        status:     "APPROVED",
        onboardedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { onboardedAt: "desc" },
      take:    5,
      select:  {
        id: true, companyName: true, slug: true, tier: true, logoUrl: true,
        onboardedAt: true, totalOrders: true,
        user: { select: { name: true } },
      },
    }),

    // SLA champions (highest slaScore with > 10 orders)
    prisma.supplier.findMany({
      where:   { status: "APPROVED", totalOrders: { gt: 10 } },
      orderBy: { slaScore: "desc" },
      take:    TAKE,
      select:  {
        id: true, companyName: true, slug: true, tier: true, logoUrl: true,
        slaScore: true, avgShippingHrs: true, avgDeliveryDays: true, totalOrders: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  // Overall marketplace health
  const [overallStats, slaStats] = await Promise.all([
    prisma.supplier.aggregate({
      where: { status: "APPROVED" },
      _count: { id: true },
      _avg:   { performanceScore: true, avgRating: true, fulfillmentRate: true, returnRate: true },
      _sum:   { totalSales: true, totalOrders: true },
    }),
    prisma.supplierSLA.groupBy({
      by:    ["overallStatus"],
      _count: { id: true },
    }),
  ]);

  const slaBreakdown = Object.fromEntries(
    slaStats.map(s => [s.overallStatus, s._count.id])
  );

  return NextResponse.json({
    leaderboards: { topRevenue, fastestShipping, lowestReturn, highestRating, slaChampions },
    tierBreakdown: topTier,
    recentlyOnboarded,
    marketplace: {
      totalApprovedSuppliers: overallStats._count.id,
      avgPerformanceScore:    Number(overallStats._avg.performanceScore ?? 0).toFixed(1),
      avgRating:              Number(overallStats._avg.avgRating ?? 0).toFixed(2),
      avgFulfillmentRate:     Number(overallStats._avg.fulfillmentRate ?? 0),
      avgReturnRate:          Number(overallStats._avg.returnRate ?? 0),
      totalGMV:               Number(overallStats._sum.totalSales ?? 0),
      totalOrders:            overallStats._sum.totalOrders ?? 0,
      slaBreakdown,
    },
  });
}
