import Script from "next/script";

import { env } from "@/lib/env";

/**
 * Google Analytics 4 (Phase 9.5) — the production complement to the first-party
 * capture. Renders nothing unless NEXT_PUBLIC_GA_ID is set, so dev/staging run
 * clean without a GA property. GA covers broad web-analytics depth; the admin
 * Analytics dashboard keeps the store-critical metrics (revenue, funnel, AOV,
 * best-sellers) first-party and queryable against order data.
 */
export function GoogleAnalytics() {
  const gaId = env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
