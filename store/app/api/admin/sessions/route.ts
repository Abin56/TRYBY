import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccess, isSuperAdmin } from "@/lib/rbac";
import { logAudit, getAdminProfileId } from "@/lib/audit";

// GET /api/admin/sessions
// Returns active admin sessions (non-revoked, non-expired)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "sessions:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const adminId = searchParams.get("adminId"); // optional filter
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit   = 50;
  const now     = new Date();

  const where = {
    revokedAt: null,
    expiresAt: { gt: now },
    ...(adminId ? { adminId } : {}),
  };

  const [sessions, total] = await Promise.all([
    prisma.adminSession.findMany({
      where,
      orderBy: { lastSeenAt: "desc" },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    prisma.adminSession.count({ where }),
  ]);

  // Attach user info for display
  const userIds = [...new Set(sessions.map(s => s.userId))];
  const users   = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true, name: true, email: true, image: true,
      adminProfile: { select: { adminRole: true } },
    },
  });
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  return NextResponse.json({
    sessions: sessions.map(s => ({
      ...s,
      user: userMap[s.userId] ?? null,
    })),
    total,
    pages: Math.ceil(total / limit),
  });
}

// POST /api/admin/sessions
// Actions: revoke_session, force_logout_user, revoke_all
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "sessions:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { action, sessionId, userId } = body as {
    action:    "revoke_session" | "force_logout_user" | "revoke_all";
    sessionId?: string;
    userId?:    string;
  };

  const actorAdminId = await getAdminProfileId(session!.user.id);
  const now = new Date();

  if (action === "revoke_session") {
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const target = await prisma.adminSession.findUnique({ where: { id: sessionId } });
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Prevent revoking own current session unless super admin
    if (target.userId === session!.user.id && !isSuperAdmin(session)) {
      return NextResponse.json({ error: "Cannot revoke your own active session" }, { status: 400 });
    }

    await prisma.adminSession.update({
      where: { id: sessionId },
      data:  { revokedAt: now, revokedBy: session!.user.id },
    });

    if (actorAdminId) {
      await logAudit({
        adminId:      actorAdminId,
        action:       "SESSION_REVOKED",
        resourceType: "session",
        resourceId:   sessionId,
        resourceName: target.userId,
        req,
      });
    }

    return NextResponse.json({ revoked: true });
  }

  if (action === "force_logout_user") {
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    // Only super admin can force-logout another admin
    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: "Only Super Admin can force logout users" }, { status: 403 });
    }

    const result = await prisma.adminSession.updateMany({
      where: { userId, revokedAt: null, expiresAt: { gt: now } },
      data:  { revokedAt: now, revokedBy: session!.user.id },
    });

    if (actorAdminId) {
      await logAudit({
        adminId:      actorAdminId,
        action:       "FORCE_LOGOUT",
        resourceType: "admin",
        resourceId:   userId,
        metadata:     { sessionCount: result.count },
        req,
      });
    }

    return NextResponse.json({ revoked: result.count });
  }

  if (action === "revoke_all") {
    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: "Only Super Admin can revoke all sessions" }, { status: 403 });
    }

    const result = await prisma.adminSession.updateMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: now },
        userId:    { not: session!.user.id }, // keep own session
      },
      data: { revokedAt: now, revokedBy: session!.user.id },
    });

    if (actorAdminId) {
      await logAudit({
        adminId:      actorAdminId,
        action:       "FORCE_LOGOUT",
        resourceType: "admin",
        metadata:     { type: "revoke_all", sessionCount: result.count },
        req,
      });
    }

    return NextResponse.json({ revoked: result.count });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
