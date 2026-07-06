// Cross-cutting event tracking — framework-agnostic (per PROJECT_RULES.md's
// `lib/` convention) since events fire from both client components (product
// view, add to cart) and Server Actions (place order, payment submitted).
// Logs today; swapping in a real analytics provider later only replaces
// ConsoleAnalyticsService.

export type AnalyticsEvent =
  "product_viewed" | "add_to_cart" | "begin_checkout" | "place_order" | "payment_submitted";

export interface AnalyticsService {
  track(event: AnalyticsEvent, payload?: Record<string, unknown>): void;
}

class ConsoleAnalyticsService implements AnalyticsService {
  track(event: AnalyticsEvent, payload?: Record<string, unknown>): void {
    console.info(`[analytics] ${event}`, payload ?? {});
  }
}

export const analyticsService: AnalyticsService = new ConsoleAnalyticsService();
