import type { Order } from "@/generated/prisma/client";
import type {
  PaymentProvider,
  PaymentRequestResult,
  PaymentStatus,
  WebhookResult,
} from "@/lib/payments/types";

/**
 * Scaffolded, disabled by default — Authorize.net is high-risk-merchant
 * friendly and is the recommended fallback if Wise/Bitcoin need a card-based
 * companion later (see ARCHITECTURE.md#payment-architecture). Enable via
 * PAYMENT_PROVIDERS_ENABLED once AUTHORIZE_API_LOGIN_ID/AUTHORIZE_TRANSACTION_KEY
 * are configured and this adapter's HTTP integration is implemented.
 */
export const authorizeAdapter: PaymentProvider = {
  id: "authorize",

  async createPaymentRequest(_order: Order): Promise<PaymentRequestResult> {
    throw new Error("Authorize.net adapter not yet implemented — Phase 2.");
  },

  async checkStatus(_paymentRef: string): Promise<PaymentStatus> {
    throw new Error("Authorize.net adapter not yet implemented — Phase 2.");
  },

  async handleWebhook(_payload: unknown): Promise<WebhookResult> {
    throw new Error("Authorize.net adapter not yet implemented — Phase 2.");
  },
};
