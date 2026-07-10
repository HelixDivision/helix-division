import type { VariantProps } from "class-variance-authority";
import { Eye, ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { PriceDisplay } from "@/components/shop/PriceDisplay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductBadge, type productBadgeVariants } from "@/components/ui/product-badge";
import { cn } from "@/lib/utils";
import type { StockStatus } from "@/types/catalog";

const stockStatusLabel: Record<StockStatus, string> = {
  "in-stock": "In Stock",
  "low-stock": "Low Stock",
  "out-of-stock": "Out of Stock",
  "coming-soon": "Coming Soon",
};

const stockStatusClassName: Record<StockStatus, string> = {
  "in-stock": "text-state-success",
  "low-stock": "text-state-warning",
  "out-of-stock": "text-state-danger",
  "coming-soon": "text-foreground-muted",
};

interface ProductCardProps {
  name: string;
  href: string;
  imageUrl: string | null;
  imageAlt: string;
  price: number | null;
  compareAtPrice?: number | null;
  variantLabel?: string;
  badge?: NonNullable<VariantProps<typeof productBadgeVariants>["variant"]>;
  /** Opt-in shop-grid affordances — omitted on the homepage, so those call sites render byte-identical to before. */
  category?: string;
  stockStatus?: StockStatus;
  onAddToCart?: () => void;
  onQuickView?: () => void;
}

/**
 * Product card standard — see DESIGN_SYSTEM.md, COMPONENT_GUIDELINES.md.
 * Presentational only: takes plain props rather than a Prisma model, so it
 * can be used identically from the catalog grid, search results, and
 * FeaturedProducts without coupling to the data layer.
 *
 * `h-full` + the trailing button wrapped in `mt-auto` keeps every card in a
 * row the same height and the "Shop Now" button flush to the bottom
 * regardless of how many lines the name/variant text wraps to — this is what
 * gives the carousel/grid equal card heights without each card needing to
 * know about its siblings.
 */
export function ProductCard({
  name,
  href,
  imageUrl,
  imageAlt,
  price,
  compareAtPrice,
  variantLabel,
  badge,
  category,
  stockStatus,
  onAddToCart,
  onQuickView,
}: ProductCardProps) {
  const isShopCard = Boolean(onAddToCart);

  return (
    <Card className="group/product-card hover:border-accent-gunmetal/40 hover:shadow-elevation-2 flex h-full flex-col gap-0 p-0 transition-all duration-250 hover:-translate-y-1">
      <Link href={href} className="flex flex-col">
        <div className="bg-background-raised relative aspect-square overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-cover transition-transform duration-250 ease-out group-hover/product-card:scale-105"
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : (
            <div
              className="text-foreground-muted/40 flex h-full w-full items-center justify-center"
              aria-label="No product image"
            >
              <ImageOff className="size-10" aria-hidden />
            </div>
          )}
          {badge && <ProductBadge variant={badge} className="absolute top-3 left-3" />}
        </div>

        <div className="flex flex-col gap-1.5 p-4 pb-0">
          {category && (
            <span className="text-foreground-muted text-[0.65rem] tracking-wide uppercase">
              {category}
            </span>
          )}
          {variantLabel && (
            <span className="text-foreground-muted text-xs tracking-wide uppercase">
              {variantLabel}
            </span>
          )}
          <h3 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
            {name}
          </h3>
          <PriceDisplay price={price} compareAtPrice={compareAtPrice} />
          {stockStatus && (
            <span
              className={cn("text-xs font-medium uppercase", stockStatusClassName[stockStatus])}
            >
              {stockStatusLabel[stockStatus]}
            </span>
          )}
        </div>
      </Link>

      {/* mt-auto pins this row to the card bottom regardless of how much text
          renders above it (name/category/stock) — this is what keeps every
          card in a row the same height. */}
      <div className="mt-auto flex gap-2 p-4 pt-3">
        {isShopCard ? (
          <>
            {stockStatus === "coming-soon" ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                render={<Link href="/contact" />}
                nativeButton={false}
              >
                Contact for Pricing
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onAddToCart}
                disabled={stockStatus === "out-of-stock"}
              >
                Add to Cart
              </Button>
            )}
            {onQuickView && stockStatus !== "coming-soon" && (
              <Button
                variant="outline"
                size="icon"
                aria-label={`Quick view ${name}`}
                onClick={onQuickView}
              >
                <Eye />
              </Button>
            )}
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            render={<Link href={href} />}
            nativeButton={false}
          >
            Shop Now
          </Button>
        )}
      </div>
    </Card>
  );
}
