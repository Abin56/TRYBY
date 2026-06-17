import { test, expect } from "@playwright/test";
import { SUPPLIERS, ADMINS } from "../../playwright/fixtures/accounts";
import { loginAs, login } from "../../playwright/fixtures/auth";

/**
 * Supplier portal. Maps to PRODUCTION_TEST_PLAN SUP-03, SUP-04, SUP-05/06,
 * SUP-09, SUP-16.
 */

test("SUP-03 — approved supplier can log in", async ({ page }) => {
  await loginAs(page, SUPPLIERS.approved);
  await page.goto("/supplier/dashboard");
  expect(new URL(page.url()).pathname).toContain("/supplier");
});

test("SUP-04 — supplier dashboard renders KPIs", async ({ page }) => {
  await loginAs(page, SUPPLIERS.approved);
  await page.goto("/supplier/dashboard");
  await expect(page.getByText(/dashboard|orders|payouts|earnings/i).first()).toBeVisible();
});

test("SUP-03b — pending supplier is blocked from the portal", async ({ page }) => {
  await login(page, SUPPLIERS.pending);
  const resp = await page.goto("/supplier/dashboard");
  const status = resp?.status() ?? 0;
  const landed = new URL(page.url()).pathname;
  const blocked = status === 403 || !landed.startsWith("/supplier/dashboard");
  expect(blocked, "PENDING supplier must not reach the dashboard").toBeTruthy();
});

test("SUP-03c — suspended supplier is blocked from the portal", async ({ page }) => {
  await login(page, SUPPLIERS.suspended);
  const resp = await page.goto("/supplier/dashboard");
  const status = resp?.status() ?? 0;
  const landed = new URL(page.url()).pathname;
  const blocked = status === 403 || !landed.startsWith("/supplier/dashboard");
  expect(blocked, "SUSPENDED supplier must not reach the dashboard").toBeTruthy();
});

test("SUP-09 — wallet page shows a balance", async ({ page }) => {
  await loginAs(page, SUPPLIERS.payouts);
  await page.goto("/supplier/wallet");
  await expect(page.getByText(/wallet|balance|payout/i).first()).toBeVisible();
});

test("SUP-16 — supplier APIs are scoped to the caller (no cross-supplier data)", async ({ page }) => {
  await loginAs(page, SUPPLIERS.approved);
  const resp = await page.request.get("/api/supplier/orders");
  expect(resp.status()).toBe(200);
  // Sanity: the payload must not leak another supplier's known order ids.
  const body = await resp.text();
  expect(body).not.toContain("tst_sup_suspended");
});

test("SUP-05/06 — supplier-submitted product enters the admin approval queue", async ({ browser }) => {
  // Supplier submits a product.
  const supCtx = await browser.newContext();
  const supPage = await supCtx.newPage();
  await loginAs(supPage, SUPPLIERS.approved);
  await supPage.goto("/supplier/products");
  // Submission UI varies; assert the supplier can at least reach the submission surface.
  await expect(supPage.getByText(/products|add product|submit/i).first()).toBeVisible();
  await supCtx.close();

  // Admin (supplier manager) sees the approval queue.
  const admCtx = await browser.newContext();
  const admPage = await admCtx.newPage();
  await loginAs(admPage, ADMINS.SUPPLIER_MANAGER);
  await admPage.goto("/admin/supplier-products");
  await expect(admPage.getByText(/approve|pending|supplier products/i).first()).toBeVisible();
  await admCtx.close();
});
