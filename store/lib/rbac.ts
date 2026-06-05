import { AdminRole, UserRole } from "@prisma/client";

// ─── Permission strings ────────────────────────────────────────────────────────
// Format: "resource:action"

export type Permission =
  // Products
  | "products:read"  | "products:write"  | "products:delete"
  // Orders
  | "orders:read"    | "orders:write"
  // Returns
  | "returns:read"   | "returns:write"
  // Customers
  | "customers:read" | "customers:write"
  // Content / CMS
  | "content:read"   | "content:write"   | "content:delete"
  // Media
  | "media:read"     | "media:write"     | "media:delete"
  // SEO
  | "seo:read"       | "seo:write"
  // Analytics
  | "analytics:read"
  // Profit (financial — restricted)
  | "profit:read"
  // Coupons & Marketing
  | "coupons:read"   | "coupons:write"   | "coupons:delete"
  | "marketing:read" | "marketing:write"
  // Settings (store-level — restricted)
  | "settings:read"  | "settings:write"
  // Suppliers & Payouts
  | "suppliers:read" | "suppliers:write"
  | "payouts:read"   | "payouts:write"
  // Inventory / Operations
  | "inventory:read" | "inventory:write"
  // Finance
  | "finance:read"   | "finance:write"
  // Team / Admin user management (SUPER_ADMIN only)
  | "team:read"      | "team:write"
  // Audit logs
  | "audit:read"
  // Sessions
  | "sessions:read"  | "sessions:write"
  // Risk & Fraud
  | "risk:read"      | "risk:write";

// ─── Role → default permissions ───────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: [
    "products:read",  "products:write",  "products:delete",
    "orders:read",    "orders:write",
    "returns:read",   "returns:write",
    "customers:read", "customers:write",
    "content:read",   "content:write",   "content:delete",
    "media:read",     "media:write",     "media:delete",
    "seo:read",       "seo:write",
    "analytics:read",
    "profit:read",
    "coupons:read",   "coupons:write",   "coupons:delete",
    "marketing:read", "marketing:write",
    "settings:read",  "settings:write",
    "suppliers:read", "suppliers:write",
    "payouts:read",   "payouts:write",
    "inventory:read", "inventory:write",
    "finance:read",   "finance:write",
    "team:read",      "team:write",
    "audit:read",
    "sessions:read",  "sessions:write",
    "risk:read",      "risk:write",
  ],

  ADMIN: [
    "products:read",  "products:write",
    "orders:read",    "orders:write",
    "returns:read",   "returns:write",
    "customers:read",
    "content:read",   "content:write",
    "media:read",     "media:write",     "media:delete",
    "seo:read",       "seo:write",
    "analytics:read",
    "profit:read",
    "coupons:read",   "coupons:write",
    "marketing:read",
    "suppliers:read",
    "inventory:read",
    "finance:read",
    "team:read",
    "audit:read",
    "sessions:read",
    "risk:read",      "risk:write",
  ],

  OPERATIONS_MANAGER: [
    "products:read",
    "orders:read",    "orders:write",
    "returns:read",   "returns:write",
    "customers:read",
    "inventory:read", "inventory:write",
    "suppliers:read",
    "analytics:read",
    "risk:read",      "risk:write",
  ],

  CONTENT_MANAGER: [
    "content:read",   "content:write",   "content:delete",
    "media:read",     "media:write",     "media:delete",
    "seo:read",       "seo:write",
    "products:read",
    "marketing:read",
  ],

  PRODUCT_MANAGER: [
    "products:read",  "products:write",
    "media:read",     "media:write",
    "inventory:read",
    "customers:read",
    "analytics:read",
  ],

  ORDER_MANAGER: [
    "orders:read",    "orders:write",
    "returns:read",   "returns:write",
    "customers:read",
    "products:read",
    "inventory:read",
    "risk:read",
  ],

  FINANCE_MANAGER: [
    "finance:read",   "finance:write",
    "profit:read",
    "payouts:read",   "payouts:write",
    "analytics:read",
    "orders:read",
    "suppliers:read",
  ],

  SUPPORT_AGENT: [
    "orders:read",
    "returns:read",   "returns:write",
    "customers:read",
    "products:read",
    "risk:read",
  ],

  SUPPLIER_MANAGER: [
    "suppliers:read", "suppliers:write",
    "payouts:read",
    "products:read",
    "inventory:read",
    "analytics:read",
  ],

  MARKETING_MANAGER: [
    "marketing:read", "marketing:write",
    "coupons:read",   "coupons:write",
    "content:read",
    "analytics:read",
    "customers:read",
    "products:read",
  ],
};

// ─── Role labels for UI ────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN:        "Super Admin",
  ADMIN:              "Admin",
  OPERATIONS_MANAGER: "Operations Manager",
  CONTENT_MANAGER:    "Content Manager",
  PRODUCT_MANAGER:    "Product Manager",
  ORDER_MANAGER:      "Order Manager",
  FINANCE_MANAGER:    "Finance Manager",
  SUPPORT_AGENT:      "Support Agent",
  SUPPLIER_MANAGER:   "Supplier Manager",
  MARKETING_MANAGER:  "Marketing Manager",
};

export const ROLE_COLORS: Record<AdminRole, { bg: string; text: string }> = {
  SUPER_ADMIN:        { bg: "#FEF3C7", text: "#D97706" },
  ADMIN:              { bg: "#EDE9FE", text: "#7C3AED" },
  OPERATIONS_MANAGER: { bg: "#FEE2E2", text: "#DC2626" },
  CONTENT_MANAGER:    { bg: "#D1FAE5", text: "#059669" },
  PRODUCT_MANAGER:    { bg: "#DBEAFE", text: "#2563EB" },
  ORDER_MANAGER:      { bg: "#FCE7F3", text: "#BE185D" },
  FINANCE_MANAGER:    { bg: "#ECFDF5", text: "#047857" },
  SUPPORT_AGENT:      { bg: "#F3F4F6", text: "#6B7280" },
  SUPPLIER_MANAGER:   { bg: "#FFF7ED", text: "#C2410C" },
  MARKETING_MANAGER:  { bg: "#F0FFFE", text: "#0D9488" },
};

// ─── Permission group metadata for UI permission editor ───────────────────────

export interface PermissionGroup {
  label:       string;
  permissions: Permission[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  { label: "Products",    permissions: ["products:read", "products:write", "products:delete"] },
  { label: "Orders",      permissions: ["orders:read", "orders:write"] },
  { label: "Returns",     permissions: ["returns:read", "returns:write"] },
  { label: "Customers",   permissions: ["customers:read", "customers:write"] },
  { label: "Inventory",   permissions: ["inventory:read", "inventory:write"] },
  { label: "Content/CMS", permissions: ["content:read", "content:write", "content:delete"] },
  { label: "Media",       permissions: ["media:read", "media:write", "media:delete"] },
  { label: "SEO",         permissions: ["seo:read", "seo:write"] },
  { label: "Marketing",   permissions: ["marketing:read", "marketing:write", "coupons:read", "coupons:write", "coupons:delete"] },
  { label: "Analytics",   permissions: ["analytics:read", "profit:read"] },
  { label: "Finance",     permissions: ["finance:read", "finance:write", "payouts:read", "payouts:write"] },
  { label: "Suppliers",   permissions: ["suppliers:read", "suppliers:write"] },
  { label: "Settings",    permissions: ["settings:read", "settings:write"] },
  { label: "Team",        permissions: ["team:read", "team:write"] },
  { label: "Audit",       permissions: ["audit:read"] },
  { label: "Sessions",    permissions: ["sessions:read", "sessions:write"] },
  { label: "Risk & Fraud",permissions: ["risk:read", "risk:write"] },
];

// ─── hasPermission ─────────────────────────────────────────────────────────────

export function hasPermission(
  adminRole: AdminRole | string | null | undefined,
  extraPermissions: string[],
  required: Permission
): boolean {
  if (!adminRole) return false;
  const role = adminRole as AdminRole;
  const defaults = ROLE_PERMISSIONS[role] ?? [];
  return defaults.includes(required) || extraPermissions.includes(required);
}

// ─── isSuperAdmin ──────────────────────────────────────────────────────────────

export function isSuperAdmin(session: { user?: { adminRole?: string | null } } | null): boolean {
  return session?.user?.adminRole === AdminRole.SUPER_ADMIN;
}

// ─── API guard helper ──────────────────────────────────────────────────────────

export function canAccess(
  session: {
    user?: {
      role?: string;
      adminRole?: string | null;
      permissions?: string[];
    };
  } | null,
  required: Permission
): boolean {
  if (!session?.user) return false;
  if (session.user.role !== UserRole.ADMIN) return false;
  return hasPermission(
    session.user.adminRole,
    session.user.permissions ?? [],
    required
  );
}

// ─── Sidebar visibility helper ────────────────────────────────────────────────

export const NAV_PERMISSIONS: Record<string, Permission> = {
  "/admin/analytics":       "analytics:read",
  "/admin/products":        "products:read",
  "/admin/orders":          "orders:read",
  "/admin/customers":       "customers:read",
  "/admin/returns":         "returns:read",
  "/admin/inventory":       "inventory:read",
  "/admin/warehouses":      "inventory:read",
  "/admin/purchase-orders": "inventory:read",
  "/admin/content":         "content:read",
  "/admin/homepage":        "content:read",
  "/admin/media":           "media:read",
  "/admin/seo":             "seo:read",
  "/admin/marketing":       "marketing:read",
  "/admin/coupons":         "coupons:read",
  "/admin/reviews":         "products:read",
  "/admin/profit":          "profit:read",
  "/admin/finance":         "finance:read",
  "/admin/payouts":         "payouts:read",
  "/admin/suppliers":       "suppliers:read",
  "/admin/settings":        "settings:read",
  "/admin/team":            "team:read",
  "/admin/audit":           "audit:read",
  "/admin/sessions":        "sessions:read",
  "/admin/security":        "audit:read",
  "/admin/super":           "settings:read",
  "/admin/risk":            "risk:read",
};
