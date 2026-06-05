"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MapPin, ChevronDown, ExternalLink } from "lucide-react";
import type { FooterColumn } from "@/lib/content";
import { NewsletterSignup } from "@/components/conversion/newsletter-signup";

/* ── Icon components ─────────────────────────────────────────────── */

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}
function IconPortfolio({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
function IconVisa({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 38 24" fill="none">
      <rect width="38" height="24" rx="4" fill="#1A1F71" />
      <path d="M15.8 16.4H13.4L11.8 9.8C11.72 9.49 11.54 9.22 11.27 9.09C10.59 8.76 9.84 8.5 9 8.34V8.07H13.01C13.56 8.07 13.98 8.5 14.06 9.02L15.04 14.27L17.44 8.07H19.8L15.8 16.4ZM20.87 16.4H18.6L20.32 8.07H22.59L20.87 16.4ZM25.36 10.37C25.44 9.84 25.95 9.57 26.6 9.57C27.6 9.57 28.6 9.84 29.15 10.11L29.6 8.34C29.05 8.07 28.05 7.8 27.05 7.8C24.78 7.8 23.14 9.02 23.14 10.71C23.14 12 24.24 12.67 25.06 13.07C25.95 13.47 26.27 13.74 26.27 14.14C26.27 14.8 25.52 15.07 24.78 15.07C24.05 15.07 22.86 14.8 22.25 14.53L21.8 16.35C22.47 16.62 23.73 16.89 25.06 16.89C27.6 16.89 29.15 15.67 29.15 13.87C29.15 11.64 25.36 11.5 25.36 10.37Z" fill="white" />
    </svg>
  );
}
function IconMastercard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 38 24" fill="none">
      <rect width="38" height="24" rx="4" fill="#252525" />
      <circle cx="15" cy="12" r="6" fill="#EB001B" />
      <circle cx="23" cy="12" r="6" fill="#F79E1B" />
      <path d="M19 7.27A6 6 0 0 1 22.73 12 6 6 0 0 1 19 16.73 6 6 0 0 1 15.27 12 6 6 0 0 1 19 7.27Z" fill="#FF5F00" />
    </svg>
  );
}
function IconUPI({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 38 24" fill="none">
      <rect width="38" height="24" rx="4" fill="#F8F8F8" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="19" y="16" textAnchor="middle" fontSize="8" fontWeight="800" fill="#6739B7" fontFamily="system-ui,sans-serif">UPI</text>
    </svg>
  );
}
function IconRazorpay({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 38 24" fill="none">
      <rect width="38" height="24" rx="4" fill="#072654" />
      <path d="M11 17L14.5 7H17L16 10.5H18.5L15.5 17H13L14.5 13H12L11 17Z" fill="#3395FF" />
      <text x="20" y="16" fontSize="6.5" fontWeight="700" fill="white" fontFamily="system-ui,sans-serif">Pay</text>
    </svg>
  );
}
function IconCOD({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 38 24" fill="none">
      <rect width="38" height="24" rx="4" fill="#F8F8F8" stroke="#E5E7EB" strokeWidth="0.5" />
      <text x="19" y="16" textAnchor="middle" fontSize="7" fontWeight="800" fill="#059669" fontFamily="system-ui,sans-serif">COD</text>
    </svg>
  );
}

const PAYMENT_ICONS = [
  { key: "razorpay",   Icon: IconRazorpay,   label: "Razorpay" },
  { key: "upi",        Icon: IconUPI,        label: "UPI" },
  { key: "visa",       Icon: IconVisa,       label: "Visa" },
  { key: "mastercard", Icon: IconMastercard, label: "Mastercard" },
  { key: "cod",        Icon: IconCOD,        label: "Cash on Delivery" },
];

const SOCIAL_LINKS = [
  { Icon: IconInstagram, label: "Instagram @tryby.in", href: "https://www.instagram.com/tryby.in?igsh=MThlczViMWMwdHNydQ==", comingSoon: false },
  { Icon: IconWhatsApp,  label: "WhatsApp",             href: null,                                                           comingSoon: true  },
  { Icon: IconPortfolio, label: "Portfolio Website",    href: "https://abinjohn.vercel.app/",                                 comingSoon: false },
];

/* ── Brand column ────────────────────────────────────────────────── */

function BrandColumn() {
  return (
    <div>
      <Link href="/" className="inline-flex items-center gap-2.5 mb-5" aria-label="TRYBY Sports home">
        <img src="/brand/tryby-icon.png" alt="" aria-hidden="true" width={44} height={44}
          style={{ width: "44px", height: "44px", objectFit: "contain" }} />
        <div className="flex flex-col leading-none">
          <span className="text-white font-black"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", letterSpacing: "0.12em", lineHeight: 1 }}>
            TRYBY
          </span>
          <span className="text-white/45 font-semibold uppercase mt-[3px]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "9px", letterSpacing: "0.26em" }}>
            SPORTS STORE
          </span>
        </div>
      </Link>

      <p className="text-sm text-white/50 leading-relaxed max-w-[260px] mb-5">
        TRYBY is a modern Indian sports store built for athletes, fans, and sports enthusiasts.
        We aim to provide premium jerseys, sportswear, and accessories with a simple and trustworthy shopping experience.
      </p>

      <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-5 text-xs font-semibold"
        style={{ background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.2)", color: "rgba(255,255,255,0.75)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
        <span>🇮🇳</span>
        <span>BUILT IN INDIA</span>
      </div>
      <p className="text-xs text-white/30 mb-6 -mt-3 ml-1">Created with passion for sports and technology.</p>

      <ul className="space-y-2.5 mb-5">
        <li>
          <a href="mailto:official@tryby.in" className="flex items-center gap-2.5 text-sm text-white/50 hover:text-white transition-colors duration-150">
            <Mail className="h-3.5 w-3.5 text-[#F5C518] shrink-0" />
            official@tryby.in
          </a>
        </li>
        <li>
          <span className="flex items-start gap-2.5 text-sm text-white/50">
            <MapPin className="h-3.5 w-3.5 text-[#F5C518] shrink-0 mt-0.5" />
            Kerala, India
          </span>
        </li>
      </ul>

      {/* Newsletter */}
      <div className="mb-5">
        <NewsletterSignup
          variant="footer"
          source="footer"
          title="Get exclusive deals"
          subtitle="New drops, flash sales & offers — no spam."
        />
      </div>

      <div className="rounded-xl p-3.5 mb-5"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(245,197,24,0.18)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30 mb-2"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Founder
        </p>
        <p className="text-sm font-bold text-white leading-tight">👨‍💻 Abin John</p>
        <p className="text-xs text-white/40 mb-3">Software Developer & Founder</p>
        <a href="https://abinjohn.vercel.app/" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 hover:gap-2"
          style={{ color: "#F5C518" }}>
          <ExternalLink className="h-3 w-3 shrink-0" />
          Portfolio Website
        </a>
      </div>

      <div className="flex items-center gap-2">
        {SOCIAL_LINKS.map(({ Icon, label, href, comingSoon }) =>
          comingSoon ? (
            <div key={label} title={`${label} — Coming Soon`}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/20 cursor-default">
              <Icon className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 text-[8px] font-bold leading-none bg-[#F5C518] text-[#0D0D0D] rounded-full px-1 py-0.5">
                Soon
              </span>
            </div>
          ) : (
            <a key={label} href={href!} target="_blank" rel="noopener noreferrer" aria-label={label}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-[#F5C518]/60 hover:bg-[#F5C518]/10 hover:scale-105 hover:shadow-[0_0_10px_rgba(245,197,24,0.2)] transition-all duration-200">
              <Icon className="h-4 w-4" />
            </a>
          )
        )}
      </div>
    </div>
  );
}

/* ── Footer Client ───────────────────────────────────────────────── */

export function FooterClient({ columns }: { columns: FooterColumn[] }) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  function toggleSection(heading: string) {
    setOpenSections((prev) => ({ ...prev, [heading]: !prev[heading] }));
  }

  return (
    <footer className="bg-[#0A0A0A] text-white" aria-label="Site footer">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">

        <div className="py-14 lg:py-16 border-b border-white/10">
          {/* Desktop */}
          <div className="hidden lg:grid lg:gap-8" style={{ gridTemplateColumns: `2fr repeat(${columns.length}, 1fr)` }}>
            <div className="col-span-1">
              <BrandColumn />
            </div>
            {columns.map((col) => (
              <div key={col.heading}>
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-4">
                  {col.heading}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.url} className="text-sm text-white/55 hover:text-white transition-colors duration-150">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Mobile / Tablet */}
          <div className="lg:hidden">
            <div className="mb-8"><BrandColumn /></div>
            <div className="border-t border-white/10">
              {columns.map((col) => {
                const isOpen = !!openSections[col.heading];
                return (
                  <div key={col.heading} className="border-b border-white/10">
                    <button
                      type="button"
                      onClick={() => toggleSection(col.heading)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between min-h-[48px] py-3 text-sm font-semibold text-white/60 hover:text-white transition-colors duration-150"
                    >
                      <span>{col.heading}</span>
                      <ChevronDown
                        className="h-4 w-4 shrink-0 transition-transform duration-300"
                        style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      className="overflow-hidden transition-all duration-300 ease-in-out"
                      style={{ maxHeight: isOpen ? `${col.links.length * 40 + 16}px` : "0px" }}
                    >
                      <ul className="pb-4">
                        {col.links.map((link) => (
                          <li key={link.label}>
                            <Link href={link.url} className="block py-2 text-sm text-white/55 hover:text-white transition-colors duration-150">
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30 text-center sm:text-left order-2 sm:order-1">
            © 2026 TRYBY Sports · Made in India 🇮🇳 · All Rights Reserved
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-center order-1 sm:order-2">
            {PAYMENT_ICONS.map(({ key, Icon, label }) => (
              <Icon key={key} className="h-6 w-[38px]" aria-label={label} />
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/30 order-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[#059669] inline-block animate-pulse" aria-hidden="true" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
