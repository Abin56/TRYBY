import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { getAdminProfileId, logAudit } from "@/lib/audit";
import { fulfillOrderAllocations } from "@/lib/inventory-reservation";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const warehouseId   = searchParams.get("warehouseId") ?? undefined;
  const pickingStatus = searchParams.get("pickingStatus") ?? undefined;

  // ── Orders waiting for fulfillment ────────────────────────────────────────
  const allocWhere: Record<string, unknown> = {
    status: { in: ["PENDING", "IN_PROGRESS", "PICKED", "PACKED"] },
  };
  if (warehouseId)   allocWhere.warehouseId = warehouseId;
  if (pickingStatus) allocWhere.status      = pickingStatus;

  const allocations = await prisma.orderFulfillmentAllocation.findMany({
    where: allocWhere,
    include: {
      order: {
        select: {
          id: true, orderNumber: true, status: true, total: true, createdAt: true,
          user: { select: { name: true, email: true } },
          items: { select: { productName: true, quantity: true, variantSku: true, size: true, color: true } },
          shippingAddress: { select: { fullName: true, city: true, state: true, pincode: true } },
        },
      },
      variant:   { select: { sku: true, size: true, color: true } },
      warehouse: { select: { id: true, name: true, code: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  // Group by order
  const orderMap: Record<string, typeof allocations> = {};
  for (const a of allocations) {
    if (!orderMap[a.orderId]) orderMap[a.orderId] = [];
    orderMap[a.orderId].push(a);
  }

  const dispatchQueue = Object.entries(orderMap).map(([orderId, allocs]) => ({
    orderId,
    order:        allocs[0].order,
    warehouse:    allocs[0].warehouse,
    pickingStatus: allocs[0].status,
    allocations:  allocs,
    totalItems:   allocs.reduce((s, a) => s + a.reservedQty, 0),
    allPicked:    allocs.every(a => ["PICKED", "PACKED", "DISPATCHED"].includes(a.status)),
    allPacked:    allocs.every(a => ["PACKED", "DISPATCHED"].includes(a.status)),
  }));

  // ── Summary counts ────────────────────────────────────────────────────────
  const [pendingCount, pickedCount, packedCount] = await Promise.all([
    prisma.orderFulfillmentAllocation.count({
      where: { status: "PENDING",     ...(warehouseId ? { warehouseId } : {}) },
    }),
    prisma.orderFulfillmentAllocation.count({
      where: { status: "PICKED",      ...(warehouseId ? { warehouseId } : {}) },
    }),
    prisma.orderFulfillmentAllocation.count({
      where: { status: "PACKED",      ...(warehouseId ? { warehouseId } : {}) },
    }),
  ]);

  return NextResponse.json({
    dispatchQueue,
    summary: { pendingCount, pickedCount, packedCount },
  });
}

// ── Update picking status ────────────────────────────────────────────────────

const updatePickingSchema = z.object({
  allocationIds: z.array(z.string().cuid()).min(1),
  status: z.enum(["IN_PROGRESS", "PICKED", "PACKED", "DISPATCHED", "CANCELLED"]),
  note:   z.string().max(500).optional(),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = updatePickingSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { allocationIds, status, note } = body.data;
  const adminProfileId = await getAdminProfileId(session.user.id);

  const dateFields: Record<string, Date> = {};
  if (status === "PICKED")     dateFields.pickedAt     = new Date();
  if (status === "PACKED")     dateFields.packedAt     = new Date();
  if (status === "DISPATCHED") dateFields.dispatchedAt = new Date();
  if (status === "CANCELLED")  dateFields.cancelledAt  = new Date();

  await prisma.orderFulfillmentAllocation.updateMany({
    where: { id: { in: allocationIds } },
    data:  { status, ...dateFields },
  });

  // If DISPATCHED: fulfill all allocations for each affected order
  if (status === "DISPATCHED") {
    const allocs = await prisma.orderFulfillmentAllocation.findMany({
      where: { id: { in: allocationIds } },
      select: { orderId: true },
    });
    const orderIds = [...new Set(allocs.map(a => a.orderId))];

    for (const orderId of orderIds) {
      await prisma.$transaction(tx => fulfillOrderAllocations(tx, orderId));

      logAudit({
        adminId:      adminProfileId ?? "",
        action:       "ORDER_STATUS_CHANGED",
        resourceType: "order",
        resourceId:   orderId,
        newValue:     { allocationStatus: "DISPATCHED", note },
      });
    }
  }

  return NextResponse.json({ ok: true, updated: allocationIds.length });
}
