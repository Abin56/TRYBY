# Rollback Checklist — TRYBY

When a deploy goes wrong. The app layer rolls back in seconds on Vercel; the **database is the hard part** — a migration that changed the schema cannot be undone just by reverting code.

> Incident owner: ______________   Time detected: ______________   Bad deploy SHA: ______________

---

## 0. Decide: rollback, hotfix, or maintenance mode?

| Situation | Action |
|---|---|
| Site down / checkout broken / payments failing | **Roll back app now** (§1), investigate after |
| Bug is contained + a safe fix is minutes away | Hotfix forward instead of rolling back |
| Need to stop traffic while you assess | Enable **maintenance mode** (§4) — soft, instant, no redeploy |
| Bad release **included a DB migration** | App rollback alone may not be safe → read §2 carefully first |

Ask first: **did this release run a Prisma migration?** If yes, reverting code to a build that expects the old schema can break against the new schema. Plan the DB step before promoting an old deployment.

## 1. Application rollback (Vercel — fast path)

- [ ] Vercel → Project → **Deployments**
- [ ] Find the last known-good deployment (the SHA you recorded in the [Deployment Checklist](./02-deployment-checklist.md) §4)
- [ ] **Promote it to Production** ("Promote to Production" / "Rollback")
- [ ] Confirm production now serves the old build (check footer version / a known changed element)
- [ ] Verify env vars on the restored deployment are still valid (a removed/renamed var can break an old build)

CLI alternative:
```bash
vercel ls            # list deployments
vercel promote <deployment-url>   # promote a known-good one
```

## 2. Database rollback (careful)

Prisma migrations are forward-only; there are no auto down-migrations. Choose the least destructive option that restores correctness.

- [ ] **First choice — additive migration was backward-compatible:** if the new schema only *added* columns/tables, the old app build usually still works. Prefer leaving the DB as-is and just rolling back the app. Verify the old code doesn't write to now-required columns.
- [ ] **If the migration was destructive** (dropped/renamed columns, changed types) and the old app needs the old shape:
  - [ ] Put the site in **maintenance mode** (§4) to stop writes
  - [ ] Restore from the **pre-deploy snapshot** taken in [Backup Checklist](./04-backup-checklist.md):
    - Neon: restore/branch to the pre-deploy point-in-time, then repoint `DATABASE_URL`, **or**
    - `pg_restore` the pre-deploy dump into a fresh DB and repoint `DATABASE_URL`
  - [ ] **Accept and communicate data loss:** any orders/payments written between the snapshot and the rollback are gone from the restored DB — reconcile them manually (see §3)
- [ ] Write a forward "fix" migration rather than hand-editing the schema, once stable
- [ ] Run `npx prisma migrate status` after — no unexpected pending/failed migrations

> Golden rule going forward: design migrations to be **backward-compatible** (expand → migrate data → contract in a later release) so app rollback never requires a DB restore.

## 3. Reconcile money & fulfillment (do not skip)

A rollback can desync the store from external systems that already accepted real actions.

- [ ] **Razorpay:** any payment captured during the bad window still exists at Razorpay even if the order vanished locally — reconcile via `/api/admin/payments/reconcile` and the Razorpay dashboard. No customer should be charged without an order, or shipped without payment.
- [ ] **Refunds:** verify no duplicate/refund was triggered by the rollback
- [ ] **Shipping:** AWBs/labels created during the window may now lack a matching local order — reconcile with carrier dashboards
- [ ] **Webhooks:** re-deliver missed Razorpay/Shiprocket/Delhivery webhooks from their dashboards if events fired during downtime
- [ ] **Emails:** check whether confirmation emails went out for orders that were rolled back

## 4. Maintenance mode (soft control — no redeploy)

- [ ] Enable via admin: `POST /api/admin/maintenance` (or the admin maintenance UI)
- [ ] Confirm `/api/status/maintenance` reports enabled and storefront shows the maintenance state
- [ ] Use it to freeze writes during a DB restore or while assessing an incident
- [ ] **Disable** once healthy and verified

Feature flags (`/api/admin/feature-flags`) are a finer-grained alternative — disable just the broken feature instead of the whole site.

## 5. Verify recovery

- [ ] Homepage + a product page load cleanly
- [ ] Add-to-cart and checkout work; Razorpay modal opens
- [ ] Place a ₹1 test order end-to-end if payments were affected; refund it
- [ ] Login/logout works
- [ ] `/admin` reachable for admins
- [ ] Sentry error rate back to baseline
- [ ] Maintenance mode is **off**

## 6. Close-out

- [ ] Record: what broke, the bad SHA, restore point used, any data reconciled
- [ ] Capture root cause; file the forward fix
- [ ] Note how it slipped past the [Deployment Checklist](./02-deployment-checklist.md) and add the missing check
- [ ] If a DB restore was needed, schedule a post-mortem on making migrations backward-compatible

---

## Quick reference

| Layer | Rollback method | Speed | Risk |
|---|---|---|---|
| App / code | Promote previous Vercel deployment | Seconds | Low (watch env var compatibility) |
| Single feature | Toggle feature flag | Seconds | Low |
| Stop traffic | Maintenance mode | Seconds | Low |
| DB (additive migration) | Leave as-is, roll back app only | Seconds | Low–Med |
| DB (destructive migration) | Restore Neon snapshot / `pg_restore` | Minutes | **High — data loss + money reconciliation** |
