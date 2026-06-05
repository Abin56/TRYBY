import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, StockChangeReason } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page        = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit       = 50;
  const productId   = searchParams.get("productId")   ?? undefined;
  const variantId   = searchParams.get("variantId")   ?? undefined;
  const warehouseId = searchParams.get("warehouseId") ?? undefined;
  const reason      = searchParams.get("reason") as StockChangeReason | null;
  const q           = searchParams.get("q") ?? "";

  const where: Record<string, unknown> = {};
  if (productId)   where.productId   = productId;
  if (variantId)   where.variantId   = variantId;
  if (warehouseId) where.warehouseId = warehouseId;
  if (reason)      where.reason      = reason;
  if (q) {
    where.OR = [
      { variant: { sku:  { contains: q, mode: "insensitive" } } },
      { product: { name: { contains: q, mode: "insensitive" } } },
      { note:    { contains: q, mode: "insensitive" } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.inventoryLog.findMany({
      where,
      include: {
        product:   { select: { id: true, name: true } },
        variant:   { select: { id: true, sku: true, size: true, color: true } },
        warehouse: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inventoryLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, pages: Math.ceil(total / limit) });
}
