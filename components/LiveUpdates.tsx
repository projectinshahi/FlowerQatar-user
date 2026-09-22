'use client';

import { startTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onLive, onResync } from '@/lib/live-client';
import { shouldRefresh } from '@/lib/live-events';

/**
 * Re-renders the current page from the server when an admin changes something it shows.
 *
 * router.refresh() re-fetches only the server components of the current route and merges
 * them in: client state (cart, open drawers, form input, selected colour), the URL (filters,
 * sort, category) and the scroll position are all kept. The server has already invalidated
 * its cache before the event was sent (lib/live-sync.ts), so the refresh gets the new data.
 *
 * A hidden tab does no work: it remembers that it is behind and refreshes once when it is
 * shown again. Renders nothing.
 */
export default function LiveUpdates() {
  const router = useRouter();

  useEffect(() => {
    let behind = false;

    const refresh = () => {
      if (document.hidden) {
        behind = true;
        return;
      }
      behind = false;
      startTransition(() => router.refresh());
    };

    const offLive = onLive((event) => {
      if (shouldRefresh(event, window.location.pathname, window.location.search)) refresh();
    });
    // Missed events while disconnected: bring the page up to date once.
    const offResync = onResync(refresh);
    const onVisible = () => {
      if (!document.hidden && behind) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      offLive();
      offResync();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [router]);

  return null;
}
