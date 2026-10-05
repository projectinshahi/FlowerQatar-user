'use client';

import dynamic from 'next/dynamic';

/*
 * Overlays that render nothing until opened. Loaded on the client right after the page starts,
 * so their code is no longer part of every page's first download. This has to be a client file:
 * next/dynamic called from a Server Component (the layout) does not split the bundle.
 */
const AccountDrawer = dynamic(() => import('./AccountDrawer'), { ssr: false });
const SearchDrawer = dynamic(() => import('./SearchDrawer'), { ssr: false });

export default function DeferredOverlays() {
  return (
    <>
      <AccountDrawer />
      <SearchDrawer />
    </>
  );
}
