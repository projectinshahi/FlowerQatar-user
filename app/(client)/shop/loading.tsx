import { Suspense } from 'react';
import ShopLoadingTheme from './ShopLoadingTheme';

/**
 * Route-level loading UI for /shop.
 *
 * The skeleton depends on `?category`, which only a client component can read, and
 * `useSearchParams` suspends — so whatever sits in this outer fallback is guaranteed to paint
 * first. Rendering the shared cream skeleton here put a flash of the main site's theme in front
 * of the Blushing Blooms page every time, so the fallback is deliberately empty: one blank frame
 * costs nothing, and every category then gets its own correct skeleton and no other.
 */
export default function Loading() {
  return (
    <Suspense fallback={null}>
      <ShopLoadingTheme />
    </Suspense>
  );
}
