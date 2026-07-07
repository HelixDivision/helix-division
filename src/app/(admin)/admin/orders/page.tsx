import type { Metadata } from "next";
import Link from "next/link";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { ORDER_STATUS_LABELS, OrderStatusBadge } from "@/components/checkout/OrderStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPaymentProviderLabel } from "@/lib/payments/provider-labels";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/validations/admin";
import type { OrderStatusValue } from "@/server/repositories/order-repository";
import { listOrders } from "@/server/services/orders";

export const metadata: Metadata = {
  title: "Orders | Admin | Helix Division",
};

interface OrdersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function param(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const statusParam = param(params.status);
  const status = ORDER_STATUSES.includes(statusParam as OrderStatusValue)
    ? (statusParam as OrderStatusValue)
    : undefined;

  const { orders, total } = await listOrders({
    status,
    search: param(params.q),
    page: Number(param(params.page) ?? 1) || 1,
    pageSize: 20,
  });

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
        Orders
      </h2>

      <AdminToolbar
        searchPlaceholder="Search order # or email..."
        filters={[
          {
            param: "status",
            label: "Status",
            allLabel: "All statuses",
            options: ORDER_STATUSES.map((value) => ({
              value,
              label: ORDER_STATUS_LABELS[value],
            })),
          },
        ]}
      />

      {orders.length === 0 ? (
        <div className="border-border rounded-lg border p-8 text-center">
          <p className="text-foreground-muted text-sm">No orders match these filters.</p>
        </div>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-foreground-primary font-heading text-sm hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-foreground-muted text-xs">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </TableCell>
                  <TableCell className="text-foreground-muted max-w-48 truncate">
                    {order.email}
                    {order.userId === null && (
                      <span className="text-foreground-muted/70 block text-xs">Guest</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-foreground-muted">
                    {order.payment ? getPaymentProviderLabel(order.payment.method) : "—"}
                  </TableCell>
                  <TableCell className="text-foreground-primary text-right">
                    {formatCurrency(order.total, order.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdminPagination page={Number(param(params.page) ?? 1) || 1} pageSize={20} total={total} />
    </div>
  );
}
