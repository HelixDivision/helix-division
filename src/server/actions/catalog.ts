"use server";

import { getCategories, getProductBySlug } from "@/server/services/catalog";
import type { CatalogProduct } from "@/types/catalog";

export interface RecentlyViewedProductResult {
  product: CatalogProduct;
  categoryName: string;
}

/**
 * The only entry point RecentlyViewed.tsx uses. Recently-viewed entries are
 * client-only state (localStorage, see store/recently-viewed-store.ts), so
 * resolving them into full product data can't happen at render time the way
 * server-rendered grids do — this action looks each one up and joins in its
 * category name, since catalog reads are Prisma-backed and server-only now
 * (see lib/catalog.ts's docblock).
 */
export async function getRecentlyViewedProductsAction(
  entries: { categorySlug: string; productSlug: string }[],
): Promise<RecentlyViewedProductResult[]> {
  const categories = await getCategories();
  const categoryNameBySlug = new Map(categories.map((c) => [c.slug, c.name]));

  const resolved = await Promise.all(
    entries.map(async (entry) => {
      const product = await getProductBySlug(entry.categorySlug, entry.productSlug);
      if (!product) return null;
      return { product, categoryName: categoryNameBySlug.get(entry.categorySlug) ?? "" };
    }),
  );

  return resolved.filter((r): r is RecentlyViewedProductResult => r !== null);
}
