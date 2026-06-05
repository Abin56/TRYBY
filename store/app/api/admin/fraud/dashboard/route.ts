/* eslint-disable @typescript-eslint/no-explicit-any */
﻿import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma as _prisma } from "@/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any;
import { canAccess } from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  if (!canAccess(session, "risk:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const d7  = new Date(now.getTime() - 7  * 86400_000);
  const d30 = new Date(now.getTime() - 30 * 86400_000);

  const [
    customerRiskDist,
    orderRiskDist,
    codStats,
    refundStats,
    blacklistCounts,
    topRiskyCustomers,
    suspiciousOrders,
    recentAuditLogs,
    codBlockedCount,
    blacklistTotal,
    refundAbuseCount,
    supplierRisk,
    newRiskyCustomers7d,
    flaggedOrders7d,
  ] = await Promise.all([
    // Customer risk level distribution
    prisma.customerRiskProfile.groupBy({
      by:    ["riskLevel"],
      _count: { riskLevel: true },
    }),
    // Order risk level distribution (uncleared only)
    prisma.orderRiskAssessment.groupBy({
      by:    ["riskLevel"],
      _count: { riskLevel: true },
      where: { requiresReview: true },
    }),
    // COD stats
    prisma.codAbuseRecord.aggregate({
      _avg: { successRate: true },
      _sum: { totalCodOrders: true, deliveredCount: true, cancelledCount: true },
    }),
    // Refund stats
    prisma.refundAbuseRecord.aggregate({
      _avg: { refundRate: true },
      _sum: { totalRefundAmount: true, totalRefunds: true },
    }),
    // Blacklist counts per type
    prisma.blacklist.groupBy({
      by:    ["type"],
      _count: { type: true },
      where: { status: "ACTIVE" },
    }),
    // Top risky customers (HIGH/CRITICAL)
    prisma.customerRiskProfile.findMany({
      where:   { riskLevel: { in: ["HIGH", "CRITICAL"] } },
      orderBy: { riskScore: "desc" },
      take:    10,
    }),
    // Suspicious unreviewed orders
    prisma.orderRiskAssessment.findMany({
      where:   { requiresReview: true, reviewedBy: null },
      orderBy: { riskScore: "desc" },
      take:    20,
    }),
    // Recent fraud audit logs
    prisma.fraudAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take:    20,
    }),
    // COD blocked count
    prisma.customerRiskProfile.count({ where: { isCodBlocked: true } }),
    // Total active blacklist entries
    prisma.blacklist.count({ where: { status: "ACTIVE" } }),
    // Refund abusers
    prisma.refundAbuseRecord.count({ where: { isFlagged: true } }),
    // High-risk suppliers
    prisma.supplier.findMany({
      where: {
        OR: [
          { cancellationRate: { gte: 0.2 } },
          { returnRate:       { gte: 0.15 } },
        ],
      },
      select: {
        id: true, companyName: true, cancellationRate: true,
        returnRate: true, performanceScore: true, tier: true, status: true,
      },
      orderBy: { performanceScore: "asc" },
      take:    5,
    }),
    // New risky customers this week
    prisma.customerRiskProfile.count({
      where: {
        riskLevel: { in: ["HIGH", "CRITICAL"] },
        createdAt: { gte: d7 },
      },
    }),
    // Orders flagged this week
    prisma.orderRiskAssessment.count({
      where: {
        requiresReview: true,
        createdAt:      { gte: d7 },
      },
    }),
  ]);

  // Enrich top risky customers with user info
  const userIds      = topRiskyCustomers.map((p: any) => p.userId);
  const users        = await prisma.user.findMany({
    where:  { id: { in: userIds } },
    select: { id: true, name: true, email: true, phone: true },
  });
  const userMap      = Object.fromEntries(users.map((u: any) => [u.id, u]));

  // Enrich suspicious orders with order+user info
  const orderIds     = suspiciousOrders.map((o: any) => o.orderId);
  const orders       = await prisma.order.findMany({
    where:   { id: { in: orderIds } },
    select:  {
      id: true, orderNumber: true, total: true, status: true, createdAt: true,
      user:    { select: { id: true, name: true, email: true } },
      payment: { select: { method: true } },
    },
  });
  const orderMap     = Object.fromEntries(orders.map((o: any) => [o.id, o]));

  // Supplier risk scoring
  const supplierRiskScored = supplierRisk.map((s: any) => {
    const cancRisk  = Math.min(Number(s.cancellationRate) * 200, 40);
    const retRisk   = Math.min(Number(s.returnRate)       * 150, 30);
    const perfRisk  = Math.max(0, (100 - Number(s.performanceScore)) * 0.3);
    const riskScore = Math.round(Math.min(cancRisk + retRisk + perfRisk, 100));
    const riskLevel = riskScore >= 75 ? "CRITICAL" : riskScore >= 50 ? "HIGH" : riskScore >= 25 ? "MEDIUM" : "LOW";
    return { ...s, riskScore, riskLevel };
  });

  return NextResponse.json({
    kpis: {
      criticalCustomers:    customerRiskDist.find((r: any) => r.riskLevel === "CRITICAL")?._count.riskLevel ?? 0,
      highRiskCustomers:    customerRiskDist.find((r: any) => r.riskLevel === "HIGH")?._count.riskLevel     ?? 0,
      codBlockedCount,
      blacklistTotal,
      refundAbuseCount,
      suspiciousOrders:     suspiciousOrders.length,
      codSuccessRate:       Number(codStats._avg.codSuccessRate ?? 100),
      avgRefundRate:        Number(refundStats._avg.refundRate  ?? 0),
      totalRefundAmount:    Number(refundStats._sum.totalRefundAmount ?? 0),
      newRiskyCustomers7d,
      flaggedOrders7d,
    },
    customerRiskDist,
    orderRiskDist,
    blacklistCounts,
    topRiskyCustomers: topRiskyCustomers.map((p: any) => ({ ...p, user: userMap[p.userId] ?? null })),
    suspiciousOrders:  suspiciousOrders.map((o: any) => ({ ...o, order: orderMap[o.orderId] ?? null })),
    supplierRisk:      supplierRiskScored,
    recentAuditLogs,
    codKpis: {
      totalCodOrders: Number(codStats._sum.totalCodOrders  ?? 0),
      delivered:      Number(codStats._sum.deliveredCount  ?? 0),
      cancelled:      Number(codStats._sum.cancelledCount  ?? 0),
      successRate:    Number(codStats._avg.successRate     ?? 100),
    },
    generatedAt: now.toISOString(),
  });
}

