/**
 * Shared types for the payment adapter layer — see API.md#payment-provider-interface
 * and ARCHITECTURE.md#payment-architecture. Nothing outside lib/payments should
 * construct these directly; they're the contract between provider.ts and each
 * adapter.
 */

export type PaymentStatus = "pending" | "submitted" | "confirmed" | "failed";

/**
 * Deliberately a plain domain shape, not the Prisma-generated `Order` type —
 * adapters only ever need these scalar fields, and typing against the ORM's
 * output would couple the payment layer to Prisma even when order data comes
 * from a different repository (see src/server/repositories/order-repository.ts,
 * which is in-memory today). Keeps "swap the repository, touch nothing else"
 * true for the payment layer too.
 */
export interface PaymentOrderInput {
  id: string;
  orderNumber: string;
  email: string;
  total: number;
  currency: string;
}

export interface PaymentRequestResult {
  /** Reference code (Wise), invoice ID (BTCPay), or transaction ID. */
  providerRef: string;
  /** Provider-specific payload the payment step renders (bank details, address/QR, redirect URL). */
  instructions: unknown;
  status: PaymentStatus;
}

export interface WebhookResult {
  providerRef: string;
  status: PaymentStatus;
  confirmedAt?: Date;
}

/**
 * Per-provider `instructions` payload shapes. Declared here (not in the
 * adapter files) so consumers — e.g. the checkout payment page — can render
 * provider-specific UI without importing a named adapter module directly,
 * keeping the payment layer provider-agnostic end to end.
 */
export interface WiseInstructions {
  accountHolder: string;
  iban: string;
  bic: string;
  referenceCode: string;
  amount: string;
  currency: string;
}

export interface BitcoinInvoice {
  invoiceId: string;
  checkoutUrl: string;
  address: string | null;
}

export interface PaymentProvider {
  /** Stable id, matches the `PaymentMethod` enum value (lowercased) and PAYMENT_PROVIDERS_ENABLED entries. */
  id: string;
  createPaymentRequest(order: PaymentOrderInput): Promise<PaymentRequestResult>;
  checkStatus(paymentRef: string): Promise<PaymentStatus>;
  handleWebhook(payload: unknown): Promise<WebhookResult>;
  /** Reserved for providers that support customer-initiated or admin-initiated cancellation. */
  cancelPayment?(paymentRef: string): Promise<void>;
}
