-- Ensure BLUSHING_BLOOMS exists in Category table
INSERT INTO "Category" ("name") VALUES ('BLUSHING_BLOOMS') ON CONFLICT ("name") DO NOTHING;

-- Migrate subcategories from LUXURY_GIFTS to BLUSHING_BLOOMS
DO $$
DECLARE
  blushing_id UUID;
  luxury_id UUID;
  birthday_id UUID;
  occasion_id UUID;
  explore_id UUID;
  flower_id UUID;
BEGIN
  SELECT "id" INTO blushing_id FROM "Category" WHERE "name" = 'BLUSHING_BLOOMS' LIMIT 1;
  SELECT "id" INTO luxury_id FROM "Category" WHERE "name" = 'LUXURY_GIFTS' LIMIT 1;
  SELECT "id" INTO birthday_id FROM "Category" WHERE "name" = 'BIRTHDAY' LIMIT 1;
  SELECT "id" INTO occasion_id FROM "Category" WHERE "name" = 'SHOP_BY_OCCASION' LIMIT 1;
  SELECT "id" INTO explore_id FROM "Category" WHERE "name" = 'EXPLORE' LIMIT 1;
  SELECT "id" INTO flower_id FROM "Category" WHERE "name" = 'FLOWER' LIMIT 1;

  IF luxury_id IS NOT NULL AND blushing_id IS NOT NULL THEN
    UPDATE "Subcategory" SET "categoryId" = blushing_id WHERE "categoryId" = luxury_id;
  END IF;

  IF birthday_id IS NOT NULL AND occasion_id IS NOT NULL THEN
    UPDATE "Subcategory" SET "categoryId" = occasion_id WHERE "categoryId" = birthday_id;
  END IF;

  IF explore_id IS NOT NULL AND flower_id IS NOT NULL THEN
    UPDATE "Subcategory" SET "categoryId" = flower_id WHERE "categoryId" = explore_id;
  END IF;
END $$;

-- Update products categoryType
UPDATE "Product" SET "categoryType" = 'BLUSHING_BLOOMS' WHERE "categoryType"::text = 'LUXURY_GIFTS';
UPDATE "Product" SET "categoryType" = 'SHOP_BY_OCCASION' WHERE "categoryType"::text = 'BIRTHDAY';
UPDATE "Product" SET "categoryType" = 'FLOWER' WHERE "categoryType"::text = 'EXPLORE';

-- Remove old Category records
DELETE FROM "Category" WHERE "name" IN ('BIRTHDAY', 'LUXURY_GIFTS', 'EXPLORE');
