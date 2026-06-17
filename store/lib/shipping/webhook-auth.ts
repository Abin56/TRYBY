import crypto from "crypto";

/**
 * Courier webhook authentication — FAIL CLOSED.
 *
 * Security model (set after external QA found these endpoints accepted forged,
 * unsigned requests in production):
 *
 *   - A webhook is processed ONLY when a secret is configured AND the request
 *     carries a valid signature/token for that secret.
 *   - A MISSING / placeholder secret is a server misconfiguration → callers map
 *     this to HTTP 500 (never silently accept).  Use `isXConfigured()`.
 *   - A present-but-invalid (or absent) signature/token → callers map to HTTP 401.
 *   - These functions NEVER return `true` for a missing secret, in ANY
 *     environment (no NODE_ENV escape hatch). Local testing must set a secret.
 *
 * All comparisons are constant-time to avoid leaking the secret via timing.
 */

/** A Delhivery token of this form is a placeholder, not a real secret. */
function isPlaceholder(secret: string): boolean {
  return secret.startsWith("REPLACE");
}

/** Constant-time string compare. Returns false on length mismatch (the length
 *  check is itself safe to short-circuit — it does not leak secret bytes). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  try {
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

// ── Shiprocket (HMAC-SHA256 over the raw body) ──────────────────────────────

/** True only when a real signing secret is configured. */
export function isShiprocketSecretConfigured(secret: string | null | undefined): boolean {
  return typeof secret === "string" && secret.length > 0;
}

/**
 * Verify a Shiprocket webhook HMAC signature.
 * Returns false for: no secret, no signature, length mismatch, or bad digest.
 * NEVER returns true without a valid signature.
 */
export function verifyShiprocketSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string | null | undefined
): boolean {
  if (!isShiprocketSecretConfigured(secret)) return false; // fail closed
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", secret as string)
    .update(rawBody)
    .digest("hex");
  return safeEqual(expected, signature);
}

// ── Delhivery (shared token in header) ──────────────────────────────────────

/** True only when a real (non-placeholder) token is configured. */
export function isDelhiveryTokenConfigured(secret: string | null | undefined): boolean {
  return typeof secret === "string" && secret.length > 0 && !isPlaceholder(secret);
}

/**
 * Verify a Delhivery webhook shared token (constant-time).
 * Returns false for: no/placeholder secret, no token, or mismatch.
 * NEVER returns true without a matching token.
 */
export function verifyDelhiveryToken(
  token: string | null | undefined,
  secret: string | null | undefined
): boolean {
  if (!isDelhiveryTokenConfigured(secret)) return false; // fail closed
  if (!token) return false;
  return safeEqual(token, secret as string);
}
