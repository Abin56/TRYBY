# TRYBY Sports — Backend Handoff Document
**Generated:** 2026-06-04  
**Status:** Active Development — Backend ~60% complete, UI ~50% complete  
**Purpose:** Drop-in context document for a new chat/developer to continue without prior conversation history.

---

## 1. Project Identity

**TRYBY Sports** is a premium dropshipping e-commerce store for sports gear (Cricket, Football, Gym, Running, Racket, Combat).

**Vision:** "Apple-level design meets trending-product discovery." Not Amazon/Flipkart/generic Shopify.

**Two Next.js apps in one monorepo:**

| App | Directory | Port | Audience |
|-----|-----------|------|----------|
| Storefront | `store/` | 3000 | Customers |
| Admin Console | `admin/` | 3001 | Internal team |

Admin calls Store API via `NEXT_PUBLIC_STORE_URL=http://localhost:3000`.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.6 (App Router) |
| Language | TypeScript + React 19 |
| Styling | Tailwind CSS v4 + shadcn/ui primitives |
| Animation | Framer Motion 12 |
| ORM | Prisma 5.22 |
| Database | PostgreSQL (Neon/Supabase recommended) |
| Auth | Auth.js v5 (next-auth ^5.0.0-beta.31) |
| Payments | Razorpay 2.9.6 |
| Images | Cloudinary (REST upload, no SDK) |
| Email | Resend 4.0 |
| State | Zustand 5.0.14 (persisted to localStorage) |
| Validation | (Zod — not yet wired, structure planned) |
| Icons | Lucide React |
| Toasts | Sonner 2.0 |
| Charts | Recharts (admin only) |

**Key path alias:** `@/` → `store/` root (tsconfig paths).

---

## 3. Directory Structure

```
Dropshipping/
├── store/                        # Customer storefront (Next.js)
│   ├── app/                      # Next.js App Router pages + API routes
│   │   ├── api/                  # 50 API route files (see Section 8)
│   │   ├── admin/                # Store-side admin pages (built-in, role-guarded)
│   │   ├── auth/                 # Login, register, forgot-password, error
│   │   ├── account/              # User account, orders
│   │   ├── products/             # PLP + PDP
│   │   ├── checkout/             # Address + payment steps
│   │   ├── cart/, wishlist/, orders/
│   │   └── [splash, faq, about, contact, privacy-policy, terms, shipping, returns]
│   ├── components/               # React components (by feature folder)
│   ├── lib/                      # Auth, DB, RBAC, content, email, utils
│   ├── store/                    # Zustand stores (cart.ts)
│   ├── prisma/                   # schema.prisma + migrations
│   ├── scripts/                  # Seed scripts
│   ├── middleware.ts             # Edge auth guard
│   ├── .env.local                # Secrets (see Section 11)
│   └── package.json
│
├── admin/                        # Admin dashboard (separate Next.js app)
│   ├── app/
│   │   ├── admin/                # 18 admin pages
│   │   └── page.tsx              # Redirect → /admin
│   ├── components/               # Admin-specific UI components
│   ├── lib/                      # cn.ts, format.ts
│   ├── store/                    # ui.ts Zustand store (sidebar state)
│   └── .env.local                # NEXT_PUBLIC_STORE_URL only
│
├── ARCHITECTURE.md               # Master 2700-line blueprint
├── BACKEND_ARCHITECTURE.md
├── DESIGN_SYSTEM.md
├── TRYBY_BACKEND_HANDOFF.md      # ← this file
└── PROJECT_STATUS.txt            # Last snapshot: 2026-06-03
```

---

## 4. Database Schema (Prisma)

**File:** `store/prisma/schema.prisma`  
**Provider:** PostgreSQL  
**Generator:** prisma-client-js

### Enums

```
Sport              CRICKET | FOOTBALL | GYM | RUNNING | RACKET | COMBAT | OTHER
OrderStatus        PENDING → CONFIRMED → PROCESSING → SHIPPED → OUT_FOR_DELIVERY
                   → DELIVERED | CANCELLED | RETURN_REQUESTED | RETURNED | REFUNDED
PaymentStatus      PENDING | AUTHORIZED | CAPTURED | FAILED | REFUNDED | PARTIALLY_REFUNDED
PaymentMethod      RAZORPAY_CARD | RAZORPAY_UPI | RAZORPAY_NETBANKING | RAZORPAY_WALLET | COD
UserRole           CUSTOMER | SUPPLIER | ADMIN
AdminRole          SUPER_ADMIN | ADMIN | PRODUCT_MANAGER | CONTENT_MANAGER | ORDER_MANAGER | SUPPORT_AGENT
SupplierStatus     PENDING | APPROVED | SUSPENDED
ReviewStatus       PENDING | APPROVED | REJECTED
CouponType         PERCENTAGE | FLAT | FREE_SHIPPING
BadgeType          TRENDING | NEW | SALE | OFFICIAL | BEST_SELLER | LIMITED
ContentBlockType   HERO_BANNER | TRUST_BAR | CATEGORY_GRID | TRENDING_PRODUCTS | PROMO_BANNER | FOOTER_COLUMN | STATIC_PAGE
PublishStatus      DRAFT | PUBLISHED | SCHEDULED
ReturnStatus       REQUESTED | APPROVED | PICKUP_SCHEDULED | RECEIVED | REFUNDED | REJECTED
ReturnReason       DAMAGED | WRONG_ITEM | NOT_AS_DESCRIBED | CHANGED_MIND | DEFECTIVE | SIZE_ISSUE | OTHER
AssetType          PRODUCT_IMAGE | HERO_IMAGE | BANNER_IMAGE | CATEGORY_IMAGE | BRAND_LOGO | MISC
AuditAction        (30+ values covering login, product, order, return, content, settings, supplier, coupon events)
InstagramPostStatus ACTIVE | ARCHIVED
```

### Models Summary

#### Auth (Auth.js required tables)
| Model | Key fields |
|-------|-----------|
| `Account` | userId, provider, providerAccountId, access_token |
| `Session` | sessionToken, userId, expires |
| `VerificationToken` | identifier, token, expires |

#### Users & Admin
| Model | Key fields |
|-------|-----------|
| `User` | id, email (unique), phone (unique), role (UserRole), isActive |
| `AdminProfile` | userId (unique), adminRole, permissions[], passwordHash, mustResetPwd, lastLoginAt |
| `AuditLog` | adminId, action (AuditAction), resourceType, resourceId, oldValue/newValue (Json) |

#### Catalog
| Model | Key fields |
|-------|-----------|
| `Category` | slug (unique), sport, parentId (self-relation tree) |
| `Product` | slug (unique), sport, categoryId, supplierId?, shippingCost, packagingCost, showOnHomepage |
| `ProductVariant` | sku (unique), productId, size, color, price, mrp, costPrice, stock |
| `ProductImage` | productId, variantId? (null = all variants), isPrimary, sortOrder |
| `ProductBadge` | productId, type (BadgeType), expiresAt |
| `BundleItem` | productId, bundleId, quantity, discount |

#### Cart & Wishlist
| Model | Key fields | Unique constraint |
|-------|-----------|-------------------|
| `CartItem` | userId, productId, variantId, quantity | [userId, variantId] |
| `WishlistItem` | userId, productId | [userId, productId] |

#### Orders
| Model | Key fields |
|-------|-----------|
| `Order` | orderNumber (unique), userId, status, subtotal, shippingCharge, discount, total, couponId? |
| `OrderItem` | orderId, productId, variantId, productName, variantSku (snapshot fields for immutability) |
| `OrderStatusHistory` | orderId, status, note |

#### Payments & Shipping
| Model | Key fields |
|-------|-----------|
| `Payment` | orderId (unique), razorpayOrderId, razorpayPaymentId, razorpaySignature, status, amount |
| `Shipment` | orderId (unique), carrier, trackingNumber, trackingUrl, dispatchedAt, deliveredAt |

#### Returns
| Model | Key fields |
|-------|-----------|
| `ReturnRequest` | returnNumber (unique, e.g. "RET-20250001"), orderId, userId, status, reason, refundAmount, imageUrls[] |
| `ReturnItem` | returnRequestId, productId, variantId?, quantity, unitPrice |

#### Commerce
| Model | Key fields |
|-------|-----------|
| `Coupon` | code (unique), type, value, minOrderValue, maxDiscount, usageLimit, perUserLimit, validUntil |
| `Supplier` | userId (unique), companyName, gstin, commissionRate, pendingPayout |
| `Payout` | supplierId, amount, periodStart, periodEnd, status, utrNumber |
| `Review` | userId, productId, orderItemId? (unique), rating, status (ReviewStatus), isVerified |

#### CMS & Config
| Model | Key fields |
|-------|-----------|
| `ContentBlock` | key (unique, e.g. "homepage_hero"), type, status (PublishStatus), data (Json) |
| `SiteSettings` | key (unique, e.g. "seo_home"), metaTitle, metaDescription, ogImageUrl, robotsContent, extraData (Json) |
| `AnnouncementMessage` | message, ctaText, ctaUrl, isActive, validUntil |
| `MediaAsset` | url, publicId, filename, folder, bytes, format, focalPointX/Y, type (AssetType) |

#### Other
| Model | Key fields |
|-------|-----------|
| `NewsletterSubscriber` | email (unique), userId?, isActive, source |
| `Notification` | userId, type, title, body, data (Json), isRead |
| `InstagramPost` | instagramId (unique), imageUrl, permalink, status |
| `Address` | userId, type (AddressType), fullName, phone, line1, city, state, pincode, isDefault |

---

## 5. Authentication Architecture

### Files
```
store/lib/auth.config.ts    ← Edge-safe (middleware uses this)
store/lib/auth.ts           ← Full config (API routes / Server Components use this)
store/lib/auth.types.ts     ← Session type augmentation
store/middleware.ts         ← Route protection
```

### Strategy
- **JWT sessions** (edge-compatible, no DB hit on every request)
- **Prisma Adapter** in `auth.ts` for account/session persistence
- **Two providers:**
  - Google OAuth (`auth.config.ts`)
  - Credentials email/password (`auth.ts` only — Node runtime)

### Credentials flow (two separate paths)
**Admin users:** password stored as bcrypt hash in `AdminProfile.passwordHash`  
**Customers:** password stored as bcrypt hash in `Account.access_token` (legacy pattern — registered via `/api/auth/register`)

### JWT payload fields (embedded at sign-in)
```typescript
token.id          // User.id
token.role        // UserRole (CUSTOMER | SUPPLIER | ADMIN)
token.adminRole   // AdminRole | null
token.permissions // string[] — extra per-user grants from AdminProfile
```

### Session fields (available via `auth()` or `useSession()`)
```typescript
session.user.id
session.user.role
session.user.adminRole
session.user.permissions
```

---

## 6. RBAC (Role-Based Access Control)

**File:** `store/lib/rbac.ts`

### Permission strings format: `"resource:action"`

Resources: `products`, `orders`, `returns`, `customers`, `content`, `media`, `seo`, `analytics`, `profit`, `coupons`, `settings`, `suppliers`, `payouts`, `team`, `audit`

### Role → default permissions matrix

| AdminRole | Key permissions |
|-----------|----------------|
| `SUPER_ADMIN` | All 29 permissions |
| `ADMIN` | All except `settings:write`, `payouts:write`, `team:write` |
| `PRODUCT_MANAGER` | products:read/write, media:read/write, customers:read |
| `CONTENT_MANAGER` | content, media, seo (read/write), products:read |
| `ORDER_MANAGER` | orders, returns (read/write), customers:read, products:read |
| `SUPPORT_AGENT` | orders:read, returns:read/write, customers:read, products:read |

### API guard helper
```typescript
import { canAccess } from "@/lib/rbac";

const session = await auth();
if (!canAccess(session, "products:write")) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

**Note:** Current admin API routes use a simpler inline check (`role !== "ADMIN"`). Full RBAC via `canAccess()` is defined but not yet applied to all routes — this is a known pending task.

---

## 7. Middleware

**File:** `store/middleware.ts`

```typescript
// Edge-safe: uses authConfig (no Prisma, no bcrypt)
export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/checkout/:path*", "/orders/:path*"],
};
```

**Rules:**
- `/account/*` → redirect to `/auth/login?callbackUrl=...` if no session
- `/admin/*` → redirect to login if no session; redirect to `/` if `session.user.role !== "ADMIN"`
- `/checkout/*`, `/orders/*` → redirect to login if no session

**Important:** Admin pages in the `store/app/admin/` directory are protected here. The separate `admin/` app has **no authentication** — it is an internal tool that calls the store API. Auth enforcement for the `admin/` app is entirely API-side.

---

## 8. API Routes (Store)

All routes live under `store/app/api/`. 50 route files total.

### Auth
```
POST /api/auth/[...nextauth]          NextAuth handler
POST /api/auth/register               Email/password registration (hashes password into Account.access_token)
POST /api/auth/forgot-password        Password reset email via Resend
```

### Public Product Routes
```
GET  /api/products                    List with filters: sport, category, minPrice, maxPrice, sort, page
GET  /api/products/[slug]             Single product with variants and images
GET  /api/products/trending           Sorted by weeklySoldCount DESC
GET  /api/products/best-sellers       Sorted by totalSoldCount DESC
GET  /api/products/new-arrivals       Sorted by createdAt DESC
GET  /api/products/jerseys            isOfficialLicensed=true products
GET  /api/search                      Full-text search
```

### Public Store Routes
```
GET  /api/announcement                Active AnnouncementMessages (isActive=true, validUntil check)
POST /api/newsletter                  Subscribe email to NewsletterSubscriber
GET  /api/content/[key]               Single ContentBlock by key (PUBLISHED only)
GET  /api/content/blocks              All active PUBLISHED ContentBlocks
POST /api/supplier/apply              Supplier onboarding form
```

### Authenticated Customer Routes
```
GET/POST /api/cart                    Get or sync cart items
GET/POST /api/addresses               Saved shipping addresses
GET      /api/wishlist                User wishlist
POST     /api/wishlist                Add to wishlist
GET/POST /api/reviews                 Product reviews (GET = approved only, POST = create)
POST     /api/orders                  Create order (requires auth)
```

### Payment Routes
```
POST /api/payments/razorpay/create-order    Creates Razorpay order, updates Payment.razorpayOrderId
POST /api/payments/razorpay/verify          HMAC-SHA256 signature verification → marks Payment CAPTURED, Order CONFIRMED
```

### Admin Routes (require `role === "ADMIN"`)
```
# Products
GET/POST        /api/admin/products
GET/PATCH/DELETE /api/admin/products/[id]
POST/DELETE     /api/admin/products/[id]/images
GET/POST/DELETE /api/admin/products/[id]/variants

# Categories
GET/POST        /api/admin/categories
GET/PATCH/DELETE /api/admin/categories/[id]

# Orders
GET             /api/admin/orders
GET/PATCH       /api/admin/orders/[id]

# Customers
GET             /api/admin/customers

# Coupons
GET/POST        /api/admin/coupons
GET/PATCH/DELETE /api/admin/coupons/[id]

# Media & Upload
GET/POST        /api/admin/media
GET/PATCH/DELETE /api/admin/media/[id]
POST            /api/admin/upload        (multipart, proxies to Cloudinary REST)

# Returns
GET             /api/admin/returns
GET/PATCH       /api/admin/returns/[id]

# Suppliers
GET             /api/admin/suppliers
GET/PATCH       /api/admin/suppliers/[id]

# CMS
GET/POST        /api/admin/content
GET/PUT/DELETE  /api/admin/content/[key]
GET/POST        /api/admin/content/blocks
GET/PATCH/DELETE /api/admin/content/blocks/[id]

# Announcements
GET/POST        /api/admin/announcements
GET/PATCH/DELETE /api/admin/announcements/[id]

# Analytics & Profit
GET             /api/admin/analytics      KPIs, daily time-series, top products, coupons, low stock
GET             /api/admin/profit         Profit/margin breakdown (today, month, period, per-product)

# Config
GET/PUT         /api/admin/seo            SiteSettings by key (seo_home, seo_products, etc.)
GET/PUT         /api/admin/settings       Global store config (store_config SiteSettings key)
```

---

## 9. Profit System

**Route:** `GET /api/admin/profit?days=30`

**Profit formula per order item:**
```
revenue   = OrderItem.total
cogs      = ProductVariant.costPrice × quantity
shipping  = Product.shippingCost × quantity
packaging = Product.packagingCost × quantity
profit    = revenue - cogs - shipping - packaging
margin%   = (profit / revenue) × 100
```

**Response shape:**
```typescript
{
  today:     { revenue, cogs, shipping, packaging, profit, margin }
  thisMonth: { ... }
  lastMonth: { ... }
  period:    { ... }   // last N days
  profitGrowth: number  // % vs last month
  topProfit:    ProductProfit[]  // top 10 by profit
  lowestMargin: ProductProfit[]  // bottom 10 by margin (only products with cogs > 0)
  alerts: { lowStock: number, missingCost: number }
}
```

**Only CAPTURED payments are included.**  
**Alert:** `missingCost` counts variants where `costPrice IS NULL` — these skew profit calculations.

---

## 10. CMS Architecture

### ContentBlock model
- Key-value store where `key` is a slug (e.g. `"homepage_hero"`)
- `data` is untyped `Json` — each block type has a different shape
- `status` must be `PUBLISHED` for storefront to render it
- `scheduledFor` enables future publishing

### Known keys (active in admin)
```
homepage_hero          Hero section (headline, subheadline, CTAs, images, badge)
homepage_trust_bar     Trust bar items (icon, title, subtitle)
footer_columns         Footer navigation columns
```

### Reading content (server component)
```typescript
import { getBlock, getPublishedBlocks } from "@/lib/content";

const hero = await getBlock("homepage_hero");         // single
const all  = await getPublishedBlocks("HERO_BANNER"); // by type
```

### Admin CMS pages (admin app)
```
/admin/content          Tab UI: Announcements | Hero | Trust Bar | Footer
/admin/seo              Per-page meta editor (6 pages) → SiteSettings table
/admin/media            Cloudinary asset library
```

---

## 11. Media Studio Architecture

**Upload flow:**
1. Admin drag-drops file onto `/admin/media`
2. `POST /api/admin/upload` (multipart form-data, max 10MB, JPG/PNG/WebP only)
3. Route proxies to Cloudinary REST: `https://api.cloudinary.com/v1_1/{cloud}/image/upload`
4. Uses unsigned upload preset `tryby_uploads` (must be created in Cloudinary dashboard)
5. Response saved to `MediaAsset` table
6. Admin can set focal point (focalPointX/Y: 0.0–1.0) for smart cropping

**MediaAsset fields:**
```
url          Full Cloudinary URL (secure_url)
publicId     Cloudinary public_id (used to build transform URLs)
filename     Original file name
folder       e.g. "tryby/products", "tryby/hero", "tryby/misc"
bytes        File size in bytes
format       "jpg" | "webp" | "png"
focalPointX  0.0–1.0 (drives object-position on storefront)
focalPointY  0.0–1.0
```

**Transform URL pattern:**
```
https://res.cloudinary.com/{cloud}/image/upload/w_800,q_auto,f_auto/{publicId}
```

---

## 12. Product Architecture

**A product has:**
- One `Category` (with optional parent — supports 2-level hierarchy)
- One optional `Supplier`
- Many `ProductVariant` (each with unique SKU, size, color, price, mrp, **costPrice**, stock)
- Many `ProductImage` (can be variant-specific via `variantId`, or shared across all variants)
- Many `ProductBadge` (TRENDING, NEW, SALE, etc. — unique per product/type)

**Profit fields on Product:**
- `shippingCost` — estimated shipping cost per unit
- `packagingCost` — packaging materials per unit

**Homepage merchandising:**
- `showOnHomepage` boolean
- `homepageSortOrder` int

**Analytics fields:**
- `totalSoldCount` — all-time units sold (updated on order confirm)
- `weeklySoldCount` — rolling 7-day (needs a scheduled job to reset — **not yet implemented**)
- `avgRating`, `reviewCount` — denormalized from Review table (updated on review approval)

**Order number format:** `TRB-{timestamp_base36}-{rand4}` (generated in `lib/utils/order.ts`)

---

## 13. Order Architecture

**Order lifecycle:**
```
PENDING → CONFIRMED → PROCESSING → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
                                                               → RETURN_REQUESTED → RETURNED → REFUNDED
       → CANCELLED
```

**Every status change:** creates an `OrderStatusHistory` row (audit trail).

**Order creation flow:**
1. `POST /api/orders` — creates `Order` + `OrderItem[]` (with product/variant snapshots) + `Payment` (status=PENDING)
2. `POST /api/payments/razorpay/create-order` — creates Razorpay order, stores `razorpayOrderId` in Payment
3. Client shows Razorpay modal
4. On success → `POST /api/payments/razorpay/verify` — HMAC check → Payment→CAPTURED, Order→CONFIRMED (in DB transaction)

**Idempotency:** If Payment already has a `razorpayOrderId`, the create-order route returns it immediately without creating a new one.

---

## 14. Cart Architecture

**Zustand store** (`store/store/cart.ts`) persisted to localStorage key `"tryby-sports-cart"`.

```typescript
CartItem { id, name, slug, price, compareAtPrice?, image, category, quantity }
CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem / removeItem / updateQuantity / clearCart
  openCart / closeCart / toggleCart
  itemCount(): number    // computed
  subtotal(): number     // computed
}
```

**Note:** The cart ID is the `ProductVariant.id`. Currently **no coupon/discount state** in Zustand — coupon logic lives server-side in the order creation API. Cart-to-DB sync (for logged-in users) via `GET/POST /api/cart` is defined but **not yet wired to the Zustand store** on login.

---

## 15. Store App Pages

```
/                         Homepage (hero, trending, viral, reviews, newsletter)
/products                 PLP (filters: sport, price, rating; sort; search)
/products/[slug]          PDP (gallery, variants, add to cart, reviews, FAQ)
/cart                     Cart page
/checkout                 Step 1: address selection
/checkout/payment         Step 2: Razorpay payment
/order-success            Confirmation
/order-failed             Error
/orders                   Order history (auth required)
/account                  User profile
/account/orders           Order list
/account/orders/[id]      Order detail
/wishlist                 Saved products
/auth/login               Email + Google sign-in
/auth/register            Email registration
/auth/forgot-password     Password reset request
/auth/error               Auth error fallback
/about, /contact, /faq, /privacy-policy, /terms, /shipping, /returns
/splash                   Splash screen gate
/maintenance              Maintenance page
```

**Store-side admin pages** (in `store/app/admin/`, protected by middleware):
```
/admin                    Dashboard
/admin/products           CRUD (+ /new, /[id]/edit, /[id]/variants)
/admin/orders
/admin/customers
/admin/categories
/admin/content            (+ /homepage, /announcements)
/admin/media
/admin/profit
/admin/settings
```

---

## 16. Admin App Pages (admin/)

All pages under `admin/app/admin/`. No auth — enforced at API level.

| Page | Status | Notes |
|------|--------|-------|
| `/admin` | Done | KPIs, revenue chart, category pie, recent orders, top products, stock alerts |
| `/admin/products` | Done | Full CRUD drawer, sort, filter, pagination |
| `/admin/orders` | Done | Order list, status pipeline, tracking |
| `/admin/customers` | Done | Customer list, purchase history drawer |
| `/admin/content` | Done | Hero, trust bar, announcements, footer tabs |
| `/admin/media` | Done | Upload, gallery, focal point, device previews |
| `/admin/seo` | Done | Per-page meta + OG editor with preview |
| `/admin/analytics` | Partial | Page shell only |
| `/admin/coupons` | Partial | Page shell only |
| `/admin/inventory` | Partial | Page shell only |
| `/admin/marketing` | Partial | Page shell only |
| `/admin/reviews` | Partial | Page shell only |
| `/admin/suppliers` | Partial | Page shell only |
| `/admin/returns` | Partial | Page shell only |
| `/admin/profit` | Partial | Page shell only |
| `/admin/support` | Partial | Page shell only |
| `/admin/settings` | Partial | Page shell only |
| `/admin/homepage` | Done | Separate homepage content builder |

---

## 17. Admin Components

```
components/
├── charts/
│   ├── revenue-chart.tsx     Area/bar toggle, 7D/14D/30D periods, Recharts
│   └── category-chart.tsx    Donut pie, sport breakdown
├── layout/
│   ├── sidebar.tsx           Collapsible (64px↔240px), Framer Motion, lime accent #E8FF47
│   └── topbar.tsx            Breadcrumb, search bar, notifications, page action button
└── ui/
    ├── badge.tsx             success/warning/danger/info/neutral/primary variants
    ├── drawer.tsx            Slide-in from right, Escape key, configurable width
    ├── media-picker.tsx      Modal to select from MediaAsset library
    └── stats-card.tsx        KPI card with trend indicator, skeleton loading
```

---

## 18. Store Components

```
components/
├── about/          about-hero, about-mission, about-stats, about-values, about-team, about-supplier-cta
├── brand/          tryby-logo.tsx
├── cart/           cart-drawer.tsx
├── home/           hero, hero-client, trending-section, trending-gear, trending-gear-client,
│                   featured-collections, featured-jerseys, trending-jerseys, shop-by-sport,
│                   problem-solvers, viral-section, why-tryby, trust-section, reviews-section,
│                   supplier-network, instagram-community, partner-cta, promo-banner,
│                   newsletter, product-card, category-nav
├── layout/         navbar, footer, footer-client, announcement-bar, announcement-carousel
├── onboarding/     splash-screen, splash-gate, onboarding-flow
├── pdp/            pdp-gallery, pdp-accordion, quantity-selector, size-selector, size-toast
├── plp/            filter-sidebar, plp-product-card, sort-dropdown, plp-pagination
├── search/         search-palette (Cmd+K)
├── seo/            json-ld.tsx
├── system/         empty-state, error-state, coming-soon, prelaunch-notice, stadium-bg,
│                   skeletons/hero-skeleton, skeletons/pdp-skeleton, skeletons/product-card-skeleton,
│                   tryby-logo
└── ui/             button, badge, star-rating, jersey-image
```

---

## 19. Store Lib Files

```
store/lib/
├── auth.config.ts        Edge-safe NextAuth config (Google + JWT callbacks)
├── auth.ts               Full NextAuth config (+ Prisma adapter + Credentials provider)
├── auth.types.ts         Session type augmentation (adds role, adminRole, permissions to session.user)
├── cn.ts                 clsx + tailwind-merge helper
├── content.ts            getPublishedBlocks(), getBlock(), getSiteConfig() — Prisma helpers
├── db.ts                 Prisma client singleton (global in dev, new in prod)
├── email.ts              Resend-based email sending
├── rbac.ts               Permission types, ROLE_PERMISSIONS map, hasPermission(), canAccess()
└── utils/
    └── order.ts          generateOrderNumber() → "TRB-{base36}-{rand4}"
```

---

## 20. Environment Variables

### Store (`store/.env.local`)
```
DATABASE_URL                     PostgreSQL connection string (e.g. postgresql://user:pass@host/db)
NEXTAUTH_SECRET                  Random 32-byte string: openssl rand -base64 32
NEXTAUTH_URL                     http://localhost:3000 (production: https://yourdomain.com)
GOOGLE_CLIENT_ID                 Google OAuth app client ID
GOOGLE_CLIENT_SECRET             Google OAuth app client secret
RAZORPAY_KEY_ID                  Razorpay API key ID
RAZORPAY_KEY_SECRET              Razorpay API key secret
NEXT_PUBLIC_RAZORPAY_KEY_ID      Same as RAZORPAY_KEY_ID (exposed to browser for modal)
CLOUDINARY_CLOUD_NAME            Cloudinary cloud name
CLOUDINARY_API_KEY               Cloudinary API key
CLOUDINARY_API_SECRET            Cloudinary API secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME  Same as CLOUDINARY_CLOUD_NAME (for transform URLs)
RESEND_API_KEY                   Resend API key
RESEND_FROM_EMAIL                e.g. noreply@yourdomain.com
NEXT_PUBLIC_APP_URL              http://localhost:3000
```

### Admin (`admin/.env.local`)
```
NEXT_PUBLIC_STORE_URL            http://localhost:3000  (points to store API)
```

---

## 21. NPM Scripts

### Store (`store/`)
```
npm run dev          next dev (port 3000)
npm run build        prisma generate && next build
npm run start        next start
npm run lint         eslint
npm run db:migrate   prisma migrate dev
npm run db:push      prisma db push (schema push without migration files — dev only)
npm run db:seed      npx tsx prisma/seed.ts
npm run db:studio    prisma studio
npm run db:reset     prisma migrate reset
```

---

## 22. Cloudinary Setup Required

1. Create a Cloudinary account
2. In Cloudinary dashboard → Settings → Upload → Upload Presets:
   - Create unsigned preset named `tryby_uploads`
   - Set folder to `tryby`
   - Enable auto-quality and auto-format

---

## 23. Design System

**Brand colors:**
```
Background:  #0A0A0A
Cards:       #111111
Primary:     #2563EB (blue)
Text:        #FFFFFF
Secondary:   #9CA3AF
Success:     #10B981
Error:       #EF4444
```

**Admin-only colors:**
```
Sidebar bg:  #0D0D0D
Accent:      #E8FF47 (lime-yellow)
```

**Typography:** Inter (sans-serif), JetBrains Mono (code)

**Border radius:** Cards 16px, Buttons 8px, Avatars 9999px

---

## 24. Pending Tasks (Priority Order)

### Critical / Blocking
- [ ] **Run `prisma migrate dev`** — schema exists but migration has not been applied since `MediaAsset` refactor
- [ ] **Wire cart sync on login** — merge guest Zustand cart into DB `CartItem` via `/api/cart` POST
- [ ] **Auth pages** — `/auth/login`, `/auth/register`, `/auth/forgot-password` pages exist but are placeholder shells
- [ ] **Account pages** — `/account`, `/account/profile`, `/account/addresses` pages needed
- [ ] **PDP full implementation** — routing exists, component needs variant selection → cart wiring

### Admin App
- [ ] **Wire orders/customers/coupons admin pages to real API** (currently stub data)
- [ ] **Build coupon create/edit UI** — `/admin/coupons` is shell
- [ ] **Complete partial admin pages:** analytics, inventory, reviews, suppliers, returns, profit, support, settings
- [ ] **Apply full RBAC** — replace simple `adminOnly()` checks with `canAccess()` from `lib/rbac.ts`

### Infrastructure
- [ ] **Weekly sold count reset job** — `Product.weeklySoldCount` has no reset mechanism
- [ ] **Razorpay webhook** — `/api/webhooks/razorpay` route not yet created (currently only direct verify)
- [ ] **Email templates** — `lib/email.ts` exists but templates not built (order confirm, shipping update, etc.)
- [ ] **Review approval workflow** — reviews are created but no admin trigger to update `Product.avgRating` / `reviewCount`
- [ ] **Seed script** — `prisma/seed.ts` referenced in package.json; not yet confirmed to exist

---

## 25. Known Issues

1. **Customer password storage** — Hashed password in `Account.access_token` is a non-standard pattern. Auth.js v5 does not have a first-class Credentials adapter. Consider migrating to a dedicated `passwordHash` field on `User` or `AdminProfile`-style approach.

2. **Cart is Zustand-only** — No DB sync on login. Guest users lose cart on session change. The `/api/cart` route exists but is not called by the client.

3. **`weeklySoldCount` never resets** — There is no cron job or scheduled function to roll this counter. It accumulates forever.

4. **Admin app has zero auth** — The `admin/` Next.js app has no middleware, no login page, no session. Security is entirely dependent on the API routes rejecting non-admin JWT tokens. Anyone who can reach `:3001` in a development environment can see the UI.

5. **`tryby_uploads` Cloudinary preset** — The upload route hardcodes this preset name. If not created in the Cloudinary dashboard, all uploads will fail with a 4xx from Cloudinary.

6. **`NEXT_PUBLIC_RAZORPAY_KEY_ID` duplication** — The client-side Razorpay modal needs the key ID. Currently set as a separate env var. Make sure both `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID` are set to the same value.

7. **No Razorpay webhook** — Payment status is updated only via the direct verify endpoint. If a user closes the browser before the verify call completes, the order stays in PENDING forever.

8. **`Product.avgRating` / `reviewCount` are stale** — These are denormalized fields but no code currently updates them when a review is approved. They default to 0/0.

---

## 26. Future Roadmap

### Phase 1 — Complete Core Flows
- Auth pages (login, register, forgot password)
- Account + order history pages
- PDP full wiring (variant → cart → checkout)
- Cart–DB sync on login

### Phase 2 — Admin Completeness
- All 10 partial admin pages
- Full RBAC enforcement
- Audit log viewer
- Admin team management (invite, disable, reset password)

### Phase 3 — Commerce Features
- Razorpay webhook handler
- Shipment tracking integration (Shiprocket / Delhivery API)
- Returns portal (customer-facing `/returns` page)
- Coupon apply at checkout (client + server)

### Phase 4 — Growth
- Review system end-to-end (submit → approve → rating update)
- Supplier portal (supplier login, order visibility, payout history)
- Instagram UGC integration (pull from Instagram API → `InstagramPost`)
- Email flows (order confirm, shipping, abandoned cart)
- Weekly sold count reset (Vercel Cron or pg_cron)
- Analytics dashboard full build

### Phase 5 — Production Hardening
- Rate limiting on auth + payment routes
- Admin audit log UI
- Full RBAC on all admin API routes
- Error monitoring (Sentry)
- Performance: ISR for PDP + PLP, Partial Prerendering

---

## 27. Quick Start for New Developer

```bash
# 1. Clone and install
npm install        # in store/
npm install        # in admin/

# 2. Configure store secrets
cp store/.env.local.example store/.env.local   # fill in all vars (Section 20)

# 3. Apply database migrations
cd store
npm run db:migrate

# 4. (Optional) Seed database
npm run db:seed

# 5. Run both apps
# Terminal 1:
cd store && npm run dev      # http://localhost:3000

# Terminal 2:
cd admin && npm run dev      # http://localhost:3001

# 6. Create Cloudinary upload preset
# Dashboard → Settings → Upload → Upload Presets → Add unsigned preset named "tryby_uploads"

# 7. Access admin
# Navigate to http://localhost:3000/admin (store-side)
# Or http://localhost:3001/admin (standalone admin)
# Create an admin user via DB seed or direct Prisma Studio (npm run db:studio)
```

---

## 28. Key Files Quick Reference

| What | Where |
|------|-------|
| Prisma schema | `store/prisma/schema.prisma` |
| Auth config (edge) | `store/lib/auth.config.ts` |
| Auth config (full) | `store/lib/auth.ts` |
| RBAC permissions | `store/lib/rbac.ts` |
| Route protection | `store/middleware.ts` |
| DB client singleton | `store/lib/db.ts` |
| CMS helpers | `store/lib/content.ts` |
| Cart Zustand store | `store/store/cart.ts` |
| Order number generator | `store/lib/utils/order.ts` |
| Razorpay create-order | `store/app/api/payments/razorpay/create-order/route.ts` |
| Razorpay verify | `store/app/api/payments/razorpay/verify/route.ts` |
| Cloudinary upload | `store/app/api/admin/upload/route.ts` |
| Profit analytics | `store/app/api/admin/profit/route.ts` |
| Sales analytics | `store/app/api/admin/analytics/route.ts` |
| Admin sidebar | `admin/components/layout/sidebar.tsx` |
| Admin format utils | `admin/lib/format.ts` |
| Architecture blueprint | `ARCHITECTURE.md` (root) |
| Design system | `DESIGN_SYSTEM.md` (root) |
