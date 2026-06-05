// Enhanced supplier product approval with automatic inventory integration
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole, StockChangeReason } from "@prisma/client";
import { logAudit, getAdminProfileId } from "@/lib/audit";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const schema = z.object({
  id:     z.string(),
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
  // Inventory setup on approval
  initialStock:       z.number().int().min(0).optional(),
  warehouseId:        z.string().optional(),
  useDefaultWarehouse: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { id, action, reason, initialStock, warehouseId, useDefaultWarehouse } = body.data;
  const adminProfileId = await getAdminProfileId(session.user.id);

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { select: { id: true, stock: true, productId: true } },
      supplier: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (!product.supplierId) return NextResponse.json({ error: "Not a supplier product" }, { status: 400 });

  // Resolve warehouse for inventory setup
  let resolvedWarehouseId = warehouseId;
  if (action === "approve" && useDefaultWarehouse && !resolvedWarehouseId) {
    const defaultWh = await prisma.warehouse.findFirst({
      where: { isDefault: true, isActive: true },
      select: { id: true },
    });
    resolvedWarehouseId = defaultWh?.id;
  }

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update product status
    const prod = await tx.product.update({
      where: { id },
      data:  { isActive: action === "approve" },
    });

    // 2. If approving: create WarehouseStock records + InventoryLog for each variant
    if (action === "approve" && product.variants.length > 0) {
      const stockQty = initialStock ?? 0;

      for (const variant of product.variants) {
        // Create/update WarehouseStock if warehouse known
        if (resolvedWarehouseId) {
          await tx.warehouseStock.upsert({
            where: { warehouseId_variantId: { warehouseId: resolvedWarehouseId, variantId: variant.id } },
            create: {
              warehouseId: resolvedWarehouseId,
              variantId:   variant.id,
              productId:   id,
              stock:       stockQty,
              reorderPoint: 5,
            },
            update: { stock: { increment: stockQty } },
          });
        }

        // Update variant stock
        if (stockQty > 0) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data:  { stock: { increment: stockQty } },
          });
        }

        // Always write InventoryLog entry
        await tx.inventoryLog.create({
          data: {
            productId:   id,
            variantId:   variant.id,
            warehouseId: resolvedWarehouseId ?? null,
            adminId:     adminProfileId,
            reason:      StockChangeReason.INITIAL_STOCK,
            stockBefore: variant.stock,
            stockAfter:  variant.stock + stockQty,
            delta:       stockQty,
            note:        `Product approved and added to catalog. Initial stock: ${stockQty}`,
          },
        });
      }
    }

    // 3. Supplier activity log
    await tx.supplierActivityLog.create({
      data: {
        supplierId: product.supplierId!,
        action:     action === "approve" ? "PRODUCT_APPROVED" : "PRODUCT_REJECTED",
        detail:     action === "approve"
          ? `Product "${product.name}" approved and is now live. Warehouse stock initialised.`
          : `Product "${product.name}" rejected.${reason ? ` Reason: ${reason}` : ""}`,
        resourceId: product.id,
      },
    });

    // 4. Supplier notification
    await tx.notification.create({
      data: {
        userId:     product.supplier!.user.id,
        supplierId: product.supplierId!,
        type:       action === "approve" ? "PRODUCT_APPROVED" : "PRODUCT_REJECTED",
        title:      action === "approve" ? "Product Approved ✓" : "Product Not Approved",
        body:       action === "approve"
          ? `"${product.name}" is now live on the TRYBY store.`
          : `"${product.name}" was not approved.${reason ? ` Reason: ${reason}` : " Contact support for details."}`,
        data:       { productId: id, productName: product.name },
      },
    });

    return prod;
  });

  // Audit log (outside transaction — fire and forget)
  if (adminProfileId) {
    logAudit({
      adminId:      adminProfileId,
      action:       action === "approve" ? "PRODUCT_UPDATED" : "PRODUCT_UPDATED",
      resourceType: "product",
      resourceId:   id,
      resourceName: product.name,
      newValue: {
        isActive: action === "approve",
        warehouseId: resolvedWarehouseId,
        initialStock,
        supplierCompany: product.supplier?.companyName,
      },
      req,
    });
  }

  return NextResponse.json({
    ok: true,
    product: updated,
    inventoryInitialised: action === "approve",
    warehouseId: resolvedWarehouseId,
    variantsUpdated: action === "approve" ? product.variants.length : 0,
  });
}
