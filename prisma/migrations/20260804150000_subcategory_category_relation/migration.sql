-- Preserve every existing subcategory while moving from the legacy fixed enum to a
-- normalized parent table. The CASE values mirror the former CategoryType labels.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "Category" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- The legacy system has fixed categories only. Insert each parent once, including
-- categories with no subcategories so the admin selector remains complete.
INSERT INTO "Category" ("name") VALUES
  ('GIFT_COMBOS'), ('SHOP_BY_OCCASION'), ('BIRTHDAY'), ('FLOWER'), ('LUXURY_GIFTS'), ('EXPLORE')
ON CONFLICT ("name") DO NOTHING;

ALTER TABLE "Subcategory" ADD COLUMN "categoryId" UUID;
ALTER TABLE "Subcategory" ADD COLUMN "hoverImage" TEXT;
ALTER TABLE "Subcategory" RENAME COLUMN "active" TO "isActive";

UPDATE "Subcategory" s
SET "categoryId" = c."id",
    "hoverImage" = s."image"
FROM "Category" c
WHERE c."name" = s."categoryType"::text;

ALTER TABLE "Subcategory" ALTER COLUMN "categoryId" SET NOT NULL;
ALTER TABLE "Subcategory"
  ADD CONSTRAINT "Subcategory_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Subcategory_categoryId_name_key" ON "Subcategory"("categoryId", "name");
-- Prisma cannot model a functional unique index; this closes the concurrent-write
-- race and makes the required name uniqueness case-insensitive at the database layer.
CREATE UNIQUE INDEX "Subcategory_categoryId_lower_name_key" ON "Subcategory"("categoryId", lower("name"));
CREATE INDEX "Subcategory_categoryId_isActive_idx" ON "Subcategory"("categoryId", "isActive");

-- These values were only used by the legacy category-system UI. Product and occasion
-- slugs/order columns are deliberately untouched.
DROP INDEX IF EXISTS "Subcategory_categoryType_active_displayOrder_idx";
DROP INDEX IF EXISTS "Subcategory_categoryType_explore_idx";
ALTER TABLE "Subcategory" DROP CONSTRAINT IF EXISTS "Subcategory_categoryType_slug_key";
ALTER TABLE "Subcategory"
  DROP COLUMN "categoryType",
  DROP COLUMN "slug",
  DROP COLUMN "image",
  DROP COLUMN "imagePublicId",
  DROP COLUMN "hoverColor",
  DROP COLUMN "explore",
  DROP COLUMN "pinned",
  DROP COLUMN "displayOrder";
