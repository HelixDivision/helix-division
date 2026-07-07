"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * First-party page-view beacon (Phase 9.5). Fires a PAGE_VIEW to /api/analytics
 * on every client navigation (and initial load), plus a SEARCH event when a
 * shop search term is present. Admin routes are excluded (staff activity isn't
 * storefront traffic). Fire-and-forget; keepalive so it survives navigation.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const query = searchParams.toString();
    const fullPath = query ? `${pathname}?${query}` : pathname;
    if (lastPath.current === fullPath) return;
    lastPath.current = fullPath;

    const post = (body: Record<string, unknown>) => {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {});
    };

    post({ type: "PAGE_VIEW", path: fullPath, referrer: document.referrer || undefined });

    const searchTerm = searchParams.get("q");
    if (searchTerm && (pathname === "/shop" || pathname.startsWith("/shop/"))) {
      post({ type: "SEARCH", path: fullPath, searchTerm });
    }
  }, [pathname, searchParams]);

  return null;
}
