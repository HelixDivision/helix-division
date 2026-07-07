import { ArrowRight, MapPin, Package, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { OrderStatusBadge } from "@/components/checkout/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { getOrdersForUser } from "@/server/services/orders";

export const metadata: Metadata = {
  title: "Account | Helix Division",
};

const quickLinks = [
  {
    href: "/account/orders",
    label: "Order History",
    description: "Track and review your orders",
    icon: Package,
  },
  {
    href: "/account/addresses",
    label: "Addresses",
    description: "Manage shipping addresses",
    icon: MapPin,
  },
  {
    href: "/account/profile",
    label: "Profile",
    description: "Update your account details",
    icon: UserRound,
  },
];

export default async function AccountDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account");

  const orders = await getOrdersForUser(session.user.id);
  const recentOrders = orders.slice(0, 3);

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="border-border hover:border-accent-crimson/60 hover:bg-background-raised group rounded-lg border p-5 transition-colors"
          >
            <Icon className="text-accent-crimson size-5" />
            <h2 className="font-heading text-foreground-primary mt-3 text-sm tracking-wide uppercase">
              {label}
            </h2>
            <p className="text-foreground-muted mt-1 text-sm">{description}</p>
          </Link>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
            Recent Orders
          </h2>
          {orders.length > 0 && (
            <Link
              href="/account/orders"
              className="text-accent-crimson inline-flex items-center gap-1 text-sm hover:underline"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="border-border mt-4 rounded-lg border p-8 text-center">
            <p className="text-foreground-muted text-sm">You haven&apos;t placed any orders yet.</p>
            <Button className="mt-4" render={<Link href="/shop" />} nativeButton={false}>
              Browse the Catalog
            </Button>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="border-border hover:border-accent-crimson/60 hover:bg-background-raised flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors"
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
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <OrderStatusBadge status={order.status} />
                    <span className="text-foreground-primary text-sm">
                      {formatCurrency(order.total, order.currency)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
