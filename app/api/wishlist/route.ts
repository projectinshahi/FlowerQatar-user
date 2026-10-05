import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/admin-guard";
import { getStoreProducts, mapDbProductToStore } from "@/lib/store-products";
import type { Product } from "@/types";

/*
 * WishlistItem is read and written with raw (parameterised) SQL rather than
 * `prisma.wishlistItem`, so a Prisma client generated before the table existed — e.g. the one
 * a long-running dev server already has loaded — works without a regenerate and restart.
 */

/** The user's wishlist as storefront products, newest first. Unpublished products are hidden. */
async function wishlistPayload(userId: string): Promise<{ items: Product[] }> {
  // The products come from the cached published catalogue (same mapper, purged on every product
  // write), so only the wishlist ids are read from the database.
  const [rows, catalogue] = await Promise.all([
    prisma.$queryRaw<{ productId: string }[]>`
      SELECT "productId" FROM "WishlistItem" WHERE "userId" = ${userId}::uuid ORDER BY "createdAt" DESC`,
    getStoreProducts(),
  ]);
  if (!rows.length) return { items: [] };
  let byId = new Map<string, Product>(catalogue.map((p) => [p.id, p]));
  // getStoreProducts returns [] when its read fails; read these products directly instead.
  if (!catalogue.length) {
    const products = await prisma.product.findMany({
      where: { id: { in: rows.map((r) => r.productId) }, status: "PUBLISHED" },
      include: { subcategory: true },
    });
    byId = new Map(products.map((p) => [p.id, mapDbProductToStore(p)]));
  }
  return { items: rows.flatMap((r) => byId.get(r.productId) ?? []) };
}

function fail(e: unknown, fallback: string) {
  console.error("[api/wishlist]", e);
  return NextResponse.json({ success: false, error: fallback }, { status: 500 });
}

// GET /api/wishlist — guests (and expired sessions) get an empty wishlist, never a 401, so the
// storefront can hydrate on every page load without console/network errors. Same as /api/cart.
export async function GET() {
  try {
    const user = await getCurrentUser();
    const data = user ? await wishlistPayload(user.id) : { items: [] };
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return fail(e, "Failed to load wishlist");
  }
}

// POST /api/wishlist { slug, wishlisted } — sets (not toggles) the state, so repeated or
// out-of-order requests converge on what the user last asked for. Returns the full wishlist.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
    // Independent reads, issued together; the checks below keep their original order.
    const [user, product] = await Promise.all([
      getCurrentUser(),
      slug ? prisma.product.findUnique({ where: { slug }, select: { id: true } }) : null,
    ]);
    if (!user) {
      return NextResponse.json({ success: false, error: "Please sign in to use your wishlist." }, { status: 401 });
    }
    if (!slug || typeof body?.wishlisted !== "boolean") {
      return NextResponse.json({ success: false, error: "Invalid wishlist request" }, { status: 400 });
    }
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    if (body.wishlisted) {
      await prisma.$executeRaw`
        INSERT INTO "WishlistItem" ("userId", "productId") VALUES (${user.id}::uuid, ${product.id}::uuid)
        ON CONFLICT DO NOTHING`;
    } else {
      await prisma.$executeRaw`
        DELETE FROM "WishlistItem" WHERE "userId" = ${user.id}::uuid AND "productId" = ${product.id}::uuid`;
    }
    return NextResponse.json({ success: true, data: await wishlistPayload(user.id) });
  } catch (e) {
    return fail(e, "Could not update your wishlist.");
  }
}
