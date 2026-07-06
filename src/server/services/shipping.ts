import { defaultShippingConfig, type ShippingConfig } from "@/lib/shipping-config";

// Shipping cost calculation — deliberately its own service so orders.ts
// never computes shipping itself (see PROJECT_CONTEXT.md Phase 5 notes).
// Config data itself lives in src/lib/shipping-config.ts (client-safe) so a
// display-only estimate on the cart page doesn't need to reach into
// src/server/ before an order exists.

export type { ShippingConfig };
export { defaultShippingConfig };

export interface ShippingService {
  calculateShipping(subtotal: number, config?: ShippingConfig): number;
}

class StandardShippingService implements ShippingService {
  calculateShipping(subtotal: number, config: ShippingConfig = defaultShippingConfig): number {
    return subtotal >= config.freeThreshold ? 0 : config.flatRate;
  }
}

export const shippingService: ShippingService = new StandardShippingService();
