import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole, Sport } from "@prisma/client";

function adminOnly(role?: string) {
  return role !== UserRole.ADMIN;
}

const variantSchema = z.object({
  sku: z.string().min(1),
  size: z.string().optional(),
  color: z.string().optional(),
  price: z.number().positive(),
  mrp: z.number().positive(),
  stock: z.number().int().min(0),
});

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().min(1),
  sport: z.nativeEnum(Sport),
  categoryId: z.string().cuid(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isOfficialLicensed: z.boolean().default(false),
  teamName: z.string().optional(),
  leagueName: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  variants: z.array(variantSchema).min(1),
  imageUrls: z.array(z.string().url()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") ?? "";
  const sport = searchParams.get("sport") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { teamName: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }
  if (sport) where.sport = sport;
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: true,
        images: { where: { isPrimary: true }, take: 1 },
        badges: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = productSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const { variants, imageUrls, slug: rawSlug, ...data } = body.data;
  const slug = rawSlug ?? data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "A product with this slug already exists" }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: {
      ...data,
      slug,
      variants: { create: variants },
      images: imageUrls?.length
        ? { create: imageUrls.map((url, i) => ({ url, isPrimary: i === 0, sortOrder: i })) }
        : undefined,
    },
    include: { variants: true, images: true, category: true },
  });

  return NextResponse.json(product, { status: 201 });
}
