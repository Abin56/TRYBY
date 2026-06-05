import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { logAudit, getAdminProfileId } from "@/lib/audit";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const schema = z.object({
  productId:      z.string(),
  newName:        z.string().min(1).optional(),
  categoryId:     z.string().optional(),
  includeImages:  z.boolean().default(true),
  includeVariants:z.boolean().default(true),
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { productId, newName, categoryId, includeImages, includeVariants } = body.data;

  const source = await prisma.product.findUnique({
    where:   { id: productId },
    include: { variants: true, images: true },
  });

  if (!source) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const baseName  = newName ?? `${source.name} (Copy)`;
  let slug        = slugify(baseName);
  let attempt     = 0;

  // Ensure slug uniqueness
  while (await prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
    attempt++;
    slug = `${slugify(baseName)}-${attempt}`;
  }

  // De-duplicate SKUs for variants
  const newProduct = await prisma.product.create({
    data: {
      name:               baseName,
      slug,
      description:        source.description,
      sport:              source.sport,
      categoryId:         categoryId ?? source.categoryId,
      supplierId:         source.supplierId,
      isActive:           false, // Start inactive — review before publishing
      isFeatured:         false,
      isOfficialLicensed: source.isOfficialLicensed,
      teamName:           source.teamName,
      leagueName:         source.leagueName,
      teamBadgeUrl:       source.teamBadgeUrl,
      shippingCost:       source.shippingCost,
      packagingCost:      source.packagingCost,
      metaTitle:          source.metaTitle,
      metaDescription:    source.metaDescription,
      variants: includeVariants ? {
        create: source.variants.map((v, i) => ({
          sku:       `${v.sku}-copy${attempt > 0 ? `-${attempt}` : ""}-${i}`,
          size:      v.size,
          color:     v.color,
          price:     v.price,
          mrp:       v.mrp,
          costPrice: v.costPrice,
          stock:     0,    // Reset stock on clone
          weight:    v.weight,
          isActive:  v.isActive,
        })),
      } : undefined,
      images: includeImages ? {
        create: source.images.map(img => ({
          url:       img.url,
          altText:   img.altText,
          isPrimary: img.isPrimary,
          sortOrder: img.sortOrder,
        })),
      } : undefined,
    },
    include: { variants: true, images: true, category: true },
  });

  const adminId = await getAdminProfileId(session.user.id);
  if (adminId) logAudit({ adminId, action: "PRODUCT_CREATED", resourceType: "product",
    resourceId: newProduct.id, resourceName: newProduct.name,
    newValue: { sourceId: productId, sourceName: source.name }, req });

  return NextResponse.json(newProduct, { status: 201 });
}
