import { analyticsService } from "@/lib/analytics";
import { getProvider } from "@/lib/payments/provider";
import {
  orderRepository,
  type OrderItemRecord,
  type OrderRecord,
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

  // Order total pipeline: subtotal - discount + shipping + tax = total —
  // each term computed by its own service, never inline here.
  const subtotal = items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);
  const discount = discountService.calculateDiscount({ subtotal });
  const shippingCost = shippingService.calculateShipping(subtotal - discount);
  const tax = taxService.calculateTax({ subtotal, discount, shippingCost });
  const total = subtotal - discount + shippingCost + tax;

  const order = await orderRepository.create({
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
    await inventoryService.reserveInventory({ orderId: order.id, lines: items });
  }

  await notificationService.sendOrderConfirmation(order);
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

  return orderRepository.updateStatus(orderId, "AWAITING_PAYMENT");
}

export async function confirmPaymentSubmitted(orderId: string): Promise<OrderRecord> {
  const order = await orderRepository.findById(orderId);
  if (!order) throw new Error(`Order "${orderId}" not found`);
  if (!order.payment) throw new Error(`Order "${orderId}" has no payment attached`);

  await orderRepository.updatePaymentStatus(orderId, "submitted");
  const updated = await orderRepository.updateStatus(orderId, "PAYMENT_SUBMITTED");

  const policy = inventoryService.getReservationPolicy(order.payment.method);
  if (policy.strategy === "reserve-on-payment-confirmed") {
    await inventoryService.reserveInventory({ orderId, lines: order.items });
  }

  await notificationService.sendPaymentReceived(updated);
  analyticsService.track("payment_submitted", { orderId, orderNumber: order.orderNumber });

  return updated;
}
