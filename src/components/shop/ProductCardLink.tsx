"use client";

import { toast } from "sonner";

import { ProductCard } from "@/components/shop/ProductCard";
import { useCart } from "@/hooks/useCart";
import { analyticsService } from "@/lib/analytics";
import { getCategoryBySlug } from "@/lib/catalog";
import { getStockStatus } from "@/lib/stock-status";
import { useUiStore } from "@/store/ui-store";
import type { CatalogProduct } from "@/types/catalog";

interface ProductCardLinkProps {
  product: CatalogProduct;
  onQuickView?: (product: CatalogProduct) => void;
}

/**
 * Bridges a CatalogProduct into the presentational ProductCard, wiring
 * Add to Cart (useCart + toast) and Quick View — this is the only place
 * shop grids need client interactivity; ProductGrid/pages stay Server
 * Components.
 */
export function ProductCardLink({ product, onQuickView }: ProductCardLinkProps) {
  const variant = product.variants[0];
  const category = getCategoryBySlug(product.categorySlug);
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
      imageUrl={image?.url ?? "/products/bpc-157.png"}
      imageAlt={image?.alt ?? product.name}
      price={variant.price}
      compareAtPrice={variant.compareAtPrice}
      variantLabel={variant.label}
      category={category?.name}
      stockStatus={stockStatus}
      onAddToCart={handleAddToCart}
      onQuickView={onQuickView ? () => onQuickView(product) : undefined}
    />
  );
}
