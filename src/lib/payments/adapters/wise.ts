import type {
  PaymentOrderInput,
  PaymentProvider,
  PaymentRequestResult,
  PaymentStatus,
  WebhookResult,
  WiseInstructions,
} from "@/lib/payments/types";

/**
 * Manual bank-transfer reconciliation via Wise — one of the three decided
 * production providers (alongside NOW Payments and Coinbase Commerce; see
 * ARCHITECTURE.md#payment-architecture). The only fully functional adapter
 * today (no external API needed). There is no public Wise API usable for
 * this flow, so `checkStatus`/`handleWebhook` are placeholders — the real
 * confirmation path is an admin marking the order paid in the admin payments
 * queue (see ROADMAP.md — Admin Dashboard) after checking the Wise business
 * account; `confirmPaymentSubmitted` in server/services/orders.ts only
 * records the customer's claim ("I've sent it"), not admin confirmation.
 */
export const wiseAdapter: PaymentProvider = {
  id: "wise",

  async createPaymentRequest(order: PaymentOrderInput): Promise<PaymentRequestResult> {
    const referenceCode = order.orderNumber;

    const instructions: WiseInstructions = {
      accountHolder: process.env.WISE_ACCOUNT_HOLDER ?? "",
      iban: process.env.WISE_IBAN ?? "",
      bic: process.env.WISE_BIC ?? "",
      referenceCode,
      amount: order.total.toString(),
      currency: order.currency,
    };

    return { providerRef: referenceCode, instructions, status: "pending" };
  },

  async checkStatus(_paymentRef: string): Promise<PaymentStatus> {
    // No live Wise API call — status only changes via confirmPaymentSubmitted
    // (customer claim) or a future admin action (admin confirmation). Callers
    // should read the order's payment status directly rather than relying on
    // this for Wise.
    return "pending";
  },

  async handleWebhook(): Promise<WebhookResult> {
    throw new Error("Wise has no webhook — reconciliation is manual via the admin payments queue.");
  },
};
