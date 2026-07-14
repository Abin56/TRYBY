# TRYBY — Go-Live Verification Checklist

**Canonical domain:** `https://www.tryby.in` (non-www → www redirect enforced)
**Pending deploy:** commit `d2da022` — "wire storefront cart to server so checkout can create orders" (NOT yet pushed)
**Prepared:** 2026-06-18 · DB verified live (read-only): Prisma connects ✅, 92 tables ✅, Product rows = 2 ⚠, Order rows = 0 ⚠

> Mark each line: ✅ done · ❌ missing · ⚠ placeholder/needs-fix. All five sections must be ✅ before push.

---

## 1. Vercel Environment Variables (Production scope)
Set in Vercel → Project → Settings → Environment Variables → **Production**, then **redeploy** (env changes need a new deployment).

- [ ] `AUTH_URL` = `https://www.tryby.in`
- [ ] `NEXTAUTH_URL` = `https://www.tryby.in`
- [ ] `NEXT_PUBLIC_APP_URL` = `https://www.tryby.in`
- [ ] `AUTH_TRUST_HOST` = `true`
- [ ] `AUTH_SECRET` = real 32-byte secret (NEXTAUTH_SECRET may mirror it)
- [ ] `DATABASE_URL` = Neon pooler URL (same one verified connecting)
- [ ] `DIRECT_URL` = **not required** (schema has no `directUrl`) — safe to omit
- [ ] `GOOGLE_CLIENT_ID` = real
- [ ] `GOOGLE_CLIENT_SECRET` = **rotated** secret (old one was flagged compromised)
- [ ] `RAZORPAY_KEY_ID` = `rzp_live_…`
- [ ] `RAZORPAY_KEY_SECRET` = real live secret
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID` = `rzp_live_…` (same id)
- [ ] `RAZORPAY_WEBHOOK_SECRET` = real (NOT `your_secret_here`) — see §3
- [ ] `INTERNAL_API_SECRET` = real random (NOT `REPLACE_…`)
- [ ] `RESEND_API_KEY` = real (else order/welcome emails silently fail)
- [ ] `CLOUDINARY_*` (4 vars) = real if image uploads used
- [ ] `SENTRY_*` / `NEXT_PUBLIC_SENTRY_DSN` = real (optional, recommended)
- [ ] **Sweep:** no Production value contains `REPLACE_`, `your_secret_here`, or `localhost`

## 2. Google OAuth (Google Cloud Console → Credentials → OAuth 2.0 Client)
- [ ] Authorized **redirect URI**: `https://www.tryby.in/api/auth/callback/google`  *(required)*
- [ ] Authorized redirect URI: `https://tryby.in/api/auth/callback/google`  *(optional safety net)*
- [ ] Authorized **JavaScript origin**: `https://www.tryby.in`
- [ ] OAuth **consent screen = Published / In production** (NOT "Testing" — Testing blocks non-test users)
- [ ] Client secret in console matches `GOOGLE_CLIENT_SECRET` in Vercel (rotated value)
- [ ] **Test:** `https://www.tryby.in/auth/login` → Continue with Google → no `invalid_client` / `redirect_uri_mismatch`

## 3. Razorpay Webhook (Dashboard → Settings → Webhooks)
- [ ] Webhook URL = `https://www.tryby.in/api/webhooks/razorpay`
- [ ] Webhook **secret** == `RAZORPAY_WEBHOOK_SECRET` in Vercel (exact match)
- [ ] Active events: `payment.captured`, `payment.failed`, `order.paid`, `refund.created`, `refund.processed`, `refund.failed`, `payment.dispute.*`, `settlement.processed`
- [ ] Mode = **Live** (keys are `rzp_live_…`)
- [ ] **Test:** send a test webhook → expect HTTP **200** (a 401 = secret mismatch)
- [ ] Signature verification: code-verified ✅ (HMAC + timingSafeEqual)

## 4. Checkout Order-Sync Fix (`d2da022`)
- [x] Commit present locally: 4 files (api/cart, checkout, cart-clearer, globals.css) — typecheck clean
- [ ] **After deploy:** place 1 real order (PDP → pick size → Add → /checkout → address → Pay)
- [ ] Neon `Order` count goes 0 → 1; `Payment` row = `CAPTURED`; order in `/account/orders`; `/order-success` renders
- [ ] Guest→login→checkout keeps cart (add as guest, log in, items still present)
- [ ] No "Cart is empty" error at checkout

## 5. Product Catalog Readiness
- [ ] Real catalog loaded (currently **only 2 products** in prod DB)
- [ ] Each product: ≥1 active `ProductVariant` with price/mrp/`stock > 0`, a primary image, slug, sport/category, `isActive = true`
- [ ] `/products` lists them; PDP loads; Add-to-cart selects a real variant (CUID)

---

## Safe Production Push Plan (DO NOT run until §1–§5 are all ✅, and you confirm)
1. Confirm checklist green + env redeploy already applied in Vercel.
2. Push the single fix commit: `git push origin main` → deploys **only** `d2da022`.
   *(Uncommitted working-tree edits will NOT deploy — commit them separately if intended.)*
3. Watch Vercel build → must succeed (`prisma generate && next build`).
4. Post-deploy smoke: §4 test order · §2 Google login · §3 test webhook · homepage/products/PDP load.
5. Rollback if needed: Vercel → Deployments → previous → **Instant Rollback** (or `git revert d2da022 && git push`).
