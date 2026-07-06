"use client";

import { useMemo } from "react";

import { useCartStore } from "@/store/cart-store";

/**
 * Thin wrapper over the cart store — components should import this, not
 * `useCartStore` directly (see PROJECT_RULES.md#state-management). Adds
 * derived values (count, subtotal) so components don't recompute them.
 */
export function useCart() {
  const lines = useCartStore((s) => s.lines);
  const addLine = useCartStore((s) => s.addLine);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const clear = useCartStore((s) => s.clear);

  const count = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.price * l.quantity, 0), [lines]);

  return { lines, count, subtotal, addLine, updateQuantity, removeLine, clear };
}
