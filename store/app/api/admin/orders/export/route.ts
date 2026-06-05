import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, OrderStatus } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }
function esc(v: string | null | undefined) { return `"${String(v ?? "").replace(/"/g, '""')}"`; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as OrderStatus | null;
  const q      = searchParams.get("q") ?? "";
  const since  = searchParams.get("since");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (since)  where.createdAt = { gte: new Date(since) };
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { user: { name:  { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      user:    { select: { name: true, email: true, phone: true } },
      items:   { select: { productName: true, quantity: true, unitPrice: true, total: true, size: true } },
      payment: { select: { status: true, method: true, amount: true } },
      shipment:{ select: { trackingNumber: true, carrierName: true, status: true } },
      shippingAddress: { select: { city: true, state: true, pincode: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const header = "OrderNumber,Date,CustomerName,Email,Phone,City,State,Pincode,Status,PaymentStatus,PaymentMethod,Total,Items,TrackingNumber,Carrier\n";
  const rows = orders.map(o => {
    const itemSummary = o.items.map(i => `${i.productName} x${i.quantity}`).join("; ");
    return [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString("en-IN"),
      esc(o.user.name),
      esc(o.user.email),
      esc(o.user.phone),
      esc(o.shippingAddress.city),
      esc(o.shippingAddress.state),
      o.shippingAddress.pincode,
      o.status,
      o.payment?.status ?? "",
      o.payment?.method ?? "",
      Number(o.total),
      esc(itemSummary),
      o.shipment?.trackingNumber ?? "",
      esc(o.shipment?.carrierName),
    ].join(",");
  }).join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${Date.now()}.csv"`,
    },
  });
}
