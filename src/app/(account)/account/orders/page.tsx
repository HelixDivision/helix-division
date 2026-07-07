import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { OrderStatusBadge } from "@/components/checkout/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { getOrdersForUser } from "@/server/services/orders";

export const metadata: Metadata = {
  title: "Order History | Helix Division",
};

export default async function OrderHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/orders");

  const orders = await getOrdersForUser(session.user.id);

  return (
    <section>
      <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
        Order History
      </h2>

      {orders.length === 0 ? (
        <div className="border-border mt-4 rounded-lg border p-8 text-center">
          <p className="text-foreground-muted text-sm">
            You haven&apos;t placed any orders yet. Orders you place while signed in will appear
            here.
          </p>
          <Button className="mt-4" render={<Link href="/shop" />} nativeButton={false}>
            Browse the Catalog
          </Button>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="border-border hover:border-accent-crimson/60 hover:bg-background-raised flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-foreground-primary font-heading text-sm">
                    {order.orderNumber}
                  </p>
                  <p className="text-foreground-muted mt-0.5 text-xs">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    {" · "}
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} item
                    {order.items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-foreground-primary text-sm">
                    {formatCurrency(order.total, order.currency)}
                  </span>
                  <ArrowRight className="text-foreground-muted size-4" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
