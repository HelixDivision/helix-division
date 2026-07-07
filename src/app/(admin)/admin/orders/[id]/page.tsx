import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderStatusControls } from "@/components/admin/OrderStatusControls";
import { OrderStatusBadge, PAYMENT_STATUS_LABELS } from "@/components/checkout/OrderStatusBadge";
import { OrderSummaryCard } from "@/components/checkout/OrderSummaryCard";
import { ShippingAddressCard } from "@/components/checkout/ShippingAddressCard";
import { getPaymentProviderLabel } from "@/lib/payments/provider-labels";
import { getAllowedTransitions, getOrder } from "@/server/services/orders";

export const metadata: Metadata = {
  title: "Order | Admin | Helix Division",
};

interface AdminOrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderPage({ params }: AdminOrderPageProps) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/orders"
          className="text-foreground-muted hover:text-foreground-primary inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> Back to orders
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
            Order {order.orderNumber}
          </h2>
          <p className="text-foreground-muted mt-1 text-sm">
            {order.email}
            {order.userId === null ? " · Guest checkout" : ""} · Placed{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="border-border rounded-lg border p-6">
        <h3 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
          Actions
        </h3>
        <div className="mt-4">
          <OrderStatusControls
            orderId={order.id}
            status={order.status}
            allowedTransitions={getAllowedTransitions(order.status).filter(
              // SHIPPED requires tracking — reachable via the Mark Shipped dialog only.
              (status) => status !== "SHIPPED",
            )}
          />
        </div>
        <p className="text-foreground-muted mt-4 text-xs">
          Inventory: {order.inventoryReserved ? "reserved" : "not reserved"}
          {order.inventoryDeducted ? " · physically deducted" : ""} — confirming payment reserves
          (if needed) and deducts; cancelling releases reserved stock automatically.
        </p>
      </div>

      {order.payment && (
        <div className="border-border rounded-lg border p-6 text-sm">
          <h3 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
            Payment
          </h3>
          <p className="text-foreground-muted mt-3">
            {getPaymentProviderLabel(order.payment.method)}
            {" · "}
            {PAYMENT_STATUS_LABELS[order.payment.status] ?? order.payment.status}
            {order.payment.providerRef ? ` · Reference ${order.payment.providerRef}` : ""}
            {order.payment.confirmedAt
              ? ` · Confirmed ${new Date(order.payment.confirmedAt).toLocaleString("en-US")}`
              : ""}
          </p>
        </div>
      )}

      {order.trackingNumber && (
        <div className="border-border rounded-lg border p-6 text-sm">
          <h3 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
            Shipment
          </h3>
          <p className="text-foreground-muted mt-3">
            Tracking {order.trackingNumber}
            {order.trackingCarrier ? ` via ${order.trackingCarrier}` : ""}
            {order.shippedAt
              ? ` · Shipped ${new Date(order.shippedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}`
              : ""}
          </p>
        </div>
      )}

      <OrderSummaryCard order={order} />
      <ShippingAddressCard address={order.shippingAddress} />
    </div>
  );
}
