-- Editable content for the Blushing Blooms category page.
--
-- Purely additive: a new table, no ALTER on anything that already exists and no enum change,
-- so this cannot disturb the other categories or any in-flight work.
--
-- Every content column is nullable. The storefront merges the row over code defaults, so an
-- empty table (the state right after this migration) still renders the designed page.

CREATE TABLE IF NOT EXISTS "BlushingBloomsPage" (
  "id"                UUID         NOT NULL DEFAULT gen_random_uuid(),
  "heroMedia"         TEXT,
  "heroTitle"         VARCHAR(80),
  "heroSubtitle"      VARCHAR(400),
  "bannerMedia"       TEXT,
  "bannerEyebrow"     VARCHAR(60),
  "bannerTitle"       VARCHAR(80),
  "bannerTitleAccent" VARCHAR(80),
  "bannerDescription" VARCHAR(400),
  "bannerCtaLabel"    VARCHAR(40),
  "bannerCtaHref"     VARCHAR(255),
  "videoMedia"        TEXT,
  "videoTitle"        VARCHAR(80),
  "videoTitleAccent"  VARCHAR(80),
  "videoDescription"  VARCHAR(400),
  "singleton"         BOOLEAN      NOT NULL DEFAULT true,
  "createdAt"         TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlushingBloomsPage_pkey" PRIMARY KEY ("id")
);

-- The singleton guard: one row, enforced by the database rather than by an application count
-- check (which races under concurrent PUTs).
CREATE UNIQUE INDEX IF NOT EXISTS "BlushingBloomsPage_singleton_key"
  ON "BlushingBloomsPage" ("singleton");
