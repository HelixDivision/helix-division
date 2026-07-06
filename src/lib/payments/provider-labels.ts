// Display labels for payment provider ids — client-safe (no adapter imports,
// so this can be passed from a Server Component into client checkout UI
// without bundling src/lib/payments/adapters/* — those read server-only env
// vars like WISE_IBAN and must never end up in client JS).

export const paymentProviderLabels: Record<string, string> = {
  wise: "Bank Transfer (Wise)",
  "now-payments": "Crypto (NOWPayments)",
  "coinbase-commerce": "Crypto (Coinbase Commerce)",
  bitcoin: "Bitcoin (BTCPay)",
  manual: "Manual / Offline Payment",
  stripe: "Credit Card (Stripe)",
  authorize: "Credit Card (Authorize.net)",
};

export function getPaymentProviderLabel(id: string): string {
  return paymentProviderLabels[id] ?? id;
}
