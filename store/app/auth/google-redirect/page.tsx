import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// Handles post-Google-OAuth role-based routing.
// NextAuth redirects here after a successful Google sign-in when no specific
// callbackUrl was provided. We read the session role and send the user to the
// correct dashboard — same logic as the credentials login page.
export default async function GoogleRedirectPage() {
  const session = await auth();

  if (!session?.user) redirect("/auth/login");

  switch (session.user.role) {
    case "ADMIN":    redirect("/admin");
    case "SUPPLIER": redirect("/supplier/dashboard");
    default:         redirect("/");
  }
}
