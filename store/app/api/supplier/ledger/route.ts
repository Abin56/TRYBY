import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, LedgerEntryType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const page  = parseInt(searchParams.get("page") ?? "1");
  const limit = 30;
  const type  = searchParams.get("type") as LedgerEntryType | null;
  const from  = searchParams.get("from");
  const to    = searchParams.get("to");

  const where: Record<string, unknown> = { supplierId: supplier.id };
  if (type)              where.type      = type;
  if (from || to) {
    where.createdAt = {
      ...(from && { gte: new Date(from) }),
      ...(to   && { lte: new Date(to)   }),
    };
  }

  const [entries, total] = await Promise.all([
    prisma.supplierLedger.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.supplierLedger.count({ where }),
  ]);

  return NextResponse.json({ entries, total, pages: Math.ceil(total / limit) });
}
