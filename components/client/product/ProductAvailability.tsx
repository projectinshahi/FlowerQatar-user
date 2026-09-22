'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { onLive } from '@/lib/live-client';

/**
 * Whether the product on this page can still be bought.
 *
 * - `published` comes from the server render, so a hard refresh, another device or a new tab
 *   is always right. When an admin unpublishes the product, LiveUpdates re-renders the page
 *   and this prop turns false.
 * - A DELETED product is not refreshed (the page would become a bare 404), so the delete
 *   event itself flips this, and the page stays readable with buying switched off.
 *
 * The server refuses to add or order an unavailable product regardless (lib/services/cart.ts,
 * lib/services/order.ts); this only stops the customer from trying.
 */
export function useProductAvailable(productId: string, published: boolean): boolean {
  const [deleted, setDeleted] = useState(false);
  useEffect(
    () =>
      onLive((event) => {
        if (event.type === 'product.deleted' && event.ids?.includes(productId)) setDeleted(true);
      }),
    [productId]
  );
  return published && !deleted;
}

/** Shown beside the disabled Add to Cart button. `className` sets its colour. */
export function ProductUnavailableNotice({ className = '' }: { className?: string }) {
  return (
    <p role="status" className={`text-center font-sans text-[12px] tracking-[0.05em] ${className}`}>
      This product is no longer available.{' '}
      <Link href="/shop" className="underline underline-offset-4">
        Continue shopping
      </Link>
    </p>
  );
}
