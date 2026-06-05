"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, Globe2 } from "lucide-react";

// Determine where to send the user after login based on their role.
function roleDestination(role: string, callbackUrl: string): string {
  // If there's an explicit callbackUrl that isn't just "/" respect it —
  // unless it's an admin/supplier path for the wrong role (safety).
  const hasCallback = callbackUrl && callbackUrl !== "/";

  if (role === "ADMIN") {
    if (hasCallback && callbackUrl.startsWith("/admin")) return callbackUrl;
    return "/admin";
  }
  if (role === "SUPPLIER") {
    if (hasCallback && callbackUrl.startsWith("/supplier")) return callbackUrl;
    return "/supplier/dashboard";
  }
  // CUSTOMER
  if (hasCallback && !callbackUrl.startsWith("/admin") && !callbackUrl.startsWith("/supplier")) {
    return callbackUrl;
  }
  return "/";
}

function LoginForm() {
  const params      = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const urlError    = params.get("error");

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]       = useState(
    urlError === "OAuthAccountNotLinked" ? "Email already used with a different sign-in method." : ""
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) { setError("Enter email and password"); return; }
    setError(""); setLoading(true);
    try {
      const res = await signIn("credentials", {
        email:    email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (res?.error || !res?.ok) {
        setError("Invalid email or password");
        return;
      }

      // Session cookie is now set. Fetch session to read the role,
      // then do a hard navigation so middleware sees the cookie fresh.
      const session = await fetch("/api/auth/session").then(r => r.json());
      const role    = session?.user?.role ?? "CUSTOMER";
      const dest    = roleDestination(role, callbackUrl);

      // Hard navigate — ensures middleware re-evaluates with the new cookie.
      window.location.href = dest;

    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      // Google OAuth requires a full browser redirect — NextAuth handles the callback.
      // We pass a post-login destination that reads the role and routes correctly.
      // After callback, NextAuth redirects to callbackUrl; the role-based routing
      // happens on the callback page or the destination page's own auth check.
      await signIn("google", {
        callbackUrl: callbackUrl && callbackUrl !== "/" ? callbackUrl : "/auth/google-redirect",
      });
      // If signIn returns (popup blocked or error), reset the spinner.
    } catch {
      setError("Could not open Google sign-in. Please try again.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: "#F8F8F8" }}>
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="font-black text-[32px] text-[#0D0D0D]" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.02em" }}>
              TRY<span style={{ color: "#F5C518" }}>BY</span>
            </span>
          </Link>
          <p className="text-[14px] text-[#888] mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-[24px] p-8" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)" }}>

          {/* Google sign-in */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 h-12 rounded-2xl border font-semibold text-[14px] text-[#0D0D0D] hover:bg-[#F8F8F8] active:scale-[0.98] transition-all disabled:opacity-60"
            style={{ border: "1.5px solid #E0E0E0" }}
          >
            {googleLoading ? (
              <span className="h-5 w-5 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" />
            ) : (
              <Globe2 className="h-5 w-5 text-[#4285F4]" />
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#E8E8E8]" />
            <span className="text-[12px] font-semibold text-[#AAAAAA]">or</span>
            <div className="flex-1 h-px bg-[#E8E8E8]" />
          </div>

          {/* Email / password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl px-4 py-3 text-[13px] font-semibold text-[#DC2626]" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-[#444] mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AAAAAA]" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" autoComplete="email" required
                  className="w-full h-11 rounded-xl border border-[#E0E0E0] pl-10 pr-4 text-[14px] text-[#0D0D0D] outline-none bg-white hover:border-[#BBBBBB] focus:border-[#F5C518] focus:shadow-[0_0_0_3px_rgba(245,197,24,0.15)] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-semibold text-[#444]">Password</label>
                <Link href="/auth/forgot-password" className="text-[12px] font-semibold text-[#F5C518] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AAAAAA]" />
                <input
                  type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Your password" autoComplete="current-password" required
                  className="w-full h-11 rounded-xl border border-[#E0E0E0] pl-10 pr-12 text-[14px] text-[#0D0D0D] outline-none bg-white hover:border-[#BBBBBB] focus:border-[#F5C518] focus:shadow-[0_0_0_3px_rgba(245,197,24,0.15)] transition-all"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#555] transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="flex w-full h-12 items-center justify-center rounded-2xl font-black text-[15px] text-[#0D0D0D] transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.03em", boxShadow: "0 4px 16px rgba(245,197,24,0.35)" }}
            >
              {loading ? <span className="h-5 w-5 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" /> : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-[#888] mt-5">
          New to TRYBY?{" "}
          <Link href={`/auth/register${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="font-semibold text-[#0D0D0D] hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
