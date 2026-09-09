import { Suspense } from 'react';
import ProductLoadingTheme from './ProductLoadingTheme';

/**
 * Route-level loading UI for a product.
 *
 * Empty outer fallback for the same reason as /shop: `useSearchParams` suspends, so anything
 * placed here paints before the themed skeleton can be chosen — and the shared cream skeleton
 * flashed the main site's theme ahead of the dark Blushing Blooms page.
 */
export default function Loading() {
  return (
    <Suspense fallback={null}>
      <ProductLoadingTheme />
    </Suspense>
  );
}
