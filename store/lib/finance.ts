/**
 * TRYBY Financial Engine
 *
 * All monetary calculations are done with integer arithmetic in paise (1 INR = 100 paise)
 * to avoid floating-point rounding errors. Results are converted back to INR (2dp) only
 * at persistence time.
 *
 * Design principles:
 * - Every financial event creates an immutable SupplierLedger entry.
 * - Every delivered order creates a SupplierSettlement in HOLDING state.
 * - Settlements auto-release to AVAILABLE after holdDays (default 7).
 * - Returns/refunds reduce pendingBalance or availableBalance accordingly.
 * - availableBalance is the only amount the supplier can request payout for.
 * - All balances are recomputed by summing ledger entries — the balance
 *   fields on Supplier are a cached denormalisation updated on every event.
 */

import { prisma } from "@/lib/db";
import { LedgerEntryType, SettlementStatus, DisputeStatus } from "@prisma/client";

// ── Precision helpers ──────────────────────────────────────────────────────

/** Convert INR decimal to paise integer. */
export function toPaise(inr: number): number {
  return Math.round(inr * 100);
}

/** Convert paise integer back to INR (2dp). */
export function fromPaise(paise: number): number {
  return paise / 100;
}

/** Round INR to 2dp using "round half up" (banker-safe for INR). */
export function roundINR(n: number): number {
  return fromPaise(toPaise(n));
}

// ── Commission + GST calculation ──────────────────────────────────────────

export interface CommissionBreakdown {
  grossAmount:     number; // customer paid
  commissionAmt:   number; // platform fee (gross × commissionRate)
  gstOnCommission: number; // GST on the commission
  shippingDeduct:  number; // shipping cost absorbed by supplier (if any)
  netAmount:       number; // what supplier receives
}

export function calcCommission(
  grossINR:      number,
  commissionRate: number, // 0–1 (e.g. 0.15 = 15%)
  gstRate:       number,  // 0–1 (e.g. 0.18 = 18%)
  shippingDeductINR = 0,
): CommissionBreakdown {
  const grossP       = toPaise(grossINR);
  const commP        = Math.round(grossP * commissionRate);
  const gstP         = Math.round(commP  * gstRate);
  const shippingP    = toPaise(shippingDeductINR);
  const netP         = grossP - commP - gstP - shippingP;

  return {
    grossAmount:     fromPaise(grossP),
    commissionAmt:   fromPaise(commP),
    gstOnCommission: fromPaise(gstP),
    shippingDeduct:  fromPaise(shippingP),
    netAmount:       fromPaise(netP),
  };
}

// ── Ledger entry creation ──────────────────────────────────────────────────

interface LedgerEntryArgs {
  supplierId:      string;
  type:            LedgerEntryType;
  amount:          number;         // positive = credit, negative = debit
  grossAmount?:    number;
  commissionAmt?:  number;
  gstOnCommission?: number;
  shippingDeduct?: number;
  netAmount?:      number;
  gstRate?:        number;
  hsn?:            string;
  orderId?:        string;
  orderNumber?:    string;
  orderItemId?:    string;
  payoutId?:       string;
  returnRequestId?: string;
  settlementId?:   string;
  description:     string;
  adminNote?:      string;
  createdBy?:      string;
}

/**
 * Create a SupplierLedger entry and atomically update the Supplier wallet
 * balance fields.  Returns the created ledger row.
 *
 * Uses a Prisma transaction so the balance update and the log row are always
 * written together — never one without the other.
 */
export async function createLedgerEntry(args: LedgerEntryArgs) {
  return prisma.$transaction(async tx => {
    // Fetch current supplier balances
    const supplier = await tx.supplier.findUnique({
      where:  { id: args.supplierId },
      select: {
        availableBalance:  true,
        pendingBalance:    true,
        processingBalance: true,
        lifetimeEarnings:  true,
        totalDeductions:   true,
        totalPaidOut:      true,
      },
    });
    if (!supplier) throw new Error("Supplier not found: " + args.supplierId);

    const amt = args.amount; // signed

    // Determine balance delta based on entry type
    const balanceDelta = {
      availableBalance:  0,
      pendingBalance:    0,
      processingBalance: 0,
      lifetimeEarnings:  0,
      totalDeductions:   0,
      totalPaidOut:      0,
    };

    switch (args.type) {
      case LedgerEntryType.ORDER_EARNING:
      case LedgerEntryType.COMMISSION_DEDUCTION:
      case LedgerEntryType.GST_DEDUCTION:
      case LedgerEntryType.SHIPPING_DEDUCTION:
        // Net earning goes to pendingBalance (holding period)
        // Negative entries are already folded into netAmount
        balanceDelta.pendingBalance   = amt;
        if (amt > 0) balanceDelta.lifetimeEarnings = args.grossAmount ?? amt;
        if (amt < 0) balanceDelta.totalDeductions  = Math.abs(amt);
        break;

      case LedgerEntryType.HOLDING_CREDIT:
        // Moves from pendingBalance to availableBalance
        balanceDelta.pendingBalance   = -Math.abs(amt);
        balanceDelta.availableBalance = Math.abs(amt);
        break;

      case LedgerEntryType.REFUND_DEDUCTION:
      case LedgerEntryType.RETURN_DEDUCTION:
        // Deduct from pendingBalance first; overflow hits availableBalance
        balanceDelta.totalDeductions = Math.abs(amt);
        {
          const pending = roundINR(Number(supplier.pendingBalance));
          const deduct  = Math.abs(amt);
          if (pending >= deduct) {
            balanceDelta.pendingBalance = -deduct;
          } else {
            balanceDelta.pendingBalance   = -pending;
            balanceDelta.availableBalance = -(deduct - pending);
          }
        }
        break;

      case LedgerEntryType.PAYOUT_DEBIT:
        balanceDelta.availableBalance  = -Math.abs(amt);
        balanceDelta.processingBalance = Math.abs(amt);
        balanceDelta.totalPaidOut      = Math.abs(amt);
        break;

      case LedgerEntryType.MANUAL_CREDIT:
      case LedgerEntryType.DISPUTE_CREDIT:
        balanceDelta.availableBalance = Math.abs(amt);
        balanceDelta.lifetimeEarnings = Math.abs(amt);
        break;

      case LedgerEntryType.MANUAL_DEBIT:
      case LedgerEntryType.DISPUTE_DEBIT:
        balanceDelta.availableBalance = -Math.abs(amt);
        balanceDelta.totalDeductions  = Math.abs(amt);
        break;
    }

    // Compute new available balance for snapshot
    const newAvailable = roundINR(
      Number(supplier.availableBalance) + balanceDelta.availableBalance
    );

    // Update supplier wallet
    await tx.supplier.update({
      where: { id: args.supplierId },
      data: {
        availableBalance:  { increment: roundINR(balanceDelta.availableBalance)  },
        pendingBalance:    { increment: roundINR(balanceDelta.pendingBalance)    },
        processingBalance: { increment: roundINR(balanceDelta.processingBalance) },
        lifetimeEarnings:  { increment: roundINR(balanceDelta.lifetimeEarnings)  },
        totalDeductions:   { increment: roundINR(balanceDelta.totalDeductions)   },
        totalPaidOut:      { increment: roundINR(balanceDelta.totalPaidOut)      },
        // Keep legacy field in sync
        pendingPayout:     { increment: roundINR(balanceDelta.availableBalance)  },
      },
    });

    // Create the immutable ledger row
    const entry = await tx.supplierLedger.create({
      data: {
        supplierId:      args.supplierId,
        type:            args.type,
        amount:          roundINR(amt),
        grossAmount:     roundINR(args.grossAmount     ?? 0),
        commissionAmt:   roundINR(args.commissionAmt   ?? 0),
        gstOnCommission: roundINR(args.gstOnCommission ?? 0),
        shippingDeduct:  roundINR(args.shippingDeduct  ?? 0),
        netAmount:       roundINR(args.netAmount        ?? amt),
        gstRate:         args.gstRate        ?? 0,
        hsn:             args.hsn,
        orderId:         args.orderId,
        orderNumber:     args.orderNumber,
        orderItemId:     args.orderItemId,
        payoutId:        args.payoutId,
        returnRequestId: args.returnRequestId,
        settlementId:    args.settlementId,
        description:     args.description,
        adminNote:       args.adminNote,
        createdBy:       args.createdBy,
        balanceAfter:    newAvailable,
      },
    });

    return entry;
  });
}

// ── Settlement creation (called on order DELIVERED) ────────────────────────

export interface SettlementArgs {
  supplierId:   string;
  orderId:      string;
  orderNumber:  string;
  deliveredAt:  Date;
  grossAmount:  number;
  commissionRate: number;
  gstRate:      number;
  shippingDeductINR?: number;
  holdDays?:    number;
}

export async function createOrderSettlement(args: SettlementArgs) {
  const {
    supplierId, orderId, orderNumber, deliveredAt,
    grossAmount, commissionRate, gstRate,
    shippingDeductINR = 0, holdDays = 7,
  } = args;

  const breakdown = calcCommission(grossAmount, commissionRate, gstRate, shippingDeductINR);
  const holdUntil = new Date(deliveredAt.getTime() + holdDays * 24 * 60 * 60 * 1000);

  return prisma.$transaction(async tx => {
    // Idempotent — skip if already exists
    const existing = await tx.supplierSettlement.findUnique({ where: { orderId } });
    if (existing) return existing;

    const settlement = await tx.supplierSettlement.create({
      data: {
        supplierId,
        orderId,
        orderNumber,
        status:          SettlementStatus.HOLDING,
        grossAmount:     breakdown.grossAmount,
        commissionAmt:   breakdown.commissionAmt,
        gstOnCommission: breakdown.gstOnCommission,
        shippingDeduct:  breakdown.shippingDeduct,
        netAmount:       breakdown.netAmount,
        holdDays,
        holdUntil,
        deliveredAt,
      },
    });

    return settlement;
  });
}

/**
 * Release all settlements whose holdUntil has passed.
 * Moves netAmount from pendingBalance to availableBalance.
 * Called by cron every hour (or by admin manually).
 */
export async function releaseMaturedSettlements(): Promise<number> {
  const now = new Date();
  const due = await prisma.supplierSettlement.findMany({
    where:  { status: SettlementStatus.HOLDING, holdUntil: { lte: now } },
    select: { id: true, supplierId: true, orderId: true, orderNumber: true, netAmount: true },
  });

  let released = 0;
  for (const s of due) {
    try {
      await prisma.$transaction(async tx => {
        await tx.supplierSettlement.update({
          where: { id: s.id },
          data:  { status: SettlementStatus.AVAILABLE, releasedAt: now },
        });
      });

      // Create HOLDING_CREDIT ledger entry (moves pending → available)
      await createLedgerEntry({
        supplierId:  s.supplierId,
        type:        LedgerEntryType.HOLDING_CREDIT,
        amount:      Number(s.netAmount),
        description: `Settlement released for order ${s.orderNumber}`,
        orderId:     s.orderId,
        orderNumber: s.orderNumber,
        settlementId: s.id,
      });

      released++;
    } catch (e) {
      console.error(`[finance] Failed to release settlement ${s.id}:`, e);
    }
  }

  return released;
}

// ── Return / refund deduction ──────────────────────────────────────────────

export async function applyReturnDeduction(args: {
  supplierId:      string;
  orderId:         string;
  orderNumber:     string;
  returnRequestId: string;
  refundAmount:    number; // full customer refund amount
  commissionRate:  number;
  gstRate:         number;
}) {
  const {
    supplierId, orderId, orderNumber, returnRequestId,
    refundAmount, commissionRate, gstRate,
  } = args;

  // Supplier bears net amount of refund (platform refunds commission)
  const breakdown = calcCommission(refundAmount, commissionRate, gstRate);
  const deductAmt = breakdown.netAmount; // supplier loses their share

  // Also cancel/update the settlement if it's still HOLDING or AVAILABLE
  await prisma.supplierSettlement.updateMany({
    where: { orderId, status: { in: [SettlementStatus.HOLDING, SettlementStatus.AVAILABLE] } },
    data:  { status: SettlementStatus.CANCELLED, refundDeduct: deductAmt },
  });

  return createLedgerEntry({
    supplierId,
    type:            LedgerEntryType.RETURN_DEDUCTION,
    amount:          -deductAmt,
    grossAmount:     refundAmount,
    commissionAmt:   breakdown.commissionAmt,
    gstOnCommission: breakdown.gstOnCommission,
    netAmount:       -deductAmt,
    orderId,
    orderNumber,
    returnRequestId,
    description:     `Return deduction for order ${orderNumber} — refund ₹${refundAmount.toFixed(2)}`,
  });
}

// ── Payout debit (called when admin processes payout) ─────────────────────

export async function recordPayoutDebit(args: {
  supplierId:  string;
  payoutId:    string;
  amount:      number;
  utrNumber:   string;
}) {
  return createLedgerEntry({
    supplierId:  args.supplierId,
    type:        LedgerEntryType.PAYOUT_DEBIT,
    amount:      -args.amount,
    payoutId:    args.payoutId,
    description: `Payout transferred — UTR ${args.utrNumber}`,
  });
}

// ── GST report helpers ─────────────────────────────────────────────────────

export interface GSTSummary {
  totalGrossRevenue: number;
  totalCommission:   number;
  totalGSTCollected: number; // GST the platform collected on commission
  taxableValue:      number;
  cgst:              number;
  sgst:              number;
  igst:              number;
}

export function buildGSTSummary(entries: {
  grossAmount: number;
  commissionAmt: number;
  gstOnCommission: number;
}[]): GSTSummary {
  const totals = entries.reduce(
    (acc, e) => ({
      grossRevenue: acc.grossRevenue + Number(e.grossAmount),
      commission:   acc.commission   + Number(e.commissionAmt),
      gst:          acc.gst          + Number(e.gstOnCommission),
    }),
    { grossRevenue: 0, commission: 0, gst: 0 }
  );

  // Simplified: treat all as IGST (inter-state) — can be split by state later
  return {
    totalGrossRevenue: roundINR(totals.grossRevenue),
    totalCommission:   roundINR(totals.commission),
    totalGSTCollected: roundINR(totals.gst),
    taxableValue:      roundINR(totals.commission),
    cgst:              0,
    sgst:              0,
    igst:              roundINR(totals.gst),
  };
}

// ── CSV generation ─────────────────────────────────────────────────────────

export function buildCSV(
  headers: string[],
  rows: (string | number | null | undefined)[][]
): string {
  const escape = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    headers.map(escape).join(","),
    ...rows.map(row => row.map(escape).join(",")),
  ];
  return lines.join("\n");
}

export function buildSettlementCSVRows(entries: {
  createdAt:       Date;
  orderNumber?:    string | null;
  description:     string;
  type:            string;
  grossAmount:     number;
  commissionAmt:   number;
  gstOnCommission: number;
  shippingDeduct:  number;
  netAmount:       number;
  amount:          number;
  balanceAfter:    number;
}[]): (string | number | null)[][] {
  return entries.map(e => [
    e.createdAt.toISOString().slice(0, 19).replace("T", " "),
    e.orderNumber ?? "",
    e.type.replace(/_/g, " "),
    e.description,
    Number(e.grossAmount),
    Number(e.commissionAmt),
    Number(e.gstOnCommission),
    Number(e.shippingDeduct),
    Number(e.netAmount),
    Number(e.amount),
    Number(e.balanceAfter),
  ]);
}

export const SETTLEMENT_CSV_HEADERS = [
  "Date",
  "Order Number",
  "Transaction Type",
  "Description",
  "Gross Amount (₹)",
  "Commission (₹)",
  "GST on Commission (₹)",
  "Shipping Deduction (₹)",
  "Net Amount (₹)",
  "Credit/Debit (₹)",
  "Balance After (₹)",
];
