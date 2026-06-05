import type { Metadata } from "next";
import Link from "next/link";

const BASE = "https://www.tryby.in";

export const metadata: Metadata = {
  title: "Contact Us | TRYBY Sports",
  description: "Get in touch with TRYBY Sports. Email, WhatsApp, or visit our help centre for order support, returns, and more.",
  alternates: { canonical: `${BASE}/contact` },
  openGraph: {
    title: "Contact TRYBY Sports",
    description: "Reach us at official@tryby.in or on Instagram @tryby.in — Mon–Sat, 10AM–6PM IST. We respond within 24 hours.",
    url: `${BASE}/contact`,
    siteName: "TRYBY Sports",
    type: "website",
    locale: "en_IN",
    images: [{ url: `${BASE}/og-image.png`, width: 1200, height: 630, alt: "Contact TRYBY Sports" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact TRYBY Sports",
    description: "Reach us at official@tryby.in or @tryby.in on Instagram. We respond within 24 hours.",
    images: [`${BASE}/og-image.png`],
    site: "@trybysports",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F8F8F8" }}>
      <div className="max-w-[640px] mx-auto px-4 py-16">
        <h1 className="text-[36px] font-black text-[#0D0D0D] mb-2 text-center" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Get in Touch
        </h1>
        <p className="text-[14px] text-[#888] mb-10 text-center">
          We&apos;re here to help. Reach us through any of the channels below.
        </p>

        {/* Contact channels */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
            <span className="text-3xl">✉️</span>
            <h3 className="text-[16px] font-bold text-[#0D0D0D] mt-3 mb-1">Email Support</h3>
            <p className="text-[14px] font-semibold text-[#0D0D0D] mb-0.5">official@tryby.in</p>
            <p className="text-[12px] text-[#888] mb-1">General inquiries &amp; order help</p>
            <p className="text-[12px] text-[#888] mb-4">We respond within 24 business hours</p>
            <a
              href="mailto:official@tryby.in"
              className="inline-flex h-10 items-center px-5 rounded-full font-bold text-[13px] text-[#0D0D0D] hover:opacity-85 transition-opacity"
              style={{ background: "#F5C518" }}
            >
              Send Email
            </a>
          </div>

          <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
            <span className="text-3xl">📸</span>
            <h3 className="text-[16px] font-bold text-[#0D0D0D] mt-3 mb-1">Instagram</h3>
            <p className="text-[14px] font-semibold text-[#0D0D0D] mb-0.5">@tryby.in</p>
            <p className="text-[12px] text-[#888] mb-1">Latest drops, sports content &amp; DMs</p>
            <p className="text-[12px] text-[#888] mb-4">Follow us for exclusive launches</p>
            <a
              href="https://www.instagram.com/tryby.in?igsh=MThlczViMWMwdHNydQ=="
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center px-5 rounded-full font-bold text-[13px] text-white hover:opacity-85 transition-opacity"
              style={{ background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" }}
            >
              Follow on Instagram
            </a>
          </div>
        </div>

        {/* WhatsApp card */}
        <div className="bg-white rounded-[20px] p-5 mb-6" style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <div className="flex items-start gap-4">
            <span className="text-3xl shrink-0">💬</span>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-[#0D0D0D] mb-1">WhatsApp Support</h3>
              <p className="text-[13px] text-[#888] mb-1">Quick queries &amp; order tracking — Mon–Sat, 10:00 AM – 6:00 PM IST</p>
              <span
                className="inline-flex h-8 items-center px-4 rounded-full font-bold text-[12px] text-[#888] border border-[#E0E0E0] cursor-default"
                title="WhatsApp link coming soon"
              >
                Coming Soon
              </span>
            </div>
          </div>
        </div>

        {/* Business info */}
        <div className="bg-white rounded-[20px] p-5 mb-6" style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <h3 className="text-[15px] font-bold text-[#0D0D0D] mb-3">Business Information</h3>
          <div className="space-y-2 text-[13px] text-[#555]">
            <div className="flex justify-between">
              <span className="text-[#888]">Platform</span>
              <span className="font-semibold text-[#0D0D0D]">TRYBY Sports</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Founder</span>
              <span className="font-semibold text-[#0D0D0D]">Abin John</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Website</span>
              <a href="https://www.tryby.in" className="font-semibold text-[#0D0D0D] hover:text-[#F5C518] transition-colors">
                www.tryby.in
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Instagram</span>
              <a
                href="https://www.instagram.com/tryby.in?igsh=MThlczViMWMwdHNydQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#0D0D0D] hover:text-[#F5C518] transition-colors"
              >
                @tryby.in
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Location</span>
              <span className="font-semibold text-[#0D0D0D]">Kerala, India 🇮🇳</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Support Hours</span>
              <span className="font-semibold text-[#0D0D0D]">Mon–Sat, 10AM–6PM IST</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Email Response</span>
              <span className="font-semibold text-[#0D0D0D]">Within 24 business hours</span>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-[20px] p-5" style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <h3 className="text-[15px] font-bold text-[#0D0D0D] mb-3">Quick Links</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/faq", label: "FAQ" },
              { href: "/returns", label: "Returns & Refunds" },
              { href: "/shipping", label: "Shipping Policy" },
              { href: "/cancellation", label: "Cancellation Policy" },
              { href: "/orders", label: "Track My Order" },
              { href: "/privacy-policy", label: "Privacy Policy" },
              { href: "/terms", label: "Terms & Conditions" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-[13px] font-semibold text-[#0D0D0D] hover:text-[#F5C518] transition-colors">
                → {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
