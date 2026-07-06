"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { QuantitySelector } from "@/components/shop/QuantitySelector";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { getStockStatus } from "@/lib/stock-status";
import type { CatalogProduct } from "@/types/catalog";

interface AddToCartButtonProps {
  product: CatalogProduct;
}

/** Quantity + Add to Cart for the PDP buy box — becomes a "Contact for Pricing" CTA when the variant has no finalized price. */
export function AddToCartButton({ product }: AddToCartButtonProps) {
  const variant = product.variants[0];
  const stockStatus = getStockStatus(variant);
  const { addLine } = useCart();
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
    toast.success(`${quantity} × ${product.name} added to cart`);
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
