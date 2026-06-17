# TRYBY — Automated QA Execution Report

**Generated:** 2026-06-18 · **Base commit:** local working tree (ahead of deployed `86746cb`)
**Scope:** automated test assets created to close the gaps the external HTTP audit could not reach.

> **Integrity note:** This report distinguishes tests that were **actually executed** from tests that are **scaffolded but not yet run**. No pass/fail is fabricated. The end-to-end suite cannot run in this environment (no `@playwright/test` installed, no seeded staging DB, no running app), so it is reported as **NOT EXECUTED — pending environment**, with exact run instructions.

---

## 1. Execution Summary

| Suite | Type | Status | Result |
|-------|------|--------|--------|
| `tests/unit/webhook-auth.test.ts` | Unit (node:test + tsx) | ✅ **EXECUTED** | **15 / 15 PASS** |
| `tests/e2e/admin/rbac.spec.ts` | E2E (Playwright) | ⏸ NOT EXECUTED — pending env | — |
| `tests/e2e/customer/cart-checkout.spec.ts` | E2E (Playwright) | ⏸ NOT EXECUTED — pending env | — |
| `tests/e2e/payments/payments.spec.ts` | E2E (Playwright) | ⏸ NOT EXECUTED — pending env | — |
| `tests/e2e/supplier/supplier.spec.ts` | E2E (Playwright) | ⏸ NOT EXECUTED — pending env | — |
| `tests/e2e/returns/returns.spec.ts` | E2E (Playwright) | ⏸ NOT EXECUTED — pending env | — |

### Unit test evidence (real run)

```
$ npm run test:unit
# tests 15
# suites 4
# pass 15
# fail 0
```

These 15 cases lock the **fail-closed** behaviour of the webhook fix (see
`docs/PRODUCTION_BLOCKERS_RESOLVED.md`): missing secret ⇒ reject, bad/absent
signature ⇒ reject, valid signature ⇒ accept, tampered body ⇒ reject,
constant-time compare never throws on length mismatch.

---

## 2. E2E Coverage Inventory (maps to PRODUCTION_TEST_PLAN.md)

| Spec | Plan IDs | What it asserts |
|------|----------|-----------------|
| `admin/rbac.spec.ts` | RBAC-01..17 | All 10 AdminRoles: permitted pages load, denied pages 403/redirect, privileged APIs 403; unauthenticated → 403; customer → admin blocked. Expectations are **hand-authored** (independent of `lib/rbac.ts`) so the test fails if implementation drifts from intent. |
| `customer/cart-checkout.spec.ts` | CUST-06/08/16/17 | Add to cart, **cart survives reload** (Zustand hydration regression), checkout reaches payment step while authenticated, order history lists past orders. |
| `payments/payments.spec.ts` | PAY-01/02/09/11 | Authed `create-order` never 401; **COD placed end to end**; Razorpay success→`/order-success` and failure→`/order-failed` (gated behind `RAZORPAY_TEST_MODE` so they never false-pass). |
| `supplier/supplier.spec.ts` | SUP-03/04/05/06/09/16 | Approved login + dashboard; **PENDING & SUSPENDED blocked**; wallet balance; supplier product → admin approval queue; supplier API scoped (no cross-supplier leak). |
| `returns/returns.spec.ts` | RET-01/02/04/06 | **Non-delivered → 422**, eligible return succeeds, **duplicate return blocked**, non-customer → 401. Drives `/api/returns` directly for determinism. |

**Total automated checks defined:** 1 unit file (15 assertions) + 5 E2E specs (24 test cases).

---

## 3. Why E2E is not executed here

| Blocker | Detail | Resolution |
|---------|--------|------------|
| Dependency not installed | `@playwright/test` is intentionally **not** in `package.json` deps (keeps prod install lean) | `npm i -D @playwright/test && npx playwright install chromium` |
| No seeded data | Specs require the `@test.tryby.in` accounts/orders from `prisma/seed-test.ts` | `npm run seed:test` against a QA/staging DB |
| No running app / target | `E2E_BASE_URL` must point at an app bound to the seeded DB | start `npm run dev` (or staging) |
| Payment gateway | Razorpay card specs need **test-mode** keys | set `RAZORPAY_TEST_MODE=1` + test keys |

### How to execute (produces real pass/fail)

```bash
cd store
npm i -D @playwright/test && npx playwright install chromium
npm run seed:test
npm run dev &                       # app bound to the seeded DB
E2E_BASE_URL=http://localhost:3000 RAZORPAY_TEST_MODE=1 npm run test:e2e
# → store/playwright-report/  +  store/playwright-results.json
```

---

## 4. Carry-over from the external HTTP audit

Already **verified live** (no harness needed) and still holding on the deployed build:
server-side guards (admin 403 / supplier 403 / customer 401), security headers,
input validation (Zod 400s), rate limiting (429), Razorpay webhook signature (401).

**Fixed in this change set** (see `docs/PRODUCTION_BLOCKERS_RESOLVED.md`):
1. Shiprocket/Delhivery webhooks now **fail closed** (covered by the 15 passing unit tests).
2. Production catalog placeholder products — removal tooling added (`scripts/cleanup-production-seed.ts`, dry-run by default).

**Still requires the E2E run above to clear** (currently unproven): full payment
capture/refund, checkout oversell, the 10-role RBAC matrix at runtime, returns
lifecycle, supplier settlement/payout flows.
