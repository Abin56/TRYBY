/**
 * /api/admin/settings/shiprocket
 *
 * GET  — returns saved credentials (password masked) + connection status
 * PUT  — save email + password to SiteSettings["shiprocket_credentials"]
 * POST — test current credentials (action: "test")
 *
 * Credentials are stored in SiteSettings.extraData under key
 * "shiprocket_credentials".  The password is stored as-is (not encrypted at
 * rest here — rely on DB-level encryption / RLS in production).
 * Env vars (SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD) are the fallback if no
 * DB record exists.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { logAudit, getAdminProfileId } from "@/lib/audit";
import { invalidateShiprocketToken } from "@/lib/shipping/shiprocket";

const SETTINGS_KEY = "shiprocket_credentials";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const row    = await prisma.siteSettings.findUnique({ where: { key: SETTINGS_KEY } }).catch(() => null);
  const stored = (row?.extraData ?? {}) as Record<string, unknown>;

  // Fall back to env vars if nothing in DB
  const email    = (stored.email    as string | undefined) ?? process.env.SHIPROCKET_EMAIL    ?? "";
  const hasPass  = !!(stored.password ?? process.env.SHIPROCKET_PASSWORD);
  const webhook  = (stored.webhookSecret as string | undefined) ?? "";
  const pickupLoc = (stored.pickupLocation as string | undefined) ?? "Primary";

  return NextResponse.json({
    email,
    passwordSet: hasPass,
    webhookSecret: webhook ? "***" : "",
    pickupLocation: pickupLoc,
    source: row ? "database" : (process.env.SHIPROCKET_EMAIL ? "environment" : "not_configured"),
  });
}

// ── PUT — save credentials ────────────────────────────────────────────────────

const saveSchema = z.object({
  email:          z.string().email(),
  password:       z.string().min(1),
  webhookSecret:  z.string().optional(),
  pickupLocation: z.string().optional(),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = saveSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { email, password, webhookSecret, pickupLocation } = body.data;

  await prisma.siteSettings.upsert({
    where:  { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, extraData: { email, password, webhookSecret, pickupLocation: pickupLocation ?? "Primary" } },
    update: { extraData: { email, password, webhookSecret, pickupLocation: pickupLocation ?? "Primary" } },
  });

  // Keep env vars in sync for the current process lifetime
  process.env.SHIPROCKET_EMAIL    = email;
  process.env.SHIPROCKET_PASSWORD = password;
  if (webhookSecret) process.env.SHIPROCKET_WEBHOOK_SECRET = webhookSecret;

  // Force re-authentication on the next Shiprocket API call
  invalidateShiprocketToken();

  const adminId = await getAdminProfileId(session.user.id);
  if (adminId) {
    logAudit({
      adminId,
      action:       "SETTINGS_UPDATED",
      resourceType: "settings",
      resourceId:   SETTINGS_KEY,
      resourceName: "Shiprocket Credentials",
      newValue:     { email, passwordUpdated: true },
      req,
    });
  }

  return NextResponse.json({ ok: true, email });
}

// ── POST — test / actions ─────────────────────────────────────────────────────

const actionSchema = z.object({
  action: z.enum(["test"]),
  // Optional override — if admin fills creds in UI but hasn't saved yet
  email:    z.string().email().optional(),
  password: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = actionSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { action, email: overrideEmail, password: overridePass } = body.data;

  if (action === "test") {
    // Resolve credentials: request body → DB → env
    const row    = await prisma.siteSettings.findUnique({ where: { key: SETTINGS_KEY } }).catch(() => null);
    const stored = (row?.extraData ?? {}) as Record<string, unknown>;

    const email    = overrideEmail   ?? (stored.email    as string | undefined) ?? process.env.SHIPROCKET_EMAIL;
    const password = overridePass    ?? (stored.password as string | undefined) ?? process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "No credentials configured" }, { status: 422 });
    }

    try {
      const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
        signal:  AbortSignal.timeout(10_000),
      });

      const data = await res.json().catch(() => ({})) as Record<string, unknown>;

      if (!res.ok || !data.token) {
        return NextResponse.json({
          ok:    false,
          error: (data.message as string | undefined) ?? `HTTP ${res.status}`,
          status: res.status,
        }, { status: 200 }); // 200 so UI can read the body
      }

      return NextResponse.json({ ok: true, email });
    } catch (err) {
      return NextResponse.json({
        ok:    false,
        error: err instanceof Error ? err.message : "Connection failed",
      });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
