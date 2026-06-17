# Tryby — Production Test Plan & Pass/Fail Checklist

**Scope:** End-to-end production readiness validation for the Tryby sports-jersey dropshipping platform (Next.js 15 / Prisma / Razorpay / Shiprocket+Delhivery / Vercel).
**No code changes** — this is an execution checklist for manual + assisted QA.

## How to use this document
- Run each case in a **production-like environment** (staging with live-mode keys in test toggle, or production with a controlled test account).
- Record result in the **Result** column: `PASS` / `FAIL` / `BLOCKED` / `N/A`.
- Any `FAIL` must have a defect ID and a note. A release is **GO** only when all `P0` cases pass.
- Priority key: **P0** = release blocker, **P1** = high, **P2** = medium.

### Test data prerequisites
| Item | Value / Setup |
|---|---|
| Customer accounts | 1 fresh (no orders), 1 with order history |
| Admin accounts | One per role: SUPER_ADMIN, ADMIN, OPERATIONS_MANAGER, CONTENT_MANAGER, PRODUCT_MANAGER, ORDER_MANAGER, FINANCE_MANAGER, SUPPORT_AGENT, SUPPLIER_MANAGER, MARKETING_MANAGER |
| Supplier accounts | 1 APPROVED, 1 PENDING, 1 SUSPENDED |
| Payment | Razorpay test cards (success / failure / 3DS), test UPI, COD-eligible pincode, COD-blocked pincode |
| Products | In-stock variant, out-of-stock variant, archived product |
| Coupons | Active PERCENTAGE, active FLAT, FREE_SHIPPING, expired, usage-capped |
| Shipping | Serviceable pincode, non-serviceable pincode |

---

## 1. Customer Flow

| ID | Priority | Scenario | Steps | Expected Result | Result |
|---|---|---|---|---|---|
| CUST-01 | P1 | Browse storefront | Open `/`, scroll homepage (hero, trust bar, trending, categories) | All content blocks render; no layout shift; images load | |
| CUST-02 | P1 | Product listing / filters | `/products`, filter by sport (Cricket/Football/etc.), sort | Filters apply, results update, pagination works | |
| CUST-03 | P1 | Search | Search a known jersey term and a no-match term | Relevant results; graceful "no results" state | |
| CUST-04 | P0 | Product detail | Open `/products/[slug]`, select size/color variant | Price, stock, images, variant selection update correctly | |
| CUST-05 | P1 | Out-of-stock variant | Select an out-of-stock variant | Add-to-cart disabled / "notify me"; cannot purchase | |
| CUST-06 | P0 | Add to cart | Add in-stock variant, change qty | Cart count + totals update; persists on reload | |
| CUST-07 | P1 | Wishlist | Add/remove item to `/wishlist` (logged in) | Persists across sessions | |
| CUST-08 | P0 | Guest → auth at checkout | Begin checkout as guest | Prompted to login/register; cart preserved after login | |
| CUST-09 | P0 | Register | `/auth/register` with valid + invalid data | Account created; validation errors shown; no duplicate email | |
| CUST-10 | P0 | Login (credentials + Google) | `/auth/login`, Google OAuth | Successful auth; session created; redirect to intended page | |
| CUST-11 | P1 | Forgot/reset password | Request reset, use emailed link | Reset link works once; old password invalidated | |
| CUST-12 | P0 | Address management | Add shipping + billing address at checkout | Saved; selectable; pincode triggers serviceability check | |
| CUST-13 | P0 | Coupon apply | Apply valid, expired, and usage-capped coupon | Valid discounts; expired/capped rejected with message | |
| CUST-14 | P0 | Place order (prepaid) | Complete checkout via Razorpay test success | Order created, status CONFIRMED, redirect to `/order-success` | |
| CUST-15 | P0 | Place order (COD) | Checkout COD on eligible pincode | Order placed; COD confirmation flow runs | |
| CUST-16 | P0 | Cart hydration | Add items, refresh during checkout, complete | No lost/duplicated items (regression: Zustand hydration race, commit 86746cb) | |
| CUST-17 | P1 | Order history | `/account/orders`, open `/account/orders/[id]` | Shows correct orders, statuses, items, totals | |
| CUST-18 | P1 | Order tracking | `/orders/track` with order number | Shows shipment status / courier tracking | |
| CUST-19 | P1 | Account settings | `/account/settings`, update profile + notification prefs | Changes saved and reflected | |
| CUST-20 | P1 | Reviews | Submit product review (delivered item) | Review enters PENDING moderation; not shown until APPROVED | |
| CUST-21 | P2 | Static/legal pages | Visit terms, privacy, returns, shipping, faq, contact | All render; contact form submits | |
| CUST-22 | P0 | Data isolation | Try to open another user's order ID directly | 403/404 — cannot view others' orders | |

---

## 2. Payments

| ID | Priority | Scenario | Steps | Expected Result | Result |
|---|---|---|---|---|---|
| PAY-01 | P0 | Create Razorpay order | Proceed to pay | `/api/payments/razorpay/create-order` returns valid order; amount matches cart | |
| PAY-02 | P0 | Successful card payment | Pay with test success card | Signature verified; Payment=CAPTURED; Order=CONFIRMED | |
| PAY-03 | P0 | UPI payment | Pay via test UPI | Method resolved as RAZORPAY_UPI; captured correctly | |
| PAY-04 | P0 | Netbanking / wallet | Pay via each | Correct PaymentMethod stored; captured | |
| PAY-05 | P0 | Signature tampering | Replay verify with altered signature | `Invalid signature` 400; order NOT confirmed (timingSafeEqual guard) | |
| PAY-06 | P0 | Ownership check | Verify another user's payment | 403 Forbidden | |
| PAY-07 | P0 | Idempotency | Re-submit verify for already-CAPTURED payment | Returns ok without double-processing | |
| PAY-08 | P0 | Non-payable state | Verify against CANCELLED/SHIPPED order | 409 "not in a payable state" | |
| PAY-09 | P0 | Failed payment | Use Razorpay test failure card | `/order-failed`; Payment=FAILED; no stock decremented permanently | |
| PAY-10 | P0 | Abandoned payment | Close Razorpay modal without paying | Order stays PENDING; reserved stock released per policy | |
| PAY-11 | P0 | COD confirm | Place COD order, confirm via `/api/payments/cod-confirm` | Order moves forward; COD fraud rules applied | |
| PAY-12 | P0 | Razorpay webhook | Trigger `/api/webhooks/razorpay` (payment.captured/failed) | Webhook signature validated; order/payment state synced | |
| PAY-13 | P1 | Amount integrity | Manipulate client amount before pay | Server recomputes; mismatch rejected | |
| PAY-14 | P1 | Admin refund | `/admin/payments/[id]/refund` full + partial | PaymentStatus REFUNDED / PARTIALLY_REFUNDED; audit logged | |
| PAY-15 | P1 | Payment reconciliation | `/admin/payments/reconcile` | Mismatches flagged between Razorpay and DB | |
| PAY-16 | P2 | Payment health | `/admin/payment-health` dashboard | Success/failure rates render | |

---

## 3. Shipping

| ID | Priority | Scenario | Steps | Expected Result | Result |
|---|---|---|---|---|---|
| SHP-01 | P0 | Serviceability check | Enter serviceable + non-serviceable pincode at checkout | `/api/shipping/serviceability` returns correct availability + ETA | |
| SHP-02 | P1 | COD availability by pincode | Enter COD-blocked pincode | COD option hidden/disabled | |
| SHP-03 | P0 | Book shipment | Admin books shipment `/admin/shipping/book` | Label/AWB generated; courier assigned (Shiprocket/Delhivery) | |
| SHP-04 | P1 | Print label | `/admin/shipping/labels` | Label downloads/prints with correct address | |
| SHP-05 | P0 | Shiprocket webhook | Fire `/api/webhooks/shiprocket` status update | ShipmentStatus + OrderStatus advance (SHIPPED→OUT_FOR_DELIVERY→DELIVERED) | |
| SHP-06 | P0 | Delhivery webhook | Fire `/api/webhooks/delhivery` status update | Tracking + status synced; idempotent on repeat events | |
| SHP-07 | P1 | Courier selection logic | Order in mixed-serviceability zone | Correct CourierProvider chosen per `/admin/shipping/intelligence` | |
| SHP-08 | P1 | Tracking visibility | Customer tracks shipped order | Live status + AWB shown on `/orders/track` | |
| SHP-09 | P2 | Shipping analytics | `/admin/shipping/analytics` + profitability | Metrics render; cost vs revenue correct | |
| SHP-10 | P1 | Integration config | `/admin/settings/shipping/integrations` | Credentials save; test-connection succeeds | |
| SHP-11 | P1 | Webhook security | Send webhook with bad/missing signature | Rejected (401/400); no state change | |

---

## 4. Returns

| ID | Priority | Scenario | Steps | Expected Result | Result |
|---|---|---|---|---|---|
| RET-01 | P0 | Eligible return | File return on DELIVERED order within 7 days | Return created, status REQUESTED | |
| RET-02 | P0 | Non-delivered block | Try return on SHIPPED/PROCESSING order | 422 "Only delivered orders can be returned" | |
| RET-03 | P0 | Window enforcement | Try return on order delivered > 7 days ago | 422 "Return window of 7 days has expired" | |
| RET-04 | P0 | Duplicate return block | File second return on same order (prior not rejected) | Rejected — no duplicate active return | |
| RET-05 | P1 | Return reasons | File with each reason (DAMAGED, WRONG_ITEM, SIZE_ISSUE, etc.) | Reason saved; image upload (≤6) works | |
| RET-06 | P1 | Customer-only guard | Call `/api/returns` as admin/supplier | 403 Forbidden | |
| RET-07 | P0 | Admin approve | `/admin/returns/[id]` approve | Status APPROVED → PICKUP_SCHEDULED; audit RETURN_APPROVED | |
| RET-08 | P0 | Admin reject | Reject a return | Status REJECTED with reason; audit RETURN_REJECTED | |
| RET-09 | P0 | Return received → refund | Mark RECEIVED then REFUND | Status REFUNDED; refund issued; audit RETURN_REFUNDED | |
| RET-10 | P1 | Return timeline | `/api/returns/[id]/timeline` | Full status history shown to customer | |
| RET-11 | P1 | Supplier return view | `/supplier/returns` | Supplier sees returns for their products only | |
| RET-12 | P1 | Return → settlement deduction | Refund a supplier-fulfilled item | `/api/internal/finance/return-deduction` adjusts supplier ledger | |
| RET-13 | P2 | Returns analytics | `/admin/returns/analytics` | Return rate by reason/product renders | |

---

## 5. Admin Flow

| ID | Priority | Scenario | Steps | Expected Result | Result |
|---|---|---|---|---|---|
| ADM-01 | P0 | Admin login | Login as ADMIN/SUPER_ADMIN | Access `/admin`; non-admins blocked | |
| ADM-02 | P0 | Product create | `/admin/products/new` | Product saved with variants, images, price | |
| ADM-03 | P1 | Product edit / variants | `/admin/products/[id]/edit`, variants | Updates persist; audit PRODUCT_UPDATED | |
| ADM-04 | P1 | Bulk operations | `/admin/products/bulk` price/stock/status | Bulk changes apply; audit BULK_* logged | |
| ADM-05 | P1 | Archive / restore | Archive then restore product | Hidden from storefront when archived; restored correctly | |
| ADM-06 | P1 | Product import | `/admin/products/import` CSV | Valid rows imported; errors reported per-row | |
| ADM-07 | P0 | Order management | `/admin/orders/[id]` change status | Status transitions valid; audit ORDER_STATUS_CHANGED | |
| ADM-08 | P1 | Order export | `/admin/orders/export` | CSV downloads with correct fields | |
| ADM-09 | P1 | Inventory adjust | `/admin/inventory/adjust` | Stock updated; logged in inventory logs | |
| ADM-10 | P1 | Inventory sync | `/admin/inventory/sync` upload | Stock synced from supplier feed; sync log created | |
| ADM-11 | P1 | Purchase orders | Create PO, receive `/admin/purchase-orders/[id]/receive` | Stock increments on receive | |
| ADM-12 | P1 | Coupons | Create/edit/delete coupon `/admin/marketing/coupons` | Coupon usable on storefront; limits enforced | |
| ADM-13 | P1 | CMS / homepage | `/admin/content/homepage` publish a block | Goes live (DRAFT→PUBLISHED); scheduled blocks honor time | |
| ADM-14 | P1 | Reviews moderation | `/admin/reviews` approve/reject | Approved reviews appear on PDP | |
| ADM-15 | P1 | Customers / CRM | `/admin/crm/customers/[id]`, notes, tags, tickets | View activity; create note/ticket | |
| ADM-16 | P1 | Marketing campaigns | `/admin/marketing/campaigns`, email, push | Campaign creates and sends to segment | |
| ADM-17 | P0 | Finance / profit | `/admin/finance`, `/admin/profit`, reports | Revenue, COGS, profit figures correct | |
| ADM-18 | P1 | Fraud/risk review | `/admin/fraud/orders`, blacklist, COD rules | High-risk orders flagged; blacklist blocks | |
| ADM-19 | P1 | Reports / KPI | `/admin/reports/{sales,profit,suppliers,kpi}` | Reports render with accurate data | |
| ADM-20 | P0 | Audit log integrity | Perform sensitive actions, check `/admin/audit` | All actions logged with actor, IP, timestamp | |
| ADM-21 | P1 | Sessions management | `/admin/sessions` revoke a session | Revoked session forced to re-login | |
| ADM-22 | P2 | System tools | `/admin/system/{feature-flags,maintenance,backups,launch-checklist}` | Toggles work; maintenance mode gates storefront | |

---

## 6. Supplier Flow

| ID | Priority | Scenario | Steps | Expected Result | Result |
|---|---|---|---|---|---|
| SUP-01 | P0 | Supplier apply | `/supplier/apply` submit application | Application created, SupplierStatus PENDING | |
| SUP-02 | P0 | Admin approve supplier | `/admin/suppliers/[id]` approve | Status APPROVED; supplier can log in; audit SUPPLIER_APPROVED | |
| SUP-03 | P0 | Supplier login | `/supplier/login` | APPROVED logs in; PENDING/SUSPENDED blocked with message | |
| SUP-04 | P1 | Dashboard | `/supplier/dashboard` | KPIs, recent orders, payouts summary render | |
| SUP-05 | P0 | Product submission | `/supplier/products` add product | Enters approval queue `/admin/supplier-products/approve` | |
| SUP-06 | P0 | Admin approve product | Approve supplier product | Product becomes purchasable on storefront | |
| SUP-07 | P1 | Supplier orders | `/supplier/orders` | Sees only own orders; can mark fulfillment | |
| SUP-08 | P1 | Documents & agreements | Upload docs `/supplier/documents`, sign `/supplier/agreements` | Doc types validated; agreement signed status recorded | |
| SUP-09 | P0 | Wallet / ledger | `/supplier/wallet`, `/supplier/ledger` | Balance + ledger entries match order settlements | |
| SUP-10 | P0 | Payout request | `/supplier/payouts` request payout | PayoutStatus PENDING; admin can approve/process | |
| SUP-11 | P0 | Admin payout processing | `/admin/payouts/[id]` approve→process | PENDING→APPROVED→PROCESSING→PROCESSED; rejection path works | |
| SUP-12 | P1 | Settlements | `/supplier/settlements` vs `/admin/supplier-settlements` | Settlement amounts reconcile after order delivery | |
| SUP-13 | P1 | SLA tracking | Delay a supplier order | SlaStatus moves ON_TIME→AT_RISK→BREACHED | |
| SUP-14 | P1 | Disputes | Raise dispute `/supplier/disputes` | DisputeStatus OPEN; admin resolution paths work | |
| SUP-15 | P1 | Tickets | `/supplier/tickets` create + reply | Ticket lifecycle OPEN→…→RESOLVED | |
| SUP-16 | P0 | Supplier data isolation | Supplier A tries to access Supplier B's orders/payouts | 403/empty — no cross-supplier data leakage | |
| SUP-17 | P1 | Commission rules | `/admin/suppliers/commission-rules` GLOBAL/CATEGORY/SUPPLIER | Correct commission applied to settlements | |
| SUP-18 | P2 | Performance / leaderboard | `/admin/suppliers/performance`, leaderboard | Tier (BRONZE→PLATINUM) + scores render | |

---

## 7. RBAC Permissions

Verify each role sees **only** its permitted nav/pages and that API guards (`canAccess`) reject unauthorized actions (expect 403, not just hidden UI). Reference matrix from `lib/rbac.ts`.

| ID | Priority | Role | Should ACCESS | Should be DENIED (403) | Result |
|---|---|---|---|---|---|
| RBAC-01 | P0 | SUPER_ADMIN | Everything incl. `/admin/team`, `/admin/super`, `/admin/settings` | — | |
| RBAC-02 | P0 | ADMIN | Products(rw), orders, returns, content, finance(read), risk(rw), audit | `team:write`, `settings:write`, `products:delete`, `payouts`, `profit:write` | |
| RBAC-03 | P0 | OPERATIONS_MANAGER | Orders(rw), returns(rw), inventory(rw), risk(rw), suppliers(read) | products:write, finance, payouts, content, team, settings | |
| RBAC-04 | P0 | CONTENT_MANAGER | Content(rwd), media(rwd), seo(rw), products(read) | orders, finance, customers:write, inventory:write, suppliers | |
| RBAC-05 | P0 | PRODUCT_MANAGER | Products(rw), media(rw), inventory(read), analytics | orders, finance, content:write, returns, suppliers:write | |
| RBAC-06 | P0 | ORDER_MANAGER | Orders(rw), returns(rw), customers(read), inventory(read), risk(read) | finance, products:write, suppliers, content, payouts | |
| RBAC-07 | P0 | FINANCE_MANAGER | Finance(rw), profit, payouts(rw), orders(read), suppliers(read) | products:write, content, orders:write, returns, team | |
| RBAC-08 | P0 | SUPPORT_AGENT | Orders(read), returns(rw), customers(read), products(read), risk(read) | orders:write, finance, products:write, payouts, settings | |
| RBAC-09 | P0 | SUPPLIER_MANAGER | Suppliers(rw), payouts(read), products(read), inventory(read), analytics | payouts:write, finance:write, orders, content, team | |
| RBAC-10 | P0 | MARKETING_MANAGER | Marketing(rw), coupons(rw), content(read), analytics, customers(read) | orders, finance, products:write, suppliers, settings | |
| RBAC-11 | P0 | Customer→admin | Logged-in CUSTOMER hits any `/admin/*` route/API | Redirected/403 — `role !== ADMIN` blocked at `canAccess` | |
| RBAC-12 | P0 | Supplier→admin | Logged-in SUPPLIER hits `/admin/*` | 403 — no admin access | |
| RBAC-13 | P0 | Unauthenticated | Hit admin/supplier APIs with no session | 401 Unauthorized | |
| RBAC-14 | P1 | Extra-permission grant | Grant a SUPPORT_AGENT an extra `orders:write` | Now allowed for that action only (extraPermissions honored) | |
| RBAC-15 | P1 | Sidebar visibility | Each role's sidebar | Only `NAV_PERMISSIONS`-permitted links shown | |
| RBAC-16 | P0 | Direct API bypass | Call a write API for a denied permission via curl/Postman | 403 even though UI hides it (server-side guard, not just client) | |
| RBAC-17 | P1 | Privilege escalation | Non-SUPER_ADMIN tries `/api/admin/team` to create/elevate admin | 403 — only SUPER_ADMIN | |

---

## 8. Cross-Cutting / Non-Functional

| ID | Priority | Scenario | Expected Result | Result |
|---|---|---|---|---|
| NFR-01 | P0 | HTTPS + security headers | CSP valid (regression: Sentry CSP, commits 75c3bf9), HSTS, no mixed content | |
| NFR-02 | P0 | Auth session expiry | Expired/invalid session forces re-login | |
| NFR-03 | P1 | Rate limiting | Repeated login/API hits trigger limit; audit RATE_LIMIT_HIT | |
| NFR-04 | P1 | Account lockout | Repeated failed logins lock account (LOGIN_FAILED→ACCOUNT_LOCKED) | |
| NFR-05 | P0 | Input validation | Zod-guarded endpoints reject malformed payloads (400) | |
| NFR-06 | P1 | Error monitoring | Forced error appears in Sentry with correct env | |
| NFR-07 | P1 | Maintenance mode | Toggle gates storefront, allows admin | |
| NFR-08 | P1 | Mobile API (`/api/v1`) | Mobile login/refresh/biometric, cart, orders work | |
| NFR-09 | P2 | Performance | Key pages LCP < 2.5s; no console errors | |
| NFR-10 | P2 | SEO/OG | `/api/og` images render; meta tags present | |
| NFR-11 | P1 | Idempotency | Webhooks (Razorpay/Shiprocket/Delhivery) safe on duplicate delivery | |
| NFR-12 | P0 | Stock race / oversell | Two concurrent checkouts on last unit | Only one succeeds; no oversell (inventory reservation) | |

---

## 9. Release Gate — Summary Checklist

> **GO criterion: every P0 case = PASS. No open P0/P1 defects.**

- [ ] **Customer flow** (CUST-01…22) — all P0 pass
- [ ] **Payments** (PAY-01…16) — all P0 pass; signature/idempotency/ownership verified
- [ ] **Shipping** (SHP-01…11) — all P0 pass; both courier webhooks sync
- [ ] **Returns** (RET-01…13) — all P0 pass; window + DELIVERED-only enforced
- [ ] **Admin flow** (ADM-01…22) — all P0 pass; audit logging confirmed
- [ ] **Supplier flow** (SUP-01…18) — all P0 pass; data isolation confirmed
- [ ] **RBAC** (RBAC-01…17) — all 10 roles validated; server-side guards enforced
- [ ] **Non-functional** (NFR-01…12) — security headers, no-oversell, validation pass
- [ ] No P0/P1 defects open
- [ ] Production env vars / keys verified (Razorpay live, Shiprocket, Delhivery, DB, Sentry)
- [ ] Rollback plan confirmed

| Area | Total | Pass | Fail | Blocked | Sign-off |
|---|---|---|---|---|---|
| Customer | 22 | | | | |
| Payments | 16 | | | | |
| Shipping | 11 | | | | |
| Returns | 13 | | | | |
| Admin | 22 | | | | |
| Supplier | 18 | | | | |
| RBAC | 17 | | | | |
| Non-functional | 12 | | | | |
| **TOTAL** | **131** | | | | |

**QA Lead sign-off:** ______________  **Date:** __________  **Release decision: GO / NO-GO**
