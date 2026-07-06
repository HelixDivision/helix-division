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
 * ARCHITECTURE.md#payment-architecture). Kept registered as a possible
 * future card-based option if one is ever needed; enabling it is a config
 * change (PAYMENT_PROVIDERS_ENABLED + AUTHORIZE_API_LOGIN_ID/
 * AUTHORIZE_TRANSACTION_KEY) plus implementing the HTTP calls below, not a
 * checkout change.
 */
export const authorizeAdapter: PaymentProvider = {
  id: "authorize",

  async createPaymentRequest(_order: PaymentOrderInput): Promise<PaymentRequestResult> {
    throw new Error("Authorize.net adapter not yet implemented.");
  },

  async checkStatus(_paymentRef: string): Promise<PaymentStatus> {
    throw new Error("Authorize.net adapter not yet implemented.");
  },

  async handleWebhook(_payload: unknown): Promise<WebhookResult> {
    throw new Error("Authorize.net adapter not yet implemented.");
  },
};
