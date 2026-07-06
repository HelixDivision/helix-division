"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";

// Mirrors DESIGN_SYSTEM.md#responsive-breakpoints (Tailwind defaults).
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/** True once the viewport is at least as wide as the given breakpoint. */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${breakpoints[breakpoint]}px)`);
}
