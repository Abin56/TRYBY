/**
 * Login protection: failed-attempt tracking, account lockout, and
 * security event logging. Called from the NextAuth credentials authorize
 * callback and from API auth routes.
 */

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ── Config ─────────────────────────────────────────────────────────────────

const MAX_FAILURES      = 5;    // lock after this many consecutive failures
const LOCK_DURATION_MIN = 15;   // minutes to lock the account
const WINDOW_MIN        = 30;   // look-back window for counting failures

// ── Core helpers ───────────────────────────────────────────────────────────

/** Record a failed login and possibly lock the account. Returns whether locked. */
export async function recordFailedLogin(
  email: string,
  ip: string | null,
  reason = "invalid_credentials"
): Promise<{ locked: boolean; lockedUntil?: Date }> {
  const now     = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MIN * 60 * 1000);

  // Write event row (never throws — fire-and-forget safe)
  await Promise.all([
    prisma.loginAttempt.create({
      data: { email, ip, success: false, failureReason: reason },
    }).catch(() => null),

    prisma.securityEvent.create({
      data: {
        type:      "LOGIN_FAILED",
        ip,
        email,
        route:     "/api/auth/login",
        metadata:  { reason } as Prisma.InputJsonValue,
      },
    }).catch(() => null),
  ]);

  // Count recent failures for this email in the window
  const recentFailures = await prisma.loginAttempt.count({
    where: {
      email,
      success: false,
      createdAt: { gte: windowStart },
    },
  }).catch(() => 0);

  if (recentFailures >= MAX_FAILURES) {
    const lockedUntil = new Date(now.getTime() + LOCK_DURATION_MIN * 60 * 1000);

    await Promise.all([
      prisma.user.updateMany({
        where: { email },
        data:  { loginFailures: recentFailures, lockedUntil, lastFailedLoginAt: now },
      }).catch(() => null),

      prisma.securityEvent.create({
        data: {
          type:      "ACCOUNT_LOCKED",
          ip,
          email,
          metadata:  { reason: "too_many_failures", failureCount: recentFailures, lockedUntil: lockedUntil.toISOString() } as Prisma.InputJsonValue,
        },
      }).catch(() => null),
    ]);

    return { locked: true, lockedUntil };
  }

  // Update failure counter without locking
  await prisma.user.updateMany({
    where: { email },
    data:  { loginFailures: recentFailures, lastFailedLoginAt: now },
  }).catch(() => null);

  return { locked: false };
}

/** Record a successful login, clearing failure counters. */
export async function recordSuccessfulLogin(email: string, ip: string | null): Promise<void> {
  await Promise.all([
    prisma.loginAttempt.create({
      data: { email, ip, success: true },
    }).catch(() => null),

    prisma.user.updateMany({
      where: { email },
      data:  { loginFailures: 0, lockedUntil: null, lastFailedLoginAt: null },
    }).catch(() => null),

    prisma.securityEvent.create({
      data: { type: "LOGIN_SUCCESS", ip, email, route: "/api/auth/login" },
    }).catch(() => null),
  ]);
}

/** Check if an account is currently locked. Returns null if not locked. */
export async function checkAccountLock(email: string): Promise<Date | null> {
  const user = await prisma.user.findUnique({
    where:  { email },
    select: { lockedUntil: true },
  }).catch(() => null);

  if (!user?.lockedUntil) return null;
  if (user.lockedUntil > new Date()) return user.lockedUntil;

  // Lock expired — clear it
  await prisma.user.updateMany({
    where: { email },
    data:  { lockedUntil: null, loginFailures: 0 },
  }).catch(() => null);

  return null;
}

/** Log a security event generically (rate limit hit, suspicious activity). */
export async function logSecurityEvent(event: {
  type: "RATE_LIMIT_HIT" | "SUSPICIOUS_REQUEST" | "PASSWORD_RESET_REQUEST" | "REGISTRATION";
  ip: string | null;
  email?: string;
  route?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { metadata, ...rest } = event;
  await prisma.securityEvent.create({
    data: {
      ...rest,
      ...(metadata !== undefined && { metadata: metadata as Prisma.InputJsonValue }),
    },
  }).catch(() => null);
}
