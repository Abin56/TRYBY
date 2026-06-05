import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const warehouseId = searchParams.get("warehouseId") ?? undefined;

  // ── Pending Purchase Orders ───────────────────────────────────────────────
  const pendingPOs = await prisma.purchaseOrder.findMany({
    where: {
      status: { in: ["SENT", "ACKNOWLEDGED", "PARTIALLY_RECEIVED"] },
      ...(warehouseId ? { warehouseId } : {}),
    },
    include: {
      supplier:  { select: { id: true, companyName: true } },
      warehouse: { select: { id: true, name: true, code: true } },
      items: {
        include: {
          variant: { select: { sku: true, size: true, color: true } },
          product: {
            select: {
              name: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
    orderBy: [{ expectedAt: "asc" }, { createdAt: "asc" }],
    take: 50,
  });

  // ── Pending Stock Transfers (incoming) ────────────────────────────────────
  const pendingTransfers = await prisma.stockTransfer.findMany({
    where: {
      status: { in: ["PENDING", "IN_TRANSIT"] },
      ...(warehouseId ? { toWarehouseId: warehouseId } : {}),
    },
    include: {
      fromWarehouse: { select: { id: true, name: true, code: true } },
      toWarehouse:   { select: { id: true, name: true, code: true } },
      items: {
        include: {
          variant: { select: { sku: true, size: true, color: true } },
          product: {
            select: {
              name: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  // ── Recent Receiving History (last 7 days) ────────────────────────────────
  const since7d = new Date();
  since7d.setDate(since7d.getDate() - 7);

  const [recentPOs, recentTransfers] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where: {
        status: "RECEIVED",
        receivedAt: { gte: since7d },
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        supplier:  { select: { companyName: true } },
        warehouse: { select: { name: true, code: true } },
        _count:    { select: { items: true } },
      },
      orderBy: { receivedAt: "desc" },
      take: 20,
    }),
    prisma.stockTransfer.findMany({
      where: {
        status: "RECEIVED",
        receivedAt: { gte: since7d },
        ...(warehouseId ? { toWarehouseId: warehouseId } : {}),
      },
      include: {
        fromWarehouse: { select: { name: true, code: true } },
        toWarehouse:   { select: { name: true, code: true } },
        _count:        { select: { items: true } },
      },
      orderBy: { receivedAt: "desc" },
      take: 20,
    }),
  ]);

  // ── Summary counts ────────────────────────────────────────────────────────
  const overduePOs = pendingPOs.filter(
    p => p.expectedAt && new Date(p.expectedAt) < new Date()
  );

  return NextResponse.json({
    pending: {
      purchaseOrders: pendingPOs,
      transfers:      pendingTransfers,
      overduePOCount: overduePOs.length,
    },
    history: {
      purchaseOrders: recentPOs,
      transfers:      recentTransfers,
    },
    summary: {
      pendingPOCount:       pendingPOs.length,
      pendingTransferCount: pendingTransfers.length,
      overduePOCount:       overduePOs.length,
    },
  });
}
