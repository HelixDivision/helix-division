"use client";

import Link from "next/link";

import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { PriceDisplay } from "@/components/shop/PriceDisplay";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormattedText } from "@/components/ui/formatted-text";
import type { CatalogProduct } from "@/types/catalog";

interface QuickViewDialogProps {
  product: CatalogProduct | null;
  onOpenChange: (open: boolean) => void;
}

/** Gallery + info + quantity + Add to Cart for a product, without leaving the grid. */
export function QuickViewDialog({ product, onOpenChange }: QuickViewDialogProps) {
  const variant = product?.variants[0];

  return (
    <Dialog open={Boolean(product)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {product && variant && (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-lg tracking-wide uppercase">
                {product.name}
              </DialogTitle>
              <DialogDescription className="sr-only">{product.description}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 sm:grid-cols-2">
              <ProductGallery images={product.images} productName={product.name} />

              <div className="flex flex-col gap-4">
                <span className="text-foreground-muted text-xs tracking-wide uppercase">
                  {variant.label}
                </span>
                <PriceDisplay price={variant.price} compareAtPrice={variant.compareAtPrice} />
                <FormattedText
                  text={product.description}
                  className="text-foreground-muted text-sm"
                />
                <AddToCartButton product={product} />
                <Button
                  variant="ghost"
                  className="w-fit"
                  render={<Link href={`/shop/${product.categorySlug}/${product.slug}`} />}
                  nativeButton={false}
                >
                  View full details
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
