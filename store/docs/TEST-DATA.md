# TRYBY — Test Data Pack (QA / UAT)

> **Purpose:** A single source of truth for manual & automated testing. Covers test
> accounts (customer / supplier / admin), dummy products, coupons, Razorpay test
> instruments, and end-to-end order scenarios.
>
> **Scope:** Reference data only — **no application code is changed by this document.**
> Create the records via the Admin panel, the existing `prisma/seed.ts`, or a throwaway
> seed script. Schema source: [prisma/schema.prisma](../prisma/schema.prisma).
>
> **Environment:** Use against a **non-production / staging** database with Razorpay in
> **Test Mode** only. Never enter these into production.

---

## 0. How auth actually works here (read first)

The login mechanism differs per role — this determines how you provision each test account.
Source: [lib/auth.ts](../lib/auth.ts), [lib/auth.config.ts](../lib/auth.config.ts), [lib/rbac.ts](../lib/rbac.ts).

| Account type | Login method | Where the password lives |
|---|---|---|
| **Admin** | Email + password (Credentials) | bcrypt hash in `AdminProfile.passwordHash` |
| **Customer / Supplier** | Google OAuth **or** Email + password | bcrypt hash in `Account.access_token` where `provider = "credentials"` |

Key consequences for test setup:
- A **customer/supplier with a password** needs a `User` row **plus** an `Account` row
  (`provider: "credentials"`, `type: "credentials"`, `access_token = bcrypt(password)`).
- An **admin** needs a `User` row (`role = ADMIN`) **plus** an `AdminProfile` row with
  `passwordHash = bcrypt(password)`. See [scripts/setup-super-admin.ts](../scripts/setup-super-admin.ts)
  for the exact pattern (`bcrypt.hash(pwd, 12)`).
- **Account lockout** is real: repeated bad logins set `User.loginFailures` / `lockedUntil`.
  Use the "locked" customer below to test the lockout path; reset by clearing those fields.
- `mustResetPwd = true` on an `AdminProfile` forces a password change on first login —
  set `false` for accounts you want to log straight into.

**Standard test password (all roles unless noted):** `Test@1234`
**Bcrypt cost:** 12 (match the app, or hashes won't validate consistently).

> ⚠️ **Coupon gotcha (verified in seed):** `PERCENTAGE` coupon `value` is stored as a
> **fraction**, not a whole number — `0.10` means *10% off* (see `prisma/seed.ts` `TRYBY10`).
> `FLAT` coupon `value` is in **rupees** (`100` = ₹100 off). Get this wrong and a "10%"
> coupon silently becomes "1000% off." All percentage coupons below follow the fraction rule.

---

## 1. Admin accounts (one per role)

10 `AdminRole`s exist; each gets a dedicated login so you can verify the RBAC matrix and
sidebar visibility ([lib/rbac.ts](../lib/rbac.ts)). All use password `Test@1234`,
`mustResetPwd = false`, `isDisabled = false` unless stated. Permissions come from
`ROLE_PERMISSIONS[role]` by default (leave `AdminProfile.permissions = []` to inherit).

| # | Email | Name | `adminRole` | What it should be able to do (smoke check) |
|---|---|---|---|---|
| 1 | `superadmin@tryby.test` | Super Admin | `SUPER_ADMIN` | Everything, incl. `/admin/team`, `/admin/settings`, `/admin/super` |
| 2 | `admin@tryby.test` | Store Admin | `ADMIN` | Most things; **no** `team:write`, `settings:write`, `customers:write` |
| 3 | `ops@tryby.test` | Ops Manager | `OPERATIONS_MANAGER` | Orders/returns/inventory write; **no** content/finance |
| 4 | `content@tryby.test` | Content Manager | `CONTENT_MANAGER` | CMS/media/SEO; **no** orders/finance |
| 5 | `product@tryby.test` | Product Manager | `PRODUCT_MANAGER` | Products + media + inventory:read; **no** orders |
| 6 | `orders@tryby.test` | Order Manager | `ORDER_MANAGER` | Orders/returns; **no** products:write |
| 7 | `finance@tryby.test` | Finance Manager | `FINANCE_MANAGER` | Finance/payouts/profit; **no** products/content |
| 8 | `support@tryby.test` | Support Agent | `SUPPORT_AGENT` | Read orders/customers, write returns; nothing else |
| 9 | `suppliermgr@tryby.test` | Supplier Manager | `SUPPLIER_MANAGER` | Suppliers write + payouts:read; **no** orders write |
| 10 | `marketing@tryby.test` | Marketing Manager | `MARKETING_MANAGER` | Coupons/marketing write + analytics; **no** orders |

**Negative-path admins (for guard/lockout tests):**

| Email | Setup | Tests |
|---|---|---|
| `disabled@tryby.test` | `ADMIN`, `isDisabled = true` | Disabled admin must be rejected at login |
| `mustreset@tryby.test` | `ADMIN`, `mustResetPwd = true` | Forced password-reset flow on first login |
| `lockme.admin@tryby.test` | `ADMIN`, normal | Submit 5+ wrong passwords → expect account lock |

> The existing seed already creates `admin@tryby.in` / `Admin@1234` (`SUPER_ADMIN`). Keep it
> as the bootstrap account; the `.test` accounts above are the per-role QA fixtures.

---

## 2. Customer accounts

All customers: `role = CUSTOMER`, password `Test@1234` (via credentials `Account`), India.
Phone numbers are deliberately fake (valid Indian format: 10 digits starting 6–9).

| # | Email | Name | Phone | Profile / what to test |
|---|---|---|---|---|
| C1 | `riya.new@tryby.test` | Riya Sharma | 9800000001 | **Brand-new** — empty cart/wishlist/orders, eligible for `TRYBY10` first-order coupon |
| C2 | `arjun.loyal@tryby.test` | Arjun Mehta | 9800000002 | **Returning/loyal** — multiple delivered orders, loyalty points, default address |
| C3 | `neha.cod@tryby.test` | Neha Verma | 9800000003 | **COD-only** buyer — tests COD flow + COD risk rules |
| C4 | `vikram.multi@tryby.test` | Vikram Singh | 9800000004 | **Address book** — 1 billing + 2 shipping addresses, 1 default |
| C5 | `sara.return@tryby.test` | Sara Khan | 9800000005 | Has a **delivered order** ready to drive return/refund scenarios |
| C6 | `locked.cust@tryby.test` | Locked Customer | 9800000006 | Trigger lockout (`loginFailures`, `lockedUntil`) → blocked login path |
| C7 | `fraud.flag@tryby.test` | Risky Buyer | 9800000007 | **High-risk** — many failed payments / mismatched address → fraud review |
| C8 | `guest.checkout@tryby.test` | Guest Convert | 9800000008 | Wishlist full, **no orders** — abandoned-cart / guest→account path |
| C9 | `inactive.cust@tryby.test` | Inactive User | 9800000009 | `isActive = false` — must be blocked everywhere |

### Sample addresses (attach to customers)

| Owner | Type | Name | Line 1 | City | State | Pincode |
|---|---|---|---|---|---|---|
| C2 / default | SHIPPING | Arjun Mehta | 12, MG Road, Indiranagar | Bengaluru | Karnataka | 560038 |
| C4 / default | SHIPPING | Vikram Singh | 401 Sea Breeze, Bandra W | Mumbai | Maharashtra | 400050 |
| C4 / alt | SHIPPING | Vikram Singh (Office) | 8th Flr, Cyber City, DLF Ph 2 | Gurugram | Haryana | 122002 |
| C4 / billing | BILLING | Vikram Singh | 401 Sea Breeze, Bandra W | Mumbai | Maharashtra | 400050 |
| C3 | SHIPPING | Neha Verma | 22 Park Street | Kolkata | West Bengal | 700016 |
| C7 (mismatch) | SHIPPING | Risky Buyer | PO Box 9, Remote Rd | Imphal | Manipur | 795001 |

> Pincode `795001` + high-value + COD is a good combo to trip serviceability / risk rules.

---

## 3. Supplier accounts

Each supplier = `User` (`role = SUPPLIER`) + `Supplier` profile. Covers every
`SupplierStatus` and `SupplierTier`, with valid-format GSTIN / PAN / IFSC.
Defaults from schema: `commissionRate = 0.15` (15%), `gstRate = 0.18` (18%).

| # | Login email | Company | `slug` | `status` | `tier` | Commission | Docs | Notes |
|---|---|---|---|---|---|---|---|---|
| S1 | `acme@tryby.test` | Acme Sports Pvt Ltd | `acme-sports` | `APPROVED` | `GOLD` | 0.12 | verified | Healthy seller, products live, positive balance |
| S2 | `pendingco@tryby.test` | NewKit Traders | `newkit` | `PENDING` | `BRONZE` | 0.15 | unverified | Just applied — tests approval queue & doc verification |
| S3 | `suspended@tryby.test` | ShadyGoods LLP | `shadygoods` | `SUSPENDED` | `BRONZE` | 0.15 | verified | `suspendReason` set — products must be hidden from storefront |
| S4 | `platinum@tryby.test` | EliteGear India | `elitegear` | `APPROVED` | `PLATINUM` | 0.10 | verified | High performance scores, eligible for fast payouts |
| S5 | `silverline@tryby.test` | SilverLine Apparel | `silverline` | `APPROVED` | `SILVER` | 0.15 | verified | Mid-tier, some returns — tests scorecards/SLA |
| S6 | `payouts@tryby.test` | PayoutTest Co | `payouttest` | `APPROVED` | `BRONZE` | 0.15 | verified | Has `AVAILABLE` settlements → drives payout request flow |

### Bank / KYC fixtures (format-valid, fake values)

| Supplier | GSTIN | PAN | Bank A/C | IFSC | A/C Name |
|---|---|---|---|---|---|
| S1 Acme | `29AABCA1234A1Z5` | `AABCA1234A` | 000111222333 | `HDFC0001234` | Acme Sports Pvt Ltd |
| S4 Elite | `27AAECE5678E1Z9` | `AAECE5678E` | 444555666777 | `ICIC0004567` | EliteGear India |
| S5 SilverLine | `06AAFCS9012F1Z3` | `AAFCS9012F` | 888999000111 | `SBIN0008888` | SilverLine Apparel |
| S6 PayoutTest | `19AAGCP3456G1Z7` | `AAGCP3456G` | 222333444555 | `AXIS0002223` | PayoutTest Co |

> GSTIN format = 2-digit state code + 10-char PAN + entity digit + `Z` + checksum (15 chars).
> IFSC format = 4 letters + `0` + 6 alphanumeric. These pass format checks but are not real.

---

## 4. Dummy products

Spread across all `Sport` values, with variants (unique SKUs), realistic INR pricing,
and edge-case flags. Categories already seeded: `cricket`, `football`, `gym`, `running`
— add `racket` and `combat` categories for full coverage. Assign `supplierId` where noted
(blank = platform/house product).

| Slug | Name | Sport | Supplier | Flags | Variants (SKU · size · ₹price/₹mrp · stock) |
|---|---|---|---|---|---|
| `mi-paltan-ipl-jersey-2025` | MI Paltan IPL Jersey 2025 | CRICKET | — | Featured, Official, Licensed | S `MI-2025-S` 1299/1799 ·50 · M `MI-2025-M` ·100 · L ·100 · XL ·80 · XXL 1399/1899 ·40 *(already in seed)* |
| `team-india-odi-jersey-2025` | Team India ODI Jersey | CRICKET | S1 | Featured, Official | M `IND-ODI-M` 1499/1999 ·60 · L ·60 · XL ·30 |
| `pro-english-willow-bat` | Pro English Willow Bat | CRICKET | S5 | Best-seller | SH `BAT-EW-SH` 4999/6999 ·15 · LB `BAT-EW-LB` ·8 |
| `rcb-football-home-kit` | City FC Home Kit 24/25 | FOOTBALL | S4 | New | S `FB-CITY-S` 2199/2999 ·40 · M ·40 · L ·40 · XL ·25 |
| `match-football-size5` | Match Football Size 5 | FOOTBALL | S1 | — | OS `FB-BALL-5` 899/1299 ·120 |
| `adjustable-dumbbell-20kg` | Adjustable Dumbbell 20kg | GYM | S4 | Best-seller, Heavy(ship) | OS `GYM-DB-20` 3499/4999 ·25 *(weight 20kg → shipping rules)* |
| `gym-tee-dryfit-black` | Dry-Fit Gym Tee | GYM | S5 | Sale | S `GYM-TEE-BLK-S` 599/999 ·0 *(OUT OF STOCK)* · M `...-M` ·80 · L ·90 |
| `mens-running-shoes-airlite` | AirLite Running Shoes | RUNNING | S1 | Trending | UK7 `RUN-AL-7` 2999/3999 ·30 · UK8 ·40 · UK9 ·35 · UK10 ·20 |
| `running-shorts-reflective` | Reflective Running Shorts | RUNNING | S5 | — | S `RUN-SHO-S` 799/1199 ·60 · M ·60 · L ·60 |
| `pro-badminton-racket-g4` | Pro Badminton Racket G4 | RACKET | S1 | New | G4 `RKT-BAD-G4` 2499/3499 ·45 |
| `boxing-gloves-12oz` | Boxing Gloves 12oz | COMBAT | S4 | — | 12oz `CMB-GLV-12` 1799/2499 ·35 · 14oz `CMB-GLV-14` ·20 |
| `archived-old-jersey-2019` | Old Season Jersey 2019 | CRICKET | S3 | **`isArchived = true`** | M `ARC-2019-M` 499/1799 ·10 *(must NOT appear on storefront)* |
| `inactive-test-product` | Inactive Test Product | OTHER | S5 | **`isActive = false`** | OS `INACT-001` 100/100 ·999 *(hidden everywhere)* |

**Product-state coverage to verify:** featured/homepage, official-licensed badge, on-sale
(price < mrp), **out-of-stock** variant (stock 0), **archived** (`isArchived`), **inactive**
(`isActive=false`), **suspended-supplier** product (S3 → must be suppressed), multi-variant
size/color, and a **heavy** item (dumbbell) for shipping-cost rules.

> Variant fields available if you need deeper tests: `color`, `costPrice` (profit calc),
> `weight` (shipping), per-warehouse `WarehouseStock`. Keep `sku` globally unique.

---

## 5. Coupons

Covers all `CouponType` and the important edge cases. **Remember: `PERCENTAGE.value` is a
fraction** (`0.10` = 10%); `FLAT.value` is rupees; `FREE_SHIPPING.value` is ignored (use `0`).

| Code | Type | `value` | minOrder | maxDiscount | usageLimit | perUser | Active? | Validity | Tests |
|---|---|---|---|---|---|---|---|---|---|
| `TRYBY10` | PERCENTAGE | `0.10` | 299 | 200 | 1000 | 1 | ✅ | open | First-order 10%, **capped at ₹200** *(in seed)* |
| `FLAT100` | FLAT | `100` | 499 | — | 500 | 1 | ✅ | open | ₹100 off above ₹499 *(in seed)* |
| `SAVE20` | PERCENTAGE | `0.20` | 1500 | 500 | 200 | 2 | ✅ | open | Higher % with min-order gate + per-user 2 |
| `FREESHIP` | FREE_SHIPPING | `0` | 999 | — | — | 3 | ✅ | open | Waives shipping above ₹999 |
| `FLAT500` | FLAT | `500` | 4000 | — | 50 | 1 | ✅ | open | Big flat discount on high-value carts |
| `WELCOME50` | PERCENTAGE | `0.50` | 0 | 150 | — | 1 | ✅ | open | 50% but **tiny cap (₹150)** — verify cap math |
| `EXPIRED` | PERCENTAGE | `0.15` | 0 | — | — | 1 | ✅ | `validUntil` = **past** | Must be **rejected as expired** |
| `NOTYET` | FLAT | `200` | 0 | — | — | 1 | ✅ | `validFrom` = **future** | Must be **rejected — not started** |
| `DISABLED` | FLAT | `100` | 0 | — | — | 1 | ❌ `isActive=false` | open | Inactive → rejected |
| `USEDUP` | FLAT | `100` | 0 | — | 5 | 1 | ✅ | open | Set `usageCount = usageLimit` → limit-reached path |
| `MINHIGH` | FLAT | `300` | 9999 | — | — | 1 | ✅ | open | Cart below min → "add more" message |

**Coupon test matrix:** happy path, below `minOrderValue`, `maxDiscount` cap hit, expired
(`validUntil`), not-started (`validFrom`), inactive, global `usageLimit` exhausted, `perUserLimit`
exhausted (reuse by same customer), stacking attempt (should be rejected), and FLAT discount
larger than subtotal (total must floor at 0, never negative).

---

## 6. Razorpay test instruments

> **Test Mode only.** Use your Razorpay **test** API keys (`rzp_test_...`). Razorpay
> periodically updates its documented test cards — if any number is rejected, copy the
> current set from your dashboard: **Razorpay Dashboard → (Test Mode) → Docs / Test Card
> Details**, or https://razorpay.com/docs/payments/payments/test-card-upi-details/.
> Schema: `Payment.method` ∈ `RAZORPAY_CARD | RAZORPAY_UPI | RAZORPAY_NETBANKING | RAZORPAY_WALLET | COD`.

### 6.1 Test cards

| Network | Card number | Expiry | CVV | Result |
|---|---|---|---|---|
| Visa | `4111 1111 1111 1111` | any future (e.g. 12/30) | any 3 digits | Success |
| Mastercard | `5267 3181 8797 5449` | any future | any 3 digits | Success |
| Visa (alt) | `5104 0600 0000 0008` | any future | any 3 digits | Success |

- **OTP / 3-D Secure page (test):** enter OTP `1111`, or click **Success** to authorise /
  **Failure** to decline. Declining here is the canonical way to test a **failed card payment**.
- **CVV / expiry:** any syntactically valid value is accepted in test mode.

### 6.2 Test UPI

| VPA | Result |
|---|---|
| `success@razorpay` | Payment succeeds |
| `failure@razorpay` | Payment fails |

### 6.3 Test netbanking & wallet

- **Netbanking:** pick any bank → on the simulator page click **Success** or **Failure**.
- **Wallet:** select any wallet → simulator → **Success** / **Failure**.

### 6.4 COD

No Razorpay call. `Payment.method = COD`, `Payment.status = PENDING` until delivery;
`Shipment.codAmount` set, `codCollected` flips true on delivery. Use customer **C3**.

### 6.5 Refund / dispute testing

- Refunds: capture a payment, then issue full/partial refund → expect `Payment.status`
  `REFUNDED` / `PARTIALLY_REFUNDED`, `refundedAmount` + `refundedAt` populated.
- Disputes: Razorpay test dashboard can simulate a dispute webhook →
  `SettlementDispute` row (`razorpayDisputeId`, `razorpayPaymentId`, `disputeAmount`).

---

## 7. Order scenarios (end-to-end)

Each scenario lists the customer, payment, the `OrderStatus` / `PaymentStatus` /
`ShipmentStatus` it should reach, and what it exercises. `orderNumber` suggestions are
illustrative — generate via the app's real numbering.

| # | Customer | Pay method | Coupon | Target Order / Payment / Shipment status | Exercises |
|---|---|---|---|---|---|
| O1 | C1 | Card (Visa success) | `TRYBY10` | `CONFIRMED` / `CAPTURED` / `PENDING` | First-order happy path + % coupon cap |
| O2 | C2 | UPI (`success@razorpay`) | — | `DELIVERED` / `CAPTURED` / `DELIVERED` | Full lifecycle → enables review + supplier settlement |
| O3 | C3 | **COD** | `FLAT100` | `CONFIRMED` → `OUT_FOR_DELIVERY` / `PENDING` / `OUT_FOR_DELIVERY` | COD flow, `codAmount`, collection on delivery |
| O4 | C4 | Card | `SAVE20` | `SHIPPED` / `CAPTURED` / `IN_TRANSIT` | Multi-item, multi-address, tracking events |
| O5 | C5 | UPI | — | `RETURN_REQUESTED` → `RETURNED` / `REFUNDED` | Return → refund (`ReturnRequest` + `Payment.REFUNDED`) |
| O6 | C2 | Card | — | `DELIVERED` then **partial** return of 1 of 2 items | `PARTIALLY_REFUNDED`, partial settlement deduction |
| O7 | C7 | Card (**Failure** on OTP) | — | `PENDING` / `FAILED` / — | Failed payment; order not confirmed; stock released |
| O8 | C1 | UPI (`failure@razorpay`) | — | `PENDING` / `FAILED` / — | UPI failure path + retry |
| O9 | C4 | Card | — | `CANCELLED` (pre-dispatch) / `REFUNDED` | Customer/admin cancel before shipping → stock restored |
| O10 | C7 | Card | `FLAT500` | `PENDING` + **fraud review** | High-risk → `OrderRiskAssessment`, manual hold |
| O11 | C2 | Card | — | **Multi-supplier cart** (S1 + S4 items) → 2 fulfilment allocations / 2 settlements | Split fulfilment, per-supplier ledger |
| O12 | C3 | COD | `MINHIGH` | Coupon **rejected** (below min) → order proceeds without discount | Coupon validation at checkout |
| O13 | C5 | Card | — | `DELIVERED` → settlement `HOLDING` → after 7-day hold → `AVAILABLE` → payout (S6) | Supplier settlement hold → payout lifecycle |
| O14 | C2 | Card | `USEDUP` | Coupon **rejected** (usage limit) | Global usage-limit enforcement |
| O15 | C4 | Card | `TRYBY10` (2nd time) | Coupon **rejected** (perUserLimit=1 already used in O? ) | Per-user limit enforcement |

### Lifecycle reference (for building the above)

```
PENDING → CONFIRMED → PROCESSING → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
                                  ↘ CANCELLED
DELIVERED → RETURN_REQUESTED → RETURNED → REFUNDED
Payment:  PENDING → AUTHORIZED → CAPTURED → (REFUNDED | PARTIALLY_REFUNDED | FAILED)
Shipment: PENDING → PACKED → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
                                                     ↘ FAILED_DELIVERY → RETURNED / LOST
Settlement (per delivered order): HOLDING → AVAILABLE → PAYOUT_REQUESTED → PROCESSING → PAID
```

### Suggested coverage checklist
- [ ] Each `OrderStatus` reached by at least one order
- [ ] `CAPTURED`, `FAILED`, `REFUNDED`, `PARTIALLY_REFUNDED` payments all present
- [ ] COD order with collection-on-delivery
- [ ] Coupon accept + every rejection reason (min, expired, not-started, inactive, used-up, per-user)
- [ ] Return → full refund **and** partial refund
- [ ] Cancellation before dispatch (stock restored)
- [ ] Fraud-flagged order on hold
- [ ] Multi-supplier order → split settlement
- [ ] Settlement hold → payout request → paid (supplier wallet balances move correctly)

---

## 8. Provisioning notes

- **Fastest path:** extend `prisma/seed.ts` (or a separate `seed-test.ts`) with the above —
  but that *is* a code change, so do it only if/when you decide to. This doc deliberately
  stays data-only.
- **Via Admin panel:** products, coupons, suppliers (approve/suspend), and order status
  transitions can all be created/driven through `/admin/*` once you have the SUPER_ADMIN login.
- **Passwords:** hash with bcrypt cost 12. Admin → `AdminProfile.passwordHash`;
  customer/supplier → `Account.access_token` (`provider:"credentials"`).
- **Cleanup:** prefix all test emails with role + `@tryby.test` so they're trivially
  greppable/deletable. Wipe the test DB between full UAT cycles to keep settlement/ledger
  math reproducible.

> Need this turned into an actual runnable `seed-test.ts` (with bcrypt hashing, Account
> rows, and the order/settlement state machine wired up)? Say the word — that step does
> touch code, so it's a separate, explicit go-ahead.
