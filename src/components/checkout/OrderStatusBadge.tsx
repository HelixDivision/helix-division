import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/lib/payments/types";
import type { OrderStatusValue } from "@/server/repositories/order-repository";

/**
 * Human-readable label + badge tone for an OrderStatus, shared by the checkout
 * confirmation page and the Customer Accounts order history/detail views
 * (Phase 8) so status wording/colouring stays consistent everywhere an order
 * is shown. Type-only import of OrderStatusValue — no runtime coupling to the
 * repository.
 */

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  PENDING: "Pending",
  AWAITING_PAYMENT: "Awaiting Payment",
  PAYMENT_SUBMITTED: "Payment Submitted",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const STATUS_VARIANT: Record<OrderStatusValue, BadgeVariant> = {
  PENDING: "outline",
  AWAITING_PAYMENT: "secondary",
  PAYMENT_SUBMITTED: "secondary",
  PAYMENT_CONFIRMED: "default",
  PROCESSING: "default",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export function OrderStatusBadge({ status }: { status: OrderStatusValue }) {
  return <Badge variant={STATUS_VARIANT[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}

/** Payment-status wording (distinct from OrderStatus) — shared by the account and admin order-detail pages. */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  submitted: "Submitted — awaiting confirmation",
  confirmed: "Confirmed",
  failed: "Failed",
};
