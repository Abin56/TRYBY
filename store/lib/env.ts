/**
 * Startup environment validation + masked presence logging.
 *
 * Imported by instrumentation.ts so a misconfigured deploy FAILS FAST at boot
 * (production throws) rather than surfacing as a broken checkout/login later.
 *
 * Security: secret values are NEVER echoed. logEnvPresence() prints only
 * "set ✓ (len N)" for secrets; non-secret values (URLs, public keys, cloud
 * name, from-address) are shown to make misconfiguration obvious in logs.
 */

interface EnvVar {
  key: string;
  required: boolean;
  description: string;
  /** true → value is a secret and must never be printed, even partially. */
  secret?: boolean;
  /** Any alias being present satisfies the requirement (e.g. v4/v5 auth names). */
  aliases?: string[];
}

const ENV_MANIFEST: EnvVar[] = [
  // ── Database ──────────────────────────────────────────────────────────────
  { key: "DATABASE_URL", required: true, secret: true, description: "Neon PostgreSQL connection string (pooled)" },

  // ── Auth (NextAuth v5) — v5 reads AUTH_*; v4 NEXTAUTH_* kept as aliases ─────
  { key: "AUTH_SECRET", required: true, secret: true, aliases: ["NEXTAUTH_SECRET"], description: "NextAuth session signing secret" },
  { key: "AUTH_URL",    required: true,               aliases: ["NEXTAUTH_URL"],    description: "Canonical app URL for auth callbacks" },

  // ── Google OAuth — the only configured sign-in provider, so it is required ──
  { key: "GOOGLE_CLIENT_ID",     required: true, secret: true, description: "Google OAuth client ID" },
  { key: "GOOGLE_CLIENT_SECRET", required: true, secret: true, description: "Google OAuth client secret (rotated + valid)" },

  // ── Payments (Razorpay) ────────────────────────────────────────────────────
  { key: "RAZORPAY_KEY_ID",             required: true, secret: true, description: "Razorpay key ID" },
  { key: "RAZORPAY_KEY_SECRET",         required: true, secret: true, description: "Razorpay key secret" },
  { key: "NEXT_PUBLIC_RAZORPAY_KEY_ID", required: true,              description: "Razorpay key ID (browser checkout)" },
  { key: "RAZORPAY_WEBHOOK_SECRET",     required: true, secret: true, description: "Razorpay webhook HMAC secret" },

  // ── Internal / cron secrets ────────────────────────────────────────────────
  { key: "INTERNAL_API_SECRET", required: true, secret: true, description: "Shared secret guarding /api/internal/*" },
  { key: "CRON_SECRET",         required: true, secret: true, description: "Secret guarding scheduled/cron endpoints" },

  // ── Media (Cloudinary) ─────────────────────────────────────────────────────
  { key: "CLOUDINARY_CLOUD_NAME",             required: true,              description: "Cloudinary cloud name" },
  { key: "CLOUDINARY_API_KEY",                required: true, secret: true, description: "Cloudinary API key" },
  { key: "CLOUDINARY_API_SECRET",             required: true, secret: true, description: "Cloudinary API secret" },
  { key: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", required: true,              description: "Cloudinary cloud name (browser)" },

  // ── Email (Resend) ─────────────────────────────────────────────────────────
  { key: "RESEND_API_KEY",    required: true, secret: true, description: "Resend transactional email API key" },
  { key: "RESEND_FROM_EMAIL", required: true,               description: "Verified From address for emails" },

  // ── App URL ────────────────────────────────────────────────────────────────
  { key: "NEXT_PUBLIC_APP_URL", required: true, description: "Public site URL (https://www.tryby.in in prod)" },

  // ── Admin dashboard CORS ───────────────────────────────────────────────────
  // Optional in dev (defaults to localhost:3001); REQUIRED in prod so the
  // separate admin app's cross-origin /api/admin/* calls aren't blocked.
  { key: "ADMIN_ORIGINS", required: false, description: "Comma-separated admin dashboard origins allowed to call /api/admin/* (CORS)" },

  // ── Monitoring (Sentry) — optional; errors still surface without it ─────────
  { key: "NEXT_PUBLIC_SENTRY_DSN", required: false, description: "Sentry DSN for error monitoring" },
  { key: "SENTRY_ORG",             required: false, description: "Sentry org slug (source-map upload)" },
  { key: "SENTRY_AUTH_TOKEN",      required: false, secret: true, description: "Sentry auth token (source maps)" },
];

const PLACEHOLDER_PATTERNS = ["REPLACE_WITH_", "your-", "your_", "YOUR_", "<", ">", "_here"];

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some(p => value.includes(p));
}

/** Returns the first key/alias that holds a real (non-placeholder) value, if any. */
function resolvePresent(v: EnvVar): string | undefined {
  for (const k of [v.key, ...(v.aliases ?? [])]) {
    const val = process.env[k];
    if (val && !isPlaceholder(val)) return k;
  }
  return undefined;
}

/** Returns true if any key/alias is set at all (even with a placeholder value). */
function resolveAnySet(v: EnvVar): boolean {
  return [v.key, ...(v.aliases ?? [])].some(k => !!process.env[k]);
}

export interface EnvCheckResult {
  ok: boolean;
  missing: string[];
  placeholders: string[];
  warnings: string[];
}

export function checkEnv(): EnvCheckResult {
  const missing: string[] = [];
  const placeholders: string[] = [];
  const warnings: string[] = [];
  const isProd = process.env.NODE_ENV === "production";

  for (const v of ENV_MANIFEST) {
    const present = !!resolvePresent(v);
    const anySet = resolveAnySet(v);

    if (present) continue;

    if (!anySet) {
      if (v.required) missing.push(`${v.key} — ${v.description}`);
      else warnings.push(`${v.key} (optional) — ${v.description}`);
    } else {
      // Set but holds a placeholder value
      if (v.required) placeholders.push(`${v.key} — still has a placeholder value`);
      else warnings.push(`${v.key} (optional) — still has a placeholder value`);
    }
  }

  // Production sanity: no localhost URLs may leak into a production deploy.
  if (isProd) {
    for (const key of ["AUTH_URL", "NEXTAUTH_URL", "NEXT_PUBLIC_APP_URL"]) {
      const val = process.env[key];
      if (val && /localhost|127\.0\.0\.1/i.test(val)) {
        placeholders.push(`${key} — points to localhost in production (${val})`);
      }
    }
  }

  return {
    ok: missing.length === 0 && placeholders.length === 0,
    missing,
    placeholders,
    warnings,
  };
}

/** Mask a value for logging — secrets reveal nothing beyond length. */
function maskSecret(value: string): string {
  return `set ✓ (len ${value.length})`;
}

/**
 * Logs a SAFE, masked presence report for every manifest var at startup.
 * Secrets are never printed; non-secret config values are shown so that a
 * wrong URL / cloud name / from-address is immediately visible in logs.
 */
export function logEnvPresence(): void {
  if (typeof window !== "undefined") return; // server only

  const lines: string[] = ["─── TRYBY env presence (masked) ───"];
  for (const v of ENV_MANIFEST) {
    const foundKey = resolvePresent(v);
    if (!foundKey) {
      lines.push(`  ${v.required ? "✗" : "○"} ${v.key}: ${v.required ? "MISSING" : "missing (optional)"}`);
      continue;
    }
    const raw = process.env[foundKey]!;
    const shown = v.secret ? maskSecret(raw) : raw; // non-secret values are safe to echo
    const via = foundKey !== v.key ? ` [via ${foundKey}]` : "";
    lines.push(`  ✓ ${v.key}: ${shown}${via}`);
  }
  lines.push("───────────────────────────────────");
  console.log(lines.join("\n"));
}

/**
 * Call once at startup. Logs masked presence, then throws in production if any
 * required var is missing / placeholder / localhost. In development it only
 * warns so local work isn't blocked.
 */
export function validateEnvOrThrow(): void {
  if (typeof window !== "undefined") return; // client-side: skip

  logEnvPresence();

  const { ok, missing, placeholders } = checkEnv();
  if (ok) return;

  const lines = [
    "═══════════════════════════════════════════════",
    "  TRYBY — ENV VALIDATION FAILED                 ",
    "═══════════════════════════════════════════════",
    ...missing.map(m => `  ✗ MISSING:     ${m}`),
    ...placeholders.map(p => `  ✗ INVALID:     ${p}`),
    "",
    "  Set these in Vercel → Settings → Environment",
    "  Variables (Production scope), then redeploy.",
    "═══════════════════════════════════════════════",
  ];
  console.error(lines.join("\n"));

  // Fail hard in production; warn-only in development.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `Required env vars missing/invalid: ${[...missing, ...placeholders].map(s => s.split(" — ")[0]).join(", ")}`
    );
  }
}
