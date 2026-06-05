/**
 * Startup environment validation.
 * Import this at the top of any server entry-point (layout, instrumentation, etc.)
 * to surface missing env vars immediately rather than at the call site.
 */

interface EnvVar {
  key: string;
  required: boolean;
  description: string;
}

const ENV_MANIFEST: EnvVar[] = [
  // Core
  { key: "DATABASE_URL",                     required: true,  description: "Neon PostgreSQL connection string" },
  { key: "NEXTAUTH_SECRET",                  required: true,  description: "NextAuth.js signing secret" },
  { key: "NEXTAUTH_URL",                     required: true,  description: "Application base URL" },
  // Cloudinary
  { key: "CLOUDINARY_CLOUD_NAME",            required: true,  description: "Cloudinary cloud name" },
  { key: "CLOUDINARY_API_KEY",               required: true,  description: "Cloudinary API key" },
  { key: "CLOUDINARY_API_SECRET",            required: true,  description: "Cloudinary API secret" },
  { key: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",required: true,  description: "Cloudinary cloud name (public)" },
  // Razorpay
  { key: "RAZORPAY_KEY_ID",                  required: true,  description: "Razorpay key ID" },
  { key: "RAZORPAY_KEY_SECRET",              required: true,  description: "Razorpay key secret" },
  { key: "NEXT_PUBLIC_RAZORPAY_KEY_ID",      required: true,  description: "Razorpay key ID (public)" },
  { key: "RAZORPAY_WEBHOOK_SECRET",          required: true,  description: "Razorpay webhook HMAC secret" },
  // Email
  { key: "RESEND_API_KEY",                   required: true,  description: "Resend transactional email API key" },
  { key: "RESEND_FROM_EMAIL",                required: true,  description: "From address for transactional emails" },
  // OAuth (optional — login works without, but social auth disabled)
  { key: "GOOGLE_CLIENT_ID",                 required: false, description: "Google OAuth client ID" },
  { key: "GOOGLE_CLIENT_SECRET",             required: false, description: "Google OAuth client secret" },
  // Sentry (optional — errors still surface without it)
  { key: "NEXT_PUBLIC_SENTRY_DSN",           required: false, description: "Sentry DSN for error monitoring" },
  { key: "SENTRY_AUTH_TOKEN",                required: false, description: "Sentry auth token for source maps" },
];

const PLACEHOLDER_PATTERNS = ["REPLACE_WITH_", "your-", "YOUR_", "<", ">"];

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some(p => value.includes(p));
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

  for (const { key, required, description } of ENV_MANIFEST) {
    const val = process.env[key];
    if (!val) {
      if (required) missing.push(`${key} — ${description}`);
      else warnings.push(`${key} (optional) — ${description}`);
    } else if (isPlaceholder(val)) {
      if (required) placeholders.push(`${key} — still has placeholder value`);
      else warnings.push(`${key} (optional) — still has placeholder value`);
    }
  }

  return {
    ok: missing.length === 0 && placeholders.length === 0,
    missing,
    placeholders,
    warnings,
  };
}

/**
 * Call once at startup — throws with a clear message if required vars are missing.
 * Safe to call server-side only.
 */
export function validateEnvOrThrow(): void {
  if (typeof window !== "undefined") return; // client-side: skip
  const { ok, missing, placeholders } = checkEnv();
  if (!ok) {
    const lines = [
      "═══════════════════════════════════════════",
      "  TRYBY — MISSING REQUIRED ENV VARIABLES   ",
      "═══════════════════════════════════════════",
      ...missing.map(m => `  ✗ MISSING:     ${m}`),
      ...placeholders.map(p => `  ✗ PLACEHOLDER: ${p}`),
      "",
      "  Edit .env.local and restart the server.",
      "═══════════════════════════════════════════",
    ];
    console.error(lines.join("\n"));
    // In production throw hard; in dev just warn so local work isn't blocked
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required env vars: ${[...missing, ...placeholders].join(", ")}`);
    }
  }
}
