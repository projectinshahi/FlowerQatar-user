-- Marks "catch-all" nav entries (e.g. "All Flowers") that should link to the whole parent
-- category rather than filter to themselves. Additive; defaults to false.

ALTER TABLE "Subcategory"
  ADD COLUMN IF NOT EXISTS "isCatchAll" BOOLEAN NOT NULL DEFAULT false;

-- One-time backfill so existing "All …" entries work immediately instead of needing the
-- admin to find and tick each one. This is a data migration, not runtime name-matching:
-- from here on the flag is what decides, and the name can be changed freely.
UPDATE "Subcategory"
SET "isCatchAll" = true
WHERE "isCatchAll" = false
  AND "name" ILIKE 'all %';
