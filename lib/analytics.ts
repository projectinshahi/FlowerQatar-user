// Thin GA4 wrapper. Every call is a no-op until NEXT_PUBLIC_GA_ID is set and the gtag
// script has loaded, so it's safe to call from anywhere without guards at the call site.

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Send a GA4 event. No-op if GA isn't configured/loaded. */
export function track(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", event, params ?? {});
}

/** SPA page_view — GA doesn't auto-fire these on client-side navigations. */
export function pageview(url: string): void {
  if (typeof window === "undefined" || !window.gtag || !GA_ID) return;
  window.gtag("event", "page_view", { page_path: url });
}
