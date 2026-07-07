import { formatCurrency } from "@/lib/utils";
import type { OrderRecord } from "@/server/repositories/order-repository";

/**
 * Order line-items + price breakdown, shared by the checkout confirmation page
 * and the Customer Accounts order-detail page (Phase 8) so the two never drift.
 * Discount/tax rows appear only when non-zero (they compute to 0 today — see
 * ARCHITECTURE.md#service-layer-architecture — but the pipeline is real, so
 * this renders them the moment they aren't). Type-only import of OrderRecord;
 * this stays a pure presentational Server Component.
 */
export function OrderSummaryCard({
  order,
}: {
  order: Pick<
    OrderRecord,
    "items" | "subtotal" | "discount" | "shippingCost" | "tax" | "total" | "currency"
  >;
}) {
  const { currency } = order;
  return (
    <div className="border-border rounded-lg border p-6 text-left">
      <h2 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
        Order Summary
      </h2>
      <div className="mt-4 flex flex-col gap-2">
        {order.items.map((item) => (
          <div key={item.variantId} className="flex justify-between gap-4 text-sm">
            <span className="text-foreground-muted">
              {item.nameSnapshot} ({item.variantLabel}) × {item.quantity}
            </span>
            <span className="text-foreground-primary shrink-0">
              {formatCurrency(item.priceSnapshot * item.quantity, currency)}
            </span>
          </div>
        ))}
      </div>
      <div className="border-border mt-4 flex flex-col gap-2 border-t pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-foreground-muted">Subtotal</span>
          <span className="text-foreground-primary">
            {formatCurrency(order.subtotal, currency)}
          </span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
            <span className="text-foreground-muted">Discount</span>
            <span className="text-foreground-primary">
              −{formatCurrency(order.discount, currency)}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-foreground-muted">Shipping</span>
          <span className="text-foreground-primary">
            {order.shippingCost === 0 ? "Free" : formatCurrency(order.shippingCost, currency)}
          </span>
        </div>
        {order.tax > 0 && (
          <div className="flex justify-between">
            <span className="text-foreground-muted">Tax</span>
            <span className="text-foreground-primary">{formatCurrency(order.tax, currency)}</span>
          </div>
        )}
        <div className="border-border mt-2 flex justify-between border-t pt-2">
          <span className="text-foreground-primary font-heading">Total</span>
          <span className="text-foreground-primary font-heading">
            {formatCurrency(order.total, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
