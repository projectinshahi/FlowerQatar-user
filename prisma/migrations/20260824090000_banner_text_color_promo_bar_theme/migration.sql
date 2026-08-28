-- Banner copy colour. Nullable: existing rows keep rendering white, which is what the
-- storefront hardcoded before this became configurable.
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "textColor" VARCHAR(7);

-- Promotion ticker appearance. Singleton, guarded by the unique `singleton` column so the
-- table can never hold a second row. Defaults reproduce the previously hardcoded colours.
CREATE TABLE IF NOT EXISTS "PromotionBarSetting" (
    "id" UUID NOT NULL,
    "barColor" VARCHAR(7) NOT NULL DEFAULT '#b0aca7',
    "textColor" VARCHAR(7) NOT NULL DEFAULT '#ffffff',
    "singleton" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "PromotionBarSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PromotionBarSetting_singleton_key" ON "PromotionBarSetting"("singleton");
