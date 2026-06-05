-- Add archive fields to Product
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "isArchived"   BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "archivedAt"   TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "archivedById" TEXT;

CREATE INDEX IF NOT EXISTS "Product_isArchived_idx" ON "Product"("isArchived");

-- Add new AuditAction enum values
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PRODUCT_ARCHIVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PRODUCT_RESTORED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PRODUCT_DUPLICATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'STOCK_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'BULK_STOCK_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'BULK_PRICE_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'BULK_STATUS_UPDATED';

-- Create StockChangeReason enum
DO $$ BEGIN
  CREATE TYPE "StockChangeReason" AS ENUM (
    'MANUAL_ADJUSTMENT',
    'BULK_UPDATE',
    'ORDER_FULFILLED',
    'ORDER_CANCELLED',
    'RETURN_RECEIVED',
    'CSV_IMPORT',
    'INITIAL_STOCK'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create InventoryLog table
CREATE TABLE IF NOT EXISTS "InventoryLog" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "productId"   TEXT NOT NULL,
  "variantId"   TEXT NOT NULL,
  "adminId"     TEXT,
  "reason"      "StockChangeReason" NOT NULL,
  "stockBefore" INTEGER NOT NULL,
  "stockAfter"  INTEGER NOT NULL,
  "delta"       INTEGER NOT NULL,
  "note"        TEXT,
  "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  CONSTRAINT "InventoryLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InventoryLog_productId_fkey" FOREIGN KEY ("productId")
    REFERENCES "Product"("id") ON DELETE CASCADE,
  CONSTRAINT "InventoryLog_variantId_fkey" FOREIGN KEY ("variantId")
    REFERENCES "ProductVariant"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "InventoryLog_productId_idx"  ON "InventoryLog"("productId");
CREATE INDEX IF NOT EXISTS "InventoryLog_variantId_idx"  ON "InventoryLog"("variantId");
CREATE INDEX IF NOT EXISTS "InventoryLog_adminId_idx"    ON "InventoryLog"("adminId");
CREATE INDEX IF NOT EXISTS "InventoryLog_createdAt_idx"  ON "InventoryLog"("createdAt");
CREATE INDEX IF NOT EXISTS "InventoryLog_reason_idx"     ON "InventoryLog"("reason");
