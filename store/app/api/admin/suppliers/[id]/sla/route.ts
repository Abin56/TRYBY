import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, SlaStatus } from "@prisma/client";
import { refreshOpenSLAs, recomputeSupplierSlaScore } from "@/lib/sla";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") ?? "all"; // all | active | at_risk | breached | on_time
  const page   = parseInt(searchParams.get("page") ?? "1");
  const limit  = 20;

  const supplier = await prisma.supplier.findUnique({
    where:  { id },
    select: {
      id: true, companyName: true, slaScore: true,
      avgShippingHrs: true, avgDeliveryDays: true, avgAcceptanceHrs: true,
    },
  });
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Build where clause
  const where: Record<string, unknown> = { supplierId: id };
  if (filter === "active")   { where.deliveredAt = null; where.cancelledAt = null; }
  if (filter === "at_risk")  { where.overallStatus = SlaStatus.AT_RISK; }
  if (filter === "breached") { where.overallStatus = SlaStatus.BREACHED; }
  if (filter === "on_time")  { where.overallStatus = SlaStatus.ON_TIME; }

  const [records, total, statusCounts] = await Promise.all([
    prisma.supplierSLA.findMany({
      where,
      orderBy: { orderCreatedAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.supplierSLA.count({ where }),
    prisma.supplierSLA.groupBy({
      by:    ["overallStatus"],
      where: { supplierId: id },
      _count: { id: true },
    }),
  ]);

  // Aggregate stats
  const completed = await prisma.supplierSLA.findMany({
    where:  { supplierId: id, deliveredAt: { not: null } },
    select: {
      acceptanceMinutes: true, shippingMinutes: true, deliveryMinutes: true,
      acceptanceStatus: true, shippingStatus: true, deliveryStatus: true,
    },
  });

  const avg = (arr: (number | null)[], transform = (v: number) => v) => {
    const values = arr.filter((v): v is number => v !== null);
    return values.length > 0
      ? transform(values.reduce((s, v) => s + v, 0) / values.length)
      : 0;
  };

  const stats = {
    slaScore:           Number(supplier.slaScore),
    avgAcceptanceHrs:   avg(completed.map(r => r.acceptanceMinutes), v => v / 60),
    avgShippingHrs:     avg(completed.map(r => r.shippingMinutes),   v => v / 60),
    avgDeliveryDays:    avg(completed.map(r => r.deliveryMinutes),   v => v / 60 / 24),
    acceptanceBreaches: completed.filter(r => r.acceptanceStatus === "BREACHED").length,
    shippingBreaches:   completed.filter(r => r.shippingStatus   === "BREACHED").length,
    deliveryBreaches:   completed.filter(r => r.deliveryStatus   === "BREACHED").length,
    totalCompleted:     completed.length,
  };

  const counts = Object.fromEntries(statusCounts.map(s => [s.overallStatus, s._count.id]));

  return NextResponse.json({ supplier, records, total, pages: Math.ceil(total / limit), counts, stats });
}

// POST — trigger a manual refresh of open SLA records for this supplier
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const updated = await refreshOpenSLAs(id);
  const newScore = await recomputeSupplierSlaScore(id);
  return NextResponse.json({ updated, newSlaScore: newScore });
}
