import { analyticsService } from "@/lib/analytics";
import { getProvider } from "@/lib/payments/provider";
import {
  orderRepository,
  type FindOrdersParams,
  type FindOrdersResult,
  type OrderAdminStats,
  type OrderItemRecord,
  type OrderRecord,
  type OrderStatusValue,
  type ShippingAddressRecord,
} from "@/server/repositories/order-repository";
import { discountService } from "@/server/services/discounts";
import { inventoryService } from "@/server/services/inventory";
import { notificationService } from "@/server/services/notifications";
import { shippingService } from "@/server/services/shipping";
import { taxService } from "@/server/services/tax";
import type { CartLine } from "@/store/cart-store";

/**
 * Orchestrates order creation and the payment/confirmation lifecycle by
 * composing the repository + the shipping/tax/discount/inventory/
 * notification/analytics services — this is the only file that calls all of
 * them together. Server Actions (src/server/actions/checkout.ts) are the
 * only callers; nothing else reaches into the repository or the payment
 * registry directly (see PROJECT_CONTEXT.md Phase 5 layering rule).
 */

export interface CreateOrderParams {
  // Authoritative owner — passed by the checkout action only when a session
  // exists (see server/actions/checkout.ts). Guest checkouts leave it unset;
  // we never associate an order to a user by matching email after the fact
  // (that would be a Phase 8+ explicit "claim guest order" workflow, not
  // automatic — see ROADMAP.md).
  userId?: string | null;
  email: string;
  cartLines: CartLine[];
  shippingAddress: ShippingAddressRecord;
  researchAcknowledged: boolean;
  providerId: string;
}

export async function createOrder(params: CreateOrderParams): Promise<OrderRecord> {
  const items: OrderItemRecord[] = params.cartLines.map((line) => ({
    variantId: line.variantId,
    nameSnapshot: line.name,
    variantLabel: line.variantLabel,
    priceSnapshot: line.price,
    quantity: line.quantity,
    image: line.image,
  }));

  // Server-side stock gate (Phase 9): every checkout — regardless of the
  // provider's reservation timing — fails fast here if any line is no longer
  // available. This is what actually prevents an out-of-stock purchase; the
  // client's disabled Add to Cart button is UX, not enforcement.
  await inventoryService.assertAvailable(items);

  // Order total pipeline: subtotal - discount + shipping + tax = total —
  // each term computed by its own service, never inline here.
  const subtotal = items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);
  const discount = discountService.calculateDiscount({ subtotal });
  const shippingCost = shippingService.calculateShipping(subtotal - discount);
  const tax = taxService.calculateTax({ subtotal, discount, shippingCost });
  const total = subtotal - discount + shippingCost + tax;

  const order = await orderRepository.create({
    userId: params.userId ?? null,
    email: params.email,
    items,
    subtotal,
    discount,
    shippingCost,
    tax,
    total,
    currency: "USD",
    shippingAddress: params.shippingAddress,
    researchAcknowledged: params.researchAcknowledged,
  });

  // Reservation timing depends on the chosen payment provider — see
  // src/server/services/inventory.ts. Skipped here entirely for providers
  // that only reserve once payment is actually confirmed (Manual today).
  const policy = inventoryService.getReservationPolicy(params.providerId);
  if (policy.strategy === "reserve-on-order") {
    try {
      await inventoryService.reserveInventory({ orderId: order.id, lines: items });
    } catch (error) {
      // Lost a race between assertAvailable and the atomic reserve — don't
      // leave an unfulfillable PENDING order behind.
      await orderRepository.updateStatus(order.id, "CANCELLED");
      throw error;
    }
    await orderRepository.updateInventoryFlags(order.id, { reserved: true });
  }

  await notificationService.sendOrderConfirmation(order, { providerId: params.providerId });
  analyticsService.track("place_order", {
    orderId: order.id,
    orderNumber: order.orderNumber,
    total,
  });

  return order;
}

export async function getOrder(orderId: string): Promise<OrderRecord | null> {
  return orderRepository.findById(orderId);
}

/**
 * Customer Accounts (Phase 8) order-history reads. Ownership-scoped by design
 * — these delegate to the repository's ownership-aware methods rather than
 * fetching by id and checking `userId` here, so the "another user's order is
 * indistinguishable from a missing one" guarantee lives in exactly one place
 * (the repository query). Account pages call these; they never touch the
 * repository or `getOrder`/`findById` directly.
 */
export async function getOrdersForUser(userId: string): Promise<OrderRecord[]> {
  return orderRepository.findOrdersForUser(userId);
}

export async function getOrderForUser(
  orderId: string,
  userId: string,
): Promise<OrderRecord | null> {
  return orderRepository.findOrderForUser(orderId, userId);
}

export async function createPaymentForOrder(
  orderId: string,
  providerId: string,
): Promise<OrderRecord> {
  const order = await orderRepository.findById(orderId);
  if (!order) throw new Error(`Order "${orderId}" not found`);

  // Real call into the provider abstraction — Wise/Manual genuinely work
  // with no database; Bitcoin/Stripe/Authorize throw "not implemented" and
  // the caller (the payment page) is expected to catch that and render a
  // graceful "choose another method" state rather than crash.
  const provider = getProvider(providerId);
  const result = await provider.createPaymentRequest({
    id: order.id,
    orderNumber: order.orderNumber,
    email: order.email,
    total: order.total,
    currency: order.currency,
  });

  await orderRepository.attachPayment(orderId, {
    method: providerId,
    status: result.status,
    providerRef: result.providerRef,
    instructions: result.instructions,
    confirmedAt: null,
  });

  const updated = await orderRepository.updateStatus(orderId, "AWAITING_PAYMENT");

  // Email the customer their bank-transfer (Wise) instructions when the
  // provider returned some — best-effort, never blocks the payment flow.
  if (result.instructions) {
    await notificationService.sendPaymentPending(updated);
  }

  return updated;
}

export async function confirmPaymentSubmitted(orderId: string): Promise<OrderRecord> {
  const order = await orderRepository.findById(orderId);
  if (!order) throw new Error(`Order "${orderId}" not found`);
  if (!order.payment) throw new Error(`Order "${orderId}" has no payment attached`);

  await orderRepository.updatePaymentStatus(orderId, "submitted");
  let updated = await orderRepository.updateStatus(orderId, "PAYMENT_SUBMITTED");

  const policy = inventoryService.getReservationPolicy(order.payment.method);
  if (policy.strategy === "reserve-on-payment-confirmed" && !order.inventoryReserved) {
    await inventoryService.reserveInventory({ orderId, lines: order.items });
    updated = await orderRepository.updateInventoryFlags(orderId, { reserved: true });
  }

  await notificationService.sendPaymentReceived(updated);
  analyticsService.track("payment_submitted", { orderId, orderNumber: order.orderNumber });

  return updated;
}

// ---------------------------------------------------------------------------
// Admin orchestration (Phase 9 — Admin Dashboard). Per ROADMAP.md, admin
// order-status transitions and the Wise "mark payment confirmed"
// reconciliation both go through this file — admin pages/actions never touch
// the repository, the inventory service, or a payment adapter directly.
// ---------------------------------------------------------------------------

export async function listOrders(params: FindOrdersParams): Promise<FindOrdersResult> {
  return orderRepository.findMany(params);
}

export async function getOrderStats(): Promise<OrderAdminStats> {
  return orderRepository.getAdminStats();
}

/**
 * Legal admin transitions. Deliberately a whitelist, not "anything goes" —
 * e.g. a DELIVERED order can only move to REFUNDED, and terminal states have
 * no exits. SHIPPED is reachable only via shipOrder() (which requires a
 * tracking number), not via this map.
 */
const ORDER_STATUS_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDING: ["AWAITING_PAYMENT", "CANCELLED"],
  AWAITING_PAYMENT: ["PAYMENT_SUBMITTED", "PAYMENT_CONFIRMED", "CANCELLED"],
  PAYMENT_SUBMITTED: ["PAYMENT_CONFIRMED", "CANCELLED"],
  PAYMENT_CONFIRMED: ["PROCESSING", "CANCELLED", "REFUNDED"],
  PROCESSING: ["CANCELLED", "REFUNDED"], // → SHIPPED via shipOrder() only
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function getAllowedTransitions(status: OrderStatusValue): OrderStatusValue[] {
  return ORDER_STATUS_TRANSITIONS[status] ?? [];
}

/**
 * Admin status transition with the inventory/payment side effects each edge
 * implies:
 * - → PAYMENT_CONFIRMED: payment marked confirmed (the Wise reconciliation
 *   step); inventory reserved first if it never was (e.g. a manual-provider
 *   order confirmed straight from AWAITING_PAYMENT — may throw
 *   InsufficientStockError), then physically deducted (once, gated by the
 *   deducted flag).
 * - → CANCELLED: reserved-but-not-deducted inventory is released back to
 *   sale. Already-deducted stock is NOT auto-restocked (returns may not be
 *   resellable) — restock manually via Admin → Inventory if appropriate.
 * - → REFUNDED: no automatic restock, same reasoning.
 */
export async function updateOrderStatusAsAdmin(
  orderId: string,
  nextStatus: OrderStatusValue,
): Promise<OrderRecord> {
  const order = await orderRepository.findById(orderId);
  if (!order) throw new Error(`Order "${orderId}" not found`);

  if (!getAllowedTransitions(order.status).includes(nextStatus)) {
    throw new Error(`Cannot move an order from ${order.status} to ${nextStatus}.`);
  }

  if (nextStatus === "PAYMENT_CONFIRMED") {
    if (!order.inventoryReserved) {
      await inventoryService.reserveInventory({ orderId, lines: order.items });
      await orderRepository.updateInventoryFlags(orderId, { reserved: true });
    }
    if (!order.inventoryDeducted) {
      await inventoryService.confirmInventoryDeduction(orderId);
      await orderRepository.updateInventoryFlags(orderId, { deducted: true });
    }
    if (order.payment) {
      await orderRepository.updatePaymentStatus(orderId, "confirmed", {
        confirmedAt: new Date(),
      });
    }
  }

  if (nextStatus === "CANCELLED" && order.inventoryReserved && !order.inventoryDeducted) {
    await inventoryService.releaseInventory(orderId);
    await orderRepository.updateInventoryFlags(orderId, { reserved: false });
  }

  return orderRepository.updateStatus(orderId, nextStatus);
}

/** PROCESSING → SHIPPED with tracking details; sends the shipment notification. */
export async function shipOrder(
  orderId: string,
  shipping: { trackingNumber: string; trackingCarrier?: string },
): Promise<OrderRecord> {
  const order = await orderRepository.findById(orderId);
  if (!order) throw new Error(`Order "${orderId}" not found`);
  if (order.status !== "PROCESSING") {
    throw new Error(`Only a PROCESSING order can be shipped (this one is ${order.status}).`);
  }

  await orderRepository.updateShipping(orderId, {
    trackingNumber: shipping.trackingNumber,
    trackingCarrier: shipping.trackingCarrier ?? null,
    shippedAt: new Date(),
  });
  const updated = await orderRepository.updateStatus(orderId, "SHIPPED");
  await notificationService.sendShipmentNotification(updated);
  return updated;
}
