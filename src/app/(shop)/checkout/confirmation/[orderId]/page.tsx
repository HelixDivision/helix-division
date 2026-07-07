import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClearCartOnMount } from "@/components/checkout/ClearCartOnMount";
import { ORDER_STATUS_LABELS } from "@/components/checkout/OrderStatusBadge";
import { OrderSummaryCard } from "@/components/checkout/OrderSummaryCard";
import { ShippingAddressCard } from "@/components/checkout/ShippingAddressCard";
import { Button } from "@/components/ui/button";
import { getOrder } from "@/server/services/orders";

export const metadata: Metadata = {
  title: "Order Confirmed | Helix Division",
};

interface ConfirmationPageProps {
  params: Promise<{ orderId: string }>;
}

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
        Order {order.orderNumber} · {ORDER_STATUS_LABELS[order.status] ?? order.status}
      </p>
      <p className="text-foreground-muted mt-1 text-sm">
        A confirmation has been sent to {order.email}.
      </p>

      <div className="mt-8">
        <OrderSummaryCard order={order} />
      </div>
      <div className="mt-6">
        <ShippingAddressCard address={order.shippingAddress} />
      </div>

      <Button className="mt-8" size="lg" render={<Link href="/shop" />} nativeButton={false}>
        Continue Shopping
      </Button>
    </div>
  );
}
