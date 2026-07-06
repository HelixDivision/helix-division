import { authorizeAdapter } from "@/lib/payments/adapters/authorize";
import { bitcoinAdapter } from "@/lib/payments/adapters/bitcoin";
import { coinbaseCommerceAdapter } from "@/lib/payments/adapters/coinbase-commerce";
import { manualAdapter } from "@/lib/payments/adapters/manual";
import { nowPaymentsAdapter } from "@/lib/payments/adapters/now-payments";
import { stripeAdapter } from "@/lib/payments/adapters/stripe";
import { wiseAdapter } from "@/lib/payments/adapters/wise";
import type { PaymentProvider } from "@/lib/payments/types";

/**
 * The full adapter registry. Checkout, order services, and the admin payments
 * queue must go through `getEnabledProviders()` / `getProvider()` below —
 * never import an adapter from `adapters/*` directly (see PROJECT_RULES.md#payments).
 * Adding a provider = write the adapter, add it here.
 *
 * Decided production providers: NOW Payments, Coinbase Commerce, and Wise
 * (see ARCHITECTURE.md#payment-architecture). `stripe`/`authorize` remain
 * registered as optional/example adapters for future use — neither is a
 * primary provider for this catalog (Stripe's ToS prohibits research-chemical
 * merchants; Authorize.net is a possible future card-based companion, not a
 * current pick). `bitcoin` (self-hosted BTCPay) also remains registered as
 * an optional non-custodial alternative to Coinbase Commerce.
 */
const registry: Record<string, PaymentProvider> = {
  [wiseAdapter.id]: wiseAdapter,
  [nowPaymentsAdapter.id]: nowPaymentsAdapter,
  [coinbaseCommerceAdapter.id]: coinbaseCommerceAdapter,
  [bitcoinAdapter.id]: bitcoinAdapter,
  [manualAdapter.id]: manualAdapter,
  [stripeAdapter.id]: stripeAdapter,
  [authorizeAdapter.id]: authorizeAdapter,
};

/** Providers enabled via PAYMENT_PROVIDERS_ENABLED (comma-separated ids). */
export function getEnabledProviders(): PaymentProvider[] {
  const enabledIds = (process.env.PAYMENT_PROVIDERS_ENABLED ?? "wise")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return enabledIds.map((id) => {
    const provider = registry[id];
    if (!provider) {
      throw new Error(`Unknown payment provider id "${id}" in PAYMENT_PROVIDERS_ENABLED`);
    }
    return provider;
  });
}

export function getProvider(id: string): PaymentProvider {
  const provider = registry[id];
  if (!provider) {
    throw new Error(`Unknown payment provider id "${id}"`);
  }
  return provider;
}
