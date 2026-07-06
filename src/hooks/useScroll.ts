"use client";

import { useEffect, useState } from "react";

interface ScrollState {
  y: number;
  direction: "up" | "down";
}

/**
 * Tracks vertical scroll position + direction — drives header shrink/blur
 * and hide-on-scroll-down behavior (see DESIGN_SYSTEM.md#core-components,
 * Navigation).
 */
export function useScroll(): ScrollState {
  const [state, setState] = useState<ScrollState>({ y: 0, direction: "up" });

  useEffect(() => {
    let lastY = window.scrollY;

    function handleScroll() {
      const y = window.scrollY;
      setState({ y, direction: y > lastY ? "down" : "up" });
      lastY = y;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return state;
}
