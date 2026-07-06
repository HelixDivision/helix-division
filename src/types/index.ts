// Shared, cross-domain types live here. Domain-specific types (payment, content)
// live next to their domain in lib/ and are re-exported from there — don't
// duplicate them in this file.

export type {
  PaymentProvider,
  PaymentStatus,
  PaymentRequestResult,
  WebhookResult,
} from "@/lib/payments/types";
