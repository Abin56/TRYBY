import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { PaymentMethod, PaymentStatus, OrderStatus, SettlementStatus, DisputeStatus, Prisma } from "@prisma/client";
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { createLedgerEntry } from "@/lib/finance";
import { LedgerEntryType } from "@prisma/client";
import { logSystemAudit } from "@/lib/audit";
import {
  notifyAdminsDisputeCreated,
  notifyAdminsDisputeActionRequired,
  notifyAdminsRefundFailed,
} from "@/lib/notifications";

// ── Signature verification ────────────────────────────────────────────────────

function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET not set — rejecting");
    return false;
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ── Method normalisation ──────────────────────────────────────────────────────

const METHOD_MAP: Record<string, PaymentMethod> = {
  card:       PaymentMethod.RAZORPAY_CARD,
  upi:        PaymentMethod.RAZORPAY_UPI,
  netbanking: PaymentMethod.RAZORPAY_NETBANKING,
  wallet:     PaymentMethod.RAZORPAY_WALLET,
};

// ── Payload extraction helpers ────────────────────────────────────────────────

function entity<T>(payload: Record<string, unknown>, key: string): T | undefined {
  const wrapper = (payload.payload as Record<string, unknown>)?.[key] as Record<string, unknown> | undefined;
  return ((wrapper?.entity ?? wrapper) as T | undefined);
}

// ── TASK 3 — Idempotency key with fallback ────────────────────────────────────
// Primary:  eventId|eventType    (when Razorpay sends x-razorpay-event-id)
// Fallback: {entityId}|eventType (derived from payload — prevents duplicate
//           processing when the event-id header is absent)

function resolveIdempotencyKey(
  eventId: string | undefined,
  eventType: string,
  payload: Record<string, unknown>,
): string | undefined {
  if (eventId) return `${eventId}|${eventType}`;

  // Derive a stable entity ID from the payload for the fallback key
  let entityId: string | undefined;

  if (eventType.startsWith("payment.dispute")) {
    const d = entity<Record<string, unknown>>(payload, "dispute");
    entityId = d?.id as string | undefined;
  } else if (eventType.startsWith("refund")) {
    const r = entity<Record<string, unknown>>(payload, "refund");
    entityId = r?.id as string | undefined;
  } else if (eventType.startsWith("payment")) {
    const p = entity<Record<string, unknown>>(payload, "payment");
    entityId = (p?.id ?? p?.order_id) as string | undefined;
  } else if (eventType.startsWith("order")) {
    const o = entity<Record<string, unknown>>(payload, "order");
    entityId = o?.id as string | undefined;
  } else if (eventType.startsWith("settlement")) {
    const s = entity<Record<string, unknown>>(payload, "settlement");
    entityId = s?.id as string | undefined;
  }

  return entityId ? `${entityId}|${eventType}` : undefined;
}

// ── TASK 1 — Dispute handlers ─────────────────────────────────────────────────

async function handleDisputeCreated(payload: Record<string, unknown>) {
  const d = entity<Record<string, unknown>>(payload, "dispute");
  if (!d) return;

  const razorpayDisputeId = d.id            as string | undefined;
  const razorpayPaymentId = d.payment_id    as string | undefined;
  const reason            = (d.reason_code ?? d.reason ?? "chargeback") as string;
  const description       = (d.reason_description ?? reason) as string;
  const amountPaise       = d.amount        as number | undefined;
  const disputeAmount     = amountPaise !== undefined ? amountPaise / 100 : undefined;

  if (!razorpayDisputeId || !razorpayPaymentId) return;

  // Idempotent — skip if already created
  const existing = await prisma.settlementDispute.findUnique({
    where: { razorpayDisputeId },
  });
  if (existing) return;

  // Find the payment and its settlement
  const payment = await prisma.payment.findFirst({
    where:   { razorpayPaymentId },
    include: { order: { select: { id: true, orderNumber: true, userId: true, status: true } } },
  });
  if (!payment) return;

  const settlement = await prisma.supplierSettlement.findUnique({
    where:   { orderId: payment.orderId },
    include: { supplier: { select: { id: true } } },
  });
  if (!settlement) return;

  // Create dispute record and freeze settlement atomically
  await prisma.$transaction([
    prisma.settlementDispute.create({
      data: {
        supplierId:        settlement.supplierId,
        settlementId:      settlement.id,
        razorpayDisputeId,
        razorpayPaymentId,
        status:            DisputeStatus.OPEN,
        reason,
        description,
        disputeAmount:     disputeAmount ?? null,
      },
    }),
    prisma.supplierSettlement.update({
      where: { id: settlement.id },
      data:  { status: SettlementStatus.DISPUTED },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: payment.orderId,
        status:  payment.order.status as OrderStatus,
        note:    `Razorpay dispute raised — reason: ${reason}`,
      },
    }),
  ]);

  // Notify admins (fire-and-forget)
  notifyAdminsDisputeCreated(
    payment.order.orderNumber,
    disputeAmount ?? Number(payment.amount),
    razorpayDisputeId,
  ).catch(() => null);

  await logSystemAudit({
    action:       "DISPUTE_CREATED",
    resourceType: "payment",
    resourceId:   payment.id,
    resourceName: payment.order.orderNumber,
    newValue:     { razorpayDisputeId, razorpayPaymentId, reason, disputeAmount },
  });
}

async function handleDisputeUnderReview(payload: Record<string, unknown>) {
  const d = entity<Record<string, unknown>>(payload, "dispute");
  if (!d) return;

  const razorpayDisputeId = d.id as string | undefined;
  if (!razorpayDisputeId) return;

  const dispute = await prisma.settlementDispute.findUnique({
    where: { razorpayDisputeId },
  });
  if (!dispute || dispute.status === DisputeStatus.UNDER_REVIEW) return;

  await prisma.settlementDispute.update({
    where: { razorpayDisputeId },
    data:  { status: DisputeStatus.UNDER_REVIEW },
  });

  await logSystemAudit({
    action:       "DISPUTE_UPDATED",
    resourceType: "settlement_dispute",
    resourceId:   dispute.id,
    oldValue:     { status: dispute.status },
    newValue:     { status: DisputeStatus.UNDER_REVIEW },
  });
}

async function handleDisputeActionRequired(payload: Record<string, unknown>) {
  const d = entity<Record<string, unknown>>(payload, "dispute");
  if (!d) return;

  const razorpayDisputeId = d.id as string | undefined;
  if (!razorpayDisputeId) return;

  const dispute = await prisma.settlementDispute.findUnique({
    where:   { razorpayDisputeId },
    include: { settlement: { include: { supplier: { select: { id: true } } } } },
  });
  if (!dispute) return;

  // Fetch order number via payment for the notification
  const payment = dispute.razorpayPaymentId
    ? await prisma.payment.findFirst({
        where:   { razorpayPaymentId: dispute.razorpayPaymentId },
        include: { order: { select: { orderNumber: true } } },
      })
    : null;

  if (dispute.status !== DisputeStatus.ACTION_REQUIRED) {
    await prisma.settlementDispute.update({
      where: { razorpayDisputeId },
      data:  { status: DisputeStatus.ACTION_REQUIRED },
    });
  }

  notifyAdminsDisputeActionRequired(
    payment?.order.orderNumber ?? razorpayDisputeId,
    razorpayDisputeId,
  ).catch(() => null);

  await logSystemAudit({
    action:       "DISPUTE_UPDATED",
    resourceType: "settlement_dispute",
    resourceId:   dispute.id,
    oldValue:     { status: dispute.status },
    newValue:     { status: DisputeStatus.ACTION_REQUIRED },
  });
}

async function handleDisputeWon(payload: Record<string, unknown>) {
  const d = entity<Record<string, unknown>>(payload, "dispute");
  if (!d) return;

  const razorpayDisputeId = d.id         as string | undefined;
  const amountPaise       = d.amount     as number | undefined;
  if (!razorpayDisputeId) return;

  const dispute = await prisma.settlementDispute.findUnique({
    where:   { razorpayDisputeId },
    include: { settlement: true },
  });
  if (!dispute) return;
  if (dispute.status === DisputeStatus.RESOLVED_FOR_SUPPLIER) return; // idempotent

  const creditAmount = amountPaise !== undefined
    ? amountPaise / 100
    : Number(dispute.disputeAmount ?? 0);

  const payment = dispute.razorpayPaymentId
    ? await prisma.payment.findFirst({
        where:   { razorpayPaymentId: dispute.razorpayPaymentId },
        include: { order: { select: { orderNumber: true } } },
      })
    : null;

  // Resolve dispute, restore settlement, create DISPUTE_CREDIT ledger entry
  await prisma.$transaction([
    prisma.settlementDispute.update({
      where: { razorpayDisputeId },
      data:  { status: DisputeStatus.RESOLVED_FOR_SUPPLIER, resolvedAt: new Date() },
    }),
    // Re-open settlement to its prior state (HOLDING or AVAILABLE)
    // Use AVAILABLE since the hold has likely passed by dispute resolution time
    prisma.supplierSettlement.update({
      where: { id: dispute.settlementId },
      data:  { status: SettlementStatus.AVAILABLE },
    }),
  ]);

  // Ledger credit (outside main tx so finance.ts handles its own transaction)
  await createLedgerEntry({
    supplierId:  dispute.supplierId,
    type:        LedgerEntryType.DISPUTE_CREDIT,
    amount:      creditAmount,
    settlementId: dispute.settlementId,
    orderId:     dispute.settlement.orderId,
    orderNumber: dispute.settlement.orderNumber,
    description: `Dispute resolved in supplier's favour — Razorpay dispute ${razorpayDisputeId}`,
  });

  await logSystemAudit({
    action:       "DISPUTE_WON",
    resourceType: "settlement_dispute",
    resourceId:   dispute.id,
    resourceName: payment?.order.orderNumber ?? razorpayDisputeId,
    newValue:     { status: DisputeStatus.RESOLVED_FOR_SUPPLIER, creditAmount },
  });
}

async function handleDisputeLost(payload: Record<string, unknown>) {
  const d = entity<Record<string, unknown>>(payload, "dispute");
  if (!d) return;

  const razorpayDisputeId = d.id         as string | undefined;
  const amountPaise       = d.amount     as number | undefined;
  if (!razorpayDisputeId) return;

  const dispute = await prisma.settlementDispute.findUnique({
    where:   { razorpayDisputeId },
    include: { settlement: true },
  });
  if (!dispute) return;
  if (dispute.status === DisputeStatus.RESOLVED_FOR_PLATFORM) return; // idempotent

  const debitAmount = amountPaise !== undefined
    ? amountPaise / 100
    : Number(dispute.disputeAmount ?? 0);

  const payment = dispute.razorpayPaymentId
    ? await prisma.payment.findFirst({
        where:   { razorpayPaymentId: dispute.razorpayPaymentId },
        include: { order: { select: { orderNumber: true } } },
      })
    : null;

  await prisma.settlementDispute.update({
    where: { razorpayDisputeId },
    data:  {
      status:     DisputeStatus.RESOLVED_FOR_PLATFORM,
      resolvedAt: new Date(),
    },
  });

  // Ledger debit — supplier bears the dispute loss
  await createLedgerEntry({
    supplierId:  dispute.supplierId,
    type:        LedgerEntryType.DISPUTE_DEBIT,
    amount:      -debitAmount,
    settlementId: dispute.settlementId,
    orderId:     dispute.settlement.orderId,
    orderNumber: dispute.settlement.orderNumber,
    description: `Dispute lost — Razorpay dispute ${razorpayDisputeId}. Amount ₹${debitAmount.toFixed(2)} debited.`,
  });

  await logSystemAudit({
    action:       "DISPUTE_LOST",
    resourceType: "settlement_dispute",
    resourceId:   dispute.id,
    resourceName: payment?.order.orderNumber ?? razorpayDisputeId,
    newValue:     { status: DisputeStatus.RESOLVED_FOR_PLATFORM, debitAmount },
  });
}

async function handleDisputeClosed(payload: Record<string, unknown>) {
  const d = entity<Record<string, unknown>>(payload, "dispute");
  if (!d) return;

  const razorpayDisputeId = d.id as string | undefined;
  if (!razorpayDisputeId) return;

  const dispute = await prisma.settlementDispute.findUnique({
    where: { razorpayDisputeId },
  });
  if (!dispute || dispute.status === DisputeStatus.CLOSED) return;

  await prisma.settlementDispute.update({
    where: { razorpayDisputeId },
    data:  { status: DisputeStatus.CLOSED, resolvedAt: new Date() },
  });

  await logSystemAudit({
    action:       "DISPUTE_CLOSED",
    resourceType: "settlement_dispute",
    resourceId:   dispute.id,
    oldValue:     { status: dispute.status },
    newValue:     { status: DisputeStatus.CLOSED },
  });
}

// ── TASK 2 — refund.failed recovery ──────────────────────────────────────────

async function handleRefundFailed(payload: Record<string, unknown>) {
  const r = entity<Record<string, unknown>>(payload, "refund");
  if (!r) return;

  const razorpayPaymentId = r.payment_id as string | undefined;
  const failedRefundId    = r.id         as string | undefined;
  const amountPaise       = r.amount     as number | undefined;
  if (!razorpayPaymentId) return;

  const payment = await prisma.payment.findFirst({
    where:   { razorpayPaymentId },
    include: { order: { select: { orderNumber: true, status: true } } },
  });
  if (!payment) return;

  // Only reverse if the payment was marked REFUNDED or PARTIALLY_REFUNDED
  // by the admin refund route before Razorpay confirmed failure
  if (
    payment.status !== PaymentStatus.REFUNDED &&
    payment.status !== PaymentStatus.PARTIALLY_REFUNDED
  ) return;

  const failedAmountINR = amountPaise !== undefined ? amountPaise / 100 : 0;

  // Determine correct restored state
  // If the failed refund amount === total refundedAmount recorded → restore to CAPTURED
  // If partial (other refunds may have already succeeded) → restore to PARTIALLY_REFUNDED with reduced amount
  const previouslyRefunded = Number(payment.refundedAmount ?? 0);
  const restoredRefundedAmt = Math.max(0, previouslyRefunded - failedAmountINR);
  const restoredStatus =
    restoredRefundedAmt <= 0
      ? PaymentStatus.CAPTURED
      : PaymentStatus.PARTIALLY_REFUNDED;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data:  {
        status:          restoredStatus,
        refundedAmount:  restoredRefundedAmt > 0 ? restoredRefundedAmt : null,
        refundedAt:      restoredRefundedAmt > 0 ? payment.refundedAt : null,
        // Clear refundId only if fully reversing back to CAPTURED
        ...(restoredStatus === PaymentStatus.CAPTURED ? { refundId: null } : {}),
      },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: payment.orderId,
        status:  payment.order.status as OrderStatus,
        note:    `Refund failed (Razorpay refund ${failedRefundId ?? "unknown"}) — payment restored to ${restoredStatus}`,
      },
    }),
  ]);

  notifyAdminsRefundFailed(payment.order.orderNumber, failedRefundId ?? null).catch(() => null);

  await logSystemAudit({
    action:       "REFUND_FAILED",
    resourceType: "payment",
    resourceId:   payment.id,
    resourceName: payment.order.orderNumber,
    oldValue:     { status: payment.status, refundedAmount: previouslyRefunded },
    newValue:     { status: restoredStatus, refundedAmount: restoredRefundedAmt },
    metadata:     { failedRefundId, failedAmountINR },
  });
}

// ── TASK 5 — settlement.processed ────────────────────────────────────────────

async function handleSettlementProcessed(payload: Record<string, unknown>) {
  const s = entity<Record<string, unknown>>(payload, "settlement");
  if (!s) return;

  const razorpaySettlementId = s.id          as string | undefined;
  const utr                  = s.utr         as string | undefined;
  const amountPaise          = s.amount      as number | undefined;
  const feesPaise            = s.fees        as number | undefined;
  const taxPaise             = s.tax         as number | undefined;
  const settledOnEpoch       = s.settled_on  as number | undefined; // unix seconds
  const description          = s.description as string | undefined;

  if (!razorpaySettlementId || amountPaise === undefined) return;

  // Idempotent
  const existing = await prisma.razorpaySettlement.findUnique({
    where: { razorpaySettlementId },
  });
  if (existing) return;

  const amount    = amountPaise / 100;
  const fees      = feesPaise !== undefined ? feesPaise / 100 : 0;
  const tax       = taxPaise  !== undefined ? taxPaise  / 100 : 0;
  const settledAt = settledOnEpoch
    ? new Date(settledOnEpoch * 1000)
    : new Date();

  // Compute internal total: sum of CAPTURED payments in a ±1 day window around settledAt
  const windowStart = new Date(settledAt.getTime() - 24 * 60 * 60 * 1000);
  const windowEnd   = new Date(settledAt.getTime() + 24 * 60 * 60 * 1000);

  const internalAgg = await prisma.payment.aggregate({
    where: {
      status:     PaymentStatus.CAPTURED,
      capturedAt: { gte: windowStart, lte: windowEnd },
    },
    _sum: { amount: true },
  });

  const internalTotal = Number(internalAgg._sum.amount ?? 0);
  // Razorpay amount is after platform fees; tolerance is ₹50 to allow for rounding
  const mismatch     = Math.abs(amount - internalTotal) > 50;
  const mismatchNote = mismatch
    ? `Razorpay settled ₹${amount.toFixed(2)} but internal captured total is ₹${internalTotal.toFixed(2)} (diff ₹${Math.abs(amount - internalTotal).toFixed(2)})`
    : null;

  await prisma.razorpaySettlement.create({
    data: {
      razorpaySettlementId,
      utr,
      amount,
      fees,
      tax,
      settledAt,
      description: description ?? null,
      internalTotal,
      mismatch,
      mismatchNote,
      reconciledAt: new Date(),
    },
  });

  if (mismatch) {
    console.warn(`[webhook] settlement mismatch: ${mismatchNote}`);
  }

  await logSystemAudit({
    action:       "SETTLEMENT_PROCESSED",
    resourceType: "razorpay_settlement",
    resourceId:   razorpaySettlementId,
    resourceName: utr ?? razorpaySettlementId,
    newValue:     { amount, fees, tax, internalTotal, mismatch, mismatchNote },
  });
}

// ── Existing handlers (payment.captured, payment.failed, order.paid, refund) ──
// Preserved exactly — no changes to working checkout/verify logic.

async function handlePaymentCaptured(payload: Record<string, unknown>) {
  const p = entity<Record<string, unknown>>(payload, "payment");
  if (!p) return;

  const razorpayOrderId   = p.order_id as string | undefined;
  const razorpayPaymentId = p.id       as string | undefined;
  const methodRaw         = p.method   as string | undefined;

  if (!razorpayOrderId || !razorpayPaymentId) return;

  const payment = await prisma.payment.findFirst({
    where:   { razorpayOrderId },
    include: { order: { select: { orderNumber: true } } },
  });
  if (!payment) return;
  if (payment.status === PaymentStatus.CAPTURED) return; // idempotent

  const method = (methodRaw && METHOD_MAP[methodRaw]) ?? undefined;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data:  {
        razorpayPaymentId,
        status:     PaymentStatus.CAPTURED,
        capturedAt: new Date(),
        ...(method ? { method } : {}),
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data:  { status: OrderStatus.CONFIRMED },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: payment.orderId,
        status:  OrderStatus.CONFIRMED,
        note:    "Payment confirmed via webhook (payment.captured)",
      },
    }),
  ]);

  await logSystemAudit({
    action:       "PAYMENT_CAPTURED",
    resourceType: "payment",
    resourceId:   payment.id,
    resourceName: payment.order.orderNumber,
    newValue:     { razorpayPaymentId, method },
  });
}

async function handlePaymentFailed(payload: Record<string, unknown>) {
  const p = entity<Record<string, unknown>>(payload, "payment");
  if (!p) return;

  const razorpayOrderId = p.order_id as string | undefined;
  const errorDesc = (p.error_description ?? p.error_reason ?? "Payment failed via webhook") as string;

  if (!razorpayOrderId) return;

  const payment = await prisma.payment.findFirst({
    where:   { razorpayOrderId },
    include: { order: { select: { orderNumber: true } } },
  });
  if (!payment || payment.status === PaymentStatus.CAPTURED) return;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data:  { status: PaymentStatus.FAILED, failureReason: errorDesc },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data:  { status: OrderStatus.CANCELLED },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: payment.orderId,
        status:  OrderStatus.CANCELLED,
        note:    `Payment failed via webhook: ${errorDesc}`,
      },
    }),
  ]);

  await logSystemAudit({
    action:       "PAYMENT_FAILED",
    resourceType: "payment",
    resourceId:   payment.id,
    resourceName: payment.order.orderNumber,
    newValue:     { errorDesc },
  });
}

async function handleOrderPaid(payload: Record<string, unknown>) {
  const o = entity<Record<string, unknown>>(payload, "order");
  if (!o) return;

  const razorpayOrderId = o.id as string | undefined;
  if (!razorpayOrderId) return;

  const payment = await prisma.payment.findFirst({
    where:   { razorpayOrderId },
    include: { order: { select: { orderNumber: true } } },
  });
  if (!payment || payment.status === PaymentStatus.CAPTURED) return;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data:  { status: PaymentStatus.CAPTURED, capturedAt: new Date() },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data:  { status: OrderStatus.CONFIRMED },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: payment.orderId,
        status:  OrderStatus.CONFIRMED,
        note:    "Payment confirmed via webhook (order.paid)",
      },
    }),
  ]);

  await logSystemAudit({
    action:       "PAYMENT_CAPTURED",
    resourceType: "payment",
    resourceId:   payment.id,
    resourceName: payment.order.orderNumber,
    newValue:     { source: "order.paid" },
  });
}

async function handleRefund(payload: Record<string, unknown>, eventType: string) {
  const r = entity<Record<string, unknown>>(payload, "refund");
  if (!r) return;

  const razorpayPaymentId = r.payment_id as string | undefined;
  const refundId          = r.id         as string | undefined;
  const refundAmountPaise = r.amount     as number | undefined;

  if (!razorpayPaymentId || !refundId || refundAmountPaise === undefined) return;

  const payment = await prisma.payment.findFirst({
    where:   { razorpayPaymentId },
    include: { order: { select: { orderNumber: true } } },
  });
  if (!payment) return;

  // Only update on refund.processed (final state); refund.created is informational
  if (eventType !== "refund.processed") return;

  // Idempotent — skip if this refundId already recorded
  if (payment.refundId === refundId) return;

  const refundedRupees   = refundAmountPaise / 100;
  const totalRefunded    = Number(payment.refundedAmount ?? 0) + refundedRupees;
  const isFullRefund     = totalRefunded >= Number(payment.amount) - 0.01;
  const newPaymentStatus = isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
  const newOrderStatus   = isFullRefund ? OrderStatus.REFUNDED   : OrderStatus.CONFIRMED;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data:  {
        status:         newPaymentStatus,
        refundId,
        refundedAmount: totalRefunded,
        refundedAt:     new Date(),
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data:  { status: newOrderStatus },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: payment.orderId,
        status:  newOrderStatus,
        note:    `Refund of ₹${refundedRupees.toLocaleString("en-IN")} processed via webhook (refund ID: ${refundId})`,
      },
    }),
  ]);

  await logSystemAudit({
    action:       "REFUND_PROCESSED",
    resourceType: "payment",
    resourceId:   payment.id,
    resourceName: payment.order.orderNumber,
    oldValue:     { status: payment.status },
    newValue:     { status: newPaymentStatus, refundId, totalRefunded },
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────

const HANDLED_EVENTS = new Set([
  // Existing
  "payment.captured",
  "payment.failed",
  "order.paid",
  "refund.created",
  "refund.processed",
  // Task 1 — disputes
  "payment.dispute.created",
  "payment.dispute.under_review",
  "payment.dispute.action_required",
  "payment.dispute.won",
  "payment.dispute.lost",
  "payment.dispute.closed",
  // Task 2 — refund failure recovery
  "refund.failed",
  // Task 5 — settlement reconciliation
  "settlement.processed",
]);

export async function POST(req: NextRequest) {
  // IP-based rate limit (200/min)
  const rl = await rateLimit(req, "/api/webhooks/razorpay", RATE_LIMITS.webhook);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(rl, RATE_LIMITS.webhook.limit) }
    );
  }

  const rawBody   = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const eventId   = req.headers.get("x-razorpay-event-id")  ?? undefined;

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = payload.event as string | undefined;
  if (!eventType) return NextResponse.json({ error: "Missing event type" }, { status: 400 });

  if (!HANDLED_EVENTS.has(eventType)) {
    return NextResponse.json({ ok: true, handled: false });
  }

  // TASK 3 — Idempotency with fallback key
  const idempotencyKey = resolveIdempotencyKey(eventId, eventType, payload);

  if (idempotencyKey) {
    const existing = await prisma.webhookEvent.findUnique({ where: { idempotencyKey } });
    if (existing) return NextResponse.json({ ok: true, duplicate: true });
  }

  const event = await prisma.webhookEvent.create({
    data: {
      provider:      "razorpay",
      eventId,
      eventType,
      payload:       payload as Prisma.InputJsonValue,
      processed:     false,
      idempotencyKey,
    },
  });

  let processingError: string | undefined;

  try {
    switch (eventType) {
      case "payment.captured":                await handlePaymentCaptured(payload);      break;
      case "payment.failed":                  await handlePaymentFailed(payload);        break;
      case "order.paid":                      await handleOrderPaid(payload);            break;
      case "refund.created":
      case "refund.processed":                await handleRefund(payload, eventType);    break;
      case "refund.failed":                   await handleRefundFailed(payload);         break;
      case "payment.dispute.created":         await handleDisputeCreated(payload);       break;
      case "payment.dispute.under_review":    await handleDisputeUnderReview(payload);   break;
      case "payment.dispute.action_required": await handleDisputeActionRequired(payload);break;
      case "payment.dispute.won":             await handleDisputeWon(payload);           break;
      case "payment.dispute.lost":            await handleDisputeLost(payload);          break;
      case "payment.dispute.closed":          await handleDisputeClosed(payload);        break;
      case "settlement.processed":            await handleSettlementProcessed(payload);  break;
    }
  } catch (err) {
    processingError = err instanceof Error ? err.message : String(err);
    console.error(`[webhook] error handling ${eventType}:`, err);
  }

  await prisma.webhookEvent.update({
    where: { id: event.id },
    data:  {
      processed:   !processingError,
      processedAt: processingError ? undefined : new Date(),
      error:       processingError,
    },
  });

  if (processingError) {
    // Return 200 so Razorpay doesn't retry — error is logged for manual review
    return NextResponse.json({ ok: false, error: processingError });
  }

  return NextResponse.json({ ok: true });
}
