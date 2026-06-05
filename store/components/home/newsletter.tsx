"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Mail, Bell, Users, Shirt, Phone } from "lucide-react";

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

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://instagram.com/trybysports",
    icon: IconInstagram,
    hover: "hover:bg-gradient-to-br hover:from-[#833ab4] hover:via-[#fd1d1d] hover:to-[#fcb045] hover:border-transparent hover:text-white",
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/918001234567",
    icon: IconWhatsApp,
    hover: "hover:bg-[#25D366] hover:border-transparent hover:text-white",
  },
  {
    label: "Call Us",
    href: "tel:+918001234567",
    icon: Phone,
    hover: "hover:bg-[#FF3B30] hover:border-transparent hover:text-white",
  },
];

const STATS = [
  { icon: Users, value: "14,200+", label: "Fan Club Members" },
  { icon: Shirt, value: "3", label: "Jersey Drops Coming" },
  { icon: Bell, value: "First", label: "To Hear About Launches" },
];

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    await new Promise((r) => setTimeout(r, 900));
    setStatus("success");
  };

  return (
    <section
      className="relative py-20 sm:py-28 overflow-hidden"
      style={{ background: "linear-gradient(145deg, #0A0A0A 0%, #1a0000 50%, #0A0A0A 100%)" }}
      aria-labelledby="newsletter-heading"
    >
      {/* Dot grid overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Red glow blob */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-full h-[400px] rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(255,59,48,0.18) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />
      {/* Gold accent glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 left-1/2 -translate-x-1/2 w-[500px] max-w-full h-[200px] rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(255,184,0,0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        >
          {/* Badge */}
          <span
            className="inline-flex items-center gap-2 rounded-full border border-[#FF3B30]/30 bg-[#FF3B30]/10 px-4 py-1.5 text-xs font-bold text-[#FF3B30] mb-6 uppercase tracking-widest"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            <Bell className="h-3.5 w-3.5" />
            Fan Club
          </span>

          {/* Heading */}
          <h2
            id="newsletter-heading"
            className="section-headline text-[clamp(32px,6vw,60px)] text-white mb-4"
          >
            Join The{" "}
            <span
              className="gradient-text-sport"
              style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              TRYBY Fan Club
            </span>
          </h2>

          <p className="text-white/55 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            Get first access to jersey launches, exclusive fan drops,
            and community events — straight to your inbox.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-10">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF3B30]/15 border border-[#FF3B30]/25">
                  <Icon className="h-4 w-4 text-[#FF3B30]" />
                </div>
                <span
                  className="text-white font-black text-lg leading-none"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {value}
                </span>
                <span className="text-white/40 text-xs uppercase tracking-wide">{label}</span>
              </div>
            ))}
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF3B30]/20 border border-[#FF3B30]/40">
                  <CheckCircle2 className="h-7 w-7 text-[#FF3B30]" />
                </div>
                <p
                  className="text-xl font-black text-white"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  YOU&apos;RE IN THE CLUB!
                </p>
                <p className="text-sm text-white/50">
                  Welcome to the TRYBY Fan Club. Check your inbox for your first drop alert.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                exit={{ opacity: 0, y: -8 }}
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                aria-label="Fan club newsletter signup"
              >
                <div className="relative flex-1">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30"
                    aria-hidden="true"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    required
                    aria-label="Email address"
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-white/10 bg-white/[0.07] text-sm text-white placeholder:text-white/30 outline-none focus:border-[#FF3B30]/60 focus:bg-white/10 transition-all duration-200"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="shimmer-btn inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#FF3B30] hover:bg-[#E5352B] active:bg-[#CC2F25] px-7 text-sm font-black text-white disabled:opacity-60 transition-colors duration-150 whitespace-nowrap shadow-[0_4px_24px_rgba(255,59,48,0.35)]"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}
                >
                  {status === "loading" ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    "SUBSCRIBE"
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {status !== "success" && (
            <p className="mt-4 text-xs text-white/30 tracking-wide">
              No spam, ever. Unsubscribe anytime.
            </p>
          )}

          {/* Divider */}
          <div className="mt-12 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-white/25 text-xs uppercase tracking-widest">Connect With Us</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Social icons */}
          <div className="mt-6 flex justify-center gap-4">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon, hover }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/60 hover:text-white hover:border-white/20 transition-all duration-200 ${hover}`}
              >
                <Icon className="h-4.5 w-4.5" />
              </a>
            ))}
          </div>

          {/* Jersey launch update note */}
          <p className="mt-6 text-xs text-white/30 tracking-wide">
            <span className="text-[#FFB800] font-semibold">3 jersey launches</span> dropping this season — subscribers hear first.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
