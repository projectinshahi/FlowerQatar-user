/**
 * Live storefront updates: the event contract shared by the server and the browser.
 *
 * Events are NOTIFICATIONS, not data. They carry only public identifiers (ids, slugs, a status
 * name) and the client reacts by re-reading from the server, so the database stays the single
 * source of truth and a lost event can never leave a page showing wrong data for longer than
 * its next load.
 *
 * Client-safe: no server imports.
 */

export type LiveEntity =
  | 'product'
  | 'subcategory'
  | 'gift'
  | 'promotion'
  | 'banner'
  | 'occasion'
  | 'subscriptionPlan'
  | 'review'
  | 'blushingBlooms'
  | 'welcomePopup'
  | 'delivery'
  | 'order';

export type LiveAction = 'created' | 'updated' | 'deleted' | 'statusChanged';

export type LiveEventType = `${LiveEntity}.${LiveAction}`;

export interface LiveEvent {
  type: LiveEventType;
  /** Entity ids (product ids for product and review events, the order id for order events). */
  ids?: string[];
  /** Product slugs, so a product page can tell whether the event is about itself. */
  slugs?: string[];
  /** The new status, for status changes (product status, order status). */
  status?: string;
  /**
   * Stamped by the server when the event is emitted, strictly increasing per server process.
   * The client drops anything not newer than what it has already applied.
   */
  version: number;
}

/** What the server hands to the publisher; it adds `version` itself. */
export type LiveChange = Omit<LiveEvent, 'version'>;

/** Sent to every socket on (re)connect so a client can tell whether it missed anything. */
export interface LiveHello {
  /** Version of the newest public event. */
  latest: number;
  /** Version of the newest private event for this signed-in user (0 for guests). */
  userLatest: number;
}

export const entityOf = (type: LiveEventType) => type.split('.')[0] as LiveEntity;

/** Pages whose server-rendered content lists products. */
const PRODUCT_LISTINGS = ['/', '/shop', '/search'];

/**
 * Whether the page at `pathname`/`search` shows data this event changed, and so should be
 * re-rendered from the server. Pure, so it can be checked without a browser
 * (scripts/check-live-events.ts).
 *
 * A product page is only refreshed for its own product. Its "related products" strip can also
 * go stale when a sibling changes, but refreshing every open product page on every product
 * edit anywhere would cost far more than it gains; the strip is correct on the next load.
 *
 * A product being DELETED is not handled by a refresh on its own page: the page would turn
 * into a bare 404. ProductAvailability shows a notice in place instead.
 */
export function shouldRefresh(event: LiveEvent, pathname: string, search: string): boolean {
  const entity = entityOf(event.type);
  const productSlug = pathname.startsWith('/product/') ? decodeURIComponent(pathname.slice(9)) : null;
  const ownProduct = productSlug !== null && !!event.slugs?.includes(productSlug);

  switch (entity) {
    case 'subcategory':
      // The navigation menu is in the shared layout, so every page shows subcategories.
      return true;
    case 'product':
      if (productSlug !== null) return ownProduct && event.type !== 'product.deleted';
      return PRODUCT_LISTINGS.includes(pathname) || pathname.startsWith('/occasion/');
    case 'gift':
      return productSlug !== null;
    case 'review':
      return ownProduct;
    case 'occasion':
      return pathname === '/' || pathname.startsWith('/occasion/');
    case 'promotion':
    case 'banner':
    case 'subscriptionPlan':
      return pathname === '/';
    case 'blushingBlooms':
      return pathname === '/shop' && new URLSearchParams(search).get('category') === 'blushing-blooms';
    default:
      // welcomePopup, delivery, order: the affected UI loads its data in the browser and
      // listens for these events itself; there is no server-rendered page to refresh.
      return false;
  }
}
