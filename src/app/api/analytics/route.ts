import { NextResponse } from "next/server";

import { recordAnalyticsEvent } from "@/server/services/analytics-capture";

/**
 * First-party analytics ingest (Phase 9.5). The client AnalyticsTracker beacons
 * page views + funnel events here; visitor/session cookies are managed
 * server-side in the capture service. Deliberately permissive (any visitor)
 * and best-effort — never blocks the client, never returns detail.
 */

const ALLOWED_TYPES = new Set([
  "PAGE_VIEW",
  "PRODUCT_VIEW",
  "ADD_TO_CART",
  "BEGIN_CHECKOUT",
  "SEARCH",
]);

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const type = typeof payload.type === "string" ? payload.type : "";
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await recordAnalyticsEvent({
    type: type as "PAGE_VIEW" | "PRODUCT_VIEW" | "ADD_TO_CART" | "BEGIN_CHECKOUT" | "SEARCH",
    path: typeof payload.path === "string" ? payload.path.slice(0, 512) : undefined,
    referrer: typeof payload.referrer === "string" ? payload.referrer.slice(0, 512) : undefined,
    searchTerm:
      typeof payload.searchTerm === "string" ? payload.searchTerm.slice(0, 200) : undefined,
    productId: typeof payload.productId === "string" ? payload.productId : undefined,
  });

  return NextResponse.json({ ok: true });
}
