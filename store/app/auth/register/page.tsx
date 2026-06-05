"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, User, Mail, Lock, Globe2 } from "lucide-react";

function roleDestination(role: string, callbackUrl: string): string {
  const hasCallback = callbackUrl && callbackUrl !== "/";
  if (role === "ADMIN") {
    if (hasCallback && callbackUrl.startsWith("/admin")) return callbackUrl;
    return "/admin";
  }
  if (role === "SUPPLIER") {
    if (hasCallback && callbackUrl.startsWith("/supplier")) return callbackUrl;
    return "/supplier/dashboard";
  }
  if (hasCallback && !callbackUrl.startsWith("/admin") && !callbackUrl.startsWith("/supplier")) {
    return callbackUrl;
  }
  return "/";
}

function RegisterForm() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = "Enter your full name";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email";
    if (!password) e.password = "Password required";
    else if (password.length < 8) e.password = "At least 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.toLowerCase().trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const fieldErrors = data.error as Record<string, string[]>;
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(fieldErrors)) flat[k] = v[0];
        setErrors(flat);
        return;
      }
      // Auto sign-in after register — use redirect:false so we control the
      // destination via role-based routing (same pattern as login page).
      const signInRes = await signIn("credentials", {
        email:    email.toLowerCase().trim(),
        password,
        redirect: false,
      });
      if (signInRes?.error || !signInRes?.ok) {
        // Sign-in failed but registration succeeded — send to login page.
        window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
        return;
      }
      const session = await fetch("/api/auth/session").then(r => r.json());
      const role    = session?.user?.role ?? "CUSTOMER";
      window.location.href = roleDestination(role, callbackUrl);
    } catch {
      setErrors({ form: "Something went wrong — try again" });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signIn("google", {
        callbackUrl: callbackUrl && callbackUrl !== "/" ? callbackUrl : "/auth/google-redirect",
      });
    } catch {
      setErrors({ form: "Could not open Google sign-in. Please try again." });
      setGoogleLoading(false);
    }
  }

  const inp = (field: string) =>
    `w-full h-11 rounded-xl border ${errors[field] ? "border-[#DC2626] bg-[#FEF2F2]" : "border-[#E0E0E0]"} pl-10 pr-4 text-[14px] text-[#0D0D0D] outline-none bg-white hover:border-[#BBBBBB] focus:border-[#F5C518] focus:shadow-[0_0_0_3px_rgba(245,197,24,0.15)] transition-all`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: "#F8F8F8" }}>
      <div className="w-full max-w-[400px]">

        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="font-black text-[32px] text-[#0D0D0D]" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.02em" }}>
              TRY<span style={{ color: "#F5C518" }}>BY</span>
            </span>
          </Link>
          <p className="text-[14px] text-[#888] mt-2">Create your account</p>
        </div>

        <div className="bg-white rounded-[24px] p-8" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)" }}>

          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 h-12 rounded-2xl border font-semibold text-[14px] text-[#0D0D0D] hover:bg-[#F8F8F8] active:scale-[0.98] transition-all disabled:opacity-60"
            style={{ border: "1.5px solid #E0E0E0" }}
          >
            {googleLoading ? <span className="h-5 w-5 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" /> : <Globe2 className="h-5 w-5 text-[#4285F4]" />}
            Sign up with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#E8E8E8]" />
            <span className="text-[12px] font-semibold text-[#AAAAAA]">or</span>
            <div className="flex-1 h-px bg-[#E8E8E8]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.form && (
              <div className="rounded-xl px-4 py-3 text-[13px] font-semibold text-[#DC2626]" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
                {errors.form}
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-[#444] mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AAAAAA]" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Sharma" autoComplete="name" className={inp("name")} />
              </div>
              {errors.name && <p className="mt-1 text-[11px] font-semibold text-[#DC2626]">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#444] mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AAAAAA]" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className={inp("email")} />
              </div>
              {errors.email && <p className="mt-1 text-[11px] font-semibold text-[#DC2626]">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#444] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AAAAAA]" />
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" autoComplete="new-password" className={inp("password") + " pr-12"} />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#555] transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-[11px] font-semibold text-[#DC2626]">{errors.password}</p>}
            </div>

            <button
              type="submit" disabled={loading}
              className="flex w-full h-12 items-center justify-center rounded-2xl font-black text-[15px] text-[#0D0D0D] transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.03em", boxShadow: "0 4px 16px rgba(245,197,24,0.35)" }}
            >
              {loading ? <span className="h-5 w-5 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" /> : "Create Account"}
            </button>

            <p className="text-center text-[11px] text-[#AAAAAA] leading-relaxed">
              By signing up you agree to our{" "}
              <Link href="/terms" className="underline hover:text-[#555]">Terms</Link> and{" "}
              <Link href="/privacy-policy" className="underline hover:text-[#555]">Privacy Policy</Link>
            </p>
          </form>
        </div>

        <p className="text-center text-[13px] text-[#888] mt-5">
          Already have an account?{" "}
          <Link href={`/auth/login${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="font-semibold text-[#0D0D0D] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
