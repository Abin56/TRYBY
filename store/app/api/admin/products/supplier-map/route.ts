import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { logAudit, getAdminProfileId } from "@/lib/audit";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// GET — supplier inventory overview (all suppliers + their product/stock stats)
export async function GET() {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const suppliers = await prisma.supplier.findMany({
    where:   { status: "APPROVED" },
    select: {
      id: true, companyName: true, slug: true, logoUrl: true, tier: true, status: true,
      products: {
        where: { isActive: true },
        select: {
          id: true, name: true, sport: true, isActive: true,
          variants: { select: { stock: true, price: true, costPrice: true } },
          images:   { where: { isPrimary: true }, take: 1, select: { url: true } },
          category: { select: { name: true } },
        },
      },
    },
    orderBy: { companyName: "asc" },
  });

  const supplierStats = suppliers.map(s => {
    const totalProducts = s.products.length;
    const totalStock    = s.products.reduce((sum, p) =>
      sum + p.variants.reduce((vs, v) => vs + v.stock, 0), 0);
    const totalValue    = s.products.reduce((sum, p) =>
      sum + p.variants.reduce((vs, v) => vs + Number(v.costPrice ?? 0) * v.stock, 0), 0);
    const outOfStock    = s.products.filter(p =>
      p.variants.reduce((s, v) => s + v.stock, 0) === 0).length;

    return {
      id: s.id, companyName: s.companyName, slug: s.slug,
      logoUrl: s.logoUrl, tier: s.tier, status: s.status,
      totalProducts, totalStock, totalValue: Math.round(totalValue), outOfStock,
      products: s.products.map(p => ({
        id: p.id, name: p.name, sport: p.sport, isActive: p.isActive,
        category: p.category.name,
        totalStock: p.variants.reduce((s, v) => s + v.stock, 0),
        variantCount: p.variants.length,
        minPrice:  p.variants.length ? Math.min(...p.variants.map(v => Number(v.price))) : 0,
        image: p.images[0]?.url ?? null,
      })),
    };
  });

  // Unmapped products (no supplier)
  const unmapped = await prisma.product.count({ where: { supplierId: null, isActive: true } });

  return NextResponse.json({ suppliers: supplierStats, unmappedCount: unmapped });
}

// PATCH — assign or unassign supplier to products
const patchSchema = z.object({
  productIds:  z.array(z.string()).min(1),
  supplierId:  z.string().nullable(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { productIds, supplierId } = body.data;

  const result = await prisma.product.updateMany({
    where: { id: { in: productIds } },
    data:  { supplierId },
  });

  const adminId = await getAdminProfileId(session.user.id);
  if (adminId) logAudit({ adminId, action: "PRODUCT_UPDATED", resourceType: "product",
    newValue: { supplierId, productIds }, req });

  return NextResponse.json({ affected: result.count });
}
