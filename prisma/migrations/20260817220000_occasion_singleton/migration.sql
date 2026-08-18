-- Limit the shop to ONE occasion.
--
-- `singleton` always defaults to true and carries a unique index, so a second row cannot be
-- inserted. This is the same guard DeliveryCharge and WelcomePopup already use, and it holds
-- under concurrent requests where an application-level count check would race.
--
-- Safe only while at most one Occasion row exists; the unique index creation fails loudly
-- rather than silently dropping data if that is not the case.

ALTER TABLE "Occasion"
  ADD COLUMN IF NOT EXISTS "singleton" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS "Occasion_singleton_key" ON "Occasion" ("singleton");
