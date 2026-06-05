"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, ShoppingBag, BarChart2,
  Wallet, User, LogOut, ChevronRight, Store, Bell, FileText,
  MessageSquare, ScrollText, IndianRupee, Truck, RotateCcw,
} from "lucide-react";
import { PanelThemeToggle } from "@/components/ui/panel-theme-toggle";
import { useThemeColors } from "@/components/providers/panel-theme-provider";
import { cn } from "@/lib/cn";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/supplier/dashboard",      icon: LayoutDashboard, label: "Dashboard"      },
  { href: "/supplier/products",       icon: Package,         label: "Products"       },
  { href: "/supplier/orders",         icon: ShoppingBag,     label: "Orders"         },
  { href: "/supplier/shipping",       icon: Truck,           label: "Shipping"       },
  { href: "/supplier/returns",        icon: RotateCcw,       label: "Returns"        },
  { href: "/supplier/analytics",      icon: BarChart2,       label: "Analytics"      },
  { href: "/supplier/settlements",    icon: IndianRupee,     label: "Settlements"    },
  { href: "/supplier/wallet",         icon: IndianRupee,     label: "Wallet"         },
  { href: "/supplier/reports",        icon: FileText,        label: "Reports"        },
  { href: "/supplier/payouts",        icon: Wallet,          label: "Payouts"        },
  { href: "/supplier/documents",      icon: FileText,        label: "Documents"      },
  { href: "/supplier/tickets",        icon: MessageSquare,   label: "Support"        },
  { href: "/supplier/agreements",     icon: ScrollText,      label: "Agreements"     },
  { href: "/supplier/notifications",  icon: Bell,            label: "Notifications", badge: true },
  { href: "/supplier/profile",        icon: User,            label: "Profile"        },
];

export function SupplierSidebar() {
  const pathname = usePathname();
  const t        = useThemeColors();
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread]       = useState(0);

  useEffect(() => {
    fetch("/api/supplier/notifications?page=1")
      .then(r => r.json())
      .then(d => setUnread(d.unreadCount ?? 0))
      .catch(() => {});
  }, []);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const FF = { fontFamily: "'Barlow Condensed', sans-serif" };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-200"
        style={{ width: collapsed ? "60px" : "220px", background: t.bg, borderRight: `1px solid ${t.border}` }}>

        {/* Brand */}
        <div className="flex items-center px-4 border-b shrink-0 overflow-hidden"
          style={{ height: "56px", borderColor: t.border }}>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
            style={{ background: "rgba(245,197,24,0.15)" }}>
            <Store className="h-4 w-4 text-[#F5C518]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-none ml-2.5">
              <span className="font-black" style={{ ...FF, fontSize: "16px", letterSpacing: "0.12em", color: t.text }}>
                TRYBY
              </span>
              <span style={{ ...FF, fontSize: "7px", letterSpacing: "0.22em", color: t.text4 }}>
                SUPPLIER
              </span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <PanelThemeToggle collapsed={collapsed} />
            <button onClick={() => setCollapsed(c => !c)}
              className="flex h-6 w-6 items-center justify-center rounded transition-colors"
              style={{ color: t.text4 }}>
              <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", collapsed ? "" : "rotate-180")} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
            const active    = isActive(href);
            const showBadge = badge && unread > 0;
            return (
              <Link key={href} href={href} title={collapsed ? label : undefined}
                className={cn("flex items-center rounded-xl transition-all duration-150",
                  collapsed ? "justify-center h-9 w-9 mx-auto" : "gap-2.5 px-3 h-9")}
                style={active ? { background: "#F5C518", color: "#0D0D0D" } : { color: t.text3 }}
                onMouseEnter={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = t.hover; el.style.color = t.text; } }}
                onMouseLeave={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = t.text3; } }}
              >
                <div className="relative shrink-0">
                  <Icon className="h-[15px] w-[15px]" />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-black"
                      style={{ background: "#F5C518", color: "#0D0D0D" }}>
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <span className="flex-1" style={{ ...FF, fontSize: "13px", letterSpacing: "0.03em", fontWeight: 600 }}>
                    {label}
                  </span>
                )}
                {!collapsed && showBadge && (
                  <span className="ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-black"
                    style={{ background: "#F5C518", color: "#0D0D0D" }}>
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 pb-4 border-t pt-3 space-y-0.5" style={{ borderColor: t.border }}>
          <Link href="/" title={collapsed ? "Back to Store" : undefined}
            className={cn("flex items-center rounded-xl transition-all duration-150",
              collapsed ? "justify-center h-9 w-9 mx-auto" : "gap-2.5 px-3 h-9")}
            style={{ color: t.text4 }}>
            <LogOut className="h-[15px] w-[15px] shrink-0" />
            {!collapsed && <span style={{ ...FF, fontSize: "13px", letterSpacing: "0.03em", fontWeight: 600 }}>Back to Store</span>}
          </Link>
          <button onClick={() => signOut({ callbackUrl: "/supplier/login" })}
            title={collapsed ? "Sign out" : undefined}
            className={cn("w-full flex items-center rounded-xl transition-all duration-150",
              collapsed ? "justify-center h-9 w-9 mx-auto" : "gap-2.5 px-3 h-9")}
            style={{ color: t.text4 }}>
            <LogOut className="h-[15px] w-[15px] shrink-0 rotate-180" />
            {!collapsed && <span style={{ ...FF, fontSize: "13px", letterSpacing: "0.03em", fontWeight: 600 }}>Sign out</span>}
          </button>
          {!collapsed && <p className="px-3 pt-1" style={{ fontSize: "9px", color: t.text5 }}>v1.0 · TRYBY Supplier</p>}
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[300] flex items-center gap-3 px-4"
        style={{ height: "52px", background: t.bg, borderBottom: `1px solid ${t.border}` }}
      >
        <Store className="h-5 w-5 text-[#F5C518]" />
        <span className="font-black"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px", letterSpacing: "0.12em", color: t.text }}>
          TRYBY SUPPLIER
        </span>
        <div className="ml-auto flex items-center gap-3">
          {NAV_ITEMS.map(({ href, icon: Icon }) => (
            <Link key={href} href={href} className={cn("text-white/40 hover:text-white", isActive(href) && "text-[#F5C518]")}>
              <Icon className="h-4 w-4" />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
