import type {
  PaymentOrderInput,
  PaymentProvider,
  PaymentRequestResult,
  PaymentStatus,
  WebhookResult,
} from "@/lib/payments/types";

/**
 * NOWPayments — one of the three decided production providers (alongside
 * Coinbase Commerce and Wise; see ARCHITECTURE.md#payment-architecture).
 * Non-custodial crypto gateway supporting 300+ coins with a hosted invoice
 * flow, so it doesn't carry the same merchant-category restrictions Stripe/
 * Authorize.net do for research-chemical sales.
 *
 * Scaffolded only — real HTTP calls are a future integration (see
 * ROADMAP.md). Requires NOWPAYMENTS_API_KEY / NOWPAYMENTS_IPN_SECRET once
 * implemented. API reference: https://documenter.getpostman.com/view/7907941/S1a32n38
 */
export const nowPaymentsAdapter: PaymentProvider = {
  id: "now-payments",

  async createPaymentRequest(_order: PaymentOrderInput): Promise<PaymentRequestResult> {
    if (!process.env.NOWPAYMENTS_API_KEY) {
      throw new Error("NOWPayments adapter is enabled but NOWPAYMENTS_API_KEY is not configured.");
    }

    // TODO: POST https://api.nowpayments.io/v1/payment with
    // { price_amount: order.total, price_currency: order.currency, order_id: order.id,
    //   order_description: order.orderNumber } — response includes a `payment_id`
    // and `pay_address`/`pay_amount` to render, or use /v1/invoice for a hosted
    // checkout page URL instead of building the UI ourselves.
    throw new Error("NOWPayments payment creation not yet implemented.");
  },

  async checkStatus(_paymentRef: string): Promise<PaymentStatus> {
    // TODO: GET https://api.nowpayments.io/v1/payment/{payment_id} and map its
    // `payment_status` (waiting/confirming/confirmed/sending/finished/failed/
    // refunded/expired) to our PaymentStatus.
    throw new Error("NOWPayments status lookup not yet implemented.");
  },

  async handleWebhook(_payload: unknown): Promise<WebhookResult> {
    // TODO: verify the `x-nowpayments-sig` header (HMAC-SHA512 of the sorted
    // JSON body using NOWPAYMENTS_IPN_SECRET), then map `payment_status` as
    // above. Called from /api/webhooks/now-payments (see API.md).
    throw new Error("NOWPayments webhook handling not yet implemented.");
  },
};
