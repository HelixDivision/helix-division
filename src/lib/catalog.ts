import { categories, products } from "@/lib/data/catalog-data";
import type { CatalogCategory, CatalogProduct } from "@/types/catalog";

/**
 * Catalog read/query functions — framework-agnostic and side-effect-free
 * (per PROJECT_RULES.md's `lib/` convention), so both Server Components
 * (via the src/server/services/catalog.ts re-export, kept for the "pages
 * read via services" convention) and client components that need a
 * client-time lookup (e.g. ProductCardLink resolving a category name,
 * RecentlyViewed resolving products from localStorage-only state) can call
 * these directly without reaching into `src/server/`.
 *
 * Swapping the static array lookups below for real Prisma queries later is
 * the only change needed to go live on a database — but that swap can only
 * happen behind `src/server/services/catalog.ts`, since a real DB client
 * can't be bundled into client code. If/when that swap happens, the client
 * components using this module move to fetching via a Server Action instead.
 */

export type ProductSort = "featured" | "price-asc" | "price-desc" | "name-asc" | "newest";

export interface GetProductsParams {
  category?: string;
  q?: string;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export interface GetProductsResult {
  items: CatalogProduct[];
  total: number;
  page: number;
  pageCount: number;
}

export function getCategories(): CatalogCategory[] {
  return categories;
}

export function getCategoryBySlug(slug: string): CatalogCategory | undefined {
  return categories.find((c) => c.slug === slug);
}

function matchesQuery(product: CatalogProduct, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    product.name.toLowerCase().includes(needle) ||
    product.description.toLowerCase().includes(needle)
  );
}

function sortProducts(items: CatalogProduct[], sort: ProductSort): CatalogProduct[] {
  const priceOf = (p: CatalogProduct) => p.variants[0]?.price ?? null;

  switch (sort) {
    case "price-asc":
    case "price-desc": {
      const priced = items.filter((p) => priceOf(p) !== null);
      const unpriced = items.filter((p) => priceOf(p) === null);
      priced.sort((a, b) => {
        const diff = (priceOf(a) ?? 0) - (priceOf(b) ?? 0);
        return sort === "price-asc" ? diff : -diff;
      });
      return [...priced, ...unpriced];
    }
    case "name-asc":
      return [...items].sort((a, b) => a.name.localeCompare(b.name));
    case "newest":
      return [...items].reverse();
    case "featured":
    default:
      return [...items].sort((a, b) => Number(b.featured) - Number(a.featured));
  }
}

export function getProducts(params: GetProductsParams = {}): GetProductsResult {
  const { category, q, sort = "featured", page = 1, pageSize = 12 } = params;

  let items = products.filter((p) => p.status === "ACTIVE");
  if (category) items = items.filter((p) => p.categorySlug === category);
  if (q) items = items.filter((p) => matchesQuery(p, q));
  items = sortProducts(items, sort);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return { items: pageItems, total, page: safePage, pageCount };
}

export function getProductBySlug(categorySlug: string, slug: string): CatalogProduct | undefined {
  return products.find((p) => p.categorySlug === categorySlug && p.slug === slug);
}

export function getFeaturedProducts(limit = 6): CatalogProduct[] {
  return products.filter((p) => p.featured).slice(0, limit);
}

export function getRelatedProducts(product: CatalogProduct, limit = 4): CatalogProduct[] {
  return products
    .filter((p) => p.categorySlug === product.categorySlug && p.slug !== product.slug)
    .slice(0, limit);
}
