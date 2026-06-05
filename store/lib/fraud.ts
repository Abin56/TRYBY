/* eslint-disable @typescript-eslint/no-explicit-any */
// NOTE: Run `npx prisma generate` after stopping the dev server to regenerate types.
// The fraud models were added to schema but the Prisma client DLL is locked by the dev process.
import { prisma as _prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// Cast to any so fraud model queries compile before prisma generate runs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any;

type RiskLevel       = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type FraudActionType = string;

// ── Risk thresholds ───────────────────────────────────────────────────────────

export const RISK_THRESHOLDS = {
  LOW:      0,
  MEDIUM:   25,
  HIGH:     50,
  CRITICAL: 75,
} as const;

export function scoreToLevel(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.CRITICAL) return "CRITICAL";
  if (score >= RISK_THRESHOLDS.HIGH)     return "HIGH";
  if (score >= RISK_THRESHOLDS.MEDIUM)   return "MEDIUM";
  return "LOW";
}

// ── Customer risk recompute ───────────────────────────────────────────────────
// Called after every order event. Updates CustomerRiskProfile.

export async function recomputeCustomerRisk(userId: string): Promise<void> {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86400_000);

  const [orders, codOrders] = await Promise.all([
    prisma.order.findMany({
      where:  { userId },
      select: { status: true, total: true, payment: { select: { method: true } }, createdAt: true },
    }),
    prisma.order.findMany({
      where:  { userId, payment: { method: "COD" } },
      select: { status: true },
    }),
  ]);

  const totalOrders       = orders.length;
  const totalReturns      = orders.filter(o => ["RETURNED", "RETURN_REQUESTED"].includes(o.status)).length;
  const totalRefunds      = orders.filter(o => o.status === "REFUNDED").length;
  const totalRefundAmount = orders
    .filter(o => ["REFUNDED", "RETURNED"].includes(o.status))
    .reduce((s, o) => s + Number(o.total), 0);
  const avgOrderValue     = totalOrders > 0
    ? orders.reduce((s, o) => s + Number(o.total), 0) / totalOrders
    : 0;

  const totalCodOrders    = codOrders.length;
  const totalCodDelivered = codOrders.filter(o => o.status === "DELIVERED").length;
  const totalCodCancelled = codOrders.filter(o => ["CANCELLED", "RETURNED"].includes(o.status)).length;

  const recentOrders = orders.filter(o => o.createdAt >= d30).length;

  let score = 0;

  // COD cancel rate (max 30)
  if (totalCodOrders >= 3) {
    const cancelRate = totalCodCancelled / totalCodOrders;
    score += Math.min(30, Math.round(cancelRate * 60));
  }

  // Refund rate (max 25)
  if (totalOrders >= 2) {
    const refundRate = totalRefunds / totalOrders;
    score += Math.min(25, Math.round(refundRate * 50));
  }

  // High refund amount (max 15)
  if      (totalRefundAmount > 10000) score += 15;
  else if (totalRefundAmount > 5000)  score += 10;
  else if (totalRefundAmount > 2000)  score += 5;

  // Order velocity (max 10)
  if      (recentOrders >= 15) score += 10;
  else if (recentOrders >= 8)  score += 5;

  score = Math.min(100, score);
  const riskLevel = scoreToLevel(score);

  await prisma.customerRiskProfile.upsert({
    where:  { userId },
    create: {
      userId, riskScore: score, riskLevel, totalOrders, totalReturns,
      totalRefunds, totalRefundAmount, totalCodOrders, totalCodDelivered,
      totalCodCancelled, avgOrderValue,
    },
    update: {
      riskScore: score, riskLevel, totalOrders, totalReturns,
      totalRefunds, totalRefundAmount, totalCodOrders, totalCodDelivered,
      totalCodCancelled, avgOrderValue,
    },
  });

  await logFraudAudit({
    actionType: "RISK_SCORE_UPDATED",
    performedBy: "system",
    targetId:    userId,
    targetType:  "customer",
    reason:      `Score recomputed: ${score} (${riskLevel})`,
  });
}

// ── Order risk assessment ─────────────────────────────────────────────────────

export interface OrderRiskResult {
  score:          number;
  level:          RiskLevel;
  flags:          string[];
  requiresReview: boolean;
}

export async function assessOrderRisk(opts: {
  orderId:        string;
  userId:         string;
  total:          number;
  ipAddress?:     string | null;
  paymentMethod?: string;
}): Promise<OrderRiskResult> {
  const flags: string[] = [];
  let score = 0;

  if      (opts.total >= 15000) { flags.push("HIGH_VALUE");      score += 25; }
  else if (opts.total >= 8000)  { flags.push("ELEVATED_VALUE");  score += 12; }

  if (opts.paymentMethod === "COD" && opts.total >= 5000) {
    flags.push("COD_HIGH_VALUE"); score += 20;
  }

  let sameIpOrderCount = 0;
  if (opts.ipAddress) {
    const d24h = new Date(Date.now() - 86400_000);
    sameIpOrderCount = await prisma.orderRiskAssessment.count({
      where: { ipAddress: opts.ipAddress, createdAt: { gte: d24h } },
    });
    if      (sameIpOrderCount >= 5) { flags.push("IP_VELOCITY_HIGH");   score += 30; }
    else if (sameIpOrderCount >= 3) { flags.push("IP_VELOCITY_MEDIUM"); score += 15; }

    const ipBl = await prisma.blacklist.findUnique({
      where: { type_value: { type: "IP", value: opts.ipAddress } },
    });
    if (ipBl?.status === "ACTIVE") { flags.push("BLACKLISTED_IP"); score += 40; }
  }

  const riskProfile = await prisma.customerRiskProfile.findUnique({ where: { userId: opts.userId } });
  if (riskProfile) {
    if      (riskProfile.riskLevel === "CRITICAL") { flags.push("CRITICAL_CUSTOMER");   score += 30; }
    else if (riskProfile.riskLevel === "HIGH")     { flags.push("HIGH_RISK_CUSTOMER");  score += 15; }
    if (riskProfile.isCodBlocked && opts.paymentMethod === "COD") {
      flags.push("COD_BLOCKED_CUSTOMER"); score += 50;
    }
    if (riskProfile.isBlacklisted) { flags.push("BLACKLISTED_CUSTOMER"); score += 60; }
  }

  const user = await prisma.user.findUnique({
    where:  { id: opts.userId },
    select: { email: true, phone: true },
  });
  if (user?.email) {
    const emailBl = await prisma.blacklist.findUnique({ where: { type_value: { type: "EMAIL", value: user.email } } });
    if (emailBl?.status === "ACTIVE") { flags.push("BLACKLISTED_EMAIL"); score += 50; }
  }
  if (user?.phone) {
    const phoneBl = await prisma.blacklist.findUnique({ where: { type_value: { type: "PHONE", value: user.phone } } });
    if (phoneBl?.status === "ACTIVE") { flags.push("BLACKLISTED_PHONE"); score += 50; }
  }

  score = Math.min(100, score);
  const level          = scoreToLevel(score);
  const requiresReview = score >= RISK_THRESHOLDS.HIGH;
  const isHighValue    = opts.total >= 8000;

  await prisma.orderRiskAssessment.upsert({
    where:  { orderId: opts.orderId },
    create: {
      orderId: opts.orderId, riskScore: score, riskLevel: level,
      flags, ipAddress: opts.ipAddress ?? null, sameIpOrderCount,
      isHighValue, velocityFlag: sameIpOrderCount >= 3, requiresReview,
    },
    update: {
      riskScore: score, riskLevel: level, flags,
      ipAddress: opts.ipAddress ?? null, sameIpOrderCount,
      isHighValue, velocityFlag: sameIpOrderCount >= 3, requiresReview,
    },
  });

  if (score >= RISK_THRESHOLDS.HIGH) {
    await logFraudAudit({
      actionType:  "FLAG_ORDER",
      performedBy: "system",
      targetId:    opts.orderId,
      targetType:  "order",
      reason:      `Auto-flagged. Score: ${score} (${level}). Flags: ${flags.join(", ")}`,
    });
  }

  return { score, level, flags, requiresReview };
}

// ── Blacklist check ───────────────────────────────────────────────────────────

export async function isBlacklisted(
  type: "EMAIL" | "PHONE" | "IP" | "ADDRESS",
  value: string
): Promise<boolean> {
  if (!value) return false;
  const entry = await prisma.blacklist.findUnique({ where: { type_value: { type, value } } });
  if (entry?.status === "ACTIVE") {
    await prisma.blacklist.update({
      where: { id: entry.id },
      data:  { hitCount: { increment: 1 }, lastHitAt: new Date() },
    }).catch(() => null);
    return true;
  }
  return false;
}

// ── Fraud audit log ───────────────────────────────────────────────────────────

export async function logFraudAudit(opts: {
  actionType:   FraudActionType | string;
  targetType?:  string;
  targetId?:    string;
  performedBy?: string;
  reason?:      string;
  before?:      unknown;
  after?:       unknown;
  ipAddress?:   string;
}): Promise<void> {
  try {
    await prisma.fraudAuditLog.create({
      data: {
        actionType:  opts.actionType as FraudActionType,
        performedBy: opts.performedBy ?? "system",
        targetId:    opts.targetId   ?? "",
        targetType:  opts.targetType ?? "unknown",
        reason:      opts.reason,
        before:      opts.before != null ? opts.before as Prisma.InputJsonValue : undefined,
        after:       opts.after  != null ? opts.after  as Prisma.InputJsonValue : undefined,
        ipAddress:   opts.ipAddress,
      },
    });
  } catch { /* fire-and-forget */ }
}
