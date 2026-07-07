import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderStatusBadge } from "@/components/checkout/OrderStatusBadge";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { getCustomerForAdmin } from "@/server/services/admin-customers";
import { getOrdersForUser } from "@/server/services/orders";

export const metadata: Metadata = {
  title: "Customer | Admin | Helix Division",
};

interface AdminCustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCustomerPage({ params }: AdminCustomerPageProps) {
  const { id } = await params;
  const customer = await getCustomerForAdmin(id);
  if (!customer) notFound();

  const orders = await getOrdersForUser(customer.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/customers"
          className="text-foreground-muted hover:text-foreground-primary inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> Back to customers
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
            {customer.name ?? customer.email}
          </h2>
          <p className="text-foreground-muted mt-1 text-sm">
            {customer.email} · Joined{" "}
            {new Date(customer.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Badge variant={customer.role === "ADMIN" ? "default" : "outline"}>
          {customer.role === "ADMIN" ? "Admin" : "Customer"}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border-border rounded-lg border p-5 text-sm">
          <p className="text-foreground-muted font-heading text-xs tracking-wide uppercase">
            Email verified
          </p>
          <p className="text-foreground-primary mt-2">{customer.emailVerified ? "Yes" : "No"}</p>
        </div>
        <div className="border-border rounded-lg border p-5 text-sm">
          <p className="text-foreground-muted font-heading text-xs tracking-wide uppercase">
            Research acknowledgment
          </p>
          <p className="text-foreground-primary mt-2">
            {customer.researchAcknowledgedAt
              ? new Date(customer.researchAcknowledgedAt).toLocaleDateString("en-US")
              : "Not recorded"}
          </p>
        </div>
        <div className="border-border rounded-lg border p-5 text-sm">
          <p className="text-foreground-muted font-heading text-xs tracking-wide uppercase">
            Orders
          </p>
          <p className="text-foreground-primary mt-2">{customer._count.orders}</p>
        </div>
      </div>

      <section>
        <h3 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
          Order History
        </h3>
        {orders.length === 0 ? (
          <p className="text-foreground-muted mt-3 text-sm">
            No orders placed while signed in to this account.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="border-border hover:border-accent-crimson/60 hover:bg-background-raised flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4 transition-colors"
                >
                  <span className="text-foreground-primary font-heading text-sm">
                    {order.orderNumber}
                  </span>
                  <span className="flex items-center gap-4">
                    <OrderStatusBadge status={order.status} />
                    <span className="text-foreground-primary text-sm">
                      {formatCurrency(order.total, order.currency)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
          Saved Addresses
        </h3>
        {customer.addresses.length === 0 ? (
          <p className="text-foreground-muted mt-3 text-sm">No saved addresses.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {customer.addresses.map((address) => (
              <li key={address.id} className="border-border rounded-lg border p-5">
                <p className="text-foreground-muted text-sm">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                  <br />
                  {address.city}
                  {address.region ? `, ${address.region}` : ""} {address.postalCode}
                  <br />
                  {address.country}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
