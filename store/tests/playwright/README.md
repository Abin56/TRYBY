# TRYBY E2E QA Harness (Playwright)

Authenticated end-to-end coverage for the flows the external HTTP audit could
**not** reach without sessions/payments. Maps directly to `PRODUCTION_TEST_PLAN.md`.

## Layout

```
store/tests/
  e2e/                         # specs (run against a seeded QA/staging env)
    admin/rbac.spec.ts         # all 10 AdminRoles + cross-actor guards   (RBAC-01..17)
    customer/cart-checkout.spec.ts  # add-to-cart, hydration, checkout, history (CUST-06/08/16/17)
    payments/payments.spec.ts  # COD + Razorpay (test-mode)               (PAY-01/02/09/11)
    supplier/supplier.spec.ts  # login gating, dashboard, approval, wallet (SUP-03..16)
    returns/returns.spec.ts    # 7-day window + duplicate prevention      (RET-01/02/04/06)
  playwright/
    playwright.config.ts       # config (baseURL via E2E_BASE_URL)
    fixtures/accounts.ts       # seeded test accounts (mirror of seed-test.ts)
    fixtures/auth.ts           # login helpers
    fixtures/rbac-expectations.ts  # hand-authored role → allow/deny truth
    fixtures/test-data.ts      # pincodes, coupons, Razorpay test values
```

## Prerequisites (one-time)

```bash
cd store
npm i -D @playwright/test       # not in deps by default (keeps prod install lean)
npx playwright install chromium
```

## Required environment

| Var | Purpose |
|-----|---------|
| `E2E_BASE_URL` | App under test, e.g. `http://localhost:3000` or a staging URL. **Never production.** |
| `RAZORPAY_TEST_MODE=1` | Enables the interactive Razorpay card specs (kept skipped otherwise so they never false-pass). RAZORPAY_* keys must be **test** keys. |

## Run

```bash
cd store
npm run seed:test          # 1. seed deterministic fixtures (10 admins, customers, suppliers, orders)
npm run dev                # 2. (in another shell) start the app against the seeded DB
E2E_BASE_URL=http://localhost:3000 npm run test:e2e   # 3. run the harness
```

HTML report → `store/playwright-report/`, JSON → `store/playwright-results.json`.

## Notes / honest limitations

- Specs assume `npm run seed:test` has run; they read order ids from the API
  rather than hardcoding seed internals, but personas (returns/cod/loyal) must exist.
- Razorpay card capture drives the hosted test checkout iframe — inherently the
  flakiest step; gated behind `RAZORPAY_TEST_MODE` and excluded from the default pass/fail.
- Selectors are intentionally tolerant (role/text based). If the UI uses stable
  `data-testid`s, tighten them for less flake.
- This harness has **not been executed in CI yet** — see `QA_EXECUTION_REPORT_AUTOMATED.md`
  for current status.
