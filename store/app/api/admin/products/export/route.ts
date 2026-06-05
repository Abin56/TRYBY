import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

function esc(v: string | null | undefined) {
  if (v == null) return "";
  return `"${String(v).replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type   = searchParams.get("type") ?? "products";  // products | variants | inventory | profit
  const sport  = searchParams.get("sport") ?? "";
  const active = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (sport)  where.sport    = sport;
  if (active === "active")   where.isActive = true;
  if (active === "inactive") where.isActive = false;

  let csv = "";
  let filename = `tryby-${type}-${Date.now()}.csv`;

  if (type === "products") {
    const products = await prisma.product.findMany({
      where,
      include: {
        category:  { select: { name: true, slug: true } },
        supplier:  { select: { companyName: true } },
        images:    { where: { isPrimary: true }, take: 1, select: { url: true } },
        variants:  { select: { price: true, mrp: true, stock: true, costPrice: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    csv = "ID,Name,Slug,Sport,Category,Description,Team,League,Active,Featured,Homepage,ShippingCost,MetaTitle,MetaDescription,PrimaryImage,LowestPrice,VariantCount,TotalStock,Supplier,CreatedAt\n";
    csv += products.map(p => {
      const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
      return [
        p.id, esc(p.name), p.slug, p.sport, esc(p.category.name), esc(p.description),
        esc(p.teamName), esc(p.leagueName), p.isActive, p.isFeatured, p.showOnHomepage,
        p.shippingCost, esc(p.metaTitle), esc(p.metaDescription),
        esc(p.images[0]?.url), p.variants[0] ? Number(p.variants[0].price) : "",
        p.variants.length, totalStock, esc(p.supplier?.companyName),
        p.createdAt.toISOString(),
      ].join(",");
    }).join("\n");
  }

  else if (type === "variants") {
    const variants = await prisma.productVariant.findMany({
      where:   { product: where },
      include: { product: { select: { name: true, slug: true, sport: true, categoryId: true } } },
      orderBy: { product: { name: "asc" } },
    });

    csv = "VariantID,ProductName,ProductSlug,Sport,SKU,Size,Color,Price,MRP,CostPrice,Stock,Weight,Active,CreatedAt\n";
    csv += variants.map(v => [
      v.id, esc(v.product.name), v.product.slug, v.product.sport,
      v.sku, v.size ?? "", v.color ?? "",
      Number(v.price), Number(v.mrp), v.costPrice ? Number(v.costPrice) : "",
      v.stock, v.weight ? Number(v.weight) : "", v.isActive, v.createdAt.toISOString(),
    ].join(",")).join("\n");
  }

  else if (type === "inventory") {
    const variants = await prisma.productVariant.findMany({
      where:   { product: { isActive: true, ...where } },
      include: {
        product: {
          select: { name: true, slug: true, sport: true,
            category: { select: { name: true } },
            supplier: { select: { companyName: true } },
          },
        },
      },
      orderBy: { stock: "asc" },
    });

    csv = "SKU,ProductName,Sport,Category,Supplier,Size,Color,Stock,Price,Status\n";
    csv += variants.map(v => [
      v.sku, esc(v.product.name), v.product.sport, esc(v.product.category.name),
      esc(v.product.supplier?.companyName), v.size ?? "", v.color ?? "",
      v.stock, Number(v.price),
      v.stock === 0 ? "OUT_OF_STOCK" : v.stock <= 5 ? "LOW_STOCK" : v.stock > 200 ? "OVERSTOCK" : "NORMAL",
    ].join(",")).join("\n");
  }

  else if (type === "profit") {
    const variants = await prisma.productVariant.findMany({
      where:   { product: { isActive: true, ...where } },
      include: {
        product: {
          select: { name: true, slug: true, sport: true, shippingCost: true, packagingCost: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    csv = "SKU,ProductName,Sport,Category,Size,Price,MRP,CostPrice,ShippingCost,PackagingCost,GrossProfit,Margin%,Stock,StockValue,RetailValue\n";
    csv += variants.map(v => {
      const price    = Number(v.price);
      const cost     = Number(v.costPrice ?? 0);
      const ship     = Number(v.product.shippingCost ?? 0);
      const pack     = Number(v.product.packagingCost ?? 0);
      const gross    = price - cost - ship - pack;
      const margin   = price > 0 ? ((gross / price) * 100).toFixed(1) : "0";
      return [
        v.sku, esc(v.product.name), v.product.sport, esc(v.product.category.name),
        v.size ?? "", price, Number(v.mrp), cost, ship, pack,
        gross.toFixed(2), margin, v.stock,
        (cost * v.stock).toFixed(2), (price * v.stock).toFixed(2),
      ].join(",");
    }).join("\n");

    filename = `tryby-profit-${Date.now()}.csv`;
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
