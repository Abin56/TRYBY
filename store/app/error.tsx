"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[TRYBY Error]", error); }, [error]);

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-4 py-12 text-center"
      style={{ background: "#080808" }}>

      {/* Stadium atmosphere */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] max-w-full h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(245,197,24,0.12) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,rgba(255,255,255,.5) 0,rgba(255,255,255,.5) 1px,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,rgba(255,255,255,.5) 0,rgba(255,255,255,.5) 1px,transparent 1px,transparent 48px)" }} />
      </div>

      <div className="relative z-10 max-w-md w-full">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M16 2L4 7v9c0 7 5.4 13.1 12 14.9C22.6 29.1 28 23 28 16V7L16 2z" fill="#F5C518" />
            <path d="M13 16.5l2.5 2.5 5-5" stroke="#0D0D0D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[15px] font-black text-white uppercase tracking-wider" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>TRYBY</span>
        </div>

        {/* Illustration — football hitting goal post */}
        <div className="flex justify-center mb-8">
          <svg width="180" height="140" viewBox="0 0 180 140" fill="none" aria-hidden="true">
            {/* Goal posts */}
            <rect x="20" y="20" width="5" height="95" rx="2.5" fill="#2A2A2A" />
            <rect x="155" y="20" width="5" height="95" rx="2.5" fill="#2A2A2A" />
            <rect x="20" y="20" width="140" height="5" rx="2.5" fill="#2A2A2A" />
            {/* Net lines */}
            {[30,45,60,75,90].map((y) => (
              <line key={y} x1="25" y1={y} x2="155" y2={y} stroke="#1A1A1A" strokeWidth="1" />
            ))}
            {[35,55,75,95,115,135].map((x) => (
              <line key={x} x1={x} y1="25" x2={x} y2="115" stroke="#1A1A1A" strokeWidth="1" />
            ))}
            {/* Football at post — with impact */}
            <circle cx="152" cy="67" r="16" fill="#F5C518" opacity="0.95" />
            <path d="M146 61l6 6-6 6M152 61l-6 6 6 6" stroke="#0D0D0D" strokeWidth="1.8" strokeLinecap="round" />
            {/* Impact burst */}
            <path d="M168 52l8-8M170 67l10 0M168 82l8 8" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            {/* OFFSIDE text */}
            <text x="90" y="132" textAnchor="middle" fontSize="14" fontWeight="800"
              fill="white" opacity="0.2" fontFamily="'Barlow Condensed', sans-serif" letterSpacing="4">
              OFFSIDE
            </text>
          </svg>
        </div>

        <h1 className="font-black text-white mb-3"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(28px, 6vw, 46px)", letterSpacing: "-0.01em", lineHeight: 1 }}>
          Something Went Offside
        </h1>
        <p className="text-[15px] text-white/50 max-w-xs mx-auto mb-3 leading-relaxed">
          Our team has already been notified and is working on a fix.
        </p>

        {error.digest && (
          <p className="text-[11px] text-white/20 font-mono mb-6">Error ID: {error.digest}</p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button onClick={reset}
            className="inline-flex items-center gap-2 h-12 px-8 rounded-full font-bold text-[15px] text-[#0D0D0D] hover:brightness-105 active:scale-[0.97] transition-all"
            style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em", boxShadow: "0 4px 24px rgba(245,197,24,0.3)" }}>
            Try Again
          </button>
          <Link href="/"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-full font-bold text-[15px] text-white border-2 border-white/20 hover:border-white/50 active:scale-[0.97] transition-all"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}>
            Go Home
          </Link>
        </div>

        <a href="mailto:support@trybysports.com"
          className="text-[13px] font-semibold text-white/30 hover:text-[#F5C518] transition-colors underline underline-offset-2">
          Contact Support
        </a>
      </div>
    </div>
  );
}
