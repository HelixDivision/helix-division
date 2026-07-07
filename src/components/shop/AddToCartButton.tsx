"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { QuantitySelector } from "@/components/shop/QuantitySelector";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { analyticsService } from "@/lib/analytics";
import { beaconAnalytics } from "@/lib/analytics-beacon";
import { getStockStatus } from "@/lib/stock-status";
import { useUiStore } from "@/store/ui-store";
import type { CatalogProduct } from "@/types/catalog";

interface AddToCartButtonProps {
  product: CatalogProduct;
}

/** Quantity + Add to Cart for the PDP buy box — becomes a "Contact for Pricing" CTA when the variant has no finalized price. */
export function AddToCartButton({ product }: AddToCartButtonProps) {
  const variant = product.variants[0];
  const stockStatus = getStockStatus(variant);
  const { addLine } = useCart();
  const openCartDrawer = useUiStore((s) => s.openCartDrawer);
  const [quantity, setQuantity] = useState(1);

  if (stockStatus === "coming-soon") {
    return (
      <Button variant="outline" size="lg" render={<Link href="/contact" />} nativeButton={false}>
        Contact for Pricing
      </Button>
    );
  }

  const isOutOfStock = stockStatus === "out-of-stock";

  function handleAddToCart() {
    addLine({
      variantId: variant.id,
      quantity,
      name: product.name,
      variantLabel: variant.label,
      price: variant.price ?? 0,
      image: product.images[0]?.url ?? null,
    });
    analyticsService.track("add_to_cart", { productId: product.id, quantity });
    beaconAnalytics("ADD_TO_CART", { productId: product.id });
    toast.success(`${quantity} × ${product.name} added to cart`);
    openCartDrawer();
  }

  return (
    <div className="flex items-center gap-3">
      <QuantitySelector
        quantity={quantity}
        onChange={setQuantity}
        max={variant.availableQuantity || undefined}
        disabled={isOutOfStock}
      />
      <Button variant="outline" size="lg" disabled={isOutOfStock} onClick={handleAddToCart}>
        {isOutOfStock ? "Out of Stock" : "Add to Cart"}
      </Button>
    </div>
  );
}
