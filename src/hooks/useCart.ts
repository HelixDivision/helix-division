"use client";

import { useEffect, useMemo, useState } from "react";

import { useCartStore } from "@/store/cart-store";

/**
 * Thin wrapper over the cart store — components should import this, not
 * `useCartStore` directly (see PROJECT_RULES.md#state-management). Adds
 * derived values (count, subtotal) so components don't recompute them.
 *
 * `hasHydrated` matters because `persist` restores localStorage
 * asynchronously after mount — on first render `lines` is always `[]`, so
 * any logic that treats an empty cart as meaningful (e.g. redirecting away
 * from checkout) must wait for hydration or it fires on every full page
 * load regardless of the cart's real contents.
 */
export function useCart() {
  const lines = useCartStore((s) => s.lines);
  const addLine = useCartStore((s) => s.addLine);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const clear = useCartStore((s) => s.clear);

  // Optional-chained: during server-side rendering of "use client" components
  // (Next.js still renders them once on the server for the initial HTML),
  // the persist middleware's `.persist` API isn't reliably available in that
  // environment — falling back to `true` there is safe since there's no real
  // localStorage-backed cart to wait for outside the browser anyway.
  const [hasHydrated, setHasHydrated] = useState(() => useCartStore.persist?.hasHydrated() ?? true);

  useEffect(() => {
    // Only subscribe here — if hydration already finished by mount time
    // (the common case), the lazy initializer above already captured that;
    // this covers the rarer case where it completes after mount.
    return useCartStore.persist?.onFinishHydration(() => setHasHydrated(true));
  }, []);

  const count = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.price * l.quantity, 0), [lines]);

  return { lines, count, subtotal, addLine, updateQuantity, removeLine, clear, hasHydrated };
}
