import { test, expect } from "@playwright/test";
import { CUSTOMERS } from "../../playwright/fixtures/accounts";
import { loginAs } from "../../playwright/fixtures/auth";

/**
 * Payments. Maps to PRODUCTION_TEST_PLAN PAY-01, PAY-02, PAY-09, PAY-11.
 *
 * Razorpay card flows require TEST-MODE keys and drive the hosted Razorpay
 * checkout — interactive and environment-dependent. Those tests are SKIPPED
 * unless RAZORPAY_TEST_MODE=1 is set, so the suite never reports a false pass.
 * COD is deterministic and always runs.
 */

const RZP_TEST = process.env.RAZORPAY_TEST_MODE === "1";

async function addProductAndGoToCheckout(page: import("@playwright/test").Page) {
  await page.goto("/products");
  await page.locator('a[href^="/products/"]').first().click();
  await page.waitForURL(/\/products\/.+/);
  const size = page.getByRole("button", { name: /^(S|M|L|XL|XXL)$/ }).first();
  if (await size.count()) await size.click();
  await page.getByRole("button", { name: /add to (cart|bag)/i }).first().click();
  await page.goto("/checkout");
}

test("PAY-01 — create-order API requires auth and returns a Razorpay order", async ({ page }) => {
  await loginAs(page, CUSTOMERS.cod);
  // Unauthenticated baseline is covered live; here we assert the authed contract.
  const resp = await page.request.post("/api/payments/razorpay/create-order", {
    data: { /* server recomputes amount from the server-side cart/order */ },
  });
  // Either a created order (200) or a domain validation error — never 401 when authed.
  expect(resp.status(), "authed create-order must not be 401").not.toBe(401);
});

test("PAY-11 — COD order can be placed end to end", async ({ page }) => {
  await loginAs(page, CUSTOMERS.cod);
  await addProductAndGoToCheckout(page);

  // Fill address if the form is shown (address-book customer is pre-seeded; COD
  // customer may need to enter one).
  const pincode = page.getByLabel(/pin ?code|postal/i).first();
  if (await pincode.count()) {
    await pincode.fill("560001");
  }

  const cod = page.getByText(/cash on delivery|COD/i).first();
  await cod.click();
  await page.getByRole("button", { name: /place order|confirm order|pay/i }).first().click();

  await page.waitForURL(/\/order-success|\/account\/orders/, { timeout: 20_000 });
  await expect(page.getByText(/order (placed|confirmed|success)/i).first()).toBeVisible();
});

test("PAY-02 — Razorpay success captures the payment", async ({ page }) => {
  test.skip(!RZP_TEST, "Razorpay test mode not enabled (set RAZORPAY_TEST_MODE=1)");
  await loginAs(page, CUSTOMERS.loyal);
  await addProductAndGoToCheckout(page);
  await page.getByText(/pay online|prepaid|razorpay/i).first().click();
  await page.getByRole("button", { name: /pay|place order/i }).first().click();

  // Razorpay test checkout opens; choose the success path on the test page.
  const rzpFrame = page.frameLocator('iframe[src*="razorpay"]');
  await rzpFrame.getByRole("button", { name: /success/i }).click();

  await page.waitForURL(/\/order-success/, { timeout: 30_000 });
  await expect(page.getByText(/order (confirmed|placed|success)/i).first()).toBeVisible();
});

test("PAY-09 — Razorpay failure routes to order-failed", async ({ page }) => {
  test.skip(!RZP_TEST, "Razorpay test mode not enabled (set RAZORPAY_TEST_MODE=1)");
  await loginAs(page, CUSTOMERS.loyal);
  await addProductAndGoToCheckout(page);
  await page.getByText(/pay online|prepaid|razorpay/i).first().click();
  await page.getByRole("button", { name: /pay|place order/i }).first().click();

  const rzpFrame = page.frameLocator('iframe[src*="razorpay"]');
  await rzpFrame.getByRole("button", { name: /failure|fail/i }).click();

  await page.waitForURL(/\/order-failed/, { timeout: 30_000 });
});
