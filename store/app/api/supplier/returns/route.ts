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
  const page   = parseInt(searchParams.get("page") ?? "1");
  const limit  = 20;
  const status = searchParams.get("status");

  const supplierOrderIds = await prisma.orderItem.findMany({
    where: { product: { supplierId: supplier.id } },
    select: { orderId: true },
    distinct: ["orderId"],
  });
  const orderIds = supplierOrderIds.map((o: { orderId: string }) => o.orderId);

  const where = {
    orderId: { in: orderIds },
    ...(status ? { status: status as never } : {}),
  };

  const [returns, total] = await Promise.all([
    prisma.returnRequest.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            createdAt: true,
            items: {
              where: { product: { supplierId: supplier.id } },
              select: { productName: true, quantity: true, variantSku: true, imageUrl: true },
            },
          },
        },
        user: { select: { name: true, email: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.returnRequest.count({ where }),
  ]);

  const allReturns = await prisma.returnRequest.count({ where: { orderId: { in: orderIds } } });
  const totalOrders = await prisma.orderItem.count({ where: { product: { supplierId: supplier.id } } });
  const returnRate = totalOrders > 0 ? (allReturns / totalOrders) * 100 : 0;

  return NextResponse.json({
    returns,
    total,
    pages: Math.ceil(total / limit),
    analytics: { totalReturns: allReturns, returnRate },
  });
}
