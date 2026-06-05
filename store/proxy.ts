import NextAuth from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// Edge-safe auth — no Prisma, no bcrypt.
const { auth } = NextAuth(authConfig);

// ── Maintenance mode check ─────────────────────────────────────────────────
// Fetch cached status from our own API endpoint (60s ISR cache).

let maintenanceCache: { enabled: boolean; allowedIps: string[]; title: string; message: string; fetchedAt: number } | null = null;
const MAINTENANCE_TTL_MS = 60_000;

async function getMaintenanceStatus(baseUrl: string): Promise<{ enabled: boolean; allowedIps: string[]; title: string; message: string }> {
  const now = Date.now();
  if (maintenanceCache && now - maintenanceCache.fetchedAt < MAINTENANCE_TTL_MS) {
    return maintenanceCache;
  }
  try {
    const res = await fetch(`${baseUrl}/api/status/maintenance`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const data = await res.json();
      maintenanceCache = { ...data, fetchedAt: now };
      return data;
    }
  } catch {
    // Network error during maintenance check — assume not in maintenance
  }
  return { enabled: false, allowedIps: [], title: "", message: "" };
}

// ── Maintenance page ──────────────────────────────────────────────────────

function maintenanceResponse(title: string, message: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — TRYBY</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0D0D0D;color:#fff;font-family:system-ui,sans-serif;
         min-height:100vh;display:flex;align-items:center;justify-content:center;
         text-align:center;padding:24px}
    .logo{font-size:32px;font-weight:900;letter-spacing:-0.02em;margin-bottom:32px}
    .logo span{color:#F5C518}
    h1{font-size:clamp(22px,4vw,32px);font-weight:800;margin-bottom:12px}
    p{color:rgba(255,255,255,0.5);font-size:15px;max-width:380px;line-height:1.6;margin:0 auto}
    .badge{display:inline-block;background:rgba(245,197,24,0.12);border:1px solid rgba(245,197,24,0.25);
           color:#F5C518;font-size:12px;font-weight:700;padding:6px 16px;border-radius:99px;margin-top:24px;
           letter-spacing:0.06em}
  </style>
</head>
<body>
  <div>
    <div class="logo">TRY<span>BY</span></div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="badge">SCHEDULED MAINTENANCE</div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 503,
    headers: {
      "Content-Type":  "text/html",
      "Retry-After":   "300",
      "Cache-Control": "no-store",
    },
  });
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// ── Proxy handler ──────────────────────────────────────────────────────────

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Skip maintenance check for admin routes and the status API itself
  const isAdminRoute  = pathname.startsWith("/admin");
  const isStatusRoute = pathname.startsWith("/api/status/");
  const isAuthRoute   = pathname.startsWith("/api/auth") || pathname.startsWith("/auth");

  if (!isAdminRoute && !isStatusRoute && !isAuthRoute) {
    const base = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const maintenance = await getMaintenanceStatus(base);

    if (maintenance.enabled) {
      const ip = getClientIp(req);
      const isAllowed = maintenance.allowedIps.some(
        allowed => allowed.trim() === ip || allowed.trim() === "*"
      );
      if (!isAllowed) {
        return maintenanceResponse(maintenance.title, maintenance.message);
      }
    }
  }

  // ── Auth guards ────────────────────────────────────────────────────────

  // Redirect already-authenticated users away from login/register pages
  if (pathname.startsWith("/auth") && session) {
    const role = session.user?.role;
    if (role === "ADMIN")    return NextResponse.redirect(new URL("/admin", req.url));
    if (role === "SUPPLIER") return NextResponse.redirect(new URL("/supplier/dashboard", req.url));
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/account") && !session) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // SuperAdmin-only pages
    const superAdminRoutes = ["/admin/super", "/admin/team", "/admin/sessions", "/admin/audit"];
    if (superAdminRoutes.some(r => pathname.startsWith(r))) {
      const adminRole = (session.user as { adminRole?: string })?.adminRole;
      if (adminRole !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin?error=forbidden", req.url));
      }
    }
  }

  if (pathname.startsWith("/supplier") && pathname !== "/supplier/apply") {
    if (!session) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.user?.role !== "SUPPLIER") return NextResponse.redirect(new URL("/", req.url));
  }

  if ((pathname.startsWith("/checkout") || pathname.startsWith("/orders")) && !session) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Protect auth-gated routes
    "/auth/:path*",
    "/account/:path*",
    "/admin/:path*",
    "/supplier/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    // Run maintenance check on all public store pages
    "/",
    "/products/:path*",
    "/cart",
    "/splash",
    "/faq",
    "/about",
    "/contact",
  ],
};
