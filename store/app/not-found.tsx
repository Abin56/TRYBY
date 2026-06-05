import Link from "next/link";
import { PLP_PRODUCTS } from "@/data/plp-mock";

const CATEGORIES = [
  { label: "Football Jerseys", href: "/products?sport=football", icon: "⚽" },
  { label: "Cricket Jerseys",  href: "/products?sport=cricket",  icon: "🏏" },
  { label: "New Arrivals",     href: "/products?filter=new",     icon: "✨" },
  { label: "Deals",            href: "/products?filter=sale",    icon: "🔥" },
];

const TRENDING = PLP_PRODUCTS.slice(0, 4);

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col" style={{ background: "#080808" }}>

      {/* ── Stadium atmosphere ── */}
      <div aria-hidden="true" className="pointer-events-none">
        {/* Yellow glow — top center (stadium spotlight) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(245,197,24,0.5) 0%, transparent 65%)", filter: "blur(60px)" }} />
        {/* Left edge glow */}
        <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, rgba(245,197,24,0.4) 0%, transparent 65%)", filter: "blur(80px)" }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,rgba(255,255,255,.5) 0px,rgba(255,255,255,.5) 1px,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,rgba(255,255,255,.5) 0px,rgba(255,255,255,.5) 1px,transparent 1px,transparent 48px)" }} />
      </div>

      {/* ── TRYBY wordmark top ── */}
      <div className="relative z-10 flex items-center px-6 pt-6 pb-0">
        <Link href="/" aria-label="TRYBY Sports home">
          <img
            src="/brand/tryby-logo-light.png"
            alt="TRYBY Sports Store"
            style={{ height: "28px", width: "auto", objectFit: "contain" }}
          />
        </Link>
      </div>

      {/* ── Hero section ── */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 pt-8 pb-6 text-center">

        {/* Large floating jersey with 404 */}
        <div className="relative mb-8" style={{ filter: "drop-shadow(0 0 60px rgba(245,197,24,0.25))" }}>
          {/* Floating football */}
          <div className="absolute -top-4 -right-6 text-3xl animate-bounce" aria-hidden="true"
            style={{ animation: "float1 3s ease-in-out infinite" }}>⚽</div>
          {/* Floating cricket ball */}
          <div className="absolute -bottom-2 -left-6 text-2xl" aria-hidden="true"
            style={{ animation: "float2 3.5s ease-in-out infinite 0.8s" }}>🏏</div>

          <svg width="220" height="260" viewBox="0 0 200 220" fill="none" aria-label="TRYBY 404 jersey" className="mx-auto">
            {/* Jersey glow behind */}
            <ellipse cx="100" cy="120" rx="80" ry="70" fill="rgba(245,197,24,0.08)" />
            {/* Jersey body */}
            <path d="M60 50 L20 80 L35 95 L55 80 L55 170 L145 170 L145 80 L165 95 L180 80 L140 50 Q130 40 115 38 Q108 55 100 55 Q92 55 85 38 Q70 40 60 50Z"
              fill="#111111" stroke="#F5C518" strokeWidth="2.5" />
            {/* Jersey stripe */}
            <path d="M93 55 L93 170 L107 170 L107 55Z" fill="rgba(245,197,24,0.12)" />
            {/* Collar */}
            <ellipse cx="100" cy="38" rx="14" ry="7" fill="#F5C518" opacity="0.9" />
            {/* Number 404 */}
            <text x="100" y="135" textAnchor="middle" fontSize="40" fontWeight="900"
              fill="#F5C518" fontFamily="'Barlow Condensed', sans-serif" letterSpacing="2">
              404
            </text>
            {/* TRYBY wordmark on jersey */}
            <text x="100" y="158" textAnchor="middle" fontSize="11" fontWeight="700"
              fill="rgba(245,197,24,0.5)" fontFamily="'Barlow Condensed', sans-serif" letterSpacing="4">
              TRYBY
            </text>
          </svg>
        </div>

        {/* Headline */}
        <h1 className="font-black text-white mb-3"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(28px, 6vw, 52px)", letterSpacing: "-0.01em", lineHeight: 1 }}>
          Oops! This Match Has<br />Been Postponed
        </h1>
        <p className="text-[15px] text-white/50 max-w-sm mx-auto mb-8 leading-relaxed">
          The page you&apos;re looking for isn&apos;t in today&apos;s lineup, but we&apos;ve got plenty of jerseys waiting for you.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <Link href="/products"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-full font-bold text-[15px] text-[#0D0D0D] hover:brightness-105 active:scale-[0.97] transition-all"
            style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em", boxShadow: "0 4px 24px rgba(245,197,24,0.35)" }}>
            🛍 Shop Jerseys
          </Link>
          <Link href="/"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-full font-bold text-[15px] text-white border-2 border-white/20 hover:border-white/50 active:scale-[0.97] transition-all"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}>
            🏠 Back To Home
          </Link>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-2">
          {CATEGORIES.map((c) => (
            <Link key={c.href} href={c.href}
              className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-[13px] font-semibold text-white/60 hover:text-white hover:border-[#F5C518]/50 hover:bg-[#F5C518]/05 transition-all">
              <span>{c.icon}</span>{c.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Trending Products ── */}
      <div className="relative z-10 border-t border-white/08 px-4 sm:px-6 lg:px-8 py-8 max-w-[1440px] mx-auto w-full">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            🔥 Trending Jerseys
          </h2>
          <Link href="/products?filter=trending" className="text-[13px] font-semibold text-[#F5C518] hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TRENDING.map((p) => (
            <Link key={p.id} href={`/products/${p.slug}`}
              className="group rounded-2xl overflow-hidden border border-white/08 bg-[#111] hover:border-[#F5C518]/30 transition-all">
              <div className="aspect-square bg-[#1A1A1A] flex items-center justify-center p-4">
                <svg viewBox="0 0 200 220" fill="none" className="w-full h-full opacity-60 group-hover:opacity-80 transition-opacity">
                  <path d="M60 50 L20 80 L35 95 L55 80 L55 170 L145 170 L145 80 L165 95 L180 80 L140 50 Q130 40 115 38 Q108 55 100 55 Q92 55 85 38 Q70 40 60 50Z"
                    fill="#222" stroke="#F5C518" strokeWidth="2" />
                  <ellipse cx="100" cy="38" rx="14" ry="7" fill="#F5C518" opacity="0.6" />
                </svg>
              </div>
              <div className="p-3">
                <p className="text-[12px] font-semibold text-white/80 leading-snug line-clamp-1">{p.name}</p>
                <p className="text-[13px] font-black text-[#F5C518] mt-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  ₹{p.price.toLocaleString("en-IN")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float1 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(15deg)} }
        @keyframes float2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(-10deg)} }
        div[style*="float1"] { animation: float1 3s ease-in-out infinite; }
        div[style*="float2"] { animation: float2 3.5s ease-in-out infinite 0.8s; }
      `}</style>
    </div>
  );
}
