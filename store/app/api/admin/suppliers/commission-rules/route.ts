import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, CommissionScope } from "@prisma/client";
import { z } from "zod";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const scope      = searchParams.get("scope") as CommissionScope | null;
  const supplierId = searchParams.get("supplierId");
  const categoryId = searchParams.get("categoryId");

  const where: Record<string, unknown> = { isActive: true };
  if (scope)      where.scope      = scope;
  if (supplierId) where.supplierId = supplierId;
  if (categoryId) where.categoryId = categoryId;

  const rules = await prisma.commissionRule.findMany({
    where,
    orderBy: [{ scope: "asc" }, { createdAt: "desc" }],
  });

  // Enrich with supplier/category names
  const enriched = await Promise.all(rules.map(async rule => {
    let supplierName: string | null = null;
    let categoryName: string | null = null;
    if (rule.supplierId) {
      const s = await prisma.supplier.findUnique({ where: { id: rule.supplierId }, select: { companyName: true } });
      supplierName = s?.companyName ?? null;
    }
    if (rule.categoryId) {
      const c = await prisma.category.findUnique({ where: { id: rule.categoryId }, select: { name: true } });
      categoryName = c?.name ?? null;
    }
    return { ...rule, supplierName, categoryName };
  }));

  return NextResponse.json({ rules: enriched });
}

const createSchema = z.object({
  scope:      z.nativeEnum(CommissionScope),
  rate:       z.number().min(0).max(1),
  supplierId: z.string().optional(),
  categoryId: z.string().optional(),
  label:      z.string().optional(),
  validFrom:  z.string().optional(),
  validUntil: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = createSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { scope, rate, supplierId, categoryId, label, validFrom, validUntil } = body.data;

  if (scope === CommissionScope.SUPPLIER && !supplierId) {
    return NextResponse.json({ error: "supplierId required for SUPPLIER scope" }, { status: 400 });
  }
  if (scope === CommissionScope.CATEGORY && !categoryId) {
    return NextResponse.json({ error: "categoryId required for CATEGORY scope" }, { status: 400 });
  }

  const rule = await prisma.commissionRule.create({
    data: {
      scope,
      rate,
      supplierId: supplierId ?? null,
      categoryId: categoryId ?? null,
      label:      label ?? null,
      validFrom:  validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      createdBy:  session.user.id,
    },
  });

  // If supplier-specific rule, also update the supplier's commission rate directly
  if (scope === CommissionScope.SUPPLIER && supplierId) {
    await prisma.supplier.update({
      where: { id: supplierId },
      data:  { commissionRate: rate },
    });
  }

  return NextResponse.json(rule, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, rate, label, isActive, validUntil } = await req.json() as {
    id: string; rate?: number; label?: string; isActive?: boolean; validUntil?: string;
  };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const rule = await prisma.commissionRule.update({
    where: { id },
    data: {
      ...(rate       !== undefined && { rate }),
      ...(label      !== undefined && { label }),
      ...(isActive   !== undefined && { isActive }),
      ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
    },
  });

  return NextResponse.json(rule);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.commissionRule.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
