# Environment Variable Checklist — TRYBY

Every variable the app reads, where to get it, and its scope. Set all **Production**-required vars in **Vercel → Settings → Environment Variables** (scope: Production; add Preview separately if needed). Never commit real values — `.env*` is gitignored.

**Scope key:** `Server` = server-only secret (never sent to browser). `Public` = `NEXT_PUBLIC_*`, **bundled into client JS** — must contain no secrets.

> Source of truth for names: `store/.env.local`. At last audit, several values were still `REPLACE_WITH_…` placeholders — those are launch blockers and marked ⛔ below.

---

## How to set in Vercel

1. Settings → Environment Variables → add each key with the **Production** value.
2. Keep dev-only values (`localhost` URLs) **out** of Production.
3. After changing env vars, **redeploy** — Vercel does not hot-reload env into an existing deployment.
4. Generate random secrets with: `openssl rand -base64 32`.

---

## Database

| Variable | Scope | Required | Source / notes |
|---|---|---|---|
| `DATABASE_URL` | Server | ✅ | Neon pooled connection string. Keep `?sslmode=require` + `connection_limit` + `pool_timeout` params (serverless safe). |

## Auth (NextAuth v5)

| Variable | Scope | Required | Source / notes |
|---|---|---|---|
| `AUTH_SECRET` | Server | ✅ | `openssl rand -base64 32`. **Use a fresh prod value.** |
| `AUTH_URL` | Server | ✅ | `https://www.tryby.in` in prod (not localhost). |
| `AUTH_TRUST_HOST` | Server | ✅ | `true` on Vercel. |
| `NEXTAUTH_SECRET` | Server | ◻ | Legacy v4 alias; mirror `AUTH_SECRET` if any v4 code path uses it. |
| `NEXTAUTH_URL` | Server | ◻ | Legacy v4 alias; mirror `AUTH_URL`. |
| `GOOGLE_CLIENT_ID` | Server | ✅ | Google Cloud Console → Credentials. |
| `GOOGLE_CLIENT_SECRET` | Server | ⛔ | **Rotate — flagged compromised.** Regenerate in Google Console, update redirect URIs to prod domain. |

## Payments (Razorpay)

| Variable | Scope | Required | Source / notes |
|---|---|---|---|
| `RAZORPAY_KEY_ID` | Server | ✅ | Live key (`rzp_live_…`). |
| `RAZORPAY_KEY_SECRET` | Server | ✅ | Live secret — keep server-only. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public | ✅ | Same key_id, exposed for checkout.js. **Never** put the secret here. |
| `RAZORPAY_WEBHOOK_SECRET` | Server | ⛔ | Placeholder (`your_secret_here`). Set to the secret configured in the Razorpay dashboard webhook. |

## Email (Resend)

| Variable | Scope | Required | Source / notes |
|---|---|---|---|
| `RESEND_API_KEY` | Server | ⛔ | Placeholder. Resend → API Keys. |
| `RESEND_FROM_EMAIL` | Server | ✅ | `official@tryby.in` — domain must be **verified** in Resend (SPF/DKIM). |

## Media (Cloudinary)

| Variable | Scope | Required | Source / notes |
|---|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | Server | ⛔ | Placeholder. Cloudinary dashboard. |
| `CLOUDINARY_API_KEY` | Server | ⛔ | Placeholder. |
| `CLOUDINARY_API_SECRET` | Server | ⛔ | Placeholder — keep server-only. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Public | ⛔ | Placeholder. Cloud name only (safe to expose). |

## Shipping carriers

| Variable | Scope | Required | Source / notes |
|---|---|---|---|
| `SHIPROCKET_EMAIL` | Server | ⛔* | Placeholder. Shiprocket → Settings → API. |
| `SHIPROCKET_PASSWORD` | Server | ⛔* | Placeholder. |
| `SHIPROCKET_WEBHOOK_SECRET` | Server | ⛔* | Set in Shiprocket webhook settings. |
| `DELHIVERY_API_KEY` | Server | ⛔* | Placeholder. Delhivery → My Account → API. |
| `DELHIVERY_API_BASE` | Server | ◻ | Defaults to `https://track.delhivery.com`. |
| `DELHIVERY_WEBHOOK_SECRET` | Server | ⛔* | Set in Delhivery webhook settings. |
| `DTDC_API_KEY` | Server | ⛔* | Placeholder. DTDC business integration. |
| `DTDC_CUSTOMER_CODE` | Server | ⛔* | Placeholder. |
| `STORE_PINCODE` | Server | ✅ | Real pickup-origin pincode (default pickup for serviceability). |

\* At least **one** carrier must be fully configured for launch; the others are optional.

## App URLs

| Variable | Scope | Required | Source / notes |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Public | ✅ | `https://www.tryby.in` in prod. Drives absolute links, OG, emails. **Do not** ship the localhost value to prod. |

## Internal / cron secrets

| Variable | Scope | Required | Source / notes |
|---|---|---|---|
| `INTERNAL_API_SECRET` | Server | ⛔ | **Required in prod.** `openssl rand -base64 32`. Guards `/api/internal/*`. In dev it may be omitted (routes accept all). |
| `CRON_SECRET` | Server | ⛔ | `openssl rand -base64 32`. Guards `/api/internal/shipping/sync` and any Vercel Cron jobs. |

## Monitoring (Sentry)

| Variable | Scope | Required | Source / notes |
|---|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Public | ⛔ | Placeholder. Sentry project DSN (safe to expose). Without it, errors aren't reported. |
| `SENTRY_ORG` | Server | ⛔ | Placeholder. Used for source-map upload at build. |
| `SENTRY_PROJECT` | Server | ◻ | Defaults to `tryby-store`. |

---

## Audit steps

- [ ] Every ✅ and ⛔ row above has a real Production value in Vercel (no `REPLACE_WITH_…`, no `your_secret_here`)
- [ ] No secret appears in a `NEXT_PUBLIC_*` variable
- [ ] Prod URLs use `https://www.tryby.in`, not localhost
- [ ] `GOOGLE_CLIENT_SECRET` rotated; old value invalidated
- [ ] `AUTH_SECRET`, `INTERNAL_API_SECRET`, `CRON_SECRET` are unique random prod values
- [ ] Secrets are backed up in a password manager / secret vault (see [Backup Checklist](./04-backup-checklist.md))
- [ ] Redeployed after any env change
