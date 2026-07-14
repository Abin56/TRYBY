# Backup Checklist — TRYBY

A backup you have never restored is a hypothesis, not a backup. This covers the standing policy plus the snapshot to take before every deploy.

> What can hurt you most here: the **database** (orders, customers, payments) and the **secrets**. Code and media are largely recoverable from git and Cloudinary.

---

## What needs backing up

| Asset | Where it lives | Backup mechanism | Recovery owner |
|---|---|---|---|
| Database (orders, customers, payments, catalog) | Neon PostgreSQL | Neon PITR + branches + periodic `pg_dump` | ______ |
| DB schema & migrations | git (`store/prisma/`) | Git remote | ______ |
| Secrets / env vars | Vercel + `.env.local` | Password manager / secret vault | ______ |
| Product images / media | Cloudinary | Cloudinary is source-of-record; optional export | ______ |
| Application code | git | Git remote (GitHub) | ______ |
| Razorpay / shipping config | Provider dashboards | Documented runbook | ______ |

---

## 1. Database (most important)

- [ ] **Neon Point-in-Time Recovery (PITR)** enabled; confirm the retention window (e.g. 7 days) meets your tolerance
- [ ] Understand Neon **branching** — you can branch the prod DB to a point in time for inspection or restore
- [ ] Scheduled logical dump in place (independent of Neon, stored off-platform):
  ```bash
  pg_dump "$DATABASE_URL" -Fc -f tryby_$(date +%F).dump
  ```
  - [ ] Runs on a schedule (daily recommended pre-launch, then per business volume)
  - [ ] Dumps stored encrypted in off-platform storage (e.g. cloud bucket), **not** in the repo
  - [ ] Retention policy defined (e.g. 30 daily + 12 monthly)
- [ ] **Restore drill done at least once:** restore a dump into a throwaway Neon branch and confirm row counts / a sample order look right
  ```bash
  pg_restore --no-owner -d "$TEST_DATABASE_URL" tryby_YYYY-MM-DD.dump
  ```
- [ ] Documented expected **RPO** (max acceptable data loss) and **RTO** (max acceptable downtime)

## 2. Schema & migrations

- [ ] All migrations committed under `store/prisma/migrations/` and pushed to the remote
- [ ] `migration_lock.toml` committed (locks the provider)
- [ ] Never use `prisma db push` against prod (it bypasses migration history → unrecoverable drift)

## 3. Secrets & environment

- [ ] Full set of Production env values stored in a **password manager / vault** (1Password, Bitwarden, Vercel-only is not a backup if the account is lost)
- [ ] A sealed copy of the live values held by a second trusted person
- [ ] Record (not the secret, just the fact + date) of each rotation: `AUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, `RAZORPAY_*`, `INTERNAL_API_SECRET`, `CRON_SECRET`
- [ ] Confirm `.env*` is gitignored (it is) so secrets are never pushed

## 4. Media (Cloudinary)

- [ ] Cloudinary treated as the **source of record** for product imagery — originals are not stored elsewhere by the app
- [ ] Auto-backup add-on enabled, **or** a periodic export of the media library to your own bucket
- [ ] Original source images for the catalog retained outside Cloudinary as a last resort

## 5. Code

- [ ] `main` pushed to GitHub; remote is the canonical copy
- [ ] Release tags / SHAs recorded so any prior production build is reproducible
- [ ] Branch protection on `main` (no force-push, PR required)

## 6. Provider configuration (semi-manual)

Capture in a runbook so it can be rebuilt if an account is wiped:

- [ ] Razorpay: webhook URL + events, settlement account, API key IDs (not secrets)
- [ ] Resend: verified domain + DNS records (SPF/DKIM/DMARC)
- [ ] Shipping carriers: account IDs, webhook URLs, pickup address
- [ ] Vercel: project settings (root dir `store/`, domains, env var **names**)
- [ ] Google Cloud: OAuth client config + authorized URIs

---

## Before EACH production deploy (quick pre-flight)

- [ ] Capture the current production **commit SHA / deployment ID** (for app rollback)
- [ ] Take a **DB snapshot** immediately before applying any migration:
  - Neon branch from "now", **or** `pg_dump` as above
- [ ] Confirm the snapshot exists and is timestamped before running `prisma migrate deploy`
- [ ] Note the snapshot ID in the deploy record so rollback knows the restore point

---

## Cadence summary

| Backup | Frequency |
|---|---|
| Neon PITR | Continuous (managed) |
| Logical `pg_dump` | Daily (pre-launch & high season), else per volume |
| Pre-deploy DB snapshot | Every deploy with a migration |
| Restore drill | Before launch, then quarterly |
| Secret vault sync | On every rotation |
| Cloudinary export | Weekly / monthly |
