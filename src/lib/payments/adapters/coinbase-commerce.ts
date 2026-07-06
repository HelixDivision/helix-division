import type {
  PaymentOrderInput,
  PaymentProvider,
  PaymentRequestResult,
  PaymentStatus,
  WebhookResult,
} from "@/lib/payments/types";

/**
 * Coinbase Commerce — one of the three decided production providers
 * (alongside NOWPayments and Wise; see ARCHITECTURE.md#payment-architecture).
 * Hosted crypto checkout (BTC/ETH/USDC/etc.), custodial settlement to a
 * Coinbase account — no merchant-category restriction for this catalog.
 *
 * Scaffolded only — real HTTP calls are a future integration (see
 * ROADMAP.md). Requires COINBASE_COMMERCE_API_KEY /
 * COINBASE_COMMERCE_WEBHOOK_SECRET once implemented. API reference:
 * https://docs.cloud.coinbase.com/commerce/reference
 */
export const coinbaseCommerceAdapter: PaymentProvider = {
  id: "coinbase-commerce",

  async createPaymentRequest(_order: PaymentOrderInput): Promise<PaymentRequestResult> {
    if (!process.env.COINBASE_COMMERCE_API_KEY) {
      throw new Error(
        "Coinbase Commerce adapter is enabled but COINBASE_COMMERCE_API_KEY is not configured.",
      );
    }

    // TODO: POST https://api.commerce.coinbase.com/charges with
    // { name: order.orderNumber, local_price: { amount: order.total, currency: order.currency },
    //   pricing_type: "fixed_price", metadata: { orderId: order.id } } — response
    // includes a `hosted_url` to redirect the customer to for a hosted checkout.
    throw new Error("Coinbase Commerce charge creation not yet implemented.");
  },

  async checkStatus(_paymentRef: string): Promise<PaymentStatus> {
    // TODO: GET https://api.commerce.coinbase.com/charges/{code} and map its
    // timeline's latest status (NEW/PENDING/COMPLETED/EXPIRED/UNRESOLVED) to
    // our PaymentStatus.
    throw new Error("Coinbase Commerce status lookup not yet implemented.");
  },

  async handleWebhook(_payload: unknown): Promise<WebhookResult> {
    // TODO: verify the `X-CC-Webhook-Signature` header (HMAC-SHA256 of the raw
    // body using COINBASE_COMMERCE_WEBHOOK_SECRET), then map the event type
    // (charge:confirmed/charge:failed/charge:resolved) to our PaymentStatus.
    // Called from /api/webhooks/coinbase-commerce (see API.md).
    throw new Error("Coinbase Commerce webhook handling not yet implemented.");
  },
};
