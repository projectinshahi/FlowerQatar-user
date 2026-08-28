-- Split the single banner copy colour into one per text element. RENAME rather than
-- drop-and-add so any colour already chosen survives as the heading's colour.
ALTER TABLE "Banner" RENAME COLUMN "textColor" TO "titleColor";
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "subheadingColor" VARCHAR(7);
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "descriptionColor" VARCHAR(7);
