import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/**
 * Admin inventory management (Phase 9) — the manual-adjustment counterpart to
 * the order-flow InventoryService (server/services/inventory.ts). That file
 * owns automatic movements (reserve/release/deduct as orders progress); this
 * one owns deliberate admin corrections (recounts, restocks, damaged goods).
 * Field semantics are documented in inventory.ts: `availableQuantity` is the
 * sellable-now count the storefront reads; `stock` is the physical count.
 */

export interface AdminInventoryListParams {
  search?: string;
  lowStockOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listInventoryForAdmin(params: AdminInventoryListParams) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;
  const where: Prisma.ProductVariantWhereInput = {
    ...(params.search
      ? {
          OR: [
            { sku: { contains: params.search, mode: "insensitive" } },
            { product: { name: { contains: params.search, mode: "insensitive" } } },
          ],
        }
      : {}),
    // "Low stock" = at-or-below the variant's own threshold (matches the
    // storefront's low-stock badge condition in lib/stock-status.ts).
    ...(params.lowStockOnly
      ? { availableQuantity: { lte: db.productVariant.fields.lowStockThreshold } }
      : {}),
  };

  const [variants, total] = await Promise.all([
    db.productVariant.findMany({
      where,
      include: { product: { select: { id: true, name: true, slug: true, status: true } } },
      orderBy: [{ availableQuantity: "asc" }, { sku: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.productVariant.count({ where }),
  ]);
  return { variants, total, page, pageSize };
}

export async function getLowStockCount(): Promise<number> {
  return db.productVariant.count({
    where: { availableQuantity: { lte: db.productVariant.fields.lowStockThreshold } },
  });
}

export interface StockAdjustmentInput {
  /** New sellable-now count (what the storefront's stock status derives from). */
  availableQuantity: number;
  /** New physical on-hand count. */
  stock: number;
  lowStockThreshold: number;
  backorderAllowed: boolean;
}

/**
 * Absolute set, not a delta — the admin types the counts they physically
 * verified, which is unambiguous under concurrent order activity in a way
 * "+5" isn't. Logged so manual corrections are traceable alongside the
 * automatic [inventory] reserve/release/deduct log lines.
 */
export async function adjustStock(variantId: string, input: StockAdjustmentInput) {
  const variant = await db.productVariant.update({
    where: { id: variantId },
    data: {
      availableQuantity: input.availableQuantity,
      stock: input.stock,
      lowStockThreshold: input.lowStockThreshold,
      backorderAllowed: input.backorderAllowed,
    },
    include: { product: { select: { name: true } } },
  });
  console.info(
    `[inventory] manual adjustment — ${variant.product.name} (${variant.sku}): available=${input.availableQuantity}, stock=${input.stock}`,
  );
  return variant;
}
