import { Plus, Star } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { ProductRowActions } from "@/components/admin/ProductRowActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { listCategoriesForAdmin } from "@/server/services/admin-categories";
import { listProductsForAdmin } from "@/server/services/admin-products";

export const metadata: Metadata = {
  title: "Products | Admin | Helix Division",
};

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function param(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

const STATUS_BADGE: Record<string, "default" | "secondary" | "outline"> = {
  ACTIVE: "default",
  DRAFT: "secondary",
  ARCHIVED: "outline",
};

export default async function AdminProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const status = param(params.status);
  const sort = param(params.sort);
  const categories = await listCategoriesForAdmin();
  const { products, total, page, pageSize } = await listProductsForAdmin({
    search: param(params.q),
    categoryId: param(params.category),
    status: status === "DRAFT" || status === "ACTIVE" || status === "ARCHIVED" ? status : undefined,
    sort: sort === "name" || sort === "updated" ? sort : "newest",
    page: Number(param(params.page) ?? 1) || 1,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
          Products
        </h2>
        <Button render={<Link href="/admin/products/new" />} nativeButton={false}>
          <Plus className="size-4" /> New Product
        </Button>
      </div>

      <AdminToolbar
        searchPlaceholder="Search name or slug..."
        filters={[
          {
            param: "category",
            label: "Category",
            allLabel: "All categories",
            options: categories.map((c) => ({ value: c.id, label: c.name })),
          },
          {
            param: "status",
            label: "Status",
            allLabel: "All statuses",
            options: [
              { value: "ACTIVE", label: "Active" },
              { value: "DRAFT", label: "Draft" },
              { value: "ARCHIVED", label: "Archived" },
            ],
          },
          {
            param: "sort",
            label: "Sort",
            allLabel: "Newest first",
            options: [
              { value: "name", label: "Name A–Z" },
              { value: "updated", label: "Recently updated" },
            ],
          },
        ]}
      />

      {products.length === 0 ? (
        <div className="border-border rounded-lg border p-8 text-center">
          <p className="text-foreground-muted text-sm">No products match these filters.</p>
        </div>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const prices = product.variants
                  .map((v) => (v.price === null ? null : Number(v.price)))
                  .filter((p): p is number => p !== null);
                const totalAvailable = product.variants.reduce(
                  (sum, v) => sum + v.availableQuantity,
                  0,
                );
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="flex items-center gap-3"
                      >
                        {product.images[0] && product.images[0].url.startsWith("/") ? (
                          <span className="bg-background-raised relative block size-10 shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={product.images[0].url}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-contain"
                            />
                          </span>
                        ) : (
                          <span className="bg-background-raised block size-10 shrink-0 rounded-md" />
                        )}
                        <span className="min-w-0">
                          <span className="text-foreground-primary flex items-center gap-1.5 text-sm">
                            {product.name}
                            {product.featured && (
                              <Star
                                className="text-accent-crimson size-3.5 shrink-0"
                                aria-label="Featured"
                              />
                            )}
                          </span>
                          <span className="text-foreground-muted block truncate text-xs">
                            /{product.slug}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-foreground-muted">{product.category.name}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[product.status] ?? "outline"}>
                        {product.status.charAt(0) + product.status.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground-muted">
                      {prices.length === 0
                        ? "Contact for pricing"
                        : prices.length === product.variants.length &&
                            Math.min(...prices) === Math.max(...prices)
                          ? formatCurrency(prices[0])
                          : `from ${formatCurrency(Math.min(...prices))}`}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          totalAvailable === 0 ? "text-state-danger" : "text-foreground-primary"
                        }
                      >
                        {totalAvailable}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ProductRowActions
                        productId={product.id}
                        status={product.status}
                        featured={product.featured}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AdminPagination page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
