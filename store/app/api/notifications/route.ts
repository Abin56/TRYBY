import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// ─── GET — list notifications for current user ────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit    = 20;
  const category = searchParams.get("category");
  const unreadOnly = searchParams.get("unread") === "true";
  const q        = searchParams.get("q") ?? "";

  const where: Record<string, unknown> = { userId: session.user.id };
  if (category)   where.category = category;
  if (unreadOnly) where.isRead   = false;
  if (q)          where.OR = [
    { title: { contains: q, mode: "insensitive" } },
    { body:  { contains: q, mode: "insensitive" } },
  ];

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
  ]);

  return NextResponse.json({
    notifications,
    total,
    pages:       Math.ceil(total / limit),
    unreadCount,
  });
}

// ─── PATCH — mark read / mark all read / delete ──────────────────────────────

const patchSchema = z.object({
  action:  z.enum(["mark_read", "mark_unread", "mark_all_read", "delete"]),
  ids:     z.array(z.string()).optional(), // omit for "mark_all_read"
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { action, ids } = body.data;
  const userId = session.user.id;

  if (action === "mark_all_read") {
    const result = await prisma.notification.updateMany({
      where:  { userId, isRead: false },
      data:   { isRead: true, readAt: new Date() },
    });
    return NextResponse.json({ ok: true, updated: result.count });
  }

  if (!ids?.length) return NextResponse.json({ error: "ids required" }, { status: 400 });

  if (action === "mark_read") {
    await prisma.notification.updateMany({
      where:  { id: { in: ids }, userId },
      data:   { isRead: true, readAt: new Date() },
    });
  } else if (action === "mark_unread") {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId },
      data:  { isRead: false, readAt: null },
    });
  } else if (action === "delete") {
    await prisma.notification.deleteMany({
      where: { id: { in: ids }, userId },
    });
  }

  return NextResponse.json({ ok: true });
}
