/**
 * Inventory Reservation Engine
 *
 * Responsible for:
 *   1. Selecting the best warehouse for an order (nearest with stock)
 *   2. Creating OrderFulfillmentAllocation rows
 *   3. Incrementing WarehouseStock.reservedQty
 *   4. Decrementing global ProductVariant.stock (available stock)
 *   5. Releasing reservations on cancellation / return
 *
 * All operations run inside caller-supplied Prisma transactions.
 */

import { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

// ── Warehouse selection ───────────────────────────────────────────────────────

/**
 * Find the best warehouse for a variant + quantity.
 * Strategy: prefer default warehouse first; then any active warehouse with
 * enough available stock (stock - reservedQty >= qty).
 * Returns null if no warehouse can fulfil.
 */
export async function selectWarehouse(
  tx: Tx,
  variantId: string,
  qty: number
): Promise<string | null> {
  const candidates = await tx.warehouseStock.findMany({
    where: {
      variantId,
      warehouse: { isActive: true },
    },
    include: { warehouse: { select: { id: true, isDefault: true } } },
    orderBy: [{ warehouse: { isDefault: "desc" } }],
  });

  for (const c of candidates) {
    const available = c.stock - c.reservedQty;
    if (available >= qty) return c.warehouseId;
  }

  // Fall back: any warehouse that has *some* stock even if below requested
  for (const c of candidates) {
    if (c.stock > c.reservedQty) return c.warehouseId;
  }

  return null;
}

// ── Reserve ───────────────────────────────────────────────────────────────────

export interface ReserveItem {
  variantId:   string;
  productId:   string;
  orderItemId?: string;
  qty:         number;
}

export interface ReserveResult {
  variantId:   string;
  warehouseId: string | null;   // null = could not allocate
  allocationId?: string;
  reserved:    number;
  oversell:    boolean;          // true if we had to reserve without warehouse stock
}

/**
 * Reserve stock for all items in an order.
 * Called inside the order-creation transaction.
 */
export async function reserveOrderStock(
  tx: Tx,
  orderId: string,
  items: ReserveItem[]
): Promise<ReserveResult[]> {
  const results: ReserveResult[] = [];

  for (const item of items) {
    const warehouseId = await selectWarehouse(tx, item.variantId, item.qty);

    if (warehouseId) {
      // Increment reservedQty in warehouse
      await tx.warehouseStock.update({
        where: { warehouseId_variantId: { warehouseId, variantId: item.variantId } },
        data:  { reservedQty: { increment: item.qty } },
      });
    }

    // Decrement global available stock to prevent overselling
    await tx.productVariant.update({
      where: { id: item.variantId },
      data:  { stock: { decrement: item.qty } },
    });

    // Create allocation row
    const alloc = await tx.orderFulfillmentAllocation.create({
      data: {
        orderId:     orderId,
        orderItemId: item.orderItemId ?? null,
        variantId:   item.variantId,
        warehouseId: warehouseId ?? (
          // No warehouse stock found — still create a record flagged by null warehouse
          // Admin will manually assign; global stock already decremented
          await getFallbackWarehouseId(tx)
        ) ?? "",
        reservedQty: item.qty,
        status:      "PENDING",
      },
    });

    results.push({
      variantId:   item.variantId,
      warehouseId,
      allocationId: alloc.id,
      reserved:    item.qty,
      oversell:    !warehouseId,
    });
  }

  return results;
}

async function getFallbackWarehouseId(tx: Tx): Promise<string | null> {
  const def = await tx.warehouse.findFirst({
    where: { isDefault: true, isActive: true },
    select: { id: true },
  });
  if (def) return def.id;
  const any = await tx.warehouse.findFirst({
    where: { isActive: true },
    select: { id: true },
  });
  return any?.id ?? null;
}

// ── Release ───────────────────────────────────────────────────────────────────

/**
 * Release all reservations for an order (cancellation / return).
 * Restores warehouse reservedQty and global stock.
 */
export async function releaseOrderReservations(
  tx: Tx,
  orderId: string,
  reason: "CANCELLED" | "RETURNED"
): Promise<void> {
  const allocs = await tx.orderFulfillmentAllocation.findMany({
    where: { orderId, status: { in: ["PENDING", "IN_PROGRESS"] } },
  });

  for (const alloc of allocs) {
    // Restore warehouse reserved qty
    await tx.warehouseStock.updateMany({
      where: { warehouseId: alloc.warehouseId, variantId: alloc.variantId },
      data:  { reservedQty: { decrement: alloc.reservedQty } },
    }).catch(() => {}); // may not exist if no warehouse was assigned

    // Restore global stock
    await tx.productVariant.update({
      where: { id: alloc.variantId },
      data:  { stock: { increment: alloc.reservedQty } },
    });

    // Mark allocation cancelled/dispatched based on reason
    await tx.orderFulfillmentAllocation.update({
      where: { id: alloc.id },
      data:  {
        status:       "CANCELLED",
        cancelledAt:  new Date(),
      },
    });
  }
}

// ── Fulfil (dispatch) ─────────────────────────────────────────────────────────

/**
 * Mark allocations as dispatched — moves reservedQty to "consumed".
 * Called when shipment is created.
 */
export async function fulfillOrderAllocations(
  tx: Tx,
  orderId: string
): Promise<void> {
  const allocs = await tx.orderFulfillmentAllocation.findMany({
    where: { orderId, status: { in: ["PENDING", "IN_PROGRESS", "PICKED", "PACKED"] } },
  });

  for (const alloc of allocs) {
    // Release from reservedQty (stock was already decremented at reservation time)
    await tx.warehouseStock.updateMany({
      where: { warehouseId: alloc.warehouseId, variantId: alloc.variantId },
      data:  { reservedQty: { decrement: alloc.reservedQty } },
    }).catch(() => {});

    await tx.orderFulfillmentAllocation.update({
      where: { id: alloc.id },
      data:  { status: "DISPATCHED", dispatchedAt: new Date() },
    });
  }
}
