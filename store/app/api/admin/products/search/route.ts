import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, Sport } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q          = searchParams.get("q") ?? "";
  const sku        = searchParams.get("sku") ?? "";
  const sport      = searchParams.get("sport") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const supplierId = searchParams.get("supplierId") ?? "";
  const status     = searchParams.get("status") ?? "";   // active | inactive | all
  const minStock   = searchParams.get("minStock");
  const maxStock   = searchParams.get("maxStock");
  const minPrice   = searchParams.get("minPrice");
  const maxPrice   = searchParams.get("maxPrice");
  const hasCost    = searchParams.get("hasCost");         // true | false
  const hasImage   = searchParams.get("hasImage");
  const hasMetaSeo = searchParams.get("hasMetaSeo");
  const page       = parseInt(searchParams.get("page")  ?? "1");
  const limit      = parseInt(searchParams.get("limit") ?? "25");
  const sortBy     = searchParams.get("sortBy") ?? "createdAt";  // createdAt | name | stock | price

  // SKU search — query variants directly
  if (sku) {
    const variant = await prisma.productVariant.findFirst({
      where: { sku: { contains: sku, mode: "insensitive" } },
      include: {
        product: {
          include: {
            category: { select: { name: true } },
            images:   { where: { isPrimary: true }, take: 1 },
            variants: { select: { sku: true, size: true, stock: true, price: true } },
          },
        },
      },
    });
    return NextResponse.json({ products: variant ? [variant.product] : [], total: variant ? 1 : 0 });
  }

  // Build product-level where
  const productWhere: Record<string, unknown> = {};

  if (q) {
    productWhere.OR = [
      { name:     { contains: q, mode: "insensitive" } },
      { teamName: { contains: q, mode: "insensitive" } },
      { slug:     { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  if (sport)      productWhere.sport      = sport as Sport;
  if (categoryId) productWhere.categoryId = categoryId;
  if (supplierId) productWhere.supplierId = supplierId;
  if (status === "active")   productWhere.isActive = true;
  if (status === "inactive") productWhere.isActive = false;

  if (hasMetaSeo === "missing") {
    productWhere.OR = [
      ...(Array.isArray(productWhere.OR) ? productWhere.OR : []),
      { metaTitle: null }, { metaDescription: null },
    ];
  }

  // Variant-level filters
  const variantWhere: Record<string, unknown> = {};
  if (minStock !== null) variantWhere.stock = { ...variantWhere.stock as object, gte: parseInt(minStock!) };
  if (maxStock !== null) variantWhere.stock = { ...variantWhere.stock as object, lte: parseInt(maxStock!) };
  if (minPrice !== null) variantWhere.price = { ...variantWhere.price as object, gte: parseFloat(minPrice!) };
  if (maxPrice !== null) variantWhere.price = { ...variantWhere.price as object, lte: parseFloat(maxPrice!) };
  if (hasCost === "missing") variantWhere.costPrice = null;

  if (Object.keys(variantWhere).length > 0) {
    productWhere.variants = { some: variantWhere };
  }

  // Image filter
  if (hasImage === "missing") productWhere.images = { none: {} };

  const orderBy: Record<string, unknown> =
    sortBy === "name"  ? { name: "asc" } :
    sortBy === "price" ? { variants: { _min: { price: "asc" } } } :
    { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where:   productWhere,
      include: {
        category: { select: { name: true } },
        supplier: { select: { companyName: true } },
        images:   { where: { isPrimary: true }, take: 1, select: { url: true } },
        variants: { select: { id: true, sku: true, size: true, color: true, price: true, mrp: true, stock: true, costPrice: true, isActive: true } },
        badges:   { select: { type: true } },
      },
      orderBy,
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    prisma.product.count({ where: productWhere }),
  ]);

  return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) });
}
