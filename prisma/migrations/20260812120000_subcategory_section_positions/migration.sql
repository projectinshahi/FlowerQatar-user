-- Independent visibility + ordering for the two sections that render subcategories:
-- the category strip (navigation) and the home "Explore Our Gardens" grid.
-- Additive only: no data is dropped and existing flags keep their meaning.

ALTER TABLE "Subcategory"
  ADD COLUMN IF NOT EXISTS "showInNavigation"   BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "navigationPosition" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "gardenPosition"     INTEGER NOT NULL DEFAULT 0;

-- Backfill: seed both orderings from the alphabetical order the storefront used before,
-- so nothing visibly moves on the first deploy. Numbering restarts per parent category.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY "categoryId" ORDER BY "name" ASC) AS rn
  FROM "Subcategory"
)
UPDATE "Subcategory" s
SET "navigationPosition" = ranked.rn
FROM ranked
WHERE s.id = ranked.id AND s."navigationPosition" = 0;

WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY "name" ASC) AS rn
  FROM "Subcategory"
  WHERE "isExploreGarden" = true
)
UPDATE "Subcategory" s
SET "gardenPosition" = ranked.rn
FROM ranked
WHERE s.id = ranked.id AND s."gardenPosition" = 0;

CREATE INDEX IF NOT EXISTS "Subcategory_categoryId_showInNavigation_navigationPosition_idx"
  ON "Subcategory" ("categoryId", "showInNavigation", "navigationPosition");
