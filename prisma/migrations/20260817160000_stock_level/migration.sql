-- Per-sellable-unit inventory. Variants stay in Product.variants JSON; variantId/colorId here
-- are ids FROM that JSON, not foreign keys. Stock needs its own table so availability can be
-- claimed with an atomic guarded UPDATE, which a JSON read-modify-write cannot do safely.
--
-- Additive: a unit with no row is "not tracked" and sells without limit, so nothing changes
-- until an admin sets a level.

CREATE TABLE IF NOT EXISTS "StockLevel" (
  "id"                UUID NOT NULL DEFAULT gen_random_uuid(),
  "productId"         UUID NOT NULL,
  "variantId"         VARCHAR(100) NOT NULL,
  "colorId"           VARCHAR(100) NOT NULL,
  "quantity"          INTEGER NOT NULL DEFAULT 0,
  "reserved"          INTEGER NOT NULL DEFAULT 0,
  "lowStockThreshold" INTEGER NOT NULL DEFAULT 0,
  "createdAt"         TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockLevel_pkey" PRIMARY KEY ("id")
);

-- Belt and braces alongside the application rules: the database itself refuses negative
-- inventory, so a bug in any future caller cannot corrupt availability.
ALTER TABLE "StockLevel" DROP CONSTRAINT IF EXISTS "StockLevel_quantity_nonneg";
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_quantity_nonneg" CHECK ("quantity" >= 0);
ALTER TABLE "StockLevel" DROP CONSTRAINT IF EXISTS "StockLevel_reserved_nonneg";
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_reserved_nonneg" CHECK ("reserved" >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS "StockLevel_productId_variantId_colorId_key"
  ON "StockLevel" ("productId", "variantId", "colorId");
CREATE INDEX IF NOT EXISTS "StockLevel_productId_idx" ON "StockLevel" ("productId");

ALTER TABLE "StockLevel" DROP CONSTRAINT IF EXISTS "StockLevel_productId_fkey";
ALTER TABLE "StockLevel"
  ADD CONSTRAINT "StockLevel_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
