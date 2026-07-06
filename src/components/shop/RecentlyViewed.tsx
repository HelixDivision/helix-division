"use client";

import { useEffect, useState } from "react";

import { ProductCardLink } from "@/components/shop/ProductCardLink";
import { ProductCarousel } from "@/components/shop/ProductCarousel";
import {
  getRecentlyViewedProductsAction,
  type RecentlyViewedProductResult,
} from "@/server/actions/catalog";
import { useRecentlyViewedStore } from "@/store/recently-viewed-store";
import type { CatalogProduct } from "@/types/catalog";

/** Records the current PDP visit, then shows previously-viewed products (excluding the current one). */
export function RecentlyViewed({ currentProduct }: { currentProduct: CatalogProduct }) {
  const entries = useRecentlyViewedStore((s) => s.entries);
  const addEntry = useRecentlyViewedStore((s) => s.addEntry);
  const [viewed, setViewed] = useState<RecentlyViewedProductResult[]>([]);

  useEffect(() => {
    addEntry({ categorySlug: currentProduct.categorySlug, productSlug: currentProduct.slug });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProduct.categorySlug, currentProduct.slug]);

  useEffect(() => {
    const others = entries.filter(
      (e) =>
        !(e.categorySlug === currentProduct.categorySlug && e.productSlug === currentProduct.slug),
    );
    // Always resolve through the action (even for an empty list) so setViewed
    // only ever runs inside the async callback, never synchronously in the
    // effect body — Promise.all([]) resolves to [] on its own.
    let cancelled = false;
    getRecentlyViewedProductsAction(others).then((resolved) => {
      if (!cancelled) setViewed(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [entries, currentProduct.categorySlug, currentProduct.slug]);

  if (viewed.length === 0) return null;

  return (
    <section>
      <p className="font-heading text-foreground-primary text-xl tracking-wide uppercase sm:text-2xl">
        Recently Viewed
        <span className="bg-accent-crimson ml-4 inline-block h-px w-12 align-middle" />
      </p>
      <div className="mt-8">
        <ProductCarousel>
          {viewed.map(({ product, categoryName }) => (
            <ProductCardLink key={product.id} product={product} categoryName={categoryName} />
          ))}
        </ProductCarousel>
      </div>
    </section>
  );
}
