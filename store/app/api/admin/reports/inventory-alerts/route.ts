import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET() {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [oos, low, inactiveSupplierProducts, pendingApproval] = await Promise.all([
    // Out of stock — active variants
    prisma.productVariant.findMany({
      where: { isActive: true, stock: 0 },
      include: {
        product: {
          select: { id: true, name: true, slug: true, isActive: true, supplierId: true,
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            supplier: { select: { companyName: true } },
          },
        },
      },
      orderBy: { updatedAt: "asc" }, // oldest OOS first
      take: 30,
    }),

    // Low stock (1–5 units)
    prisma.productVariant.findMany({
      where: { isActive: true, stock: { gt: 0, lte: 5 } },
      include: {
        product: {
          select: { id: true, name: true, slug: true, supplierId: true,
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            supplier: { select: { companyName: true } },
          },
        },
      },
      orderBy: { stock: "asc" },
      take: 30,
    }),

    // Products from inactive/suspended suppliers
    prisma.product.findMany({
      where: { isActive: true, supplier: { status: { in: ["SUSPENDED", "PENDING"] } } },
      select: {
        id: true, name: true, slug: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        supplier: { select: { companyName: true, status: true } },
        variants: { select: { stock: true } },
      },
      take: 20,
    }),

    // Supplier products pending approval > 3 days
    prisma.product.findMany({
      where: {
        isActive: false,
        supplierId: { not: null },
        createdAt: { lte: new Date(Date.now() - 3 * 86_400_000) },
      },
      select: {
        id: true, name: true, createdAt: true,
        supplier: { select: { companyName: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    outOfStock: {
      count: oos.length,
      items: oos.map(v => ({
        variantId:   v.id,
        sku:         v.sku,
        size:        v.size,
        color:       v.color,
        productId:   v.product.id,
        productName: v.product.name,
        image:       v.product.images[0]?.url ?? null,
        supplierName: v.product.supplier?.companyName ?? null,
      })),
    },
    lowStock: {
      count: low.length,
      items: low.map(v => ({
        variantId:   v.id,
        sku:         v.sku,
        size:        v.size,
        stock:       v.stock,
        productId:   v.product.id,
        productName: v.product.name,
        image:       v.product.images[0]?.url ?? null,
        supplierName: v.product.supplier?.companyName ?? null,
      })),
    },
    inactiveSupplierProducts: {
      count: inactiveSupplierProducts.length,
      items: inactiveSupplierProducts.map(p => ({
        id:           p.id,
        name:         p.name,
        totalStock:   p.variants.reduce((s, v) => s + v.stock, 0),
        image:        p.images[0]?.url ?? null,
        supplierName: p.supplier?.companyName ?? null,
        supplierStatus: p.supplier?.status ?? null,
      })),
    },
    pendingApproval: {
      count: pendingApproval.length,
      items: pendingApproval.map(p => ({
        id:           p.id,
        name:         p.name,
        supplierName: p.supplier?.companyName ?? null,
        waitingDays:  Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 86_400_000),
      })),
    },
    generatedAt: new Date().toISOString(),
  });
}
