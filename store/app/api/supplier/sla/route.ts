import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, SlaStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({
    where:  { userId: session.user.id },
    select: {
      id: true, slaScore: true,
      avgShippingHrs: true, avgDeliveryDays: true, avgAcceptanceHrs: true,
    },
  });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const page  = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const [records, total, statusCounts] = await Promise.all([
    prisma.supplierSLA.findMany({
      where:   { supplierId: supplier.id },
      orderBy: { orderCreatedAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
      select:  {
        id: true, orderNumber: true, orderCreatedAt: true,
        acceptedAt: true, shippedAt: true, deliveredAt: true, cancelledAt: true,
        acceptanceMinutes: true, shippingMinutes: true, deliveryMinutes: true,
        acceptanceStatus: true, shippingStatus: true, deliveryStatus: true,
        overallStatus: true,
        acceptanceSlaHrs: true, shippingSlaHrs: true, deliverySlaHrs: true,
      },
    }),
    prisma.supplierSLA.count({ where: { supplierId: supplier.id } }),
    prisma.supplierSLA.groupBy({
      by:    ["overallStatus"],
      where: { supplierId: supplier.id },
      _count: { id: true },
    }),
  ]);

  const counts = Object.fromEntries(statusCounts.map(s => [s.overallStatus, s._count.id]));

  // Derive summary for the dashboard widget
  const active   = records.filter(r => !r.deliveredAt && !r.cancelledAt).length;
  const atRisk   = counts[SlaStatus.AT_RISK]   ?? 0;
  const breached = counts[SlaStatus.BREACHED]  ?? 0;
  const onTime   = counts[SlaStatus.ON_TIME]   ?? 0;
  const onTimePct = total > 0 ? Math.round((onTime / total) * 100) : 0;

  return NextResponse.json({
    slaScore:   Number(supplier.slaScore),
    onTimePct,
    active,
    atRisk,
    breached,
    onTime,
    total,
    records,
    pages: Math.ceil(total / limit),
    avgShippingHrs:  Number(supplier.avgShippingHrs),
    avgDeliveryDays: Number(supplier.avgDeliveryDays),
  });
}
