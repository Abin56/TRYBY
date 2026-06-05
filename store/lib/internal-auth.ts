import { NextRequest, NextResponse } from "next/server";

/**
 * Returns a 403 response if the caller is not trusted.
 * Returns null if the request is allowed to proceed.
 *
 * In production (NODE_ENV=production), INTERNAL_API_SECRET MUST be set.
 * If it is missing, the request is rejected with 500 to surface the misconfiguration.
 */
export function guardInternalRoute(req: NextRequest): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET;
  const isProd = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProd) {
      // Fail hard in production — missing secret is a deployment error
      console.error("[SECURITY] INTERNAL_API_SECRET is not set in production. Blocking request.");
      return NextResponse.json(
        { error: "Internal route misconfigured — contact admin" },
        { status: 500 }
      );
    }
    // In development, allow without secret (dev convenience)
    return null;
  }

  const provided = req.headers.get("x-internal-secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
