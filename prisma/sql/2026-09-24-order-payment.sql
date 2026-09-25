-- SkipCash payment state on Order. Idempotent: safe to run more than once.
DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
  ADD COLUMN IF NOT EXISTS "paymentProvider" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "paymentId" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "paymentTxnId" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "paymentFailureReason" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "couponId" UUID,
  ADD COLUMN IF NOT EXISTS "cartItemIds" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "Order_paymentId_key" ON "Order" ("paymentId");

-- Orders placed before a gateway existed were completed without a payment step; leaving them
-- UNPAID would make every historical order look unpaid in the admin panel.
UPDATE "Order"
SET "paymentStatus" = CASE WHEN "status" = 'CANCELLED' THEN 'CANCELLED'::"PaymentStatus" ELSE 'PAID'::"PaymentStatus" END,
    "paidAt" = COALESCE("paidAt", CASE WHEN "status" <> 'CANCELLED' THEN "createdAt" END),
    "paymentProvider" = 'LEGACY'
WHERE "paymentProvider" IS NULL;
