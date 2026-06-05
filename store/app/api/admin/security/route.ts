import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { cleanExpiredRateLimits } from "@/lib/rate-limit";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action"); // "unlock_ip" | "gc"
  const since  = searchParams.get("since");  // ISO date string for filtering
  const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);

  // GC expired rate limit entries
  if (action === "gc") {
    const cleaned = await cleanExpiredRateLimits();
    return NextResponse.json({ cleaned });
  }

  const [
    recentEvents,
    rateLimitHits,
    lockedAccounts,
    failedLogins,
    rateLimitedIps,
    eventCounts,
  ] = await Promise.all([
    // Latest security events
    prisma.securityEvent.findMany({
      where:   { createdAt: { gte: sinceDate } },
      orderBy: { createdAt: "desc" },
      take:    100,
    }),

    // Total rate limit hits in window
    prisma.securityEvent.count({
      where: { type: "RATE_LIMIT_HIT", createdAt: { gte: sinceDate } },
    }),

    // Currently locked accounts
    prisma.user.findMany({
      where:   { lockedUntil: { gt: new Date() } },
      select:  { id: true, email: true, name: true, lockedUntil: true, loginFailures: true, lastFailedLoginAt: true },
      orderBy: { lockedUntil: "desc" },
    }),

    // Recent failed login attempts
    prisma.loginAttempt.findMany({
      where:   { success: false, createdAt: { gte: sinceDate } },
      orderBy: { createdAt: "desc" },
      take:    50,
    }),

    // IPs with rate limit hits in last hour — top offenders
    prisma.securityEvent.groupBy({
      by:      ["ip"],
      where:   { type: "RATE_LIMIT_HIT", createdAt: { gte: sinceDate }, ip: { not: null } },
      _count:  { id: true },
      orderBy: { _count: { id: "desc" } },
      take:    20,
    }),

    // Event type breakdown
    prisma.securityEvent.groupBy({
      by:      ["type"],
      where:   { createdAt: { gte: sinceDate } },
      _count:  { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
  ]);

  // Active rate limit entries (IPs currently in a window with hits)
  const activeRateLimits = await prisma.rateLimitEntry.findMany({
    where:   { expiresAt: { gt: new Date() } },
    orderBy: { hits: "desc" },
    take:    50,
  });

  // Login failure heat map — failures per email (top 20)
  const loginFailuresByEmail = await prisma.loginAttempt.groupBy({
    by:      ["email"],
    where:   { success: false, createdAt: { gte: sinceDate } },
    _count:  { id: true },
    orderBy: { _count: { id: "desc" } },
    take:    20,
  });

  return NextResponse.json({
    summary: {
      windowHours:       Math.round((Date.now() - sinceDate.getTime()) / 3_600_000),
      rateLimitHits,
      lockedAccounts:    lockedAccounts.length,
      failedLogins:      failedLogins.length,
      activeRateLimits:  activeRateLimits.length,
    },
    recentEvents: recentEvents.map(e => ({
      id:        e.id,
      type:      e.type,
      ip:        e.ip,
      email:     e.email,
      route:     e.route,
      createdAt: e.createdAt,
      metadata:  e.metadata,
    })),
    lockedAccounts,
    failedLogins: failedLogins.map(a => ({
      id:            a.id,
      email:         a.email,
      ip:            a.ip,
      failureReason: a.failureReason,
      createdAt:     a.createdAt,
    })),
    rateLimitedIps: rateLimitedIps.map(r => ({
      ip:    r.ip,
      count: r._count.id,
    })),
    activeRateLimits: activeRateLimits.map(r => ({
      key:        r.key,
      hits:       r.hits,
      windowStart: r.windowStart,
      expiresAt:  r.expiresAt,
      blocked:    !!r.blockedAt,
    })),
    loginFailuresByEmail: loginFailuresByEmail.map(r => ({
      email: r.email,
      count: r._count.id,
    })),
    eventCounts: eventCounts.map(r => ({
      type:  r.type,
      count: r._count.id,
    })),
    checkedAt: new Date().toISOString(),
  });
}

// POST — admin actions (unlock account, unblock IP)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action, email, ip } = await req.json().catch(() => ({}));

  if (action === "unlock_account" && email) {
    await prisma.user.updateMany({
      where: { email },
      data:  { lockedUntil: null, loginFailures: 0 },
    });
    await prisma.securityEvent.create({
      data: { type: "ACCOUNT_UNLOCKED", email, metadata: { unlockedBy: session.user.email } },
    });
    return NextResponse.json({ ok: true, action: "unlock_account", email });
  }

  if (action === "unblock_ip" && ip) {
    await prisma.rateLimitEntry.updateMany({
      where: { key: { startsWith: `${ip}:` } },
      data:  { blockedAt: null, hits: 0 },
    });
    return NextResponse.json({ ok: true, action: "unblock_ip", ip });
  }

  if (action === "clear_rate_limits") {
    const deleted = await cleanExpiredRateLimits();
    return NextResponse.json({ ok: true, deleted });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
