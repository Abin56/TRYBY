"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

const PROTECTED_PREFIXES = ["/account", "/checkout", "/orders"];

/**
 * Mounts in the root layout.
 * On tab focus (visibilitychange) it re-checks the session via a lightweight
 * fetch to /api/auth/session. If the session has been destroyed in another tab
 * it signs the user out locally and redirects away from protected pages.
 */
export function SessionSync() {
  const { status } = useSession();
  const pathname   = usePathname();
  const router     = useRouter();

  useEffect(() => {
    async function check() {
      if (document.hidden) return;

      try {
        const res     = await fetch("/api/auth/session");
        const session = await res.json();

        // Session gone — sign out locally and redirect if on a protected page.
        if (!session?.user) {
          await signOut({ redirect: false });
          const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
          if (isProtected) {
            router.replace(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);
          }
        }
      } catch {
        // Network unavailable — don't sign out speculatively.
      }
    }

    document.addEventListener("visibilitychange", check);
    return () => document.removeEventListener("visibilitychange", check);
  }, [pathname, router]);

  // Immediate redirect if useSession() detects an unauthenticated state on a protected route.
  useEffect(() => {
    if (status === "unauthenticated") {
      const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
      if (isProtected) {
        router.replace(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);
      }
    }
  }, [status, pathname, router]);

  return null;
}
