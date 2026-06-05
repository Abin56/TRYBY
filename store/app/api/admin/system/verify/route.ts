/**
 * /api/admin/system/verify — Live service verification endpoint.
 *
 * POST { service: "database" | "cloudinary" | "razorpay" | "resend" | "google_oauth" | "all" }
 * Returns per-service test results with latency, status, and actionable messages.
 * Uses REAL credentials — no mocks.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { uploadFile, isConfigured as isCloudinaryConfigured } from "@/lib/cloudinary";
import { isEmailConfigured } from "@/lib/email";
import crypto from "crypto";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// ── Service test functions ─────────────────────────────────────────────────

async function testDatabase(): Promise<ServiceResult> {
  const t = Date.now();
  const configured = !!(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("REPLACE"));
  if (!configured) return { service: "database", ok: false, configured: false, latencyMs: 0, message: "DATABASE_URL not set", action: "Add DATABASE_URL to .env.local" };

  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - t;

    // Count a few records to prove real connectivity
    const [users, products] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
    ]);

    return {
      service: "database", ok: true, configured: true, latencyMs,
      message: `Connected — ${users} users, ${products} products`,
      detail: { users, products },
    };
  } catch (e) {
    return { service: "database", ok: false, configured, latencyMs: Date.now() - t,
      message: (e as Error).message, action: "Check DATABASE_URL and Neon DB status" };
  }
}

async function testCloudinary(): Promise<ServiceResult> {
  const t = Date.now();
  const configured = isCloudinaryConfigured();
  if (!configured) return { service: "cloudinary", ok: false, configured: false, latencyMs: 0,
    message: "CLOUDINARY_* vars not set", action: "Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env.local" };

  try {
    const CLOUD  = process.env.CLOUDINARY_CLOUD_NAME!;
    const KEY    = process.env.CLOUDINARY_API_KEY!;
    const SECRET = process.env.CLOUDINARY_API_SECRET!;

    // Test 1: API connectivity via usage endpoint
    const creds = Buffer.from(`${KEY}:${SECRET}`).toString("base64");
    const usageRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD}/usage`,
      { headers: { Authorization: `Basic ${creds}` }, signal: AbortSignal.timeout(5000) }
    );

    if (!usageRes.ok) {
      return { service: "cloudinary", ok: false, configured, latencyMs: Date.now() - t,
        message: `API error ${usageRes.status}: ${await usageRes.text()}`,
        action: "Verify CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are correct" };
    }

    const usage = await usageRes.json();

    // Test 2: Actual signed upload with a 1×1 pixel PNG
    const pixel1x1 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    const testFile = new File([pixel1x1], "verify-test.png", { type: "image/png" });

    const uploadResult = await uploadFile(testFile, {
      folder:    "tryby/__verify",
      publicId:  `verify-${Date.now()}`,
      overwrite: true,
    });

    // Clean up test asset
    const timestamp = Math.floor(Date.now() / 1000);
    const sig = crypto.createHash("sha256")
      .update(`public_id=${uploadResult.publicId}&timestamp=${timestamp}${SECRET}`)
      .digest("hex");
    fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/destroy`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id: uploadResult.publicId, signature: sig, api_key: KEY, timestamp }),
    }).catch(() => null);

    return {
      service: "cloudinary", ok: true, configured, latencyMs: Date.now() - t,
      message: `Upload ✓ · ${(usage.storage?.usage / 1024 / 1024).toFixed(1)} MB used`,
      detail: {
        plan:      usage.plan,
        storage:   usage.storage,
        bandwidth: usage.bandwidth,
        testUrl:   uploadResult.secureUrl,
      },
    };
  } catch (e) {
    return { service: "cloudinary", ok: false, configured, latencyMs: Date.now() - t,
      message: (e as Error).message, action: "Check Cloudinary credentials and account status" };
  }
}

async function testRazorpay(): Promise<ServiceResult> {
  const t = Date.now();
  const keyId  = process.env.RAZORPAY_KEY_ID ?? "";
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  const configured = !!(keyId && secret && !keyId.includes("REPLACE") && !secret.includes("REPLACE"));
  const mode = keyId.startsWith("rzp_live_") ? "live" : keyId.startsWith("rzp_test_") ? "test" : "unknown";
  const webhookConfigured = !!(webhookSecret && !webhookSecret.includes("REPLACE"));

  if (!configured) return { service: "razorpay", ok: false, configured: false, latencyMs: 0,
    message: "RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set",
    action: "Get API keys from dashboard.razorpay.com → Settings → API Keys" };

  try {
    const creds = Buffer.from(`${keyId}:${secret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/payments?count=1", {
      headers: { Authorization: `Basic ${creds}` },
      signal:  AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      const body = await res.text();
      return { service: "razorpay", ok: false, configured, latencyMs: Date.now() - t,
        message: `API error ${res.status}: ${body}`,
        action: "Verify Razorpay key ID and secret — use test keys for non-production" };
    }

    return {
      service: "razorpay", ok: true, configured, latencyMs: Date.now() - t,
      message: `Connected · ${mode} mode${!webhookConfigured ? " · ⚠ webhook secret not set" : " · webhook ✓"}`,
      detail: { mode, webhookConfigured },
    };
  } catch (e) {
    return { service: "razorpay", ok: false, configured, latencyMs: Date.now() - t,
      message: (e as Error).message };
  }
}

async function testResend(): Promise<ServiceResult> {
  const t = Date.now();
  const key  = process.env.RESEND_API_KEY ?? "";
  const from = process.env.RESEND_FROM_EMAIL ?? "";
  const configured = isEmailConfigured();

  if (!configured) return { service: "resend", ok: false, configured: false, latencyMs: 0,
    message: "RESEND_API_KEY not set", action: "Get API key from resend.com → API Keys" };

  try {
    // Check account domains
    const domainsRes = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
      signal:  AbortSignal.timeout(5000),
    });

    if (!domainsRes.ok) {
      return { service: "resend", ok: false, configured, latencyMs: Date.now() - t,
        message: `API error ${domainsRes.status}`, action: "Verify RESEND_API_KEY is valid" };
    }

    const domains = await domainsRes.json();
    const domainList: string[] = (domains.data ?? []).map((d: { name: string; status: string }) => `${d.name} (${d.status})`);

    return {
      service: "resend", ok: true, configured, latencyMs: Date.now() - t,
      message: `Connected · from: ${from || "not set"} · ${domainList.length} domain(s)`,
      detail: { from, domains: domainList },
    };
  } catch (e) {
    return { service: "resend", ok: false, configured, latencyMs: Date.now() - t,
      message: (e as Error).message };
  }
}

function testGoogleOAuth(): ServiceResult {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  const configured = !!(clientId && clientSecret && !clientId.includes("REPLACE") && !clientSecret.includes("REPLACE"));

  if (!configured) return {
    service: "google_oauth", ok: false, configured: false, latencyMs: 0,
    message: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set",
    action: "Create OAuth credentials at console.cloud.google.com → APIs → Credentials → OAuth 2.0",
  };

  // Can't make a live test call without a user — validate format instead
  const isValidClientId = clientId.endsWith(".apps.googleusercontent.com");
  if (!isValidClientId) {
    return { service: "google_oauth", ok: false, configured, latencyMs: 0,
      message: "GOOGLE_CLIENT_ID format looks wrong — should end with .apps.googleusercontent.com",
      action: "Copy the exact Client ID from Google Cloud Console" };
  }

  return {
    service: "google_oauth", ok: true, configured, latencyMs: 0,
    message: "Credentials set · format valid",
    detail: { clientIdSuffix: clientId.slice(-30) },
  };
}

// ── Result type ─────────────────────────────────────────────────────────────

interface ServiceResult {
  service:    string;
  ok:         boolean;
  configured: boolean;
  latencyMs:  number;
  message:    string;
  action?:    string;
  detail?:    unknown;
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { service = "all" } = await req.json().catch(() => ({ service: "all" }));
  const startAll = Date.now();

  const run = async (name: string, fn: () => Promise<ServiceResult> | ServiceResult) => {
    try {
      return await fn();
    } catch (e) {
      return { service: name, ok: false, configured: false, latencyMs: 0,
        message: (e as Error).message, action: "Unexpected error — check server logs" } as ServiceResult;
    }
  };

  let results: ServiceResult[];

  if (service === "all") {
    results = await Promise.all([
      run("database",    testDatabase),
      run("cloudinary",  testCloudinary),
      run("razorpay",    testRazorpay),
      run("resend",      testResend),
      Promise.resolve(run("google_oauth", testGoogleOAuth)),
    ]);
  } else {
    const map: Record<string, () => Promise<ServiceResult> | ServiceResult> = {
      database:    testDatabase,
      cloudinary:  testCloudinary,
      razorpay:    testRazorpay,
      resend:      testResend,
      google_oauth: testGoogleOAuth,
    };
    if (!map[service]) return NextResponse.json({ error: "Unknown service" }, { status: 400 });
    results = [await run(service, map[service])];
  }

  const passing = results.filter(r => r.ok).length;
  const total   = results.length;
  const score   = Math.round((passing / total) * 100);

  return NextResponse.json({
    ok:          passing === total,
    score,
    passing,
    total,
    totalMs:     Date.now() - startAll,
    testedAt:    new Date().toISOString(),
    results,
  });
}
