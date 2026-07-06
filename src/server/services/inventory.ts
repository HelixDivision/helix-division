import type { OrderItemRecord } from "@/server/repositories/order-repository";

// Inventory reservation — no real stock persistence yet (per Phase 5 scope),
// but the *timing* of when stock would be held is real and varies by payment
// provider: fast/webhook-confirmable methods reserve at order creation with a
// short hold; slow manual-reconciliation methods reserve at order creation
// with a longer hold; fully manual/offline confirmation doesn't reserve until
// an admin actually confirms payment, since there's no time pressure to
// protect against. See src/server/services/orders.ts for where each call site
// consults getReservationPolicy() to decide when to call reserveInventory().

export type ReservationStrategy = "reserve-on-order" | "reserve-on-payment-confirmed";

export interface ReservationPolicy {
  strategy: ReservationStrategy;
  holdDurationMinutes?: number;
}

const reservationPolicyByProvider: Record<string, ReservationPolicy> = {
  wise: { strategy: "reserve-on-order", holdDurationMinutes: 1440 },
  bitcoin: { strategy: "reserve-on-order", holdDurationMinutes: 60 },
  stripe: { strategy: "reserve-on-order", holdDurationMinutes: 30 },
  authorize: { strategy: "reserve-on-order", holdDurationMinutes: 30 },
  manual: { strategy: "reserve-on-payment-confirmed" },
};

const defaultPolicy: ReservationPolicy = { strategy: "reserve-on-order", holdDurationMinutes: 60 };

export interface InventoryService {
  getReservationPolicy(providerId: string): ReservationPolicy;
  reserveInventory(input: { orderId: string; lines: OrderItemRecord[] }): Promise<void>;
  releaseInventory(orderId: string): Promise<void>;
  confirmInventoryDeduction(orderId: string): Promise<void>;
}

/**
 * No-op today — real stock decrements land once the catalog is Prisma-backed
 * (see src/server/services/catalog.ts's equivalent swap point). Logging
 * stands in for the real reservation/release/deduction calls so the
 * orchestration in orders.ts is fully exercised and visible in dev.
 */
class NoopInventoryService implements InventoryService {
  getReservationPolicy(providerId: string): ReservationPolicy {
    return reservationPolicyByProvider[providerId] ?? defaultPolicy;
  }

  async reserveInventory(input: { orderId: string; lines: OrderItemRecord[] }): Promise<void> {
    console.info(`[inventory] reserve — order ${input.orderId}, ${input.lines.length} line(s)`);
  }

  async releaseInventory(orderId: string): Promise<void> {
    console.info(`[inventory] release — order ${orderId}`);
  }

  async confirmInventoryDeduction(orderId: string): Promise<void> {
    console.info(`[inventory] confirm deduction — order ${orderId}`);
  }
}

export const inventoryService: InventoryService = new NoopInventoryService();
