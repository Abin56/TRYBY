import { prisma } from "@/lib/prisma";
import { CrmSegment, CustomerActivityType } from "@prisma/client";

// ── Segment classification thresholds ────────────────────────────────────
const THRESHOLDS = {
  VIP_SPEND: 50000,
  HIGH_VALUE_SPEND: 15000,
  LOYAL_ORDERS: 5,
  WHOLESALE_ORDERS: 20,
  INACTIVE_DAYS: 90,
  CHURNED_DAYS: 180,
  REFUND_RISK_RATE: 0.3,
  COD_RISK_RATE: 0.5,
};

// ── CRM profile recompute ─────────────────────────────────────────────────
export async function recomputeCrmProfile(userId: string): Promise<void> {
  const now = new Date();

  const [orders, returns, user] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      include: { payment: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.returnRequest.findMany({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
  ]);

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const ltv = deliveredOrders.reduce((s, o) => s + Number(o.total), 0);
  const avgOrderValue = totalOrders > 0 ? ltv / totalOrders : 0;

  const sortedDates = orders.map((o) => o.createdAt).sort((a, b) => a.getTime() - b.getTime());
  const firstOrderAt = sortedDates[0] ?? null;
  const lastOrderAt = sortedDates[sortedDates.length - 1] ?? null;
  const daysSinceOrder = lastOrderAt
    ? Math.floor((now.getTime() - lastOrderAt.getTime()) / 86400_000)
    : 9999;

  // Order frequency: orders per month
  const accountAgeMonths = user
    ? Math.max(1, (now.getTime() - user.createdAt.getTime()) / (30 * 86400_000))
    : 1;
  const orderFrequency = totalOrders / accountAgeMonths;

  // Refund metrics
  const refundCount = returns.filter((r) => r.status === "REFUNDED").length;
  const refundRate = totalOrders > 0 ? refundCount / totalOrders : 0;

  // COD metrics
  const codOrders = orders.filter((o) => o.payment?.method === "COD");
  const codOrderCount = codOrders.length;
  const codDelivered = codOrders.filter((o) => o.status === "DELIVERED").length;
  const codUsageRate = totalOrders > 0 ? codOrderCount / totalOrders : 0;
  const codSuccessRate = codOrderCount > 0 ? codDelivered / codOrderCount : 1;

  // Risk score (reuse from existing profile or compute basic)
  const riskProfile = await prisma.customerRiskProfile.findUnique({ where: { userId } });
  const riskScore = riskProfile?.riskScore ?? 0;

  // Engagement score (0-100): orders, reviews, loyalty
  const [reviewCount, loyaltyBalance] = await Promise.all([
    prisma.review.count({ where: { userId } }),
    prisma.loyaltyPoint.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { balance: true },
    }),
  ]);
  let engagementScore = 0;
  if (totalOrders >= 1) engagementScore += 20;
  if (totalOrders >= 3) engagementScore += 15;
  if (totalOrders >= 10) engagementScore += 15;
  if (reviewCount >= 1) engagementScore += 15;
  if (reviewCount >= 3) engagementScore += 10;
  if ((loyaltyBalance?.balance ?? 0) > 0) engagementScore += 10;
  if (daysSinceOrder <= 30) engagementScore += 15;
  else if (daysSinceOrder <= 60) engagementScore += 5;

  // ── Segment classification ────────────────────────────────────────
  const segments: CrmSegment[] = [];

  if (ltv >= THRESHOLDS.VIP_SPEND) segments.push("VIP");
  else if (ltv >= THRESHOLDS.HIGH_VALUE_SPEND) segments.push("HIGH_VALUE");

  if (totalOrders >= THRESHOLDS.WHOLESALE_ORDERS) segments.push("WHOLESALE");
  else if (totalOrders >= THRESHOLDS.LOYAL_ORDERS && daysSinceOrder <= 60) segments.push("LOYAL");
  else if (totalOrders >= 2) segments.push("REPEAT_BUYER");
  else if (totalOrders === 1) segments.push("NEW_CUSTOMER");

  if (daysSinceOrder >= THRESHOLDS.CHURNED_DAYS) {
    segments.push("CHURNED");
  } else if (daysSinceOrder >= THRESHOLDS.INACTIVE_DAYS) {
    segments.push("INACTIVE");
    segments.push("AT_RISK");
  }

  if (refundRate >= THRESHOLDS.REFUND_RISK_RATE && refundCount >= 2) {
    segments.push("REFUND_RISK");
  }

  if (codOrderCount >= 3 && codSuccessRate < (1 - THRESHOLDS.COD_RISK_RATE)) {
    segments.push("COD_RISK");
  }

  await prisma.crmProfile.upsert({
    where: { userId },
    create: {
      userId,
      segments,
      ltv,
      avgOrderValue,
      orderCount: totalOrders,
      returnCount: returns.length,
      refundCount,
      refundRate,
      codOrderCount,
      codUsageRate,
      riskScore,
      engagementScore,
      orderFrequency,
      firstOrderAt,
      lastOrderAt,
      daysSinceOrder,
      lastComputedAt: now,
    },
    update: {
      segments,
      ltv,
      avgOrderValue,
      orderCount: totalOrders,
      returnCount: returns.length,
      refundCount,
      refundRate,
      codOrderCount,
      codUsageRate,
      riskScore,
      engagementScore,
      orderFrequency,
      firstOrderAt,
      lastOrderAt,
      daysSinceOrder,
      lastComputedAt: now,
    },
  });
}

// ── Activity logging ─────────────────────────────────────────────────────
export async function logActivity(opts: {
  userId: string;
  type: CustomerActivityType;
  metadata?: Record<string, unknown>;
  performedBy?: string;
}) {
  try {
    await prisma.customerActivity.create({
      data: {
        userId: opts.userId,
        type: opts.type,
        metadata: opts.metadata as object | undefined,
        performedBy: opts.performedBy,
      },
    });
  } catch {}
}

// ── Segment label helpers ────────────────────────────────────────────────
export const SEGMENT_LABELS: Record<string, string> = {
  VIP: "VIP",
  HIGH_VALUE: "High Value",
  REPEAT_BUYER: "Repeat Buyer",
  NEW_CUSTOMER: "New Customer",
  LOYAL: "Loyal",
  WHOLESALE: "Wholesale",
  INACTIVE: "Inactive",
  CHURNED: "Churned",
  REFUND_RISK: "Refund Risk",
  COD_RISK: "COD Risk",
  AT_RISK: "At Risk",
};

export const SEGMENT_COLORS: Record<string, string> = {
  VIP: "#F5C518",
  HIGH_VALUE: "#A78BFA",
  REPEAT_BUYER: "#3B82F6",
  NEW_CUSTOMER: "#22C55E",
  LOYAL: "#06B6D4",
  WHOLESALE: "#8B5CF6",
  INACTIVE: "#6B7280",
  CHURNED: "#EF4444",
  REFUND_RISK: "#EC4899",
  COD_RISK: "#F97316",
  AT_RISK: "#EAB308",
};
