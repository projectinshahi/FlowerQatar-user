-- Indexes for the columns the admin order/user lists, reports, CSV export and customer order
-- history sort and filter by (all ORDER BY / WHERE "createdAt"), plus removal of four plain
-- indexes that duplicate the index a UNIQUE constraint already maintains — they only cost writes.
--
-- Idempotent: safe to run more than once. Apply with
--   npx prisma db execute --file prisma/migrations/20261007120000_list_indexes/migration.sql --schema prisma/schema.prisma

CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order" ("createdAt");
CREATE INDEX IF NOT EXISTS "Order_userId_createdAt_idx" ON "Order" ("userId", "createdAt");
-- Covered by the leading column of Order_userId_createdAt_idx.
DROP INDEX IF EXISTS "Order_userId_idx";

CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User" ("createdAt");

DROP INDEX IF EXISTS "User_email_idx";      -- duplicates User_email_key
DROP INDEX IF EXISTS "Product_slug_idx";    -- duplicates Product_slug_key
DROP INDEX IF EXISTS "Coupon_code_idx";     -- duplicates Coupon_code_key
DROP INDEX IF EXISTS "Occasion_slug_idx";   -- duplicates Occasion_slug_key

-- The marketing dashboard's 14-day usage chart filters on usedAt.
CREATE INDEX IF NOT EXISTS "CouponUsage_usedAt_idx" ON "CouponUsage" ("usedAt");
