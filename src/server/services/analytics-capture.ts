import { cookies, headers } from "next/headers";

import type { AnalyticsEventType, DeviceType } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/**
 * First-party analytics capture (Phase 9.5). Records AnalyticsEvent rows that
 * power the admin Analytics dashboard's traffic/funnel/device/geo/search
 * metrics (store metrics like revenue come from Order/User instead). GA4 is a
 * documented complement (NEXT_PUBLIC_GA_ID), not a replacement — these
 * first-party events keep the important numbers inside the admin, queryable
 * against real order data, with no third-party dependency.
 *
 * Identity is cookie-based: `hd_vid` (1-year, distinguishes unique vs
 * returning visitors) and `hd_sid` (session, ~30 min inactivity window,
 * groups a visit). Both are set here if missing. No PII is stored.
 */

const VISITOR_COOKIE = "hd_vid";
const SESSION_COOKIE = "hd_sid";
const SESSION_MAX_AGE = 30 * 60; // 30 minutes, refreshed on each event
const VISITOR_MAX_AGE = 365 * 24 * 60 * 60;

function newId(): string {
  return crypto.randomUUID();
}

function deviceFromUA(ua: string | null): DeviceType | null {
  if (!ua) return null;
  if (/mobile|iphone|android(?!.*tablet)/i.test(ua)) return "MOBILE";
  if (/ipad|tablet/i.test(ua)) return "TABLET";
  return "DESKTOP";
}

/** Reads (and refreshes/creates) the visitor + session cookies. Server-action/route context only. */
export async function getAnalyticsIdentity(): Promise<{ visitorId: string; sessionId: string }> {
  const store = await cookies();
  let visitorId = store.get(VISITOR_COOKIE)?.value;
  let sessionId = store.get(SESSION_COOKIE)?.value;

  if (!visitorId) {
    visitorId = newId();
    store.set(VISITOR_COOKIE, visitorId, {
      maxAge: VISITOR_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }
  if (!sessionId) {
    sessionId = newId();
  }
  // Always refresh the session TTL so it rolls with activity.
  store.set(SESSION_COOKIE, sessionId, {
    maxAge: SESSION_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return { visitorId, sessionId };
}

export interface RecordEventInput {
  type: AnalyticsEventType;
  path?: string;
  referrer?: string;
  searchTerm?: string;
  productId?: string;
  orderId?: string;
  value?: number;
}

export async function recordAnalyticsEvent(input: RecordEventInput): Promise<void> {
  const { visitorId, sessionId } = await getAnalyticsIdentity();
  const headerList = await headers();
  const device = deviceFromUA(headerList.get("user-agent"));
  // Vercel/Netlify set a geo country header in production; null in local dev.
  const country = headerList.get("x-vercel-ip-country") ?? headerList.get("x-country") ?? null;

  try {
    await db.analyticsEvent.create({
      data: {
        type: input.type,
        visitorId,
        sessionId,
        path: input.path ?? null,
        referrer: input.referrer ?? null,
        device,
        country,
        searchTerm: input.searchTerm ?? null,
        productId: input.productId ?? null,
        orderId: input.orderId ?? null,
        value: input.value ?? null,
      },
    });
  } catch {
    // Analytics must never break a user flow — swallow write failures.
  }
}
