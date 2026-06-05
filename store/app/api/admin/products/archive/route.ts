import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { logAudit, getAdminProfileId } from "@/lib/audit";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

const schema = z.object({
  action:     z.enum(["archive", "restore"]),
  productIds: z.array(z.string()).min(1),
});

// GET — list archived products
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page  = parseInt(searchParams.get("page")  ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const q     = searchParams.get("q") ?? "";

  const where = {
    isActive: false,
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        variants: { select: { stock: true, price: true } },
        images:   { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) });
}

// POST — archive or restore
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { action, productIds } = body.data;
  const adminId = await getAdminProfileId(session.user.id);

  const updateData = action === "archive"
    ? { isActive: false, updatedAt: new Date() }
    : { isActive: false, updatedAt: new Date() }; // restore sets isActive = true

  const data = action === "archive"
    ? { isActive: false }
    : { isActive: true };

  const result = await prisma.product.updateMany({
    where: { id: { in: productIds } },
    data,
  });

  const auditAction = action === "archive" ? "PRODUCT_UPDATED" : "PRODUCT_UPDATED";
  if (adminId) logAudit({ adminId, action: auditAction, resourceType: "product",
    newValue: { productIds, action }, req });

  return NextResponse.json({ affected: result.count });
}
