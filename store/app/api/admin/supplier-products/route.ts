import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// GET — list products pending approval (isActive: false, supplierId not null)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page     = parseInt(searchParams.get("page") ?? "1");
  const limit    = 20;
  const q        = searchParams.get("q") ?? "";
  const approved = searchParams.get("approved"); // "true" | "false" | null (all)

  const where: Record<string, unknown> = {
    supplierId: { not: null },
  };

  if (approved === "false") where.isActive = false;
  else if (approved === "true") where.isActive = true;

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { supplier: { companyName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        supplier: {
          include: { user: { select: { name: true, email: true } } },
        },
        category: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
        variants: { select: { price: true, stock: true, sku: true }, take: 3 },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, pages: Math.ceil(total / limit) });
}

// PATCH — approve or reject a supplier product
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, action, reason } = await req.json() as { id: string; action: "approve" | "reject"; reason?: string };
  if (!id || !action) return NextResponse.json({ error: "id and action required" }, { status: 400 });

  const product = await prisma.product.findUnique({
    where: { id },
    include: { supplier: { include: { user: { select: { id: true } } } } },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!product.supplierId) return NextResponse.json({ error: "Not a supplier product" }, { status: 400 });

  const updated = await prisma.product.update({
    where: { id },
    data: { isActive: action === "approve" },
  });

  // Log to supplier activity
  await prisma.supplierActivityLog.create({
    data: {
      supplierId: product.supplierId,
      action:     action === "approve" ? "PRODUCT_APPROVED" : "PRODUCT_REJECTED",
      detail:     action === "approve"
        ? `Product "${product.name}" was approved and is now live`
        : `Product "${product.name}" was rejected${reason ? `: ${reason}` : ""}`,
      resourceId: product.id,
    },
  });

  // Notify supplier
  await prisma.notification.create({
    data: {
      userId:     product.supplier!.user.id,
      supplierId: product.supplierId,
      type:       action === "approve" ? "PRODUCT_APPROVED" : "PRODUCT_REJECTED",
      title:      action === "approve" ? "Product Approved" : "Product Rejected",
      body:       action === "approve"
        ? `Your product "${product.name}" has been approved and is now live on the store.`
        : `Your product "${product.name}" was not approved.${reason ? ` Reason: ${reason}` : " Contact support for details."}`,
      data:       { productId: id, productName: product.name },
    },
  });

  return NextResponse.json(updated);
}
