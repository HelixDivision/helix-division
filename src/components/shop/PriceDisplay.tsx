import { cn, formatCurrency } from "@/lib/utils";

interface PriceDisplayProps {
  /** null = pricing not finalized — renders "Contact for Pricing" instead of a figure. */
  price: number | null;
  compareAtPrice?: number | null;
  currency?: string;
  className?: string;
}

/**
 * Currency formatting + compare-at strike-through — see DESIGN_SYSTEM.md,
 * COMPONENT_GUIDELINES.md reusable UI components.
 *
 * Deliberately plain text (not a Link) even in the "Contact for Pricing"
 * state — this component is used inside ProductCard, which is itself
 * already wrapped in a Link; nesting an anchor here caused invalid HTML and
 * a hydration error. The actual navigation to /contact lives on the card's
 * own action row / AddToCartButton, which are siblings of that Link, not
 * descendants.
 */
export function PriceDisplay({
  price,
  compareAtPrice,
  currency = "USD",
  className,
}: PriceDisplayProps) {
  if (price === null) {
    return (
      <span
        className={cn(
          "text-accent-crimson font-heading text-sm tracking-wide uppercase",
          className,
        )}
      >
        Contact for Pricing
      </span>
    );
  }

  return (
    <span className={cn("flex items-baseline gap-2", className)}>
      <span className="text-foreground-primary font-heading text-base">
        {formatCurrency(price, currency)}
      </span>
      {typeof compareAtPrice === "number" && compareAtPrice > price && (
        <span className="text-foreground-muted text-sm line-through">
          {formatCurrency(compareAtPrice, currency)}
        </span>
      )}
    </span>
  );
}
