# TRYBY Admin Panel Architecture
## Version 1.0 — Foundation Design

---

## GUIDING PRINCIPLE

> "Anything visible on the storefront should be editable from the admin panel without code changes."

The admin is not a CRUD dashboard. It is a headless CMS + ecommerce management platform where:
- **Content** (text, images, layout) is stored in the database and rendered dynamically
- **Products** are fully managed with variant-level pricing and profit visibility
- **Operations** (orders, customers) have clear workflows
- **Marketing** (coupons, banners) is self-serve

---

## ADMIN URL STRUCTURE

```
/admin                          → Dashboard
/admin/content                  → Content Management
/admin/content/homepage         → Homepage Builder
/admin/content/announcements    → Announcement Bar
/admin/content/pages            → Static Pages (About, FAQ, etc.)
/admin/media                    → Media Studio
/admin/products                 → Product List
/admin/products/new             → Add Product
/admin/products/[id]/edit       → Edit Product
/admin/orders                   → Order List
/admin/orders/[id]              → Order Detail + Status
/admin/customers                → Customer List
/admin/customers/[id]           → Customer Profile
/admin/marketing/coupons        → Coupon Manager
/admin/marketing/banners        → Promotional Banners
/admin/seo                      → SEO Manager
/admin/analytics                → Analytics Dashboard
/admin/settings                 → Store Settings
```

---

## MODULE 1 — CONTENT MANAGEMENT (CMS)

### Philosophy
Every homepage section is a **ContentBlock** in the database.
The storefront reads from DB. Admin writes to DB. No code deploy needed.

### Data Model

```prisma
enum ContentBlockType {
  HERO_BANNER
  TRUST_BAR
  CATEGORY_GRID
  TRENDING_PRODUCTS
  PROMO_BANNER
  ANNOUNCEMENT
  FOOTER_COLUMN
  STATIC_PAGE
}

model ContentBlock {
  id          String           @id @default(cuid())
  type        ContentBlockType
  key         String           @unique   // e.g. "homepage_hero", "trust_bar"
  title       String?                    // Internal label for admin
  isActive    Boolean          @default(true)
  sortOrder   Int              @default(0)
  data        Json             // Flexible field — all content stored as JSON
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@index([type, isActive])
  @@index([key])
}
```

### The `data` JSON shape per block type:

**HERO_BANNER:**
```json
{
  "badge": "🏆 PLAY. TRAIN. WIN.",
  "heading_line1": "Gear Up.",
  "heading_line2": "Play Your",
  "heading_line3": "Best.",
  "description": "Premium Jerseys & Sports Essentials",
  "cta_primary_label": "Shop Now →",
  "cta_primary_href": "/products",
  "cta_secondary_label": "Best Deals 🔥",
  "cta_secondary_href": "/products?filter=sale",
  "image_mobile": "/hero-mobile.png",
  "image_desktop": "/hero-desktop.png",
  "image_position_mobile": "50% 4%",
  "image_position_desktop": "50% 5%"
}
```

**TRUST_BAR:**
```json
{
  "items": [
    { "icon": "truck",       "label": "Free Shipping",   "sub": "Above ₹499" },
    { "icon": "rotate-ccw",  "label": "Easy Returns",    "sub": "7-day policy" },
    { "icon": "shield-check","label": "Secure Payments", "sub": "100% safe" }
  ]
}
```

**PROMO_BANNER:**
```json
{
  "text": "FREE DELIVERY ON ORDERS ABOVE ₹999",
  "subtext": "Use code TRYBY10 for 10% off",
  "cta_label": "Shop Now",
  "cta_href": "/products",
  "bg_color": "#F5C518",
  "text_color": "#0D0D0D"
}
```

### Admin UI for Content
- Visual form editor per block type (not raw JSON)
- Each field maps to a typed input (text, image picker, color picker, URL)
- Live preview panel shows changes before saving
- Publish / Draft toggle per block

---

## MODULE 2 — MEDIA STUDIO

### Philosophy
All images go through a managed upload pipeline.
Cloudinary is the storage backend (already in tech stack vision).
The admin provides crop/resize/reposition controls before saving.

### Data Model

```prisma
enum AssetType {
  PRODUCT_IMAGE
  HERO_IMAGE
  BANNER_IMAGE
  CATEGORY_IMAGE
  BRAND_LOGO
  MISC
}

model MediaAsset {
  id            String    @id @default(cuid())
  type          AssetType @default(MISC)
  originalUrl   String    // Full-size Cloudinary URL
  thumbnailUrl  String?   // Auto-generated 200x200
  webpUrl       String?   // Auto-generated WebP version
  publicId      String    // Cloudinary public_id for transforms
  altText       String?
  width         Int?
  height        Int?
  sizeBytes     Int?
  mimeType      String?
  // Crop/position metadata saved for responsive rendering
  cropX         Float?    // 0.0 to 1.0
  cropY         Float?    // 0.0 to 1.0
  cropWidth     Float?    // % of original
  cropHeight    Float?
  focalPointX   Float?    // For objectPosition CSS
  focalPointY   Float?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([type])
  @@index([publicId])
}
```

### Admin UI for Media
- **Asset Library**: Grid of all uploaded images, filterable by type
- **Upload**: Drag-drop or file picker → immediate Cloudinary upload
- **Editor**: After upload, open crop/reposition tool
  - Set focal point (determines `object-position` on storefront)
  - Crop for square (product), 16:9 (hero), 4:5 (mobile)
  - Preview at mobile / tablet / desktop viewport
- **Used in**: Product editor, Content editor, Banner editor

### Image Transform URL Pattern (Cloudinary)
```
https://res.cloudinary.com/tryby/image/upload/
  w_800,h_800,c_fill,g_auto/   ← auto-crop to focal point
  f_webp,q_auto/               ← format + quality
  {publicId}
```
No re-upload needed for different sizes — transforms are URL-based.

---

## MODULE 3 — PRODUCT MANAGEMENT

### What the existing schema needs

The current `ProductVariant` is missing `costPrice` for profit calculation.
Add to schema:

```prisma
// Addition to ProductVariant:
  costPrice  Decimal? @db.Decimal(10, 2)   // Purchase cost (private)
  // Derived fields (computed, not stored):
  // profit = price - costPrice
  // margin = (profit / price) * 100
```

### Profit Calculation Logic
```
Cost Price:       ₹400
Selling Price:    ₹899
Shipping Cost:    ₹80  (optional, from SiteSettings)
─────────────────────
Revenue:          ₹899
Total Cost:       ₹480  (cost + shipping)
Profit:           ₹419
Margin:           46.6%
```

Displayed in admin product editor as live calculation — updates as admin types.

### Product Editor Sections
1. **Basic Info** — name, slug (auto-generated), sport, category, description
2. **Media** — drag-reorder images, set primary image, per-variant image assignment
3. **Pricing & Profit** — cost, selling, compare price → live profit display
4. **Inventory** — stock per variant with low-stock threshold
5. **Variants** — size + color matrix, each cell = SKU + stock + price override
6. **SEO** — meta title, description, OG image (auto-populated, editable)
7. **Status** — active/draft/out-of-stock, featured toggle, badge assignment

### Variant Image Assignment
```
Each ProductVariant can optionally link to a MediaAsset.
When user selects "Red" color → gallery shows red jersey images.
```

```prisma
// Addition to ProductVariant:
  imageId   String?
  image     MediaAsset? @relation(fields: [imageId], references: [id])
```

---

## MODULE 4 — MARKETING

### Coupons
Already in schema. Admin UI needs:
- Create/edit/delete coupon
- Live preview of discount: "₹899 order → ₹809 after SAVE10"
- Usage stats: "Used 47 / 100 times"
- Bulk deactivate expired coupons

### Promotional Banners
Managed via ContentBlock (type: `PROMO_BANNER`).
Admin sets: text, sub-text, CTA, background color, active dates.

### Announcement Bar
Already in schema (`AnnouncementMessage`).
Admin UI: create messages, set rotation order, set validity window.

---

## MODULE 5 — SEO

### SiteSettings model (new)
```prisma
model SiteSettings {
  id              String   @id @default(cuid())
  key             String   @unique   // e.g. "seo_home", "seo_products"
  metaTitle       String?
  metaDescription String?  @db.Text
  ogTitle         String?
  ogDescription   String?  @db.Text
  ogImageUrl      String?
  keywords        String?
  robotsContent   String?  @default("index,follow")
  canonicalUrl    String?
  updatedAt       DateTime @updatedAt
  
  @@index([key])
}
```

### Admin UI
- Per-page SEO editor (home, products, about, etc.)
- Character counter for title (50-60 chars) and description (150-160 chars)
- Live Google Search preview (shows how the result would appear)
- OG image picker from Media Studio

---

## MODULE 6 — ANALYTICS

### Data sources (MVP — no external service)
All data comes from existing Prisma models:
- Revenue: `SUM(Order.total)` WHERE status = DELIVERED
- Orders: `COUNT(Order)` grouped by status
- Customers: `COUNT(User)` WHERE role = CUSTOMER
- Top products: `ORDER BY Product.totalSoldCount DESC`
- Low sellers: `ORDER BY Product.totalSoldCount ASC`

### Dashboard widgets
1. **Revenue KPI** — today / this week / this month / all time
2. **Orders funnel** — Pending → Processing → Shipped → Delivered
3. **Top 5 products** by sold count
4. **Low stock alerts** — variants with stock < 5
5. **Recent orders** — last 10 with status
6. **Customer growth** — new registrations this month

### Future (Phase 3+)
- Integrate Google Analytics 4 events
- Integrate Vercel Analytics
- Device breakdown (mobile/tablet/desktop)

---

## ADMIN NAV STRUCTURE

```
TRYBY Admin
├── 📊  Dashboard          /admin
├──────────────────────────────────
├── CONTENT
│   ├── 🏠  Homepage       /admin/content/homepage
│   ├── 📢  Announcements  /admin/content/announcements
│   └── 📄  Pages          /admin/content/pages
├──────────────────────────────────
├── CATALOGUE
│   ├── 👕  Products       /admin/products
│   ├── 🏷️  Categories     /admin/categories
│   └── 🖼️  Media          /admin/media
├──────────────────────────────────
├── OPERATIONS
│   ├── 📦  Orders         /admin/orders
│   └── 👥  Customers      /admin/customers
├──────────────────────────────────
├── MARKETING
│   ├── 🎟️  Coupons        /admin/marketing/coupons
│   └── 📣  Banners        /admin/marketing/banners
├──────────────────────────────────
├── 🔍  SEO                /admin/seo
├── 📈  Analytics          /admin/analytics
└── ⚙️  Settings           /admin/settings
```

---

## DATABASE ADDITIONS NEEDED

Add these models to `prisma/schema.prisma`:

### 1. ContentBlock — drives all CMS content
```prisma
enum ContentBlockType {
  HERO_BANNER
  TRUST_BAR
  CATEGORY_GRID
  TRENDING_PRODUCTS
  PROMO_BANNER
  FOOTER_COLUMN
  STATIC_PAGE
}

model ContentBlock {
  id        String           @id @default(cuid())
  type      ContentBlockType
  key       String           @unique
  title     String?
  isActive  Boolean          @default(true)
  sortOrder Int              @default(0)
  data      Json
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  @@index([type, isActive])
  @@index([key])
}
```

### 2. MediaAsset — managed image library
```prisma
enum AssetType {
  PRODUCT_IMAGE
  HERO_IMAGE
  BANNER_IMAGE
  CATEGORY_IMAGE
  BRAND_LOGO
  MISC
}

model MediaAsset {
  id           String    @id @default(cuid())
  type         AssetType @default(MISC)
  originalUrl  String
  thumbnailUrl String?
  webpUrl      String?
  publicId     String
  altText      String?
  width        Int?
  height       Int?
  sizeBytes    Int?
  focalPointX  Float?
  focalPointY  Float?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([type])
  @@index([publicId])
}
```

### 3. SiteSettings — per-page SEO + global config
```prisma
model SiteSettings {
  id              String   @id @default(cuid())
  key             String   @unique
  metaTitle       String?
  metaDescription String?  @db.Text
  ogTitle         String?
  ogDescription   String?  @db.Text
  ogImageUrl      String?
  robotsContent   String?  @default("index,follow")
  canonicalUrl    String?
  extraData       Json?
  updatedAt       DateTime @updatedAt

  @@index([key])
}
```

### 4. Additions to existing models

**ProductVariant** — add costPrice for profit calculation:
```prisma
costPrice  Decimal? @db.Decimal(10, 2)
imageId    String?
```

**Product** — add homepage visibility:
```prisma
showOnHomepage Boolean @default(false)
homepageSortOrder Int @default(0)
```

---

## BUILD ORDER (Implementation Phases)

### Phase 2A — NOW (this session)
- [ ] Add DB models to schema.prisma
- [ ] Rebuild admin sidebar with full nav structure
- [ ] Admin dashboard (already done — keep)
- [ ] Admin products list + add/edit form (already done — enhance)
- [ ] Admin orders list + detail (already done — enhance)

### Phase 2B — NEXT
- [ ] Content Management: homepage editor with live preview
- [ ] Announcement bar editor
- [ ] Media Studio: upload + Cloudinary integration
- [ ] Coupon manager with live preview

### Phase 2C — AFTER BETA
- [ ] SEO editor per page
- [ ] Analytics dashboard with real DB queries
- [ ] Customer profiles
- [ ] Variant images (color-based gallery switching on PDP)

### Phase 3 — POST LAUNCH
- [ ] Homepage drag-and-drop section reorder
- [ ] Bulk product import (CSV)
- [ ] Invoice generation
- [ ] WhatsApp order notifications
- [ ] Supplier portal

---

## TECH DECISIONS

| Concern | Decision | Reason |
|---|---|---|
| Image storage | Cloudinary | Transform URLs, auto-WebP, CDN |
| CMS data | PostgreSQL JSON column | No extra CMS service, Prisma handles it |
| Admin auth | Same Auth.js, role=ADMIN check | Already in schema |
| Admin state | React state + SWR | No Redux needed at this scale |
| Rich text | React Quill or Tiptap | For product descriptions |
| Image editor | Cropper.js | Lightweight, no Canvas API complexity |

---

## WHAT NOT TO BUILD YET
- Drag-and-drop section reorder (complex, low ROI now)
- AI image enhancement
- WhatsApp/Email marketing campaigns  
- Supplier portal
- Multi-currency
- Advanced A/B testing

These belong in the vision but not in MVP.

---

*Document created: 2026-06-04*
*Status: Approved for implementation*
