import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClearCartOnMount } from "@/components/checkout/ClearCartOnMount";
import { Button } from "@/components/ui/button";
import { getOrder } from "@/server/services/orders";

export const metadata: Metadata = {
  title: "Order Confirmed | Helix Division",
};

interface ConfirmationPageProps {
  params: Promise<{ orderId: string }>;
}

function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

const statusLabel: Record<string, string> = {
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

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-(--breakpoint-md) px-6 py-12 text-center sm:px-8">
      <ClearCartOnMount />

      <CheckCircle2 className="text-state-success mx-auto size-10" strokeWidth={1.5} />
      <h1 className="font-heading text-foreground-primary mt-4 text-3xl tracking-wide uppercase sm:text-4xl">
        Order Confirmed
      </h1>
      <p className="text-foreground-muted mt-2 text-sm">
        Order {order.orderNumber} · {statusLabel[order.status] ?? order.status}
      </p>
      <p className="text-foreground-muted mt-1 text-sm">
        A confirmation has been sent to {order.email}.
      </p>

      <div className="border-border mt-8 rounded-lg border p-6 text-left">
        <h2 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
          Order Summary
        </h2>
        <div className="mt-4 flex flex-col gap-2">
          {order.items.map((item) => (
            <div key={item.variantId} className="flex justify-between text-sm">
              <span className="text-foreground-muted">
                {item.nameSnapshot} ({item.variantLabel}) × {item.quantity}
              </span>
              <span className="text-foreground-primary">
                {formatPrice(item.priceSnapshot * item.quantity, order.currency)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-border mt-4 flex flex-col gap-2 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-foreground-muted">Subtotal</span>
            <span className="text-foreground-primary">
              {formatPrice(order.subtotal, order.currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-muted">Shipping</span>
            <span className="text-foreground-primary">
              {order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost, order.currency)}
            </span>
          </div>
          <div className="border-border mt-2 flex justify-between border-t pt-2">
            <span className="text-foreground-primary font-heading">Total</span>
            <span className="text-foreground-primary font-heading">
              {formatPrice(order.total, order.currency)}
            </span>
          </div>
        </div>
      </div>

      <div className="border-border mt-6 rounded-lg border p-6 text-left text-sm">
        <h2 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
          Shipping Address
        </h2>
        <p className="text-foreground-muted mt-3">
          {order.shippingAddress.firstName} {order.shippingAddress.lastName}
          <br />
          {order.shippingAddress.line1}
          {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
          <br />
          {order.shippingAddress.city}, {order.shippingAddress.region}{" "}
          {order.shippingAddress.postalCode}
          <br />
          {order.shippingAddress.country}
        </p>
      </div>

      <Button className="mt-8" size="lg" render={<Link href="/shop" />} nativeButton={false}>
        Continue Shopping
      </Button>
    </div>
  );
}
