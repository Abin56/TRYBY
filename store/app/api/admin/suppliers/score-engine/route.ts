import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, SupplierTier } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// Compute all scores for a supplier from raw data
export function computeScores(supplier: {
  fulfillmentRate: number; returnRate: number; cancellationRate: number;
  avgRating: number; slaScore: number; avgShippingHrs: number;
  docsVerified: boolean; onboardedAt: Date | null; status: string;
  agreementSignedAt: Date | null;
}) {
  const {
    fulfillmentRate, returnRate, cancellationRate, avgRating,
    slaScore, avgShippingHrs, docsVerified, onboardedAt,
    agreementSignedAt,
  } = supplier;

  // ── Fulfillment Score (0–100) ──
  // 40% fulfillment rate + 30% SLA compliance + 30% shipping speed
  const shippingSpeedScore = avgShippingHrs > 0
    ? Math.max(0, 100 - (avgShippingHrs / 72) * 100) // 72h = 0pts, 0h = 100pts
    : 50; // neutral for new suppliers
  const fulfillmentScore = Math.round(
    fulfillmentRate * 40 +
    slaScore * 0.30 +
    shippingSpeedScore * 0.30
  );

  // ── Quality Score (0–100) ──
  // 50% customer rating + 30% low return rate + 20% low cancellation rate
  const ratingScore       = (avgRating / 5) * 100;
  const returnScore       = Math.max(0, 100 - returnRate * 500);      // 20% return = 0pts
  const cancellationScore = Math.max(0, 100 - cancellationRate * 500); // 20% cancel = 0pts
  const qualityScore = Math.round(
    ratingScore       * 0.50 +
    returnScore       * 0.30 +
    cancellationScore * 0.20
  );

  // ── Trust Score (0–100) ──
  // 30% docs verified + 20% agreement signed + 30% tenure + 20% no violations
  const tenureMonths = onboardedAt
    ? (Date.now() - new Date(onboardedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
    : 0;
  const tenureScore       = Math.min(100, tenureMonths * (100 / 12)); // 12 months = 100pts
  const docsScore         = docsVerified ? 100 : 0;
  const agreementScore    = agreementSignedAt ? 100 : 0;
  const violationScore    = supplier.status === "SUSPENDED" ? 0 : 100;
  const trustScore = Math.round(
    docsScore      * 0.30 +
    agreementScore * 0.20 +
    tenureScore    * 0.30 +
    violationScore * 0.20
  );

  // ── Overall Performance Score (0–100) ──
  const performanceScore = Math.round(
    fulfillmentScore * 0.35 +
    qualityScore     * 0.35 +
    trustScore       * 0.30
  );

  // ── Tier ──
  let tier: SupplierTier;
  if (performanceScore >= 85) tier = SupplierTier.PLATINUM;
  else if (performanceScore >= 65) tier = SupplierTier.GOLD;
  else if (performanceScore >= 40) tier = SupplierTier.SILVER;
  else tier = SupplierTier.BRONZE;

  return {
    fulfillmentScore: Math.min(100, Math.max(0, fulfillmentScore)),
    qualityScore:     Math.min(100, Math.max(0, qualityScore)),
    trustScore:       Math.min(100, Math.max(0, trustScore)),
    performanceScore: Math.min(100, Math.max(0, performanceScore)),
    tier,
  };
}

// GET — score breakdown for a specific supplier or all
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get("supplierId");

  if (supplierId) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const scores = computeScores({
      fulfillmentRate:   Number(supplier.fulfillmentRate),
      returnRate:        Number(supplier.returnRate),
      cancellationRate:  Number(supplier.cancellationRate),
      avgRating:         Number(supplier.avgRating),
      slaScore:          Number(supplier.slaScore),
      avgShippingHrs:    Number(supplier.avgShippingHrs),
      docsVerified:      supplier.docsVerified,
      onboardedAt:       supplier.onboardedAt,
      status:            supplier.status,
      agreementSignedAt: supplier.agreementSignedAt,
    });

    return NextResponse.json({ supplierId, scores, supplier });
  }

  // Return score distribution summary
  const suppliers = await prisma.supplier.findMany({
    where:  { status: "APPROVED" },
    select: {
      id: true, companyName: true, tier: true,
      performanceScore: true, fulfillmentScore: true, qualityScore: true, trustScore: true,
    },
    orderBy: { performanceScore: "desc" },
  });

  return NextResponse.json({ suppliers });
}

// POST — recompute and persist scores for one or all suppliers
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { supplierId } = await req.json().catch(() => ({})) as { supplierId?: string };

  const where = supplierId ? { id: supplierId } : { status: "APPROVED" as const };
  const suppliers = await prisma.supplier.findMany({ where });

  const updates = await Promise.all(suppliers.map(async s => {
    // Recompute SLA score from SLA records
    const slaRecords = await prisma.supplierSLA.findMany({
      where: { supplierId: s.id },
      select: { overallStatus: true },
    });
    const slaOnTime = slaRecords.filter(r => r.overallStatus === "ON_TIME").length;
    const slaScore  = slaRecords.length > 0 ? (slaOnTime / slaRecords.length) * 100 : 0;

    const scores = computeScores({
      fulfillmentRate:   Number(s.fulfillmentRate),
      returnRate:        Number(s.returnRate),
      cancellationRate:  Number(s.cancellationRate),
      avgRating:         Number(s.avgRating),
      slaScore,
      avgShippingHrs:    Number(s.avgShippingHrs),
      docsVerified:      s.docsVerified,
      onboardedAt:       s.onboardedAt,
      status:            s.status,
      agreementSignedAt: s.agreementSignedAt,
    });

    return prisma.supplier.update({
      where: { id: s.id },
      data:  {
        slaScore:         slaScore,
        fulfillmentScore: scores.fulfillmentScore,
        qualityScore:     scores.qualityScore,
        trustScore:       scores.trustScore,
        performanceScore: scores.performanceScore,
        tier:             scores.tier,
        tierUpdatedAt:    scores.tier !== s.tier ? new Date() : s.tierUpdatedAt,
      },
    });
  }));

  return NextResponse.json({ updated: updates.length, suppliers: updates.map(u => ({ id: u.id, tier: u.tier, performanceScore: u.performanceScore })) });
}
