/** Spacing/grid tokens — see DESIGN_SYSTEM.md#spacing--grid. Base unit: 4px. */
export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
  32: "128px",
} as const;

export const grid = {
  containerMaxWidth: "1280px",
  gutter: { mobile: "24px", desktop: "32px" },
  columns: { mobile: 4, desktop: 12 },
  gap: { mobile: "16px", desktop: "24px" },
} as const;

export const radius = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
} as const;
