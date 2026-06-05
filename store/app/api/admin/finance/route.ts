/**
 * /api/admin/finance — Founder Finance Center
 *
 * Single endpoint returning every number the founder needs.
 * Supports ?export=csv for downloadable P&L.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, OrderStatus, PayoutStatus } from "@prisma/client";
import { buildCSV } from "@/lib/finance";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// ── Date helpers ────────────────────────────────────────────────────────────

function startOf(unit: "day" | "week" | "month", now: Date): Date {
  const d = new Date(now);
  if (unit === "day") {
    d.setHours(0, 0, 0, 0);
  } else if (unit === "week") {
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
  } else {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

function daysAgo(n: number, from: Date): Date {
  return new Date(from.getTime() - n * 86400000);
}

// ── Excluded order statuses ─────────────────────────────────────────────────

const EXCLUDED: OrderStatus[] = [
  OrderStatus.CANCELLED,
  OrderStatus.RETURNED,
  OrderStatus.REFUNDED,
];

// ── Constants ────────────────────────────────────────────────────────────────

const GATEWAY_FEE_RATE  = 0.02;  // 2% Razorpay
const SHIPPING_COST_PCT = 0.03;  // 3% of GMV — used when actual cost unknown

// ── Types ─────────────────────────────────────────────────────────────────────

type MonthRow = {
  month: string;
  revenue: number;
  supplierCosts: number;
  refunds: number;
  shipping: number;
  gatewayFees: number;
  grossProfit: number;
  netProfit: number;
  margin: number;
};

function buildPnLCSV(rows: MonthRow[]): string {
  return buildCSV(
    ["Month","Revenue (₹)","Supplier Costs (₹)","Refunds (₹)","Shipping (₹)","Gateway Fees (₹)","Gross Profit (₹)","Net Profit (₹)","Margin (%)"],
    rows.map(r => [r.month, r.revenue, r.supplierCosts, r.refunds, r.shipping, r.gatewayFees, r.grossProfit, r.netProfit, r.margin])
  );
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const exportFormat = searchParams.get("export");

  const now            = new Date();
  const todayStart     = startOf("day",   now);
  const yesterdayStart = daysAgo(1, todayStart);
  const weekStart      = startOf("week",  now);
  const monthStart     = startOf("month", now);
  const thirtyDaysAgo  = daysAgo(30,  now);
  const sixtyDaysAgo   = daysAgo(60,  now);
  const thirteenMonths = daysAgo(395, now);

  const n = (v: unknown) => Number(v ?? 0);

  const [
    revToday, revYesterday, revWeek, revMonth, revLifetime, revLast30, revPrev30,
    refundTotal, refundMonth, refundLast30, refundPrev30, refundCount,
    topRefundedItems,
    settlementByStatus, openDisputes,
    payoutsMonth, payoutsLifetime,
    commissionLifetime, commissionMonth,
    topByRevenue, topByOrders,
    monthlyLedger, monthlyRefunds,
    dailyLedger,
    paymentsMonth, paymentsLifetime,
  ] = await Promise.all([

    // ── Revenue ──────────────────────────────────────────────────────────────
    prisma.orderItem.aggregate({ where: { order: { status: { notIn: EXCLUDED }, createdAt: { gte: todayStart     } } }, _sum: { total: true } }),
    prisma.orderItem.aggregate({ where: { order: { status: { notIn: EXCLUDED }, createdAt: { gte: yesterdayStart, lt: todayStart } } }, _sum: { total: true } }),
    prisma.orderItem.aggregate({ where: { order: { status: { notIn: EXCLUDED }, createdAt: { gte: weekStart      } } }, _sum: { total: true } }),
    prisma.orderItem.aggregate({ where: { order: { status: { notIn: EXCLUDED }, createdAt: { gte: monthStart     } } }, _sum: { total: true } }),
    prisma.orderItem.aggregate({ where: { order: { status: { notIn: EXCLUDED }                                   } }, _sum: { total: true } }),
    prisma.orderItem.aggregate({ where: { order: { status: { notIn: EXCLUDED }, createdAt: { gte: thirtyDaysAgo } } }, _sum: { total: true } }),
    prisma.orderItem.aggregate({ where: { order: { status: { notIn: EXCLUDED }, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }, _sum: { total: true } }),

    // ── Refunds ───────────────────────────────────────────────────────────────
    prisma.returnRequest.aggregate({ where: { status: "REFUNDED"                                                    }, _sum: { refundAmount: true }, _count: { id: true } }),
    prisma.returnRequest.aggregate({ where: { status: "REFUNDED", refundedAt: { gte: monthStart     }              }, _sum: { refundAmount: true }, _count: { id: true } }),
    prisma.returnRequest.aggregate({ where: { status: "REFUNDED", refundedAt: { gte: thirtyDaysAgo }               }, _sum: { refundAmount: true }, _count: { id: true } }),
    prisma.returnRequest.aggregate({ where: { status: "REFUNDED", refundedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }, _sum: { refundAmount: true }, _count: { id: true } }),
    prisma.returnRequest.count({ where: { status: "REFUNDED" } }),

    // Top refunded products — via ReturnItem (has productId)
    prisma.returnItem.groupBy({
      by:      ["productId"],
      where:   { returnRequest: { status: "REFUNDED" } },
      _sum:    { unitPrice: true },
      _count:  { id: true },
      orderBy: { _sum: { unitPrice: "desc" } },
      take:    10,
    }),

    // ── Settlements ───────────────────────────────────────────────────────────
    prisma.supplierSettlement.groupBy({
      by:     ["status"],
      _count: { id: true },
      _sum:   { grossAmount: true, netAmount: true, commissionAmt: true, gstOnCommission: true },
    }),
    prisma.settlementDispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),

    // ── Payouts ────────────────────────────────────────────────────────────────
    prisma.payout.aggregate({ where: { status: PayoutStatus.PROCESSED, updatedAt: { gte: monthStart } }, _sum: { amount: true }, _count: { id: true } }),
    prisma.payout.aggregate({ where: { status: PayoutStatus.PROCESSED                                }, _sum: { amount: true } }),

    // ── Commission from ledger ─────────────────────────────────────────────────
    prisma.supplierLedger.aggregate({ where: { type: "ORDER_EARNING"                         }, _sum: { commissionAmt: true, gstOnCommission: true, grossAmount: true }, _count: { id: true } }),
    prisma.supplierLedger.aggregate({ where: { type: "ORDER_EARNING", createdAt: { gte: monthStart } }, _sum: { commissionAmt: true, gstOnCommission: true, grossAmount: true } }),

    // ── Top suppliers ──────────────────────────────────────────────────────────
    prisma.supplier.findMany({
      where:   { status: "APPROVED" },
      select:  { id: true, companyName: true, tier: true, commissionRate: true, lifetimeEarnings: true, totalSales: true, totalOrders: true, availableBalance: true, user: { select: { name: true, email: true } } },
      orderBy: { totalSales: "desc" },
      take:    10,
    }),
    prisma.supplier.findMany({
      where:   { status: "APPROVED" },
      select:  { id: true, companyName: true, tier: true, commissionRate: true, totalOrders: true, totalSales: true, lifetimeEarnings: true },
      orderBy: { totalOrders: "desc" },
      take:    10,
    }),

    // ── Monthly P&L data ───────────────────────────────────────────────────────
    prisma.supplierLedger.findMany({
      where:   { type: "ORDER_EARNING", createdAt: { gte: thirteenMonths } },
      select:  { createdAt: true, grossAmount: true, commissionAmt: true, gstOnCommission: true },
    }),
    prisma.returnRequest.findMany({
      where:   { status: "REFUNDED", refundedAt: { gte: thirteenMonths } },
      select:  { refundedAt: true, refundAmount: true },
    }),

    // ── Daily sparkline ────────────────────────────────────────────────────────
    prisma.supplierLedger.findMany({
      where:   { type: "ORDER_EARNING", createdAt: { gte: thirtyDaysAgo } },
      select:  { createdAt: true, grossAmount: true, commissionAmt: true },
    }),

    // ── Customer payments (cash in) ────────────────────────────────────────────
    prisma.payment.aggregate({ where: { status: "CAPTURED", updatedAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "CAPTURED"                                }, _sum: { amount: true } }),
  ]);

  // ── Resolve top-refunded product names ───────────────────────────────────
  const productIds = topRefundedItems.map(r => r.productId);
  const products   = await prisma.product.findMany({
    where:  { id: { in: productIds } },
    select: { id: true, name: true, slug: true },
  });
  const productMap = Object.fromEntries(products.map(p => [p.id, p]));

  // ── Revenue ──────────────────────────────────────────────────────────────
  const gmvLifetime = n(revLifetime._sum?.total);
  const gmvMonth    = n(revMonth._sum?.total);
  const gmvLast30   = n(revLast30._sum?.total);
  const gmvPrev30   = n(revPrev30._sum?.total);
  const gmvGrowth   = gmvPrev30 > 0
    ? Math.round(((gmvLast30 - gmvPrev30) / gmvPrev30) * 1000) / 10
    : gmvLast30 > 0 ? 100 : 0;

  // ── Refunds ──────────────────────────────────────────────────────────────
  const refundAmtLifetime = n(refundTotal._sum?.refundAmount);
  const refundAmtMonth    = n(refundMonth._sum?.refundAmount);
  const refundAmtLast30   = n(refundLast30._sum?.refundAmount);
  const refundAmtPrev30   = n(refundPrev30._sum?.refundAmount);
  const refundRateLast30  = gmvLast30 > 0 ? Math.round((refundAmtLast30 / gmvLast30) * 10000) / 100 : 0;
  const refundGrowth      = refundAmtPrev30 > 0
    ? Math.round(((refundAmtLast30 - refundAmtPrev30) / refundAmtPrev30) * 1000) / 10
    : 0;

  // ── Commission ────────────────────────────────────────────────────────────
  const commLifetime = n(commissionLifetime._sum?.commissionAmt);
  const gstLifetime  = n(commissionLifetime._sum?.gstOnCommission);
  const commMonth    = n(commissionMonth._sum?.commissionAmt);
  const gstMonth     = n(commissionMonth._sum?.gstOnCommission);

  // ── Shipping (estimated — Shipment model has no cost field) ───────────────
  const shippingMonth    = Math.round(gmvMonth    * SHIPPING_COST_PCT * 100) / 100;
  const shippingLifetime = Math.round(gmvLifetime * SHIPPING_COST_PCT * 100) / 100;

  // ── Gateway fees ──────────────────────────────────────────────────────────
  const gatewayMonth    = Math.round(n(paymentsMonth._sum?.amount)    * GATEWAY_FEE_RATE * 100) / 100;
  const gatewayLifetime = Math.round(n(paymentsLifetime._sum?.amount) * GATEWAY_FEE_RATE * 100) / 100;

  // ── Supplier costs ────────────────────────────────────────────────────────
  const supplierCostMonth    = gmvMonth    - commMonth    - gstMonth;
  const supplierCostLifetime = gmvLifetime - commLifetime - gstLifetime;

  // ── Profit ────────────────────────────────────────────────────────────────
  const grossProfitMonth    = commMonth    - refundAmtMonth;
  const grossProfitLifetime = commLifetime - refundAmtLifetime;
  const netProfitMonth      = grossProfitMonth    - shippingMonth    - gatewayMonth;
  const netProfitLifetime   = grossProfitLifetime - shippingLifetime - gatewayLifetime;
  const marginMonth    = gmvMonth    > 0 ? Math.round((netProfitMonth    / gmvMonth)    * 10000) / 100 : 0;
  const marginLifetime = gmvLifetime > 0 ? Math.round((netProfitLifetime / gmvLifetime) * 10000) / 100 : 0;

  // ── Settlements ───────────────────────────────────────────────────────────
  const settlByStatus = Object.fromEntries(
    settlementByStatus.map(s => [s.status, {
      count: s._count.id,
      gross: n(s._sum?.grossAmount),
      net:   n(s._sum?.netAmount),
    }])
  );
  const totalLiability = n(settlByStatus.HOLDING?.net) + n(settlByStatus.AVAILABLE?.net);

  // ── Cash flow ─────────────────────────────────────────────────────────────
  const payoutsOutMonth    = n(payoutsMonth._sum?.amount);
  const payoutsOutLifetime = n(payoutsLifetime._sum?.amount);
  const cashInMonth        = n(paymentsMonth._sum?.amount);
  const cashInLifetime     = n(paymentsLifetime._sum?.amount);

  // ── Monthly P&L ───────────────────────────────────────────────────────────
  const pnlByMonth: Record<string, MonthRow> = {};

  for (const e of monthlyLedger) {
    const key = e.createdAt.toISOString().slice(0, 7);
    if (!pnlByMonth[key]) pnlByMonth[key] = { month: key, revenue: 0, supplierCosts: 0, refunds: 0, shipping: 0, gatewayFees: 0, grossProfit: 0, netProfit: 0, margin: 0 };
    const gross = n(e.grossAmount);
    const comm  = n(e.commissionAmt) + n(e.gstOnCommission);
    pnlByMonth[key].revenue       += gross;
    pnlByMonth[key].supplierCosts += gross - comm;
  }

  for (const r of monthlyRefunds) {
    if (!r.refundedAt) continue;
    const key = r.refundedAt.toISOString().slice(0, 7);
    if (pnlByMonth[key]) pnlByMonth[key].refunds += n(r.refundAmount);
  }

  const monthlyPnL: MonthRow[] = Object.values(pnlByMonth)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(r => {
      const comm        = r.revenue - r.supplierCosts;
      const shipping    = Math.round(r.revenue * SHIPPING_COST_PCT * 100) / 100;
      const gateway     = Math.round(r.revenue * GATEWAY_FEE_RATE  * 100) / 100;
      const grossProfit = Math.round((comm - r.refunds) * 100) / 100;
      const netProfit   = Math.round((grossProfit - shipping - gateway) * 100) / 100;
      const margin      = r.revenue > 0 ? Math.round((netProfit / r.revenue) * 10000) / 100 : 0;
      return { ...r, shipping, gatewayFees: gateway, grossProfit, netProfit, margin };
    });

  // ── Daily sparkline ───────────────────────────────────────────────────────
  const byDay: Record<string, { gmv: number; commission: number }> = {};
  for (const e of dailyLedger) {
    const day = e.createdAt.toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { gmv: 0, commission: 0 };
    byDay[day].gmv        += n(e.grossAmount);
    byDay[day].commission += n(e.commissionAmt);
  }
  const dailySparkline = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  // ── Export ────────────────────────────────────────────────────────────────
  if (exportFormat === "csv") {
    return new NextResponse(buildPnLCSV(monthlyPnL), {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": 'attachment; filename="tryby-pnl.csv"',
      },
    });
  }

  // ── Response ──────────────────────────────────────────────────────────────
  return NextResponse.json({
    revenue: {
      today:     n(revToday._sum?.total),
      yesterday: n(revYesterday._sum?.total),
      week:      n(revWeek._sum?.total),
      month:     gmvMonth,
      lifetime:  gmvLifetime,
      last30:    gmvLast30,
      prev30:    gmvPrev30,
      growthPct: gmvGrowth,
    },
    profit: {
      month: {
        revenue: gmvMonth, supplierCosts: supplierCostMonth, refunds: refundAmtMonth,
        shipping: shippingMonth, gatewayFees: gatewayMonth,
        commission: commMonth, gst: gstMonth,
        grossProfit: grossProfitMonth, netProfit: netProfitMonth, margin: marginMonth,
      },
      lifetime: {
        revenue: gmvLifetime, supplierCosts: supplierCostLifetime, refunds: refundAmtLifetime,
        shipping: shippingLifetime, gatewayFees: gatewayLifetime,
        commission: commLifetime, gst: gstLifetime,
        grossProfit: grossProfitLifetime, netProfit: netProfitLifetime, margin: marginLifetime,
      },
    },
    settlements: {
      byStatus:      settlByStatus,
      openDisputes,
      totalLiability,
      holding:  { count: settlByStatus.HOLDING?.count  ?? 0, amount: settlByStatus.HOLDING?.net  ?? 0 },
      available:{ count: settlByStatus.AVAILABLE?.count ?? 0, amount: settlByStatus.AVAILABLE?.net ?? 0 },
      paid:     { count: settlByStatus.PAID?.count      ?? 0, amount: settlByStatus.PAID?.net      ?? 0 },
    },
    cashFlow: {
      month: {
        incoming:   cashInMonth,
        outgoing:   payoutsOutMonth + refundAmtMonth,
        payoutsOut: payoutsOutMonth,
        refundsOut: refundAmtMonth,
        net:        cashInMonth - payoutsOutMonth - refundAmtMonth,
      },
      lifetime: {
        incoming:   cashInLifetime,
        outgoing:   payoutsOutLifetime + refundAmtLifetime,
        payoutsOut: payoutsOutLifetime,
        refundsOut: refundAmtLifetime,
        net:        cashInLifetime - payoutsOutLifetime - refundAmtLifetime,
      },
    },
    topSuppliers: {
      byRevenue: topByRevenue,
      byOrders:  topByOrders,
    },
    refunds: {
      lifetime: { amount: refundAmtLifetime, count: refundCount },
      month:    { amount: refundAmtMonth,    count: refundMonth._count.id },
      last30:   { amount: refundAmtLast30,   count: refundLast30._count.id },
      ratePct:  refundRateLast30,
      growthPct: refundGrowth,
      topProducts: topRefundedItems.map(r => ({
        productId: r.productId,
        product:   productMap[r.productId] ?? null,
        amount:    n(r._sum?.unitPrice),
        count:     n(r._count?.id),
      })),
    },
    monthlyPnL,
    dailySparkline,
    meta: {
      generatedAt:     now.toISOString(),
      gatewayFeeRate:  GATEWAY_FEE_RATE,
      shippingCostPct: SHIPPING_COST_PCT,
      note:            "Shipping cost and gateway fees are estimated. Configure constants in route.ts.",
    },
  });
}
