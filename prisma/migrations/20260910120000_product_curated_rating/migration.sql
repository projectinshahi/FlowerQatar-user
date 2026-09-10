-- Curated star rating + review count for the product detail page.
--
-- Purely additive: two nullable columns on an existing table, no defaults backfilled and no
-- constraint on existing rows, so every product keeps behaving exactly as it did — NULL means
-- "not curated" and the page falls back to the published ProductReview average, which is what
-- it already used.
--
-- The CHECK is written to allow NULL explicitly: in Postgres a CHECK passes on NULL anyway,
-- but spelling it out keeps the intent readable next to the 1-5 range.

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER;

ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_rating_range";
ALTER TABLE "Product" ADD CONSTRAINT "Product_rating_range"
  CHECK ("rating" IS NULL OR ("rating" >= 1 AND "rating" <= 5));

ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_reviewCount_nonnegative";
ALTER TABLE "Product" ADD CONSTRAINT "Product_reviewCount_nonnegative"
  CHECK ("reviewCount" IS NULL OR "reviewCount" >= 0);
