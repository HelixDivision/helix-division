"use client";

import { useState } from "react";

import { ProductGrid } from "@/components/shop/ProductGrid";
import { QuickViewDialog } from "@/components/shop/QuickViewDialog";
import type { CatalogCategory, CatalogProduct } from "@/types/catalog";

interface ShopResultsProps {
  products: CatalogProduct[];
  categories: CatalogCategory[];
  filtered?: boolean;
}

/** Owns the one bit of client state a shop grid needs — which product's Quick View is open. */
export function ShopResults({ products, categories, filtered }: ShopResultsProps) {
  const [quickViewProduct, setQuickViewProduct] = useState<CatalogProduct | null>(null);

  return (
    <>
      <ProductGrid
        products={products}
        categories={categories}
        filtered={filtered}
        onQuickView={setQuickViewProduct}
      />
      <QuickViewDialog
        product={quickViewProduct}
        onOpenChange={(open) => !open && setQuickViewProduct(null)}
      />
    </>
  );
}
