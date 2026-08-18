-- Wide banner art for the shop listing hero, separate from the square hoverImage used by the
-- circular nav strip. Additive and nullable: existing rows keep working and fall back to
-- hoverImage until an admin uploads a dedicated banner.

ALTER TABLE "Subcategory"
  ADD COLUMN IF NOT EXISTS "bannerImage" TEXT;
