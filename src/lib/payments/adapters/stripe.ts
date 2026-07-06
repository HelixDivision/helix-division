import type { Order } from "@/generated/prisma/client";
import type {
  PaymentProvider,
  PaymentRequestResult,
  PaymentStatus,
  WebhookResult,
} from "@/lib/payments/types";

/**
 * Scaffolded, disabled by default — Stripe's ToS prohibits research-chemical
 * merchants (see ARCHITECTURE.md#payment-architecture). Kept as a real
 * adapter target so it can be enabled later (e.g. for a non-restricted
 * product line) purely via PAYMENT_PROVIDERS_ENABLED, with no checkout
 * changes required.
 */
export const stripeAdapter: PaymentProvider = {
  id: "stripe",

  async createPaymentRequest(_order: Order): Promise<PaymentRequestResult> {
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
