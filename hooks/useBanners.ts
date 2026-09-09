'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchJson } from '@/lib/fetch-json';
import { errMsg } from '@/lib/error';

export interface StoreBanner {
  id: string;
  title: string | null;
  subheading: string | null;
  description: string | null;
  titleColor: string | null;
  subheadingColor: string | null;
  descriptionColor: string | null;
  /** One media URL — may be an image or a video. Classify with isVideoMedia(). */
  videoUrl: string;
}

/**
 * Active storefront banners from GET /api/banners.
 *
 * Returns an empty array rather than throwing when the request fails, so a caller can fall back
 * to its own static art without special-casing the error. `fetchJson` is used so an HTML error
 * page (a dev restart, a proxy redirect) surfaces as a readable message instead of a JSON
 * SyntaxError.
 */
export function useBanners() {
  const [data, setData] = useState<StoreBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchJson<{ success: boolean; data?: StoreBanner[]; error?: string }>('/api/banners');
      if (!res?.success || !Array.isArray(res.data)) throw new Error(res?.error || 'Could not load banners');
      setData(res.data.filter((b) => b?.videoUrl));
      setError(null);
    } catch (e) {
      setData([]);
      setError(errMsg(e, 'Could not load banners'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
