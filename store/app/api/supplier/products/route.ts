import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const page  = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const q     = searchParams.get("q") ?? "";

  const where = {
    supplierId: supplier.id,
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true } },
        variants: { select: { id: true, sku: true, size: true, color: true, price: true, mrp: true, stock: true, isActive: true } },
        images:   { where: { isPrimary: true }, take: 1 },
        _count:   { select: { orderItems: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
  if (supplier.status !== "APPROVED") {
    return NextResponse.json({ error: "Supplier account not yet approved" }, { status: 403 });
  }

  const body = await req.json();
  const {
    name, slug, description, sport, categoryId,
    metaTitle, metaDescription, teamName, leagueName,
  } = body;

  if (!name || !slug || !description || !sport || !categoryId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Products from suppliers start inactive — require admin approval
  const product = await prisma.product.create({
    data: {
      supplierId: supplier.id,
      categoryId,
      name,
      slug,
      description,
      sport,
      isActive: false, // pending admin approval
      metaTitle:       metaTitle ?? null,
      metaDescription: metaDescription ?? null,
      teamName:        teamName ?? null,
      leagueName:      leagueName ?? null,
    },
  });

  // Log activity
  await prisma.supplierActivityLog.create({
    data: {
      supplierId: supplier.id,
      action:     "PRODUCT_CREATED",
      detail:     `Created product: ${name}`,
      resourceId: product.id,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
