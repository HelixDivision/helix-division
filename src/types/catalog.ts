// Mirrors prisma/schema.prisma's Category/Product/ProductVariant/ProductImage/
// ProductDocument shapes field-for-field. Kept as a hand-written type today
// because the catalog is served by a static data module (see
// src/lib/data/catalog-data.ts, src/server/services/catalog.ts) — swapping
// that module's internals for real Prisma queries later should be a no-op
// for every consumer of these types.

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type ShippingClass = "STANDARD" | "COLD_CHAIN" | "HAZMAT";
export type DocumentKind = "coa" | "lab-report" | "video" | "other";
export type ImageKind =
  "primary" | "gallery" | "label-closeup" | "packaging" | "lifestyle" | "coa-preview";

/** Derived, not stored — see getStockStatus() in server/services/catalog.ts. */
export type StockStatus = "in-stock" | "low-stock" | "out-of-stock" | "coming-soon";

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  /** Self-relation, mirrors Category.parentId — lets a category be a subcategory of another. */
  parentSlug?: string;
  attributeSchema: { key: string; label: string }[];
}

export interface CatalogVariant {
  id: string;
  sku: string;
  label: string;
  /** null = pricing not finalized yet — UI shows "Contact for Pricing", never an invented number. */
  price: number | null;
  compareAtPrice?: number | null;
  attributes: Record<string, string>;
  // Inventory management — populated incrementally; getStockStatus() derives
  // the simple StockStatus string every component actually consumes.
  availableQuantity: number;
  lowStockThreshold: number;
  backorderAllowed: boolean;
  restockDate: string | null;
}

export interface CatalogImage {
  id: string;
  url: string;
  alt: string;
  position: number;
  kind: ImageKind;
}

export interface CatalogDocument {
  id: string;
  kind: DocumentKind;
  label: string;
  url: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  subcategorySlug?: string;
  description: string;
  researchSummary?: string;
  status: ProductStatus;

  // Research-chemical specifications — optional, rendered with honest
  // fallback copy in the PDP's Specifications section when absent.
  purity?: string;
  molecularWeight?: string;
  casNumber?: string;
  sequence?: string;
  storageInstructions?: string;
  labTestingSummary?: string;
  documents?: CatalogDocument[];

  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  shippingClass: ShippingClass;

  seoTitle?: string;
  seoDescription?: string;

  // Reserved for a future Reviews feature — intentionally unset today (see
  // components/shop/ReviewsSection.tsx). Real Review rows already exist in
  // prisma/schema.prisma.
  reviewCount?: number;
  averageRating?: number;

  images: CatalogImage[];
  variants: CatalogVariant[];
}
