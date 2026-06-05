import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// Post-Google-OAuth landing page.
// By routing through this server component, we guarantee the session cookie is
// fully committed before the browser navigates to the final destination.
// This prevents RSC fetch races where the next page starts loading before the
// cookie is stored (which breaks auth-gated layouts).
export default async function GoogleRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { next } = await searchParams;
  const role = session.user.role;

  // Role-based routing — admins and suppliers go to their dashboards
  // regardless of what `next` says (prevents privilege escalation via URL).
  if (role === "ADMIN")    redirect("/admin");
  if (role === "SUPPLIER") redirect("/supplier/dashboard");

  // Customer — honour the intended destination if it's safe
  if (next && next !== "/" && !next.startsWith("/admin") && !next.startsWith("/supplier")) {
    redirect(next);
  }

  redirect("/");
}
