# Deployment Checklist — TRYBY (Vercel)

Run this for **every** production deploy. The first deploy also requires the one-time Vercel/project setup in §2.

> Deployer: ______________   Date/time: ______________   Commit SHA: ______________

---

## 1. Pre-deploy (local / CI)

- [ ] On a clean branch off `main`; changes reviewed and merged via PR
- [ ] `git status` clean, latest `main` pulled
- [ ] Install is reproducible: `npm ci` from `store/`
- [ ] Type check / lint pass: `npm run lint` (from `store/`)
- [ ] **Production build passes locally:** `npm run build` (runs `prisma generate && next build`)
  > Note: `store/AGENTS.md` warns this Next.js (16.x) has breaking changes vs older versions — never assume; build locally before trusting a deploy.
- [ ] New env vars (if any) added to the [Environment Variable Checklist](./03-environment-variables-checklist.md) **and** to Vercel before this deploy
- [ ] Any new Prisma migration is committed under `store/prisma/migrations/` (do **not** rely on `db push` in prod)
- [ ] Reviewed the diff for accidental secrets, `console.log`, or debug flags

## 2. Vercel project configuration (verify once, re-check if changed)

- [ ] **Root Directory = `store/`** (Settings → General) — the app is not at repo root
- [ ] Framework preset: Next.js
- [ ] Build command: default (`npm run build`) → runs `prisma generate && next build`
- [ ] Install command: default (`npm install` → triggers `postinstall: prisma generate`)
- [ ] Node.js version matches local (≥ Node 20, per `@types/node`)
- [ ] Production branch = `main`
- [ ] All Production-scope env vars present (see checklist 3) — **no placeholders**
- [ ] Sentry source-map upload works or fails soft (build has an `errorHandler` that only warns)

## 3. Database migration

The build runs `prisma generate` (client only), **not** `migrate deploy`. Migrations must be applied to the Neon database deliberately.

- [ ] **Take a DB snapshot first** — see [Backup Checklist](./04-backup-checklist.md) §"Before each deploy"
- [ ] Apply migrations against the production `DATABASE_URL`:
  ```bash
  cd store
  # point DATABASE_URL at production, then:
  npx prisma migrate deploy
  ```
  (Run from a trusted machine/CI, or wire it into a Vercel build/deploy step. Confirm whichever path you use.)
- [ ] Migration applied cleanly; `prisma migrate status` shows no pending migrations
- [ ] Connection string keeps the **pooled** Neon host + `connection_limit`/`pool_timeout` params (serverless safe)
- [ ] If the migration is destructive or long-running, it was tested on a Neon branch first

## 4. Deploy

- [ ] Trigger deploy (push to `main` or promote a preview)
- [ ] Build succeeds in Vercel logs (no type errors, no missing env vars)
- [ ] New deployment promoted to Production
- [ ] **Note the previous production deployment URL/ID for instant rollback**

## 5. Webhooks & external callbacks (verify after URL/domain changes)

- [ ] Razorpay webhook → `https://www.tryby.in/api/webhooks/razorpay` active, secret matches `RAZORPAY_WEBHOOK_SECRET`
- [ ] Shiprocket webhook → `/api/webhooks/shiprocket`, secret matches
- [ ] Delhivery webhook → `/api/webhooks/delhivery`, secret matches
- [ ] Google OAuth redirect URI still valid for the deployed domain

## 6. Cron / scheduled jobs

There is **no `vercel.json`** in the repo yet, so no Vercel Crons are registered. Internal endpoints (e.g. `/api/internal/shipping/sync`, finance settlement routes) are gated by `CRON_SECRET`.

- [ ] If scheduled syncs are required, add a `store/vercel.json` `crons` entry hitting the internal route with the `CRON_SECRET`, and redeploy
- [ ] If using an external scheduler instead, confirm it sends the `CRON_SECRET` and is pointed at the prod domain
- [ ] Manually trigger `/api/internal/shipping/sync` once post-deploy to confirm it runs

## 7. Post-deploy smoke test (production)

- [ ] Homepage 200, no console errors
- [ ] One product page renders with Cloudinary images
- [ ] Add to cart → cart persists
- [ ] Begin checkout → Razorpay modal opens with live key (do a real ₹1 test if it's a payments-affecting change)
- [ ] Login / logout works
- [ ] `/admin` loads for an admin account; blocked for anon
- [ ] Security headers present (`curl -sI https://www.tryby.in | grep -i content-security`)
- [ ] `/api/status/maintenance` responds; maintenance mode is **off**
- [ ] Sentry receives events (trigger a harmless test error if unsure)

## 8. Close-out

- [ ] Tag the release / record commit SHA + deploy time
- [ ] Update the team / changelog
- [ ] Watch Sentry + Vercel logs for ~30 min for error spikes
- [ ] If anything is wrong → [Rollback Checklist](./05-rollback-checklist.md)
