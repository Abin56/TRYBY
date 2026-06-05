import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { buildCSV, buildSettlementCSVRows, SETTLEMENT_CSV_HEADERS, buildGSTSummary } from "@/lib/finance";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json"; // json | csv
  const from   = searchParams.get("from");
  const to     = searchParams.get("to");
  const month  = searchParams.get("month"); // YYYY-MM shorthand

  let dateFilter: { gte?: Date; lte?: Date } = {};
  if (month) {
    const [y, m] = month.split("-").map(Number);
    dateFilter = {
      gte: new Date(y, m - 1, 1),
      lte: new Date(y, m,     0, 23, 59, 59),
    };
  } else {
    if (from) dateFilter.gte = new Date(from);
    if (to)   dateFilter.lte = new Date(to);
  }

  const where: Record<string, unknown> = { supplierId: supplier.id };
  if (dateFilter.gte || dateFilter.lte) where.createdAt = dateFilter;

  const entries = await prisma.supplierLedger.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  const gst = buildGSTSummary(entries.map(e => ({
    grossAmount:     Number(e.grossAmount),
    commissionAmt:   Number(e.commissionAmt),
    gstOnCommission: Number(e.gstOnCommission),
  })));

  // Monthly breakdown
  const byMonth: Record<string, { credit: number; debit: number; net: number }> = {};
  for (const e of entries) {
    const key = e.createdAt.toISOString().slice(0, 7);
    if (!byMonth[key]) byMonth[key] = { credit: 0, debit: 0, net: 0 };
    const amt = Number(e.amount);
    if (amt > 0) byMonth[key].credit += amt;
    else         byMonth[key].debit  += Math.abs(amt);
    byMonth[key].net += amt;
  }

  const monthlyBreakdown = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));

  if (format === "csv") {
    const csv = buildCSV(
      SETTLEMENT_CSV_HEADERS,
      buildSettlementCSVRows(entries.map(e => ({
        createdAt:       e.createdAt,
        orderNumber:     e.orderNumber,
        description:     e.description,
        type:            e.type,
        grossAmount:     Number(e.grossAmount),
        commissionAmt:   Number(e.commissionAmt),
        gstOnCommission: Number(e.gstOnCommission),
        shippingDeduct:  Number(e.shippingDeduct),
        netAmount:       Number(e.netAmount),
        amount:          Number(e.amount),
        balanceAfter:    Number(e.balanceAfter),
      })))
    );

    return new NextResponse(csv, {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="tryby-settlement-${month ?? "report"}.csv"`,
      },
    });
  }

  return NextResponse.json({
    supplier: {
      companyName: supplier.companyName,
      gstin:       supplier.gstin,
      gstRate:     Number(supplier.gstRate),
    },
    period: { from: dateFilter.gte?.toISOString(), to: dateFilter.lte?.toISOString() },
    summary: {
      totalEntries:  entries.length,
      totalCredits:  entries.filter(e => Number(e.amount) > 0).reduce((s, e) => s + Number(e.amount), 0),
      totalDebits:   entries.filter(e => Number(e.amount) < 0).reduce((s, e) => s + Math.abs(Number(e.amount)), 0),
      netEarnings:   entries.reduce((s, e) => s + Number(e.amount), 0),
    },
    gst,
    monthlyBreakdown,
    entries,
  });
}
