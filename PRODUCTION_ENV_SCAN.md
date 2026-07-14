# PRODUCTION ENV / SAFETY SCAN

**Date:** 2026-06-18 · **Canonical domain:** `https://www.tryby.in`
**Scope:** repo source under `store/` (excl. `node_modules`, `.next`, `.git`). `.env.local` is **gitignored — it does NOT deploy**; Vercel supplies production env separately.

---

## 1. `localhost` / `127.0.0.1` in shipping code

| File | Line | Code | Risk |
|------|-----:|------|------|
| `store/app/api/orders/route.ts` | 257 | `process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000"` | Low — SLA call is fire-and-forget (`.catch(()=>{})`); checkout unaffected |
| `store/app/api/admin/orders/[id]/route.ts` | 259 | `… ?? "http://localhost:3000"` | Med — admin action hits localhost in prod if var unset |
| `store/app/api/admin/returns/[id]/route.ts` | 160, 215 | `… ?? "http://localhost:3000"` | Med — admin returns flow |
| `store/app/suppliers/[slug]/page.tsx` | 40 | `… ?? "http://localhost:3000"` | Med — supplier public page data fetch |
| `store/lib/env.ts` | 112–161 | localhost **detector** (flags localhost in prod) | ✅ Not a problem — this is the guard |

### ⚠ Root finding — variable name mismatch
Code reads **`NEXT_PUBLIC_STORE_URL`**, but the configured/required var (`.env.local`, `lib/env.ts`) is **`NEXT_PUBLIC_APP_URL`**. If `NEXT_PUBLIC_STORE_URL` is not set in Vercel, all the rows above fall back to `http://localhost:3000` in production.

**Fix (config, no code change):** add `NEXT_PUBLIC_STORE_URL=https://www.tryby.in` to Vercel Production.
**Alt (code):** change the 5 fallbacks to use `NEXT_PUBLIC_APP_URL` and drop the localhost literal — offered, not applied (5 files, would touch admin/supplier server code).

---

## 2. `REPLACE_` / `your_secret_here` / dummy secrets in shipping code

✅ **Clean.** Only non-secret matches:
- `store/lib/env.ts:63` — `PLACEHOLDER_PATTERNS` array (the detector itself).
- `store/app/admin/system/environment/page.tsx:201` — UI help text describing the detector.
- No hardcoded placeholder **values**, no `sk_test_`/`rzp_test_` keys, no dummy secrets in shipping code.

---

## 3. `.env.local` placeholders — LOCAL ONLY (gitignored, will NOT deploy)
These are dev placeholders. They are **not** a deploy risk by themselves, but each marks a value that must be **real in Vercel Production**:

| Local placeholder | Prod impact if still placeholder in Vercel |
|---|---|
| `AUTH_URL` / `NEXTAUTH_URL` = `localhost` | 🔴 OAuth/session broken — must be `https://www.tryby.in` |
| `NEXT_PUBLIC_APP_URL` = `localhost` | 🔴 wrong canonical/OG/links |
| `RAZORPAY_WEBHOOK_SECRET` = `your_secret_here` | 🔴 Razorpay webhooks rejected |
| `INTERNAL_API_SECRET` = `REPLACE_…` | 🟠 internal routes insecure/failing |
| `SHIPROCKET_WEBHOOK_SECRET` = `REPLACE_…` | 🟠 Shiprocket webhook now returns **500** (fail-closed) |
| `DELHIVERY_WEBHOOK_SECRET` = `REPLACE_…` | 🟠 Delhivery webhook returns **500** (fail-closed) |
| `RESEND_API_KEY` = `REPLACE_…` | 🟡 emails silently fail |
| `CLOUDINARY_*` = `REPLACE_…` | 🟡 image uploads fail |
| `SENTRY_*` = `REPLACE_…` | 🟡 no error monitoring |
| `CRON_SECRET` = `REPLACE_…` | 🟡 cron endpoints unprotected/failing |

> ✅ `.env.local` is correctly gitignored and **not** tracked — no live secrets are committed to the repo. (It does hold live Razorpay keys + real DB creds on disk; keep it uncommitted.)

---

## Scan verdict
- **Hardcoded secrets in committed code:** none ✅
- **Hardcoded localhost in code:** 5 fallback occurrences ⚠ — neutralised by setting `NEXT_PUBLIC_STORE_URL` in Vercel (none are checkout-blocking).
- **Action required before push:** set the Vercel vars above (see `GO_LIVE_CHECKLIST.md`), especially the 🔴 rows.
