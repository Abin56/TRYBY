# Pre-Launch Checklist — TRYBY

Complete **before the first public launch**. Each box is a verifiable state, not an intention. Test on the production domain (`https://www.tryby.in`) once it resolves, not just localhost.

> Owner: ______________   Target launch date: ______________   Sign-off: ______________

---

## 1. Core purchase flow (test end-to-end on production)

- [ ] Homepage loads, hero / featured products render, images served from Cloudinary
- [ ] Category and search pages return correct products
- [ ] Product detail page: variants, price, stock state, add-to-cart all work
- [ ] Cart: add / update qty / remove persists across reload (Zustand hydration — see commit `86746cb`, regression-test the checkout hydration path specifically)
- [ ] Guest checkout works; logged-in checkout pre-fills saved address
- [ ] Shipping serviceability check works for a real pincode (origin `STORE_PINCODE`)
- [ ] Coupon / discount codes apply and recompute totals correctly
- [ ] **Place one real ₹1–₹10 live order end-to-end** and confirm:
  - [ ] Razorpay checkout opens with the **live** key (`rzp_live_…`)
  - [ ] Payment success → order created with `PAID` status
  - [ ] Razorpay webhook (`/api/webhooks/razorpay`) received and signature verified
  - [ ] Order confirmation email delivered (check inbox + spam)
  - [ ] Order visible in `/admin` orders list
  - [ ] **Refund that test order** from admin and confirm refund completes
- [ ] Failed / abandoned payment leaves no phantom `PAID` order

## 2. Payments (Razorpay)

- [ ] Account is in **Live** mode and KYC fully approved
- [ ] Live API keys set in Vercel (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`)
- [ ] Webhook configured in Razorpay dashboard → URL `https://www.tryby.in/api/webhooks/razorpay`
- [ ] `RAZORPAY_WEBHOOK_SECRET` set in Vercel and **matches** the dashboard secret (no longer `your_secret_here`)
- [ ] Webhook events enabled: `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`
- [ ] Settlement bank account confirmed in Razorpay

## 3. Authentication

- [ ] `AUTH_SECRET` is a fresh production value (not shared with dev)
- [ ] `AUTH_URL` = `https://www.tryby.in`, `AUTH_TRUST_HOST=true`
- [ ] **Google OAuth secret rotated** (old one flagged compromised) and updated in Vercel
- [ ] Google Cloud Console → Authorized redirect URIs include `https://www.tryby.in/api/auth/callback/google`
- [ ] Authorized JavaScript origins include `https://www.tryby.in`
- [ ] Login, logout, and session persistence verified on production
- [ ] Admin / RBAC: super-admin account created; role guards block unauthorized access to `/admin/*`

## 4. Catalog & content

- [ ] Run the admin **Launch Readiness** report (`/api/admin/catalog/launch-readiness`) — resolve all flagged items
- [ ] Run **Catalog Health** (`/api/admin/catalog/health`) and **Products Health** — no broken/missing data
- [ ] Every live product has: title, price, ≥1 image, description, category, stock
- [ ] No placeholder / Unsplash demo images remain (prod should be Cloudinary only)
- [ ] Inventory counts are accurate and reflect real stock
- [ ] CMS content blocks, announcements, and homepage merchandising finalized

## 5. Transactional email (Resend)

- [ ] `tryby.in` domain **verified in Resend** (SPF, DKIM, DMARC DNS records published)
- [ ] `RESEND_API_KEY` (live) set in Vercel
- [ ] `RESEND_FROM_EMAIL` (`official@tryby.in`) is on the verified domain
- [ ] Order confirmation, shipping update, and password/auth emails render and deliver (not flagged as spam)

## 6. Shipping

- [ ] At least one carrier fully configured with live credentials (Shiprocket / Delhivery / DTDC)
- [ ] `STORE_PINCODE` set to the real pickup origin
- [ ] Serviceability + rate check returns results for sample destination pincodes
- [ ] Carrier webhooks registered → `https://www.tryby.in/api/webhooks/shiprocket` and `/delhivery`, secrets set
- [ ] Test label generation / AWB assignment for one order

## 7. SEO & discoverability

- [ ] `robots.txt` allows indexing of public pages, blocks `/admin` and `/api`
- [ ] `sitemap.xml` generated and lists live products/categories
- [ ] Page titles, meta descriptions, canonical URLs set
- [ ] Open Graph / Twitter images render (OG route `/og`) — verify with a link preview tool
- [ ] Favicon and app icons present
- [ ] Google Search Console verified for `www.tryby.in`

## 8. Performance

- [ ] Lighthouse (mobile) ≥ 90 performance on home + PDP, or known gaps documented
- [ ] Images use `next/image`; AVIF/WebP enabled (confirmed in `next.config.ts`)
- [ ] No layout shift on hero / product grid
- [ ] Largest pages tested on a throttled 4G connection

## 9. Security

- [ ] All secrets rotated away from any value that ever sat in a shared/committed file
- [ ] CSP and security headers present in prod response (verify `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, etc. via curl/devtools)
- [ ] `INTERNAL_API_SECRET` set in prod — `/api/internal/*` rejects unauthenticated calls
- [ ] `CRON_SECRET` set — cron endpoints reject calls without the secret
- [ ] Admin routes require auth + correct role (spot-check a few `/api/admin/*` endpoints while logged out → expect 401/403)
- [ ] Rate limiting / abuse protection on auth, checkout, coupon endpoints (confirm behavior)
- [ ] No secrets, stack traces, or `.env` values exposed in client bundles or error pages

## 10. Legal & compliance (required by Razorpay)

- [ ] Privacy Policy page live
- [ ] Terms & Conditions page live
- [ ] Refund / Return / Cancellation Policy page live
- [ ] Shipping Policy page live
- [ ] Contact Us page with a real address + support email/phone
- [ ] Pricing shows correct currency (₹) and tax/GST handling is correct
- [ ] Cookie/consent notice if applicable

## 11. Monitoring & observability

- [ ] Sentry live: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` set; a test error appears in Sentry
- [ ] Sentry alerting configured (email/Slack) for new issues and error-rate spikes
- [ ] Vercel deployment + function-error notifications enabled
- [ ] Uptime monitor pinging `https://www.tryby.in` and a lightweight API route
- [ ] Maintenance mode tested: toggle via `/api/admin/maintenance`, confirm `/api/status/maintenance` reflects it, then turn off

## 12. Cross-device / browser

- [ ] Mobile (iOS Safari, Android Chrome), tablet, desktop (Chrome, Safari, Firefox, Edge)
- [ ] Checkout + Razorpay modal works on mobile web
- [ ] Forms usable with on-screen keyboards; tap targets adequate

## 13. Final go / no-go

- [ ] Backups verified — see [Backup Checklist](./04-backup-checklist.md)
- [ ] Rollback plan rehearsed — see [Rollback Checklist](./05-rollback-checklist.md)
- [ ] On-call owner identified for launch window
- [ ] DNS cutover plan + TTL lowered ahead of time
- [ ] **GO / NO-GO decision recorded** ✅
