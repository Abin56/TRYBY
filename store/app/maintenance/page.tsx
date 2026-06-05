"use client";

import { useState, useEffect } from "react";
import type { Metadata } from "next";

// Can't export metadata from client component — set it in a wrapper if needed.

const TARGET = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2h from build

function Countdown() {
  const [time, setTime] = useState({ h: "02", m: "00", s: "00" });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, TARGET.getTime() - Date.now());
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setTime({ h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-3 justify-center">
      {[{ v: time.h, l: "Hours" }, { v: time.m, l: "Minutes" }, { v: time.s, l: "Seconds" }].map(({ v, l }, i) => (
        <div key={l} className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl font-black text-[28px] sm:text-[32px] text-[#0D0D0D]"
              style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif" }}>
              {v}
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mt-1">{l}</span>
          </div>
          {i < 2 && <span className="text-[24px] font-black text-white/30 mb-4">:</span>}
        </div>
      ))}
    </div>
  );
}

export default function MaintenancePage() {
  const [email, setEmail] = useState("");
  const [notified, setNotified] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-4 py-12 text-center"
      style={{ background: "#080808" }}>

      {/* Stadium lights */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-2 h-full opacity-10"
          style={{ background: "linear-gradient(to bottom, rgba(245,197,24,0.8), transparent)" }} />
        <div className="absolute top-0 right-1/4 w-2 h-full opacity-08"
          style={{ background: "linear-gradient(to bottom, rgba(245,197,24,0.6), transparent)" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(245,197,24,0.18) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,rgba(255,255,255,.5) 0,rgba(255,255,255,.5) 1px,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,rgba(255,255,255,.5) 0,rgba(255,255,255,.5) 1px,transparent 1px,transparent 48px)" }} />
      </div>

      <div className="relative z-10 max-w-lg w-full">

        {/* Logo */}
        <div className="flex items-center justify-center mb-10">
          <img
            src="/brand/tryby-icon.png"
            alt="TRYBY Sports Store"
            style={{ height: "72px", width: "72px", objectFit: "contain" }}
          />
        </div>

        {/* Stadium prep illustration */}
        <div className="relative flex justify-center mb-8">
          <svg width="160" height="160" viewBox="0 0 160 160" fill="none" aria-hidden="true">
            {/* Stadium arc */}
            <path d="M20 130 Q80 30 140 130" stroke="#F5C518" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
            {/* Stadium lights left */}
            <rect x="15" y="60" width="8" height="40" rx="4" fill="#333" />
            <circle cx="19" cy="55" r="6" fill="#F5C518" opacity="0.8">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Stadium lights right */}
            <rect x="137" y="60" width="8" height="40" rx="4" fill="#333" />
            <circle cx="141" cy="55" r="6" fill="#F5C518" opacity="0.8">
              <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Large TRYBY shield center */}
            <path d="M80 38 L56 48v20c0 15 10.8 27.8 24 31.8 13.2-4 24-16.8 24-31.8V48L80 38z"
              fill="#1A1A1A" stroke="#F5C518" strokeWidth="2.5" />
            <path d="M75 68.5l5 5 10-10" stroke="#F5C518" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Spinning gear */}
            <g style={{ transformOrigin: "125px 110px", animation: "spin 4s linear infinite" }}>
              <circle cx="125" cy="110" r="12" fill="#1A1A1A" stroke="#F5C518" strokeWidth="1.5" />
              <circle cx="125" cy="110" r="5" fill="#F5C518" opacity="0.8" />
              {[0,45,90,135,180,225,270,315].map((a) => (
                <rect key={a}
                  x="123.5" y="96"
                  width="3" height="6" rx="1.5" fill="#F5C518" opacity="0.7"
                  style={{ transformOrigin: "125px 110px", transform: `rotate(${a}deg)` }} />
              ))}
            </g>
          </svg>
          {/* Floating football */}
          <div className="absolute top-2 right-6 text-2xl" aria-hidden="true"
            style={{ animation: "float 3s ease-in-out infinite" }}>⚽</div>
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#F5C518]/30 bg-[#F5C518]/08 px-4 py-1.5 mb-5">
          <span className="h-2 w-2 rounded-full bg-[#F5C518] animate-pulse" />
          <span className="text-[12px] font-bold uppercase tracking-widest text-[#F5C518]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Stadium Under Preparation
          </span>
        </div>

        <h1 className="font-black text-white mb-3"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(30px, 6vw, 52px)", letterSpacing: "-0.01em", lineHeight: 1 }}>
          We&apos;re Preparing<br />For Kick-Off
        </h1>
        <p className="text-[15px] text-white/50 max-w-sm mx-auto mb-8 leading-relaxed">
          Our team is making upgrades to improve your shopping experience. We&apos;ll be back on the field soon.
        </p>

        {/* Countdown */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-3">Estimated Return</p>
          <Countdown />
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-[11px] text-white/30 mb-1.5">
            <span>Progress</span>
            <span>75%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-[#F5C518]" style={{ width: "75%", boxShadow: "0 0 12px rgba(245,197,24,0.5)" }} />
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          {[
            { icon: "🔒", label: "Secure Maintenance"         },
            { icon: "📦", label: "Orders Remain Safe"         },
            { icon: "🛡️", label: "No Data Affected"           },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span>{icon}</span>
              <span className="text-[13px] font-semibold text-white/60">{label}</span>
            </div>
          ))}
        </div>

        {/* Notify me */}
        {!notified ? (
          <form onSubmit={(e) => { e.preventDefault(); setNotified(true); }} className="flex gap-2 mb-5 max-w-sm mx-auto">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Get notified when we're back"
              required
              className="flex-1 h-11 rounded-full border border-white/15 px-4 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-[#F5C518] transition-all"
              style={{ background: "rgba(255,255,255,0.06)" }} />
            <button type="submit"
              className="h-11 px-5 rounded-full font-bold text-[13px] text-[#0D0D0D] hover:brightness-105 transition-all shrink-0"
              style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>
              Notify Me
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-5 py-2.5 mb-5 max-w-xs mx-auto">
            <span className="text-green-400">✓</span>
            <span className="text-[13px] font-semibold text-green-400">We&apos;ll notify you when we&apos;re back!</span>
          </div>
        )}

        {/* Contact */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a href="mailto:support@trybysports.com"
            className="flex items-center gap-1.5 h-10 px-5 rounded-full border border-white/15 text-[13px] font-semibold text-white/60 hover:text-white hover:border-white/40 transition-all">
            ✉️ Contact Support
          </a>
          <a href="https://wa.me/918001234567" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 h-10 px-5 rounded-full border border-white/15 text-[13px] font-semibold text-white/60 hover:text-white hover:border-[#25D366]/40 transition-all">
            💬 WhatsApp
          </a>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
