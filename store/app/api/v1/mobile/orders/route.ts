import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateMobileToken } from "@/lib/mobile";

// GET — Mobile order list with cursor pagination (infinite scroll)
export async function GET(req: NextRequest) {
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateMobileToken(bearer);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const cursor = searchParams.get("cursor");   // last order id from prev page
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "10"), 20);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { userId: session.userId };
  if (status) where.status = status;
  if (cursor) where.id     = { lt: cursor }; // Cursor-based: IDs are CUIDs, sorted by createdAt desc

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take:    limit + 1, // +1 to detect hasMore
    select:  {
      id:            true,
      orderNumber:   true,
      status:        true,
      paymentStatus: true,
      total:         true,
      createdAt:     true,
      items: {
        take:   1, // First item for thumbnail
        select: {
          id:       true,
          quantity: true,
          product:  { select: { name: true, images: true, slug: true } },
          variant:  { select: { name: true } },
        },
      },
      shipment: {
        select: { status: true, trackingNumber: true, courierName: true, estimatedDelivery: true },
      },
    },
  });

  const hasMore    = orders.length > limit;
  const pageItems  = hasMore ? orders.slice(0, -1) : orders;
  const nextCursor = hasMore ? pageItems[pageItems.length - 1]?.id : null;

  // Mobile-friendly thumbnail
  const formatted = pageItems.map(o => ({
    ...o,
    thumbnail:  (o.items[0]?.product?.images as string[])?.[0] ?? null,
    itemCount:  o.items.length,
    firstItem:  o.items[0]?.product?.name ?? null,
  }));

  return NextResponse.json({ orders: formatted, nextCursor, hasMore });
}
