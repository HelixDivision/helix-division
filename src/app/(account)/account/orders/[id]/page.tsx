import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { OrderStatusBadge, ORDER_STATUS_LABELS } from "@/components/checkout/OrderStatusBadge";
import { OrderSummaryCard } from "@/components/checkout/OrderSummaryCard";
import { ShippingAddressCard } from "@/components/checkout/ShippingAddressCard";
import { auth } from "@/lib/auth";
import { getOrderForUser } from "@/server/services/orders";

export const metadata: Metadata = {
  title: "Order Details | Helix Division",
};

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/account/orders/${id}`);

  // Ownership-scoped read: getOrderForUser returns null both for a missing
  // order and for one belonging to another customer — so an order that isn't
  // this user's is a 404, never a leak (see orders.ts / order-repository.ts).
  const order = await getOrderForUser(id, session.user.id);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/account/orders"
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
            Placed{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.payment && (
        <div className="border-border rounded-lg border p-6 text-sm">
          <h2 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
            Payment
          </h2>
          <p className="text-foreground-muted mt-3">
            Status: {ORDER_STATUS_LABELS[order.status] ?? order.status}
            {order.payment.providerRef ? ` · Reference ${order.payment.providerRef}` : ""}
          </p>
        </div>
      )}

      <OrderSummaryCard order={order} />
      <ShippingAddressCard address={order.shippingAddress} />
    </div>
  );
}
