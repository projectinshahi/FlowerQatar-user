/**
 * Per-line quantity ceiling, shared by the cart schema, the cart service and the UI's stepper so
 * they cannot drift. Its own file so client code can import it without pulling in zod.
 */
export const MAX_CART_QUANTITY = 99;
