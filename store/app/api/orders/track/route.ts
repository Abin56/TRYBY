import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public order tracking — no auth required.
// Requires both orderNumber AND the email used at checkout to prevent enumeration.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const orderNumber = searchParams.get("orderNumber")?.trim().toUpperCase();
  const email       = searchParams.get("email")?.trim().toLowerCase();

  if (!orderNumber || !email) {
    return NextResponse.json({ error: "orderNumber and email are required" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      user: { email },
    },
    select: {
      orderNumber: true,
      status:      true,
      createdAt:   true,
      items: {
        select: { productName: true, quantity: true },
        take: 5,
      },
      shipment: {
        select: {
          trackingNumber: true,
          carrier:        true,
          status:         true,
          estimatedAt:    true,
          trackingUrl:    true,
        },
      },
      statusHistory: {
        select: { status: true, createdAt: true, note: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    // Return same 404 whether not found or wrong email — prevents order number enumeration.
    return NextResponse.json({ error: "Order not found. Check your order number and email." }, { status: 404 });
  }

  return NextResponse.json(order);
}
