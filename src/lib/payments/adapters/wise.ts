import type { Order } from "@/generated/prisma/client";
import type {
  PaymentProvider,
  PaymentRequestResult,
  PaymentStatus,
  WebhookResult,
} from "@/lib/payments/types";

export interface WiseInstructions {
  accountHolder: string;
  iban: string;
  bic: string;
  referenceCode: string;
  amount: string;
  currency: string;
}

/**
 * Manual bank-transfer reconciliation via Wise. There is no public Wise API
 * usable for this flow, so `checkStatus`/`handleWebhook` are placeholders —
 * the real confirmation path is an admin marking the order paid in the
 * payments queue (Phase 2) after checking the Wise business account.
 */
export const wiseAdapter: PaymentProvider = {
  id: "wise",

  async createPaymentRequest(order: Order): Promise<PaymentRequestResult> {
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
    // No live Wise API call — status only changes via admin action or
    // submitPaymentConfirmation (Phase 2). Callers should read Payment.status
    // from the DB rather than relying on this for Wise.
    return "pending";
  },

  async handleWebhook(): Promise<WebhookResult> {
    throw new Error("Wise has no webhook — reconciliation is manual via the admin payments queue.");
  },
};
