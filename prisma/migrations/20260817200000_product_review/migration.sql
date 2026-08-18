-- Admin-curated product reviews. Additive; the product page previously rendered a hardcoded
-- MOCK_REVIEWS array with a fixed "5.0 / Based on 4 reviews" summary.

CREATE TABLE IF NOT EXISTS "ProductReview" (
  "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
  "productId"   UUID NOT NULL,
  "authorName"  VARCHAR(80) NOT NULL,
  "rating"      INTEGER NOT NULL,
  "title"       VARCHAR(120),
  "content"     TEXT NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "reviewedAt"  TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"   TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- The star range is guarded in the database too, so a 0 or 6 cannot skew the average
-- regardless of which caller writes it.
ALTER TABLE "ProductReview" DROP CONSTRAINT IF EXISTS "ProductReview_rating_range";
ALTER TABLE "ProductReview"
  ADD CONSTRAINT "ProductReview_rating_range" CHECK ("rating" BETWEEN 1 AND 5);

CREATE INDEX IF NOT EXISTS "ProductReview_productId_isPublished_reviewedAt_idx"
  ON "ProductReview" ("productId", "isPublished", "reviewedAt");
CREATE INDEX IF NOT EXISTS "ProductReview_isPublished_idx" ON "ProductReview" ("isPublished");

ALTER TABLE "ProductReview" DROP CONSTRAINT IF EXISTS "ProductReview_productId_fkey";
ALTER TABLE "ProductReview"
  ADD CONSTRAINT "ProductReview_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
