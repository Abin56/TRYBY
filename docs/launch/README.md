# TRYBY — Launch Checklists

Operational runbooks for taking **tryby.in** live and keeping it live. Work through them in order for a first launch; for ongoing deploys, jump to the deployment / rollback docs.

| # | Checklist | When to use |
|---|-----------|-------------|
| 1 | [Pre-Launch Checklist](./01-pre-launch-checklist.md) | Before the **first** public launch. Functional, payments, content, SEO, legal, security, monitoring. |
| 2 | [Deployment Checklist](./02-deployment-checklist.md) | Every production deploy to Vercel. |
| 3 | [Environment Variable Checklist](./03-environment-variables-checklist.md) | Setting up / auditing Vercel env vars. Lists every variable, source, and scope. |
| 4 | [Backup Checklist](./04-backup-checklist.md) | Standing backup policy + the snapshot to take before each deploy. |
| 5 | [Rollback Checklist](./05-rollback-checklist.md) | When a deploy goes wrong. App rollback, DB rollback, comms. |

## Stack at a glance

| Area | Tech |
|------|------|
| Framework | Next.js 16.2.6 (App Router, `app/` dir), React 19 |
| Hosting | Vercel — **root directory = `store/`** |
| Database | PostgreSQL on **Neon** (pooled connection string) |
| ORM / migrations | Prisma 5.22 — committed migrations under `store/prisma/migrations/` |
| Auth | NextAuth v5 (beta) + Google OAuth |
| Payments | Razorpay (**live keys**) + webhook |
| Email | Resend (`official@tryby.in`) |
| Media | Cloudinary |
| Shipping | Shiprocket, Delhivery, DTDC (+ webhooks) |
| Monitoring | Sentry |
| Primary domain | `https://www.tryby.in` |

## ⚠️ Known launch blockers (as of last audit)

These were placeholders / flagged in `store/.env.local` — confirm each is resolved in **Vercel Production** before launch:

- `RAZORPAY_WEBHOOK_SECRET` — placeholder (`your_secret_here`)
- `INTERNAL_API_SECRET` — placeholder
- `CRON_SECRET` — placeholder
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` domain — Resend domain must be verified
- `CLOUDINARY_*` — all placeholders
- `SHIPROCKET_*`, `DELHIVERY_*`, `DTDC_*` — all placeholders
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG` — placeholders
- `GOOGLE_CLIENT_SECRET` — flagged as **compromised**, rotate before launch
- `NEXT_PUBLIC_APP_URL` / `AUTH_URL` — must be `https://www.tryby.in` in prod, not localhost

See the [Environment Variable Checklist](./03-environment-variables-checklist.md) for the full table.
