import { authorizeAdapter } from "@/lib/payments/adapters/authorize";
import { bitcoinAdapter } from "@/lib/payments/adapters/bitcoin";
import { manualAdapter } from "@/lib/payments/adapters/manual";
import { stripeAdapter } from "@/lib/payments/adapters/stripe";
import { wiseAdapter } from "@/lib/payments/adapters/wise";
import type { PaymentProvider } from "@/lib/payments/types";

/**
 * The full adapter registry. Checkout, order services, and the admin payments
 * queue must go through `getEnabledProviders()` / `getProvider()` below —
 * never import an adapter from `adapters/*` directly (see PROJECT_RULES.md#payments).
 * Adding a provider = write the adapter, add it here.
 */
const registry: Record<string, PaymentProvider> = {
  [wiseAdapter.id]: wiseAdapter,
  [bitcoinAdapter.id]: bitcoinAdapter,
  [manualAdapter.id]: manualAdapter,
  [stripeAdapter.id]: stripeAdapter,
  [authorizeAdapter.id]: authorizeAdapter,
};

/** Providers enabled via PAYMENT_PROVIDERS_ENABLED (comma-separated ids). */
export function getEnabledProviders(): PaymentProvider[] {
  const enabledIds = (process.env.PAYMENT_PROVIDERS_ENABLED ?? "wise,bitcoin")
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
