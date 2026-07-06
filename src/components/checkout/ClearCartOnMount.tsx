"use client";

import { useEffect } from "react";

import { useCart } from "@/hooks/useCart";

/** Fires once the cart store has actually hydrated, so it doesn't clear an empty in-flight snapshot. Renders nothing. */
export function ClearCartOnMount() {
  const { clear, hasHydrated } = useCart();

  useEffect(() => {
    if (hasHydrated) clear();
  }, [hasHydrated, clear]);

  return null;
}
