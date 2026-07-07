/**
 * Client-side fire-and-forget analytics beacon (Phase 9.5) — posts a funnel
 * event to /api/analytics. Used by add-to-cart and begin-checkout so the admin
 * dashboard can compute add-to-cart and checkout-completion rates. Never
 * throws; keepalive so it survives the navigation that often follows.
 */
export function beaconAnalytics(
  type: "ADD_TO_CART" | "BEGIN_CHECKOUT",
  extra?: { productId?: string; path?: string },
): void {
  if (typeof window === "undefined") return;
  fetch("/api/analytics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type, ...extra, path: extra?.path ?? window.location.pathname }),
    keepalive: true,
  }).catch(() => {});
}
