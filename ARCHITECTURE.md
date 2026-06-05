# DROPSHIPPING PLATFORM — WORLD-CLASS ARCHITECTURE BLUEPRINT

**Vision:** Apple-level design meets trending-product discovery.
**Feel:** Premium · Trust · Curiosity · Simplicity · Speed · Delight

---

## STACK REFERENCE

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.x |
| Styling | Tailwind CSS v4 |
| UI Primitives | shadcn/ui (Radix under the hood) |
| Animation | Framer Motion 11 |
| Database | PostgreSQL 16 via Prisma ORM |
| Auth | Auth.js v5 (NextAuth) |
| Images | Cloudinary |
| Payments | Razorpay |
| Deployment | Vercel (Edge Network) |

---

# SECTION 1 — COMPLETE FOLDER STRUCTURE

```
dropship-platform/
├── app/                                        # Next.js 15 App Router root
│   ├── layout.tsx                              # Root layout — fonts, providers, toasts
│   ├── page.tsx                                # Homepage (ISR, revalidate: 3600)
│   ├── loading.tsx                             # Root loading UI (skeleton shell)
│   ├── error.tsx                               # Root error boundary (client)
│   ├── not-found.tsx                           # Global 404 page
│   ├── globals.css                             # Tailwind base + CSS custom properties
│   │
│   ├── (marketing)/                            # Route group — no extra layout segment
│   │   ├── layout.tsx                          # Marketing layout (nav + footer)
│   │   ├── page.tsx                            # Re-export of root page
│   │   ├── about/
│   │   │   └── page.tsx                        # About / brand story (SSG)
│   │   └── contact/
│   │       └── page.tsx                        # Contact form (SSR)
│   │
│   ├── products/
│   │   ├── layout.tsx                          # Products layout (filter sidebar slot)
│   │   ├── page.tsx                            # Products listing (SSR + URL state)
│   │   ├── loading.tsx                         # Product grid skeleton
│   │   └── [slug]/
│   │       ├── page.tsx                        # Product detail (ISR, revalidate: 1800)
│   │       ├── loading.tsx                     # PDP skeleton
│   │       └── not-found.tsx                   # Product not found
│   │
│   ├── category/
│   │   └── [slug]/
│   │       ├── page.tsx                        # Category listing (ISR, revalidate: 3600)
│   │       └── loading.tsx                     # Category skeleton
│   │
│   ├── search/
│   │   └── page.tsx                            # Search results (SSR, no-cache)
│   │
│   ├── cart/
│   │   └── page.tsx                            # Cart page (Client-heavy, CSR)
│   │
│   ├── checkout/
│   │   ├── layout.tsx                          # Checkout layout (minimal nav)
│   │   ├── page.tsx                            # Checkout step 1 — address (CSR)
│   │   ├── payment/
│   │   │   └── page.tsx                        # Checkout step 2 — payment (CSR)
│   │   └── success/
│   │       └── page.tsx                        # Order confirmation (SSR, dynamic)
│   │
│   ├── orders/
│   │   ├── page.tsx                            # Order history (SSR, auth-required)
│   │   └── [id]/
│   │       └── page.tsx                        # Order detail (SSR, auth-required)
│   │
│   ├── account/
│   │   ├── layout.tsx                          # Account shell layout (sidebar nav)
│   │   ├── page.tsx                            # Account overview dashboard (SSR)
│   │   ├── profile/
│   │   │   └── page.tsx                        # Profile edit (CSR form)
│   │   ├── addresses/
│   │   │   └── page.tsx                        # Saved addresses (SSR + mutations)
│   │   └── wishlist/
│   │       └── page.tsx                        # Wishlist (SSR, auth-required)
│   │
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx                        # Login page (CSR form)
│   │   ├── register/
│   │   │   └── page.tsx                        # Register page (CSR form)
│   │   ├── forgot-password/
│   │   │   └── page.tsx                        # Forgot password (CSR form)
│   │   ├── reset-password/
│   │   │   └── page.tsx                        # Reset password (CSR form, token)
│   │   └── verify/
│   │       └── page.tsx                        # Email verification landing (SSR)
│   │
│   ├── admin/
│   │   ├── layout.tsx                          # Admin shell (sidebar, admin nav)
│   │   ├── page.tsx                            # Admin dashboard overview (SSR)
│   │   ├── products/
│   │   │   ├── page.tsx                        # Product management table (SSR)
│   │   │   ├── new/
│   │   │   │   └── page.tsx                    # Create product (CSR form)
│   │   │   └── [id]/
│   │   │       └── page.tsx                    # Edit product (CSR form, SSR data)
│   │   ├── orders/
│   │   │   ├── page.tsx                        # Orders management table (SSR)
│   │   │   └── [id]/
│   │   │       └── page.tsx                    # Order detail + status management
│   │   ├── customers/
│   │   │   └── page.tsx                        # Customer management table (SSR)
│   │   ├── categories/
│   │   │   └── page.tsx                        # Category management (SSR)
│   │   ├── coupons/
│   │   │   └── page.tsx                        # Coupon management (SSR)
│   │   ├── analytics/
│   │   │   └── page.tsx                        # Analytics overview (SSR + CSR charts)
│   │   └── newsletter/
│   │       └── page.tsx                        # Newsletter subscribers (SSR)
│   │
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts                    # Auth.js handler
│       ├── webhooks/
│       │   └── razorpay/
│       │       └── route.ts                    # Razorpay payment webhook
│       ├── products/
│       │   ├── route.ts                        # GET /api/products (list, search)
│       │   └── [slug]/
│       │       └── route.ts                    # GET /api/products/[slug]
│       ├── cart/
│       │   └── route.ts                        # GET, POST, PATCH, DELETE cart ops
│       ├── orders/
│       │   └── route.ts                        # POST create order
│       ├── reviews/
│       │   └── route.ts                        # POST review, GET product reviews
│       ├── wishlist/
│       │   └── route.ts                        # GET, POST, DELETE wishlist items
│       ├── newsletter/
│       │   └── route.ts                        # POST subscribe
│       ├── upload/
│       │   └── route.ts                        # POST Cloudinary signed upload
│       └── revalidate/
│           └── route.ts                        # POST on-demand ISR revalidation
│
├── components/
│   ├── layout/
│   │   ├── root-layout.tsx                     # HTML/body wrapper, provider tree
│   │   ├── navbar.tsx                          # Primary navigation (Client, glassmorphism)
│   │   ├── navbar-mobile.tsx                   # Mobile nav drawer (Client)
│   │   ├── footer.tsx                          # Site footer (Server)
│   │   ├── checkout-nav.tsx                    # Minimal checkout header (Server)
│   │   └── admin-sidebar.tsx                   # Admin sidebar nav (Client)
│   │
│   ├── navigation/
│   │   ├── nav-logo.tsx                        # Brand logo + wordmark (Server)
│   │   ├── nav-links.tsx                       # Desktop nav links (Client, hover state)
│   │   ├── nav-search.tsx                      # Search trigger + popover (Client)
│   │   ├── nav-cart-button.tsx                 # Cart icon + count badge (Client)
│   │   ├── nav-user-menu.tsx                   # User avatar dropdown (Client)
│   │   └── mega-menu.tsx                       # Category mega-menu panel (Client)
│   │
│   ├── home/
│   │   ├── hero-section.tsx                    # Hero (Client, Framer Motion)
│   │   ├── hero-headline.tsx                   # Animated headline text (Client)
│   │   ├── hero-cta.tsx                        # CTA button pair (Client)
│   │   ├── hero-product-preview.tsx            # Floating product mockup (Client)
│   │   ├── trending-section.tsx                # Trending products (Server shell)
│   │   ├── trending-carousel.tsx               # Horizontal scroll carousel (Client)
│   │   ├── problem-solvers-section.tsx         # Problem/solution grid (Server)
│   │   ├── viral-products-section.tsx          # Viral/social products (Server shell)
│   │   ├── viral-product-card.tsx              # Video-first product card (Client)
│   │   ├── why-us-section.tsx                  # Trust/value props (Server)
│   │   ├── why-us-item.tsx                     # Individual value prop item (Client)
│   │   ├── reviews-section.tsx                 # Social proof reviews (Server)
│   │   ├── review-marquee.tsx                  # Auto-scrolling review strip (Client)
│   │   └── newsletter-section.tsx              # Email capture (Client form)
│   │
│   ├── products/
│   │   ├── product-card.tsx                    # Standard product card (Server)
│   │   ├── product-card-client.tsx             # Client wrapper (hover, wishlist toggle)
│   │   ├── product-grid.tsx                    # Responsive grid layout (Server)
│   │   ├── product-filters.tsx                 # Filter sidebar/panel (Client)
│   │   ├── product-sort.tsx                    # Sort dropdown (Client)
│   │   ├── product-search-bar.tsx              # Inline search input (Client)
│   │   ├── product-badge.tsx                   # Trending/Sale/New badges (Server)
│   │   ├── product-price.tsx                   # Price + discount display (Server)
│   │   ├── product-rating.tsx                  # Star rating display (Server)
│   │   ├── products-pagination.tsx             # Pagination controls (Client)
│   │   └── products-empty-state.tsx            # Empty results state (Server)
│   │
│   ├── pdp/                                    # Product Detail Page components
│   │   ├── pdp-shell.tsx                       # PDP layout orchestrator (Server)
│   │   ├── pdp-gallery.tsx                     # Image/video gallery (Client)
│   │   ├── pdp-gallery-thumbs.tsx              # Thumbnail strip (Client)
│   │   ├── pdp-video-player.tsx                # Product video embed (Client)
│   │   ├── pdp-info.tsx                        # Title, price, rating block (Server)
│   │   ├── pdp-purchase-box.tsx                # Quantity + Add to Cart (Client)
│   │   ├── pdp-sticky-bar.tsx                  # Sticky purchase bar on scroll (Client)
│   │   ├── pdp-benefits.tsx                    # Icon-driven benefits list (Server)
│   │   ├── pdp-problem-solution.tsx            # Before/after narrative (Server)
│   │   ├── pdp-features.tsx                    # Feature breakdown (Server)
│   │   ├── pdp-reviews.tsx                     # Reviews with filter (Client)
│   │   ├── pdp-review-form.tsx                 # Submit review form (Client)
│   │   ├── pdp-faq.tsx                         # Accordion FAQ (Client)
│   │   ├── pdp-related-products.tsx            # Related products row (Server)
│   │   └── pdp-share-buttons.tsx               # Social share buttons (Client)
│   │
│   ├── cart/
│   │   ├── cart-sheet.tsx                      # Slide-over cart drawer (Client)
│   │   ├── cart-item.tsx                       # Individual cart item row (Client)
│   │   ├── cart-summary.tsx                    # Subtotal, fees, totals (Client)
│   │   ├── cart-coupon.tsx                     # Coupon code input (Client)
│   │   ├── cart-upsell.tsx                     # "You might also like" row (Client)
│   │   └── cart-empty-state.tsx                # Empty cart illustration (Server)
│   │
│   ├── checkout/
│   │   ├── checkout-progress.tsx               # Step indicator bar (Client)
│   │   ├── address-form.tsx                    # Address entry form (Client)
│   │   ├── address-select.tsx                  # Saved address selector (Client)
│   │   ├── order-summary-panel.tsx             # Right-side order summary (Server)
│   │   ├── payment-form.tsx                    # Razorpay integration (Client)
│   │   └── order-confirmation.tsx              # Success/confirmation view (Server)
│   │
│   ├── account/
│   │   ├── account-sidebar.tsx                 # Account nav links (Client)
│   │   ├── profile-form.tsx                    # Profile edit form (Client)
│   │   ├── address-card.tsx                    # Saved address card (Client)
│   │   ├── address-form-modal.tsx              # Add/edit address modal (Client)
│   │   ├── order-history-table.tsx             # Past orders table (Server)
│   │   ├── order-detail-view.tsx               # Single order breakdown (Server)
│   │   ├── wishlist-grid.tsx                   # Wishlist product grid (Server)
│   │   └── account-stats.tsx                  # Quick stats bar (Server)
│   │
│   ├── auth/
│   │   ├── login-form.tsx                      # Login form (Client)
│   │   ├── register-form.tsx                   # Register form (Client)
│   │   ├── forgot-password-form.tsx            # Forgot password (Client)
│   │   ├── reset-password-form.tsx             # Reset with token (Client)
│   │   ├── oauth-buttons.tsx                   # Google/GitHub OAuth (Client)
│   │   └── auth-card.tsx                       # Shared auth container card (Server)
│   │
│   ├── admin/
│   │   ├── admin-header.tsx                    # Admin top bar (Client)
│   │   ├── stats-card.tsx                      # KPI metric card (Server)
│   │   ├── revenue-chart.tsx                   # Revenue line chart (Client)
│   │   ├── orders-chart.tsx                    # Orders bar chart (Client)
│   │   ├── data-table.tsx                      # Generic sortable data table (Client)
│   │   ├── product-form.tsx                    # Create/edit product form (Client)
│   │   ├── image-uploader.tsx                  # Cloudinary upload widget (Client)
│   │   ├── order-status-select.tsx             # Order status changer (Client)
│   │   └── category-form.tsx                   # Create/edit category (Client)
│   │
│   └── ui/                                     # Shared design-system primitives
│       ├── button.tsx                          # Button variants (Server-safe)
│       ├── badge.tsx                           # Badge component (Server-safe)
│       ├── card.tsx                            # Card container (Server-safe)
│       ├── input.tsx                           # Input field (Server-safe)
│       ├── textarea.tsx                        # Textarea (Server-safe)
│       ├── select.tsx                          # Select dropdown (Client)
│       ├── dialog.tsx                          # Modal dialog (Client)
│       ├── drawer.tsx                          # Slide-over drawer (Client)
│       ├── sheet.tsx                           # Bottom/side sheet (Client)
│       ├── toast.tsx                           # Toast notification (Client)
│       ├── toaster.tsx                         # Toast container/provider (Client)
│       ├── skeleton.tsx                        # Skeleton loader (Server-safe)
│       ├── spinner.tsx                         # Loading spinner (Server-safe)
│       ├── avatar.tsx                          # User avatar (Server-safe)
│       ├── separator.tsx                       # Divider line (Server-safe)
│       ├── tabs.tsx                            # Tab group (Client)
│       ├── accordion.tsx                       # Accordion (Client)
│       ├── slider.tsx                          # Range slider (Client)
│       ├── checkbox.tsx                        # Checkbox (Client)
│       ├── radio-group.tsx                     # Radio group (Client)
│       ├── label.tsx                           # Form label (Server-safe)
│       ├── tooltip.tsx                         # Tooltip (Client)
│       ├── popover.tsx                         # Popover (Client)
│       ├── dropdown-menu.tsx                   # Dropdown menu (Client)
│       ├── progress.tsx                        # Progress bar (Client)
│       ├── star-rating.tsx                     # Interactive/static stars (Client)
│       └── animated-counter.tsx               # Number count-up animation (Client)
│
├── lib/
│   ├── db.ts                                   # Prisma client singleton
│   ├── auth.ts                                 # Auth.js configuration
│   ├── cloudinary.ts                           # Cloudinary SDK config + helpers
│   ├── razorpay.ts                             # Razorpay client init
│   ├── validations/
│   │   ├── auth.ts                             # Zod schemas — login, register
│   │   ├── product.ts                          # Zod schemas — product create/update
│   │   ├── order.ts                            # Zod schemas — order creation
│   │   ├── address.ts                          # Zod schemas — address form
│   │   ├── review.ts                           # Zod schemas — review submission
│   │   └── coupon.ts                           # Zod schemas — coupon validation
│   ├── actions/
│   │   ├── auth.actions.ts                     # Server actions — login, register, logout
│   │   ├── cart.actions.ts                     # Server actions — add, remove, update cart
│   │   ├── order.actions.ts                    # Server actions — create order, cancel
│   │   ├── product.actions.ts                  # Server actions — admin CRUD
│   │   ├── review.actions.ts                   # Server actions — submit review
│   │   ├── wishlist.actions.ts                 # Server actions — add/remove wishlist
│   │   ├── address.actions.ts                  # Server actions — manage addresses
│   │   ├── coupon.actions.ts                   # Server actions — validate coupon
│   │   ├── newsletter.actions.ts               # Server actions — subscribe
│   │   └── upload.actions.ts                   # Server actions — Cloudinary upload
│   ├── queries/
│   │   ├── products.ts                         # Prisma query helpers — products
│   │   ├── orders.ts                           # Prisma query helpers — orders
│   │   ├── users.ts                            # Prisma query helpers — users
│   │   ├── categories.ts                       # Prisma query helpers — categories
│   │   ├── reviews.ts                          # Prisma query helpers — reviews
│   │   └── analytics.ts                        # Prisma query helpers — aggregations
│   └── utils/
│       ├── cn.ts                               # clsx + tailwind-merge utility
│       ├── format.ts                           # Currency, date, string formatters
│       ├── seo.ts                              # Metadata builder helpers
│       ├── slug.ts                             # Slug generation utility
│       └── constants.ts                        # App-wide constants
│
├── hooks/
│   ├── use-cart.ts                             # Cart state + actions
│   ├── use-wishlist.ts                         # Wishlist toggle + optimistic UI
│   ├── use-search.ts                           # Debounced search + URL sync
│   ├── use-filters.ts                          # Filter state + URL serialization
│   ├── use-scroll.ts                           # Scroll position + direction
│   ├── use-intersection.ts                     # Intersection Observer wrapper
│   ├── use-media-query.ts                      # Responsive breakpoint hook
│   ├── use-local-storage.ts                    # Type-safe localStorage hook
│   ├── use-debounce.ts                         # Debounce value hook
│   ├── use-toast.ts                            # Toast trigger hook
│   └── use-optimistic-cart.ts                  # Optimistic UI for cart mutations
│
├── types/
│   ├── product.ts                              # Product, ProductVariant, ProductImage types
│   ├── order.ts                                # Order, OrderItem, OrderStatus types
│   ├── cart.ts                                 # Cart, CartItem types
│   ├── user.ts                                 # User, UserProfile types
│   ├── category.ts                             # Category, CategoryTree types
│   ├── review.ts                               # Review, ReviewSummary types
│   ├── address.ts                              # Address type
│   ├── coupon.ts                               # Coupon type
│   ├── api.ts                                  # API response wrapper types
│   └── next-auth.d.ts                          # Auth.js session type augmentation
│
├── config/
│   ├── site.ts                                 # Site metadata, nav links, social URLs
│   ├── navigation.ts                           # Nav structure, category tree
│   ├── shipping.ts                             # Shipping rules, free threshold
│   ├── payment.ts                              # Razorpay config, payment methods
│   ├── images.ts                               # Cloudinary transforms, presets
│   └── analytics.ts                            # Analytics event names (typed)
│
├── public/
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   ├── og-default.jpg                          # Default Open Graph image (1200x630)
│   ├── logo.svg                                # Brand logo SVG
│   ├── logo-white.svg                          # White variant for dark bg
│   ├── icons/                                  # SVG icon sprites
│   │   └── sprite.svg
│   └── images/
│       ├── hero-bg.webp                        # Hero background asset
│       └── empty-cart.svg                      # Empty state illustrations
│
├── prisma/
│   ├── schema.prisma                           # Full Prisma schema (see Section 2)
│   ├── seed.ts                                 # Database seed script
│   └── migrations/                             # Auto-generated migration files
│
├── middleware.ts                               # Auth + route protection middleware
├── next.config.ts                              # Next.js config (images, redirects)
├── tailwind.config.ts                          # Tailwind theme extension
├── tsconfig.json                               # TypeScript config
├── postcss.config.mjs                          # PostCSS config
├── .env                                        # Environment variables (gitignored)
├── .env.example                                # Example env template
└── package.json
```

---

# SECTION 2 — DATABASE SCHEMA

**File:** `prisma/schema.prisma`

```prisma
// ============================================================
// PRISMA SCHEMA — DROPSHIP PLATFORM
// ============================================================

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ============================================================
// ENUMS
// ============================================================

enum Role {
  USER
  ADMIN
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum PaymentMethod {
  RAZORPAY_CARD
  RAZORPAY_UPI
  RAZORPAY_NETBANKING
  RAZORPAY_WALLET
  COD
}

enum CouponType {
  PERCENTAGE
  FIXED_AMOUNT
  FREE_SHIPPING
}

// ============================================================
// USER
// ============================================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  password      String?                       // null for OAuth users
  role          Role      @default(USER)
  phone         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Auth.js relations
  accounts      Account[]
  sessions      Session[]

  // Domain relations
  orders        Order[]
  cart          Cart?
  reviews       Review[]
  wishlist      Wishlist?
  addresses     Address[]
  newsletter    Newsletter?

  @@index([email])
  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

model PasswordResetToken {
  id      String   @id @default(cuid())
  email   String
  token   String   @unique
  expires DateTime

  @@map("password_reset_tokens")
}

// ============================================================
// CATEGORY
// ============================================================

model Category {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String?    @db.Text
  image       String?
  icon        String?
  isActive    Boolean    @default(true)
  sortOrder   Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Self-relation for nested categories
  parentId    String?
  parent      Category?  @relation("CategoryChildren", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryChildren")

  products    Product[]

  @@index([slug])
  @@index([parentId])
  @@map("categories")
}

// ============================================================
// PRODUCT
// ============================================================

model Product {
  id                String    @id @default(cuid())
  name              String
  slug              String    @unique
  tagline           String?                         // Short punchy description
  description       String    @db.Text
  problemStatement  String?   @db.Text              // "Tired of X?" narrative
  solutionText      String?   @db.Text              // How this product solves it
  price             Decimal   @db.Decimal(10, 2)
  compareAtPrice    Decimal?  @db.Decimal(10, 2)    // Strikethrough price
  costPrice         Decimal?  @db.Decimal(10, 2)    // For margin calculation
  sku               String?   @unique
  stock             Int       @default(0)
  lowStockThreshold Int       @default(5)
  isActive          Boolean   @default(true)
  isFeatured        Boolean   @default(false)
  isTrending        Boolean   @default(false)
  isViral           Boolean   @default(false)
  weight            Decimal?  @db.Decimal(8, 3)     // kg, for shipping calc
  metaTitle         String?
  metaDescription   String?   @db.Text
  videoUrl          String?                          // YouTube/Cloudinary video
  sortOrder         Int       @default(0)
  salesCount        Int       @default(0)
  viewCount         Int       @default(0)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  categoryId  String
  category    Category  @relation(fields: [categoryId], references: [id])

  images      ProductImage[]
  benefits    ProductBenefit[]
  features    ProductFeature[]
  faqs        ProductFaq[]
  reviews     Review[]
  orderItems  OrderItem[]
  cartItems   CartItem[]
  wishlistItems WishlistItem[]
  tags        ProductTag[]

  @@index([slug])
  @@index([categoryId])
  @@index([isActive, isFeatured])
  @@index([isActive, isTrending])
  @@index([isActive, isViral])
  @@map("products")
}

model ProductImage {
  id         String   @id @default(cuid())
  productId  String
  url        String
  altText    String?
  width      Int?
  height     Int?
  sortOrder  Int      @default(0)
  isPrimary  Boolean  @default(false)
  createdAt  DateTime @default(now())

  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@map("product_images")
}

model ProductBenefit {
  id        String  @id @default(cuid())
  productId String
  icon      String                // Icon name (Lucide icon)
  title     String
  body      String?
  sortOrder Int     @default(0)

  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("product_benefits")
}

model ProductFeature {
  id        String  @id @default(cuid())
  productId String
  title     String
  body      String
  sortOrder Int     @default(0)

  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("product_features")
}

model ProductFaq {
  id        String  @id @default(cuid())
  productId String
  question  String
  answer    String  @db.Text
  sortOrder Int     @default(0)

  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("product_faqs")
}

model ProductTag {
  id        String  @id @default(cuid())
  productId String
  tag       String

  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([tag])
  @@map("product_tags")
}

// ============================================================
// ORDER
// ============================================================

model Order {
  id              String        @id @default(cuid())
  orderNumber     String        @unique                 // Human-readable: ORD-20240101-XXXX
  userId          String
  status          OrderStatus   @default(PENDING)
  paymentStatus   PaymentStatus @default(PENDING)
  paymentMethod   PaymentMethod?
  subtotal        Decimal       @db.Decimal(10, 2)
  shippingAmount  Decimal       @db.Decimal(10, 2)      @default(0)
  discountAmount  Decimal       @db.Decimal(10, 2)      @default(0)
  taxAmount       Decimal       @db.Decimal(10, 2)      @default(0)
  total           Decimal       @db.Decimal(10, 2)
  couponCode      String?
  notes           String?       @db.Text

  // Payment gateway fields
  razorpayOrderId   String?   @unique
  razorpayPaymentId String?   @unique
  razorpaySignature String?

  // Shipping
  trackingNumber    String?
  shippingCarrier   String?
  estimatedDelivery DateTime?
  deliveredAt       DateTime?

  // Snapshot of address at time of order (denormalized for immutability)
  shippingName      String
  shippingPhone     String
  shippingLine1     String
  shippingLine2     String?
  shippingCity      String
  shippingState     String
  shippingPostcode  String
  shippingCountry   String    @default("IN")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User        @relation(fields: [userId], references: [id])
  items     OrderItem[]
  coupon    Coupon?     @relation(fields: [couponCode], references: [code])

  @@index([userId])
  @@index([orderNumber])
  @@index([status])
  @@index([createdAt])
  @@map("orders")
}

model OrderItem {
  id         String  @id @default(cuid())
  orderId    String
  productId  String

  // Snapshot of product at time of order
  name       String
  image      String
  price      Decimal @db.Decimal(10, 2)
  quantity   Int
  total      Decimal @db.Decimal(10, 2)

  order      Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product    Product @relation(fields: [productId], references: [id])

  @@index([orderId])
  @@index([productId])
  @@map("order_items")
}

// ============================================================
// CART
// ============================================================

model Cart {
  id        String     @id @default(cuid())
  userId    String     @unique
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]

  @@map("carts")
}

model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  productId String
  quantity  Int      @default(1)
  addedAt   DateTime @default(now())

  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id])

  @@unique([cartId, productId])
  @@index([cartId])
  @@map("cart_items")
}

// ============================================================
// WISHLIST
// ============================================================

model Wishlist {
  id        String         @id @default(cuid())
  userId    String         @unique
  createdAt DateTime       @default(now())

  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     WishlistItem[]

  @@map("wishlists")
}

model WishlistItem {
  id         String   @id @default(cuid())
  wishlistId String
  productId  String
  addedAt    DateTime @default(now())

  wishlist   Wishlist @relation(fields: [wishlistId], references: [id], onDelete: Cascade)
  product    Product  @relation(fields: [productId], references: [id])

  @@unique([wishlistId, productId])
  @@map("wishlist_items")
}

// ============================================================
// REVIEW
// ============================================================

model Review {
  id         String   @id @default(cuid())
  userId     String
  productId  String
  rating     Int                            // 1–5
  title      String?
  body       String?  @db.Text
  isVerified Boolean  @default(false)       // Verified purchase
  isApproved Boolean  @default(false)       // Admin approval gate
  helpfulCount Int    @default(0)
  images     String[]                       // Cloudinary URLs array
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user       User     @relation(fields: [userId], references: [id])
  product    Product  @relation(fields: [productId], references: [id])

  @@unique([userId, productId])
  @@index([productId, isApproved])
  @@map("reviews")
}

// ============================================================
// ADDRESS
// ============================================================

model Address {
  id         String   @id @default(cuid())
  userId     String
  label      String?                        // "Home", "Work", "Other"
  name       String
  phone      String
  line1      String
  line2      String?
  city       String
  state      String
  postcode   String
  country    String   @default("IN")
  isDefault  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("addresses")
}

// ============================================================
// COUPON
// ============================================================

model Coupon {
  id               String     @id @default(cuid())
  code             String     @unique
  type             CouponType
  value            Decimal    @db.Decimal(10, 2)      // % or fixed INR
  minOrderAmount   Decimal?   @db.Decimal(10, 2)
  maxDiscount      Decimal?   @db.Decimal(10, 2)      // Cap for percentage coupons
  usageLimit       Int?                                // Total uses allowed
  usageCount       Int        @default(0)
  perUserLimit     Int        @default(1)
  isActive         Boolean    @default(true)
  expiresAt        DateTime?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  orders           Order[]

  @@index([code])
  @@map("coupons")
}

// ============================================================
// NEWSLETTER
// ============================================================

model Newsletter {
  id           String   @id @default(cuid())
  email        String   @unique
  userId       String?  @unique
  isSubscribed Boolean  @default(true)
  subscribedAt DateTime @default(now())
  source       String?                   // "footer", "popup", "checkout"

  user         User?    @relation(fields: [userId], references: [id])

  @@index([email])
  @@map("newsletter")
}
```

---

# SECTION 3 — ROUTING STRUCTURE

| Route | Segment Type | Render Strategy | Purpose | Key Data |
|---|---|---|---|---|
| `/` | Page | ISR (3600s) | Homepage — hero, trending, viral | Featured products, trending, reviews |
| `/products` | Page | SSR (dynamic) | Full product catalog with filters | Products (filtered/sorted), categories |
| `/products/[slug]` | Dynamic Page | ISR (1800s) | Product detail page | Product, reviews, related |
| `/category/[slug]` | Dynamic Page | ISR (3600s) | Category product listing | Category, products |
| `/search` | Page | SSR (no-cache) | Full-text product search results | Search query, results |
| `/cart` | Page | CSR (client) | Cart contents and summary | Cart items from client state |
| `/checkout` | Page | CSR (auth-required) | Shipping address entry | User addresses, cart items |
| `/checkout/payment` | Page | CSR (auth-required) | Payment processing | Order draft, Razorpay intent |
| `/checkout/success` | Page | SSR (dynamic) | Post-payment confirmation | Order by ID |
| `/orders` | Page | SSR (auth-required) | Order history list | User orders paginated |
| `/orders/[id]` | Dynamic Page | SSR (auth-required) | Single order detail | Order with items, tracking |
| `/account` | Page | SSR (auth-required) | Account dashboard | User profile, stats |
| `/account/profile` | Page | CSR (auth-required) | Profile edit form | Session user data |
| `/account/addresses` | Page | SSR (auth-required) | Address book | User addresses |
| `/account/wishlist` | Page | SSR (auth-required) | Wishlist grid | Wishlist items with product data |
| `/auth/login` | Page | CSR | Login form | — (redirect if authed) |
| `/auth/register` | Page | CSR | Registration form | — (redirect if authed) |
| `/auth/forgot-password` | Page | CSR | Password reset request | — |
| `/auth/reset-password` | Page | CSR | New password via token | Token from URL param |
| `/auth/verify` | Page | SSR | Email verification | Token from URL param |
| `/admin` | Page | SSR (admin-only) | Admin dashboard | Revenue, order stats, chart data |
| `/admin/products` | Page | SSR (admin-only) | Product management table | All products paginated |
| `/admin/products/new` | Page | CSR (admin-only) | Create product | Categories list |
| `/admin/products/[id]` | Page | CSR (admin-only) | Edit product | Product full data |
| `/admin/orders` | Page | SSR (admin-only) | Order management table | All orders paginated |
| `/admin/orders/[id]` | Page | SSR (admin-only) | Order detail + status | Order full data |
| `/admin/customers` | Page | SSR (admin-only) | Customer table | Users paginated |
| `/admin/categories` | Page | SSR (admin-only) | Category management | All categories |
| `/admin/coupons` | Page | SSR (admin-only) | Coupon management | All coupons |
| `/admin/analytics` | Page | SSR + CSR (admin-only) | Analytics with charts | Aggregated DB data |
| `/admin/newsletter` | Page | SSR (admin-only) | Newsletter subscribers | Newsletter table |
| `/about` | Page | SSG (static) | Brand story | — (static content) |
| `/contact` | Page | SSR | Contact form | — |

### Route Protection — `middleware.ts`

```
Protected (auth required):      /cart, /checkout/*, /orders/*, /account/*
Protected (admin only):         /admin/*
Auth pages (redirect if authed): /auth/login, /auth/register
Public:                         everything else
```

### `generateStaticParams` Targets

- `/products/[slug]` — pre-render top 100 products by salesCount at build time
- `/category/[slug]` — pre-render all active categories at build time

---

# SECTION 4 — COMPONENT HIERARCHY

## 4.1 Layout Components

### `components/layout/root-layout.tsx`
- Type: Server Component (wraps Client providers)
- Props: `{ children: React.ReactNode }`
- Renders: `<html lang="en">`, body with font CSS vars, `<Providers>` (wraps Auth session, cart store, toast), `<Toaster />`
- Key behavior: Sets background color `#0A0A0A`, injects CSS custom properties for design tokens

### `components/layout/navbar.tsx`
- Type: Client Component
- Props: none (reads session via `useSession`)
- Key behaviors:
  - Glassmorphism: `backdrop-blur-xl bg-black/40 border-b border-white/5`
  - Transitions from transparent at top to frosted on scroll (uses `use-scroll.ts`)
  - Contains: `<NavLogo>`, `<NavLinks>`, `<NavSearch>`, `<NavCartButton>`, `<NavUserMenu>`
  - Mobile: hides links, shows hamburger → `<NavbarMobile>` drawer

### `components/layout/footer.tsx`
- Type: Server Component
- Props: none
- Sections: Brand col (logo + tagline + socials), Quick Links, Categories, Support, Newsletter mini-form
- Key behavior: Static render, minimal JS, links use `<Link>` from next/navigation

### `components/layout/admin-sidebar.tsx`
- Type: Client Component
- Props: none
- Key behaviors: Collapsible to icon-only mode, active route highlighting, admin-specific nav items

## 4.2 Navigation Components

### `components/navigation/nav-search.tsx`
- Type: Client Component
- Props: none
- Key behaviors:
  - Click opens `<Popover>` with search input + instant results (debounced 300ms)
  - Keyboard shortcut: `Cmd+K` / `Ctrl+K`
  - Shows: recent searches (localStorage), live product suggestions (API call)
  - Enter navigates to `/search?q=`

### `components/navigation/nav-cart-button.tsx`
- Type: Client Component
- Props: none
- Key behaviors:
  - Reads cart item count from `use-cart` store
  - Animated count badge: springs in when count changes (Framer Motion)
  - Click opens `<CartSheet>` drawer

### `components/navigation/nav-user-menu.tsx`
- Type: Client Component
- Props: none
- Key behaviors:
  - Unauthenticated: "Sign In" button
  - Authenticated: avatar dropdown with links to Account, Orders, Wishlist, Logout

### `components/navigation/mega-menu.tsx`
- Type: Client Component
- Props: `{ categories: Category[] }`
- Key behaviors:
  - Hover on "Categories" link reveals full-width panel
  - Animated with Framer Motion `AnimatePresence`
  - Grid of category cards with image + name

## 4.3 Hero Components

### `components/home/hero-section.tsx`
- Type: Client Component
- Props: `{ featuredProduct: Product }`
- Layout: Two-column (60/40 split on desktop), stacked on mobile
- Key behaviors:
  - Left: animated headline, subtext, dual CTA buttons
  - Right: floating product image with rotation + parallax on scroll
  - Background: radial gradient glow behind product (blue, `#2563EB` at 20% opacity)
  - Entry animation: left content slides in from left, product from right (staggered 0.2s)

### `components/home/hero-headline.tsx`
- Type: Client Component
- Props: `{ words: string[] }`
- Key behaviors:
  - Rotating word animation (cycles through trending product categories)
  - Uses Framer Motion `AnimatePresence` with vertical flip exit/enter

### `components/home/hero-cta.tsx`
- Type: Client Component
- Props: `{ primaryHref: string; secondaryHref: string }`
- Key behaviors:
  - Primary button: solid blue with shimmer sweep on hover
  - Secondary button: ghost with animated underline

## 4.4 Product Components

### `components/products/product-card.tsx`
- Type: Server Component (static data shell)
- Props:
  ```
  {
    id: string
    name: string
    slug: string
    price: number
    compareAtPrice?: number
    primaryImage: string
    rating?: number
    reviewCount?: number
    isTrending?: boolean
    isNew?: boolean
    badge?: string
  }
  ```
- Renders: card shell, image (next/image), price, rating, badge
- Passes to `<ProductCardClient>` for interactive behaviors

### `components/products/product-card-client.tsx`
- Type: Client Component
- Props: `{ productId: string; slug: string; hoverImageUrl?: string }`
- Key behaviors:
  - Hover: crossfades to second product image (300ms ease)
  - Wishlist heart button: appears on hover, toggles with optimistic UI
  - Quick-add button: slides up from bottom on hover
  - Card scale: `scale(1.02)` on hover (Framer Motion spring)

### `components/products/product-filters.tsx`
- Type: Client Component
- Props: `{ categories: Category[]; priceRange: [min, max] }`
- Key behaviors:
  - All filter state lives in URL search params (shareable)
  - Category checkboxes, price range slider, rating filter, in-stock toggle
  - Mobile: renders inside a `<Sheet>` drawer triggered by filter button
  - Uses `use-filters.ts` hook for URL serialization

### `components/home/trending-carousel.tsx`
- Type: Client Component
- Props: `{ products: Product[] }`
- Key behaviors:
  - Horizontal drag-to-scroll (Framer Motion `drag="x"`)
  - Navigation arrows appear on desktop hover
  - Auto-scrolls every 4s, pauses on hover/touch
  - Snap scrolling with CSS `scroll-snap-type: x mandatory`

## 4.5 PDP Components

### `components/pdp/pdp-gallery.tsx`
- Type: Client Component
- Props: `{ images: ProductImage[]; videoUrl?: string }`
- Key behaviors:
  - Large main image with click-to-zoom (lightbox via `<Dialog>`)
  - Swipe gesture support on mobile (Framer Motion drag)
  - Smooth crossfade between images (opacity transition 200ms)
  - Video thumbnail triggers inline video player

### `components/pdp/pdp-purchase-box.tsx`
- Type: Client Component
- Props: `{ product: Product; stock: number }`
- Key behaviors:
  - Quantity stepper (+/- buttons with min=1)
  - "Add to Cart" button with loading + success state animation
  - Shows low-stock warning when `stock <= lowStockThreshold`
  - One-click wishlist toggle
  - Sticky behavior hands off to `<PdpStickyBar>` on scroll past

### `components/pdp/pdp-sticky-bar.tsx`
- Type: Client Component
- Props: `{ product: Product }`
- Key behaviors:
  - Hidden until user scrolls past purchase box (`use-intersection.ts`)
  - Slides in from bottom (`translateY` 100% → 0, 300ms ease-out)
  - Contains: mini product name, price, compact "Add to Cart"

### `components/pdp/pdp-reviews.tsx`
- Type: Client Component
- Props: `{ productId: string; summary: ReviewSummary }`
- Key behaviors:
  - Rating summary bar (breakdown of 5→1 stars as filled bars)
  - Review list with filter tabs (Most Recent, Most Helpful, Verified)
  - Load more pagination (client-side fetch)
  - Inline review submission form for authenticated users

## 4.6 Cart / Checkout Components

### `components/cart/cart-sheet.tsx`
- Type: Client Component
- Props: controlled by global cart store
- Key behaviors:
  - Right-side slide-over drawer (Framer Motion `x` animation)
  - Backdrop blur overlay
  - Header: "Your Cart (N items)", close button
  - Body: `<CartItem>` list, scrollable
  - Footer: `<CartSummary>` + "Checkout" CTA + `<CartUpsell>`
  - Empty state: illustration + "Start Shopping" CTA

### `components/checkout/payment-form.tsx`
- Type: Client Component
- Props: `{ orderId: string; amount: number; currency: string }`
- Key behaviors:
  - Initializes Razorpay checkout via Razorpay.js SDK
  - Opens Razorpay modal on button click
  - Handles `payment.success` / `payment.failed` callbacks
  - On success: calls server action to verify signature, redirect to `/checkout/success`

## 4.7 Admin Components

### `components/admin/data-table.tsx`
- Type: Client Component
- Props:
  ```
  {
    data: T[]
    columns: ColumnDef<T>[]
    searchKey?: string
    pagination?: PaginationState
    onPaginationChange?: (state: PaginationState) => void
  }
  ```
- Key behaviors:
  - Built on TanStack Table v8
  - Column sorting, global search filter
  - Row selection with bulk actions
  - Pagination controls

### `components/admin/product-form.tsx`
- Type: Client Component
- Props: `{ product?: Product; categories: Category[] }`
- Key behaviors:
  - React Hook Form + Zod validation
  - Multi-image upload via `<ImageUploader>`
  - Rich text for description (simple textarea, no heavy editor)
  - Dynamic benefit/feature/FAQ list (add/remove rows)
  - Auto-slug generation from name with manual override

## 4.8 Shared UI Components

### `components/ui/button.tsx`
- Variants: `default` (solid blue), `outline`, `ghost`, `destructive`, `shimmer`
- Sizes: `sm`, `md`, `lg`, `icon`
- Always passes `disabled` + `aria-disabled` states
- `shimmer` variant: CSS keyframe sweep animation overlay

### `components/ui/skeleton.tsx`
- Variants: `text`, `card`, `avatar`, `image`
- Animation: `animate-pulse` with color `#1A1A1A` → `#222222`

### `components/ui/star-rating.tsx`
- Props: `{ value: number; max?: 5; interactive?: boolean; size?: 'sm' | 'md' | 'lg' }`
- Interactive mode: hover preview + click to set rating
- Fractional star support for display (half-star via clip-path)

---

# SECTION 5 — DESIGN SYSTEM

## 5.1 Typography

| Token | Font | Size (rem) | Weight | Line Height | Use |
|---|---|---|---|---|---|
| `display-2xl` | Inter | 4.5rem / 72px | 800 | 1.1 | Hero headline |
| `display-xl` | Inter | 3.75rem / 60px | 800 | 1.1 | Section hero headings |
| `display-lg` | Inter | 3rem / 48px | 700 | 1.15 | Page H1 |
| `display-md` | Inter | 2.25rem / 36px | 700 | 1.2 | Section headings |
| `display-sm` | Inter | 1.875rem / 30px | 600 | 1.25 | Sub-section headings |
| `text-xl` | Inter | 1.25rem / 20px | 500 | 1.5 | Lead paragraphs |
| `text-lg` | Inter | 1.125rem / 18px | 400 | 1.6 | Body large |
| `text-md` | Inter | 1rem / 16px | 400 | 1.6 | Body default |
| `text-sm` | Inter | 0.875rem / 14px | 400 | 1.5 | Captions, labels |
| `text-xs` | Inter | 0.75rem / 12px | 400 | 1.4 | Badges, meta |
| `mono` | JetBrains Mono | 0.875rem / 14px | 400 | 1.6 | Order numbers, codes |

**Font stack:** `Inter` (variable font, weight 100–900), fallback: `system-ui, -apple-system, sans-serif`
**Loading strategy:** `next/font/google` with `display: swap`, subset: `latin`

## 5.2 Color Tokens

```
/* Brand Core */
--color-background:        #0A0A0A   /* Page background */
--color-surface:           #111111   /* Cards, panels */
--color-surface-raised:    #161616   /* Elevated cards, modals */
--color-surface-overlay:   #1A1A1A   /* Hover states on surface */
--color-border:            #1F1F1F   /* Default borders */
--color-border-subtle:     #161616   /* Subtle dividers */
--color-border-emphasis:   #2D2D2D   /* Emphasized borders */

/* Primary — Blue */
--color-primary:           #2563EB
--color-primary-hover:     #1D4ED8
--color-primary-active:    #1E40AF
--color-primary-subtle:    rgba(37, 99, 235, 0.12)
--color-primary-glow:      rgba(37, 99, 235, 0.25)

/* Text */
--color-text-primary:      #FFFFFF
--color-text-secondary:    #9CA3AF
--color-text-tertiary:     #6B7280
--color-text-disabled:     #374151
--color-text-inverse:      #0A0A0A

/* Semantic */
--color-success:           #10B981
--color-success-subtle:    rgba(16, 185, 129, 0.12)
--color-warning:           #F59E0B
--color-warning-subtle:    rgba(245, 158, 11, 0.12)
--color-error:             #EF4444
--color-error-subtle:      rgba(239, 68, 68, 0.12)
--color-info:              #3B82F6
--color-info-subtle:       rgba(59, 130, 246, 0.12)

/* Rating */
--color-star:              #FBBF24

/* Gradients */
--gradient-hero:           radial-gradient(ellipse at 60% 50%, rgba(37,99,235,0.15) 0%, transparent 70%)
--gradient-card-shine:     linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)
--gradient-text-blue:      linear-gradient(135deg, #FFFFFF 0%, #93C5FD 100%)
```

## 5.3 Spacing Scale

Tailwind's default 4px base scale extended:

| Token | Value | px equiv |
|---|---|---|
| `space-0` | 0 | 0 |
| `space-0.5` | 0.125rem | 2px |
| `space-1` | 0.25rem | 4px |
| `space-2` | 0.5rem | 8px |
| `space-3` | 0.75rem | 12px |
| `space-4` | 1rem | 16px |
| `space-5` | 1.25rem | 20px |
| `space-6` | 1.5rem | 24px |
| `space-8` | 2rem | 32px |
| `space-10` | 2.5rem | 40px |
| `space-12` | 3rem | 48px |
| `space-16` | 4rem | 64px |
| `space-20` | 5rem | 80px |
| `space-24` | 6rem | 96px |
| `space-32` | 8rem | 128px |

Section vertical rhythm: `pt-24 pb-24` (96px top/bottom) on desktop, `pt-16 pb-16` on mobile.

## 5.4 Border Radius Tokens

```
--radius-none:    0
--radius-sm:      4px    (subtle rounding — inputs, tags)
--radius-md:      8px    (cards, buttons)
--radius-lg:      12px   (modals, dropdowns)
--radius-xl:      16px   (large cards)
--radius-2xl:     24px   (hero elements)
--radius-full:    9999px (pills, avatars, badges)
```

Product cards: `--radius-xl` (16px)
Buttons: `--radius-md` (8px)
Modals: `--radius-xl` (16px)

## 5.5 Shadow Tokens

```
--shadow-sm:      0 1px 2px rgba(0,0,0,0.4)
--shadow-md:      0 4px 12px rgba(0,0,0,0.5)
--shadow-lg:      0 8px 24px rgba(0,0,0,0.6)
--shadow-xl:      0 16px 48px rgba(0,0,0,0.7)
--shadow-2xl:     0 24px 64px rgba(0,0,0,0.8)
--shadow-glow-blue: 0 0 40px rgba(37,99,235,0.3)
--shadow-glow-sm:   0 0 16px rgba(37,99,235,0.2)
--shadow-card:    0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.4)
```

## 5.6 Animation Tokens

```
/* Durations */
--duration-instant:   75ms
--duration-fast:      150ms
--duration-normal:    250ms
--duration-slow:      400ms
--duration-xslow:     600ms
--duration-lazy:      1000ms

/* Easings */
--ease-default:       cubic-bezier(0.16, 1, 0.3, 1)      /* spring-like */
--ease-out:           cubic-bezier(0.0, 0.0, 0.2, 1)     /* material decelerate */
--ease-in:            cubic-bezier(0.4, 0.0, 1, 1)        /* material accelerate */
--ease-in-out:        cubic-bezier(0.4, 0.0, 0.2, 1)     /* material standard */
--ease-bounce:        cubic-bezier(0.34, 1.56, 0.64, 1)  /* overshoot */
--ease-linear:        linear

/* Framer Motion spring presets */
spring-gentle:  { stiffness: 100, damping: 20, mass: 1 }
spring-snappy:  { stiffness: 300, damping: 30, mass: 1 }
spring-bouncy:  { stiffness: 400, damping: 17, mass: 1 }
```

## 5.7 Z-Index Scale

```
--z-below:        -1    (background decorative elements)
--z-base:          0
--z-raised:       10    (cards on hover)
--z-dropdown:    100    (dropdowns, tooltips)
--z-sticky:      200    (sticky nav, sticky purchase bar)
--z-overlay:     300    (modal backdrops, drawer backdrops)
--z-modal:       400    (modals, drawers)
--z-toast:       500    (toast notifications)
--z-max:         9999   (critical overlays)
```

## 5.8 Breakpoints

```
xs:  375px   (small phones)
sm:  640px   (large phones / small tablets)
md:  768px   (tablets)
lg:  1024px  (laptops)
xl:  1280px  (desktops)
2xl: 1536px  (large monitors)
```

Content max-width: `1280px` with `px-4 sm:px-6 lg:px-8` horizontal padding.

---

# SECTION 6 — UI/UX SYSTEM

## 6.1 Micro-Interaction Patterns

### Button Interactions
- **Default → Hover:** Background lightens, `translateY(-1px)`, shadow increases — 150ms ease-out
- **Hover → Active (pressed):** `translateY(0)`, shadow resets, slight darken — 75ms ease-in
- **Disabled:** 40% opacity, `cursor-not-allowed`, no transform
- **Loading state:** text replaced by `<Spinner>`, button width locked (no layout shift), disabled

### Card Interactions
- **Hover:** `scale(1.01)`, `translateY(-4px)`, shadow upgrades to `--shadow-xl` — 300ms spring
- **Image hover:** secondary image crossfades in 300ms (opacity transition)
- **Wishlist button:** heart icon appears at top-right on hover, scale bounce on toggle

### Link Interactions
- **Nav links:** underline slides in from left (CSS clip-path animation) 200ms
- **Category chips:** background fill sweeps left-to-right 200ms
- **Footer links:** color brightens from `--color-text-secondary` to `--color-text-primary` 150ms

### Form Interactions
- **Input focus:** border color shifts to `--color-primary`, subtle glow appears 200ms
- **Input error:** border turns `--color-error`, shake animation (3 cycles, 300ms)
- **Input success:** border turns `--color-success`, check icon fades in
- **Submit loading:** button morphs to spinner, form fields fade to 60% opacity

## 6.2 Loading States — Skeleton Specs

### Product Card Skeleton
```
Card (--radius-xl, bg: #111111):
  Image area: full width, 280px height, pulse animation, bg: #1A1A1A
  Content padding: 16px
    Title line 1: 100% width, 16px height, bg: #1A1A1A
    Title line 2: 60% width, 16px height, bg: #1A1A1A (gap: 8px)
    Price line:   40% width, 20px height, bg: #1A1A1A (gap: 12px)
    Stars:        80px width, 12px height, bg: #1A1A1A (gap: 8px)
```

### Product Grid Skeleton
- 12 product card skeletons in responsive grid
- Staggered reveal animation when real data loads (items appear left-to-right, top-to-bottom at 50ms intervals)

### PDP Skeleton
```
Left column: 
  Main image: 600x600 skeleton
  4 thumb images: 80x80 each
Right column:
  Category badge: 60px wide skeleton
  Title: 3 lines (100%, 80%, 60%)
  Price: 120px wide
  Stars: 100px wide
  Description: 5 lines full width
  Button: full width, 48px height
```

### Page-Level Loading (`loading.tsx`)
- Renders a shell that matches final layout dimensions to prevent layout shift
- Opacity: 0.6, filter: blur(4px) on initial render, both clear as content arrives

## 6.3 Hover Effect Catalog

| Component | Hover Effect | Duration | Easing |
|---|---|---|---|
| Product card | Lift + scale + image swap | 300ms | spring-gentle |
| Button (primary) | Brightness+10%, lift 1px | 150ms | ease-out |
| Button (ghost) | Background fill sweep | 200ms | ease-out |
| Nav links | Underline slide in | 200ms | ease-out |
| Category pill | Background fill | 200ms | ease-out |
| Footer links | Color brighten | 150ms | ease-out |
| Admin table row | Background lighten | 100ms | ease-out |
| Wishlist heart | Scale 1.2, color fill | 200ms | spring-bouncy |
| Social share button | Scale 1.05, color shift | 150ms | ease-out |
| Review card | Border color shift | 200ms | ease-out |
| Gallery thumbnail | Border glow | 150ms | ease-out |

## 6.4 Transition Patterns

### Page Transitions
- Route changes: content area fades out (150ms) then new page fades in (250ms)
- Implemented via `layout.tsx` with Framer Motion `AnimatePresence` on route key

### Panel Transitions
- Cart drawer: slides in from right, `x: '100%' → 0`, 400ms spring-snappy
- Mobile nav drawer: slides in from left, `x: '-100%' → 0`, 400ms spring-snappy
- Mega menu: fades in + `y: -8px → 0`, 250ms ease-out
- Modal: scale in from 95% + fade, 250ms ease-out; backdrop fades 200ms

### Scroll-Triggered Animations
- Sections animate in on first viewport entry (Intersection Observer)
- Default: `y: 40px → 0, opacity: 0 → 1`, 600ms ease-out
- Stagger children: 80ms delay per child
- Trigger threshold: 10% of element visible

## 6.5 Empty State Designs

### Empty Cart
- SVG illustration: stylized shopping bag with sparkles (blue accent)
- Headline: "Your cart is empty"
- Subtext: "Discover trending products that everyone's talking about"
- CTA: "Browse Products" (primary button)

### Empty Wishlist
- SVG illustration: outlined heart
- Headline: "Nothing saved yet"
- Subtext: "Heart items you love to save them here"
- CTA: "Explore Products" (primary button)

### No Search Results
- SVG illustration: search icon with question mark
- Headline: `No results for "{query}"`
- Subtext: "Try different keywords or browse our categories"
- Below: category pills for quick navigation

### Empty Orders
- SVG illustration: package with clock
- Headline: "No orders yet"
- Subtext: "Your first order is just a few clicks away"
- CTA: "Shop Now" (primary button)

## 6.6 Error State Designs

### Form Field Errors
- Red border + red text helper below field
- Icon: `AlertCircle` (Lucide) 14px in red at right of input

### Page-Level Error (`error.tsx`)
- Centered layout: error code (500/404), headline, friendly message
- "Try Again" button (triggers `reset()`) + "Go Home" link
- Background: `#0A0A0A` with subtle red glow at top

### API/Network Error
- Toast notification: red background, icon, "Something went wrong. Please try again."
- Inline error in forms: red alert box above form submit button

## 6.7 Toast / Notification System

**Library:** shadcn/ui `<Sonner>` (wraps Sonner toast)

**Toast variants:**
```
success:  bg: rgba(16,185,129,0.1), border: --color-success, icon: CheckCircle2
error:    bg: rgba(239,68,68,0.1),  border: --color-error,   icon: XCircle
warning:  bg: rgba(245,158,11,0.1), border: --color-warning, icon: AlertTriangle
info:     bg: rgba(59,130,246,0.1), border: --color-info,    icon: Info
```

**Position:** Bottom-right on desktop, bottom-center on mobile
**Duration:** 4000ms default, 6000ms for errors, ∞ for critical actions (with dismiss button)
**Entry animation:** slides up from bottom + fade in

**Common toast triggers:**
- Cart add: success "Added to cart"
- Cart remove: neutral "Removed from cart" with undo action
- Wishlist add: success "Saved to wishlist ❤"
- Order placed: success "Order confirmed! #ORD-XXXX"
- Auth error: error "Invalid credentials"
- Coupon applied: success "Coupon applied — 15% off!"

## 6.8 Modal Patterns

**Foundation:** shadcn `<Dialog>` (Radix Dialog primitive)

**Specs:**
- Max width: `480px` (sm modals), `640px` (md), `800px` (lg / image lightbox)
- Background: `#161616`
- Border: `1px solid #1F1F1F`
- Border radius: `--radius-xl` (16px)
- Backdrop: `rgba(0,0,0,0.8)` with `backdrop-blur(8px)`
- Entry: scale `0.95 → 1` + opacity `0 → 1`, 250ms ease-out

**Modal variants:**
- Confirmation modal (delete, cancel order)
- Address form modal
- Image lightbox (full viewport, close on outside click)
- Auth prompt (sign-in required gate)

## 6.9 Drawer Patterns

**Foundation:** shadcn `<Sheet>` (Radix Dialog with side positioning)

**Cart drawer (right side):**
- Width: `min(440px, 100vw)`
- Full height
- Header: sticky, frosted
- Body: scrollable
- Footer: sticky

**Mobile filter drawer (bottom):**
- Height: `85vh`
- Handle bar at top
- Drag-to-dismiss

---

# SECTION 7 — HOMEPAGE IMPLEMENTATION PLAN

## 7.1 Navigation (Glassmorphism)

**Layout:**
- Fixed top, full width, height: `64px`
- Content max-width: `1280px`, centered

**Visual spec:**
```
Initial (at top):     background: transparent, border: transparent
After 50px scroll:    background: rgba(10,10,10,0.8), border-bottom: 1px solid rgba(255,255,255,0.06)
                      backdrop-filter: blur(20px) saturate(180%)
Transition:           all 300ms ease-out
```

**Left:** Logo (24px height SVG)
**Center:** Navigation links: Home, Products, Categories (triggers mega-menu), Sale
**Right:** Search icon, Wishlist icon (auth-only), Cart button with badge, User menu

**Animation plan:**
- Initial page load: nav slides down from `-64px`, opacity 0→1, 400ms ease-out, 200ms delay

**Data source:** Static (nav items from `config/navigation.ts`)

**Performance:** Rendered as Client Component only for scroll behavior; nav links themselves are simple `<Link>` elements — no JS overhead for SEO

## 7.2 Hero Section

**Layout (desktop):**
```
Full viewport height (min: 700px)
Left column (55%):
  - Eyebrow text: small blue pill badge "Trending Now"
  - Headline: 2-3 lines, display-xl font, white gradient
  - Rotating word: swap between "Productivity", "Wellness", "Home", "Fitness"
  - Subtext: 20px, text-secondary, 2 lines max
  - CTA pair: "Shop Trending" (primary) + "Watch Video" (ghost with play icon)
  - Social proof strip: "⭐ 4.9 · 12,000+ happy customers · Free shipping over ₹499"
Right column (45%):
  - Floating product hero image (featured product or lifestyle shot)
  - Blue radial glow behind image
  - Floating stat cards: "🔥 2,341 sold this week", "⚡ Ships in 24h"
```

**Layout (mobile):** Stack vertically, image first (60vw centered), text below

**Animation plan:**
```
1. Eyebrow badge: fade in + y(20→0), delay 0ms
2. Headline line 1: fade in + y(30→0), delay 100ms
3. Headline line 2: fade in + y(30→0), delay 200ms
4. Rotating word: starts cycling after 600ms
5. Subtext: fade in + y(20→0), delay 300ms
6. CTA buttons: fade in + y(20→0), delay 400ms
7. Social proof: fade in, delay 500ms
8. Product image: fade in + x(60→0) + slight rotation(5°→0°), delay 200ms, spring-gentle
9. Floating cards: each with separate delay (600ms, 800ms)
10. Glow: pulses slowly, 3s ease-in-out infinite alternating opacity
```

**Data source:** Featured product from DB (ISR), hero content from `config/site.ts`

**Performance:**
- Background glow: CSS only (no canvas/WebGL)
- Product image: `priority` prop on `next/image`
- Hero text: static, no hydration needed (SSR rendered)
- Animations play only after `DOMContentLoaded` via Framer Motion `initial`/`animate`

## 7.3 Trending Products Carousel

**Layout:**
```
Section header:
  Left: "Trending Right Now" (display-md) + "What everyone's buying" (text-secondary)
  Right: "View All →" link

Carousel:
  Horizontal scroll container
  Shows: 1.2 cards mobile, 3 cards tablet, 4.2 cards desktop (partial peek = more)
  Card size: 280x380px (2:2.7 ratio)
  Gap: 16px
  Navigation arrows: appear on desktop, hidden on mobile
  Auto-scroll: every 4s, pauses on hover/touch interaction
  Progress dots: below carousel on mobile
```

**Animation plan:**
- Section entry: headline slides in from left, "View All" from right, 600ms ease-out
- Cards: stagger fade-in + `x(30→0)` as section enters viewport
- Carousel drag: Framer Motion `drag="x"` with momentum (`dragConstraints`, `dragElastic: 0.1`)

**Data source:** `products` where `isTrending = true`, ordered by `salesCount DESC`, limit 12
**Performance:** Server Component fetches data, passes to `<TrendingCarousel>` Client Component. Images: lazy loaded except first 4

## 7.4 Problem Solvers Section

**Concept:** "Products that actually solve problems" — bridges discovery with intent

**Layout:**
```
Dark card section (bg: #111111, full width)
Section heading: "Products that fix real problems"
Subtext: "Not just pretty things — things that actually work"

3-column grid (desktop), 1-column mobile:
  Each card:
    Problem headline: "Tired of [pain point]?" — bold, 20px
    Problem icon: red/orange icon top left
    Solution product: product image + name + price + "→ The Fix" CTA
    Card style: #161616 bg, blue left border accent, hover lifts
```

**Data source:** Products tagged with `problemSolvers` category or `featured` + `problemStatement` field populated

**Animation plan:**
- Cards animate in with stagger as section enters viewport
- Left border accent slides down from 0 to full height on hover

## 7.5 Viral Products Section

**Concept:** Social-proof driven — "Everyone's talking about these"

**Layout:**
```
Section heading: "Going Viral Right Now 🔥"
Subtext: "Seen on social media — loved by real people"

Masonry-style grid (desktop 3 cols, mobile 1 col):
  Each card — VIDEO-FIRST:
    - Auto-playing looping muted video (if videoUrl present)
    - Fallback to product image
    - Overlay: viral metric badge "2.1M views", "4.8 ⭐"
    - Bottom gradient overlay with product name + price
    - Play button icon center (for aesthetic)
    - Hover: video unmutes (optional), slight scale
```

**Data source:** Products where `isViral = true`, ordered by `viewCount DESC`, limit 6

**Animation plan:**
- Cards reveal with stagger, alternating sides (odd from left, even from right)
- Viral badges pulse gently (scale 1→1.05, 2s infinite)

**Performance:**
- Videos: `preload="none"` initially, `preload="metadata"` on hover, auto-play with `IntersectionObserver`
- Use Cloudinary for video hosting/transformation

## 7.6 Why Us Section

**Layout:**
```
Centered text block:
  Heading: "Why thousands choose us"
  Subtext: 1 sentence

4-column grid of value props:
  1. "Free Shipping over ₹499" — Truck icon, blue
  2. "30-Day Returns" — RefreshCcw icon, green
  3. "Genuine Products" — ShieldCheck icon, purple
  4. "24/7 Support" — Headphones icon, orange

Each item card:
  Icon in colored circle (12% opacity bg of accent color)
  Title: 600 weight, 18px
  Body: text-secondary, 14px
```

**Animation plan:**
- Icons: scale 0.8→1, 400ms spring-bouncy, stagger 100ms per card
- Cards: border animates on hover from transparent to accent color

## 7.7 Reviews Section

**Layout:**
```
Section heading: "Loved by 12,000+ customers"
Rating summary: "⭐ 4.9 out of 5"

Auto-scrolling marquee (two rows, opposite directions):
  Row 1: scrolls left, 30s loop
  Row 2: scrolls right, 30s loop (offset by 50%)
  Each review card:
    Avatar (Cloudinary or initials placeholder)
    Name + "Verified Purchase" badge
    Star rating
    Review text (max 3 lines, truncated)
    Product name (small, text-secondary)
  
Pause on hover (both rows stop)
```

**Data source:** Approved reviews (`isApproved = true`), pre-selected 20 best reviews (admin-curated or highest `helpfulCount`)

**Performance:**
- Pure CSS marquee animation (no JS) — `@keyframes scroll-left`, `animation-play-state: paused` on hover
- Reviews data: static at ISR build time

## 7.8 Newsletter Section

**Layout:**
```
Full-width section, bg gradient (blue glow behind dark card)
Card (max-width: 680px, centered):
  Badge: "Join the Community"
  Heading: "Get trending products in your inbox"
  Subtext: "Weekly drops, exclusive discounts, zero spam."
  Form: email input + "Subscribe" button (inline, full-width on mobile)
  Social proof: "4,200+ subscribers · Unsubscribe anytime"
```

**Interaction:**
- Submit: Server Action `newsletter.actions.ts > subscribe()`
- Loading: button shows spinner
- Success: form replaced with "🎉 You're in! Check your inbox." (Framer Motion height animation)
- Error: red toast

---

# SECTION 8 — PRODUCT DETAIL PAGE PLAN

## 8.1 Layout Architecture (Desktop)

```
Full page layout:
├── Breadcrumb (Server, SSR): Home › Category › Product Name
├── Main content (2-column, 55/45 split):
│   ├── Left column (sticky scroll):
│   │   ├── PdpGallery        — image gallery + video
│   │   └── PdpGalleryThumbs  — thumbnail strip
│   └── Right column:
│       ├── PdpInfo           — title, category, rating, price
│       ├── PdpPurchaseBox    — qty selector + add to cart + wishlist
│       └── PdpBenefits       — 3-4 icon benefits
├── PdpStickyBar (Client, fixed bottom, reveals on scroll)
├── Full-width sections (below fold):
│   ├── PdpProblemSolution    — story-driven narrative
│   ├── PdpFeatures           — detailed feature grid
│   ├── PdpReviews            — tabbed review section
│   ├── PdpFaq                — accordion FAQ
│   └── PdpRelatedProducts    — "You might also like" grid
```

## 8.2 Gallery Component Behavior

- **Primary image:** fills left column, aspect ratio `1:1`, rounded corners
- **Thumbnails:** horizontal strip below, 80x80px each, active has blue border
- **Navigation:** left/right arrow buttons on image (desktop), swipe gesture (mobile)
- **Zoom:** click/tap on main image opens lightbox modal (full viewport, `object-fit: contain`)
- **Video:** if `videoUrl` present, first thumbnail is a play icon overlay on image; click switches main area to `<PdpVideoPlayer>`
- **Video player:** embedded Cloudinary/YouTube player, 16:9 aspect ratio, autoplay=false

## 8.3 Purchase Box Behavior

```
Quantity stepper:
  [ − ]  [  2  ]  [ + ]
  (min: 1, max: min(stock, 10))
  Plus/minus animate the number (scale + opacity)

Stock indicator:
  > 10 in stock: no message
  2–10: "Only 7 left!" in orange
  1: "Last one!" in red
  0: "Out of Stock" — purchase box disabled, replaced with notify button

Primary CTA: "Add to Cart" (full width, 52px height)
  Loading: spinner replaces text, button locked
  Success: 400ms checkmark animation, button turns green briefly, reverts
  
Secondary CTA: "♡ Save to Wishlist" (ghost, smaller)

Trust signals below button:
  🚚 Free delivery on orders over ₹499
  ↩  30-day easy returns
  🔒 Secure checkout
```

## 8.4 Problem / Solution Section

**Layout:**
```
Two columns (50/50) with centered separator:
  Left (Problem):
    Background: dark warm tint (#1A0F0F)
    Large icon: face with X eyes
    Heading: "Tired of [problem]?" (red-toned text)
    Bullets: 3 pain points
  Right (Solution — THIS product):
    Background: dark cool tint (#0F1520)
    Large icon: green checkmark / product icon
    Heading: "Finally, [solution]" (blue-toned text)
    Bullets: 3 benefits
  
  Center: arrow or divider icon
```

## 8.5 Features Section

**Layout:** Alternating left/right rows (image + text)
```
Feature 1: image left, text right
Feature 2: text left, image right
Feature 3: image left, text right

Each row:
  Image: product detail shot or lifestyle (400x300)
  Text:
    Feature name (600 weight, 20px)
    Feature description (16px, text-secondary)
```

## 8.6 Reviews Section

**Rating summary card:**
```
Large number: "4.8" (display-md)
Stars: 5 stars filled proportionally
"Based on 847 reviews"

Rating breakdown bars:
  5 ★ ████████░░ 68%
  4 ★ █████░░░░░ 22%
  3 ★ ██░░░░░░░░  7%
  2 ★ █░░░░░░░░░  2%
  1 ★ █░░░░░░░░░  1%
```

**Review list:**
- Filter tabs: All, Verified, With Photos, Most Recent, Most Helpful
- Each review card: avatar, name, date, stars, title, body, images (if any)
- Pagination: "Load 10 more" button (client-side fetch)
- Review form: shown for authenticated users who purchased, hidden otherwise

## 8.7 Conversion Optimization Notes

- **Social proof above fold:** Review count + rating displayed in `<PdpInfo>` immediately
- **Urgency signals:** Low stock messages, "X people viewing this right now" (static/pseudo-real, configure as copy)
- **Trust badges:** Visible without scrolling (within purchase box)
- **Clear pricing:** Discount % badge next to strike-through price
- **Sticky bar:** Ensures CTA is never more than 0px away from user
- **Problem/Solution narrative:** Emotional connection before feature dump — mimics Apple product page structure
- **Video:** Dramatically increases conversion (auto-play, muted, in gallery)
- **FAQ:** Addresses objections before they become cart abandonment
- **Related products:** Keeps users on site if this product isn't right

## 8.8 Mobile Layout Differences

- Gallery: full-width, horizontal swipe between images (no thumbnails, replaced by dot indicators)
- Purchase box: moves below gallery (no side-by-side), sticky button at bottom of viewport
- Problem/Solution: stacks vertically (problem above, solution below)
- Features: single column, image above text
- Related products: horizontal scroll row (carousel)
- Sticky bar: fixed bottom bar, always visible on mobile (different from desktop scroll-triggered)

---

# SECTION 9 — PERFORMANCE STRATEGY

## 9.1 Core Web Vitals Targets

| Metric | Target | Strategy |
|---|---|---|
| LCP (Largest Contentful Paint) | < 1.8s | Priority hero image, ISR/SSG, Cloudinary CDN |
| INP (Interaction to Next Paint) | < 100ms | Minimal client JS, React transitions, debounced inputs |
| CLS (Cumulative Layout Shift) | < 0.05 | `next/image` width/height, skeleton loaders, font display swap |
| FCP (First Contentful Paint) | < 0.9s | Streaming SSR, no render-blocking resources |
| TTFB (Time to First Byte) | < 200ms | Vercel Edge Network, ISR cache hits |

## 9.2 Image Optimization Plan

**Tool:** `next/image` + Cloudinary

**Cloudinary transforms per context:**
```
Product card:       w_400,h_400,c_fill,q_auto,f_auto
PDP main image:     w_800,h_800,c_fill,q_auto,f_auto
PDP thumbnail:      w_160,h_160,c_fill,q_auto,f_auto
Hero image:         w_900,h_900,c_fill,q_80,f_auto
OG image:           w_1200,h_630,c_fill,q_80,f_jpg
Category image:     w_600,h_400,c_fill,q_auto,f_auto
Review image:       w_200,h_200,c_fill,q_auto,f_auto
```

**Loading strategy:**
- Hero image: `priority={true}` (preloaded in `<head>`)
- First 4 product cards: `priority={true}`, rest `loading="lazy"`
- PDP main image: `priority={true}`
- All others: `loading="lazy"` with explicit width/height to prevent CLS

**Placeholder:** `blurDataURL` generated at build via Cloudinary's `w_16,q_1` transform, base64 inlined

## 9.3 Code Splitting Strategy

- **Route-based splitting:** Automatic via App Router — each `page.tsx` is a split point
- **Component-level splitting:**
  - `dynamic(() => import('@/components/pdp/pdp-gallery'))` — heavy gallery (includes framer motion drag)
  - `dynamic(() => import('@/components/admin/revenue-chart'))` — chart libraries (recharts)
  - `dynamic(() => import('@/components/checkout/payment-form'))` — Razorpay SDK (only on checkout)
  - `dynamic(() => import('@/components/pdp/pdp-video-player'))` — video player (on demand)
- **Third-party scripts:** Razorpay.js loaded with `strategy="lazyOnload"` via `next/script`

## 9.4 Server Components vs Client Components Decision Matrix

| Component | Type | Reason |
|---|---|---|
| Page layouts | Server | Pure data/structure, no interactivity |
| Navigation bar | Client | Scroll events, user session |
| Product card (shell) | Server | Static data, SEO-critical |
| Product card (hover/wishlist) | Client | User interactions |
| Hero section | Client | Framer Motion animations |
| Trending carousel | Client | Drag gesture |
| Product filters | Client | URL state management |
| PDP gallery | Client | Swipe, zoom, image swap |
| PDP purchase box | Client | Cart state, quantity, stock |
| Review list | Client | Pagination, filter tabs |
| Cart sheet | Client | Global state reads |
| Admin charts | Client | Client-side chart rendering |
| Footer | Server | Static content |
| Breadcrumbs | Server | Static data |
| Product features | Server | Static product data |
| FAQ accordion | Client | Open/close state |
| Newsletter form | Client | Form state, submission |

## 9.5 Caching Strategy

### Full-Route Cache (ISR)
```
/                         revalidate: 3600   (1h)   — hero content, trending
/products/[slug]          revalidate: 1800   (30m)  — product details
/category/[slug]          revalidate: 3600   (1h)   — category listings
/about                    revalidate: 86400  (24h)  — static brand content
```

### Partial Caching (Partial Prerendering — Next.js 15 PPR)
- PDP: Product info + gallery = static shell (cached), Reviews + related = streamed dynamic
- Homepage: Hero = static, "Trending" = ISR, personalized elements = dynamic slot

### On-Demand Revalidation
- `POST /api/revalidate` endpoint (admin-triggered)
- Secret token validation
- Revalidates specific paths: `/products/[slug]`, `/category/[slug]`, `/`
- Triggered by: admin product save, order fulfillment, stock update

### Data Layer Cache (Prisma + Next.js `cache()`)
```typescript
// lib/queries/products.ts
export const getProductBySlug = cache(async (slug: string) => {
  return prisma.product.findUnique({ where: { slug } })
})
// Deduplicated within a single render cycle
```

### Vercel Edge Cache
- Static assets: `Cache-Control: public, max-age=31536000, immutable`
- API routes: `Cache-Control: no-store` (user-specific)
- ISR pages: Vercel serves from CDN until revalidation

## 9.6 Bundle Size Targets

| Bundle | Target Size (gzipped) |
|---|---|
| First load JS (shared) | < 80KB |
| Homepage route chunk | < 40KB |
| PDP route chunk | < 50KB |
| Admin route chunks | < 120KB (acceptable, admin-only) |
| Framer Motion | < 35KB (tree-shaken) |
| Total first load | < 150KB |

**Strategies to hit targets:**
- `framer-motion`: import only used features (`motion`, `AnimatePresence`)
- `lucide-react`: import individual icons, never barrel import
- `date-fns`: import only needed functions
- `@prisma/client`: server-only, never bundled to client
- Analyze bundles with `@next/bundle-analyzer` monthly

---

# SECTION 10 — SEO STRATEGY

## 10.1 Metadata Architecture

**Base metadata in `app/layout.tsx`:**
```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://yourdomain.com'),
  title: { default: 'BrandName — Trending Products for Modern Life', template: '%s | BrandName' },
  description: 'Discover premium trending products. Free shipping. 30-day returns.',
  keywords: ['trending products', 'online shopping', 'dropshipping', 'premium products'],
  authors: [{ name: 'BrandName' }],
  creator: 'BrandName',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'BrandName',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630 }]
  },
  twitter: { card: 'summary_large_image', creator: '@brandname' }
}
```

## 10.2 Dynamic Metadata Per Page

### Product Detail Page (`/products/[slug]`)
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProductBySlug(params.slug)
  return {
    title: product.metaTitle ?? product.name,
    description: product.metaDescription ?? product.tagline,
    openGraph: {
      title: product.name,
      description: product.tagline,
      images: [{ url: product.images[0].url, width: 800, height: 800, alt: product.name }],
      type: 'product',
    },
    twitter: { card: 'summary_large_image', title: product.name }
  }
}
```

### Category Page
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug)
  return {
    title: `${category.name} Products — BrandName`,
    description: `Shop the best ${category.name} products. Trending picks, fast shipping.`,
  }
}
```

## 10.3 Structured Data (JSON-LD)

### Homepage — `WebSite` + `Organization`
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "BrandName",
  "url": "https://yourdomain.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://yourdomain.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### Product Page — `Product`
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "description": "Product description",
  "image": ["url1", "url2"],
  "sku": "SKU-001",
  "brand": { "@type": "Brand", "name": "BrandName" },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "INR",
    "price": "999.00",
    "availability": "https://schema.org/InStock",
    "seller": { "@type": "Organization", "name": "BrandName" }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "847"
  }
}
```

### Breadcrumb — `BreadcrumbList`
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "/" },
    { "@type": "ListItem", "position": 2, "name": "Category", "item": "/category/slug" },
    { "@type": "ListItem", "position": 3, "name": "Product Name" }
  ]
}
```

### Review — `Review` (inline in Product schema)

## 10.4 Sitemap Strategy

**File:** `app/sitemap.ts` (Next.js App Router built-in)

```
Static entries:
  / (daily, priority: 1.0)
  /products (daily, priority: 0.9)
  /about (monthly, priority: 0.5)
  /contact (monthly, priority: 0.4)

Dynamic entries:
  /products/[slug]   — all active products (weekly, priority: 0.8)
  /category/[slug]   — all active categories (weekly, priority: 0.7)

Split into multiple sitemaps if product count > 5000
Sitemap index at /sitemap.xml
```

## 10.5 `robots.txt`

**File:** `app/robots.ts`
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/
Disallow: /account/
Disallow: /auth/
Sitemap: https://yourdomain.com/sitemap.xml
```

## 10.6 Canonical URLs

- All product pages: `<link rel="canonical" href="https://yourdomain.com/products/[slug]" />`
- Category pages with filter params (e.g., `?sort=price&page=2`): canonical points to base category URL
- Search pages: `noindex` meta tag (faceted search pages are thin content)
- Set via `generateMetadata` `alternates.canonical` field

## 10.7 Additional SEO Signals

- **Page speed:** Core Web Vitals directly affect rankings — hitting < 1.8s LCP is non-negotiable
- **Internal linking:** Product cards link to PDP, related products link between products, category breadcrumbs
- **Image alt text:** Every `next/image` gets descriptive `alt` from DB or generated programmatically
- **Heading hierarchy:** One `<h1>` per page (product name / page title), structured `<h2>` / `<h3>` for sections
- **URL structure:** Clean, keyword-rich slugs: `/products/portable-blender-mini-smoothie` not `/products/p-12345`

---

# SECTION 11 — API ARCHITECTURE

All mutations are Server Actions (Next.js 15). Read-heavy API routes are Next.js Route Handlers for caching flexibility.

## 11.1 Server Actions

### `lib/actions/auth.actions.ts`

| Action | Method | Auth | Input | Output | Notes |
|---|---|---|---|---|---|
| `register` | POST (SA) | None | `{ name, email, password }` | `{ success, error }` | Zod validated, bcrypt hash |
| `login` | POST (SA) | None | `{ email, password }` | `{ success, error }` | Auth.js `signIn` |
| `logout` | POST (SA) | Required | none | redirect `/` | Auth.js `signOut` |
| `forgotPassword` | POST (SA) | None | `{ email }` | `{ success }` | Generates token, sends email |
| `resetPassword` | POST (SA) | None | `{ token, password }` | `{ success, error }` | Validates token, updates hash |

### `lib/actions/cart.actions.ts`

| Action | Auth | Input | Output | Notes |
|---|---|---|---|---|
| `addToCart` | Required | `{ productId, quantity }` | `{ cart, error }` | Upserts CartItem |
| `removeFromCart` | Required | `{ productId }` | `{ cart }` | Deletes CartItem |
| `updateCartQuantity` | Required | `{ productId, quantity }` | `{ cart }` | quantity=0 removes |
| `clearCart` | Required | none | `{ success }` | Deletes all CartItems |
| `getCart` | Required | none | `{ cart: CartWithItems }` | Includes product data |

### `lib/actions/order.actions.ts`

| Action | Auth | Input | Output | Notes |
|---|---|---|---|---|
| `createOrder` | Required | `{ addressId, couponCode? }` | `{ orderId, razorpayOrderId, amount }` | Creates DB order, Razorpay order |
| `verifyPayment` | Required | `{ orderId, razorpayPaymentId, signature }` | `{ success, orderNumber }` | Verifies HMAC signature |
| `cancelOrder` | Required | `{ orderId }` | `{ success, error }` | Only PENDING orders |

### `lib/actions/wishlist.actions.ts`

| Action | Auth | Input | Output |
|---|---|---|---|
| `addToWishlist` | Required | `{ productId }` | `{ wishlist }` |
| `removeFromWishlist` | Required | `{ productId }` | `{ wishlist }` |
| `isInWishlist` | Required | `{ productId }` | `{ inWishlist: boolean }` |

### `lib/actions/review.actions.ts`

| Action | Auth | Input | Output | Notes |
|---|---|---|---|---|
| `submitReview` | Required | `{ productId, rating, title?, body?, images? }` | `{ success, error }` | One review per user per product |
| `markHelpful` | Required | `{ reviewId }` | `{ count }` | Increments helpfulCount |

### `lib/actions/coupon.actions.ts`

| Action | Auth | Input | Output |
|---|---|---|---|
| `validateCoupon` | Required | `{ code, orderTotal }` | `{ valid, discount, error, coupon }` |

### `lib/actions/address.actions.ts`

| Action | Auth | Input | Output |
|---|---|---|---|
| `addAddress` | Required | `AddressInput` | `{ address }` |
| `updateAddress` | Required | `{ id } & AddressInput` | `{ address }` |
| `deleteAddress` | Required | `{ id }` | `{ success }` |
| `setDefaultAddress` | Required | `{ id }` | `{ success }` |

### `lib/actions/product.actions.ts` (Admin only)

| Action | Auth | Input | Output |
|---|---|---|---|
| `createProduct` | Admin | `ProductCreateInput` | `{ product }` |
| `updateProduct` | Admin | `{ id } & ProductUpdateInput` | `{ product }` |
| `deleteProduct` | Admin | `{ id }` | `{ success }` |
| `toggleProductStatus` | Admin | `{ id, isActive }` | `{ product }` |
| `updateProductFlags` | Admin | `{ id, isTrending, isViral, isFeatured }` | `{ product }` |

### `lib/actions/newsletter.actions.ts`

| Action | Auth | Input | Output |
|---|---|---|---|
| `subscribe` | None | `{ email, source? }` | `{ success, error }` |
| `unsubscribe` | None | `{ email, token }` | `{ success }` |

## 11.2 Route Handlers

### `app/api/products/route.ts`
- **GET** `/api/products`
- Auth: None
- Query params: `category`, `search`, `sort`, `minPrice`, `maxPrice`, `page`, `limit`, `trending`, `viral`
- Output: `{ products: Product[], total, page, totalPages }`
- Cache: `revalidate: 300` (5 min) for general listing, `no-store` if search query present

### `app/api/products/[slug]/route.ts`
- **GET** `/api/products/:slug`
- Auth: None
- Output: Full product with images, benefits, features, FAQs, review summary
- Cache: `revalidate: 1800` (30 min)

### `app/api/cart/route.ts`
- **GET** — fetch current cart (auth required)
- Cache: `no-store`

### `app/api/reviews/route.ts`
- **GET** `/api/reviews?productId=&page=&sort=` — paginated reviews
- Cache: `revalidate: 300`

### `app/api/upload/route.ts`
- **POST** `/api/upload`
- Auth: Required
- Input: `{ folder, publicId? }`
- Output: `{ signature, timestamp, cloudName, apiKey }` — Cloudinary signed upload params
- Client uploads directly to Cloudinary (no server bandwidth used)

### `app/api/webhooks/razorpay/route.ts`
- **POST** `/api/webhooks/razorpay`
- Auth: Razorpay webhook secret header verification
- Handles: `payment.captured`, `payment.failed`, `refund.created`
- Updates order `paymentStatus` and `status` in DB
- Cache: `no-store`

### `app/api/revalidate/route.ts`
- **POST** `/api/revalidate`
- Auth: `Bearer REVALIDATION_SECRET` header
- Input: `{ path: string }` or `{ tag: string }`
- Calls `revalidatePath()` or `revalidateTag()`

---

# SECTION 12 — STATE MANAGEMENT ARCHITECTURE

## 12.1 State Categories and Storage

| State Type | What | Storage | Tool |
|---|---|---|---|
| Server state — products | Product list, single product | Server/ISR cache | Prisma + Next.js cache |
| Server state — orders | Order history, order detail | DB, SSR on demand | Prisma, server action |
| Server state — user | Profile, addresses | DB, SSR | Prisma, Auth.js session |
| Client state — cart | Items, quantities, totals | Zustand store + `localStorage` | `use-cart.ts` (Zustand) |
| Client state — wishlist | Set of productIds | Zustand + `localStorage` | `use-wishlist.ts` (Zustand) |
| Client state — UI | Drawer open/close, active tab | Local component state | `useState` |
| URL state — filters | Category, price range, sort, page | URL search params | `useSearchParams`, `useRouter` |
| URL state — search | Search query string | URL search params `?q=` | `useSearchParams` |
| Form state | All forms | React Hook Form | RHF + Zod |
| Auth session | Current user, role | Server session (Auth.js) + cookie | `auth()`, `useSession()` |

## 12.2 Cart State Strategy

**Store definition (`hooks/use-cart.ts` via Zustand):**
```
CartStore {
  items: CartItem[]           // { productId, name, image, price, quantity, slug }
  isOpen: boolean             // cart drawer visibility
  coupon: Coupon | null
  
  addItem(item)               // add or increment quantity
  removeItem(productId)       // remove completely
  updateQuantity(productId, qty)
  clearCart()
  openCart()
  closeCart()
  toggleCart()
  applyCoupon(coupon)
  removeCoupon()
  
  // Computed
  itemCount: number
  subtotal: number
  discount: number
  total: number
}
```

**Persistence:** Zustand `persist` middleware with `localStorage` storage
**Hydration:** `useEffect` on mount to rehydrate from localStorage (avoids SSR mismatch)
**Server sync:** On checkout, cart items are validated against DB for stock/price accuracy (server action)
**Optimistic updates:** Mutations update local store immediately, fire server action in background; rollback on error

**Auth-aware strategy:**
- Guest: cart lives in localStorage only
- Login: merge localStorage cart into DB cart (server action `mergeGuestCart`)
- On logout: cart store is cleared (localStorage removed)

## 12.3 Wishlist State Strategy

**Store (`hooks/use-wishlist.ts`):**
```
WishlistStore {
  productIds: Set<string>
  
  toggle(productId)       // optimistic add/remove, server action in background
  has(productId)          // boolean check for UI
  load(ids: string[])     // initialize from server data on auth
}
```

- Guest: wishlist is NOT persisted (sign-in prompt on heart click)
- Authenticated: productIds loaded from DB on page hydration (`/account/wishlist` SSR), then cached in Zustand

## 12.4 URL State for Filters/Search

**Filter state (`hooks/use-filters.ts`):**
```
URL params managed:
  ?category=electronics          // category slug
  ?minPrice=500&maxPrice=5000    // price range
  ?rating=4                      // minimum rating
  ?inStock=true                  // stock filter
  ?sort=price_asc                // sort option
  ?page=2                        // pagination

All filter changes call router.replace() (not push) to avoid history spam
Filter state is fully serializable and shareable via URL
```

**Search state (`hooks/use-search.ts`):**
```
- Input value: local useState
- Debounced search query: useDebounce(value, 300)
- Debounced value synced to ?q= URL param via router.replace
- Search results: fetched client-side against /api/products?search= with React state
```

## 12.5 Auth Session Strategy

**Auth.js v5 pattern:**
- Server components: `import { auth } from '@/lib/auth'` → `const session = await auth()`
- Client components: `import { useSession } from 'next-auth/react'` → `useSession()`
- Middleware: `auth` middleware function validates session cookie, redirects unauthenticated requests

**Session shape:**
```typescript
interface Session {
  user: {
    id: string
    email: string
    name: string
    image?: string
    role: 'USER' | 'ADMIN'
  }
  expires: string
}
```

---

# SECTION 13 — ADMIN DASHBOARD STRUCTURE

## 13.1 Route Overview

| Route | Panel | Key Features |
|---|---|---|
| `/admin` | Overview Dashboard | KPI cards, revenue chart, recent orders, low stock alerts |
| `/admin/products` | Product Management | Data table, search, filter, bulk actions, status toggle |
| `/admin/products/new` | Create Product | Full product form, image upload, categories |
| `/admin/products/[id]` | Edit Product | Pre-filled form, inline stock update |
| `/admin/orders` | Order Management | Data table, status filter, bulk status update |
| `/admin/orders/[id]` | Order Detail | Items, customer info, shipping, status changer, notes |
| `/admin/customers` | Customer Management | Users table, order count per user, search |
| `/admin/categories` | Category Management | Category tree, add/edit/delete, sort order |
| `/admin/coupons` | Coupon Management | Coupon table, create coupon modal, usage stats |
| `/admin/analytics` | Analytics | Revenue chart, orders chart, top products, top categories |
| `/admin/newsletter` | Newsletter | Subscriber table, export CSV, stats |

## 13.2 Overview Dashboard (`/admin`)

**KPI Cards Row:**
```
[Total Revenue Today]  [Orders Today]  [New Customers]  [Conversion Rate]
    ₹24,500              47               12               3.2%
  ▲ +12% vs yesterday  ▲ +8%          ▲ +3%           ▼ -0.5%
```

**Revenue Chart:**
- Line chart (Recharts), last 30 days
- Two series: Revenue (blue), Orders count (gray)
- Date range selector: 7d / 30d / 90d / 12m

**Orders Chart:**
- Bar chart, last 14 days
- Grouped: Pending (orange), Delivered (green)

**Recent Orders Table (last 10):**
- Columns: Order #, Customer, Items, Total, Status, Date, Action (View)
- Status badges: color-coded per OrderStatus enum

**Low Stock Alerts:**
- Products where `stock <= lowStockThreshold`
- Red badge with count
- Quick link to product edit

## 13.3 Product Management (`/admin/products`)

**Data Table columns:**
```
[ ] (checkbox)  | Image | Name | Category | Price | Stock | Status | Trending | Created | Actions
```

**Filters above table:**
- Search input (product name, SKU)
- Category dropdown
- Status filter (Active/Inactive/All)
- Stock filter (In Stock / Low Stock / Out of Stock)

**Row actions:**
- Edit (icon, links to `/admin/products/[id]`)
- Toggle active/inactive (switch, immediate server action)
- Delete (icon, confirmation modal)

**Bulk actions (when rows selected):**
- Bulk activate / deactivate
- Bulk delete (with confirmation)
- Bulk mark as trending

**Product Form Fields:**
```
Basic Info:
  - Name (required)
  - Slug (auto-generated, editable)
  - Category (select, required)
  - Tagline (short punchy description)
  - Description (textarea, rich multiline)
  - Problem Statement (textarea)
  - Solution Text (textarea)

Pricing & Inventory:
  - Price (required, INR)
  - Compare At Price (optional, for discount display)
  - Cost Price (optional, for margin calc)
  - SKU (optional)
  - Stock Quantity (required)
  - Low Stock Threshold

Media:
  - Images (multi-upload, drag to reorder, primary flag)
  - Video URL (optional, YouTube or Cloudinary)

SEO:
  - Meta Title (auto-filled from Name, editable)
  - Meta Description (auto-filled from Tagline, editable)

Flags:
  - Is Active (toggle)
  - Is Featured (toggle)
  - Is Trending (toggle)
  - Is Viral (toggle)

Benefits: (dynamic list, add/remove)
  - Icon (Lucide icon name)
  - Title
  - Body

Features: (dynamic list, add/remove)
  - Title
  - Body

FAQs: (dynamic list, add/remove)
  - Question
  - Answer
```

## 13.4 Order Management (`/admin/orders`)

**Data Table columns:**
```
Order # | Customer | Items | Total | Payment | Status | Date | Actions
```

**Filter bar:**
- Status filter: All / Pending / Confirmed / Shipped / Delivered / Cancelled
- Date range picker
- Search by order number or customer email

**Order Detail Page (`/admin/orders/[id]`):**
```
Top section:
  Order #ORD-XXXX | Placed: 12 Dec 2024, 3:45 PM | Payment: PAID (Razorpay UPI)

Two-column layout:
  Left (60%):
    Order Items table:
      Image | Name | SKU | Price | Qty | Line Total
    Order Summary:
      Subtotal / Shipping / Discount / Tax / Total

  Right (40%):
    Customer Info card:
      Name, email, phone
      Account link
    
    Shipping Address card:
      Full address
    
    Order Status card:
      Current status badge
      Status dropdown (OrderStatus enum)
      "Update Status" button → server action
      Notes textarea (internal admin note)
    
    Tracking card:
      Tracking number input
      Carrier input
      "Save Tracking" button → server action
```

## 13.5 Analytics Dashboard (`/admin/analytics`)

**Metrics:**
- Revenue: total, daily, weekly, monthly (with MoM %)
- Orders: count, average order value
- Customers: new vs returning
- Top products by revenue and units sold
- Top categories by revenue
- Conversion funnel (estimated from page views vs orders — approximate)

**Charts:**
- Revenue area chart: 12 months rolling
- Daily orders bar chart: last 30 days
- Category revenue donut chart
- Top 10 products table: Name / Units Sold / Revenue / Margin

**Data strategy:**
- All analytics data fetched server-side via Prisma aggregation queries in `lib/queries/analytics.ts`
- Charts rendered client-side with Recharts (dynamic import)
- Date range selector triggers RSC prop updates via URL params

## 13.6 Admin Layout and Security

**`app/admin/layout.tsx`:**
- Server Component: calls `auth()`, redirects to `/auth/login` if not authenticated, returns 403 if `role !== 'ADMIN'`
- Renders: `<AdminSidebar>` (Client) + `{children}` in main content area

**Admin sidebar navigation items:**
```
Dashboard        /admin
Products         /admin/products
Orders           /admin/orders
Customers        /admin/customers
Categories       /admin/categories
Coupons          /admin/coupons
Analytics        /admin/analytics
Newsletter       /admin/newsletter
---
Back to Store    /
```

**Security layers:**
1. `middleware.ts`: checks session, redirects unauthenticated to `/auth/login`
2. `app/admin/layout.tsx`: checks `role === 'ADMIN'`, returns 403 component
3. Server actions: each admin action calls `requireAdmin()` helper that re-validates session
4. API routes: Bearer token or session check per route

---

# APPENDIX — ENVIRONMENT VARIABLES

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth.js
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Razorpay
RAZORPAY_KEY_ID="..."
RAZORPAY_KEY_SECRET="..."
NEXT_PUBLIC_RAZORPAY_KEY_ID="..."    # safe to expose
RAZORPAY_WEBHOOK_SECRET="..."

# App
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
REVALIDATION_SECRET="..."             # for /api/revalidate

# Email (Nodemailer / Resend)
EMAIL_SERVER_HOST="..."
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="..."
EMAIL_SERVER_PASSWORD="..."
EMAIL_FROM="noreply@yourdomain.com"
```

---

# APPENDIX — PACKAGE.JSON DEPENDENCIES

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.0.0",
    
    "@prisma/client": "^5.0.0",
    "next-auth": "^5.0.0",
    
    "framer-motion": "^11.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/typography": "^0.5.0",
    
    "zod": "^3.0.0",
    "react-hook-form": "^7.0.0",
    "@hookform/resolvers": "^3.0.0",
    
    "zustand": "^4.0.0",
    "sonner": "^1.0.0",
    
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-accordion": "^1.0.0",
    "@radix-ui/react-tabs": "^1.0.0",
    "@radix-ui/react-tooltip": "^1.0.0",
    "@radix-ui/react-popover": "^1.0.0",
    "@radix-ui/react-slider": "^1.0.0",
    "@radix-ui/react-checkbox": "^1.0.0",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.0",
    "@radix-ui/react-avatar": "^1.0.0",
    "@radix-ui/react-progress": "^1.0.0",
    "@radix-ui/react-label": "^2.0.0",
    
    "lucide-react": "^0.400.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "class-variance-authority": "^0.7.0",
    
    "cloudinary": "^2.0.0",
    "razorpay": "^2.0.0",
    
    "@tanstack/react-table": "^8.0.0",
    "recharts": "^2.0.0",
    
    "bcryptjs": "^2.0.0",
    "nodemailer": "^6.0.0",
    "date-fns": "^3.0.0",
    "slugify": "^1.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/bcryptjs": "^2.0.0",
    "@types/nodemailer": "^6.0.0",
    "@next/bundle-analyzer": "^15.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "prettier": "^3.0.0",
    "prettier-plugin-tailwindcss": "^0.6.0"
  }
}
```

---

*Document version: 1.0 — Ready for engineering handoff*
*All file paths are relative to project root.*
*All color values are exact hex; use CSS custom properties for consistent theming.*
*Database schema is production-ready; run `prisma migrate dev` to apply.*
