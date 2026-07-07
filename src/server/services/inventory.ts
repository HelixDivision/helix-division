import { db } from "@/lib/db";
import type { OrderItemRecord } from "@/server/repositories/order-repository";

// Real inventory management as of Phase 9 (Admin Dashboard) — replaces the
// Phase 5 NoopInventoryService. The *timing* of when stock is held is
// unchanged and still varies by payment provider: fast/webhook-confirmable
// methods reserve at order creation with a short hold; slow manual-
// reconciliation methods reserve at order creation with a longer hold; fully
// manual/offline confirmation doesn't reserve until an admin actually
// confirms payment. See src/server/services/orders.ts for where each call
// site consults getReservationPolicy() to decide when to call
// reserveInventory().
//
// Field semantics (both on ProductVariant — see prisma/schema.prisma):
// - `availableQuantity` — sellable-right-now count. Decremented at
//   reservation, restored on release. This is what the storefront's
//   getStockStatus() reads, so a variant automatically shows "Out of Stock"
//   (and its Add to Cart disables) the moment reservations exhaust it.
// - `stock` — physical on-hand count. Decremented only at
//   confirmInventoryDeduction (payment confirmed → units actually leave
//   inventory). availableQuantity already reflected the sale at reserve
//   time, so the two fields drift apart only while reservations are open.

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

/** Thrown when a reservation can't be satisfied — checkout surfaces `message` to the customer as-is. */
export class InsufficientStockError extends Error {
  constructor(productName: string) {
    super(`"${productName}" no longer has enough stock to complete this order.`);
    this.name = "InsufficientStockError";
  }
}

export interface InventoryService {
  getReservationPolicy(providerId: string): ReservationPolicy;
  /**
   * Read-only availability check run at order creation for EVERY provider —
   * including reserve-on-payment-confirmed ones, whose atomic reservation
   * doesn't happen until later. This is the server-side gate that stops an
   * out-of-stock item from checking out even if a stale client allowed it
   * into the cart. (For reserve-on-order providers the reservation itself
   * re-guards atomically right after; this pre-check just fails fast before
   * an order row exists.)
   */
  assertAvailable(lines: OrderItemRecord[]): Promise<void>;
  reserveInventory(input: { orderId: string; lines: OrderItemRecord[] }): Promise<void>;
  releaseInventory(orderId: string): Promise<void>;
  confirmInventoryDeduction(orderId: string): Promise<void>;
}

class PrismaInventoryService implements InventoryService {
  getReservationPolicy(providerId: string): ReservationPolicy {
    return reservationPolicyByProvider[providerId] ?? defaultPolicy;
  }

  async assertAvailable(lines: OrderItemRecord[]): Promise<void> {
    const variants = await db.productVariant.findMany({
      where: { id: { in: lines.map((line) => line.variantId) } },
      select: { id: true, availableQuantity: true, backorderAllowed: true },
    });
    const byId = new Map(variants.map((variant) => [variant.id, variant]));
    for (const line of lines) {
      const variant = byId.get(line.variantId);
      if (!variant) throw new InsufficientStockError(line.nameSnapshot);
      if (!variant.backorderAllowed && variant.availableQuantity < line.quantity) {
        throw new InsufficientStockError(line.nameSnapshot);
      }
    }
  }

  /**
   * All-or-nothing: every line's decrement runs in one transaction, and each
   * decrement is guarded in the WHERE clause (`availableQuantity >= qty`,
   * skipped for backorder-allowed variants) so two concurrent checkouts can't
   * both take the last unit — the second one's updateMany matches 0 rows and
   * the whole reservation rolls back with InsufficientStockError.
   */
  async reserveInventory(input: { orderId: string; lines: OrderItemRecord[] }): Promise<void> {
    await db.$transaction(async (tx) => {
      for (const line of input.lines) {
        const variant = await tx.productVariant.findUnique({
          where: { id: line.variantId },
          select: { backorderAllowed: true },
        });
        if (!variant) throw new InsufficientStockError(line.nameSnapshot);

        const { count } = await tx.productVariant.updateMany({
          where: {
            id: line.variantId,
            ...(variant.backorderAllowed ? {} : { availableQuantity: { gte: line.quantity } }),
          },
          data: { availableQuantity: { decrement: line.quantity } },
        });
        if (count === 0) throw new InsufficientStockError(line.nameSnapshot);
      }
    });
    console.info(`[inventory] reserved — order ${input.orderId}, ${input.lines.length} line(s)`);
  }

  /** Cancelled before fulfillment — put the reserved units back on sale. Caller (orders.ts) gates this on "was actually reserved" so it can't double-release. */
  async releaseInventory(orderId: string): Promise<void> {
    const items = await db.orderItem.findMany({
      where: { orderId },
      select: { variantId: true, quantity: true },
    });
    await db.$transaction(
      items.map((item) =>
        db.productVariant.update({
          where: { id: item.variantId },
          data: { availableQuantity: { increment: item.quantity } },
        }),
      ),
    );
    console.info(`[inventory] released — order ${orderId}, ${items.length} line(s)`);
  }

  /** Payment confirmed — the units definitively leave physical inventory. availableQuantity was already decremented at reserve time. */
  async confirmInventoryDeduction(orderId: string): Promise<void> {
    const items = await db.orderItem.findMany({
      where: { orderId },
      select: { variantId: true, quantity: true },
    });
    await db.$transaction(
      items.map((item) =>
        db.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        }),
      ),
    );
    console.info(`[inventory] deducted — order ${orderId}, ${items.length} line(s)`);
  }
}

export const inventoryService: InventoryService = new PrismaInventoryService();
