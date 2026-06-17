/**
 * RBAC expectations — hand-authored ground truth for the 10 admin roles.
 *
 * IMPORTANT: these expectations are written INDEPENDENTLY of lib/rbac.ts on
 * purpose. A test that imports the same permission table it is validating would
 * pass even if that table were wrong. Here we encode the *intended* access from
 * the product spec, so the test fails if the implementation drifts from intent.
 *
 * `allow`  — admin routes this role MUST be able to open (HTTP 200, content renders)
 * `deny`   — admin routes this role MUST be blocked from (redirect to /admin or 403)
 */

import type { AdminRoleKey } from "./accounts";

export interface RoleExpectation {
  allow: string[];
  deny: string[];
}

export const RBAC_EXPECTATIONS: Record<AdminRoleKey, RoleExpectation> = {
  SUPER_ADMIN: {
    allow: ["/admin/products", "/admin/orders", "/admin/finance", "/admin/payouts", "/admin/team", "/admin/settings", "/admin/audit", "/admin/super", "/admin/suppliers", "/admin/risk"],
    deny: [],
  },
  ADMIN: {
    allow: ["/admin/products", "/admin/orders", "/admin/returns", "/admin/content", "/admin/finance", "/admin/audit", "/admin/risk", "/admin/suppliers"],
    deny: ["/admin/team", "/admin/settings", "/admin/super", "/admin/payouts"],
  },
  OPERATIONS_MANAGER: {
    allow: ["/admin/orders", "/admin/returns", "/admin/inventory", "/admin/risk", "/admin/suppliers"],
    deny: ["/admin/finance", "/admin/payouts", "/admin/content", "/admin/team", "/admin/settings"],
  },
  CONTENT_MANAGER: {
    allow: ["/admin/content", "/admin/media", "/admin/seo", "/admin/products"],
    deny: ["/admin/orders", "/admin/finance", "/admin/suppliers", "/admin/team", "/admin/inventory"],
  },
  PRODUCT_MANAGER: {
    allow: ["/admin/products", "/admin/media", "/admin/inventory"],
    deny: ["/admin/orders", "/admin/finance", "/admin/content", "/admin/returns", "/admin/team"],
  },
  ORDER_MANAGER: {
    allow: ["/admin/orders", "/admin/returns", "/admin/customers", "/admin/inventory"],
    deny: ["/admin/finance", "/admin/payouts", "/admin/suppliers", "/admin/content", "/admin/team"],
  },
  FINANCE_MANAGER: {
    allow: ["/admin/finance", "/admin/profit", "/admin/payouts", "/admin/orders"],
    deny: ["/admin/products", "/admin/content", "/admin/returns", "/admin/team", "/admin/settings"],
  },
  SUPPORT_AGENT: {
    allow: ["/admin/orders", "/admin/returns", "/admin/customers", "/admin/products"],
    deny: ["/admin/finance", "/admin/payouts", "/admin/settings", "/admin/team", "/admin/content"],
  },
  SUPPLIER_MANAGER: {
    allow: ["/admin/suppliers", "/admin/payouts", "/admin/products", "/admin/inventory"],
    deny: ["/admin/finance", "/admin/orders", "/admin/content", "/admin/team", "/admin/settings"],
  },
  MARKETING_MANAGER: {
    allow: ["/admin/marketing", "/admin/coupons", "/admin/content", "/admin/customers"],
    deny: ["/admin/orders", "/admin/finance", "/admin/suppliers", "/admin/settings", "/admin/team"],
  },
};

/** API-level least-privilege spot checks — a write API a role must NOT reach (expect 403). */
export const RBAC_API_DENY: Partial<Record<AdminRoleKey, { method: "GET" | "POST"; path: string }[]>> = {
  SUPPORT_AGENT: [{ method: "POST", path: "/api/admin/team" }],          // cannot create admins
  CONTENT_MANAGER: [{ method: "GET", path: "/api/admin/finance" }],      // no finance read
  MARKETING_MANAGER: [{ method: "GET", path: "/api/admin/payouts" }],    // no payouts
};
