"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, Store } from "lucide-react";

export default function SupplierLoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error || !res?.ok) {
      setError("Invalid email or password.");
      return;
    }

    // Verify the authenticated user is actually a SUPPLIER.
    const session = await fetch("/api/auth/session").then(r => r.json());
    if (session?.user?.role !== "SUPPLIER") {
      // Sign them back out immediately — role mismatch.
      await fetch("/api/auth/signout", { method: "POST" });
      setError("This portal is for suppliers only. Use the main sign-in page.");
      return;
    }

    // Hard navigate so middleware sees the session cookie immediately.
    window.location.href = "/supplier/dashboard";
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#0F0F0F" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-8">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "rgba(245,197,24,0.12)" }}
          >
            <Store className="h-5 w-5 text-[#F5C518]" />
          </div>
          <div className="flex flex-col leading-none">
            <span
              className="text-white font-black"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", letterSpacing: "0.1em" }}
            >
              TRYBY
            </span>
            <span
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "9px", letterSpacing: "0.22em", color: "rgba(255,255,255,0.30)" }}
            >
              SUPPLIER PORTAL
            </span>
          </div>
        </div>

        <h1
          className="text-white font-black mb-1"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px" }}
        >
          Sign in
        </h1>
        <p className="text-white/40 text-[13px] mb-6">Access your supplier dashboard.</p>

        {error && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-[13px] font-medium"
            style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-white/50 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl px-4 py-2.5 text-[14px] text-white outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-white/50 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl px-4 py-2.5 text-[14px] text-white outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 font-black text-[14px] transition-all disabled:opacity-50"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: "0.06em",
              background: "#F5C518",
              color: "#0D0D0D",
            }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-[12px] text-white/25 mt-6">
          Not a supplier?{" "}
          <a href="/supplier/apply" className="text-[#F5C518] hover:underline">Apply here</a>
        </p>
      </div>
    </div>
  );
}
