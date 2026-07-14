# PRODUCTION FINAL STATUS

**Date:** 2026-06-18 · **Canonical:** `https://www.tryby.in`

---

## READY = **NO**
## SAFE_TO_PUSH = **FALSE**

The checkout-blocker fix (`d2da022`) is good and isolated, but the **environment is unverified** and the **repo has unfinished, uncommitted work**. Do not push until the blockers below clear.

---

## BLOCKERS

| # | Blocker | Type | Detail |
|---|---------|------|--------|
| **1** | Vercel env not verified | Config (you) | `AUTH_URL`/`NEXTAUTH_URL`/`NEXT_PUBLIC_APP_URL` = `https://www.tryby.in`, real `RAZORPAY_WEBHOOK_SECRET`, `INTERNAL_API_SECRET`, **`NEXT_PUBLIC_STORE_URL=https://www.tryby.in`** (else localhost fallbacks). See `GO_LIVE_CHECKLIST.md` / `PRODUCTION_ENV_SCAN.md` |
| **2** | Google OAuth not verified | Config (you) | Redirect URI `https://www.tryby.in/api/auth/callback/google`, JS origin, consent screen **Published**, rotated secret |
| **3** | Razorpay webhook secret | Config (you) | Real `RAZORPAY_WEBHOOK_SECRET` in Vercel; webhook URL → `https://www.tryby.in/api/webhooks/razorpay`; test webhook returns 200 |
| **4** | Uncommitted work-in-progress | Repo state | ~20 modified files + new `lib/shipping/webhook-auth.ts`, `tests/`, `seed-test.ts`, `package.json` changes are **uncommitted**. They will NOT deploy on a push of `d2da022`. Decide: finish+commit+build, or push `d2da022` alone |
| **5** | No full build on current tree | Verify | Run `cd store && npm run build` clean on whatever you intend to push (tree changed + `package.json` changed) |
| **6** | Catalog near-empty | Content | Prod DB has **2** products, **0** orders |

---

## TASK RESULTS

### 1. Environment safety scan → `PRODUCTION_ENV_SCAN.md`
- Hardcoded secrets in committed code: **none** ✅
- Hardcoded `localhost`: 5 fallback occurrences via undefined `NEXT_PUBLIC_STORE_URL` ⚠ → fix by setting that Vercel var (none checkout-blocking)
- `.env.local` placeholders: local only, gitignored, do not deploy ✅ (but map to Vercel vars that must be real)

### 2. Auth flow (code)
- ✅ Google callback route is NextAuth's `/api/auth/callback/google` (handlers in `store/lib/auth.ts`); callback host derived from `AUTH_URL` / trusted host.
- ✅ Canonical `www` consistent in code (`layout.tsx`, `robots.ts`, `sitemap.ts`); **no mixed www/non-www redirects in code**. Enforce non-www→www at Vercel domain level.
- ⚠ `localhost` only as guarded fallbacks (Blocker 1/Task 1), not unconditional.

### 3. Checkout + order flow (code) — `d2da022`
- ✅ Order created in DB: `store/app/checkout/page.tsx` syncs cart → `POST /api/orders` creates the order.
- ✅ Cart clears after success: `clearCart()` fires immediately after the order is created ([checkout/page.tsx:228](store/app/checkout/page.tsx#L228)), mirroring the server cart consumed in the order transaction.
- ✅ No duplicate order on refresh: after success both the Zustand cart and server cart are empty → empty-cart guard blocks a second order; `setPlacing` blocks double-submit.
- ✅ **`d2da022` is the only change needed** for the real buy path (PDP → real variant → checkout → order). Caveat: mock home/PLP quick-add items (`variantId = product.id`) were never orderable and are dropped on sync — pre-existing, not introduced.

### 4. Webhook safety (code)
- ✅ **Razorpay** — already secure: `if (!secret) return false` unconditionally; HMAC + `timingSafeEqual`. (in `origin/main`)
- ✅ **Shiprocket** — now fail-closed via `lib/shipping/webhook-auth.ts`: 500 if secret unconfigured, 401 on mismatch, **never returns true** for a missing secret, no `NODE_ENV` escape hatch.
- ✅ **Delhivery** — same module, also rejects `REPLACE…` placeholder tokens.
- 🔴 **These Shiprocket/Delhivery hardenings are UNCOMMITTED** → not in `origin/main`, won't deploy with `d2da022`. To ship them: commit `webhook-auth.ts` + both route files and re-build. (Prod today is still fail-closed via the older `NODE_ENV` path, so no regression — just not the hardened version.)

---

## SAFE PRODUCTION PUSH PLAN (after blockers clear — DO NOT auto-run)

**Path A — ship only the checkout fix now (smallest surface):**
1. Clear Blockers 1–3 (Vercel + Google + Razorpay) and redeploy env.
2. `git push origin main` → deploys **only `d2da022`**.
3. Post-deploy smoke: 1 real ₹ order (Order count 0→1), Google login, Razorpay test webhook → 200.
4. Rollback: Vercel → Deployments → previous → Instant Rollback.

**Path B — ship checkout fix + webhook hardening + WIP together (recommended once WIP is done):**
1. Finish the in-progress refactor; `cd store && npm install && npm run build` must pass clean.
2. Commit the webhook-auth module + routes (+ intended WIP) in a reviewed commit.
3. Clear Blockers 1–3, then push; smoke-test as above **plus** Shiprocket/Delhivery test webhooks.

> Current: local `main` = `origin/main` + `d2da022` (committed). All other changes are uncommitted working-tree WIP.
