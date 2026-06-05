import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccess } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "risk:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page      = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit     = Math.min(50, parseInt(searchParams.get("limit") ?? "25"));
  const riskLevel = searchParams.get("riskLevel");
  const skip      = (page - 1) * limit;

  const suppliers = await prisma.supplier.findMany({
    skip,
    take:    limit,
    include: { user: { select: { name: true, email: true } } },
    orderBy: { performanceScore: "asc" },
  });

  const total = await prisma.supplier.count();

  const scored = suppliers.map(s => {
    // Cancellation risk (0â€“40), return risk (0â€“30), SLA risk (0â€“20), quality risk (0â€“10)
    const cancRisk  = Math.min(Number(s.cancellationRate) * 200, 40);
    const retRisk   = Math.min(Number(s.returnRate)       * 150, 30);
    const slaRisk   = Math.max(0, (100 - Number(s.slaScore))       * 0.2);
    const qualRisk  = Math.max(0, (100 - Number(s.qualityScore))   * 0.1);
    const riskScore = Math.round(Math.min(cancRisk + retRisk + slaRisk + qualRisk, 100));
    const level     = riskScore >= 75 ? "CRITICAL"
                    : riskScore >= 50 ? "HIGH"
                    : riskScore >= 25 ? "MEDIUM"
                    : "LOW";

    return {
      id:               s.id,
      companyName:      s.companyName,
      email:            s.user?.email ?? null,
      status:           s.status,
      tier:             s.tier,
      riskScore,
      riskLevel:        level,
      cancellationRate: Number(s.cancellationRate),
      returnRate:       Number(s.returnRate),
      slaScore:         Number(s.slaScore),
      performanceScore: Number(s.performanceScore),
      fulfillmentRate:  Number(s.fulfillmentRate),
      totalOrders:      s.totalOrders,
      suspendReason:    s.suspendReason,
    };
  });

  // Apply optional risk level filter after scoring
  const filtered = riskLevel ? scored.filter(s => s.riskLevel === riskLevel) : scored;
  filtered.sort((a, b) => b.riskScore - a.riskScore);

  const highRiskCount    = filtered.filter(s => ["HIGH", "CRITICAL"].includes(s.riskLevel)).length;
  const criticalCount    = filtered.filter(s => s.riskLevel === "CRITICAL").length;

  return NextResponse.json({
    suppliers: filtered,
    total:     riskLevel ? filtered.length : total,
    page,
    limit,
    pages:     Math.ceil(total / limit),
    highRiskCount,
    criticalCount,
  });
}

