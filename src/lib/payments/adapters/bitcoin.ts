import type {
  PaymentOrderInput,
  PaymentProvider,
  PaymentRequestResult,
  PaymentStatus,
  WebhookResult,
} from "@/lib/payments/types";

// See @/lib/payments/types#BitcoinInvoice for the `instructions` payload
// shape this adapter will eventually return.

/**
 * Bitcoin via a self-hosted BTCPay Server instance (non-custodial — avoids
 * exchange KYC/custody risk). Scaffolded example adapter, disabled by
 * default and not one of the three decided production providers (NOW
 * Payments, Coinbase Commerce, Wise — see ARCHITECTURE.md#payment-architecture)
 * — kept registered as an optional non-custodial alternative to Coinbase
 * Commerce. Invoice creation and webhook verification would call the BTCPay
 * REST API — see https://docs.btcpayserver.org/API/Greenfield/v1/.
 */
export const bitcoinAdapter: PaymentProvider = {
  id: "bitcoin",

  async createPaymentRequest(_order: PaymentOrderInput): Promise<PaymentRequestResult> {
    if (!process.env.BTCPAY_URL || !process.env.BTCPAY_API_KEY || !process.env.BTCPAY_STORE_ID) {
      throw new Error(
        "Bitcoin adapter is enabled but BTCPAY_URL/BTCPAY_API_KEY/BTCPAY_STORE_ID are not configured.",
      );
    }

    // TODO: POST to `${BTCPAY_URL}/api/v1/stores/${BTCPAY_STORE_ID}/invoices`
    // with { amount: order.total, currency: order.currency, orderId: order.id }.
    throw new Error("BTCPay invoice creation not yet implemented.");
  },

  async checkStatus(_paymentRef: string): Promise<PaymentStatus> {
    // TODO: GET the invoice from BTCPay and map its status
    // (New/Processing/Settled/Expired/Invalid) to our PaymentStatus.
    throw new Error("BTCPay status lookup not yet implemented.");
  },

  async handleWebhook(_payload: unknown): Promise<WebhookResult> {
    // TODO: verify the BTCPay webhook signature header, then map
    // the event type (InvoiceSettled/InvoiceExpired/InvoiceInvalid) to our
    // PaymentStatus. Called from /api/webhooks/btcpay (see API.md).
    throw new Error("BTCPay webhook handling not yet implemented.");
  },
};
