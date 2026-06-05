"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock } from "lucide-react";

function ResetPasswordForm() {
  const params   = useSearchParams();
  const router   = useRouter();
  const token    = params.get("token") ?? "";
  const email    = params.get("email") ?? "";

  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [done,        setDone]        = useState(false);

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F8F8F8" }}>
        <div className="text-center">
          <p className="text-[14px] text-[#888] mb-4">Invalid or missing reset link.</p>
          <Link href="/auth/forgot-password" className="font-semibold text-[#0D0D0D] hover:underline text-[13px]">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Something went wrong.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F8F8F8" }}>
        <div className="text-center">
          <div className="text-[40px] mb-3">✅</div>
          <p className="text-[18px] font-black text-[#0D0D0D]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Password updated!
          </p>
          <p className="text-[13px] text-[#888] mt-1">Redirecting to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: "#F8F8F8" }}>
      <div className="w-full max-w-[400px]">

        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="font-black text-[32px] text-[#0D0D0D]" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.02em" }}>
              TRY<span style={{ color: "#F5C518" }}>BY</span>
            </span>
          </Link>
          <p className="text-[14px] text-[#888] mt-2">Choose a new password</p>
        </div>

        <div className="bg-white rounded-[24px] p-8" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl px-4 py-3 text-[13px] font-semibold text-[#DC2626]" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-[#444] mb-1.5">New password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AAAAAA]" />
                <input
                  type={showPw ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters"
                  autoComplete="new-password" required
                  className="w-full h-11 rounded-xl border border-[#E0E0E0] pl-10 pr-12 text-[14px] text-[#0D0D0D] outline-none bg-white hover:border-[#BBBBBB] focus:border-[#F5C518] focus:shadow-[0_0_0_3px_rgba(245,197,24,0.15)] transition-all"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#555] transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#444] mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AAAAAA]" />
                <input
                  type={showPw ? "text" : "password"} value={confirm}
                  onChange={e => setConfirm(e.target.value)} placeholder="Repeat new password"
                  autoComplete="new-password" required
                  className="w-full h-11 rounded-xl border border-[#E0E0E0] pl-10 pr-4 text-[14px] text-[#0D0D0D] outline-none bg-white hover:border-[#BBBBBB] focus:border-[#F5C518] focus:shadow-[0_0_0_3px_rgba(245,197,24,0.15)] transition-all"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="flex w-full h-12 items-center justify-center rounded-2xl font-black text-[15px] text-[#0D0D0D] transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.03em", boxShadow: "0 4px 16px rgba(245,197,24,0.35)" }}
            >
              {loading ? <span className="h-5 w-5 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" /> : "Set new password"}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-[#888] mt-5">
          <Link href="/auth/login" className="font-semibold text-[#0D0D0D] hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
