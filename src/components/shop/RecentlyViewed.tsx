"use client";

import { useEffect } from "react";

import { ProductCardLink } from "@/components/shop/ProductCardLink";
import { ProductCarousel } from "@/components/shop/ProductCarousel";
import { getProductBySlug } from "@/server/services/catalog";
import { useRecentlyViewedStore } from "@/store/recently-viewed-store";
import type { CatalogProduct } from "@/types/catalog";

/** Records the current PDP visit, then shows previously-viewed products (excluding the current one). */
export function RecentlyViewed({ currentProduct }: { currentProduct: CatalogProduct }) {
  const entries = useRecentlyViewedStore((s) => s.entries);
  const addEntry = useRecentlyViewedStore((s) => s.addEntry);

  useEffect(() => {
    addEntry({ categorySlug: currentProduct.categorySlug, productSlug: currentProduct.slug });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProduct.categorySlug, currentProduct.slug]);

  const viewed = entries
    .filter(
      (e) =>
        !(e.categorySlug === currentProduct.categorySlug && e.productSlug === currentProduct.slug),
    )
    .map((e) => getProductBySlug(e.categorySlug, e.productSlug))
    .filter((p): p is CatalogProduct => Boolean(p));

  if (viewed.length === 0) return null;

  return (
    <section>
      <p className="font-heading text-foreground-primary text-xl tracking-wide uppercase sm:text-2xl">
        Recently Viewed
        <span className="bg-accent-crimson ml-4 inline-block h-px w-12 align-middle" />
      </p>
      <div className="mt-8">
        <ProductCarousel>
          {viewed.map((product) => (
            <ProductCardLink key={product.id} product={product} />
          ))}
        </ProductCarousel>
      </div>
    </section>
  );
}
