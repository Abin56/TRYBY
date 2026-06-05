"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Check } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Enter your email address"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      // Always show success to prevent email enumeration
      setSent(true);
    } catch {
      setError("Something went wrong — try again");
    } finally {
      setLoading(false);
    }
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
        </div>

        <div className="bg-white rounded-[24px] p-8" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)" }}>

          {sent ? (
            <div className="text-center py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-5" style={{ background: "rgba(74,222,128,0.1)" }}>
                <Check className="h-8 w-8 text-[#16A34A]" strokeWidth={2.5} />
              </div>
              <h2 className="text-[20px] font-black text-[#0D0D0D] mb-2">Check your email</h2>
              <p className="text-[14px] text-[#888] mb-6 leading-relaxed">
                If <strong>{email}</strong> is registered, you'll receive a password reset link shortly.
              </p>
              <Link href="/auth/login" className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#F5C518] hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#888] hover:text-[#0D0D0D] transition-colors mb-5">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </Link>
              <h2 className="text-[22px] font-black text-[#0D0D0D] mb-1">Forgot password?</h2>
              <p className="text-[13px] text-[#888] mb-6">Enter your email and we'll send you a reset link.</p>

              {error && (
                <div className="mb-4 rounded-xl px-4 py-3 text-[13px] font-semibold text-[#DC2626]" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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
                <button
                  type="submit" disabled={loading}
                  className="flex w-full h-12 items-center justify-center rounded-2xl font-black text-[15px] text-[#0D0D0D] transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.03em", boxShadow: "0 4px 16px rgba(245,197,24,0.35)" }}
                >
                  {loading ? <span className="h-5 w-5 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" /> : "Send Reset Link"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
