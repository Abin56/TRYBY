# TRYBY — Staging Seed Validation

> **Validation & documentation only — no code, no new seeds, no commits.**
> Validates [prisma/seed-test.ts](../prisma/seed-test.ts) against
> [docs/STAGING_TEST_ACCOUNTS.md](./STAGING_TEST_ACCOUNTS.md) and maps coverage to
> [PRODUCTION_TEST_PLAN.md](../../PRODUCTION_TEST_PLAN.md) (131 cases).
>
> Reviewed: account provisioning, credential storage, idempotency, safety guards, and
> expected row counts — all cross-checked against the seed source.

---

## 1. Seeded accounts (complete list)

Shared password for **every** account: **`Test@1234`** (bcrypt cost 12).
Admin hash → `AdminProfile.passwordHash`; customer/supplier hash → `Account.access_token`
(`provider:"credentials"`). Source: [lib/auth.ts](../lib/auth.ts).

### 1a. Admins — 12 accounts (all 10 `AdminRole`s + 2 negatives)

| Email | Password | Role (`AdminRole`) | Status |
|---|---|---|---|
| `admin.super@test.tryby.in` | `Test@1234` | SUPER_ADMIN | Active |
| `admin.store@test.tryby.in` | `Test@1234` | ADMIN | Active |
| `admin.ops@test.tryby.in` | `Test@1234` | OPERATIONS_MANAGER | Active |
| `admin.content@test.tryby.in` | `Test@1234` | CONTENT_MANAGER | Active |
| `admin.product@test.tryby.in` | `Test@1234` | PRODUCT_MANAGER | Active |
| `admin.orders@test.tryby.in` | `Test@1234` | ORDER_MANAGER | Active |
| `admin.finance@test.tryby.in` | `Test@1234` | FINANCE_MANAGER | Active |
| `admin.support@test.tryby.in` | `Test@1234` | SUPPORT_AGENT | Active |
| `admin.supplier@test.tryby.in` | `Test@1234` | SUPPLIER_MANAGER | Active |
| `admin.marketing@test.tryby.in` | `Test@1234` | MARKETING_MANAGER | Active |
| `admin.disabled@test.tryby.in` | `Test@1234` | ADMIN | **Disabled** (`isDisabled=true`) |
| `admin.mustreset@test.tryby.in` | `Test@1234` | ADMIN | **Must-reset** (`mustResetPwd=true`) |

### 1b. Customers — 9 personas

| Email | Password | Role | Status |
|---|---|---|---|
| `customer.new@test.tryby.in` | `Test@1234` | CUSTOMER | Active — no orders |
| `customer.loyal@test.tryby.in` | `Test@1234` | CUSTOMER | Active — 4 orders, loyalty + segment |
| `customer.cod@test.tryby.in` | `Test@1234` | CUSTOMER | Active — COD buyer |
| `customer.addresses@test.tryby.in` | `Test@1234` | CUSTOMER | Active — 2 shipping addresses |
| `customer.return@test.tryby.in` | `Test@1234` | CUSTOMER | Active — return/refund history |
| `customer.locked@test.tryby.in` | `Test@1234` | CUSTOMER | **Locked** (`loginFailures=5`, `lockedUntil` future) |
| `customer.fraud@test.tryby.in` | `Test@1234` | CUSTOMER | Active — **high-risk**, COD-blocked |
| `customer.wishlist@test.tryby.in` | `Test@1234` | CUSTOMER | Active — 3 wishlist items, no orders |
| `customer.inactive@test.tryby.in` | `Test@1234` | CUSTOMER | **Inactive** (`isActive=false`) |

### 1c. Suppliers — 6 accounts

| Email | Password | Company | Status | Tier | Commission |
|---|---|---|---|---|---|
| `supplier.approved@test.tryby.in` | `Test@1234` | Acme Sports Pvt Ltd | APPROVED | GOLD | 12% |
| `supplier.pending@test.tryby.in` | `Test@1234` | NewKit Traders | **PENDING** | BRONZE | 15% |
| `supplier.suspended@test.tryby.in` | `Test@1234` | ShadyGoods LLP | **SUSPENDED** | BRONZE | 15% |
| `supplier.platinum@test.tryby.in` | `Test@1234` | EliteGear India | APPROVED | PLATINUM | 10% |
| `supplier.silver@test.tryby.in` | `Test@1234` | SilverLine Apparel | APPROVED | SILVER | 15% |
| `supplier.payouts@test.tryby.in` | `Test@1234` | PayoutTest Co | APPROVED | BRONZE | 15% |

---

## 2. Expected seeded data counts

### Headline counts (the deliverable's core entities)

| Entity | Expected count | Notes |
|---|---|---|
| **Admins** | **12** | 10 distinct `AdminRole`s (ADMIN used by 3: store + disabled + mustreset) |
| **Customers** | **9** | personas above |
| **Suppliers** | **6** | every `SupplierStatus` + 4 tiers |
| **Products** | **12** | every `Sport` enum + out-of-stock / archived / inactive |
| **Coupons** | **11** | every `CouponType` + every rejection path |
| **Orders** | **13** | every `OrderStatus` + every `PaymentStatus` |
| **Returns** | **2** | 1 REFUNDED (O5), 1 REQUESTED (O11) |
| **Settlements** | **2** | 1 HOLDING (O2), 1 AVAILABLE→payout (O13) |
| **Reviews** | **1** | APPROVED, verified (O2) |

### Supporting rows (for completeness)

| Entity | Count | Entity | Count |
|---|---|---|---|
| Users (total) | 27 | Order items | 14 |
| Credential `Account`s | 27 | Payments | 13 |
| `AdminProfile`s | 12 | Shipments | 9 |
| `Supplier` profiles | 6 | Order status history | 13 |
| Addresses | 7 | Return items | 2 |
| Categories | 7 | Supplier ledger entries | 2 |
| Warehouse | 1 | Payouts | 1 (PENDING) |
| Products | 12 | Loyalty points | 1 |
| Product variants | 24 | Customer segment | 1 |
| Product badges | 7 | Customer risk profile | 1 |
| Coupons | 11 | Order risk assessment | 1 |
| Wishlist items | 3 | | |

> Counts are deterministic — a clean `seed:test:reset` reproduces them exactly. The
> enrichment rows (settlements, ledger, payout, review, loyalty, risk) are wrapped in
> `safe()`; on a **partially-migrated** DB those specific rows may be skipped (logged as
> `⚠️ skipped …`) while the core accounts/products/coupons/orders still seed.

---

## 3. Execution checklist

Run from the `store/` directory against a **staging / disposable** database.

- [ ] **`npx prisma generate`** — regenerate the Prisma client to match the schema
      (required after any schema change; ensures risk/settlement delegates exist).
- [ ] **`npx prisma db push`** — push all tables to the staging DB (or `prisma migrate deploy`).
      Confirms the enrichment tables exist so no `safe()` step is skipped.
- [ ] **`npm run seed:test`** — idempotent upsert. Re-run any number of times → same counts,
      no duplicates. Expect final banner: `Admins: 12 · Customers: 9 · Suppliers: 6 …`.
- [ ] **`npm run seed:test:reset`** — wipes **only** `tst_`-prefixed rows (logged per table),
      then re-seeds from clean. Use this to reset to a known-good baseline between QA cycles.

**Recommended pre-step for full storefront:** also run **`npm run db:seed`** (the production
[prisma/seed.ts](../prisma/seed.ts)). The test seed does **not** create homepage
`ContentBlock`/`SiteSettings` rows — those come from the production seed and are needed for
CUST-01 (homepage) and ADM-13 (CMS) to render fully.

**Verify after seeding (optional spot-checks):**
- Login `admin.super@test.tryby.in` / `Test@1234` → `/admin` loads with full nav.
- Login `supplier.payouts@test.tryby.in` → `/supplier/payouts` shows a PENDING payout.
- Open product `test-mi-paltan-jersey-2025` → variants render; `TEST-GYM-TEE-S` is out of stock.

---

## 4. Safety checklist (with proof)

Each claim is verifiable in [prisma/seed-test.ts](../prisma/seed-test.ts) — line refs and a
grep you can run to confirm.

| # | Claim | Proof / how to verify |
|---|---|---|
| 1 | **No real Razorpay IDs** | Only payment identifiers are `order_TEST<key>` (line 705) and `pay_TEST<key>` (line 706) — string literals, never values returned by Razorpay. COD payments use `null`. Verify: `rg "razorpay(Order\|Payment)Id" prisma/seed-test.ts` → only the `…_TEST…`/`null` assignments. |
| 2 | **No real courier AWBs** | `trackingNumber` is `TESTAWB<key>` (line 724); the seed makes **zero** courier API calls. `courier` is only an enum label (`SHIPROCKET`). Verify: `rg "TESTAWB\|courierShipmentId\|awbCode" prisma/seed-test.ts`. |
| 3 | **No production emails** | Every email is built from `TEST_DOMAIN = "@test.tryby.in"` (line 40) — a non-routable test domain; no mail is sent (no Resend import). Verify: `rg "email:\|@" prisma/seed-test.ts` → all addresses end `@test.tryby.in`. |
| 4 | **No production DB writes** | Refuses to run under `NODE_ENV=production` unless `ALLOW_TEST_SEED=1` (line 86); prints the **masked** target host before writing (`assertSafe`). All rows are namespaced (`tst_` ids + `@test.tryby.in`), so it can neither collide with nor overwrite real records; reset deletes **only** `id startsWith "tst_"` (line 101). It writes to whatever `DATABASE_URL` you point it at — so point it at staging. |
| 5 | **Idempotent re-runs** | Every row uses a deterministic `tst_`-prefixed id and is written via `upsert` (or upsert on a unique natural key). Re-running updates in place — counts in §2 stay identical. Verify: run `npm run seed:test` twice; counts don't change. |
| 6 | **`NODE_ENV=production` protection** | `assertSafe()` (lines 84–93) hard-exits with code 1 and a message before any write when `NODE_ENV==="production"` and `ALLOW_TEST_SEED!=="1"`. |

> **Honest caveat on #4:** the script is not *incapable* of writing to a production DB — it
> writes to the configured `DATABASE_URL`. Its protections are (a) the `NODE_ENV=production`
> hard stop, and (b) total namespacing so it never touches non-`tst_` rows. Always confirm the
> masked host printed at startup points at staging before proceeding.

---

## 5. QA matrix — PRODUCTION_TEST_PLAN.md coverage

**Legend** — ✅ **Ready**: all test *data* prerequisites exist in the seed; the case is
executable against the seeded accounts (a live test-mode action such as paying with a Razorpay
test card or firing a webhook is the test itself, not a data gap). ◑ **Partial**: accounts
exist but a data prerequisite is missing/partial, or the case needs a non-seedable external
identity (Google account, real email inbox, fake-vs-real gateway id). ✗ **Gap**: a core data
prerequisite is absent — must be created manually first.

### 1. Customer Flow

| Case | Coverage | Seeded resource / note |
|---|---|---|
| CUST-01 Browse storefront | ◑ | Products/categories seeded; **homepage `ContentBlock`s come from `db:seed`**, not the test seed |
| CUST-02 Listing / filters | ✅ | Products across all 7 sports |
| CUST-03 Search | ✅ | "Jersey"/"Shoes"/etc. product names |
| CUST-04 Product detail / variant | ✅ | Multi-variant products (e.g. `test-mi-paltan-jersey-2025`) |
| CUST-05 Out-of-stock variant | ✅ | `TEST-GYM-TEE-S` (stock 0) |
| CUST-06 Add to cart | ✅ | `customer.new` + in-stock variants |
| CUST-07 Wishlist | ✅ | `customer.wishlist` (3 items) or any customer |
| CUST-08 Guest → auth at checkout | ✅ | `customer.new` + products |
| CUST-09 Register | ✅ | Seed-independent; `@test.tryby.in` won't collide |
| CUST-10 Login (credentials + Google) | ◑ | Credentials ✅ via seeded accounts; **Google OAuth needs a real Google account** |
| CUST-11 Forgot/reset password | ◑ | Account exists, but reset email to `@test.tryby.in` is **non-deliverable** — use a real inbox account |
| CUST-12 Address management | ✅ | `customer.addresses` (home + office) |
| CUST-13 Coupon apply (valid/expired/capped) | ✅ | `TESTPCT10` (valid), `TESTEXPIRED`, `TESTUSEDUP`, `TESTDISABLED`, `TESTNOTYET`, `TESTMINHIGH` |
| CUST-14 Place order (prepaid) | ✅ | Customer+products; live Razorpay test success |
| CUST-15 Place order (COD) | ✅ | `customer.cod`; live serviceability |
| CUST-16 Cart hydration regression | ✅ | Products + customer |
| CUST-17 Order history | ✅ | `customer.loyal` (orders O2/O6/O8/O13) |
| CUST-18 Order tracking | ◑ | Shipped orders show **seeded** status; live courier lookup of `TESTAWB…` won't resolve |
| CUST-19 Account settings | ✅ | Any seeded customer |
| CUST-20 Reviews (delivered item) | ✅ | `customer.loyal` delivered O8 (City FC kit) |
| CUST-21 Static/legal pages | ✅ | Seed-independent |
| CUST-22 Data isolation (others' order) | ✅ | Cross-user order ids exist (open `customer.loyal`'s order as `customer.new`) |

### 2. Payments

| Case | Coverage | Seeded resource / note |
|---|---|---|
| PAY-01 Create Razorpay order | ✅ | Customer + cart; live test mode |
| PAY-02 Success card | ✅ | live test card |
| PAY-03 UPI | ✅ | `success@razorpay` |
| PAY-04 Netbanking / wallet | ✅ | live simulator |
| PAY-05 Signature tampering | ✅ | live create → tamper verify |
| PAY-06 Ownership check | ✅ | Cross-user payments seeded (verify another order's payment) |
| PAY-07 Idempotency | ◑ | CAPTURED orders exist, but a true signature re-verify needs a **real** Razorpay payment (seeded ids are fake) |
| PAY-08 Non-payable state | ✅ | O9 CANCELLED + O4 SHIPPED → verify → expect 409 |
| PAY-09 Failed payment | ✅ | O7 FAILED seeded; or live failure card |
| PAY-10 Abandoned payment | ◑ | Create fresh PENDING via live checkout |
| PAY-11 COD confirm | ✅ | O3 COD order + `customer.cod` |
| PAY-12 Razorpay webhook | ✅ | Orders seeded; fire test webhook |
| PAY-13 Amount integrity | ✅ | live checkout manipulation |
| PAY-14 Admin refund (full/partial) | ◑ | UI + states ready (O5 REFUNDED, O8 PARTIALLY_REFUNDED); **real refund API needs a real captured payment** |
| PAY-15 Reconciliation | ✅ | Seeded fake ids → reconciliation correctly **flags mismatches** |
| PAY-16 Payment health dashboard | ✅ | Payments across all 6 `PaymentStatus` values |

### 3. Shipping

| Case | Coverage | Seeded resource / note |
|---|---|---|
| SHP-01 Serviceability check | ✅ | Addresses incl. remote `795001`; live API |
| SHP-02 COD by pincode | ✅ | `customer.fraud` COD-blocked + pincodes |
| SHP-03 Book shipment (admin) | ✅ | O1 has PENDING shipment; live courier sandbox |
| SHP-04 Print label | ◑ | Seeded shipments have **no `labelUrl`** — book first |
| SHP-05 Shiprocket webhook | ✅ | Orders/shipments seeded; fire webhook |
| SHP-06 Delhivery webhook | ✅ | Same |
| SHP-07 Courier selection logic | ✅ | Orders + addresses |
| SHP-08 Tracking visibility | ◑ | Internal status from seeded shipment; live `TESTAWB…` lookup N/A |
| SHP-09 Shipping analytics | ✅ | 9 shipments across statuses (limited volume) |
| SHP-10 Integration config | ◑ | Admin account ready; needs real courier credentials |
| SHP-11 Webhook security | ✅ | Post bad/missing signature |

### 4. Returns

| Case | Coverage | Seeded resource / note |
|---|---|---|
| RET-01 Eligible return (≤7 days) | ✅ | Delivered O8/O13 (`deliveredAt` ≈ 1 day ago) |
| RET-02 Non-delivered block | ✅ | O4 SHIPPED / O6 PROCESSING → expect 422 |
| RET-03 Window enforcement (>7 days) | ✗ | **All seeded delivered shipments are `deliveredAt`≈1 day ago** — backdate one to test expiry |
| RET-04 Duplicate return block | ✅ | O11 already has an active REQUESTED return |
| RET-05 Return reasons + images | ✅ | Delivered order; image upload runtime |
| RET-06 Customer-only guard | ✅ | Call `/api/returns` as admin/supplier accounts |
| RET-07 Admin approve | ✅ | O11 REQUESTED return → approve |
| RET-08 Admin reject | ✅ | O11 (or new) → reject |
| RET-09 Received → refund | ✅ | O11 state machine (real refund payout caveat as PAY-14) |
| RET-10 Return timeline | ✅ | O5/O11 returns |
| RET-11 Supplier return view | ✅ | O5/O11 are SilverLine items → `supplier.silver` sees them, others don't |
| RET-12 Return → settlement deduction | ◑ | Returned items belong to SilverLine, which has **no seeded settlement** to deduct from |
| RET-13 Returns analytics | ◑ | 2 returns across 2 reasons (limited data) |

### 5. Admin Flow

| Case | Coverage | Seeded resource / note |
|---|---|---|
| ADM-01 Admin login / non-admin block | ✅ | admins + customer/supplier accounts |
| ADM-02 Product create | ✅ | `admin.product` |
| ADM-03 Product edit / variants | ✅ | 12 seeded products |
| ADM-04 Bulk operations | ✅ | seeded products |
| ADM-05 Archive / restore | ✅ | `test-archived-jersey-2019` already archived |
| ADM-06 Product import CSV | ✗ | **No CSV file** in seed — supply one |
| ADM-07 Order management | ✅ | 13 orders across statuses |
| ADM-08 Order export | ✅ | seeded orders |
| ADM-09 Inventory adjust | ✅ | seeded variants + warehouse |
| ADM-10 Inventory sync upload | ✗ | **No supplier feed / `SupplierSkuMap`** seeded |
| ADM-11 Purchase orders | ◑ | Suppliers/products/warehouse ready; **no seeded PO** (create new) |
| ADM-12 Coupons CRUD | ✅ | 11 coupons to edit/delete |
| ADM-13 CMS / homepage | ◑ | **No `ContentBlock` in test seed** — run `db:seed` or create a block |
| ADM-14 Reviews moderation | ◑ | Seeded review is **APPROVED**; create a PENDING one (CUST-20) to moderate |
| ADM-15 Customers / CRM | ✅ | Customers with orders, segment, risk |
| ADM-16 Marketing campaigns | ✅ | `customer.loyal` has a segment; live email send |
| ADM-17 Finance / profit | ✅ | Orders + settlements + ledger + payout + `costPrice` |
| ADM-18 Fraud / risk review | ◑ | O10 flagged + fraud risk profile ready; **no `Blacklist` rows** seeded |
| ADM-19 Reports / KPI | ✅ | seeded orders/suppliers (limited volume) |
| ADM-20 Audit log integrity | ✅ | Perform a seeded-account action → audit row created |
| ADM-21 Sessions management | ✅ | Login a seeded account → revoke |
| ADM-22 System tools | ✅ | `admin.super` toggles |

### 6. Supplier Flow

| Case | Coverage | Seeded resource / note |
|---|---|---|
| SUP-01 Supplier apply | ✅ | `supplier.pending` is the PENDING result; apply creates new |
| SUP-02 Admin approve supplier | ✅ | `supplier.pending` → approve via `admin.supplier` |
| SUP-03 Supplier login gating | ✅ | approved logs in; pending/suspended blocked |
| SUP-04 Dashboard | ✅ | `supplier.approved` / `supplier.payouts` have data |
| SUP-05 Product submission | ✅ | `supplier.approved` adds product |
| SUP-06 Admin approve product | ◑ | **No pending supplier product** seeded — submit via SUP-05 first |
| SUP-07 Supplier orders (own only) | ✅ | Each active supplier owns items in seeded orders |
| SUP-08 Documents & agreements | ◑ | **No `SupplierDocument`/`SupplierAgreement`** seeded — upload at runtime |
| SUP-09 Wallet / ledger | ✅ | `supplier.platinum` (ledger O2), `supplier.payouts` (ledger O13 + balance) |
| SUP-10 Payout request | ✅ | `supplier.payouts` has AVAILABLE settlement + balance |
| SUP-11 Admin payout processing | ✅ | `payout_o13` is PENDING → approve→process |
| SUP-12 Settlements reconcile | ✅ | HOLDING (O2) + AVAILABLE (O13) settlements |
| SUP-13 SLA tracking | ✗ | **No `SupplierSLA` rows** seeded — delay an order to generate |
| SUP-14 Disputes | ✅ | Raise dispute on a seeded settlement (platinum/payouts) |
| SUP-15 Tickets | ✅ | Supplier account creates ticket (lifecycle from OPEN) |
| SUP-16 Supplier data isolation | ✅ | Multiple suppliers → cross-access denial |
| SUP-17 Commission rules | ◑ | Per-supplier `commissionRate` set; **layered `CommissionRule` (GLOBAL/CATEGORY) not seeded** |
| SUP-18 Performance / leaderboard | ✅ | Tiers BRONZE→PLATINUM seeded (scores default 0) |

### 7. RBAC Permissions — strongest coverage (all roles seeded)

| Case | Coverage | Seeded resource / note |
|---|---|---|
| RBAC-01 … RBAC-10 (per role) | ✅ | One admin per `AdminRole` |
| RBAC-11 Customer→admin blocked | ✅ | `customer.*` |
| RBAC-12 Supplier→admin blocked | ✅ | `supplier.*` |
| RBAC-13 Unauthenticated → 401 | ✅ | Seed-independent |
| RBAC-14 Extra-permission grant | ✅ | `admin.support` → grant `orders:write` via `admin.super` |
| RBAC-15 Sidebar visibility | ✅ | All roles |
| RBAC-16 Direct API bypass | ✅ | Any role account |
| RBAC-17 Privilege escalation | ✅ | `admin.store` (ADMIN) → `/api/admin/team` → 403 |

### 8. Cross-Cutting / Non-Functional

| Case | Coverage | Seeded resource / note |
|---|---|---|
| NFR-01 HTTPS / security headers | ◑ | Deploy/env concern, not seed data |
| NFR-02 Session expiry | ✅ | Login a seeded account |
| NFR-03 Rate limiting | ✅ | Hammer login with a seeded account |
| NFR-04 Account lockout | ✅ | `customer.locked` already locked; or hammer a fresh account |
| NFR-05 Input validation | ✅ | Any seeded-account endpoint |
| NFR-06 Error monitoring (Sentry) | N/A | Env/observability, no seed data |
| NFR-07 Maintenance mode | ✅ | `admin.super` toggle |
| NFR-08 Mobile API (`/api/v1`) | ✅ | Login via seeded credentials (device/token rows created at runtime) |
| NFR-09 Performance | ✅ | Seeded product pages |
| NFR-10 SEO / OG | ✅ | Product pages have meta; `/api/og` |
| NFR-11 Webhook idempotency | ✅ | Fire a duplicate webhook against a seeded order |
| NFR-12 Stock race / oversell | ◑ | **No stock=1 variant** seeded — set one to 1 first, then concurrent checkout |

### Coverage summary

| Section | Cases | ✅ Ready | ◑ Partial | ✗ Gap | N/A |
|---|---|---|---|---|---|
| Customer | 22 | 18 | 4 | 0 | 0 |
| Payments | 16 | 13 | 3 | 0 | 0 |
| Shipping | 11 | 9 | 2 | 0 | 0 |
| Returns | 13 | 10 | 2 | 1 | 0 |
| Admin | 22 | 16 | 4 | 2 | 0 |
| Supplier | 18 | 14 | 3 | 1 | 0 |
| RBAC | 17 | 17 | 0 | 0 | 0 |
| Non-functional | 12 | 9 | 2 | 0 | 1 |
| **TOTAL** | **131** | **106** | **20** | **4** | **1** |

**~81% of cases (106/131) are fully data-ready** against the seeded accounts; 20 are partially
ready (need a live external action or minor extra setup); only **4 hard data gaps**; 1 N/A.

---

## 6. Known gaps & remediation

| Case | Gap | Remediation (manual, no code change) |
|---|---|---|
| RET-03 | No order delivered **>7 days** ago (all seeded delivered shipments are ~1 day) | In Prisma Studio, set a `Shipment.deliveredAt` to >7 days ago on a delivered test order |
| ADM-06 | No CSV import file | Provide a sample product CSV at upload time |
| ADM-10 | No supplier sync feed / `SupplierSkuMap` | Create a SKU mapping + upload a feed via the admin UI |
| SUP-13 | No `SupplierSLA` rows | Place/delay a supplier order so SLA tracking generates records |

**Partial-coverage items worth pre-staging if those flows are in scope:**
- **Homepage/CMS (CUST-01, ADM-13):** also run `npm run db:seed` for `ContentBlock`/`SiteSettings`.
- **Google OAuth (CUST-10) & password reset (CUST-11):** require a real Google account / real
  email inbox — `@test.tryby.in` is intentionally non-deliverable.
- **Real Razorpay refund/verify (PAY-07, PAY-14):** seeded payments use fake ids; for the true
  gateway path, complete a live test-mode payment first.
- **NFR-12 oversell:** set a variant's stock to 1 before the concurrency test.

---

## 7. Validation verdict

- **Accounts:** ✅ all 27 provision correctly with credentials in the right tables
  (admin → `AdminProfile.passwordHash`; customer/supplier → `Account.access_token`).
- **Counts:** ✅ deterministic and match §2 on a clean `seed:test:reset`.
- **Idempotency:** ✅ upsert + `tst_` ids → re-runs don't duplicate.
- **Safety:** ✅ no real Razorpay IDs, no real AWBs, no production emails, `NODE_ENV=production`
  guard, surgical `tst_`-only reset.
- **Test-plan coverage:** ✅ strong — 106/131 fully ready, RBAC 100%, all 4 gaps have a
  no-code workaround.

> Not executed against a live DB as part of this validation (documentation-only task). Run the
> §3 checklist on staging to confirm the counts empirically.
