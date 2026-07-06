import type { ComponentProps } from "react";

/** Screen-reader-only content — see DESIGN_SYSTEM.md#accessibility. Use for icon-only control labels instead of a one-off `sr-only` span. */
export function VisuallyHidden({ className, ...props }: ComponentProps<"span">) {
  return <span className={`sr-only ${className ?? ""}`} {...props} />;
}
