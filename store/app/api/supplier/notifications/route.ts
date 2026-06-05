import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page  = parseInt(searchParams.get("page") ?? "1");
  const limit = 30;

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where:   { supplierId: supplier.id },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.notification.count({ where: { supplierId: supplier.id } }),
    prisma.notification.count({ where: { supplierId: supplier.id, isRead: false } }),
  ]);

  return NextResponse.json({ notifications, total, pages: Math.ceil(total / limit), unreadCount });
}

// Mark as read
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPPLIER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const { ids, all } = await req.json() as { ids?: string[]; all?: boolean };

  if (all) {
    await prisma.notification.updateMany({
      where: { supplierId: supplier.id, isRead: false },
      data:  { isRead: true },
    });
  } else if (ids?.length) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, supplierId: supplier.id },
      data:  { isRead: true },
    });
  }

  return NextResponse.json({ ok: true });
}
