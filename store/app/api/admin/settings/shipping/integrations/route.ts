/**
 * Shipping Integrations API
 * Stores courier API credentials in SiteSettings (key: "shipping_integration_{PROVIDER}").
 * No migration needed — uses the existing SiteSettings JSON column.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { logAudit, getAdminProfileId } from "@/lib/audit";
import { invalidateShiprocketToken } from "@/lib/shipping/shiprocket";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// ── Provider metadata (static) ────────────────────────────────────────────────

const PROVIDERS = [
  {
    id:          "SHIPROCKET",
    name:        "Shiprocket",
    authType:    "email_password" as const,
    description: "India's largest shipping aggregator — Bluedart, Delhivery, Ecom Express & 20+ couriers",
    docsUrl:     "https://apidocs.shiprocket.in",
    logoColor:   "#FF5722",
  },
  {
    id:          "DELHIVERY",
    name:        "Delhivery",
    authType:    "api_key" as const,
    description: "Direct Delhivery integration for high-volume fulfillment",
    docsUrl:     "https://api.delhivery.com",
    logoColor:   "#E31837",
  },
  {
    id:          "NIMBUSPOST",
    name:        "NimbusPost",
    authType:    "api_key" as const,
    description: "Multi-carrier shipping with competitive rates across India",
    docsUrl:     "https://nimbuspost.com/api-doc",
    logoColor:   "#7B2FBE",
  },
] as const;

type ProviderId = typeof PROVIDERS[number]["id"];

// ── DB key helpers ────────────────────────────────────────────────────────────

function settingsKey(provider: string) { return `shipping_integration_${provider.toLowerCase()}`; }

interface StoredIntegration {
  enabled:         boolean;
  testMode:        boolean;
  email?:          string;
  hasPassword:     boolean;       // never store plain password here — stored under separate key
  hasApiKey:       boolean;
  hasApiSecret:    boolean;
  hasWebhookSecret: boolean;
  displayName?:    string;
  notes?:          string;
  lastTestedAt?:   string;
  lastTestStatus?: string;
  lastTestResult?: string;
  updatedAt?:      string;
}

// Secrets are stored under a separate key to avoid exposing them in list queries
function secretsKey(provider: string) { return `shipping_integration_${provider.toLowerCase()}_secrets`; }

// ── GET — list all integrations ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Load all integration settings + Shiprocket legacy credentials key
  const keys = [
    ...PROVIDERS.flatMap(p => [settingsKey(p.id), secretsKey(p.id)]),
    "shiprocket_credentials",
  ];
  const rows  = await prisma.siteSettings.findMany({ where: { key: { in: keys } } });

  const rowMap = new Map(rows.map(r => [r.key, r.extraData as Record<string, unknown>]));

  // Shiprocket env var fallback detection
  const srEnvEmail    = process.env.SHIPROCKET_EMAIL    && !process.env.SHIPROCKET_EMAIL.startsWith("REPLACE");
  const srEnvPassword = process.env.SHIPROCKET_PASSWORD && !process.env.SHIPROCKET_PASSWORD.startsWith("REPLACE");

  const integrations = PROVIDERS.map(p => {
    const cfg        = (rowMap.get(settingsKey(p.id)) ?? {}) as Partial<StoredIntegration>;
    const secrets    = rowMap.get(secretsKey(p.id)) ?? {};
    const srLegacy   = p.id === "SHIPROCKET" ? (rowMap.get("shiprocket_credentials") ?? {}) : {};

    // Email/password: check secrets key first, then legacy shiprocket_credentials, then env var
    const hasEmail    = !!(secrets as Record<string, unknown>).email
      || !!(srLegacy as Record<string, unknown>).email
      || (p.id === "SHIPROCKET" && !!srEnvEmail);
    const hasPassword = !!(secrets as Record<string, unknown>).password
      || !!(srLegacy as Record<string, unknown>).password
      || (p.id === "SHIPROCKET" && !!srEnvPassword);

    return {
      provider:         p.id,
      name:             p.name,
      authType:         p.authType,
      description:      p.description,
      docsUrl:          p.docsUrl,
      logoColor:        p.logoColor,
      enabled:          cfg.enabled          ?? false,
      testMode:         cfg.testMode         ?? true,
      hasEmail,
      hasPassword,
      hasApiKey:        !!(secrets as Record<string, unknown>).apiKey,
      hasApiSecret:     !!(secrets as Record<string, unknown>).apiSecret,
      hasWebhookSecret: !!(secrets as Record<string, unknown>).webhookSecret
        || !!(srLegacy as Record<string, unknown>).webhookSecret
        || (p.id === "SHIPROCKET" && !!process.env.SHIPROCKET_WEBHOOK_SECRET),
      displayName:      cfg.displayName      ?? null,
      notes:            cfg.notes            ?? null,
      lastTestedAt:     cfg.lastTestedAt     ?? null,
      lastTestStatus:   cfg.lastTestStatus   ?? null,
      lastTestResult:   cfg.lastTestResult   ?? null,
      updatedAt:        cfg.updatedAt        ?? null,
    };
  });

  return NextResponse.json({ integrations, providers: PROVIDERS });
}

// ── PUT — upsert credentials/settings ────────────────────────────────────────

const updateSchema = z.object({
  provider:      z.string().min(1),
  enabled:       z.boolean().optional(),
  testMode:      z.boolean().optional(),
  email:         z.string().email().optional().or(z.literal("")),
  password:      z.string().optional(),
  apiKey:        z.string().optional(),
  apiSecret:     z.string().optional(),
  webhookSecret: z.string().optional(),
  displayName:   z.string().max(60).optional(),
  notes:         z.string().max(500).optional(),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = updateSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { provider, password, apiKey, apiSecret, webhookSecret, ...publicFields } = body.data;
  const cfgKey     = settingsKey(provider);
  const secrKey    = secretsKey(provider);

  // Load existing
  const existing = await prisma.siteSettings.findUnique({ where: { key: cfgKey } });
  const existingSecrets = await prisma.siteSettings.findUnique({ where: { key: secrKey } });
  const prev   = (existing?.extraData ?? {})       as Record<string, unknown>;
  const prevSec = (existingSecrets?.extraData ?? {}) as Record<string, unknown>;

  // Merge public config
  const newCfg: Record<string, unknown> = {
    ...prev,
    updatedAt: new Date().toISOString(),
  };
  if (publicFields.enabled   !== undefined) newCfg.enabled     = publicFields.enabled;
  if (publicFields.testMode  !== undefined) newCfg.testMode    = publicFields.testMode;
  if (publicFields.email     !== undefined) newCfg.email       = publicFields.email  || null;
  if (publicFields.displayName !== undefined) newCfg.displayName = publicFields.displayName || null;
  if (publicFields.notes     !== undefined) newCfg.notes       = publicFields.notes  || null;

  // Merge secrets (never overwrite with empty string)
  const newSecrets: Record<string, unknown> = { ...prevSec };
  if (password      !== undefined) newSecrets.password      = password      || null;
  if (apiKey        !== undefined) newSecrets.apiKey        = apiKey        || null;
  if (apiSecret     !== undefined) newSecrets.apiSecret     = apiSecret     || null;
  if (webhookSecret !== undefined) newSecrets.webhookSecret = webhookSecret || null;

  // Mirror credentials into "shiprocket_credentials" so the ShiprocketProvider picks them up
  // (provider reads from that key for email + password)
  if (provider === "SHIPROCKET") {
    const srRow = await prisma.siteSettings.findUnique({ where: { key: "shiprocket_credentials" } });
    const srCfg = (srRow?.extraData ?? {}) as Record<string, unknown>;
    const srUpdate: Record<string, unknown> = { ...srCfg };
    if (publicFields.email !== undefined)  srUpdate.email         = publicFields.email || null;
    if (password           !== undefined)  srUpdate.password      = password           || null;
    if (webhookSecret      !== undefined)  srUpdate.webhookSecret = webhookSecret      || null;
    await prisma.siteSettings.upsert({
      where:  { key: "shiprocket_credentials" },
      create: { key: "shiprocket_credentials", extraData: srUpdate as never },
      update: { extraData: srUpdate as never },
    });
    // Force re-authentication on the next API call
    invalidateShiprocketToken();
  }

  await Promise.all([
    prisma.siteSettings.upsert({
      where:  { key: cfgKey },
      create: { key: cfgKey, extraData: newCfg as never },
      update: { extraData: newCfg as never },
    }),
    prisma.siteSettings.upsert({
      where:  { key: secrKey },
      create: { key: secrKey, extraData: newSecrets as never },
      update: { extraData: newSecrets as never },
    }),
  ]);

  // Audit
  const adminId = await getAdminProfileId(session.user.id);
  if (adminId) {
    logAudit({
      adminId,
      action:       "SETTINGS_UPDATED",
      resourceType: "shipping_integration",
      resourceId:   cfgKey,
      resourceName: provider,
      newValue:     { enabled: newCfg.enabled, testMode: newCfg.testMode, provider },
      req,
    });
  }

  return NextResponse.json({
    provider,
    enabled:          newCfg.enabled          ?? false,
    testMode:         newCfg.testMode         ?? true,
    hasEmail:         !!newCfg.email,
    hasPassword:      !!newSecrets.password,
    hasApiKey:        !!newSecrets.apiKey,
    hasApiSecret:     !!newSecrets.apiSecret,
    hasWebhookSecret: !!newSecrets.webhookSecret,
    displayName:      newCfg.displayName      ?? null,
    notes:            newCfg.notes            ?? null,
    updatedAt:        newCfg.updatedAt,
  });
}

// ── POST — connection test ────────────────────────────────────────────────────

const testSchema = z.object({
  provider: z.string().min(1),
  email:    z.string().optional(),
  password: z.string().optional(),
  apiKey:   z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = testSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { provider, email: overrideEmail, password: overridePassword } = body.data;

  let result: { ok: boolean; error?: string; accountName?: string };

  if (provider === "SHIPROCKET") {
    let email    = overrideEmail;
    let password = overridePassword;

    if (!email || !password) {
      const secrRow = await prisma.siteSettings.findUnique({ where: { key: secretsKey("SHIPROCKET") } });
      const cfgRow  = await prisma.siteSettings.findUnique({ where: { key: settingsKey("SHIPROCKET") } });
      const sec  = (secrRow?.extraData ?? {}) as Record<string, unknown>;
      const cfg  = (cfgRow?.extraData  ?? {}) as Record<string, unknown>;

      email    = email    ?? cfg.email    as string | undefined
                          ?? process.env.SHIPROCKET_EMAIL    ?? "";
      password = password ?? sec.password as string | undefined
                          ?? process.env.SHIPROCKET_PASSWORD ?? "";
    }

    if (!email || !password) {
      result = { ok: false, error: "No credentials configured for Shiprocket" };
    } else {
      // Inline auth test — avoids needing a testConnection() method on the provider
      try {
        const res  = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email, password }),
          signal:  AbortSignal.timeout(10_000),
        });
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        result = res.ok && data.token
          ? { ok: true }
          : { ok: false, error: (data.message as string | undefined) ?? `HTTP ${res.status}` };
      } catch (err) {
        result = { ok: false, error: err instanceof Error ? err.message : "Connection failed" };
      }
    }
  } else {
    result = { ok: false, error: `Connection test for ${provider} is not yet implemented` };
  }

  // Persist test result into the public config
  const cfgKey  = settingsKey(provider);
  const cfgRow  = await prisma.siteSettings.findUnique({ where: { key: cfgKey } });
  const cfgData = (cfgRow?.extraData ?? {}) as Record<string, unknown>;

  await prisma.siteSettings.upsert({
    where:  { key: cfgKey },
    create: {
      key:       cfgKey,
      extraData: {
        ...cfgData,
        lastTestedAt:   new Date().toISOString(),
        lastTestStatus: result.ok ? "success" : "error",
        lastTestResult: result.ok ? (result.accountName ?? "Connected successfully") : (result.error ?? "Failed"),
      },
    },
    update: {
      extraData: {
        ...cfgData,
        lastTestedAt:   new Date().toISOString(),
        lastTestStatus: result.ok ? "success" : "error",
        lastTestResult: result.ok ? (result.accountName ?? "Connected successfully") : (result.error ?? "Failed"),
      },
    },
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
