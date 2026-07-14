# FINAL PRE-PUSH VERIFICATION — TRYBY

> **Status gate.** Pushing to `main` triggers a Vercel **production** deploy to `https://www.tryby.in`.
> Do **not** push until every box in the GO / NO-GO table (§5) is checked.
>
> ⚠️ **Fail-fast warning:** `store/lib/env.ts` now hard-throws at boot in production if any *required* var is
> missing, still holds a placeholder, or points at `localhost`. If you deploy before §1 is complete, the
> **entire site will fail to start** (this is intentional — it prevents a half-configured launch).
>
> Verifier: ______________   Date/time: ______________   Commit SHA to deploy: ______________

---

## 1. Vercel Production environment variables

Set in **Vercel → Project → Settings → Environment Variables**, scope = **Production**. After any change, **redeploy** (Vercel does not hot-reload env into a live deployment).

**Placeholder patterns that will FAIL validation** (treated as "not set"): any value containing `REPLACE_WITH_`, `your-`, `your_`, `YOUR_`, `_here`, `<`, or `>`.

**Generate secrets with:** `openssl rand -base64 32`

### Required (deploy will crash on boot if any is missing/placeholder)

| Variable | Scope | Expected value / format | Notes |
|---|---|---|---|
| `DATABASE_URL` | Server | `postgresql://…neon.tech/neondb?sslmode=require&…` | Pooled Neon string. Keep `connection_limit` + `pool_timeout` params. |
| `AUTH_SECRET` | Server | 32+ byte random base64 | NextAuth v5 name. **Fresh prod value**, not shared with dev. |
| `AUTH_URL` | Server | `https://www.tryby.in` | **No `localhost`.** |
| `AUTH_TRUST_HOST` | Server | `true` | Required on Vercel. |
| `NEXTAUTH_SECRET` | Server | = same as `AUTH_SECRET` | v4 alias; mirror it for any legacy path. |
| `NEXTAUTH_URL` | Server | `https://www.tryby.in` | v4 alias of `AUTH_URL`. |
| `GOOGLE_CLIENT_ID` | Server | `…apps.googleusercontent.com` | From Google Cloud Console. |
| `GOOGLE_CLIENT_SECRET` | Server | `GOCSPX-…` | **MUST be the rotated secret** (old one was exposed). |
| `RAZORPAY_KEY_ID` | Server | `rzp_live_…` | **Live** key, not `rzp_test_`. |
| `RAZORPAY_KEY_SECRET` | Server | live secret | Server-only — never `NEXT_PUBLIC`. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | **Public** | `rzp_live_…` (= `RAZORPAY_KEY_ID`) | Exposed to browser for checkout.js. Key ID only. |
| `RAZORPAY_WEBHOOK_SECRET` | Server | matches Razorpay dashboard webhook secret | See §3. Must NOT be `your_secret_here`. |
| `INTERNAL_API_SECRET` | Server | 32+ byte random | Guards `/api/internal/*`. |
| `CRON_SECRET` | Server | 32+ byte random | Guards cron/scheduled endpoints. |
| `CLOUDINARY_CLOUD_NAME` | Server | cloud name | From Cloudinary dashboard. |
| `CLOUDINARY_API_KEY` | Server | numeric key | |
| `CLOUDINARY_API_SECRET` | Server | secret | Server-only. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | **Public** | = `CLOUDINARY_CLOUD_NAME` | Cloud name is safe to expose. |
| `RESEND_API_KEY` | Server | `re_…` | From Resend. |
| `RESEND_FROM_EMAIL` | Server | `official@tryby.in` | Domain must be **verified** in Resend (SPF/DKIM). |
| `NEXT_PUBLIC_APP_URL` | **Public** | `https://www.tryby.in` | **No `localhost`.** Drives absolute links / OG / emails. |

### Shipping (configure at least one carrier before enabling that integration)

| Variable | Scope | Expected value / format |
|---|---|---|
| `STORE_PINCODE` | Server | real 6-digit pickup-origin pincode |
| `SHIPROCKET_EMAIL` / `SHIPROCKET_PASSWORD` | Server | Shiprocket API login |
| `SHIPROCKET_WEBHOOK_SECRET` | Server | matches Shiprocket webhook config |
| `DELHIVERY_API_KEY` / `DELHIVERY_API_BASE` | Server | Delhivery API key / `https://track.delhivery.com` |
| `DELHIVERY_WEBHOOK_SECRET` | Server | shared token set in Delhivery webhook config |

> **Webhook auth note:** Shiprocket & Delhivery webhooks now **fail closed** — if their secret is unset/placeholder in production, those endpoints return **HTTP 500** and reject all webhooks (they no longer silently accept unsigned requests). Set the secret before relying on carrier push tracking.

### Optional (recommended — site boots without them)

| Variable | Scope | Expected value / format |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Public | Sentry DSN — without it, errors are not reported |
| `SENTRY_ORG` | Server | Sentry org slug (source-map upload) |
| `SENTRY_PROJECT` | Server | defaults to `tryby-store` |
| `SENTRY_AUTH_TOKEN` | Server | source-map upload token |

### Post-deploy verification of env

- [ ] After deploy, open **Vercel → Deployment → Runtime Logs** and find the masked startup block:
  ```
  ─── TRYBY env presence (masked) ───
    ✓ DATABASE_URL: set ✓ (len NN)
    ✓ AUTH_URL: https://www.tryby.in
    ✓ NEXT_PUBLIC_APP_URL: https://www.tryby.in
    ...
  ───────────────────────────────────
  ```
- [ ] Every **required** row shows `✓` (no `✗ MISSING`, no `INVALID`).
- [ ] `AUTH_URL` and `NEXT_PUBLIC_APP_URL` display `https://www.tryby.in` (not localhost).
- [ ] No "ENV VALIDATION FAILED" banner in logs.

---

## 2. Google OAuth settings

**Google Cloud Console → APIs & Services → Credentials → (your OAuth 2.0 Client ID).**

### Authorized JavaScript origins
```
https://www.tryby.in
https://tryby.in
```
- [ ] `https://www.tryby.in` present
- [ ] `https://tryby.in` present (if the apex also serves the app / redirects)
- [ ] **No** `http://localhost:3000` left in the Production client (use a separate dev client for localhost)

### Authorized redirect URIs
NextAuth v5 Google callback path is `/api/auth/callback/google`:
```
https://www.tryby.in/api/auth/callback/google
```
- [ ] `https://www.tryby.in/api/auth/callback/google` present, **exactly** (https, `www`, no trailing slash)
- [ ] If apex is used: `https://tryby.in/api/auth/callback/google`
- [ ] **No** `http://localhost:3000/api/auth/callback/google` in the Production client

### Client secret
- [ ] `GOOGLE_CLIENT_SECRET` has been **rotated** in Console (old exposed secret invalidated)
- [ ] The **new** secret is the one set in Vercel (§1)

### OAuth consent screen
- [ ] Publishing status = **In production** (not "Testing" — Testing limits to allow-listed test users and expires refresh tokens)
- [ ] User type = **External**
- [ ] App name, support email, and developer contact email filled in
- [ ] App logo + app domain (`tryby.in`) set
- [ ] Authorized domains include `tryby.in`
- [ ] Links to **Privacy Policy** (`https://www.tryby.in/privacy-policy`) and **Terms** (`https://www.tryby.in/terms`) added
- [ ] Scopes limited to `openid`, `email`, `profile` (no sensitive scopes → avoids verification delay)

### Functional check (after deploy)
- [ ] "Continue with Google" on `https://www.tryby.in/auth/login` completes without `CallbackRouteError` / `redirect_uri_mismatch`
- [ ] A Google login that matches an existing email links correctly (no duplicate account)

---

## 3. Razorpay webhook configuration

**Razorpay Dashboard → Settings → Webhooks → Add/Edit Webhook.**

### Webhook URL
```
https://www.tryby.in/api/webhooks/razorpay
```
- [ ] URL set exactly as above (https, `www`, no trailing slash)
- [ ] Webhook status = **Active**

### Secret requirements
- [ ] A webhook **secret** is set in the Razorpay dashboard
- [ ] The **same** value is set as `RAZORPAY_WEBHOOK_SECRET` in Vercel (§1) — they must match **character-for-character**
- [ ] It is **not** the placeholder `your_secret_here`
- [ ] Verification = HMAC-SHA256 of the **raw body** with timing-safe compare (already implemented; a mismatch returns **401**)

### Events to enable
- [ ] `payment.captured`
- [ ] `payment.failed`
- [ ] `order.paid`
- [ ] `refund.processed` (and/or `refund.created`)

### Account state
- [ ] Razorpay account is in **Live** mode with KYC approved
- [ ] Settlement bank account confirmed

### Steps to verify webhook delivery
1. [ ] In the Razorpay dashboard webhook page, use **"Send test webhook"** (or trigger via a real ₹1 payment in §4).
2. [ ] Razorpay shows the delivery with a **2xx** response (not 401/500).
   - 401 → secret mismatch between dashboard and `RAZORPAY_WEBHOOK_SECRET`.
   - 500 → app/server error (check Vercel logs).
3. [ ] In **Vercel → Runtime Logs**, confirm the `/api/webhooks/razorpay` invocation logged success (no "signature mismatch").
4. [ ] Confirm the webhook is **idempotent**: re-sending the same event does not create a duplicate order/payment record (dedup is keyed on `eventId|eventType`).

---

## 4. ₹1 live smoke test

> Use a **real** ₹1–₹10 order with the **live** Razorpay key. Refund it at the end. Do this on `https://www.tryby.in`.

### A. Order creation
- [ ] Add a product to cart; cart persists across a page refresh (Zustand hydration)
- [ ] Go to `/checkout`; page loads the cart (no false "empty cart")
- [ ] Enter / select a serviceable address; serviceability check passes for the pincode
- [ ] Click "Continue to Payment" → an order is created (status `PENDING`) and you land on `/checkout/payment`

### B. Payment success
- [ ] Razorpay modal opens using the **live** key (`rzp_live_…`)
- [ ] Complete the ₹1 payment (UPI/card)
- [ ] Payment is verified server-side (`/api/payments/razorpay/verify`) — no signature error
- [ ] Redirected to the order confirmation / success page

### C. Webhook received
- [ ] Razorpay dashboard shows the `payment.captured` / `order.paid` webhook delivered with **2xx**
- [ ] Vercel logs show `/api/webhooks/razorpay` processed it (no 401/500)

### D. Order status update
- [ ] Order moves to **`PAID`** (not stuck on `PENDING`)
- [ ] Order appears in **`/admin` → Orders** with correct amount and customer
- [ ] No phantom duplicate order from the same cart

### E. Email confirmation
- [ ] Order-confirmation email is delivered (check inbox **and** spam)
- [ ] Sender = `official@tryby.in`; not flagged as spam (SPF/DKIM pass)

### F. Refund test
- [ ] Refund the order from **Admin → Payments → Refund** (`/api/admin/payments/[id]/refund`)
- [ ] Razorpay dashboard shows the refund as **processed**
- [ ] `refund.processed` webhook delivered with **2xx**; order/payment state reflects the refund
- [ ] No duplicate refund triggered

---

## 5. GO / NO-GO

> **All boxes must be checked to GO.** Any unchecked box = **NO-GO**.

| # | Gate | Status |
|---|------|--------|
| 1 | All **required** Vercel Production env vars set, no placeholders, no localhost (§1) | ☐ |
| 2 | Masked startup log shows every required var `✓`; no validation-failed banner (§1) | ☐ |
| 3 | `RAZORPAY_KEY_ID` / `NEXT_PUBLIC_RAZORPAY_KEY_ID` are **live** keys (§1) | ☐ |
| 4 | `GOOGLE_CLIENT_SECRET` rotated and updated in Vercel (§1, §2) | ☐ |
| 5 | Google JS origins + redirect URIs set for `www.tryby.in`; no localhost (§2) | ☐ |
| 6 | OAuth consent screen **In production** with policy links (§2) | ☐ |
| 7 | Google sign-in works on prod (no CallbackRouteError) (§2) | ☐ |
| 8 | Razorpay webhook URL active + secret matches Vercel (§3) | ☐ |
| 9 | Required Razorpay events enabled; test delivery returns 2xx (§3) | ☐ |
| 10 | ₹1 smoke test A–E all pass (§4) | ☐ |
| 11 | Refund test (§4.F) passes | ☐ |
| 12 | DB migrations applied / none pending *(confirmed already applied)* | ☑ |
| 13 | `tsc --noEmit` passes *(verified: exit 0)* | ☑ |
| 14 | `next build` passes *(verified: exit 0)* | ☑ |
| 15 | Working tree reviewed; only intended launch changes staged (no half-finished concurrent work) | ☐ |
| 16 | Rollback plan ready (previous Vercel deployment noted for instant promote) | ☐ |

**Decision:**  ☐ **GO**   ☐ **NO-GO**

Signed off by: ______________   Date/time: ______________
