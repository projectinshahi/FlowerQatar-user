/**
 * Cart rules shared by the cart schema, the cart service and the UI, so they cannot drift. Its
 * own file so client code can import it without pulling in zod.
 */

/** Per-line quantity ceiling, also used by the UI's stepper. */
export const MAX_CART_QUANTITY = 99;

/**
 * What a cart surface (drawer, cart page, checkout) should show. While the cart is still loading,
 * an empty list means "not known yet", never "empty": saying "Your cart is empty" then is wrong,
 * and flips to the real items a moment later.
 */
export function cartView(itemCount: number, loading: boolean): 'loading' | 'empty' | 'items' {
  if (itemCount > 0) return 'items';
  return loading ? 'loading' : 'empty';
}
