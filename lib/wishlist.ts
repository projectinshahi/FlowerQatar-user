/**
 * Drives one product's wishlist requests, newest intent wins.
 *
 * A click that landed while the previous request was still in flight used to be dropped, so
 * un-hearting right after hearting did nothing: the heart stayed filled and the item never left
 * the wishlist. Here the click only updates `desired`, and the loop below re-sends until the
 * server has been told what the user is actually looking at.
 *
 * Pure and transport-free so scripts/check-wishlist-toggle.ts can exercise the race directly.
 */
export async function syncToggle<T>(
  slug: string,
  /** slug → the state the user last asked for. Cleared here once the server agrees. */
  desired: Map<string, boolean>,
  send: (slug: string, wishlisted: boolean) => Promise<T | null>
): Promise<{ ok: boolean; result: T | null }> {
  while (desired.has(slug)) {
    const target = desired.get(slug)!;
    const result = await send(slug, target);
    if (result === null) return { ok: false, result: null };
    // Unchanged while the request was out → the server now matches the UI.
    if (desired.get(slug) === target) {
      desired.delete(slug);
      return { ok: true, result };
    }
  }
  return { ok: true, result: null };
}
