-- Gift groups attach to a parent Category, not a single Subcategory.
--
-- Selecting a category (e.g. SHOP_BY_OCCASION) must offer its gifts on EVERY product under it,
-- across all of that category's subcategories. The join table therefore points at "Category".
--
-- The guard below refuses to run if the old table ever received rows, so this can never quietly
-- discard an admin's category assignments; it was empty when written.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'GiftGroupCategory')
     AND EXISTS (SELECT 1 FROM "GiftGroupCategory")
  THEN
    RAISE EXCEPTION 'GiftGroupCategory has rows - migrate them to categoryId before re-running';
  END IF;
END $$;

DROP TABLE IF EXISTS "GiftGroupCategory";

CREATE TABLE "GiftGroupCategory" (
  "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
  "giftGroupId" UUID NOT NULL,
  "categoryId"  UUID NOT NULL,
  "createdAt"   TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GiftGroupCategory_pkey" PRIMARY KEY ("id")
);

-- One category can be assigned to a group only once.
CREATE UNIQUE INDEX "GiftGroupCategory_giftGroupId_categoryId_key"
  ON "GiftGroupCategory" ("giftGroupId", "categoryId");
CREATE INDEX "GiftGroupCategory_giftGroupId_idx" ON "GiftGroupCategory" ("giftGroupId");
CREATE INDEX "GiftGroupCategory_categoryId_idx" ON "GiftGroupCategory" ("categoryId");

ALTER TABLE "GiftGroupCategory" ADD CONSTRAINT "GiftGroupCategory_giftGroupId_fkey"
  FOREIGN KEY ("giftGroupId") REFERENCES "GiftGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GiftGroupCategory" ADD CONSTRAINT "GiftGroupCategory_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
