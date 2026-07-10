"use client";

import { toast } from "sonner";

import { ProductCard } from "@/components/shop/ProductCard";
import { useCart } from "@/hooks/useCart";
import { analyticsService } from "@/lib/analytics";
import { getStockStatus } from "@/lib/stock-status";
import { useUiStore } from "@/store/ui-store";
import type { CatalogProduct } from "@/types/catalog";

interface ProductCardLinkProps {
  product: CatalogProduct;
  /** Display label for product.categorySlug — resolved by the server-rendered
   * ancestor that already has the category list in scope (see ProductGrid,
   * RelatedProducts, RecentlyViewed), never looked up here. Catalog reads are
   * Prisma-backed and server-only now (see lib/catalog.ts). */
  categoryName?: string;
  onQuickView?: (product: CatalogProduct) => void;
}

/**
 * Bridges a CatalogProduct into the presentational ProductCard, wiring
 * Add to Cart (useCart + toast) and Quick View — this is the only place
 * shop grids need client interactivity; ProductGrid/pages stay Server
 * Components.
 */
export function ProductCardLink({ product, categoryName, onQuickView }: ProductCardLinkProps) {
  const variant = product.variants[0];
  const { addLine } = useCart();
  const openCartDrawer = useUiStore((s) => s.openCartDrawer);
  const stockStatus = getStockStatus(variant);
  const image = product.images[0];

  function handleAddToCart() {
    addLine({
      variantId: variant.id,
      quantity: 1,
      name: product.name,
      variantLabel: variant.label,
      price: variant.price ?? 0,
      image: image?.url ?? null,
    });
    analyticsService.track("add_to_cart", { productId: product.id, quantity: 1 });
    toast.success(`${product.name} added to cart`);
    openCartDrawer();
  }

  return (
    <ProductCard
      name={product.name}
      href={`/shop/${product.categorySlug}/${product.slug}`}
      imageUrl={image?.url ?? null}
      imageAlt={image?.alt ?? product.name}
      price={variant.price}
      compareAtPrice={variant.compareAtPrice}
      variantLabel={variant.label}
      category={categoryName}
      stockStatus={stockStatus}
      onAddToCart={handleAddToCart}
      onQuickView={onQuickView ? () => onQuickView(product) : undefined}
    />
  );
}
