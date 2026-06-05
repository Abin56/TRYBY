"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Star,
  Tag, BarChart3, Settings, ChevronLeft, ChevronRight,
  ExternalLink, FileText, Image, Search, Megaphone,
  Boxes, RotateCcw, Headphones, TrendingUp, Truck, PanelTop,
  ShieldCheck, ScrollText, Activity, ClipboardCheck, Zap,
  Send, ShoppingBag, Bell,
} from "lucide-react";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/cn";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard",  href: "/admin",           icon: LayoutDashboard },
      { label: "Analytics",  href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Store",
    items: [
      { label: "Products",   href: "/admin/products",  icon: Package },
      { label: "Orders",     href: "/admin/orders",    icon: ShoppingCart },
      { label: "Customers",  href: "/admin/customers", icon: Users },
      { label: "Inventory",  href: "/admin/inventory", icon: Boxes },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Homepage",   href: "/admin/homepage",  icon: PanelTop },
      { label: "Content",    href: "/admin/content",   icon: FileText },
      { label: "Media",      href: "/admin/media",     icon: Image },
      { label: "SEO",        href: "/admin/seo",       icon: Search },
      { label: "SEO Audit",        href: "/admin/seo-audit",        icon: ClipboardCheck },
      { label: "Conversion Audit",  href: "/admin/conversion-audit",          icon: Zap       },
      { label: "Marketing",         href: "/admin/marketing",                  icon: Megaphone },
      { label: "↳ Campaigns",       href: "/admin/marketing/campaigns",        icon: Send      },
      { label: "↳ Abandoned Cart",  href: "/admin/marketing/abandoned-cart",   icon: ShoppingBag},
      { label: "↳ Mkt Analytics",   href: "/admin/marketing/analytics",        icon: BarChart3 },
      { label: "Notifications",     href: "/admin/notifications",              icon: Bell      },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Coupons",    href: "/admin/coupons",   icon: Tag },
      { label: "Reviews",    href: "/admin/reviews",   icon: Star },
      { label: "Returns",    href: "/admin/returns",   icon: RotateCcw },
      { label: "Suppliers",  href: "/admin/suppliers", icon: Truck },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Profit",     href: "/admin/profit",    icon: TrendingUp },
      { label: "Retention",  href: "/admin/retention", icon: RotateCcw  },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Support",    href: "/admin/support",   icon: Headphones },
      { label: "Settings",   href: "/admin/settings",  icon: Settings },
      { label: "Users",      href: "/admin/users",     icon: ShieldCheck },
      { label: "Audit Log",  href: "/admin/audit",     icon: ScrollText },
      { label: "System",     href: "/admin/system",    icon: Activity },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const w = sidebarCollapsed ? 64 : 240;

  return (
    <motion.aside
      animate={{ width: w }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 bottom-0 z-[100] flex flex-col bg-[#0D0D0D] overflow-hidden"
      style={{ boxShadow: "4px 0 24px rgba(0,0,0,0.25)" }}
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center border-b border-white/[0.06] px-4">
        <Link href="/admin" className="flex items-center gap-3 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E8FF47] shadow-[0_0_12px_rgba(232,255,71,0.35)]">
            <span className="text-[10px] font-black text-black leading-none">T</span>
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                <p className="text-sm font-black text-white tracking-tight truncate leading-none">TRYBY</p>
                <p className="text-[10px] text-white/35 truncate leading-none mt-0.5">Admin Console</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-5 scrollbar-none">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/25"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="px-2 space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-150 cursor-pointer group",
                        active
                          ? "bg-[#E8FF47]/10 text-[#E8FF47]"
                          : "text-white/45 hover:text-white hover:bg-white/[0.05]"
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-[#E8FF47]"
                        />
                      )}
                      <Icon className="h-4 w-4 shrink-0" />
                      <AnimatePresence>
                        {!sidebarCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.12 }}
                            className="flex-1 text-sm font-medium truncate"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {sidebarCollapsed && (
                        <div className="absolute left-full ml-3 hidden group-hover:flex items-center rounded-lg bg-[#1A1A1A] border border-white/10 px-2.5 py-1.5 shadow-lg whitespace-nowrap z-50">
                          <span className="text-xs font-medium text-white">{item.label}</span>
                        </div>
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/[0.06] p-3 space-y-1">
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-xs text-white/35 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>View Store</span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8FF47] text-xs font-black text-black">
            AD
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">Admin</p>
                <p className="text-[10px] text-white/35 truncate">admin@tryby.in</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute right-0 flex h-5 w-5 items-center justify-center rounded-full border border-[#2A2A2A] bg-[#1A1A1A] text-white/50 hover:text-white hover:bg-[#2A2A2A] transition-all shadow-md z-10"
        style={{ top: "52px", transform: "translate(50%, -50%)" }}
      >
        {sidebarCollapsed
          ? <ChevronRight className="h-3 w-3" />
          : <ChevronLeft className="h-3 w-3" />
        }
      </button>
    </motion.aside>
  );
}
