"use client";

import { useState } from "react";

type Props = {
  title: string;
  description?: string;
};

export function ComingSoon({ title, description }: Props) {
  const [email, setEmail]       = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16 text-center"
      style={{ background: "#0D0D0D" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mb-12">
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M16 2L4 7v9c0 7 5.4 13.1 12 14.9C22.6 29.1 28 23 28 16V7L16 2z" fill="#F5C518" />
          <path d="M13 16.5l2.5 2.5 5-5" stroke="#0D0D0D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[15px] font-black tracking-wider text-white uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          TRYBY
        </span>
      </div>

      {/* Rocket */}
      <div className="text-5xl mb-6" style={{ animation: "bounce 2s ease-in-out infinite" }} aria-hidden="true">
        🚀
      </div>

      <p
        className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F5C518] mb-3"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        Coming Soon
      </p>

      <h1
        className="font-black text-white mb-3"
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(26px, 5vw, 40px)",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h1>
      <p className="text-[14px] text-white/50 max-w-sm mx-auto mb-10 leading-relaxed">
        {description ?? "Something exciting is on the way. Be the first to know when it launches."}
      </p>

      {/* Email capture */}
      {!submitted ? (
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 h-11 rounded-full border border-white/15 bg-white/08 px-4 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-[#F5C518] transition-all"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
            <button
              type="submit"
              className="h-11 px-6 rounded-full font-bold text-[13px] text-[#0D0D0D] bg-[#F5C518] hover:brightness-105 active:scale-[0.97] transition-all shrink-0"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}
            >
              Notify Me
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-5 py-2.5">
          <span className="text-green-400 text-lg">✓</span>
          <span className="text-[13px] font-semibold text-green-400">You&apos;re on the list!</span>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
