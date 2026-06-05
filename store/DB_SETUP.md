# TRYBY Database Setup

## Step 1 — Get a PostgreSQL database

**Option A: Neon (recommended for Vercel)**
1. Go to neon.tech → Create account → New project → "tryby-sports"
2. Copy the connection string from Dashboard
3. Paste into `.env.local` as `DATABASE_URL`

**Option B: Supabase**
1. Go to supabase.com → New project
2. Settings → Database → Connection String (URI mode)
3. Paste into `.env.local` as `DATABASE_URL`

## Step 2 — Install tsx (for seed script)

```bash
npm install -D tsx
```

## Step 3 — Run migration

```bash
cd store
npm run db:migrate
# When prompted: enter migration name → "init"
```

## Step 4 — Seed the database

```bash
npm run db:seed
```

## Step 5 — Verify with Prisma Studio

```bash
npm run db:studio
# Opens at localhost:5555
```

## What gets created

- 27 tables (users, products, orders, payments, etc.)
- 1 admin user (admin@tryby.in)
- 4 sport categories (Cricket, Football, Gym, Running)
- 3 announcement messages
- 2 coupons (TRYBY10, FLAT100)
- 1 sample product (MI IPL Jersey)

## Production (Vercel)

Set `DATABASE_URL` in Vercel → Project → Settings → Environment Variables.
Run `prisma migrate deploy` (not `dev`) for production migrations.
