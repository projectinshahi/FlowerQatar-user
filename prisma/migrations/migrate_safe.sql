CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "Category" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");

INSERT INTO "Category" ("name") VALUES
  ('GIFT_COMBOS'), ('SHOP_BY_OCCASION'), ('BIRTHDAY'), ('FLOWER'), ('LUXURY_GIFTS'), ('EXPLORE')
ON CONFLICT ("name") DO NOTHING;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Subcategory' AND column_name='categoryId') THEN
    ALTER TABLE "Subcategory" ADD COLUMN "categoryId" UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Subcategory' AND column_name='hoverImage') THEN
    ALTER TABLE "Subcategory" ADD COLUMN "hoverImage" TEXT;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Subcategory' AND column_name='active') THEN
    ALTER TABLE "Subcategory" RENAME COLUMN "active" TO "isActive";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Subcategory' AND column_name='categoryType') THEN
    UPDATE "Subcategory" s
    SET "categoryId" = c."id",
        "hoverImage" = COALESCE(s."hoverImage", s."image")
    FROM "Category" c
    WHERE c."name" = s."categoryType"::text AND s."categoryId" IS NULL;
  END IF;
END $$;

-- If any categoryId is still null, link it to the first category
UPDATE "Subcategory" SET "categoryId" = (SELECT "id" FROM "Category" LIMIT 1) WHERE "categoryId" IS NULL;

-- Remove duplicates before creating unique index
DELETE FROM "Subcategory" a USING "Subcategory" b
WHERE a."id" < b."id" 
  AND a."categoryId" = b."categoryId" 
  AND lower(a."name") = lower(b."name");

ALTER TABLE "Subcategory" ALTER COLUMN "categoryId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Subcategory_categoryId_fkey') THEN
    ALTER TABLE "Subcategory"
      ADD CONSTRAINT "Subcategory_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DROP INDEX IF EXISTS "Subcategory_categoryId_name_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Subcategory_categoryId_name_key" ON "Subcategory"("categoryId", "name");

DROP INDEX IF EXISTS "Subcategory_categoryId_lower_name_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Subcategory_categoryId_lower_name_key" ON "Subcategory"("categoryId", lower("name"));

DROP INDEX IF EXISTS "Subcategory_categoryId_isActive_idx";
CREATE INDEX IF NOT EXISTS "Subcategory_categoryId_isActive_idx" ON "Subcategory"("categoryId", "isActive");

DROP INDEX IF EXISTS "Subcategory_categoryType_active_displayOrder_idx";
DROP INDEX IF EXISTS "Subcategory_categoryType_explore_idx";
ALTER TABLE "Subcategory" DROP CONSTRAINT IF EXISTS "Subcategory_categoryType_slug_key";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Subcategory' AND column_name='categoryType') THEN
    ALTER TABLE "Subcategory" DROP COLUMN "categoryType";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Subcategory' AND column_name='slug') THEN
    ALTER TABLE "Subcategory" DROP COLUMN "slug";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Subcategory' AND column_name='image') THEN
    ALTER TABLE "Subcategory" DROP COLUMN "image";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Subcategory' AND column_name='imagePublicId') THEN
    ALTER TABLE "Subcategory" DROP COLUMN "imagePublicId";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Subcategory' AND column_name='hoverColor') THEN
    ALTER TABLE "Subcategory" DROP COLUMN "hoverColor";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Subcategory' AND column_name='explore') THEN
    ALTER TABLE "Subcategory" DROP COLUMN "explore";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Subcategory' AND column_name='pinned') THEN
    ALTER TABLE "Subcategory" DROP COLUMN "pinned";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Subcategory' AND column_name='displayOrder') THEN
    ALTER TABLE "Subcategory" DROP COLUMN "displayOrder";
  END IF;
END $$;
