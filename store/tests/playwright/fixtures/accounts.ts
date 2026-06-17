/**
 * Test accounts — MUST stay in sync with prisma/seed-test.ts.
 * Every account is created by `npm run seed:test` against the QA/staging DB.
 * Shared password for all test accounts: Test@1234 (see docs/STAGING_TEST_ACCOUNTS.md).
 *
 * These are STAGING-ONLY credentials (@test.tryby.in). Never point the harness
 * at production with these.
 */

export const TEST_PASSWORD = "Test@1234";

export interface Account {
  email: string;
  password: string;
  label: string;
}

/** 10 admin roles — one per AdminRole enum value (lib/rbac.ts). */
export const ADMINS = {
  SUPER_ADMIN:        { email: "admin.super@test.tryby.in",     password: TEST_PASSWORD, label: "Super Admin" },
  ADMIN:              { email: "admin.store@test.tryby.in",     password: TEST_PASSWORD, label: "Admin" },
  OPERATIONS_MANAGER: { email: "admin.ops@test.tryby.in",       password: TEST_PASSWORD, label: "Operations Manager" },
  CONTENT_MANAGER:    { email: "admin.content@test.tryby.in",   password: TEST_PASSWORD, label: "Content Manager" },
  PRODUCT_MANAGER:    { email: "admin.product@test.tryby.in",   password: TEST_PASSWORD, label: "Product Manager" },
  ORDER_MANAGER:      { email: "admin.orders@test.tryby.in",    password: TEST_PASSWORD, label: "Order Manager" },
  FINANCE_MANAGER:    { email: "admin.finance@test.tryby.in",   password: TEST_PASSWORD, label: "Finance Manager" },
  SUPPORT_AGENT:      { email: "admin.support@test.tryby.in",   password: TEST_PASSWORD, label: "Support Agent" },
  SUPPLIER_MANAGER:   { email: "admin.supplier@test.tryby.in",  password: TEST_PASSWORD, label: "Supplier Manager" },
  MARKETING_MANAGER:  { email: "admin.marketing@test.tryby.in", password: TEST_PASSWORD, label: "Marketing Manager" },
} as const satisfies Record<string, Account>;

export type AdminRoleKey = keyof typeof ADMINS;

export const CUSTOMERS = {
  new:       { email: "customer.new@test.tryby.in",       password: TEST_PASSWORD, label: "New customer (no orders)" },
  loyal:     { email: "customer.loyal@test.tryby.in",     password: TEST_PASSWORD, label: "Loyal customer (order history)" },
  cod:       { email: "customer.cod@test.tryby.in",       password: TEST_PASSWORD, label: "COD customer" },
  addresses: { email: "customer.addresses@test.tryby.in", password: TEST_PASSWORD, label: "Address-book customer" },
  returns:   { email: "customer.return@test.tryby.in",    password: TEST_PASSWORD, label: "Returns customer (delivered order)" },
  locked:    { email: "customer.locked@test.tryby.in",    password: TEST_PASSWORD, label: "Locked customer" },
} as const satisfies Record<string, Account>;

export const SUPPLIERS = {
  approved:  { email: "supplier.approved@test.tryby.in",  password: TEST_PASSWORD, label: "Approved supplier (GOLD)" },
  pending:   { email: "supplier.pending@test.tryby.in",   password: TEST_PASSWORD, label: "Pending supplier" },
  suspended: { email: "supplier.suspended@test.tryby.in", password: TEST_PASSWORD, label: "Suspended supplier" },
  payouts:   { email: "supplier.payouts@test.tryby.in",   password: TEST_PASSWORD, label: "Payout-flow supplier" },
} as const satisfies Record<string, Account>;
