import { test, expect } from "@playwright/test";
import { ADMINS, CUSTOMERS, type AdminRoleKey } from "../../playwright/fixtures/accounts";
import { loginAs } from "../../playwright/fixtures/auth";
import { RBAC_EXPECTATIONS, RBAC_API_DENY } from "../../playwright/fixtures/rbac-expectations";

/**
 * RBAC — validates the 10 admin roles against hand-authored expectations
 * (tests/playwright/fixtures/rbac-expectations.ts), plus unauthenticated and
 * cross-role guards. Maps to PRODUCTION_TEST_PLAN RBAC-01..17.
 */

/** A denied admin page must EITHER return 403 OR redirect away from itself. */
async function expectDenied(page: import("@playwright/test").Page, path: string) {
  const resp = await page.goto(path);
  const status = resp?.status() ?? 0;
  const landed = new URL(page.url()).pathname;
  const blocked = status === 403 || landed !== path;
  expect(blocked, `expected ${path} to be DENIED (status=${status}, landed=${landed})`).toBeTruthy();
}

/** An allowed admin page must load on its own URL without a 403. */
async function expectAllowed(page: import("@playwright/test").Page, path: string) {
  const resp = await page.goto(path);
  const status = resp?.status() ?? 0;
  const landed = new URL(page.url()).pathname;
  expect(status, `expected ${path} not to 403`).not.toBe(403);
  expect(landed, `expected to stay on ${path}`).toBe(path);
}

for (const role of Object.keys(RBAC_EXPECTATIONS) as AdminRoleKey[]) {
  test.describe(`RBAC — ${role}`, () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, ADMINS[role]);
    });

    test(`${role} can access its permitted pages`, async ({ page }) => {
      for (const path of RBAC_EXPECTATIONS[role].allow) {
        await expectAllowed(page, path);
      }
    });

    test(`${role} is denied non-permitted pages`, async ({ page }) => {
      for (const path of RBAC_EXPECTATIONS[role].deny) {
        await expectDenied(page, path);
      }
    });

    const apiDenies = RBAC_API_DENY[role];
    if (apiDenies?.length) {
      test(`${role} is denied privileged APIs (server-side 403)`, async ({ page }) => {
        for (const { method, path } of apiDenies) {
          const resp = await page.request.fetch(path, { method });
          expect(resp.status(), `${method} ${path} for ${role}`).toBe(403);
        }
      });
    }
  });
}

test.describe("RBAC — cross-actor guards", () => {
  test("unauthenticated admin APIs return 403", async ({ request }) => {
    for (const path of ["/api/admin/orders", "/api/admin/finance", "/api/admin/team"]) {
      expect((await request.get(path)).status(), path).toBe(403);
    }
  });

  test("a logged-in CUSTOMER cannot reach the admin area", async ({ page }) => {
    await loginAs(page, CUSTOMERS.loyal);
    await expectDenied(page, "/admin/orders");
    expect((await page.request.get("/api/admin/orders")).status()).toBe(403);
  });
});
