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
  const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") ?? "30")));
  const since = new Date();
  since.setDate(since.getDate() - days);

  const warehouses = await prisma.warehouse.findMany({
    where:   { isActive: true },
    include: { _count: { select: { stocks: true } } },
  });

  // Per-warehouse metrics
  const warehouseMetrics = await Promise.all(
    warehouses.map(async (wh) => {
      const [
        stockAgg,
        receiveVolumePOs,
        receiveVolumeTransfers,
        dispatchVolume,
        transferOutVolume,
        transferInVolume,
        lowStockCount,
      ] = await Promise.all([
        // Total + reserved units
        prisma.warehouseStock.aggregate({
          where: { warehouseId: wh.id },
          _sum:  { stock: true, reservedQty: true },
        }),

        // Units received via PO in window
        prisma.purchaseOrderItem.aggregate({
          where: {
            purchaseOrder: {
              warehouseId: wh.id,
              status:      "RECEIVED",
              receivedAt:  { gte: since },
            },
          },
          _sum: { receivedQty: true },
        }),

        // Units received via transfer in window
        prisma.stockTransferItem.aggregate({
          where: {
            stockTransfer: {
              toWarehouseId: wh.id,
              status:        "RECEIVED",
              receivedAt:    { gte: since },
            },
          },
          _sum: { transferredQty: true },
        }),

        // Units dispatched (allocations fulfilled) in window
        prisma.orderFulfillmentAllocation.aggregate({
          where: {
            warehouseId:  wh.id,
            status:       "DISPATCHED",
            dispatchedAt: { gte: since },
          },
          _sum: { reservedQty: true },
        }),

        // Transfer OUT volume
        prisma.stockTransferItem.aggregate({
          where: {
            stockTransfer: {
              fromWarehouseId: wh.id,
              status:          "RECEIVED",
              receivedAt:      { gte: since },
            },
          },
          _sum: { transferredQty: true },
        }),

        // Transfer IN volume
        prisma.stockTransferItem.aggregate({
          where: {
            stockTransfer: {
              toWarehouseId: wh.id,
              status:        "RECEIVED",
              receivedAt:    { gte: since },
            },
          },
          _sum: { transferredQty: true },
        }),

        // Low-stock SKUs in this warehouse
        prisma.warehouseStock.count({
          where: { warehouseId: wh.id, stock: { lte: 5, gt: 0 } },
        }),
      ]);

      const totalUnits    = stockAgg._sum.stock     ?? 0;
      const reservedUnits = stockAgg._sum.reservedQty ?? 0;
      const availableUnits = totalUnits - reservedUnits;
      const utilisation    = totalUnits > 0 ? Math.round((reservedUnits / totalUnits) * 100) : 0;

      const receivedUnits  = (receiveVolumePOs._sum.receivedQty ?? 0) + (receiveVolumeTransfers._sum.transferredQty ?? 0);
      const dispatchedUnits = dispatchVolume._sum.reservedQty ?? 0;
      const turnoverRate    = totalUnits > 0 ? +(dispatchedUnits / totalUnits).toFixed(2) : 0;

      return {
        warehouseId:   wh.id,
        warehouseName: wh.name,
        warehouseCode: wh.code,
        isDefault:     wh.isDefault,
        skuCount:      wh._count.stocks,
        totalUnits,
        reservedUnits,
        availableUnits,
        utilisation,
        lowStockCount,
        receiving: {
          poUnits:       receiveVolumePOs._sum.receivedQty ?? 0,
          transferUnits: receiveVolumeTransfers._sum.transferredQty ?? 0,
          total:         receivedUnits,
        },
        dispatch: {
          dispatchedUnits,
        },
        transfers: {
          outUnits: transferOutVolume._sum.transferredQty ?? 0,
          inUnits:  transferInVolume._sum.transferredQty  ?? 0,
        },
        turnoverRate,
      };
    })
  );

  // ── Network-level stats ───────────────────────────────────────────────────
  const [totalTransfers, pendingTransfers, pendingAllocations] = await Promise.all([
    prisma.stockTransfer.count({ where: { createdAt: { gte: since } } }),
    prisma.stockTransfer.count({ where: { status: { in: ["PENDING", "IN_TRANSIT"] } } }),
    prisma.orderFulfillmentAllocation.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
  ]);

  return NextResponse.json({
    period:    { days, since: since.toISOString() },
    warehouses: warehouseMetrics,
    network: {
      totalTransfersInPeriod: totalTransfers,
      pendingTransfers,
      pendingAllocations,
    },
  });
}
