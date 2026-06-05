import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, SupplierStatus, PayoutStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page   = parseInt(searchParams.get("page") ?? "1");
  const limit  = 20;
  const status = searchParams.get("status") as SupplierStatus | null;
  const q      = searchParams.get("q") ?? "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { companyName:  { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { gstin: { contains: q, mode: "insensitive" } },
    ];
  }

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      include: {
        user:     { select: { id: true, name: true, email: true, image: true } },
        _count:   { select: { products: true, payouts: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supplier.count({ where }),
  ]);

  return NextResponse.json({ suppliers, total, pages: Math.ceil(total / limit) });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, status, commissionRate } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(commissionRate !== undefined && { commissionRate }),
      ...(status === SupplierStatus.APPROVED && { onboardedAt: new Date() }),
    },
  });

  return NextResponse.json(supplier);
}
