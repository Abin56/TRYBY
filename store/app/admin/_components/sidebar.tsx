"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  Settings, LogOut, ChevronRight, FileText,
  Image as ImageIcon, Megaphone, Tag, BarChart2,
  Search, Layers, Home, TrendingUp, CreditCard, Store,
  Wallet, CheckSquare, Database, Rocket, Truck,
  Trophy, Percent, MessageSquare, Shield, Zap,
  Boxes, Archive, Heart, Link2, Download, RefreshCw,
  Warehouse, ClipboardList, ArrowLeftRight, Inbox, SendHorizonal,
  Star, PieChart, AlertTriangle, Terminal, Bell, IndianRupee, RotateCcw, Plug,
  UserCog, BookOpen, MonitorPlay, Crown,
  ShieldAlert, Ban, Eye,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useState } from "react";
import { PanelThemeToggle } from "@/components/ui/panel-theme-toggle";
import { useThemeColors } from "@/components/providers/panel-theme-provider";

function useSidebarTheme() { return { t: useThemeColors() }; }

/* ── Nav structure ───────────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: null,
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard",  exact: true },
    ],
  },
  {
    label: "CONTENT",
    items: [
      { href: "/admin/content/homepage",      icon: Home,       label: "Homepage"      },
      { href: "/admin/content/announcements", icon: Megaphone,  label: "Announcements" },
      { href: "/admin/content/pages",         icon: FileText,   label: "Pages"         },
    ],
  },
  {
    label: "CATALOGUE",
    items: [
      { href: "/admin/products",              icon: Package,    label: "Products"     },
      { href: "/admin/inventory",              icon: Boxes,           label: "Inventory"       },
      { href: "/admin/inventory/sync",         icon: RefreshCw,       label: "Stock Sync"      },
      { href: "/admin/inventory/sync-logs",    icon: BarChart2,       label: "Sync Logs"       },
      { href: "/admin/inventory/transfers",    icon: ArrowLeftRight,  label: "Transfers"       },
      { href: "/admin/warehouses",             icon: Warehouse,       label: "Warehouses"      },
      { href: "/admin/purchase-orders",        icon: ClipboardList,   label: "Purchase Orders" },
      { href: "/admin/products/search",      icon: Search,     label: "Search"       },
      { href: "/admin/products/health",      icon: Heart,      label: "Health"       },
      { href: "/admin/products/archive",     icon: Archive,    label: "Archive"      },
      { href: "/admin/products/supplier-map",icon: Link2,      label: "Suppliers"    },
      { href: "/admin/products/supplier-sku",icon: Layers,     label: "SKU Mappings" },
      { href: "/admin/media",                icon: ImageIcon,  label: "Media"        },
      { href: "/admin/categories",           icon: Layers,     label: "Categories"   },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { href: "/admin/orders",              icon: ShoppingBag,   label: "Orders"    },
      { href: "/admin/returns",             icon: RotateCcw,     label: "Returns"   },
      { href: "/admin/warehouses/receiving",icon: Inbox,         label: "Receiving"  },
      { href: "/admin/warehouses/dispatch", icon: SendHorizonal, label: "Dispatch"   },
      { href: "/admin/shipping",            icon: Truck,         label: "Shipping"   },
      { href: "/admin/settings/shipping/integrations", icon: Plug, label: "Courier APIs" },
      { href: "/admin/payments",            icon: CreditCard,    label: "Payments"   },
      { href: "/admin/customers",           icon: Users,         label: "Customers"  },
    ],
  },
  {
    label: "MARKETING",
    items: [
      { href: "/admin/marketing/coupons", icon: Tag,      label: "Coupons" },
      { href: "/admin/marketing/banners", icon: Megaphone,label: "Banners" },
    ],
  },
  {
    label: "SUPPLIERS",
    items: [
      { href: "/admin/suppliers",            icon: Store,          label: "Suppliers"        },
      { href: "/admin/suppliers/leaderboard",icon: Trophy,         label: "Leaderboard"      },
      { href: "/admin/suppliers/commission", icon: Percent,        label: "Commission Rules" },
      { href: "/admin/supplier-products",    icon: CheckSquare,    label: "Product Queue"    },
      { href: "/admin/payouts",              icon: Wallet,         label: "Payouts"          },
      { href: "/admin/supplier-settlements", icon: IndianRupee,    label: "Settlements"      },
      { href: "/admin/tickets",              icon: MessageSquare,  label: "Tickets"          },
    ],
  },
  {
    label: "REVIEWS",
    items: [
      { href: "/admin/reviews",          icon: Star,      label: "Moderation"  },
      { href: "/admin/review-analytics", icon: PieChart,  label: "Analytics"   },
    ],
  },
  {
    label: "CUSTOMER SUCCESS",
    items: [
      { href: "/admin/crm",                  icon: UserCog,     label: "CRM Dashboard"   },
      { href: "/admin/crm/customers",        icon: Users,       label: "Customers"        },
      { href: "/admin/crm/tickets",          icon: MessageSquare, label: "Support Tickets" },
      { href: "/admin/crm/segments",         icon: Layers,      label: "Segments & Tags"  },
      { href: "/admin/crm/analytics",        icon: BarChart2,   label: "CRM Analytics"   },
    ],
  },
  {
    label: "FRAUD & RISK",
    items: [
      { href: "/admin/fraud",                icon: ShieldAlert, label: "Risk Center"     },
      { href: "/admin/fraud/customers",      icon: Users,       label: "Customer Risk"   },
      { href: "/admin/fraud/orders",         icon: ShoppingBag, label: "Order Risk"      },
      { href: "/admin/fraud/cod",            icon: Ban,         label: "COD Abuse"       },
      { href: "/admin/fraud/refunds",        icon: RotateCcw,   label: "Refund Abuse"    },
      { href: "/admin/fraud/blacklist",      icon: Shield,      label: "Blacklist"       },
      { href: "/admin/fraud/supplier-risk",  icon: Truck,       label: "Supplier Risk"   },
      { href: "/admin/fraud/audit",          icon: Eye,         label: "Audit Logs"      },
    ],
  },
  {
    label: "REPORTS",
    items: [
      { href: "/admin/finance",            icon: IndianRupee,label: "Finance Center"  },
      { href: "/admin/business",          icon: Zap,        label: "Intelligence"    },
      { href: "/admin/reports/kpi",       icon: BarChart2,  label: "Business KPIs"   },
      { href: "/admin/reports/sales",     icon: IndianRupee,label: "Sales Report"    },
      { href: "/admin/reports/profit",    icon: TrendingUp, label: "Profit Report"   },
      { href: "/admin/reports/suppliers", icon: Store,      label: "Suppliers"       },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { href: "/admin/catalog-center",              icon: PieChart,   label: "Catalog Center"      },
      { href: "/admin/products/performance",        icon: TrendingUp, label: "Product Perf"        },
      { href: "/admin/suppliers/performance",       icon: Store,      label: "Supplier Perf"       },
      { href: "/admin/profit",                      icon: TrendingUp, label: "Profit"              },
      { href: "/admin/seo",                         icon: Search,     label: "SEO"                 },
      { href: "/admin/analytics",                   icon: BarChart2,  label: "Analytics"           },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { href: "/admin/system/platform",             icon: PieChart,    label: "Platform Audit"      },
      { href: "/admin/security",                    icon: Shield,      label: "Security"             },
      { href: "/admin/system/maintenance",          icon: AlertTriangle, label: "Maintenance"        },
      { href: "/admin/system/feature-flags",        icon: Zap,         label: "Feature Flags"        },
      { href: "/admin/system/settings-center",      icon: Settings,    label: "Settings"             },
      { href: "/admin/system/environment",          icon: Terminal,    label: "Environment"          },
      { href: "/admin/system/jobs",                 icon: ClipboardList, label: "Jobs"               },
      { href: "/admin/system/notifications",        icon: Bell,        label: "Alerts"               },
      { href: "/admin/system/export",               icon: Download,    label: "Export"               },
      { href: "/admin/system/services",             icon: CheckSquare, label: "Services"             },
      { href: "/admin/system/launch-checklist",     icon: Rocket,      label: "Launch Checklist"     },
      { href: "/admin/system/backups",              icon: Database,    label: "DB & Backups"         },
    ],
  },
  {
    label: "SUPER ADMIN",
    items: [
      { href: "/admin/super",    icon: Crown,      label: "Platform Overview" },
      { href: "/admin/team",     icon: UserCog,    label: "Admin Team"        },
      { href: "/admin/audit",    icon: BookOpen,   label: "Audit Center"      },
      { href: "/admin/sessions", icon: MonitorPlay,label: "Sessions"          },
    ],
  },
];

export function AdminSidebar() {
  const pathname  = usePathname();
  const { t }     = useSidebarTheme();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-200"
        style={{ width: collapsed ? "60px" : "220px", background: t.bg, borderRight: `1px solid ${t.border}` }}
      >
        {/* Brand */}
        <div className="flex items-center px-4 border-b shrink-0 overflow-hidden"
          style={{ height: "56px", borderColor: t.border }}>
          <img src="/brand/tryby-icon.png" alt="" width={26} height={26}
            style={{ width: 26, height: 26, objectFit: "contain", flexShrink: 0 }} />
          {!collapsed && (
            <div className="flex flex-col leading-none ml-2.5">
              <span className="font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", letterSpacing: "0.12em", color: t.text }}>
                TRYBY
              </span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "7px", letterSpacing: "0.22em", color: t.text4 }}>
                ADMIN
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
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-hide">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-3" : ""}>
              {group.label && !collapsed && (
                <p className="px-4 mb-1 text-[9px] font-bold tracking-[0.18em] uppercase"
                  style={{ color: t.text5, fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {group.label}
                </p>
              )}
              {group.label && collapsed && <div className="mx-3 mb-1 h-px" style={{ background: t.border }} />}
              <div className="px-2 space-y-0.5">
                {group.items.map((item) => {
                  const exact  = "exact" in item ? item.exact : false;
                  const { href, icon: Icon, label } = item;
                  const active = isActive(href, exact);
                  return (
                    <Link key={href} href={href} title={collapsed ? label : undefined}
                      className={cn("flex items-center rounded-xl transition-all duration-150",
                        collapsed ? "justify-center h-9 w-9 mx-auto" : "gap-2.5 px-3 h-9")}
                      style={active
                        ? { background: "#F5C518", color: "#0D0D0D" }
                        : { color: t.text3 }}
                      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = t.hover; (e.currentTarget as HTMLElement).style.color = t.text; } }}
                      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = t.text3; } }}
                    >
                      <Icon className="h-[15px] w-[15px] shrink-0" />
                      {!collapsed && (
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", letterSpacing: "0.03em", fontWeight: 600 }}>
                          {label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 pb-4 border-t pt-3 space-y-0.5" style={{ borderColor: t.border }}>
          <Link href="/admin/settings" title={collapsed ? "Settings" : undefined}
            className={cn("flex items-center rounded-xl transition-all duration-150",
              collapsed ? "justify-center h-9 w-9 mx-auto" : "gap-2.5 px-3 h-9")}
            style={{ color: t.text3 }}>
            <Settings className="h-[15px] w-[15px] shrink-0" />
            {!collapsed && <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", letterSpacing: "0.03em", fontWeight: 600 }}>Settings</span>}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            title={collapsed ? "Sign out" : undefined}
            className={cn("w-full flex items-center rounded-xl transition-all duration-150",
              collapsed ? "justify-center h-9 w-9 mx-auto" : "gap-2.5 px-3 h-9")}
            style={{ color: t.text4 }}>
            <LogOut className="h-[15px] w-[15px] shrink-0" />
            {!collapsed && <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", letterSpacing: "0.03em", fontWeight: 600 }}>Sign out</span>}
          </button>
          {!collapsed && <p className="px-3 pt-1" style={{ fontSize: "9px", color: t.text5 }}>v1.0 · TRYBY Admin</p>}
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[300] flex items-center gap-3 px-4"
        style={{ height: "52px", background: t.bg, borderBottom: `1px solid ${t.border}` }}>
        <img src="/brand/tryby-icon.png" alt="" width={24} height={24} style={{ width: 24, height: 24, objectFit: "contain" }} />
        <span className="font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px", letterSpacing: "0.12em", color: t.text }}>
          TRYBY ADMIN
        </span>
        <Link href="/" className="ml-auto text-[12px] font-semibold" style={{ color: t.text3 }}>
          ← Store
        </Link>
      </div>
    </>
  );
}
