'use client';

import dynamic from 'next/dynamic';

/*
 * Overlays that render nothing until opened (or, for the welcome popup, until it decides to
 * show). Loaded on the client right after the page starts,
 * so their code is no longer part of every page's first download. This has to be a client file:
 * next/dynamic called from a Server Component (the layout) does not split the bundle.
 */
const AccountDrawer = dynamic(() => import('./AccountDrawer'), { ssr: false });
const SearchDrawer = dynamic(() => import('./SearchDrawer'), { ssr: false });
const CartDrawer = dynamic(() => import('./CartDrawer'), { ssr: false });
const WelcomePopup = dynamic(() => import('./WelcomePopup'), { ssr: false });

export default function DeferredOverlays() {
  return (
    <>
      <AccountDrawer />
      <SearchDrawer />
      <CartDrawer />
      <WelcomePopup />
    </>
  );
}
