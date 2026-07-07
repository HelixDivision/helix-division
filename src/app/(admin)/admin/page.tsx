import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { StatCard } from "@/components/admin/StatCard";
import { OrderStatusBadge } from "@/components/checkout/OrderStatusBadge";
import { formatCurrency } from "@/lib/utils";
import { getDashboardStats } from "@/server/services/admin-dashboard";
import { listOrders } from "@/server/services/orders";

export const metadata: Metadata = {
  title: "Dashboard | Admin | Helix Division",
};

export default async function AdminDashboardPage() {
  const [stats, recent] = await Promise.all([
    getDashboardStats(),
    listOrders({ page: 1, pageSize: 5 }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Confirmed Revenue"
          value={formatCurrency(stats.confirmedRevenue)}
          hint="Orders with verified payment or later"
        />
        <StatCard
          label="Orders"
          value={stats.totalOrders}
          hint={`${stats.awaitingReview} awaiting payment review`}
          tone={stats.awaitingReview > 0 ? "warning" : "default"}
        />
        <StatCard label="Customers" value={stats.customerCount} />
        <StatCard
          label="Products"
          value={stats.productCount}
          hint={`${stats.activeProductCount} live on the storefront`}
        />
        <StatCard
          label="Low / Out of Stock"
          value={stats.lowStockCount}
          hint="Variants at or below their threshold"
          tone={stats.lowStockCount > 0 ? "warning" : "default"}
        />
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
            Recent Orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-accent-crimson inline-flex items-center gap-1 text-sm hover:underline"
          >
            All orders <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {recent.orders.length === 0 ? (
          <div className="border-border mt-4 rounded-lg border p-8 text-center">
            <p className="text-foreground-muted text-sm">No orders yet.</p>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {recent.orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="border-border hover:border-accent-crimson/60 hover:bg-background-raised flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-foreground-primary font-heading text-sm">
                      {order.orderNumber}
                    </p>
                    <p className="text-foreground-muted mt-0.5 truncate text-xs">{order.email}</p>
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
