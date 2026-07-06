import type {
  PaymentOrderInput,
  PaymentProvider,
  PaymentRequestResult,
  PaymentStatus,
  WebhookResult,
} from "@/lib/payments/types";

/**
 * Generic offline reconciliation fallback (wire transfer, cash, anything not
 * worth a dedicated adapter). Always requires an admin to mark it confirmed —
 * no automated status source exists by definition.
 */
export const manualAdapter: PaymentProvider = {
  id: "manual",

  async createPaymentRequest(order: PaymentOrderInput): Promise<PaymentRequestResult> {
    return {
      providerRef: order.orderNumber,
      instructions: { note: "Awaiting manual confirmation by an administrator." },
      status: "pending",
    };
  },

  async checkStatus(): Promise<PaymentStatus> {
    return "pending";
  },

  async handleWebhook(): Promise<WebhookResult> {
    throw new Error("The manual provider has no webhook — confirm via the admin payments queue.");
  },
};
