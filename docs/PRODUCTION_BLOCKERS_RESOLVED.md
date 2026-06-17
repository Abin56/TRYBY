# Production Blockers — Resolution Report

**Date:** 2026-06-18
**Source:** External QA audit (see `PRODUCTION_TEST_PLAN.md`, live HTTP execution against https://www.tryby.in)
**Status of code:** committed **locally only** — NOT pushed, NOT deployed (per instruction).
**Deployed production commit at audit time:** `86746cb` (still carries the vulnerable webhook code until this change is shipped).

> Scope note: the working tree already contained an *interim partial* webhook
> fix authored in another session (fail-closed **only** when `NODE_ENV==="production"`).
> This change set replaces it with an **unconditional fail-closed** implementation
> plus unit tests, and adds the catalog-cleanup tooling and the E2E harness.

---

## BLOCKER 1 — Courier webhooks accept forged, unauthenticated requests (P0)

### Issue
`POST /api/webhooks/shiprocket` and `POST /api/webhooks/delhivery` accepted
unsigned/forged payloads in production and returned `200`, while
`/api/webhooks/razorpay` correctly rejected them (`401`). Observed live during the audit:

```
POST /api/webhooks/shiprocket  (no signature)  → 200 {"ok":true,"skipped":"shipment not found"}
POST /api/webhooks/delhivery   (no token)      → 200 {"ok":true}
POST /api/webhooks/razorpay    (no signature)  → 401 {"error":"Invalid signature"}
```

Both handlers map inbound status to `OrderStatus` (`DELIVERED`, `RETURNED`,
`OUT_FOR_DELIVERY`) and trigger customer emails/notifications. Because AWBs are
not secret (printed on labels / in tracking links), an attacker could forge a
`DELIVERED` event to: flip an undelivered order to delivered, prematurely trigger
supplier settlement, or open/abuse the returns window — an order-integrity and
financial-fraud exposure.

### Root cause
The verification functions **failed open** when no secret was configured:

```ts
// shiprocket — original
function verifySignature(...) { if (!secret) return true; /* unenforced */ }
// delhivery — original
function verifyToken(...) { if (!secret || secret.startsWith("REPLACE")) return true; }
```

The signing secrets (`SHIPROCKET_WEBHOOK_SECRET`, `DELHIVERY_WEBHOOK_SECRET`)
were not set in production, so the `!secret` branch ran on every request →
effectively unauthenticated endpoints. The interim partial fix only closed this
in `NODE_ENV==="production"`, leaving dev/test/preview open and making the
behaviour environment-dependent (hard to test).

### Fix
New shared, pure, **fail-closed** module `store/lib/shipping/webhook-auth.ts`:

- `verifyShiprocketSignature(rawBody, signature, secret)` — HMAC-SHA256,
  constant-time compare. Returns `false` for missing secret, missing signature,
  length mismatch, or bad digest. **Never returns `true` without a valid signature, in any environment.**
- `verifyDelhiveryToken(token, secret)` — constant-time token compare; treats
  missing/`REPLACE…` placeholder as unconfigured.
- `isShiprocketSecretConfigured()` / `isDelhiveryTokenConfigured()` — let the
  routes distinguish *misconfiguration* (HTTP **500**) from *bad credentials* (HTTP **401**).

Both routes (`store/app/api/webhooks/shiprocket/route.ts`,
`store/app/api/webhooks/delhivery/route.ts`) now:

```
missing / placeholder secret      → 500  "Webhook secret not configured"  (+ console.error)
present but invalid / no signature → 401  "Invalid signature" / "Unauthorized"
valid signature/token             → process event
```

This satisfies the requirement: **production fails closed; a missing secret never
results in `return true`; events are never processed without verification.**

### Verification
- **Unit tests — 15/15 PASS** (`store/tests/unit/webhook-auth.test.ts`, `npm run test:unit`):
  - missing secret never accepted (incl. with a valid-looking signature)
  - missing/empty signature rejected
  - correctly-signed body accepted
  - tampered body rejected (same-length signature, different digest)
  - wrong-secret signature rejected
  - wrong-length signature rejected without throwing
  - Delhivery: placeholder/missing/empty token rejected; match accepted; mismatch/short rejected
- Static: both route files no longer contain any `return true`-on-missing-secret path (grep-clean).

### Test evidence
```
$ npm run test:unit
# tests 15
# suites 4
# pass 15
# fail 0
# duration_ms ~600
```

### Required operator action before deploy
Setting the change live will make the webhooks return **500 until the secrets are configured** (this is intentional fail-closed). Before/at deploy:
1. Set `SHIPROCKET_WEBHOOK_SECRET` and `DELHIVERY_WEBHOOK_SECRET` (real values) in Vercel.
2. Configure the same secret/token in the Shiprocket and Delhivery dashboards.
3. Re-run the live audit probe — expect `401` for unsigned, `200` only for correctly-signed events.

---

## BLOCKER 2 — Placeholder/test products live in the production catalog (P1)

### Issue
`GET /api/products` on production returned test data, e.g.:

```json
{ "name": "A product", "description": "df", "images": [], "variants": [], "reviewCount": 0 }
```

A product with no images and no variants is un-purchasable yet customer-visible — a launch-readiness defect.

### Root cause
Manually-entered test/placeholder rows left in the production database (not part
of the legitimate catalog). Not a code defect — a data hygiene gap.

### Fix
New script `store/scripts/cleanup-production-seed.ts` (`npm run cleanup:catalog`):

- **Matches** a product if ANY: blocklisted name (`"A product"`, `"Test Product"`, …),
  junk description (`"df"`, `"test"`, < 3 meaningful chars), OR no images **and** no variants.
- **DRY RUN by default** — reports only; mutates only with `--apply`.
- **FK-safe**: a candidate with real history (`orderItems`/`returnItems`/`purchaseOrderItems`)
  is **never hard-deleted** (would corrupt order history); it is reported and,
  with `--archive-referenced`, soft-archived (`isActive=false, isArchived=true`).
- Hard delete runs in a transaction, removing only non-historical child rows first.

### Verification
- Prisma model accessors used by the script validated against the generated
  client (all present).
- Dry-run default confirmed — the script cannot delete without an explicit `--apply`.
- **Not yet executed against production** (requires production `DATABASE_URL`; this
  is an operator step, deliberately not run from here).

### Test evidence / how to run
```bash
cd store
npm run cleanup:catalog                      # DRY RUN — lists candidates, deletes nothing
npm run cleanup:catalog -- --apply           # delete safe candidates
npm run cleanup:catalog -- --apply --archive-referenced   # also archive history-referenced
```

---

## Supporting deliverable — Authenticated E2E QA harness

`store/tests/e2e/` + `store/tests/playwright/` (Playwright) cover the flows the
external HTTP audit could not reach (payments, 10-role RBAC, supplier, returns,
cart hydration). Integrated with the seeded `@test.tryby.in` accounts from
`prisma/seed-test.ts`. Current execution status and run instructions:
**`QA_EXECUTION_REPORT_AUTOMATED.md`**.

---

## Change manifest (files in this change set)

| File | Change |
|------|--------|
| `store/lib/shipping/webhook-auth.ts` | **new** — fail-closed verifiers |
| `store/app/api/webhooks/shiprocket/route.ts` | use shared verifier; 500 on missing secret, 401 on bad sig |
| `store/app/api/webhooks/delhivery/route.ts` | use shared verifier; 500 on missing secret, 401 on bad token |
| `store/tests/unit/webhook-auth.test.ts` | **new** — 15 unit tests (PASS) |
| `store/scripts/cleanup-production-seed.ts` | **new** — catalog cleanup (dry-run default) |
| `store/tests/playwright/**`, `store/tests/e2e/**` | **new** — E2E harness |
| `store/package.json` | add `test`, `test:unit`, `test:e2e`, `cleanup:catalog` scripts |
| `store/.gitignore` | ignore Playwright report artifacts |
| `QA_EXECUTION_REPORT_AUTOMATED.md`, `docs/PRODUCTION_BLOCKERS_RESOLVED.md` | **new** — reports |
