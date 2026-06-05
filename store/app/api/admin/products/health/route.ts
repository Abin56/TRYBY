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

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, slug: true, sport: true, description: true,
      metaTitle: true, metaDescription: true, categoryId: true, supplierId: true,
      images:   { take: 1, select: { url: true, isPrimary: true } },
      variants: { select: { costPrice: true, stock: true, isActive: true } },
      category: { select: { name: true } },
    },
  });

  const issues = products.map(p => {
    const flags: string[] = [];
    const totalStock   = p.variants.reduce((s, v) => s + v.stock, 0);
    const hasCostPrice = p.variants.some(v => v.costPrice && Number(v.costPrice) > 0);

    if (!p.images.length)         flags.push("missing_image");
    if (!p.metaTitle?.trim())     flags.push("missing_meta_title");
    if (!p.metaDescription?.trim()) flags.push("missing_meta_description");
    if (!p.description?.trim() || p.description.trim().length < 50) flags.push("short_description");
    if (!hasCostPrice)            flags.push("missing_cost_price");
    if (!p.categoryId)            flags.push("missing_category");
    if (totalStock === 0)         flags.push("out_of_stock");
    if (!p.variants.length)       flags.push("no_variants");
    if (!p.supplierId)            flags.push("no_supplier");

    const score = Math.round(((9 - flags.length) / 9) * 100);

    return {
      id:       p.id,
      name:     p.name,
      slug:     p.slug,
      sport:    p.sport,
      category: p.category.name,
      image:    p.images[0]?.url ?? null,
      flags,
      score:    Math.max(0, score),
      totalStock,
    };
  }).sort((a, b) => a.score - b.score);  // worst first

  // Summary counts
  const summary = {
    total:             products.length,
    missingImage:      issues.filter(i => i.flags.includes("missing_image")).length,
    missingMetaTitle:  issues.filter(i => i.flags.includes("missing_meta_title")).length,
    missingMetaDesc:   issues.filter(i => i.flags.includes("missing_meta_description")).length,
    shortDescription:  issues.filter(i => i.flags.includes("short_description")).length,
    missingCostPrice:  issues.filter(i => i.flags.includes("missing_cost_price")).length,
    outOfStock:        issues.filter(i => i.flags.includes("out_of_stock")).length,
    noVariants:        issues.filter(i => i.flags.includes("no_variants")).length,
    noSupplier:        issues.filter(i => i.flags.includes("no_supplier")).length,
    avgScore:          issues.length ? Math.round(issues.reduce((s, i) => s + i.score, 0) / issues.length) : 100,
    perfect:           issues.filter(i => i.flags.length === 0).length,
  };

  return NextResponse.json({ summary, products: issues });
}
