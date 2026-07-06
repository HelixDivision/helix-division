"use client";

import { useContext } from "react";

import { ThemeContext } from "@/components/theme-provider";

/**
 * Reads the current theme. Always "dark" today (see theme-provider.tsx) —
 * this hook is the one place that would change if a real per-surface toggle
 * is ever added, so components should call this instead of assuming dark.
 */
export function useTheme() {
  return useContext(ThemeContext);
}
