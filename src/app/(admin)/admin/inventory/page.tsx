import type { Metadata } from "next";
import Link from "next/link";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { StockAdjustDialog } from "@/components/admin/StockAdjustDialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listInventoryForAdmin } from "@/server/services/admin-inventory";

export const metadata: Metadata = {
  title: "Inventory | Admin | Helix Division",
};

interface InventoryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function param(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

export default async function AdminInventoryPage({ searchParams }: InventoryPageProps) {
  const params = await searchParams;
  const { variants, total, page, pageSize } = await listInventoryForAdmin({
    search: param(params.q),
    lowStockOnly: param(params.filter) === "low",
    page: Number(param(params.page) ?? 1) || 1,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
          Inventory
        </h2>
        <p className="text-foreground-muted mt-1 text-sm">
          Automatic movements (reserve on order, release on cancel, deduct on payment confirmation)
          happen through the order lifecycle — this table is for manual corrections.
        </p>
      </div>

      <AdminToolbar
        searchPlaceholder="Search SKU or product..."
        filters={[
          {
            param: "filter",
            label: "Stock level",
            allLabel: "All stock levels",
            options: [{ value: "low", label: "Low / out of stock only" }],
          },
        ]}
      />

      {variants.length === 0 ? (
        <div className="border-border rounded-lg border p-8 text-center">
          <p className="text-foreground-muted text-sm">No variants match these filters.</p>
        </div>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product / SKU</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Physical</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => {
                const out = variant.availableQuantity <= 0 && !variant.backorderAllowed;
                const low = !out && variant.availableQuantity <= variant.lowStockThreshold;
                return (
                  <TableRow key={variant.id}>
                    <TableCell>
                      <Link
                        href={`/admin/products/${variant.product.id}`}
                        className="text-foreground-primary text-sm hover:underline"
                      >
                        {variant.product.name}{" "}
                        <span className="text-foreground-muted">({variant.label})</span>
                      </Link>
                      <p className="text-foreground-muted text-xs">{variant.sku}</p>
                    </TableCell>
                    <TableCell
                      className={`text-right ${out ? "text-state-danger" : "text-foreground-primary"}`}
                    >
                      {variant.availableQuantity}
                    </TableCell>
                    <TableCell className="text-foreground-muted text-right">
                      {variant.stock}
                    </TableCell>
                    <TableCell>
                      {out ? (
                        <Badge variant="destructive">Out of stock</Badge>
                      ) : low ? (
                        <Badge variant="secondary">Low stock</Badge>
                      ) : variant.backorderAllowed && variant.availableQuantity <= 0 ? (
                        <Badge variant="secondary">Backorder</Badge>
                      ) : (
                        <Badge variant="outline">In stock</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <StockAdjustDialog
                        variantId={variant.id}
                        productName={variant.product.name}
                        sku={variant.sku}
                        defaults={{
                          availableQuantity: variant.availableQuantity,
                          stock: variant.stock,
                          lowStockThreshold: variant.lowStockThreshold,
                          backorderAllowed: variant.backorderAllowed,
                        }}
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
