import { PackageSearch } from "lucide-react";

import { StaggerReveal } from "@/components/motion/StaggerReveal";
import { ProductCardLink } from "@/components/shop/ProductCardLink";
import type { CatalogCategory, CatalogProduct } from "@/types/catalog";

interface ProductGridProps {
  products: CatalogProduct[];
  /** Full category list, already fetched server-side by every caller (for
   * ShopFilters) — used only to resolve each product's display category
   * name; catalog reads themselves stay server-only (see lib/catalog.ts). */
  categories: CatalogCategory[];
  onQuickView?: (product: CatalogProduct) => void;
}

/** Responsive product grid + honest empty state — no fabricated products for categories that don't have any yet. */
export function ProductGrid({ products, categories, onQuickView }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="border-border flex flex-col items-center gap-3 rounded-lg border border-dashed py-20 text-center">
        <PackageSearch className="text-foreground-muted size-8" strokeWidth={1.5} />
        <p className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
          No products in this category yet
        </p>
        <p className="text-foreground-muted max-w-xs text-sm">
          Check back soon — new products are added regularly.
        </p>
      </div>
    );
  }

  return (
    <StaggerReveal className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCardLink
          key={product.id}
          product={product}
          categoryName={categories.find((c) => c.slug === product.categorySlug)?.name}
          onQuickView={onQuickView}
        />
      ))}
    </StaggerReveal>
  );
}
