import { getStockStatus } from "@/lib/stock-status";

/**
 * Catalog read layer — Server Components/pages should import from here (the
 * "pages read via services" convention), not from src/lib/catalog.ts
 * directly, even though that file just re-exports Prisma-backed functions
 * now. Client components must not import either module — see
 * src/lib/catalog.ts's docblock; they receive category names / recently
 * viewed products via props or server/actions/catalog.ts instead.
 */
export {
  getAllProductSlugPairs,
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
