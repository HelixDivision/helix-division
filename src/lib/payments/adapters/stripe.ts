import type {
  PaymentOrderInput,
  PaymentProvider,
  PaymentRequestResult,
  PaymentStatus,
  WebhookResult,
} from "@/lib/payments/types";

/**
 * Scaffolded example adapter, disabled by default and not one of the three
 * decided production providers (NOW Payments, Coinbase Commerce, Wise — see
 * ARCHITECTURE.md#payment-architecture) — Stripe's ToS prohibits
 * research-chemical merchants. Kept registered as a real adapter target so
 * it could be enabled later for a non-restricted product line purely via
 * PAYMENT_PROVIDERS_ENABLED, with no checkout changes required.
 */
export const stripeAdapter: PaymentProvider = {
  id: "stripe",

  async createPaymentRequest(_order: PaymentOrderInput): Promise<PaymentRequestResult> {
    throw new Error(
      "Stripe adapter is scaffolded but not implemented. Do not enable without confirming merchant category eligibility.",
    );
  },

  async checkStatus(_paymentRef: string): Promise<PaymentStatus> {
    throw new Error("Stripe adapter not yet implemented.");
  },

  async handleWebhook(_payload: unknown): Promise<WebhookResult> {
    throw new Error("Stripe adapter not yet implemented.");
  },
};
