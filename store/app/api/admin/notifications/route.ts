import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { sendBulkNotification, type NotificationType } from "@/lib/notifications";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// ─── GET — list all notifications (admin view) ───────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit    = 25;
  const userId   = searchParams.get("userId");
  const category = searchParams.get("category");
  const type     = searchParams.get("type");
  const q        = searchParams.get("q") ?? "";

  const where: Record<string, unknown> = {};
  if (userId)   where.userId   = userId;
  if (category) where.category = category;
  if (type)     where.type     = type;
  if (q)        where.OR = [
    { title: { contains: q, mode: "insensitive" } },
    { user: { email: { contains: q, mode: "insensitive" } } },
  ];

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.notification.count({ where }),
  ]);

  // Aggregate stats for the last 30 days
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const stats = await prisma.notification.groupBy({
    by:      ["category"],
    _count:  { _all: true },
    where:   { createdAt: { gte: since } },
  });

  const deliveryStats = await prisma.notificationDelivery.groupBy({
    by:     ["channel", "status"],
    _count: { _all: true },
    where:  { createdAt: { gte: since } },
  }).catch(() => []);

  return NextResponse.json({ notifications, total, pages: Math.ceil(total / limit), stats, deliveryStats });
}

// ─── POST — admin sends notification to segment or specific users ─────────────

const sendSchema = z.object({
  // Target
  userIds:      z.array(z.string()).optional(), // specific users
  segments:     z.array(z.string()).optional(), // SegmentTag values
  targetAll:    z.boolean().default(false),

  // Content
  type:         z.string().default("system.announcement"),
  title:        z.string().min(1).max(200),
  body:         z.string().min(1).max(1000),
  actionUrl:    z.string().optional(),
  actionLabel:  z.string().max(50).optional(),
  imageUrl:     z.string().url().optional().or(z.literal("")),
  data:         z.record(z.unknown()).optional(),

  // Campaign link
  campaignId:   z.string().optional(),
  adminNote:    z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const raw  = await req.json();
  const body = sendSchema.safeParse(raw);
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { userIds, segments, targetAll, ...notifData } = body.data;

  // Resolve target user IDs
  let targetIds: string[] = userIds ?? [];

  if (targetAll) {
    const users = await prisma.user.findMany({
      where:  { role: "CUSTOMER", isActive: true },
      select: { id: true },
    });
    targetIds = users.map(u => u.id);
  } else if (segments && segments.length > 0) {
    const segs = await prisma.customerSegment.findMany({
      where:  { tags: { hasSome: segments } },
      select: { userId: true },
    });
    targetIds = [...new Set([...targetIds, ...segs.map(s => s.userId)])];
  }

  if (targetIds.length === 0) {
    return NextResponse.json({ error: "No target users found" }, { status: 400 });
  }

  // Send bulk
  const result = await sendBulkNotification(targetIds, {
    type:        notifData.type as NotificationType,
    title:       notifData.title,
    body:        notifData.body,
    actionUrl:   notifData.actionUrl,
    actionLabel: notifData.actionLabel,
    imageUrl:    notifData.imageUrl || undefined,
    data:        notifData.data as Record<string, unknown> | undefined,
    campaignId:  notifData.campaignId,
    sentByAdmin: true,
    adminNote:   notifData.adminNote,
  });

  // Audit log
  try {
    const adminProfile = await prisma.adminProfile.findUnique({ where: { userId: session.user.id } });
    if (adminProfile) {
      await prisma.auditLog.create({
        data: {
          adminId:      adminProfile.id,
          action:       "OTHER",
          resourceType: "notification",
          resourceName: notifData.title,
          newValue:     {
            type: notifData.type, targetCount: targetIds.length,
            succeeded: result.succeeded, segments, targetAll,
          },
        },
      });
    }
  } catch { /* non-blocking */ }

  return NextResponse.json({ ok: true, ...result, targetCount: targetIds.length });
}
