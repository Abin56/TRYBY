/**
 * Auth helpers for the E2E harness.
 *
 * Uses the credentials provider on /auth/login (the seeded test accounts use a
 * bcrypt password — Test@1234). After a successful login the NextAuth session
 * cookie is set on the browser context, so subsequent navigations are
 * authenticated. We expose:
 *   - login(page, account)        → drive the login form
 *   - loginAs(...)                → login + return when landing page is ready
 *   - apiContext(...)             → a request context carrying the session cookie
 */

import { expect, type Page, type BrowserContext, type APIRequestContext } from "@playwright/test";
import type { Account } from "./accounts";

/** Drive the credentials login form and wait for the session to be established. */
export async function login(page: Page, account: Account): Promise<void> {
  await page.goto("/auth/login");
  await page.getByLabel(/email/i).fill(account.email);
  await page.getByLabel(/password/i).fill(account.password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/auth/login"), { timeout: 15_000 }),
    page.getByRole("button", { name: /sign in|log ?in/i }).click(),
  ]);
}

/** Login and assert we are no longer on the login page (session cookie present). */
export async function loginAs(page: Page, account: Account): Promise<void> {
  await login(page, account);
  const cookies = await page.context().cookies();
  const hasSession = cookies.some(
    (c) => c.name.includes("authjs.session-token") || c.name.includes("next-auth.session-token")
  );
  expect(hasSession, `expected a session cookie after logging in as ${account.email}`).toBeTruthy();
}

/** Build an API request context that shares the page's authenticated cookies. */
export async function authedRequest(context: BrowserContext): Promise<APIRequestContext> {
  return context.request;
}
