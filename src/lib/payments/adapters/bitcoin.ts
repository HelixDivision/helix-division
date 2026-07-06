import type { Order } from "@/generated/prisma/client";
import type {
  PaymentProvider,
  PaymentRequestResult,
  PaymentStatus,
  WebhookResult,
} from "@/lib/payments/types";

export interface BitcoinInvoice {
  invoiceId: string;
  checkoutUrl: string;
  address: string | null;
}

/**
 * Bitcoin via a self-hosted BTCPay Server instance (non-custodial — avoids
 * exchange KYC/custody risk). Invoice creation and webhook verification call
 * the BTCPay REST API — see https://docs.btcpayserver.org/API/Greenfield/v1/.
 * Real HTTP calls are Phase 2 (needs a live BTCPAY_URL/BTCPAY_API_KEY); this
 * is the structural stub matching the PaymentProvider contract.
 */
export const bitcoinAdapter: PaymentProvider = {
  id: "bitcoin",

  async createPaymentRequest(_order: Order): Promise<PaymentRequestResult> {
    if (!process.env.BTCPAY_URL || !process.env.BTCPAY_API_KEY || !process.env.BTCPAY_STORE_ID) {
      throw new Error(
        "Bitcoin adapter is enabled but BTCPAY_URL/BTCPAY_API_KEY/BTCPAY_STORE_ID are not configured.",
      );
    }

    // TODO (Phase 2): POST to `${BTCPAY_URL}/api/v1/stores/${BTCPAY_STORE_ID}/invoices`
    // with { amount: order.total, currency: order.currency, orderId: order.id }.
    throw new Error("BTCPay invoice creation not yet implemented — Phase 2.");
  },

  async checkStatus(_paymentRef: string): Promise<PaymentStatus> {
    // TODO (Phase 2): GET the invoice from BTCPay and map its status
    // (New/Processing/Settled/Expired/Invalid) to our PaymentStatus.
    throw new Error("BTCPay status lookup not yet implemented — Phase 2.");
  },

  async handleWebhook(_payload: unknown): Promise<WebhookResult> {
    // TODO (Phase 2): verify the BTCPay webhook signature header, then map
    // the event type (InvoiceSettled/InvoiceExpired/InvoiceInvalid) to our
    // PaymentStatus. Called from /api/webhooks/btcpay (see API.md).
    throw new Error("BTCPay webhook handling not yet implemented — Phase 2.");
  },
};
