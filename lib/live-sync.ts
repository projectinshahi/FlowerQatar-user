import { after } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { revalidateStoreProducts } from '@/lib/store-products';
import { NAV_MENU_TAG } from '@/lib/subcategories';
import { entityOf, type LiveChange, type LiveEntity } from '@/lib/live-events';

/**
 * The one place a customer-visible admin write reports itself. Call it AFTER the database
 * write has succeeded:
 *
 *   1. it queues the cache invalidation for everything that shows the entity, then
 *   2. it notifies connected customers over Socket.IO.
 *
 * Order matters and is enforced by `after()`. Next applies revalidatePath/revalidateTag when
 * the request finishes (the response is held open until they are written), and `after()`
 * callbacks run once the response has closed. Emitting inside the handler instead would let a
 * customer's refresh race the invalidation and re-render the old data.
 *
 * The Socket.IO server lives in server.mjs, in this same process, and publishes itself on
 * globalThis. Under plain `next dev`/`next start` there is no publisher: invalidation still
 * happens, only the live push is skipped.
 */

interface LivePublisher {
  publish(change: LiveChange): void;
  toUser(userId: string, change: LiveChange): void;
}

const PUBLISHER_KEY = Symbol.for('lebami.live');
const publisher = () => (globalThis as Record<symbol, unknown>)[PUBLISHER_KEY] as LivePublisher | undefined;

/**
 * What each entity's change invalidates. Derived from where the data is rendered:
 *
 * - product: product pages (their own detail AND other products' "related" strips), the home
 *   page, search and the cached catalogue all show products, so the whole storefront layout
 *   is revalidated. Pages are rebuilt lazily on their next visit, not all at once.
 * - subcategory: the navigation menu is in the shared layout, and listings show subcategory
 *   names.
 * - gift: gift sections render only on product pages.
 * - review: only the reviewed product's page renders its reviews.
 * - promotion, banner, occasion, subscriptionPlan, welcomePopup: rendered on the home page
 *   (occasion detail pages are dynamic and always fresh).
 * - blushingBlooms: its page content renders on /shop?category=blushing-blooms.
 * - delivery, order: read live on every request (cart, checkout, account); nothing cached.
 */
const INVALIDATE: Record<LiveEntity, (change: LiveChange) => void> = {
  product: () => {
    revalidateStoreProducts();
    revalidatePath('/', 'layout');
  },
  subcategory: () => {
    revalidateTag(NAV_MENU_TAG, { expire: 0 });
    revalidateStoreProducts();
    revalidatePath('/', 'layout');
  },
  // The pattern must name the (client) route group: patterns are matched against file paths.
  gift: () => revalidatePath('/(client)/product/[slug]', 'page'),
  review: (change) => change.slugs?.forEach((slug) => revalidatePath(`/product/${slug}`)),
  promotion: () => revalidatePath('/'),
  banner: () => revalidatePath('/'),
  occasion: () => revalidatePath('/'),
  subscriptionPlan: () => revalidatePath('/'),
  welcomePopup: () => revalidatePath('/'),
  blushingBlooms: () => revalidatePath('/shop'),
  delivery: () => {},
  order: () => {},
};

/** A public storefront change: invalidate, then broadcast to every connected customer. */
export function publishChange(change: LiveChange) {
  INVALIDATE[entityOf(change.type)](change);
  after(() => publisher()?.publish(change));
}

/**
 * A private change for one customer (their order's status). Sent only to that user's room,
 * never broadcast. Nothing is cached for these, so there is nothing to invalidate.
 */
export function notifyUser(userId: string, change: LiveChange) {
  after(() => publisher()?.toUser(userId, change));
}
