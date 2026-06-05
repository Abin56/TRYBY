import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateMobileToken } from "@/lib/mobile";
import { z } from "zod";

// GET — Mobile notification inbox (cursor-paginated)
export async function GET(req: NextRequest) {
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateMobileToken(bearer);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const cursor    = searchParams.get("cursor");
  const limit     = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const unreadOnly = searchParams.get("unread") === "true";

  const where: Record<string, unknown> = { userId: session.userId };
  if (unreadOnly) where.isRead = false;
  if (cursor)     where.id = { lt: cursor };

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take:    limit + 1,
      select:  {
        id: true, type: true, category: true, priority: true,
        title: true, body: true, actionUrl: true, actionLabel: true,
        imageUrl: true, isRead: true, readAt: true, createdAt: true,
      },
    }),
    prisma.notification.count({ where: { userId: session.userId, isRead: false } }),
  ]);

  const hasMore    = items.length > limit;
  const pageItems  = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore ? pageItems[pageItems.length - 1]?.id : null;

  return NextResponse.json({ notifications: pageItems, unreadCount, nextCursor, hasMore });
}

const patchSchema = z.object({
  action: z.enum(["mark_read", "mark_all_read", "delete"]),
  ids:    z.array(z.string()).optional(),
});

// PATCH — Bulk mark read / delete
export async function PATCH(req: NextRequest) {
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateMobileToken(bearer);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { action, ids } = body.data;
  const userId = session.userId;

  if (action === "mark_all_read") {
    const r = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data:  { isRead: true, readAt: new Date() },
    });
    return NextResponse.json({ ok: true, updated: r.count });
  }

  if (!ids?.length) return NextResponse.json({ error: "ids required" }, { status: 400 });

  if (action === "mark_read") {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId },
      data:  { isRead: true, readAt: new Date() },
    });
  } else {
    await prisma.notification.deleteMany({ where: { id: { in: ids }, userId } });
  }

  return NextResponse.json({ ok: true });
}
