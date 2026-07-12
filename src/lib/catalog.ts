import { db } from "@/lib/db";
import { getStockStatus } from "@/lib/stock-status";
import type {
  CatalogCategory,
  CatalogDocument,
  CatalogImage,
  CatalogProduct,
  CatalogVariant,
  DocumentKind,
  ImageKind,
} from "@/types/catalog";

/**
 * Catalog read/query functions — Prisma-backed (see ARCHITECTURE.md#data--
 * persistence). This module is server-only: it imports `@/lib/db`, which
 * bundles the Prisma client and `pg` driver, neither of which can run in a
 * browser. `"use client"` components must NOT import this file directly —
 * they receive category names / recently-viewed products as props or via a
 * Server Action instead (see ProductCardLink's `categoryName` prop and
 * server/actions/catalog.ts's `getRecentlyViewedProductsAction`).
 *
 * `src/server/services/catalog.ts` re-exports these functions for the
 * "pages read via services" convention — that file needs no changes here,
 * since a re-export of an async function is still just an async function.
 */

export type ProductSort = "featured" | "price-asc" | "price-desc" | "name-asc" | "newest";

/** Storefront inventory filter — matches the status shown on each product card. */
export type StockFilter = "in-stock" | "out-of-stock" | "coming-soon";

export interface GetProductsParams {
  category?: string;
  q?: string;
  sort?: ProductSort;
  stock?: StockFilter;
  page?: number;
  pageSize?: number;
}

export interface GetProductsResult {
  items: CatalogProduct[];
  total: number;
  page: number;
  pageCount: number;
}

const PRODUCT_INCLUDE = {
  category: true,
  variants: true,
  images: { orderBy: { position: "asc" } },
  documents: true,
} as const;

interface PrismaCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  imageAlt: string | null;
  featured: boolean;
  sortOrder: number;
  attributeSchema: unknown;
  parentId: string | null;
}

interface PrismaVariantRow {
  id: string;
  sku: string;
  label: string;
  price: { toString(): string } | null;
  compareAtPrice: { toString(): string } | null;
  attributes: unknown;
  availableQuantity: number;
  lowStockThreshold: number;
  backorderAllowed: boolean;
  restockDate: Date | null;
}

interface PrismaImageRow {
  id: string;
  url: string;
  alt: string;
  position: number;
  kind: string;
}

interface PrismaDocumentRow {
  id: string;
  kind: string;
  label: string;
  url: string;
}

interface PrismaProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  researchSummary: string | null;
  status: CatalogProduct["status"];
  purity: string | null;
  molecularWeight: string | null;
  casNumber: string | null;
  sequence: string | null;
  storageInstructions: string | null;
  labTestingSummary: string | null;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  shippingClass: CatalogProduct["shippingClass"];
  seoTitle: string | null;
  seoDescription: string | null;
  category: PrismaCategoryRow;
  variants: PrismaVariantRow[];
  images: PrismaImageRow[];
  documents: PrismaDocumentRow[];
}

const IMAGE_KIND_FROM_PRISMA: Record<string, ImageKind> = {
  PRIMARY: "primary",
  GALLERY: "gallery",
  LABEL_CLOSEUP: "label-closeup",
  PACKAGING: "packaging",
  LIFESTYLE: "lifestyle",
  COA_PREVIEW: "coa-preview",
};

const DOCUMENT_KIND_FROM_PRISMA: Record<string, DocumentKind> = {
  COA: "coa",
  LAB_REPORT: "lab-report",
  VIDEO: "video",
  OTHER: "other",
};

function toCatalogCategory(row: PrismaCategoryRow): CatalogCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    image: row.image ?? undefined,
    imageAlt: row.imageAlt ?? undefined,
    featured: row.featured,
    sortOrder: row.sortOrder,
    attributeSchema: row.attributeSchema as { key: string; label: string }[],
  };
}

function toCatalogVariant(row: PrismaVariantRow): CatalogVariant {
  return {
    id: row.id,
    sku: row.sku,
    label: row.label,
    price: row.price === null ? null : Number(row.price),
    compareAtPrice: row.compareAtPrice === null ? null : Number(row.compareAtPrice),
    attributes: row.attributes as Record<string, string>,
    availableQuantity: row.availableQuantity,
    lowStockThreshold: row.lowStockThreshold,
    backorderAllowed: row.backorderAllowed,
    restockDate: row.restockDate ? row.restockDate.toISOString() : null,
  };
}

function toCatalogImage(row: PrismaImageRow): CatalogImage {
  return {
    id: row.id,
    url: row.url,
    alt: row.alt,
    position: row.position,
    kind: IMAGE_KIND_FROM_PRISMA[row.kind] ?? "gallery",
  };
}

function toCatalogDocument(row: PrismaDocumentRow): CatalogDocument {
  return {
    id: row.id,
    kind: DOCUMENT_KIND_FROM_PRISMA[row.kind] ?? "other",
    label: row.label,
    url: row.url,
  };
}

function toCatalogProduct(row: PrismaProductRow): CatalogProduct {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    categorySlug: row.category.slug,
    description: row.description,
    researchSummary: row.researchSummary ?? undefined,
    status: row.status,
    purity: row.purity ?? undefined,
    molecularWeight: row.molecularWeight ?? undefined,
    casNumber: row.casNumber ?? undefined,
    sequence: row.sequence ?? undefined,
    storageInstructions: row.storageInstructions ?? undefined,
    labTestingSummary: row.labTestingSummary ?? undefined,
    documents: row.documents.length > 0 ? row.documents.map(toCatalogDocument) : undefined,
    featured: row.featured,
    newArrival: row.newArrival,
    bestSeller: row.bestSeller,
    shippingClass: row.shippingClass,
    seoTitle: row.seoTitle ?? undefined,
    seoDescription: row.seoDescription ?? undefined,
    reviewCount: undefined,
    averageRating: undefined,
    images: row.images.map(toCatalogImage),
    variants: row.variants.map(toCatalogVariant),
  };
}

export async function getCategories(): Promise<CatalogCategory[]> {
  const rows = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toCatalogCategory);
}

/**
 * Homepage "Shop by Category" source — featured categories only, ordered by
 * sortOrder then name. Reads the SAME `categories` table the Admin dashboard
 * writes to (single source of truth): featuring/creating/deleting a category in
 * Admin changes this with no code change. Returns [] when none are featured.
 */
export async function getFeaturedCategories(): Promise<CatalogCategory[]> {
  const rows = await db.category.findMany({
    where: { featured: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toCatalogCategory);
}

export async function getCategoryBySlug(slug: string): Promise<CatalogCategory | undefined> {
  const row = await db.category.findUnique({ where: { slug } });
  return row ? toCatalogCategory(row) : undefined;
}

function matchesQuery(product: CatalogProduct, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    product.name.toLowerCase().includes(needle) ||
    product.description.toLowerCase().includes(needle)
  );
}

// A product's storefront stock status follows its first (default) variant —
// the same variant getStockStatus/ProductCardLink use to render the card badge —
// so filtering matches exactly what the shopper sees on each card.
function matchesStock(product: CatalogProduct, filter: StockFilter): boolean {
  const variant = product.variants[0];
  if (!variant) return filter === "coming-soon";
  const status = getStockStatus(variant);
  switch (filter) {
    case "in-stock":
      return status === "in-stock" || status === "low-stock";
    case "out-of-stock":
      return status === "out-of-stock";
    case "coming-soon":
      return status === "coming-soon";
  }
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

// Filtering/sorting/pagination stays in JS (same logic as the pre-Prisma
// static-array version) rather than moving to SQL — the catalog is small
// (~20 products), and keeping this logic unchanged minimizes behavior drift
// from swapping the data source underneath it.
export async function getProducts(params: GetProductsParams = {}): Promise<GetProductsResult> {
  const { category, q, sort = "featured", stock, page = 1, pageSize = 12 } = params;

  const rows = await db.product.findMany({
    where: {
      status: "ACTIVE",
      ...(category ? { category: { slug: category } } : {}),
    },
    include: PRODUCT_INCLUDE,
  });
  let items = rows.map(toCatalogProduct);
  if (q) items = items.filter((p) => matchesQuery(p, q));
  if (stock) items = items.filter((p) => matchesStock(p, stock));
  items = sortProducts(items, sort);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return { items: pageItems, total, page: safePage, pageCount };
}

export async function getProductBySlug(
  categorySlug: string,
  slug: string,
): Promise<CatalogProduct | undefined> {
  const row = await db.product.findFirst({
    where: { slug, category: { slug: categorySlug } },
    include: PRODUCT_INCLUDE,
  });
  return row ? toCatalogProduct(row) : undefined;
}

export async function getFeaturedProducts(limit = 6): Promise<CatalogProduct[]> {
  const rows = await db.product.findMany({
    where: { status: "ACTIVE", featured: true },
    include: PRODUCT_INCLUDE,
    take: limit,
  });
  return rows.map(toCatalogProduct);
}

export async function getRelatedProducts(
  product: CatalogProduct,
  limit = 4,
): Promise<CatalogProduct[]> {
  const rows = await db.product.findMany({
    where: {
      status: "ACTIVE",
      slug: { not: product.slug },
      category: { slug: product.categorySlug },
    },
    include: PRODUCT_INCLUDE,
    take: limit,
  });
  return rows.map(toCatalogProduct);
}

/** Every {categorySlug, slug} pair — used only by generateStaticParams. */
export async function getAllProductSlugPairs(): Promise<{ categorySlug: string; slug: string }[]> {
  const rows = await db.product.findMany({
    select: { slug: true, category: { select: { slug: true } } },
  });
  return rows.map((row) => ({ categorySlug: row.category.slug, slug: row.slug }));
}
