import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Product-state badge — see COMPONENT_GUIDELINES.md#worked-example-adding-productbadge.
 * A primitive (not shop-domain-aware): ProductCard passes `variant` based on
 * product data, this component has no knowledge of "products."
 */
const productBadgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap uppercase tracking-wide",
  {
    variants: {
      variant: {
        new: "border-accent-crimson/40 bg-accent-crimson/10 text-accent-crimson",
        limited: "border-accent-bronze/40 bg-accent-bronze/10 text-accent-bronze",
        "research-grade": "border-state-success/40 bg-state-success/10 text-state-success",
        "out-of-stock": "border-border bg-transparent text-foreground-muted",
      },
      size: {
        sm: "h-5 text-[0.65rem]",
        md: "h-6 text-xs",
      },
    },
    defaultVariants: {
      variant: "new",
      size: "sm",
    },
  },
);

const productBadgeLabels: Record<
  NonNullable<VariantProps<typeof productBadgeVariants>["variant"]>,
  string
> = {
  new: "New",
  limited: "Limited",
  "research-grade": "Research Grade",
  "out-of-stock": "Out of Stock",
};

interface ProductBadgeProps
  extends React.ComponentProps<"span">, VariantProps<typeof productBadgeVariants> {}

function ProductBadge({
  className,
  variant = "new",
  size = "sm",
  children,
  ...props
}: ProductBadgeProps) {
  return (
    <span
      data-slot="product-badge"
      className={cn(productBadgeVariants({ variant, size }), className)}
      {...props}
    >
      {children ?? (variant ? productBadgeLabels[variant] : null)}
    </span>
  );
}

export { ProductBadge, productBadgeVariants };
