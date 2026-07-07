import { db } from "@/lib/db";

/**
 * Admin Analytics dashboard service (Phase 9.5). Store metrics (revenue, AOV,
 * best-sellers, customer/subscriber growth, sales trend) come from
 * Order/User/NewsletterSubscriber — authoritative and first-party. Traffic +
 * funnel metrics (visitors, page views, sources, device, geo, search,
 * conversion) come from AnalyticsEvent. GA4 (when configured) complements this
 * with deeper web analytics; these are the store-critical numbers kept inside
 * the admin.
 *
 * All windowed by `days` (default 30). Some metrics fetch-and-bucket in JS
 * where SQL date truncation would be awkward; volumes are small at this stage.
 */

const REVENUE_STATUSES = ["PAYMENT_CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export interface NameValue {
  label: string;
  value: number;
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface AnalyticsDashboard {
  rangeDays: number;
  gaConfigured: boolean;
  // Audience
  visitors: number;
  newVisitors: number;
  returningVisitors: number;
  pageViews: number;
  // Commerce
  revenue: number;
  orders: number;
  averageOrderValue: number;
  conversionRate: number; // purchases / visitors
  addToCartRate: number; // sessions with add-to-cart / sessions
  checkoutCompletionRate: number; // purchases / begin-checkouts
  customers: number;
  newCustomers: number;
  subscribers: number;
  newSubscribers: number;
  // Trends + breakdowns
  salesTrend: DailyPoint[];
  bestSellers: NameValue[];
  topPages: NameValue[];
  productPerformance: NameValue[];
  trafficSources: NameValue[];
  deviceBreakdown: NameValue[];
  countries: NameValue[];
  searchTerms: NameValue[];
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function normalizeReferrer(referrer: string | null): string {
  if (!referrer) return "Direct / none";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return referrer.slice(0, 40);
  }
}

export async function getAnalyticsDashboard(days = 30): Promise<AnalyticsDashboard> {
  const since = daysAgo(days);
  const recentEvent = { createdAt: { gte: since } };

  const [pageViews, visitorRows, events, subscribers, newSubscribers, customers, newCustomers] =
    await Promise.all([
      db.analyticsEvent.count({ where: { ...recentEvent, type: "PAGE_VIEW" } }),
      db.analyticsEvent.findMany({
        where: { ...recentEvent, type: "PAGE_VIEW" },
        distinct: ["visitorId"],
        select: { visitorId: true },
      }),
      // Pull the range's events once for grouping/bucketing in JS.
      db.analyticsEvent.findMany({
        where: recentEvent,
        select: {
          type: true,
          visitorId: true,
          sessionId: true,
          path: true,
          referrer: true,
          device: true,
          country: true,
          searchTerm: true,
        },
      }),
      db.newsletterSubscriber.count(),
      db.newsletterSubscriber.count({ where: recentEvent }),
      db.user.count(),
      db.user.count({ where: recentEvent }),
    ]);

  const visitors = visitorRows.length;

  // Returning = visitor seen in range who also has an event before the window.
  const visitorIds = visitorRows.map((v) => v.visitorId);
  let returningVisitors = 0;
  if (visitorIds.length > 0) {
    const earlier = await db.analyticsEvent.findMany({
      where: { visitorId: { in: visitorIds }, createdAt: { lt: since } },
      distinct: ["visitorId"],
      select: { visitorId: true },
    });
    returningVisitors = earlier.length;
  }
  const newVisitors = Math.max(0, visitors - returningVisitors);

  // Funnel from the in-range events.
  const sessionsWithAddToCart = new Set(
    events.filter((e) => e.type === "ADD_TO_CART").map((e) => e.sessionId),
  ).size;
  const totalSessions = new Set(events.map((e) => e.sessionId)).size;
  const beginCheckouts = events.filter((e) => e.type === "BEGIN_CHECKOUT").length;
  const purchases = events.filter((e) => e.type === "PURCHASE").length;

  // Breakdowns via in-JS grouping (page views only where path/source matters).
  const pageViewEvents = events.filter((e) => e.type === "PAGE_VIEW");
  const topPages = tally(pageViewEvents.map((e) => e.path ?? "/")).slice(0, 10);
  const productPerformance = tally(
    pageViewEvents
      .map((e) => e.path ?? "")
      .filter((p) => /^\/shop\/[^/]+\/[^/?]+/.test(p))
      .map((p) => p.split("?")[0]),
  ).slice(0, 8);
  const trafficSources = tally(pageViewEvents.map((e) => normalizeReferrer(e.referrer))).slice(
    0,
    8,
  );
  const deviceBreakdown = tally(pageViewEvents.map((e) => e.device ?? "Unknown"));
  const countries = tally(pageViewEvents.map((e) => e.country ?? "Unknown")).slice(0, 10);
  const searchTerms = tally(
    events.filter((e) => e.type === "SEARCH" && e.searchTerm).map((e) => e.searchTerm as string),
  ).slice(0, 10);

  // Commerce from orders.
  const revenueWhere = {
    status: { in: [...REVENUE_STATUSES] },
    createdAt: { gte: since },
  };
  const [revenueAgg, revenueOrders, bestSellerRows] = await Promise.all([
    db.order.aggregate({ _sum: { total: true }, where: revenueWhere }),
    db.order.findMany({ where: revenueWhere, select: { total: true, createdAt: true } }),
    db.orderItem.groupBy({
      by: ["nameSnapshot"],
      where: { order: revenueWhere },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
  ]);

  const revenue = Number(revenueAgg._sum.total ?? 0);
  const orders = revenueOrders.length;
  const averageOrderValue = orders > 0 ? revenue / orders : 0;

  // Sales trend: bucket revenue orders by day across the window.
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) buckets.set(isoDate(daysAgo(i)), 0);
  for (const o of revenueOrders) {
    const key = isoDate(o.createdAt);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Number(o.total));
  }
  const salesTrend: DailyPoint[] = [...buckets.entries()].map(([date, value]) => ({ date, value }));

  const bestSellers: NameValue[] = bestSellerRows.map((r) => ({
    label: r.nameSnapshot,
    value: r._sum.quantity ?? 0,
  }));

  return {
    rangeDays: days,
    gaConfigured: !!process.env.NEXT_PUBLIC_GA_ID,
    visitors,
    newVisitors,
    returningVisitors,
    pageViews,
    revenue,
    orders,
    averageOrderValue,
    conversionRate: visitors > 0 ? purchases / visitors : 0,
    addToCartRate: totalSessions > 0 ? sessionsWithAddToCart / totalSessions : 0,
    checkoutCompletionRate: beginCheckouts > 0 ? purchases / beginCheckouts : 0,
    customers,
    newCustomers,
    subscribers,
    newSubscribers,
    salesTrend,
    bestSellers,
    topPages,
    productPerformance,
    trafficSources,
    deviceBreakdown,
    countries,
    searchTerms,
  };
}

/** Count occurrences of each label, sorted desc. */
function tally(labels: string[]): NameValue[] {
  const counts = new Map<string, number>();
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}
