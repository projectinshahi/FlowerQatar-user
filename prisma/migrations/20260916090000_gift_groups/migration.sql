-- Category-driven optional gifts: GiftGroup -> (GiftGroupCategory) -> Subcategory, and Gift.
--
-- Additive only; nothing existing is altered. Gifts are resolved for a product through its
-- subcategoryId, so the admin can add groups/categories/gifts with no code change.

CREATE TABLE IF NOT EXISTS "GiftGroup" (
  "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
  "name"         VARCHAR(120) NOT NULL,
  "description"  TEXT,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GiftGroup_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "GiftGroup_isActive_displayOrder_idx" ON "GiftGroup" ("isActive", "displayOrder");

CREATE TABLE IF NOT EXISTS "GiftGroupCategory" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "giftGroupId"   UUID NOT NULL,
  "subcategoryId" UUID NOT NULL,
  "createdAt"     TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GiftGroupCategory_pkey" PRIMARY KEY ("id")
);
-- One category can be assigned to a group only once.
CREATE UNIQUE INDEX IF NOT EXISTS "GiftGroupCategory_giftGroupId_subcategoryId_key"
  ON "GiftGroupCategory" ("giftGroupId", "subcategoryId");
CREATE INDEX IF NOT EXISTS "GiftGroupCategory_giftGroupId_idx" ON "GiftGroupCategory" ("giftGroupId");
CREATE INDEX IF NOT EXISTS "GiftGroupCategory_subcategoryId_idx" ON "GiftGroupCategory" ("subcategoryId");

ALTER TABLE "GiftGroupCategory" DROP CONSTRAINT IF EXISTS "GiftGroupCategory_giftGroupId_fkey";
ALTER TABLE "GiftGroupCategory" ADD CONSTRAINT "GiftGroupCategory_giftGroupId_fkey"
  FOREIGN KEY ("giftGroupId") REFERENCES "GiftGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GiftGroupCategory" DROP CONSTRAINT IF EXISTS "GiftGroupCategory_subcategoryId_fkey";
ALTER TABLE "GiftGroupCategory" ADD CONSTRAINT "GiftGroupCategory_subcategoryId_fkey"
  FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "Gift" (
  "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
  "giftGroupId"  UUID NOT NULL,
  "name"         VARCHAR(120) NOT NULL,
  "price"        DECIMAL(10,2) NOT NULL,
  "image"        TEXT NOT NULL,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Gift_giftGroupId_isActive_displayOrder_idx"
  ON "Gift" ("giftGroupId", "isActive", "displayOrder");

-- A gift can never cost a negative amount, whichever caller writes it.
ALTER TABLE "Gift" DROP CONSTRAINT IF EXISTS "Gift_price_nonnegative";
ALTER TABLE "Gift" ADD CONSTRAINT "Gift_price_nonnegative" CHECK ("price" >= 0);

ALTER TABLE "Gift" DROP CONSTRAINT IF EXISTS "Gift_giftGroupId_fkey";
ALTER TABLE "Gift" ADD CONSTRAINT "Gift_giftGroupId_fkey"
  FOREIGN KEY ("giftGroupId") REFERENCES "GiftGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
