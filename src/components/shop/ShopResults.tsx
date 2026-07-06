"use client";

import { useState } from "react";

import { ProductGrid } from "@/components/shop/ProductGrid";
import { QuickViewDialog } from "@/components/shop/QuickViewDialog";
import type { CatalogProduct } from "@/types/catalog";

/** Owns the one bit of client state a shop grid needs — which product's Quick View is open. */
export function ShopResults({ products }: { products: CatalogProduct[] }) {
  const [quickViewProduct, setQuickViewProduct] = useState<CatalogProduct | null>(null);

  return (
    <>
      <ProductGrid products={products} onQuickView={setQuickViewProduct} />
      <QuickViewDialog
        product={quickViewProduct}
        onOpenChange={(open) => !open && setQuickViewProduct(null)}
      />
    </>
  );
}
