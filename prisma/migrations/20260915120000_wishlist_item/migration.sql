-- Server-side wishlist. Additive; the wishlist previously lived only in the browser's
-- localStorage, so it was never tied to a user and never reached the database.
--
-- The composite primary key is the duplicate guard: a product can be in a user's wishlist
-- at most once, however many times (or however fast) the heart is clicked.

CREATE TABLE IF NOT EXISTS "WishlistItem" (
  "userId"    UUID NOT NULL,
  "productId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("userId", "productId")
);

CREATE INDEX IF NOT EXISTS "WishlistItem_productId_idx" ON "WishlistItem" ("productId");

ALTER TABLE "WishlistItem" DROP CONSTRAINT IF EXISTS "WishlistItem_userId_fkey";
ALTER TABLE "WishlistItem"
  ADD CONSTRAINT "WishlistItem_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WishlistItem" DROP CONSTRAINT IF EXISTS "WishlistItem_productId_fkey";
ALTER TABLE "WishlistItem"
  ADD CONSTRAINT "WishlistItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
