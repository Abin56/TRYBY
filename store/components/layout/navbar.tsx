"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart, Search, Menu, X, Heart, User,
  LogOut, Package, Settings, Ticket, MapPin, Phone,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { useCartStore } from "@/store/cart";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SearchPalette } from "@/components/search/search-palette";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useSession, signOut } from "next-auth/react";

/* ── Nav items ────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { emoji: "🏠", label: "Home",          href: "/"                              },
  { emoji: "👕", label: "Jerseys",        href: "/products?category=jerseys"     },
  { emoji: "⚽", label: "Football",       href: "/products?sport=football"       },
  { emoji: "🏏", label: "Cricket",        href: "/products?sport=cricket"        },
  { emoji: "🏋️", label: "Gym & Fitness",  href: "/products?sport=gym"            },
  { emoji: "🎽", label: "Accessories",    href: "/products?category=accessories" },
  { emoji: "🏆", label: "Collections",   href: "/products?view=collections"     },
  { emoji: "🔥", label: "Deals",          href: "/products?filter=sale"          },
];

const QUICK_ACTIONS = [
  { icon: User,    label: "My Account",   href: "/auth/login"    },
  { icon: Heart,   label: "Wishlist",     href: "/wishlist"      },
  { icon: Package, label: "Track Order",  href: "/orders/track"  },
  { icon: Phone,   label: "Contact Us",   href: "/contact"       },
];

const ACCOUNT_MENU = [
  { icon: Package,  label: "My Orders", href: "/orders"           },
  { icon: Heart,    label: "Wishlist",  href: "/wishlist"          },
  { icon: Ticket,   label: "Coupons",   href: "/coupons"           },
  { icon: Settings, label: "Settings",  href: "/account/settings" },
];

/* ── Account dropdown (desktop) — session-aware ──────────────────── */
function AccountDropdown({ onClose }: { onClose: () => void }) {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === "loading") {
    return (
      <div className="w-60 p-6 flex items-center justify-center">
        <span className="h-4 w-4 rounded-full border-2 border-[#F5C518] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user) {
    const initials = (user.name ?? user.email ?? "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
    return (
      <div className="w-60 p-4">
        {/* User identity */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-[13px] text-[#0D0D0D]" style={{ background: "#F5C518" }}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[#111827] truncate">{user.name ?? "My Account"}</p>
            <p className="text-[11px] text-[#9CA3AF] truncate">{user.email}</p>
          </div>
        </div>
        {/* Links */}
        <div className="space-y-0.5 mb-3">
          {ACCOUNT_MENU.map(({ icon: Icon, label, href }) => (
            <Link key={href} href={href} onClick={onClose}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] font-medium text-[#374151] hover:bg-[#F5F5F7] transition-colors duration-150">
              <Icon className="h-3.5 w-3.5 text-[#6B7280]" />
              {label}
            </Link>
          ))}
        </div>
        {/* Sign out */}
        <div className="pt-3 border-t border-[#F3F4F6]">
          <button
            onClick={() => { onClose(); signOut({ callbackUrl: "/" }); }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors duration-150"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Unauthenticated
  return (
    <div className="w-60 p-4">
      <p className="text-sm font-semibold text-[#111827] mb-1">Welcome to TRYBY</p>
      <p className="text-xs text-[#6B7280] mb-4">
        Sign in for orders, wishlist &amp; exclusive deals.
      </p>
      <Link
        href="/auth/login"
        onClick={onClose}
        className="flex w-full items-center justify-center h-9 rounded-xl bg-[#F5C518] text-sm font-bold text-[#0D0D0D] hover:bg-[#e0b310] transition-colors duration-150"
        style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}
      >
        SIGN IN
      </Link>
      <p className="mt-2.5 text-center text-xs text-[#9CA3AF]">
        New here?{" "}
        <Link href="/auth/register" onClick={onClose} className="font-semibold text-[#F5C518] hover:underline">
          Create account
        </Link>
      </p>
      <div className="mt-4 pt-4 border-t border-[#F3F4F6]">
        <Link
          href="/orders/track"
          onClick={onClose}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-[#374151] hover:bg-[#F5F5F7] transition-colors duration-150"
        >
          <Package className="h-3.5 w-3.5 text-[#6B7280]" />
          Track my order
        </Link>
      </div>
    </div>
  );
}

/* ── Main Navbar ──────────────────────────────────────────────────── */
export function Navbar() {
  const pathname    = usePathname();
  const { data: session } = useSession();
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mounted,     setMounted]     = useState(false);

  const accountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toggleCart, itemCount } = useCartStore();
  const count = mounted ? itemCount() : 0;

  useEffect(() => { setMounted(true); }, []);

  /* Keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen((o) => !o); }
      if (e.key === "Escape") { setAccountOpen(false); setMobileOpen(false); setSearchOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* Body scroll lock when mobile drawer is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const openAccount  = useCallback(() => { if (accountTimer.current) clearTimeout(accountTimer.current); setAccountOpen(true);  }, []);
  const closeAccount = useCallback(() => { accountTimer.current = setTimeout(() => setAccountOpen(false), 140); }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]) && href !== "/";

  const closeDrawer = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      {/* ════════════════════════════════════════════════════════
          MOBILE HEADER  (hidden on lg+)
      ════════════════════════════════════════════════════════ */}
      <header
        className="lg:hidden sticky top-0 left-0 right-0 z-[200] flex flex-col"
        style={{ background: "#0D0D0D" }}
      >
        {/* Row 1 — 60px: Menu | Logo (center) | Account | Wishlist | Cart */}
        <div className="flex items-center px-3 gap-1" style={{ height: "60px" }}>

          {/* Hamburger */}
          <button
            className="flex h-11 w-11 items-center justify-center rounded-xl text-white/70 hover:text-white active:bg-white/10 transition-colors duration-150"
            onClick={() => setMobileOpen((p) => !p)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-drawer"
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen
                ? <motion.span key="x"  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90,  opacity: 0 }} transition={{ duration: 0.14 }}><X    className="h-5 w-5" /></motion.span>
                : <motion.span key="m"  initial={{ rotate:  90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.14 }}><Menu className="h-5 w-5" /></motion.span>
              }
            </AnimatePresence>
          </button>

          {/* Logo — centered */}
          <Link href="/" className="flex-1 flex items-center justify-center gap-2" aria-label="TRYBY home">
            <img src="/brand/tryby-icon.png" alt="" aria-hidden="true" width={32} height={32}
              style={{ width: "32px", height: "32px", objectFit: "contain" }} fetchPriority="high" />
            <span
              className="text-white font-black hidden min-[360px]:block"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", letterSpacing: "0.12em", lineHeight: 1 }}
            >
              TRYBY
            </span>
          </Link>

          {/* Account */}
          <Link href={session?.user ? "/account" : "/auth/login"} className="flex h-11 w-11 items-center justify-center rounded-xl text-white/70 hover:text-white active:bg-white/10 transition-colors" aria-label="Account">
            <User className="h-[18px] w-[18px]" />
          </Link>

          {/* Notifications */}
          <div className="text-white/70">
            <NotificationBell />
          </div>

          {/* Wishlist */}
          <Link href="/wishlist" className="flex h-11 w-11 items-center justify-center rounded-xl text-white/70 hover:text-white active:bg-white/10 transition-colors" aria-label="Wishlist">
            <Heart className="h-[18px] w-[18px]" />
          </Link>

          {/* Cart */}
          <button
            onClick={toggleCart}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl text-white/70 hover:text-white active:bg-white/10 transition-colors"
            aria-label={`Cart${count > 0 ? `, ${count} items` : ""}`}
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span key={count} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-[#0D0D0D]"
                  style={{ background: "#F5C518" }}
                >
                  {count > 9 ? "9+" : count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Row 2 — search bar — HIDDEN when drawer is open (prevents double search) */}
        <AnimatePresence initial={false}>
          {!mobileOpen && (
            <motion.div
              key="header-search"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-full flex items-center rounded-full px-4 text-left transition-all duration-150 active:opacity-80"
                  style={{
                    height: "48px",
                    background: "rgba(255,255,255,0.09)",
                    border: "1px solid rgba(255,255,255,0.11)",
                  }}
                  aria-label="Open search"
                >
                  <span className="text-[13.5px] flex-1 truncate" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.02em" }}>
                    Search jerseys, accessories &amp; more...
                  </span>
                  <Search className="h-4 w-4 shrink-0 ml-2" style={{ color: "rgba(255,255,255,0.35)" }} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ════════════════════════════════════════════════════════
          DESKTOP HEADER  (hidden below lg)
      ════════════════════════════════════════════════════════ */}
      <header className="hidden lg:block sticky top-0 left-0 right-0 z-[200]" style={{ background: "#0D0D0D", height: "64px" }}>
        <div className="max-w-[1440px] mx-auto px-6 lg:px-8 h-full flex items-center gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="TRYBY home">
            <img src="/brand/tryby-icon.png" alt="" aria-hidden="true" width={44} height={44}
              style={{ width: "44px", height: "44px", objectFit: "contain" }} fetchPriority="high" />
            <div className="flex flex-col leading-none">
              <span className="text-white font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "26px", letterSpacing: "0.12em", lineHeight: 1 }}>
                TRYBY
              </span>
              <span className="hidden xl:block text-white/50 font-semibold uppercase mt-[3px]" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "9px", letterSpacing: "0.26em" }}>
                SPORTS STORE
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="flex items-center gap-0.5 h-full shrink-0" aria-label="Main navigation">
            {NAV_ITEMS.map(({ label, href }) => {
              const active = isActive(href);
              return (
                <Link key={label} href={href}
                  className={cn("relative flex items-center h-full px-3 xl:px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150",
                    active ? "text-white" : "text-white/60 hover:text-white")}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}
                >
                  {label}
                  {active && (
                    <motion.span layoutId="nav-active" className="absolute bottom-0 inset-x-3 xl:inset-x-3.5 h-[2px] rounded-full"
                      style={{ background: "#F5C518" }} transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Search */}
          <div className="flex-1 flex items-center justify-center px-4">
            <button onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2 rounded-full bg-white/10 border border-white/15 hover:bg-white/15 hover:border-white/25 px-3 h-9 text-left transition-all duration-150"
              aria-label="Open search"
            >
              <Search className="h-3.5 w-3.5 text-white/40 shrink-0" />
              <span className="text-[13px] text-white/35 flex-1 truncate">Search jerseys, accessories &amp; more…</span>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="relative" onMouseEnter={openAccount} onMouseLeave={closeAccount}>
              <button className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-white/60 hover:text-white transition-colors" aria-label="Account" aria-expanded={accountOpen}>
                <User className="h-4 w-4" />
                <span className="hidden xl:block text-[13px] font-semibold" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>Account</span>
              </button>
              <AnimatePresence>
                {accountOpen && (
                  <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: "easeOut" }} onMouseEnter={openAccount} onMouseLeave={closeAccount}
                    className="absolute top-full right-0 mt-1 rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.18)] overflow-hidden" role="menu"
                  >
                    <AccountDropdown onClose={() => setAccountOpen(false)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/wishlist" className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-white/60 hover:text-white transition-colors" aria-label="Wishlist">
              <Heart className="h-4 w-4" />
              <span className="hidden xl:block text-[13px] font-semibold" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>Wishlist</span>
            </Link>

            <button onClick={toggleCart}
              className="relative flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-white/60 hover:text-white transition-colors"
              aria-label={`Cart${count > 0 ? `, ${count} items` : ""}`}
            >
              <ShoppingCart className="h-4 w-4" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span key={count} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="absolute -top-0.5 left-5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-[#0D0D0D]"
                    style={{ background: "#F5C518" }}
                  >
                    {count > 9 ? "9+" : count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════
          MOBILE DRAWER
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-[190] lg:hidden"
              style={{ background: "rgba(0,0,0,0.65)" }}
              onClick={closeDrawer}
              aria-hidden="true"
            />

            {/* Drawer panel */}
            <motion.div
              id="mobile-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="fixed top-0 left-0 bottom-0 z-[195] flex flex-col lg:hidden overflow-hidden"
              style={{ width: "min(85vw, 360px)", background: "#0D0D0D" }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >

              {/* ── Drawer header ── */}
              <div
                className="flex items-center justify-between px-4 shrink-0"
                style={{ height: "64px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
              >
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5" onClick={closeDrawer} aria-label="TRYBY home">
                  <img src="/brand/tryby-icon.png" alt="" aria-hidden="true" width={34} height={34}
                    style={{ width: "34px", height: "34px", objectFit: "contain" }} />
                  <span className="text-white font-black"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", letterSpacing: "0.12em", lineHeight: 1 }}>
                    TRYBY
                  </span>
                </Link>

                {/* Close button — 44×44 tap target */}
                <button
                  onClick={closeDrawer}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white/50 hover:text-[#F5C518] hover:bg-white/08 active:bg-white/12 transition-colors duration-150"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* ── Sticky search inside drawer (ONLY search visible) ── */}
              <div className="px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <button
                  onClick={() => { closeDrawer(); setSearchOpen(true); }}
                  className="w-full flex items-center gap-3 rounded-full px-4 text-left transition-colors duration-150 hover:border-white/20"
                  style={{
                    height: "48px",
                    background: "#1A1A1A",
                    border: "1px solid #2A2A2A",
                  }}
                  aria-label="Open search"
                >
                  <Search className="h-4 w-4 shrink-0" style={{ color: "rgba(255,255,255,0.35)" }} />
                  <span className="text-[14px] flex-1 truncate" style={{ color: "rgba(255,255,255,0.32)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.03em" }}>
                    Search jerseys, teams, accessories...
                  </span>
                </button>
              </div>

              {/* ── Scrollable content ── */}
              <div className="flex-1 overflow-y-auto overscroll-contain">

                {/* Navigation links */}
                <nav className="py-2" aria-label="Mobile navigation">
                  {NAV_ITEMS.map(({ emoji, label, href }) => {
                    const active = isActive(href);
                    return (
                      <Link
                        key={label}
                        href={href}
                        onClick={closeDrawer}
                        className={cn(
                          "flex items-center gap-3.5 px-5 transition-all duration-150 active:bg-white/05",
                          active
                            ? "text-[#F5C518] bg-[#F5C518]/08"
                            : "text-white/75 hover:text-white hover:bg-white/05"
                        )}
                        style={{
                          height: "52px",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: "16px",
                          letterSpacing: "0.04em",
                          fontWeight: 700,
                        }}
                        aria-current={active ? "page" : undefined}
                      >
                        {/* Active indicator bar */}
                        {active && (
                          <span className="absolute left-0 w-[3px] h-8 rounded-r-full" style={{ background: "#F5C518" }} />
                        )}
                        <span className="text-[18px] shrink-0 leading-none" aria-hidden="true">{emoji}</span>
                        {label}
                        {active && <span className="ml-auto text-[#F5C518]/60 text-[12px]">●</span>}
                      </Link>
                    );
                  })}
                </nav>

                {/* Divider */}
                <div className="mx-4 my-3" style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />

                {/* Quick actions */}
                <div className="px-4 pb-2">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.14em] mb-2 px-1"
                    style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    Quick Access
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_ACTIONS.map(({ icon: Icon, label, href }) => (
                      <Link
                        key={label}
                        href={href}
                        onClick={closeDrawer}
                        className="flex items-center gap-2.5 rounded-xl px-3.5 transition-colors duration-150 hover:bg-white/08 active:bg-white/10"
                        style={{
                          height: "48px",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <Icon className="h-4 w-4 shrink-0" style={{ color: "#F5C518" }} />
                        <span
                          className="text-white/80 font-semibold text-[13px] leading-tight"
                          style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.03em" }}
                        >
                          {label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Bottom padding */}
                <div style={{ height: "24px" }} />
              </div>

              {/* ── Footer CTA — always visible at bottom ── */}
              <div
                className="px-4 py-4 shrink-0"
                style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
              >
                {session?.user ? (
                  <>
                    <Link
                      href="/account"
                      onClick={closeDrawer}
                      className="flex w-full items-center justify-center h-12 rounded-xl font-black text-[#0D0D0D] transition-opacity duration-150 hover:opacity-90 active:scale-[0.98]"
                      style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px", letterSpacing: "0.08em", boxShadow: "0 4px 16px rgba(245,197,24,0.3)" }}
                    >
                      MY ACCOUNT
                    </Link>
                    <button
                      onClick={() => { closeDrawer(); signOut({ callbackUrl: "/" }); }}
                      className="flex w-full items-center justify-center h-10 mt-2 rounded-xl font-semibold text-[13px] text-white/50 hover:text-white transition-colors"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      onClick={closeDrawer}
                      className="flex w-full items-center justify-center h-12 rounded-xl font-black text-[#0D0D0D] transition-opacity duration-150 hover:opacity-90 active:scale-[0.98]"
                      style={{ background: "#F5C518", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px", letterSpacing: "0.08em", boxShadow: "0 4px 16px rgba(245,197,24,0.3)" }}
                    >
                      SIGN IN / CREATE ACCOUNT
                    </Link>
                    <p className="mt-2 text-center text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                      India&apos;s Premium Jersey Destination
                    </p>
                  </>
                )}
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CartDrawer />
      <SearchPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
