"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, ChevronRight, Plus, LogOut } from "lucide-react";
import { useUIStore } from "@/store/ui";

const STORE_API = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

type AdminRole = "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "CONTENT_MANAGER" | "ORDER_MANAGER" | "SUPPORT_AGENT";

interface SessionUser {
  id: string; name?: string; email?: string; image?: string; adminRole: AdminRole | null;
}

const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin", ADMIN: "Admin",
  PRODUCT_MANAGER: "Product Manager", CONTENT_MANAGER: "Content Manager",
  ORDER_MANAGER: "Order Manager", SUPPORT_AGENT: "Support Agent",
};

const ROLE_COLORS: Record<AdminRole, string> = {
  SUPER_ADMIN: "#D97706", ADMIN: "#7C3AED", PRODUCT_MANAGER: "#2563EB",
  CONTENT_MANAGER: "#059669", ORDER_MANAGER: "#BE185D", SUPPORT_AGENT: "#6B7280",
};

const BREADCRUMBS: Record<string, string> = {
  "/admin": "Dashboard", "/admin/products": "Products", "/admin/orders": "Orders",
  "/admin/customers": "Customers", "/admin/reviews": "Reviews", "/admin/coupons": "Coupons",
  "/admin/analytics": "Analytics", "/admin/profit": "Profit Engine", "/admin/returns": "Returns",
  "/admin/inventory": "Inventory", "/admin/content": "Content", "/admin/homepage": "Homepage Builder",
  "/admin/media": "Media Studio", "/admin/seo": "SEO Manager", "/admin/marketing": "Marketing",
  "/admin/suppliers": "Suppliers", "/admin/support": "Support", "/admin/settings": "Settings",
  "/admin/users": "Admin Users", "/admin/audit": "Audit Log", "/admin/system": "System Health",
};

const PAGE_ACTIONS: Record<string, string | undefined> = {
  "/admin/products": "Add Product",
  "/admin/coupons":  "Create Coupon",
  "/admin/users":    "Add Admin",
};

export function Topbar() {
  const pathname = usePathname() ?? "/admin";
  const { notificationCount, openProductDrawer } = useUIStore();
  const [user,     setUser]     = useState<SessionUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const pageLabel = BREADCRUMBS[pathname] ?? pathname.split("/").pop() ?? "Page";
  const action    = PAGE_ACTIONS[pathname];

  useEffect(() => {
    fetch(`${STORE_API}/api/admin/session`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then((d: SessionUser | null) => { if (d) setUser(d); })
      .catch(() => null);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "AD";

  const avatarColor = user?.adminRole ? ROLE_COLORS[user.adminRole] : "#111827";

  return (
    <header className="sticky top-0 z-[90] flex h-14 items-center justify-between border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm px-6 gap-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm min-w-0">
        <span className="text-[#9CA3AF] shrink-0 font-black tracking-widest text-xs"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          TRYBY
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-[#D1D5DB] shrink-0" />
        <span className="font-semibold text-[#111827] truncate">{pageLabel}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search */}
        <button className="hidden md:flex items-center gap-2.5 h-8 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-xs text-[#9CA3AF] hover:border-[#D1D5DB] hover:bg-white transition-all">
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
          <kbd className="rounded border border-[#E5E7EB] bg-white px-1 py-0.5 text-[10px] font-mono text-[#9CA3AF]">⌘K</kbd>
        </button>

        {/* Notifications */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F5F5F7] transition-all">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#EF4444] text-[9px] font-bold text-white">
              {notificationCount}
            </span>
          )}
        </button>

        {/* Page action */}
        {action && (
          <button
            onClick={() => { if (pathname === "/admin/products") openProductDrawer(); }}
            className="flex items-center gap-1.5 h-8 rounded-lg bg-[#111827] px-3 text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> {action}
          </button>
        )}

        {/* User avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-[#F5F5F7] transition-colors"
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white shrink-0"
              style={{ background: avatarColor }}
            >
              {initials}
            </div>
            {user && (
              <div className="hidden md:block text-left leading-none">
                <p className="text-xs font-semibold text-[#111827]">{user.name ?? user.email}</p>
                {user.adminRole && (
                  <p className="text-[10px] mt-0.5" style={{ color: avatarColor }}>
                    {ROLE_LABELS[user.adminRole]}
                  </p>
                )}
              </div>
            )}
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-[#E5E7EB] bg-white shadow-xl overflow-hidden">
                {user && (
                  <div className="px-4 py-3 border-b border-[#F3F4F6]">
                    <p className="text-xs font-semibold text-[#111827] truncate">{user.name ?? "—"}</p>
                    <p className="text-[10px] text-[#9CA3AF] truncate mt-0.5">{user.email}</p>
                    {user.adminRole && (
                      <span className="inline-block mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: avatarColor + "20", color: avatarColor }}>
                        {ROLE_LABELS[user.adminRole]}
                      </span>
                    )}
                  </div>
                )}
                <a
                  href={`${STORE_API}/api/auth/signout`}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-xs text-[#DC2626] hover:bg-[#FFF1F2] transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
