"use client";

import { createContext, type ReactNode } from "react";

interface ThemeContextValue {
  theme: "dark";
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "dark" });

/**
 * Helix Division ships one locked dark visual identity — there is no
 * light-mode brand (see DESIGN_SYSTEM.md#color) — so this is a minimal
 * context rather than next-themes: no localStorage detection, no FOUC-
 * prevention script injection, nothing to do at runtime. The context exists
 * so `useTheme()` has a stable shape to extend from if a future surface
 * (e.g. an admin light mode) ever needs real switching.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContext.Provider value={{ theme: "dark" }}>{children}</ThemeContext.Provider>;
}

export { ThemeContext };
