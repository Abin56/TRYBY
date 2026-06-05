/**
 * GET /api/admin/shipping/profitability?days=30&format=json|csv
 *
 * Shipping Profitability Center — real data only.
 *
 * Revenue model:
 *   Shipping revenue  = order.shippingCharge (what customer paid)
 *   Courier cost      = product.shippingCost * qty (estimated per-unit cost at dispatch)
 *   Shipping profit   = shippingRevenue - courierCost
 *   COD charges       = shipment.codAmount for COD orders (what we charge customer)
 *   RTO loss          = courierCost for RETURNED shipments (cost with no revenue)
 *
 * Note: We use product.shippingCost as the per-unit courier cost proxy because
 * actual courier invoices are not yet imported. When courier invoices are
 * available, replace shippingCost with the actual invoice amount.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, ShipmentStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const RTO_STATUSES: ShipmentStatus[] = [ShipmentStatus.RETURNED, ShipmentStatus.LOST];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days   = Math.min(365, Math.max(1, parseInt(searchParams.get("days") ?? "30")));
  const format = searchParams.get("format") ?? "json";

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Last-month window for the Founder Summary Card
  const now              = new Date();
  const lastMonthStart   = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd     = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // ── Core query: orders with shipment + items + address ──────────────────────
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: since },
      status:    { notIn: ["CANCELLED", "PENDING"] },
    },
    select: {
      id:             true,
      orderNumber:    true,
      status:         true,
      shippingCharge: true,
      total:          true,
      subtotal:       true,
      createdAt:      true,
      payment:        { select: { method: true, status: true } },
      shippingAddress: { select: { state: true } },
      shipment: {
        select: {
          status:           true,
          courier:          true,
          carrierName:      true,
          codAmount:        true,
          codCollected:     true,
          deliveredAt:      true,
          returnedAt:       true,
          rtoInitiatedAt:   true,
        },
      },
      items: {
        select: {
          quantity:    true,
          unitPrice:   true,
          total:       true,
          productName: true,
          productId:   true,
          product: {
            select: {
              id:           true,
              name:         true,
              slug:         true,
              shippingCost: true,
              packagingCost:true,
            },
          },
          variant: {
            select: { costPrice: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // ── Last-month orders for Founder Summary Card ───────────────────────────────
  const lastMonthOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      status:    { notIn: ["CANCELLED", "PENDING"] },
    },
    select: {
      shippingCharge: true,
      shipment: {
        select: { status: true, courier: true, carrierName: true },
      },
      items: {
        select: {
          quantity: true,
          total:    true,
          product:  { select: { shippingCost: true } },
          variant:  { select: { costPrice: true } },
        },
      },
    },
  });

  // ── Helper: compute shipping cost for an order from its items ────────────────
  function orderShippingCost(items: typeof orders[0]["items"]): number {
    return items.reduce((sum, i) => sum + Number(i.product?.shippingCost ?? 0) * i.quantity, 0);
  }

  function orderProductProfit(items: typeof orders[0]["items"]): number {
    return items.reduce((sum, i) => {
      const revenue = Number(i.total);
      const cogs    = Number(i.variant?.costPrice ?? 0) * i.quantity;
      return sum + (revenue - cogs);
    }, 0);
  }

  // ── Period overview ──────────────────────────────────────────────────────────
  let totalShippingRevenue = 0;
  let totalCourierCost     = 0;
  let totalCodCharges      = 0;
  let rtoCount             = 0;
  let rtoCost              = 0;
  let rtoRevenueLost       = 0;

  // Courier map
  const courierMap = new Map<string, {
    orders:   number;
    revenue:  number;
    cost:     number;
    rtoCount: number;
    rtoCost:  number;
  }>();

  // State map
  const stateMap = new Map<string, {
    orders:  number;
    revenue: number;
    cost:    number;
  }>();

  // Product map
  const productMap = new Map<string, {
    productId:     string;
    name:          string;
    slug:          string;
    unitsSold:     number;
    totalRevenue:  number;
    totalCogs:     number;
    totalShipping: number;
    productProfit: number;
    shippingImpact:number; // shipping cost as % of product profit
  }>();

  // RTO product tracking
  const rtoProductMap = new Map<string, { name: string; count: number; cost: number; revenueLost: number }>();

  for (const order of orders) {
    const shippingRevenue = Number(order.shippingCharge);
    const courierCost     = orderShippingCost(order.items);
    const isRTO           = order.shipment && RTO_STATUSES.includes(order.shipment.status as ShipmentStatus);
    const isCOD           = order.payment?.method === "COD";
    const codCharge       = isCOD ? Number(order.shipment?.codAmount ?? order.total) : 0;

    totalShippingRevenue += shippingRevenue;
    totalCourierCost     += courierCost;
    if (isCOD) totalCodCharges += codCharge;

    if (isRTO) {
      rtoCount++;
      rtoCost        += courierCost;
      rtoRevenueLost += Number(order.total);
    }

    // Courier breakdown
    const courierKey = order.shipment?.courier ?? order.shipment?.carrierName ?? "UNASSIGNED";
    if (!courierMap.has(courierKey)) courierMap.set(courierKey, { orders: 0, revenue: 0, cost: 0, rtoCount: 0, rtoCost: 0 });
    const cs = courierMap.get(courierKey)!;
    cs.orders++;
    cs.revenue  += shippingRevenue;
    cs.cost     += courierCost;
    if (isRTO) { cs.rtoCount++; cs.rtoCost += courierCost; }

    // State breakdown
    const state = order.shippingAddress?.state ?? "Unknown";
    if (!stateMap.has(state)) stateMap.set(state, { orders: 0, revenue: 0, cost: 0 });
    const ss = stateMap.get(state)!;
    ss.orders++;
    ss.revenue += shippingRevenue;
    ss.cost    += courierCost;

    // Product breakdown
    for (const item of order.items) {
      const pid  = item.productId ?? item.product?.id ?? "unknown";
      const name = item.product?.name ?? item.productName;
      const slug = item.product?.slug ?? "";
      const itemRevenue  = Number(item.total);
      const itemCogs     = Number(item.variant?.costPrice ?? 0) * item.quantity;
      const itemShipping = Number(item.product?.shippingCost ?? 0) * item.quantity;

      if (!productMap.has(pid)) {
        productMap.set(pid, {
          productId: pid, name, slug,
          unitsSold: 0, totalRevenue: 0, totalCogs: 0,
          totalShipping: 0, productProfit: 0, shippingImpact: 0,
        });
      }
      const ps = productMap.get(pid)!;
      ps.unitsSold     += item.quantity;
      ps.totalRevenue  += itemRevenue;
      ps.totalCogs     += itemCogs;
      ps.totalShipping += itemShipping;
      ps.productProfit += itemRevenue - itemCogs;

      // RTO product tracking
      if (isRTO) {
        if (!rtoProductMap.has(pid)) rtoProductMap.set(pid, { name, count: 0, cost: 0, revenueLost: 0 });
        const rp = rtoProductMap.get(pid)!;
        rp.count++;
        rp.cost        += itemShipping;
        rp.revenueLost += itemRevenue;
      }
    }
  }

  // Compute shippingImpact per product
  for (const p of productMap.values()) {
    p.shippingImpact = p.productProfit > 0
      ? +((p.totalShipping / p.productProfit) * 100).toFixed(1)
      : p.totalShipping > 0 ? 999 : 0;
  }

  // ── Founder Summary (last calendar month) ────────────────────────────────────
  let lmShippingRevenue = 0;
  let lmCourierCost     = 0;
  for (const o of lastMonthOrders) {
    lmShippingRevenue += Number(o.shippingCharge);
    lmCourierCost     += o.items.reduce((s, i) => s + Number(i.product?.shippingCost ?? 0) * i.quantity, 0);
  }
  const lmShippingProfit = lmShippingRevenue - lmCourierCost;

  // ── State analysis: sort by profit ──────────────────────────────────────────
  const stateAnalysis = Array.from(stateMap.entries())
    .map(([state, s]) => ({
      state,
      orders:  s.orders,
      revenue: +s.revenue.toFixed(2),
      cost:    +s.cost.toFixed(2),
      profit:  +(s.revenue - s.cost).toFixed(2),
    }))
    .sort((a, b) => b.profit - a.profit);

  // ── Product impact: flag where shipping cost > product profit ────────────────
  const productImpact = Array.from(productMap.values())
    .map(p => ({
      ...p,
      totalRevenue:  +p.totalRevenue.toFixed(2),
      totalCogs:     +p.totalCogs.toFixed(2),
      totalShipping: +p.totalShipping.toFixed(2),
      productProfit: +p.productProfit.toFixed(2),
      shippingImpact: p.shippingImpact,
      // True if shipping cost > product profit (selling at a loss after shipping)
      isUnprofitable: p.totalShipping > p.productProfit,
    }))
    .filter(p => p.unitsSold > 0)
    .sort((a, b) => b.totalShipping - a.totalShipping);

  // ── Courier table ────────────────────────────────────────────────────────────
  const courierTable = Array.from(courierMap.entries())
    .map(([name, c]) => {
      const profit = c.revenue - c.cost;
      return {
        name,
        orders:   c.orders,
        revenue:  +c.revenue.toFixed(2),
        cost:     +c.cost.toFixed(2),
        profit:   +profit.toFixed(2),
        margin:   c.revenue > 0 ? +((profit / c.revenue) * 100).toFixed(1) : 0,
        rtoCount: c.rtoCount,
        rtoCost:  +c.rtoCost.toFixed(2),
      };
    })
    .sort((a, b) => b.orders - a.orders);

  // ── RTO analysis ─────────────────────────────────────────────────────────────
  const rtoProducts = Array.from(rtoProductMap.entries())
    .map(([productId, r]) => ({
      productId,
      name:        r.name,
      count:       r.count,
      cost:        +r.cost.toFixed(2),
      revenueLost: +r.revenueLost.toFixed(2),
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 20);

  // ── Summary ──────────────────────────────────────────────────────────────────
  const shippingProfit = totalShippingRevenue - totalCourierCost;
  const margin = totalShippingRevenue > 0
    ? +((shippingProfit / totalShippingRevenue) * 100).toFixed(1)
    : 0;

  const payload = {
    period: { days, since: since.toISOString() },
    overview: {
      shippingRevenue: +totalShippingRevenue.toFixed(2),
      courierCost:     +totalCourierCost.toFixed(2),
      shippingProfit:  +shippingProfit.toFixed(2),
      margin,
      codCharges:      +totalCodCharges.toFixed(2),
      rtoCount,
      rtoCost:         +rtoCost.toFixed(2),
      rtoRevenueLost:  +rtoRevenueLost.toFixed(2),
      totalOrders:     orders.length,
    },
    founderSummary: {
      lastMonthShippingSpend:  +lmCourierCost.toFixed(2),
      lastMonthShippingRevenue:+lmShippingRevenue.toFixed(2),
      lastMonthNetAfterShipping: +lmShippingProfit.toFixed(2),
    },
    couriers:       courierTable,
    stateAnalysis,
    productImpact,
    rtoAnalysis: {
      count:       rtoCount,
      cost:        +rtoCost.toFixed(2),
      revenueLost: +rtoRevenueLost.toFixed(2),
      topProducts: rtoProducts,
    },
  };

  // ── CSV export ────────────────────────────────────────────────────────────────
  if (format === "csv") {
    const rows: string[] = [];

    rows.push("=== SHIPPING PROFITABILITY REPORT ===");
    rows.push(`Period,Last ${days} days`);
    rows.push(`Generated,${new Date().toLocaleString("en-IN")}`);
    rows.push("");

    rows.push("=== OVERVIEW ===");
    rows.push("Metric,Value");
    rows.push(`Shipping Revenue Collected,₹${payload.overview.shippingRevenue}`);
    rows.push(`Actual Courier Cost,₹${payload.overview.courierCost}`);
    rows.push(`Shipping Profit / Loss,₹${payload.overview.shippingProfit}`);
    rows.push(`Margin,${payload.overview.margin}%`);
    rows.push(`COD Charges Collected,₹${payload.overview.codCharges}`);
    rows.push(`RTO Count,${payload.overview.rtoCount}`);
    rows.push(`RTO Cost,₹${payload.overview.rtoCost}`);
    rows.push(`RTO Revenue Lost,₹${payload.overview.rtoRevenueLost}`);
    rows.push("");

    rows.push("=== COURIER BREAKDOWN ===");
    rows.push("Courier,Orders,Revenue,Cost,Profit,Margin %,RTO Count,RTO Cost");
    for (const c of courierTable) {
      rows.push(`${c.name},${c.orders},${c.revenue},${c.cost},${c.profit},${c.margin}%,${c.rtoCount},${c.rtoCost}`);
    }
    rows.push("");

    rows.push("=== STATE ANALYSIS ===");
    rows.push("State,Orders,Revenue,Cost,Profit");
    for (const s of stateAnalysis) {
      rows.push(`"${s.state}",${s.orders},${s.revenue},${s.cost},${s.profit}`);
    }
    rows.push("");

    rows.push("=== PRODUCT SHIPPING IMPACT ===");
    rows.push("Product,Units Sold,Revenue,COGS,Shipping Cost,Product Profit,Shipping Impact %,Unprofitable");
    for (const p of productImpact) {
      rows.push(`"${p.name}",${p.unitsSold},${p.totalRevenue},${p.totalCogs},${p.totalShipping},${p.productProfit},${p.shippingImpact}%,${p.isUnprofitable ? "YES" : "no"}`);
    }
    rows.push("");

    rows.push("=== RTO TOP AFFECTED PRODUCTS ===");
    rows.push("Product,RTO Count,Shipping Cost,Revenue Lost");
    for (const r of rtoProducts) {
      rows.push(`"${r.name}",${r.count},${r.cost},${r.revenueLost}`);
    }

    const csv = rows.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type":        "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="shipping-profitability-${days}d.csv"`,
      },
    });
  }

  return NextResponse.json(payload);
}
