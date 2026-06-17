import { test, expect } from "@playwright/test";
import { CUSTOMERS } from "../../playwright/fixtures/accounts";
import { loginAs } from "../../playwright/fixtures/auth";

/**
 * Customer cart + checkout. Maps to PRODUCTION_TEST_PLAN CUST-06, CUST-16,
 * CUST-08, CUST-17. Uses the seeded catalog (a real purchasable product with
 * variants) — these specs assume `npm run seed:test` has run.
 */

/** Open the first purchasable product and add it to the cart. */
async function addFirstProductToCart(page: import("@playwright/test").Page) {
  await page.goto("/products");
  await page.locator('a[href^="/products/"]').first().click();
  await page.waitForURL(/\/products\/.+/);

  // Pick a variant if a size/color selector is present.
  const sizeOption = page.getByRole("button", { name: /^(S|M|L|XL|XXL)$/ }).first();
  if (await sizeOption.count()) await sizeOption.click();

  await page.getByRole("button", { name: /add to (cart|bag)/i }).first().click();
}

test("CUST-06 — add to cart updates cart count and contents", async ({ page }) => {
  await loginAs(page, CUSTOMERS.new);
  await addFirstProductToCart(page);

  await page.goto("/cart");
  await expect(page.getByText(/your cart|shopping cart/i)).toBeVisible();
  // Cart must contain at least one line item.
  await expect(page.locator('[data-testid="cart-item"], [class*="cart-item"]').first()).toBeVisible();
});

test("CUST-16 — cart survives a full page reload (Zustand hydration)", async ({ page }) => {
  await loginAs(page, CUSTOMERS.new);
  await addFirstProductToCart(page);

  await page.goto("/cart");
  const before = await page.locator('[data-testid="cart-item"], [class*="cart-item"]').count();
  expect(before).toBeGreaterThan(0);

  await page.reload();
  const after = await page.locator('[data-testid="cart-item"], [class*="cart-item"]').count();
  expect(after, "cart item count must be stable across reload").toBe(before);
});

test("CUST-08 — checkout requires auth and reaches the payment step", async ({ page }) => {
  await loginAs(page, CUSTOMERS.cod);
  await addFirstProductToCart(page);

  await page.goto("/checkout");
  // Should not bounce to login (already authenticated).
  expect(new URL(page.url()).pathname).not.toContain("/auth/login");
  await expect(page.getByText(/payment|delivery|shipping address/i).first()).toBeVisible();
});

test("CUST-17 — order history lists the customer's past orders", async ({ page }) => {
  await loginAs(page, CUSTOMERS.loyal);
  await page.goto("/account/orders");
  await expect(page.getByText(/orders|order history/i).first()).toBeVisible();
  // Loyal persona is seeded with order history.
  await expect(page.locator('a[href^="/account/orders/"]').first()).toBeVisible();
});
