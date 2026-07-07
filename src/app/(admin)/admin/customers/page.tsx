import type { Metadata } from "next";
import Link from "next/link";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listCustomersForAdmin } from "@/server/services/admin-customers";

export const metadata: Metadata = {
  title: "Customers | Admin | Helix Division",
};

interface CustomersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function param(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

export default async function AdminCustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;
  const { customers, total, page, pageSize } = await listCustomersForAdmin({
    search: param(params.q),
    page: Number(param(params.page) ?? 1) || 1,
  });

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
        Customers
      </h2>

      <AdminToolbar searchPlaceholder="Search email or name..." />

      {customers.length === 0 ? (
        <div className="border-border rounded-lg border p-8 text-center">
          <p className="text-foreground-muted text-sm">No customers match this search.</p>
        </div>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="text-foreground-primary text-sm hover:underline"
                    >
                      {customer.name ?? customer.email}
                    </Link>
                    {customer.name && (
                      <p className="text-foreground-muted text-xs">{customer.email}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={customer.role === "ADMIN" ? "default" : "outline"}>
                      {customer.role === "ADMIN" ? "Admin" : "Customer"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground-muted">
                    {customer.emailVerified ? "Yes" : "No"}
                  </TableCell>
                  <TableCell className="text-foreground-primary text-right">
                    {customer._count.orders}
                  </TableCell>
                  <TableCell className="text-foreground-muted">
                    {new Date(customer.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdminPagination page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
