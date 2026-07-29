"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GA_ID, pageview } from "@/lib/analytics";

/**
 * GA4 with Consent Mode v2. Renders nothing unless NEXT_PUBLIC_GA_ID is set. analytics_storage
 * defaults to "denied" (GDPR-friendly, cookieless pings); grant it from the privacy toggle by
 * calling gtag('consent','update',{analytics_storage:'granted'}) when the user opts in.
 */
export default function Analytics() {
  const pathname = usePathname();
  const search = useSearchParams();

  // Fire a page_view on every client-side navigation (initial load fires via config).
  useEffect(() => {
    if (!GA_ID) return;
    pageview(pathname + (search.toString() ? `?${search.toString()}` : ""));
  }, [pathname, search]);

  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
          });
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
