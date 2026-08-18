-- Storefront contact-form submissions. Additive: no existing table is touched.

DO $$ BEGIN
  CREATE TYPE "ContactEnquiryStatus" AS ENUM ('NEW', 'READ', 'RESOLVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ContactEnquiry" (
  "id"        UUID NOT NULL DEFAULT gen_random_uuid(),
  "name"      VARCHAR(120) NOT NULL,
  "email"     VARCHAR(255) NOT NULL,
  "subject"   VARCHAR(40) NOT NULL,
  "message"   TEXT NOT NULL,
  "status"    "ContactEnquiryStatus" NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactEnquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContactEnquiry_status_createdAt_idx"
  ON "ContactEnquiry" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "ContactEnquiry_createdAt_idx"
  ON "ContactEnquiry" ("createdAt");
