'use client';

import { startTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
 *
 * The Socket.IO client is imported on mount rather than at the top of the file: this
 * component is on every page, so a static import put it in every page's first download.
 */
export default function LiveUpdates() {
  const router = useRouter();

  useEffect(() => {
    let behind = false;
    let unsubscribe: (() => void) | null = null;
    let disposed = false;

    const refresh = () => {
      if (document.hidden) {
        behind = true;
        return;
      }
      behind = false;
      startTransition(() => router.refresh());
    };

    import('@/lib/live-client').then(({ onLive, onResync }) => {
      if (disposed) return;
      const offLive = onLive((event) => {
        if (shouldRefresh(event, window.location.pathname, window.location.search)) refresh();
      });
      // Missed events while disconnected: bring the page up to date once.
      const offResync = onResync(refresh);
      unsubscribe = () => {
        offLive();
        offResync();
      };
    });
    const onVisible = () => {
      if (!document.hidden && behind) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      disposed = true;
      unsubscribe?.();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [router]);

  return null;
}
