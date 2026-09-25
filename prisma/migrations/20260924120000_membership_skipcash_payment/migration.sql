-- Membership purchases move through the real SkipCash gateway, so a membership now exists
-- before it is paid for: PENDING grants nothing, and the gateway payment id links the webhook
-- and the return URL back to exactly one membership (the same contract Order already uses).
--
-- Written to be safe to run more than once.

ALTER TYPE "MembershipStatus" ADD VALUE IF NOT EXISTS 'PENDING';

ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "paymentId" VARCHAR(64);
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMPTZ(6);
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "paymentFailureReason" VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS "Membership_paymentId_key" ON "Membership"("paymentId");

-- Existing rows were simulated purchases that were active from the moment they were created;
-- record their payment time so paidAt is never null for a membership that is already ACTIVE.
UPDATE "Membership" SET "paidAt" = "createdAt" WHERE "paidAt" IS NULL AND "status" = 'ACTIVE';
