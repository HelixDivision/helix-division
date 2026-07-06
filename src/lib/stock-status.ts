import type { CatalogVariant, StockStatus } from "@/types/catalog";

/**
 * Derives display stock status from inventory fields — null price always
 * wins as "coming-soon". Framework-agnostic so both server pages and client
 * components (e.g. ProductCardLink) can call it directly.
 */
export function getStockStatus(variant: CatalogVariant): StockStatus {
  if (variant.price === null) return "coming-soon";
  if (variant.availableQuantity <= 0) {
    return variant.backorderAllowed ? "low-stock" : "out-of-stock";
  }
  if (variant.availableQuantity <= variant.lowStockThreshold) return "low-stock";
  return "in-stock";
}
