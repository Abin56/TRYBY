import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname   = nextUrl.pathname;
  // auth is attached to the request by the NextAuth wrapper
  const session    = (req as NextRequest & { auth?: { user?: { role?: string } } | null }).auth;
  const role       = session?.user?.role;
  const isLoggedIn = !!session;

  const isAdminRoute    = pathname.startsWith("/admin");
  const isSupplierRoute = pathname.startsWith("/supplier")
    && pathname !== "/supplier/login"
    && pathname !== "/supplier/apply";
  const isAuthRoute     = pathname.startsWith("/auth");

  // ── Admin routes ────────────────────────────────────────────────────────────
  if (isAdminRoute) {
    if (!isLoggedIn) {
      const url = new URL("/auth/login", nextUrl.origin);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (role !== "ADMIN") return NextResponse.redirect(new URL("/", nextUrl.origin));
    return NextResponse.next();
  }

  // ── Supplier routes ─────────────────────────────────────────────────────────
  if (isSupplierRoute) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/supplier/login", nextUrl.origin));
    if (role !== "SUPPLIER") return NextResponse.redirect(new URL("/", nextUrl.origin));
    return NextResponse.next();
  }

  // ── Auth routes — redirect already-logged-in users away ────────────────────
  if (isAuthRoute && isLoggedIn) {
    if (role === "ADMIN")    return NextResponse.redirect(new URL("/admin", nextUrl.origin));
    if (role === "SUPPLIER") return NextResponse.redirect(new URL("/supplier/dashboard", nextUrl.origin));
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/supplier/:path*",
    "/auth/:path*",
  ],
};
