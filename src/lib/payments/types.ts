import type { Order } from "@/generated/prisma/client";

/**
 * Shared types for the payment adapter layer — see API.md#payment-provider-interface
 * and ARCHITECTURE.md#payment-architecture. Nothing outside lib/payments should
 * construct these directly; they're the contract between provider.ts and each
 * adapter.
 */

export type PaymentStatus = "pending" | "submitted" | "confirmed" | "failed";

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

export interface PaymentProvider {
  /** Stable id, matches the `PaymentMethod` enum value (lowercased) and PAYMENT_PROVIDERS_ENABLED entries. */
  id: string;
  createPaymentRequest(order: Order): Promise<PaymentRequestResult>;
  checkStatus(paymentRef: string): Promise<PaymentStatus>;
  handleWebhook(payload: unknown): Promise<WebhookResult>;
}
