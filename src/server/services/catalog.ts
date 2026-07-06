import { getStockStatus } from "@/lib/stock-status";

/**
 * Catalog read layer — Server Components/pages should import from here (the
 * "pages read via services" convention), not from src/lib/catalog.ts
 * directly. The actual query functions live in src/lib/catalog.ts because
 * they're pure/client-safe today (static data); this file just re-exports
 * them so the convention holds and the eventual Prisma swap only touches
 * this file's implementation, not every page that reads catalog data.
 *
 * Client components needing a client-time lookup (ProductCardLink,
 * RecentlyViewed) import src/lib/catalog.ts directly instead — see that
 * file's docblock for why.
 */
export {
  getCategories,
  getCategoryBySlug,
  getFeaturedProducts,
  getProductBySlug,
  getProducts,
  getRelatedProducts,
  type GetProductsParams,
  type GetProductsResult,
  type ProductSort,
} from "@/lib/catalog";

export { getStockStatus };
