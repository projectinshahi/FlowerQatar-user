-- Master on/off switch for shipping, plus an admin-managed free-shipping threshold.
-- Both were previously hardcoded in lib/services/cart.ts (15 fee, 150 threshold), so the
-- admin's DeliveryCharge row had no effect on what customers were actually charged.
--
-- Additive. `isActive` defaults to true and `freeAbove` seeds from the old hardcoded 150,
-- so behaviour is unchanged until an admin edits it.

ALTER TABLE "DeliveryCharge"
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "freeAbove" DECIMAL(10,2) NOT NULL DEFAULT 0;

UPDATE "DeliveryCharge" SET "freeAbove" = 150 WHERE "freeAbove" = 0;
