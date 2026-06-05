/**
 * Sliding-window rate limiter backed by Prisma / PostgreSQL.
 * No Redis or external cache required — works on Neon serverless.
 *
 * Algorithm: each "key" (ip:route) has one row. On every request we
 * increment the hit counter. If the window has expired we reset it.
 * Over-limit requests are rejected; the row persists for the window duration.
 */

import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSec: number;
  /** Human-readable name used in error messages */
  name?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limited: boolean;
}

// ── Preset profiles ────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  // Auth endpoints — strict
  register:       { limit: 5,   windowSec: 60 * 15,  name: "Registration" },       // 5 per 15 min
  login:          { limit: 10,  windowSec: 60 * 5,   name: "Login" },              // 10 per 5 min
  forgotPassword: { limit: 5,   windowSec: 60 * 60,  name: "Password Reset" },     // 5 per hour
  resetPassword:  { limit: 5,   windowSec: 60 * 15,  name: "Password Reset" },     // 5 per 15 min

  // Webhooks — generous but guarded
  webhook:        { limit: 200, windowSec: 60,        name: "Webhook" },            // 200/min

  // Admin API — moderate (admin users are trusted)
  adminApi:       { limit: 300, windowSec: 60,        name: "Admin API" },          // 300/min

  // Supplier API
  supplierApi:    { limit: 150, windowSec: 60,        name: "Supplier API" },       // 150/min

  // General public API
  publicApi:      { limit: 100, windowSec: 60,        name: "Public API" },         // 100/min
} as const satisfies Record<string, RateLimitConfig>;

// ── IP extraction ──────────────────────────────────────────────────────────

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

// ── Core check ────────────────────────────────────────────────────────────

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowSec * 1000);
  const expiresAt   = new Date(now.getTime() + config.windowSec * 1000);

  try {
    const entry = await prisma.rateLimitEntry.findUnique({ where: { key } });

    if (!entry || entry.windowStart < windowStart) {
      // New window — upsert with hit count 1
      await prisma.rateLimitEntry.upsert({
        where:  { key },
        create: { key, hits: 1, windowStart: now, expiresAt },
        update: { hits: 1, windowStart: now, blockedAt: null, expiresAt },
      });
      return { allowed: true, remaining: config.limit - 1, resetAt: expiresAt, limited: false };
    }

    if (entry.hits >= config.limit) {
      // Over limit
      const resetAt = new Date(entry.windowStart.getTime() + config.windowSec * 1000);
      return { allowed: false, remaining: 0, resetAt, limited: true };
    }

    // Within limit — increment
    const updated = await prisma.rateLimitEntry.update({
      where: { key },
      data:  { hits: { increment: 1 }, expiresAt },
    });

    const resetAt = new Date(entry.windowStart.getTime() + config.windowSec * 1000);
    return {
      allowed:   true,
      remaining: Math.max(0, config.limit - updated.hits),
      resetAt,
      limited:   false,
    };
  } catch {
    // On DB error, fail open — don't block legitimate traffic
    return { allowed: true, remaining: 0, resetAt: expiresAt, limited: false };
  }
}

// ── Convenience wrapper for route handlers ─────────────────────────────────

export async function rateLimit(
  req: NextRequest,
  routeKey: string,
  config: RateLimitConfig
): Promise<RateLimitResult & { ip: string }> {
  const ip  = getClientIp(req);
  const key = `${ip}:${routeKey}`;
  const result = await checkRateLimit(key, config);
  return { ...result, ip };
}

// ── Header builder (RFC 6585 style) ───────────────────────────────────────

export function rateLimitHeaders(result: RateLimitResult, limit: number): Record<string, string> {
  return {
    "X-RateLimit-Limit":     String(limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset":     String(Math.floor(result.resetAt.getTime() / 1000)),
    ...(result.limited ? { "Retry-After": String(Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)) } : {}),
  };
}

// ── GC helper — call from a cron or cleanup route to prune stale rows ─────

export async function cleanExpiredRateLimits(): Promise<number> {
  const result = await prisma.rateLimitEntry.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
